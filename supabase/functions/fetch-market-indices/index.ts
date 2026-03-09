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

    const rawText = await response.text();
    console.log('Market summary raw (first 1000):', rawText.substring(0, 1000));
    
    const apiData = JSON.parse(rawText);
    let marketIndices: any[] = [];

    // SAHMK returns flat: { index_value, index_change, index_change_percent, total_volume, ... }
    if (apiData.index_value) {
      marketIndices.push({
        name: 'تاسي',
        value: apiData.index_value,
        change: apiData.index_change ?? 0,
        changePercent: apiData.index_change_percent ?? 0,
      });
    } else if (apiData.tasi) {
      const t = apiData.tasi;
      marketIndices.push({
        name: 'تاسي',
        value: t.value ?? t.price ?? 0,
        change: t.change ?? 0,
        changePercent: t.change_percent ?? 0,
      });
    } else if (apiData.data?.index_value) {
      marketIndices.push({
        name: 'تاسي',
        value: apiData.data.index_value,
        change: apiData.data.index_change ?? 0,
        changePercent: apiData.data.index_change_percent ?? 0,
      });
    } else if (Array.isArray(apiData)) {
      marketIndices = apiData.map((idx: any) => ({
        name: idx.name || 'تاسي',
        value: idx.value ?? idx.index_value ?? idx.price ?? 0,
        change: idx.change ?? idx.index_change ?? 0,
        changePercent: idx.change_percent ?? idx.index_change_percent ?? 0,
      }));
    }

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