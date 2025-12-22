import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, TrendingUp, TrendingDown, AlertTriangle, Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'price_up' | 'price_down' | 'alert' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  symbol?: string;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'price_up',
    title: 'ارتفاع سابك',
    message: 'ارتفع سهم سابك بنسبة 2.63% ليصل إلى 89.70 ريال',
    time: 'منذ 5 دقائق',
    read: false,
    symbol: '2010'
  },
  {
    id: '2',
    type: 'price_down',
    title: 'انخفاض البحري',
    message: 'انخفض سهم البحري بنسبة 3.26% ليصل إلى 35.60 ريال',
    time: 'منذ 15 دقيقة',
    read: false,
    symbol: '4030'
  },
  {
    id: '3',
    type: 'alert',
    title: 'تنبيه مهم',
    message: 'سهم كيان وصل إلى مستوى المقاومة عند 12.60 ريال',
    time: 'منذ 30 دقيقة',
    read: false,
    symbol: '2350'
  },
  {
    id: '4',
    type: 'info',
    title: 'توصية جديدة',
    message: 'توصية شراء قوي على سهم معادن بناءً على التحليل الفني',
    time: 'منذ ساعة',
    read: true,
    symbol: '1211'
  },
  {
    id: '5',
    type: 'price_up',
    title: 'ارتفاع الراجحي',
    message: 'ارتفع سهم الراجحي بنسبة 1.27% ليصل إلى 95.50 ريال',
    time: 'منذ ساعتين',
    read: true,
    symbol: '1120'
  },
];

export const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'price_up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'price_down':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -left-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="w-3 h-3 ml-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "p-3 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "font-medium text-sm truncate",
                          !notification.read && "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
