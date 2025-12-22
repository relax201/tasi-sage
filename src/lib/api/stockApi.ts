import { supabase } from '@/integrations/supabase/client';

export interface LiveStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface StockHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AIAnalysis {
  recommendation?: string;
  targetPrice?: number;
  stopLoss?: number;
  confidence?: number;
  reasoning?: string;
  riskLevel?: string;
  timeFrame?: string;
  trend?: string;
  support?: number;
  resistance?: number;
  rsiSignal?: string;
  macdSignal?: string;
  overallSignal?: string;
  analysis?: string;
}

// Fetch all stocks list with real-time data
export const fetchAllStocks = async (): Promise<LiveStock[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stocks-list');
    
    if (error) {
      console.error('Error fetching stocks list:', error);
      throw error;
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch stocks');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch stocks list:', error);
    throw error;
  }
};

// Fetch market indices (TASI, etc.)
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-market-indices');
    
    if (error) {
      console.error('Error fetching market indices:', error);
      throw error;
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch indices');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch market indices:', error);
    throw error;
  }
};

// Fetch single stock data
export const fetchStockData = async (symbol: string, action: string = 'all'): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol, action }
    });

    if (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch stock');
    }

    return data.data;
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    throw error;
  }
};

// Get AI analysis and recommendations
export const getAIAnalysis = async (stockData: any, analysisType: 'recommendation' | 'technical' | 'summary' = 'recommendation'): Promise<AIAnalysis | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-stock-analysis', {
      body: { stockData, analysisType }
    });

    if (error) {
      console.error('Error getting AI analysis:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get analysis');
    }

    return data.analysis;
  } catch (error) {
    console.error('Failed to get AI analysis:', error);
    throw error;
  }
};
