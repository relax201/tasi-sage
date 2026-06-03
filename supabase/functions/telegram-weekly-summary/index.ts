// Telegram Weekly Summary: Sends weekly summary on Thursday at 3:05 PM Saudi time
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatWeeklySummary(stats: any): string {
  const today = new Date().toLocaleDateString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let msg = `📅 *الملخص الأسبوعي - ${today}*\n\n`;
  msg += `📊 *إحصائيات الأسبوع:*\n`;
  msg += `🟢 إجمالي التوصيات: *${stats.totalRecommendations}*\n`;
  msg += `🚨 توصيات "شراء قوي": *${stats.strongBuys}*\n`;
  msg += `🔴 توصيات بيع: *${stats.sells}*\n`;
  msg += `🟡 توصيات احتفاظ: *${stats.holds}*\n\n`;

  if (stats.bestPerformer) {
    msg += `🏆 *أفضل أداء:*\n${stats.bestPerformer.symbol} - ${stats.bestPerformer.name}: +${stats.bestPerformer.change.toFixed(2)}%\n\n`;
  }
  if (stats.worstPerformer) {
    msg += `📉 *أسوأ أداء:*\n${stats.worstPerformer.symbol} - ${stats.worstPerformer.name}: ${stats.worstPerformer.change.toFixed(2)}%\n\n`;
  }

  if (stats.marketIndex) {
    msg += `📊 *مؤشر تاسي:* ${stats.marketIndex.value.toFixed(2)} (${stats.marketIndex.changePercent >= 0 ? '+' : ''}${stats.marketIndex.changePercent.toFixed(2)}%)\n`;
  }

  msg += `\n⏰ ${new Date().toLocaleTimeString('ar-SA', { timeZone: 'Asia/Riyadh' })}\n`;
  msg += `\n📈 أسبوع تداول سعيد! السوق مغلق الجمعة والسبت.`;
  return msg;
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
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Only send on Thursday
    const saudiTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    const day = saudiTime.getDay();
    if (day !== 4) { // 4 = Thursday
      return new Response(
        JSON.stringify({ success: false, reason: 'not_thursday', day }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get this week's data (Sunday to Thursday)
    const now = saudiTime;
    const dayOfWeek = now.getDay(); // 0=Sun, 4=Thu
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    const sundayStr = sunday.toISOString().split('T')[0];
    const weekStart = `${sundayStr}T00:00:00+03:00`;

    // Fetch week's recommendations
    const { data: recs, error: recsError } = await supabase
      .from('recommendations')
      .select('*')
      .gte('created_at', weekStart);

    if (recsError) console.error('Error fetching recs:', recsError);

    const recommendations = recs || [];
    const isStrongBuy = (r: any) => (r.recommendation || '').toLowerCase().includes('قوي') && (r.recommendation || '').toLowerCase().includes('شراء');
    const isSell = (r: any) => (r.recommendation || '').toLowerCase().includes('بيع');
    const isHold = (r: any) => (r.recommendation || '').toLowerCase().includes('احتفاظ');

    const stats = {
      totalRecommendations: recommendations.length,
      strongBuys: recommendations.filter(isStrongBuy).length,
      sells: recommendations.filter(isSell).length,
      holds: recommendations.filter(isHold).length,
      bestPerformer: null as any,
      worstPerformer: null as any,
      marketIndex: null as any,
    };

    // Fetch market data
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
        stats.marketIndex = indicesData?.data?.[0] || null;
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
          stats.bestPerformer = sorted[0];
          stats.worstPerformer = sorted[sorted.length - 1];
        }
      }
    } catch (e) {
      console.error('Error fetching market data:', e);
    }

    const message = formatWeeklySummary(stats);

    // Find users with weekly summary enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, telegram_chat_id')
      .eq('telegram_notifications_enabled', true)
      .eq('telegram_weekly_summary', true)
      .not('telegram_chat_id', 'is', null);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscribers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.allSettled(
      users.map(async (user) => {
        const result = await sendTelegramMessage(BOT_TOKEN, user.telegram_chat_id, message);
        await supabase.from('telegram_messages').insert({
          user_id: user.user_id,
          chat_id: user.telegram_chat_id,
          message_type: 'weekly_summary',
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
    console.error('Error in telegram-weekly-summary:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
