import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch TASI market indices
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching TASI market indices...');

    // TASI main index symbol
    const indices = [
      { symbol: '^TASI.SR', name: 'تاسي', yahooSymbol: '^TASI.SR' },
    ];

    // Try to fetch TASI index
    const tasiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5ETASI.SR?interval=1d&range=1d`;
    
    let tasiData = null;
    
    try {
      const response = await fetch(tasiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (result) {
          const meta = result.meta;
          const price = meta?.regularMarketPrice || 0;
          const previousClose = meta?.chartPreviousClose || meta?.previousClose || price;
          
          tasiData = {
            name: 'تاسي',
            value: price,
            change: price - previousClose,
            changePercent: previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0,
          };
        }
      }
    } catch (err) {
      console.error('Error fetching TASI index:', err);
    }

    // If TASI fetch failed, calculate from top stocks
    if (!tasiData) {
      console.log('Calculating TASI from top stocks...');
      
      // Fetch top stocks to estimate index
      const topStocks = ['2222.SR', '1180.SR', '2010.SR', '7010.SR', '1120.SR'];
      let totalChange = 0;
      let count = 0;
      
      for (const symbol of topStocks) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const result = data?.chart?.result?.[0];
            if (result?.meta) {
              const price = result.meta.regularMarketPrice || 0;
              const prev = result.meta.chartPreviousClose || price;
              if (prev > 0) {
                totalChange += ((price - prev) / prev) * 100;
                count++;
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
        }
      }
      
      const avgChange = count > 0 ? totalChange / count : 0;
      const estimatedValue = 12000 * (1 + avgChange / 100);
      
      tasiData = {
        name: 'تاسي',
        value: Math.round(estimatedValue * 100) / 100,
        change: Math.round(estimatedValue * avgChange / 100) / 100,
        changePercent: Math.round(avgChange * 100) / 100,
      };
    }

    const marketIndices = [tasiData];

    console.log('Market indices:', JSON.stringify(marketIndices));

    return new Response(
      JSON.stringify({ success: true, data: marketIndices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching market indices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
