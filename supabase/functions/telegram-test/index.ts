// Telegram Test: Send a test message to verify the bot is working
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

    // Get the authenticated user from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get the user's telegram_chat_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_notifications_enabled, full_name, email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    if (!profile.telegram_chat_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Telegram not linked. Click "Connect Telegram" first.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = `🧪 *رسالة تجريبية من Tasi Sage!*

أهلاً ${profile.full_name || profile.email} 👋

✅ حسابك مربوط بنجاح بالـ bot
📱 هيوصلك كل التوصيات المهمة هنا

الإعدادات الحالية:
🚨 شراء قوي: ${profile.telegram_notifications_enabled ? '✅' : '❌'}

⏰ ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}`;

    const result = await sendTelegramMessage(BOT_TOKEN, profile.telegram_chat_id, message);

    if (!result.ok) {
      return new Response(
        JSON.stringify({ success: false, error: result.description }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log
    await supabase.from('telegram_messages').insert({
      user_id: user.id,
      chat_id: profile.telegram_chat_id,
      message_type: 'test',
      message_text: message,
      telegram_message_id: result.result?.message_id,
      status: 'sent',
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Test sent!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telegram-test:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
