import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SAHMK_BASE = 'https://app.sahmk.sa/api/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, action } = await req.json();
    const apiKey = Deno.env.get('STOCK_API_KEY');
    if (!apiKey) throw new Error('STOCK_API_KEY not configured');

    console.log(`Fetching stock data for: ${symbol}, action: ${action}`);

    let data: any = {};

    // Fetch quote data
    if (action === 'quote' || action === 'all') {
      const quoteUrl = `${SAHMK_BASE}/quotes/?symbols=${symbol}`;
      console.log(`Calling SAHMK Quote: ${quoteUrl}`);

      const response = await fetch(quoteUrl, {
        headers: { 'X-API-Key': apiKey }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SAHMK quote error ${response.status}: ${errText}`);
      }

      const apiData = await response.json();
      const quotes = apiData?.quotes || apiData?.data || [];
      const quoteArray = Array.isArray(quotes) ? quotes : Object.values(quotes);
      const quote = quoteArray.find((q: any) => q.symbol?.toString() === symbol) || quoteArray[0] || {};

      const price = quote.price ?? quote.last_price ?? quote.close ?? 0;
      const change = quote.change ?? 0;
      const changePercent = quote.change_percent ?? quote.percent_change ?? 0;
      const previousClose = price - change;

      data = {
        symbol,
        name: quote.name || quote.company_name || symbol,
        currency: 'SAR',
        price,
        previousClose,
        change,
        changePercent,
        high: quote.high ?? quote.day_high ?? price,
        low: quote.low ?? quote.day_low ?? price,
        open: quote.open ?? price,
        volume: quote.volume ?? 0,
        marketCap: quote.market_cap ?? 0,
        peRatio: quote.pe_ratio ?? quote.pe ?? 0,
        eps: quote.eps ?? 0,
        fiftyTwoWeekHigh: quote.week_52_high ?? 0,
        fiftyTwoWeekLow: quote.week_52_low ?? 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch historical data
    if (action === 'history' || action === 'all') {
      try {
        const historyUrl = `${SAHMK_BASE}/history/${symbol}/`;
        const response = await fetch(historyUrl, {
          headers: { 'X-API-Key': apiKey }
        });

        if (response.ok) {
          const histData = await response.json();
          const rawHistory = histData.data || histData.history || histData.results || histData || [];
          const histArray = Array.isArray(rawHistory) ? rawHistory : [];

          const history = histArray.map((item: any) => ({
            date: item.date || item.trade_date || '',
            open: item.open ?? 0,
            high: item.high ?? 0,
            low: item.low ?? 0,
            close: item.close ?? item.price ?? 0,
            volume: item.volume ?? 0,
          })).filter((item: any) => item.close > 0 && item.date);

          if (action === 'all') {
            data = { ...data, history };
          } else {
            data = { history };
          }
        }
      } catch (histError) {
        console.log('Could not fetch history:', histError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching stock data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});