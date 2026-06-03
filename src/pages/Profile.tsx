import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Calendar, Save, Loader2, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { TelegramSettingsDialog } from '@/components/user/TelegramSettingsDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const nameSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
});

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdAt, setCreatedAt] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFullName(data.full_name || '');
      setCreatedAt(user.created_at || '');
    } catch (err: any) {
      console.error('Error loading profile:', err);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل البروفايل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setErrors({});
    const result = nameSchema.safeParse({ fullName });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user!.id);
      if (profileError) throw profileError;

      // Also update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      });
      if (userError) throw userError;

      toast({
        title: '✅ تم الحفظ',
        description: 'تم تحديث الاسم بنجاح',
      });
      setEditing(false);
      await loadProfile();
    } catch (err: any) {
      console.error('Error saving:', err);
      toast({
        title: 'خطأ',
        description: err.message || 'فشل الحفظ',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !user) return null;

  const initials = (profile.full_name || user.email || '?')
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gradient-primary">الملف الشخصي</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            العودة
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="glass-effect mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{profile.full_name || 'مستخدم'}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Name */}
        <Card className="glass-effect mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  المعلومات الأساسية
                </CardTitle>
                <CardDescription>عدّل اسمك الكامل</CardDescription>
              </div>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editing}
                dir="auto"
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                dir="ltr"
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                لتغيير الإيميل، تواصل مع الدعم
              </p>
            </div>

            {editing && (
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ التغييرات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.full_name || '');
                    setErrors({});
                  }}
                  disabled={saving}
                >
                  إلغاء
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="glass-effect mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ التسجيل</span>
              <span dir="ltr">{new Date(createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">آخر تحديث</span>
              <span dir="ltr">{new Date(profile.updated_at).toLocaleString('ar-SA')}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">حالة الإشعارات</span>
              <span>
                {profile.telegram_notifications_enabled ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> مفعّلة
                  </span>
                ) : (
                  <span className="text-muted-foreground">غير مفعّلة</span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Settings Card */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>إشعارات Telegram</CardTitle>
            <CardDescription>استقبل توصيات وملخصات السوق على Telegram</CardDescription>
          </CardHeader>
          <CardContent>
            <TelegramSettingsDialog />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
