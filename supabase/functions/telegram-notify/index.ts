// Telegram Notify: Sends strong-buy alerts to subscribed users during trading hours
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Saudi Tadawul trading hours: Sun-Thu (0-4 in JS) 10:00-15:00 Saudi time (UTC+3)
function isWithinTradingHours(): { isOpen: boolean; reason: string } {
  // Get current time in Saudi timezone (UTC+3)
  const now = new Date();
  const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  const day = saudiTime.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hour = saudiTime.getHours();

  // Friday (5) and Saturday (6) are weekend
  if (day === 5 || day === 6) {
    return { isOpen: false, reason: 'weekend' };
  }

  // Trading hours: 10:00 - 15:00
  if (hour < 10 || hour >= 15) {
    return { isOpen: false, reason: 'outside_trading_hours' };
  }

  return { isOpen: true, reason: 'trading_hours' };
}

function formatRecommendationMessage(rec: any): string {
  const changeEmoji = rec.changePercent >= 0 ? '🟢' : '🔴';
  const changeText = rec.changePercent >= 0 ? `+${rec.changePercent.toFixed(2)}%` : `${rec.changePercent.toFixed(2)}%`;

  return `🚨 *توصية جديدة: شراء قوي*

📊 *${rec.stock_name || rec.symbol}* (${rec.symbol})
💰 السعر: ${rec.price?.toFixed(2)} ر.س ${changeEmoji} ${changeText}
🎯 الهدف: ${rec.target_price?.toFixed(2)} ر.س
🛑 وقف الخسارة: ${rec.stop_loss?.toFixed(2) || '—'} ر.س
📈 الثقة: ${rec.confidence || 70}%

${rec.reasoning ? `\n💡 ${rec.reasoning}\n` : ''}
⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}`;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
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

    // Check trading hours
    const tradingStatus = isWithinTradingHours();
    if (!tradingStatus.isOpen) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: 'outside_trading_hours',
          message: `Skipped: ${tradingStatus.reason}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const body = await req.json();
    const recommendation = body.recommendation || body;

    if (!recommendation.symbol) {
      throw new Error('Missing recommendation data (symbol required)');
    }

    // Check if it's a strong buy
    const recommendationText = (recommendation.recommendation || '').toLowerCase();
    const isStrongBuy = recommendationText.includes('قوي') && recommendationText.includes('شراء');

    if (!isStrongBuy && !body.force) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: 'not_strong_buy',
          message: 'Only strong-buy alerts are sent',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find users who want strong-buy alerts
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, telegram_chat_id')
      .eq('telegram_notifications_enabled', true)
      .eq('telegram_strong_buy_alerts', true)
      .not('telegram_chat_id', 'is', null);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscribers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the message
    const message = formatRecommendationMessage(recommendation);

    // Send to all subscribers
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const result = await sendTelegramMessage(BOT_TOKEN, user.telegram_chat_id, message);
        // Log the message
        await supabase.from('telegram_messages').insert({
          user_id: user.user_id,
          chat_id: user.telegram_chat_id,
          message_type: 'strong_buy_alert',
          message_text: message,
          telegram_message_id: result?.result?.message_id,
          status: result.ok ? 'sent' : 'failed',
          error_message: result.ok ? null : result.description,
        });
        return { chat_id: user.telegram_chat_id, success: result.ok, error: result.description };
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: users.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telegram-notify:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
