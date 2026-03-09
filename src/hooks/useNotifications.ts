import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePriceAlerts } from './usePriceAlerts';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  type: 'price_up' | 'price_down' | 'alert' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  symbol?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { alerts } = usePriceAlerts();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage or initial state
  useEffect(() => {
    const saved = localStorage.getItem(`notifications_${user?.id || 'guest'}`);
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      // Initial dummy data if nothing saved
      const initial: Notification[] = [
        {
          id: 'initial-1',
          type: 'info',
          title: 'مرحباً بك في تاسي تحليل',
          message: 'ابدأ بإضافة الأسهم للمفضلة وإنشاء تنبيهات للأسعار.',
          time: 'الآن',
          read: false
        }
      ];
      setNotifications(initial);
    }
  }, [user?.id]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`notifications_${user?.id || 'guest'}`, JSON.stringify(notifications));
  }, [notifications, user?.id]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      time: 'الآن',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Also show a toast for immediate feedback
    toast({
      title: newNotification.title,
      description: newNotification.message,
    });
  }, [toast]);

  // Track already-notified speculative opportunities to avoid duplicates
  const [notifiedOpportunities, setNotifiedOpportunities] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`notified_spec_${user?.id || 'guest'}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(`notified_spec_${user?.id || 'guest'}`, JSON.stringify([...notifiedOpportunities]));
  }, [notifiedOpportunities, user?.id]);

  // Function to check alerts against current prices + speculative opportunities
  const checkAlertsAgainstPrices = useCallback(async (currentStocks: any[]) => {
    if (!currentStocks?.length) return;

    // === إشعارات فرص المضاربة القوية ===
    const avgVolume = 2000000;
    for (const stock of currentStocks) {
      const isStrongEntry = stock.changePercent > 3 && (stock.volume || 0) > 3000000;
      const key = `${stock.symbol}_${new Date().toDateString()}`;

      if (isStrongEntry && !notifiedOpportunities.has(key)) {
        setNotifiedOpportunities(prev => new Set(prev).add(key));
        addNotification({
          type: 'price_up',
          title: `🔥 فرصة مضاربة: ${stock.name}`,
          message: `دخول قوي! السهم ارتفع ${stock.changePercent.toFixed(2)}% بحجم تداول ${(stock.volume / 1000000).toFixed(1)}M`,
          symbol: stock.symbol
        });
      }
    }

    // === تنبيهات الأسعار المحددة من المستخدم ===
    if (!user || !alerts.length) return;

    for (const alert of alerts) {
      if (!alert.is_active || alert.is_triggered) continue;

      const stock = currentStocks.find((s: any) => s.symbol === alert.stock_symbol);
      if (!stock) continue;

      const isTriggered = alert.alert_type === 'above' 
        ? stock.price >= alert.target_price 
        : stock.price <= alert.target_price;

      if (isTriggered) {
        const { error } = await supabase
          .from('price_alerts')
          .update({ is_triggered: true, triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        if (!error) {
          addNotification({
            type: alert.alert_type === 'above' ? 'price_up' : 'price_down',
            title: `تنبيه سعر: ${alert.stock_name}`,
            message: `وصل سعر ${alert.stock_name} إلى الهدف المحدد: ${alert.target_price} ريال (السعر الحالي: ${stock.price})`,
            symbol: alert.stock_symbol
          });
        }
      }
    }
  }, [user, alerts, addNotification, notifiedOpportunities]);

  // Listen for changes in price_alerts table (Realtime)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'price_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedAlert = payload.new;
          const oldAlert = payload.old;
          // If the alert was just triggered and we haven't notified yet
          if (updatedAlert.is_triggered && (!oldAlert || !oldAlert.is_triggered)) {
            addNotification({
              type: updatedAlert.alert_type === 'above' ? 'price_up' : 'price_down',
              title: `تنبيه سعر: ${updatedAlert.stock_name}`,
              message: `وصل سعر ${updatedAlert.stock_name} إلى الهدف المحدد: ${updatedAlert.target_price} ريال`,
              symbol: updatedAlert.stock_symbol
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

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

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    checkAlertsAgainstPrices
  };
};
