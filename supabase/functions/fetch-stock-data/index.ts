import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, action } = await req.json();
    const apiKey = Deno.env.get('STOCK_API_KEY');

    if (!apiKey) {
      console.error('STOCK_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching stock data for symbol: ${symbol}, action: ${action}`);

    let url = '';
    
    // Support multiple API providers - adjust based on your API
    // Example using Alpha Vantage format
    if (action === 'quote') {
      url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.SAU&apikey=${apiKey}`;
    } else if (action === 'daily') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}.SAU&apikey=${apiKey}`;
    } else if (action === 'intraday') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}.SAU&interval=5min&apikey=${apiKey}`;
    } else {
      // Default to quote
      url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.SAU&apikey=${apiKey}`;
    }

    console.log(`Calling API: ${url.replace(apiKey, '***')}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log('API Response received:', JSON.stringify(data).substring(0, 200));

    // Check for API errors
    if (data['Error Message'] || data['Note']) {
      console.error('API Error:', data['Error Message'] || data['Note']);
      return new Response(
        JSON.stringify({ 
          error: data['Error Message'] || 'API rate limit reached. Please try again later.',
          rawData: data 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching stock data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
