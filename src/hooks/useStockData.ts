import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchStockData, getAIAnalysis, parseQuoteResponse, parseDailyData, AIAnalysis } from '@/lib/api/stockApi';
import { Stock } from '@/data/stocksData';
import { useToast } from '@/hooks/use-toast';

export const useStockQuote = (symbol: string) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['stockQuote', symbol],
    queryFn: async () => {
      const response = await fetchStockData(symbol, 'quote');
      if (response.error) {
        throw new Error(response.error);
      }
      return parseQuoteResponse(response.data);
    },
    staleTime: 60000, // 1 minute
    retry: 1,
    meta: {
      onError: (error: Error) => {
        toast({
          title: 'خطأ في جلب البيانات',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  });
};

export const useStockHistory = (symbol: string) => {
  return useQuery({
    queryKey: ['stockHistory', symbol],
    queryFn: async () => {
      const response = await fetchStockData(symbol, 'daily');
      if (response.error) {
        throw new Error(response.error);
      }
      return parseDailyData(response.data);
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
  });
};

export const useAIAnalysis = (stock: Stock) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = async (type: 'recommendation' | 'technical' = 'recommendation') => {
    setIsLoading(true);
    try {
      const response = await getAIAnalysis(stock, type);
      if (response.error) {
        toast({
          title: 'خطأ في التحليل',
          description: response.error,
          variant: 'destructive',
        });
        return null;
      }
      setAnalysis(response.analysis);
      return response.analysis;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في الحصول على تحليل الذكاء الاصطناعي',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysis,
    isLoading,
    fetchAnalysis,
  };
};

export const useRefreshStockData = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async (symbol: string) => {
    setIsRefreshing(true);
    try {
      const response = await fetchStockData(symbol, 'quote');
      if (response.error) {
        throw new Error(response.error);
      }
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات السهم بنجاح',
      });
      return parseQuoteResponse(response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ في التحديث',
        description: error.message || 'فشل تحديث البيانات',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
};
