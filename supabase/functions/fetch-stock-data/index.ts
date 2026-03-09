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
      const quoteUrl = `${SAHMK_BASE}/quote/${symbol}/`;
      console.log(`Calling SAHMK Quote: ${quoteUrl}`);

      const response = await fetch(quoteUrl, {
        headers: { 'X-API-Key': apiKey }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`SAHMK quote error ${response.status}: ${errText}`);
      }

      const q = await response.json();
      // Handle nested response (e.g. { data: {...} } or flat)
      const quote = q.data || q;

      const price = quote.last_price ?? quote.close ?? quote.price ?? 0;
      const prevClose = quote.previous_close ?? quote.prev_close ?? price;
      const change = quote.change ?? (price - prevClose);
      const changePercent = quote.change_percent ?? quote.percent_change ?? (prevClose > 0 ? (change / prevClose) * 100 : 0);

      data = {
        symbol,
        name: quote.name || quote.company_name || symbol,
        currency: 'SAR',
        price,
        previousClose: prevClose,
        change,
        changePercent,
        high: quote.high ?? quote.day_high ?? 0,
        low: quote.low ?? quote.day_low ?? 0,
        open: quote.open ?? 0,
        volume: quote.volume ?? 0,
        marketCap: quote.market_cap ?? quote.market_capitalization ?? 0,
        peRatio: quote.pe_ratio ?? quote.pe ?? quote.trailing_pe ?? 0,
        eps: quote.eps ?? quote.earnings_per_share ?? 0,
        fiftyTwoWeekHigh: quote.week_52_high ?? quote.fifty_two_week_high ?? 0,
        fiftyTwoWeekLow: quote.week_52_low ?? quote.fifty_two_week_low ?? 0,
        timestamp: new Date().toISOString(),
      };

      console.log('Quote data:', JSON.stringify(data));
    }

    // Fetch historical data
    if (action === 'history' || action === 'all') {
      try {
        const historyUrl = `${SAHMK_BASE}/history/${symbol}/`;
        console.log(`Calling SAHMK History: ${historyUrl}`);

        const response = await fetch(historyUrl, {
          headers: { 'X-API-Key': apiKey }
        });

        if (response.ok) {
          const histData = await response.json();
          const rawHistory = histData.data || histData.results || histData || [];
          const histArray = Array.isArray(rawHistory) ? rawHistory : [];

          const history = histArray.map((item: any) => ({
            date: item.date || item.trade_date || '',
            open: item.open ?? 0,
            high: item.high ?? 0,
            low: item.low ?? 0,
            close: item.close ?? item.last_price ?? 0,
            volume: item.volume ?? 0,
          })).filter((item: any) => item.close > 0 && item.date);

          if (action === 'all') {
            data = { ...data, history };
          } else {
            data = { history };
          }
        } else {
          console.log(`SAHMK History failed: ${response.status}`);
        }
      } catch (histError) {
        console.log('Could not fetch history:', histError);
      }
    }

    console.log('Returning data for:', symbol);

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
