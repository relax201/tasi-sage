import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface PriceAlert {
  id: string;
  stock_symbol: string;
  stock_name: string;
  target_price: number;
  alert_type: 'above' | 'below';
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

export const usePriceAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
    } else {
      setAlerts((data || []) as PriceAlert[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const createAlert = async (
    stockSymbol: string, 
    stockName: string, 
    targetPrice: number, 
    alertType: 'above' | 'below'
  ) => {
    if (!user) {
      toast({
        title: 'يجب تسجيل الدخول',
        description: 'يرجى تسجيل الدخول لإنشاء تنبيه',
        variant: 'destructive'
      });
      return false;
    }

    const { error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        stock_symbol: stockSymbol,
        stock_name: stockName,
        target_price: targetPrice,
        alert_type: alertType
      });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء التنبيه',
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'تم إنشاء التنبيه',
      description: `سيتم تنبيهك عندما يصل سعر ${stockName} ${alertType === 'above' ? 'فوق' : 'تحت'} ${targetPrice} ريال`
    });
    
    await fetchAlerts();
    return true;
  };

  const deleteAlert = async (alertId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف التنبيه',
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'تم الحذف',
      description: 'تم حذف التنبيه بنجاح'
    });
    
    await fetchAlerts();
    return true;
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    if (!user) return false;

    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: isActive })
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث التنبيه',
        variant: 'destructive'
      });
      return false;
    }

    await fetchAlerts();
    return true;
  };

  const getAlertsForStock = (stockSymbol: string) => {
    return alerts.filter(a => a.stock_symbol === stockSymbol);
  };

  return {
    alerts,
    loading,
    createAlert,
    deleteAlert,
    toggleAlert,
    getAlertsForStock,
    refetch: fetchAlerts
  };
};
