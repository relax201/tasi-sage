import { supabase } from '@/integrations/supabase/client';
import { Stock } from '@/data/stocksData';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
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

// Fetch live stock data
export const fetchStockData = async (symbol: string, action: string = 'quote') => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-stock-data', {
      body: { symbol, action }
    });

    if (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    throw error;
  }
};

// Get AI analysis and recommendations
export const getAIAnalysis = async (stockData: Stock, analysisType: 'recommendation' | 'technical' | 'summary' = 'recommendation') => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-stock-analysis', {
      body: { stockData, analysisType }
    });

    if (error) {
      console.error('Error getting AI analysis:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get AI analysis:', error);
    throw error;
  }
};

// Parse Alpha Vantage quote response
export const parseQuoteResponse = (data: any): Partial<StockQuote> | null => {
  const quote = data?.['Global Quote'];
  if (!quote) return null;

  return {
    symbol: quote['01. symbol']?.replace('.SAU', ''),
    price: parseFloat(quote['05. price']) || 0,
    change: parseFloat(quote['09. change']) || 0,
    changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
    high: parseFloat(quote['03. high']) || 0,
    low: parseFloat(quote['04. low']) || 0,
    volume: parseInt(quote['06. volume']) || 0,
    timestamp: quote['07. latest trading day'],
  };
};

// Parse daily time series
export const parseDailyData = (data: any) => {
  const timeSeries = data?.['Time Series (Daily)'];
  if (!timeSeries) return [];

  return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseInt(values['5. volume']),
  })).slice(0, 30).reverse();
};
