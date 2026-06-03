import { useState, useEffect } from 'react';
import { Bell, ExternalLink, Check, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BOT_USERNAME = 'tasi_sage_alerts_bot';

interface TelegramSettings {
  telegram_chat_id: string | null;
  telegram_notifications_enabled: boolean;
  telegram_strong_buy_alerts: boolean;
  telegram_daily_summary: boolean;
  telegram_weekly_summary: boolean;
  telegram_linked_at: string | null;
}

function generateToken(): string {
  return 'tg_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export const TelegramSettingsDialog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  // Load settings when dialog opens
  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('telegram_chat_id, telegram_notifications_enabled, telegram_strong_buy_alerts, telegram_daily_summary, telegram_weekly_summary, telegram_linked_at')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading telegram settings:', err);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل إعدادات Telegram',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Generate a unique token
      const token = generateToken();

      // Save the token to the profile
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_link_token: token })
        .eq('user_id', user.id);

      if (error) throw error;

      // Build the deep link
      const link = `https://t.me/${BOT_USERNAME}?start=${token}`;
      setDeepLink(link);

      // Open Telegram
      window.open(link, '_blank');

      toast({
        title: '✅ تم إنشاء رابط الربط',
        description: 'افتح Telegram واضغط Start على البوت',
      });
    } catch (err: any) {
      console.error('Error generating link:', err);
      toast({
        title: 'خطأ',
        description: err.message || 'فشل إنشاء رابط الربط',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key: keyof TelegramSettings, value: boolean) => {
    if (!user || !settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, [key]: value });
    } catch (err: any) {
      console.error('Error updating setting:', err);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الإعداد',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-test');
      if (error) throw error;
      if (data?.success) {
        toast({
          title: '✅ تم إرسال رسالة تجريبية',
          description: 'شوف Telegram بتاعك',
        });
      } else {
        throw new Error(data?.error || 'فشل إرسال الرسالة');
      }
    } catch (err: any) {
      console.error('Error sending test:', err);
      toast({
        title: 'خطأ',
        description: err.message || 'فشل إرسال الرسالة التجريبية',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !settings) return;
    if (!confirm('هل أنت متأكد من إلغاء ربط Telegram؟')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_chat_id: null,
          telegram_notifications_enabled: false,
          telegram_link_token: null,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      await loadSettings();
      setDeepLink(null);
      toast({
        title: '✅ تم إلغاء الربط',
        description: 'مش هتستلم إشعارات تاني',
      });
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      toast({
        title: 'خطأ',
        description: 'فشل إلغاء الربط',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Refresh settings when dialog opens (in case the user linked from Telegram)
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadSettings();
    }
  };

  if (!user) return null;

  const isLinked = !!settings?.telegram_chat_id;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
          <Bell className="w-4 h-4" />
          <span>إعدادات Telegram</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            إعدادات Telegram
          </DialogTitle>
          <DialogDescription>
            استقبل توصيات وملخصات السوق على Telegram
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : settings ? (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className={`p-3 rounded-lg border ${isLinked ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <div className="flex items-center gap-2">
                {isLinked ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">مربوط ✅</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">غير مربوط</span>
                  </>
                )}
              </div>
              {isLinked && (
                <p className="text-xs text-muted-foreground mt-1">
                  Chat ID: {settings.telegram_chat_id}
                </p>
              )}
            </div>

            {/* Connect button or status */}
            {!isLinked && (
              <div className="space-y-2">
                <Button
                  onClick={handleConnect}
                  disabled={saving}
                  className="w-full gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  ربط Telegram
                </Button>
                {deepLink && (
                  <p className="text-xs text-muted-foreground text-center">
                    لو مش اتفتح تلقائياً:{' '}
                    <a href={deepLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      افتح هنا
                    </a>
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  بعد ما تفتح البوت، اضغط <strong>Start</strong>، ارجع هنا واضغط "تحديث"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSettings}
                  className="w-full mt-2"
                >
                  تحديث الحالة
                </Button>
              </div>
            )}

            {/* Notification Settings */}
            {isLinked && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-sm font-medium">أنواع الإشعارات</p>

                <div className="flex items-center justify-between">
                  <Label htmlFor="strong-buy" className="text-sm cursor-pointer">
                    🚨 توصيات "شراء قوي"
                  </Label>
                  <Switch
                    id="strong-buy"
                    checked={settings.telegram_strong_buy_alerts}
                    onCheckedChange={(checked) => handleToggle('telegram_strong_buy_alerts', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="daily" className="text-sm cursor-pointer">
                    📊 ملخص يومي
                  </Label>
                  <Switch
                    id="daily"
                    checked={settings.telegram_daily_summary}
                    onCheckedChange={(checked) => handleToggle('telegram_daily_summary', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly" className="text-sm cursor-pointer">
                    📅 ملخص أسبوعي
                  </Label>
                  <Switch
                    id="weekly"
                    checked={settings.telegram_weekly_summary}
                    onCheckedChange={(checked) => handleToggle('telegram_weekly_summary', checked)}
                    disabled={saving}
                  />
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  ⏰ الإشعارات هتتبعت في أوقات جلسات التداول فقط (أحد-خميس، 10ص-3م بتوقيت السعودية)
                </p>
              </div>
            )}

            {/* Actions */}
            {isLinked && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={handleSendTest}
                  disabled={sending}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  رسالة تجريبية
                </Button>
                <Button
                  onClick={handleDisconnect}
                  disabled={saving}
                  variant="destructive"
                  className="flex-1"
                >
                  إلغاء الربط
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
