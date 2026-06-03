import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        toast({
          title: 'طلبات كثيرة',
          description: 'انتظر شوية قبل ما تطلب تاني',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive'
        });
      }
    } else {
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-glow"
            whileHover={{ scale: 1.05 }}
          >
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">نسيت كلمة المرور؟</h1>
          <p className="text-muted-foreground">عادي، بنساعدك ترجعها</p>
        </div>

        <Card className="glass-effect border-border">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="w-fit mb-2"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              الرجوع لتسجيل الدخول
            </Button>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
                <h3 className="text-lg font-semibold">تم إرسال الرابط ✉️</h3>
                <p className="text-sm text-muted-foreground">
                  لو الإيميل مسجل عندنا، هيوصلك رابط إعادة التعيين على:
                  <br />
                  <strong className="text-foreground" dir="ltr">{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  ما وصلك؟ تفقد الـ Spam أو ارجع وجرب تاني
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  الرجوع لتسجيل الدخول
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <CardDescription>
                  ادخل الإيميل بتاعك وهنبعتلك رابط تعيد تعيين كلمة المرور
                </CardDescription>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      autoFocus
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  فاكر كلمة المرور؟{' '}
                  <Link to="/auth" className="text-primary hover:underline">
                    سجل دخول
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
