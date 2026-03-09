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

    // Try multiple response formats
    if (apiData.tasi) {
      const t = apiData.tasi;
      marketIndices.push({
        name: 'تاسي',
        value: t.value ?? t.price ?? t.last_price ?? t.close ?? 0,
        change: t.change ?? 0,
        changePercent: t.change_percent ?? t.percent_change ?? 0,
      });
    } else if (apiData.index) {
      const t = apiData.index;
      marketIndices.push({
        name: 'تاسي',
        value: t.value ?? t.price ?? 0,
        change: t.change ?? 0,
        changePercent: t.change_percent ?? 0,
      });
    } else if (apiData.indices && Array.isArray(apiData.indices)) {
      marketIndices = apiData.indices.map((idx: any) => ({
        name: idx.name || 'تاسي',
        value: idx.value ?? idx.price ?? 0,
        change: idx.change ?? 0,
        changePercent: idx.change_percent ?? 0,
      }));
    } else if (Array.isArray(apiData)) {
      marketIndices = apiData.map((idx: any) => ({
        name: idx.name || 'تاسي',
        value: idx.value ?? idx.price ?? 0,
        change: idx.change ?? 0,
        changePercent: idx.change_percent ?? 0,
      }));
    } else if (apiData.data) {
      // Nested data field
      const d = apiData.data;
      if (d.tasi) {
        marketIndices.push({
          name: 'تاسي',
          value: d.tasi.value ?? d.tasi.price ?? 0,
          change: d.tasi.change ?? 0,
          changePercent: d.tasi.change_percent ?? 0,
        });
      } else if (Array.isArray(d)) {
        marketIndices = d.map((idx: any) => ({
          name: idx.name || 'تاسي',
          value: idx.value ?? idx.price ?? 0,
          change: idx.change ?? 0,
          changePercent: idx.change_percent ?? 0,
        }));
      } else {
        // Try flat object with value/change
        marketIndices.push({
          name: 'تاسي',
          value: d.value ?? d.price ?? 0,
          change: d.change ?? 0,
          changePercent: d.change_percent ?? 0,
        });
      }
    } else if (apiData.value || apiData.price) {
      marketIndices.push({
        name: 'تاسي',
        value: apiData.value ?? apiData.price ?? 0,
        change: apiData.change ?? 0,
        changePercent: apiData.change_percent ?? 0,
      });
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