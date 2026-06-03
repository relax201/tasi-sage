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
  return await response.json();
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

    // Try to get user from the Authorization header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      // Extract JWT from "Bearer xxx"
      const token = authHeader.replace(/^Bearer\s+/i, '');
      try {
        // Use service role to verify the user
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (!userError && user) {
          userId = user.id;
        } else {
          console.error('Auth error:', userError);
        }
      } catch (e) {
        console.error('Auth parse error:', e);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'غير مصرح. سجّل دخول الأول.',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's profile
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_chat_id, telegram_notifications_enabled, full_name, email')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'البروفايل مش موجود' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.telegram_chat_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Telegram مش مربوط. دوس "ربط Telegram" الأول.',
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
      // Log the failure
      await supabase.from('telegram_messages').insert({
        user_id: userId,
        chat_id: profile.telegram_chat_id,
        message_type: 'test',
        message_text: message,
        status: 'failed',
        error_message: result.description || 'Unknown Telegram error',
      });
      return new Response(
        JSON.stringify({ success: false, error: result.description || 'Telegram error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log success
    await supabase.from('telegram_messages').insert({
      user_id: userId,
      chat_id: profile.telegram_chat_id,
      message_type: 'test',
      message_text: message,
      telegram_message_id: result.result?.message_id,
      status: 'sent',
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Test sent!', chat_id: profile.telegram_chat_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telegram-test:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
