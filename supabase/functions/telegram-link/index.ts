// Telegram Link: Webhook for the bot, handles /start commands and links chat_id to users
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const update = await req.json();

    // Handle /start command with token
    if (update.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text;
      const parts = text.split(' ');
      const token = parts[1]; // e.g., "/start tg_abc123"

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      if (token && token.startsWith('tg_')) {
        // Link the chat_id to the user with this token
        const { data: profile, error } = await supabase
          .from('profiles')
          .update({
            telegram_chat_id: chatId,
            telegram_notifications_enabled: true,
            telegram_linked_at: new Date().toISOString(),
          })
          .eq('telegram_link_token', token)
          .select('email, full_name')
          .single();

        if (error || !profile) {
          await sendTelegramMessage(
            BOT_TOKEN,
            chatId,
            '❌ *فشل الربط*\n\nالـ token غير صالح أو انتهت صلاحيته. حاول مرة تانية من الموقع.'
          );
        } else {
          await sendTelegramMessage(
            BOT_TOKEN,
            chatId,
            `✅ *تم الربط بنجاح!*\n\nأهلاً ${profile.full_name || profile.email} 👋\n\nدلوقتي هتستلم:\n🚨 تنبيهات فورية لتوصيات "شراء قوي"\n📊 ملخص يومي بعد إغلاق السوق\n📅 ملخص أسبوعي\n\n⚠️ الإشعارات هتتبعت في أوقات جلسات التداول فقط (أحد-خميس، 10ص-3م بتوقيت السعودية).`
          );
        }
      } else {
        // No token, just /start
        await sendTelegramMessage(
          BOT_TOKEN,
          chatId,
          `👋 *أهلاً بيك في Tasi Sage Bot!*\n\nعشان تربط حسابك بالموقع:\n1. ادخل على reem2025.com\n2. روح على بروفايلك\n3. دوس "🔔 Connect Telegram"\n\nالبوت هيبعتلك الرسائل تلقائياً بعد الربط.`
        );
      }
    }

    // Handle /unlink command
    else if (update.message?.text === '/unlink') {
      const chatId = update.message.chat.id.toString();
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      await supabase
        .from('profiles')
        .update({
          telegram_chat_id: null,
          telegram_notifications_enabled: false,
        })
        .eq('telegram_chat_id', chatId);

      await sendTelegramMessage(
        BOT_TOKEN,
        chatId,
        '✅ *تم إلغاء الربط*\n\nمش هتستلم أي إشعارات تاني. لو عايز تربط تاني، ادخل على الموقع.'
      );
    }

    // Handle /status command
    else if (update.message?.text === '/status') {
      const chatId = update.message.chat.id.toString();
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, telegram_notifications_enabled, telegram_strong_buy_alerts, telegram_daily_summary, telegram_weekly_summary')
        .eq('telegram_chat_id', chatId)
        .single();

      if (profile) {
        const status = `📊 *حالة الإشعارات*

📧 الحساب: ${profile.email}
🔔 مفعّل: ${profile.telegram_notifications_enabled ? 'نعم ✅' : 'لا ❌'}
🚨 شراء قوي: ${profile.telegram_strong_buy_alerts ? '✅' : '❌'}
📊 ملخص يومي: ${profile.telegram_daily_summary ? '✅' : '❌'}
📅 ملخص أسبوعي: ${profile.telegram_weekly_summary ? '✅' : '❌'}

غيّر الإعدادات من reem2025.com`;
        await sendTelegramMessage(BOT_TOKEN, chatId, status);
      } else {
        await sendTelegramMessage(BOT_TOKEN, chatId, '❌ مفيش حساب مربوط. ادخل على reem2025.com وابدأ الربط.');
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in telegram-link:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
