import { useState } from 'react';
import { Settings, Moon, Sun, Bell, Volume2, Globe, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export const SettingsPanel = () => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('60');

  const handleSaveSettings = () => {
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-right">الإعدادات</SheetTitle>
          <SheetDescription className="text-right">
            تخصيص تجربة استخدام التطبيق
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Palette className="w-4 h-4" />
              <span>المظهر</span>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme" className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                الوضع الليلي
              </Label>
              <Switch
                id="theme"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bell className="w-4 h-4" />
              <span>الإشعارات</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">تفعيل الإشعارات</Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="priceAlerts">تنبيهات الأسعار</Label>
                <Switch
                  id="priceAlerts"
                  checked={priceAlerts}
                  onCheckedChange={setPriceAlerts}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sounds" className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  الأصوات
                </Label>
                <Switch
                  id="sounds"
                  checked={sounds}
                  onCheckedChange={setSounds}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Refresh */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="w-4 h-4" />
              <span>تحديث البيانات</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRefresh">التحديث التلقائي</Label>
                <Switch
                  id="autoRefresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="refreshInterval">فترة التحديث</Label>
                <Select
                  value={refreshInterval}
                  onValueChange={setRefreshInterval}
                  disabled={!autoRefresh}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 ثانية</SelectItem>
                    <SelectItem value="60">دقيقة</SelectItem>
                    <SelectItem value="300">5 دقائق</SelectItem>
                    <SelectItem value="600">10 دقائق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <Button onClick={handleSaveSettings} className="w-full">
            حفظ الإعدادات
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
