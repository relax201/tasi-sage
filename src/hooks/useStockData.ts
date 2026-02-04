import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchStockData, 
  fetchAllStocks, 
  fetchMarketIndices, 
  getAIAnalysis,
  type LiveStock, 
  type MarketIndex,
  type AIAnalysis 
} from '@/lib/api/stockApi';
import { useToast } from '@/hooks/use-toast';

// Hook to fetch all stocks
export const useAllStocks = () => {
  return useQuery({
    queryKey: ['allStocks'],
    queryFn: fetchAllStocks,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto refresh every minute
    retry: 2,
  });
};

// Hook to fetch market indices
export const useMarketIndices = () => {
  return useQuery({
    queryKey: ['marketIndices'],
    queryFn: fetchMarketIndices,
    staleTime: 60000,
    refetchInterval: 60000,
    retry: 2,
  });
};

// Hook to fetch single stock data
export const useStockData = (symbol: string) => {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockData(symbol, 'all'),
    staleTime: 30000, // 30 seconds
    enabled: !!symbol,
    retry: 2,
  });
};

// Hook for AI analysis
export const useAIAnalysis = (stockData: LiveStock | null) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = useCallback(async (type: 'recommendation' | 'technical' = 'recommendation') => {
    if (!stockData) return null;
    
    setIsLoading(true);
    try {
      const result = await getAIAnalysis(stockData, type);
      setAnalysis(result);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في الحصول على تحليل الذكاء الاصطناعي';
      toast({
        title: 'خطأ في التحليل',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [stockData, toast]);

  return {
    analysis,
    isLoading,
    fetchAnalysis,
  };
};

// Hook to refresh stock data manually
export const useRefreshStock = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async (symbol: string) => {
    setIsRefreshing(true);
    try {
      const data = await fetchStockData(symbol, 'all');
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات السهم بنجاح',
      });
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'فشل تحديث البيانات';
      toast({
        title: 'خطأ في التحديث',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
};
