import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PortfolioTransaction {
  id: string;
  user_id: string;
  stock_symbol: string;
  stock_name: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price_per_share: number;
  total_amount: number;
  notes: string | null;
  transaction_date: string;
  created_at: string;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  totalShares: number;
  avgBuyPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  transactions: PortfolioTransaction[];
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdingsCount: number;
}

export const usePortfolio = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions((data as PortfolioTransaction[]) || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) fetchTransactions();
  }, [isAuthenticated, fetchTransactions]);

  const addTransaction = async (
    stockSymbol: string,
    stockName: string,
    type: 'buy' | 'sell',
    quantity: number,
    pricePerShare: number,
    notes?: string
  ) => {
    if (!user) return false;
    try {
      const totalAmount = quantity * pricePerShare;
      const { error } = await supabase
        .from('portfolio_transactions')
        .insert({
          user_id: user.id,
          stock_symbol: stockSymbol,
          stock_name: stockName,
          transaction_type: type,
          quantity,
          price_per_share: pricePerShare,
          total_amount: totalAmount,
          notes: notes || null,
        });

      if (error) throw error;
      toast({
        title: type === 'buy' ? 'تم تسجيل الشراء' : 'تم تسجيل البيع',
        description: `${quantity} سهم من ${stockName} بسعر ${pricePerShare} ريال`,
      });
      await fetchTransactions();
      return true;
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تسجيل العملية',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('portfolio_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف العملية بنجاح' });
      await fetchTransactions();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف العملية',
        variant: 'destructive',
      });
    }
  };

  const getHoldings = useCallback(
    (currentPrices: Record<string, number>): PortfolioHolding[] => {
      const holdingsMap: Record<string, { buys: PortfolioTransaction[]; sells: PortfolioTransaction[] }> = {};

      transactions.forEach((t) => {
        if (!holdingsMap[t.stock_symbol]) {
          holdingsMap[t.stock_symbol] = { buys: [], sells: [] };
        }
        if (t.transaction_type === 'buy') {
          holdingsMap[t.stock_symbol].buys.push(t);
        } else {
          holdingsMap[t.stock_symbol].sells.push(t);
        }
      });

      return Object.entries(holdingsMap)
        .map(([symbol, { buys, sells }]) => {
          const totalBought = buys.reduce((sum, t) => sum + t.quantity, 0);
          const totalSold = sells.reduce((sum, t) => sum + t.quantity, 0);
          const totalShares = totalBought - totalSold;

          if (totalShares <= 0) return null;

          const totalInvested = buys.reduce((sum, t) => sum + t.total_amount, 0);
          const totalSoldAmount = sells.reduce((sum, t) => sum + t.total_amount, 0);
          const netInvested = totalInvested - totalSoldAmount;
          const avgBuyPrice = netInvested / totalShares;
          const currentPrice = currentPrices[symbol] || avgBuyPrice;
          const currentValue = totalShares * currentPrice;
          const profitLoss = currentValue - netInvested;
          const profitLossPercent = netInvested > 0 ? (profitLoss / netInvested) * 100 : 0;

          const allTransactions = [...buys, ...sells].sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );

          return {
            symbol,
            name: buys[0]?.stock_name || sells[0]?.stock_name || symbol,
            totalShares,
            avgBuyPrice,
            totalInvested: netInvested,
            currentPrice,
            currentValue,
            profitLoss,
            profitLossPercent,
            transactions: allTransactions,
          };
        })
        .filter(Boolean) as PortfolioHolding[];
    },
    [transactions]
  );

  const getSummary = useCallback(
    (currentPrices: Record<string, number>): PortfolioSummary => {
      const holdings = getHoldings(currentPrices);
      const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
      const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const totalProfitLoss = totalCurrentValue - totalInvested;
      const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

      return {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        holdingsCount: holdings.length,
      };
    },
    [getHoldings]
  );

  return {
    transactions,
    isLoading,
    isAuthenticated,
    addTransaction,
    deleteTransaction,
    getHoldings,
    getSummary,
    refresh: fetchTransactions,
  };
};
