import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Yahoo Finance API for Saudi stocks (TASI)
// Saudi stock symbols use .SR suffix (e.g., 2222.SR for Aramco)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, action } = await req.json();
    
    // Convert to Yahoo Finance format for Saudi stocks
    const yahooSymbol = `${symbol}.SR`;
    
    console.log(`Fetching stock data for: ${yahooSymbol}, action: ${action}`);

    let data;

    if (action === 'quote' || action === 'all') {
      // Get real-time quote from Yahoo Finance
      const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
      
      console.log(`Calling Yahoo Finance: ${quoteUrl}`);
      
      const response = await fetch(quoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }
      
      const yahooData = await response.json();
      const result = yahooData?.chart?.result?.[0];
      
      if (!result) {
        throw new Error('No data found for this symbol');
      }
      
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      const timestamps = result.timestamp;
      
      // Get the latest values
      const lastIndex = timestamps ? timestamps.length - 1 : 0;

      // Fetch fundamental data (market cap, P/E, EPS)
      let marketCap = 0;
      let peRatio = 0;
      let eps = 0;

      // 1) Try the v7 quote endpoint (often more reliable than quoteSummary)
      try {
        const quoteApiUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`;
        console.log(`Calling Yahoo Finance Quote: ${quoteApiUrl}`);

        const quoteResp = await fetch(quoteApiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (quoteResp.ok) {
          const quoteJson = await quoteResp.json();
          const q = quoteJson?.quoteResponse?.result?.[0];

          marketCap = q?.marketCap ?? 0;
          peRatio = q?.trailingPE ?? 0;
          eps = q?.epsTrailingTwelveMonths ?? 0;

          console.log(`Fundamentals (v7) - MarketCap: ${marketCap}, PE: ${peRatio}, EPS: ${eps}`);
        } else {
          console.log(`Yahoo Quote endpoint failed: ${quoteResp.status}`);
        }
      } catch (e) {
        console.log('Could not fetch fundamentals from v7 quote:', e);
      }

      // 2) Fallback to quoteSummary if still missing
      if (marketCap === 0 && peRatio === 0 && eps === 0) {
        try {
          const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=price,defaultKeyStatistics,summaryDetail`;
          console.log(`Calling Yahoo Finance Summary: ${summaryUrl}`);

          const summaryResponse = await fetch(summaryUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            const priceData = summaryData?.quoteSummary?.result?.[0]?.price;
            const statsData = summaryData?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
            const detailData = summaryData?.quoteSummary?.result?.[0]?.summaryDetail;

            marketCap = priceData?.marketCap?.raw || detailData?.marketCap?.raw || 0;
            peRatio = detailData?.trailingPE?.raw || priceData?.trailingPE?.raw || statsData?.trailingPE?.raw || 0;
            eps = statsData?.trailingEps?.raw || detailData?.trailingEps?.raw || 0;

            console.log(`Fundamentals (summary) - MarketCap: ${marketCap}, PE: ${peRatio}, EPS: ${eps}`);
          } else {
            console.log(`Yahoo quoteSummary failed: ${summaryResponse.status}`);
          }
        } catch (summaryError) {
          console.log('Could not fetch summary data, using defaults:', summaryError);
        }
      }

      data = {
        symbol: symbol,
        name: meta?.shortName || meta?.longName || symbol,
        currency: meta?.currency || 'SAR',
        price: meta?.regularMarketPrice || 0,
        previousClose: meta?.chartPreviousClose || meta?.previousClose || 0,
        change: (meta?.regularMarketPrice || 0) - (meta?.chartPreviousClose || 0),
        changePercent: meta?.regularMarketPrice && meta?.chartPreviousClose 
          ? ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100) 
          : 0,
        high: quote?.high?.[lastIndex] || meta?.regularMarketDayHigh || 0,
        low: quote?.low?.[lastIndex] || meta?.regularMarketDayLow || 0,
        open: quote?.open?.[lastIndex] || meta?.regularMarketOpen || 0,
        volume: quote?.volume?.[lastIndex] || meta?.regularMarketVolume || 0,
        marketCap: marketCap || meta?.marketCap || 0,
        peRatio: peRatio,
        eps: eps,
        fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: meta?.fiftyTwoWeekLow || 0,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Quote data:', JSON.stringify(data));
    }

    if (action === 'history' || action === 'all') {
      // Get historical data
      const historyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1mo`;
      
      const response = await fetch(historyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }
      
      const yahooData = await response.json();
      const result = yahooData?.chart?.result?.[0];
      
      if (result) {
        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};
        
        const history = timestamps.map((ts: number, i: number) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          open: quote.open?.[i] || 0,
          high: quote.high?.[i] || 0,
          low: quote.low?.[i] || 0,
          close: quote.close?.[i] || 0,
          volume: quote.volume?.[i] || 0,
        })).filter((item: any) => item.close > 0);
        
        if (action === 'all') {
          data = { ...data, history };
        } else {
          data = { history };
        }
      }
    }

    // Fetch earnings history (quarterly/annual EPS and P/E)
    if (action === 'earnings' || action === 'all') {
      try {
        const earningsUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=earnings,earningsHistory,earningsTrend`;
        console.log(`Calling Yahoo Finance Earnings: ${earningsUrl}`);

        const earningsResponse = await fetch(earningsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (earningsResponse.ok) {
          const earningsData = await earningsResponse.json();
          const result = earningsData?.quoteSummary?.result?.[0];
          
          const earningsHistory = result?.earningsHistory?.history || [];
          const earningsTrend = result?.earningsTrend?.trend || [];
          const quarterlyEarnings = result?.earnings?.financialsChart?.quarterly || [];
          const yearlyEarnings = result?.earnings?.financialsChart?.yearly || [];

          const earnings = {
            quarterly: earningsHistory.map((item: any) => ({
              date: item?.quarter?.fmt || '',
              epsActual: item?.epsActual?.raw ?? null,
              epsEstimate: item?.epsEstimate?.raw ?? null,
              epsDifference: item?.epsDifference?.raw ?? null,
              surprisePercent: item?.surprisePercent?.raw ?? null,
            })).filter((item: any) => item.date),
            
            annual: yearlyEarnings.map((item: any) => ({
              date: item?.date?.toString() || '',
              earnings: item?.earnings?.raw ?? null,
              revenue: item?.revenue?.raw ?? null,
            })).filter((item: any) => item.date),

            trend: earningsTrend.map((item: any) => ({
              period: item?.period || '',
              growth: item?.growth?.raw ?? null,
              earningsEstimate: item?.earningsEstimate?.avg?.raw ?? null,
              revenueEstimate: item?.revenueEstimate?.avg?.raw ?? null,
            })),
          };

          console.log('Earnings data:', JSON.stringify(earnings));

          if (action === 'all' && data) {
            data = { ...data, earnings };
          } else if (action === 'earnings') {
            data = { earnings };
          }
        } else {
          console.log(`Yahoo Finance Earnings failed: ${earningsResponse.status}`);
        }
      } catch (earningsError) {
        console.log('Could not fetch earnings data:', earningsError);
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
