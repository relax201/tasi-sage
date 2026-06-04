// Telegram Notify: Sends buy + strong-buy alerts to subscribed users during trading hours
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Saudi Tadawul trading hours: Sun-Thu (0-4 in JS) 10:00-15:00 Saudi time (UTC+3)
function isWithinTradingHours(): { isOpen: boolean; reason: string } {
  const now = new Date();
  const saudiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
  const day = saudiTime.getDay();
  const hour = saudiTime.getHours();

  if (day === 5 || day === 6) {
    return { isOpen: false, reason: 'weekend' };
  }
  if (hour < 10 || hour >= 15) {
    return { isOpen: false, reason: 'outside_trading_hours' };
  }
  return { isOpen: true, reason: 'trading_hours' };
}

// Determine recommendation strength
type RecType = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' | 'unknown';

function classifyRecommendation(recText: string): RecType {
  const text = (recText || '').toLowerCase();
  const isStrong = text.includes('قوي');
  if (text.includes('شراء')) {
    return isStrong ? 'strong_buy' : 'buy';
  }
  if (text.includes('بيع')) {
    return isStrong ? 'strong_sell' : 'sell';
  }
  if (text.includes('احتفاظ')) return 'hold';
  return 'unknown';
}

function formatBuyMessage(rec: any, recType: RecType): string {
  const changeEmoji = rec.changePercent >= 0 ? '🟢' : '🔴';
  const changeText = rec.changePercent >= 0
    ? `+${rec.changePercent.toFixed(2)}%`
    : `${rec.changePercent.toFixed(2)}%`;

  const isStrong = recType === 'strong_buy';
  const header = isStrong
    ? '🚨 *توصية جديدة: شراء قوي*'
    : '📊 *توصية جديدة: شراء*';

  return `${header}

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

    // Parse the request body first (we may need `body.force` for testing)
    const body = await req.json();
    const recommendation = body.recommendation || body;

    // Check trading hours
    const tradingStatus = isWithinTradingHours();
    if (!tradingStatus.isOpen && !body.force) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: 'outside_trading_hours',
          message: `Skipped: ${tradingStatus.reason}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recommendation.symbol) {
      throw new Error('Missing recommendation data (symbol required)');
    }

    // Classify the recommendation
    const recType = classifyRecommendation(recommendation.recommendation || '');
    const isBuyType = recType === 'strong_buy' || recType === 'buy';

    if (!isBuyType && !body.force) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: 'not_buy_recommendation',
          message: 'Only buy/strong-buy alerts are sent',
          recommendation_type: recType,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pick the right preference column based on the recommendation type
    const prefColumn = recType === 'strong_buy'
      ? 'telegram_strong_buy_alerts'
      : 'telegram_buy_alerts';

    // Find users who want this type of buy alert
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, telegram_chat_id')
      .eq('telegram_notifications_enabled', true)
      .eq(prefColumn, true)
      .not('telegram_chat_id', 'is', null);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: 'No subscribers for this alert type',
          recommendation_type: recType,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the message
    const message = formatBuyMessage(recommendation, recType);

    // Send to all matching subscribers
    const messageType = recType === 'strong_buy' ? 'strong_buy_alert' : 'buy_alert';
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const result = await sendTelegramMessage(BOT_TOKEN, user.telegram_chat_id, message);
        // Log the message
        await supabase.from('telegram_messages').insert({
          user_id: user.user_id,
          chat_id: user.telegram_chat_id,
          message_type: messageType,
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
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: users.length,
        recommendation_type: recType,
        preference_used: prefColumn,
      }),
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
