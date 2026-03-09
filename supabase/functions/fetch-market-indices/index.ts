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
    const apiKey = Deno.env.get('STOCK_API_KEY');
    if (!apiKey) throw new Error('STOCK_API_KEY not configured');

    console.log('Fetching market indices via SAHMK API...');

    const url = `${SAHMK_BASE}/market/summary/`;
    const response = await fetch(url, {
      headers: { 'X-API-Key': apiKey }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`SAHMK market summary error ${response.status}: ${errText}`);
      throw new Error(`SAHMK API error: ${response.status}`);
    }

    const apiData = await response.json();
    const summary = apiData.data || apiData;

    // Extract TASI index from market summary
    let marketIndices = [];

    if (summary.tasi || summary.index || summary.indices) {
      const tasi = summary.tasi || summary.index || (Array.isArray(summary.indices) ? summary.indices[0] : null);
      if (tasi) {
        marketIndices.push({
          name: 'تاسي',
          value: tasi.value ?? tasi.last_price ?? tasi.close ?? 0,
          change: tasi.change ?? 0,
          changePercent: tasi.change_percent ?? tasi.percent_change ?? 0,
        });
      }
    } else if (Array.isArray(summary)) {
      // If response is an array of indices
      marketIndices = summary.map((idx: any) => ({
        name: idx.name || idx.index_name || 'تاسي',
        value: idx.value ?? idx.last_price ?? idx.close ?? 0,
        change: idx.change ?? 0,
        changePercent: idx.change_percent ?? idx.percent_change ?? 0,
      }));
    } else {
      // Try to extract directly from flat response
      marketIndices.push({
        name: 'تاسي',
        value: summary.value ?? summary.last_price ?? summary.close ?? 0,
        change: summary.change ?? 0,
        changePercent: summary.change_percent ?? summary.percent_change ?? 0,
      });
    }

    // Filter out zero-value entries
    marketIndices = marketIndices.filter((idx: any) => idx.value > 0);

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
