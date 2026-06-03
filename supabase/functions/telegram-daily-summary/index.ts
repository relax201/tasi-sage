// Telegram Daily Summary: Sends daily summary to subscribers at 3:05 PM Saudi time
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSaudiToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }); // YYYY-MM-DD
}

function formatDailySummary(stats: any): string {
  const today = new Date().toLocaleDateString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `📊 *ملخص اليوم - ${today}*

${stats.recommendationsCount > 0 ? `🟢 توصيات اليوم: *${stats.recommendationsCount}*\n` : '📭 مفيش توصيات جديدة اليوم\n'}

${stats.strongBuys > 0 ? `🚨 منها "شراء قوي": *${stats.strongBuys}*\n` : ''}
${stats.sells > 0 ? `🔴 توصيات بيع: *${stats.sells}*\n` : ''}

${stats.topGainer ? `\n📈 *أكثر ارتفاعاً:*\n${stats.topGainer.symbol} (${stats.topGainer.name}): +${stats.topGainer.change.toFixed(2)}%` : ''}
${stats.topLoser ? `\n📉 *أكثر انخفاضاً:*\n${stats.topLoser.symbol} (${stats.topLoser.name}): ${stats.topLoser.change.toFixed(2)}%` : ''}

${stats.marketIndex ? `\n📊 *مؤشر تاسي:* ${stats.marketIndex.value.toFixed(2)} (${stats.marketIndex.change >= 0 ? '+' : ''}${stats.marketIndex.change.toFixed(2)} / ${stats.marketIndex.changePercent >= 0 ? '+' : ''}${stats.marketIndex.changePercent.toFixed(2)}%)` : ''}

⏰ ${new Date().toLocaleTimeString('ar-SA', { timeZone: 'Asia/Riyadh' })}`;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!BOT_TOKEN) {
      throw new Response(
        JSON.stringify({ success: false, error: 'TELEGRAM_BOT_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check it's within trading day window (3 PM - midnight Saudi time, or just any time after 3 PM on Sun-Thu)
    const saudiTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    const day = saudiTime.getDay();
    if (day === 5 || day === 6) {
      return new Response(
        JSON.stringify({ success: false, reason: 'weekend' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's date in Saudi time
    const today = getSaudiToday();
    const todayStart = `${today}T00:00:00+03:00`;
    const todayEnd = `${today}T23:59:59+03:00`;

    // Fetch today's recommendations
    const { data: recs, error: recsError } = await supabase
      .from('recommendations') // adjust table name if different
      .select('*')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    if (recsError) {
      console.error('Error fetching recommendations:', recsError);
    }

    // Build stats
    const recommendations = recs || [];
    const strongBuys = recommendations.filter((r: any) =>
      (r.recommendation || '').toLowerCase().includes('قوي') &&
      (r.recommendation || '').toLowerCase().includes('شراء')
    ).length;
    const sells = recommendations.filter((r: any) =>
      (r.recommendation || '').toLowerCase().includes('بيع')
    ).length;

    // Try to get market data
    let marketIndex: any = null;
    let topGainer: any = null;
    let topLoser: any = null;
    try {
      const indicesRes = await fetch(`${SUPABASE_URL}/functions/v1/fetch-market-indices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (indicesRes.ok) {
        const indicesData = await indicesRes.json();
        marketIndex = indicesData?.data?.[0] || null;
      }

      const stocksRes = await fetch(`${SUPABASE_URL}/functions/v1/fetch-stocks-list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (stocksRes.ok) {
        const stocksData = await stocksRes.json();
        const stocks = stocksData?.data || [];
        if (stocks.length > 0) {
          const sorted = [...stocks].sort((a: any, b: any) => b.changePercent - a.changePercent);
          topGainer = sorted[0];
          topLoser = sorted[sorted.length - 1];
        }
      }
    } catch (e) {
      console.error('Error fetching market data:', e);
    }

    const stats = {
      recommendationsCount: recommendations.length,
      strongBuys,
      sells,
      topGainer,
      topLoser,
      marketIndex,
    };

    const message = formatDailySummary(stats);

    // Find users with daily summary enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, telegram_chat_id')
      .eq('telegram_notifications_enabled', true)
      .eq('telegram_daily_summary', true)
      .not('telegram_chat_id', 'is', null);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscribers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to all
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const result = await sendTelegramMessage(BOT_TOKEN, user.telegram_chat_id, message);
        await supabase.from('telegram_messages').insert({
          user_id: user.user_id,
          chat_id: user.telegram_chat_id,
          message_type: 'daily_summary',
          message_text: message,
          telegram_message_id: result?.result?.message_id,
          status: result.ok ? 'sent' : 'failed',
          error_message: result.ok ? null : result.description,
        });
        return { chat_id: user.telegram_chat_id, success: result.ok };
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    return new Response(
      JSON.stringify({ success: true, sent, total: users.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telegram-daily-summary:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
