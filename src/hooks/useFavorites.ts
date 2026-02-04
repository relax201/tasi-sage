import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Favorite {
  id: string;
  stock_symbol: string;
  stock_name: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (stockSymbol: string, stockName: string) => {
    if (!user) {
      toast({
        title: 'يجب تسجيل الدخول',
        description: 'يرجى تسجيل الدخول لإضافة الأسهم للمفضلة',
        variant: 'destructive'
      });
      return false;
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        stock_symbol: stockSymbol,
        stock_name: stockName
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'موجود مسبقاً',
          description: 'هذا السهم موجود في قائمة المفضلة',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في إضافة السهم للمفضلة',
          variant: 'destructive'
        });
      }
      return false;
    }

    toast({
      title: 'تمت الإضافة',
      description: 'تم إضافة السهم للمفضلة بنجاح'
    });
    
    await fetchFavorites();
    return true;
  };

  const removeFavorite = async (stockSymbol: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('stock_symbol', stockSymbol);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إزالة السهم من المفضلة',
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'تمت الإزالة',
      description: 'تم إزالة السهم من المفضلة'
    });
    
    await fetchFavorites();
    return true;
  };

  const isFavorite = (stockSymbol: string) => {
    return favorites.some(f => f.stock_symbol === stockSymbol);
  };

  const toggleFavorite = async (stockSymbol: string, stockName: string) => {
    if (isFavorite(stockSymbol)) {
      return removeFavorite(stockSymbol);
    } else {
      return addFavorite(stockSymbol, stockName);
    }
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
};
