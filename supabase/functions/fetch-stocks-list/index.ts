import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SAHMK_BASE = 'https://app.sahmk.sa/api/v1';

// All major TASI stocks
const tasiStocks = [
  { symbol: '1180', name: 'الأهلي السعودي', sector: 'البنوك' },
  { symbol: '1120', name: 'الراجحي', sector: 'البنوك' },
  { symbol: '1010', name: 'الرياض', sector: 'البنوك' },
  { symbol: '1150', name: 'العربي الوطني', sector: 'البنوك' },
  { symbol: '1050', name: 'بنك الجزيرة', sector: 'البنوك' },
  { symbol: '1020', name: 'البنك السعودي للاستثمار', sector: 'البنوك' },
  { symbol: '1030', name: 'الإنماء', sector: 'البنوك' },
  { symbol: '1080', name: 'البلاد', sector: 'البنوك' },
  { symbol: '1060', name: 'الأول', sector: 'البنوك' },
  { symbol: '2222', name: 'أرامكو السعودية', sector: 'الطاقة' },
  { symbol: '2380', name: 'بترورابغ', sector: 'الطاقة' },
  { symbol: '4030', name: 'البحري', sector: 'النقل' },
  { symbol: '2010', name: 'سابك', sector: 'المواد الأساسية' },
  { symbol: '2350', name: 'كيان السعودية', sector: 'المواد الأساسية' },
  { symbol: '2310', name: 'سبكيم', sector: 'المواد الأساسية' },
  { symbol: '2250', name: 'المجموعة السعودية', sector: 'المواد الأساسية' },
  { symbol: '2290', name: 'ينساب', sector: 'المواد الأساسية' },
  { symbol: '2060', name: 'التصنيع', sector: 'المواد الأساسية' },
  { symbol: '1211', name: 'معادن', sector: 'المواد الأساسية' },
  { symbol: '2020', name: 'سابك للمغذيات', sector: 'المواد الأساسية' },
  { symbol: '2330', name: 'المتقدمة', sector: 'المواد الأساسية' },
  { symbol: '2170', name: 'اللجين', sector: 'المواد الأساسية' },
  { symbol: '2040', name: 'الصحراء للبتروكيماويات', sector: 'المواد الأساسية' },
  { symbol: '7010', name: 'اس تي سي', sector: 'الاتصالات' },
  { symbol: '7020', name: 'زين السعودية', sector: 'الاتصالات' },
  { symbol: '7030', name: 'موبايلي', sector: 'الاتصالات' },
  { symbol: '4003', name: 'إكسترا', sector: 'التجزئة' },
  { symbol: '4001', name: 'أسواق العثيم', sector: 'التجزئة' },
  { symbol: '4200', name: 'الدريس', sector: 'التجزئة' },
  { symbol: '4190', name: 'جرير', sector: 'التجزئة' },
  { symbol: '4050', name: 'ساسكو', sector: 'التجزئة' },
  { symbol: '2280', name: 'المراعي', sector: 'الأغذية' },
  { symbol: '2270', name: 'سدافكو', sector: 'الأغذية' },
  { symbol: '6010', name: 'نادك', sector: 'الأغذية' },
  { symbol: '6020', name: 'صافولا', sector: 'الأغذية' },
  { symbol: '4300', name: 'دار الأركان', sector: 'العقارات' },
  { symbol: '4320', name: 'الأندلس', sector: 'العقارات' },
  { symbol: '4250', name: 'جبل عمر', sector: 'العقارات' },
  { symbol: '4002', name: 'المواساة', sector: 'الرعاية الصحية' },
  { symbol: '4004', name: 'دله الصحية', sector: 'الرعاية الصحية' },
  { symbol: '4007', name: 'التخصصي', sector: 'الرعاية الصحية' },
  { symbol: '4009', name: 'سليمان الحبيب', sector: 'الرعاية الصحية' },
  { symbol: '8010', name: 'التعاونية', sector: 'التأمين' },
  { symbol: '8200', name: 'الدرع العربي', sector: 'التأمين' },
  { symbol: '3010', name: 'أسمنت العربية', sector: 'إسمنت' },
  { symbol: '3020', name: 'أسمنت اليمامة', sector: 'إسمنت' },
  { symbol: '3030', name: 'أسمنت السعودية', sector: 'إسمنت' },
  { symbol: '1820', name: 'مجموعة تداول', sector: 'الخدمات المالية' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('STOCK_API_KEY');
    if (!apiKey) {
      throw new Error('STOCK_API_KEY not configured');
    }

    console.log('Fetching TASI stocks via SAHMK API...');

    // Use batch endpoint for efficiency
    const symbols = tasiStocks.map(s => s.symbol).join(',');
    const url = `${SAHMK_BASE}/quotes/?symbols=${symbols}`;

    const response = await fetch(url, {
      headers: { 'X-API-Key': apiKey }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`SAHMK API error ${response.status}: ${errText}`);
      throw new Error(`SAHMK API error: ${response.status}`);
    }

    const rawText = await response.text();
    console.log('SAHMK raw response (first 2000 chars):', rawText.substring(0, 2000));
    
    const apiData = JSON.parse(rawText);
    console.log('SAHMK response keys:', Object.keys(apiData));
    console.log('SAHMK response type:', typeof apiData, Array.isArray(apiData));
    
    const quotes = apiData?.data || apiData?.results || apiData?.quotes || apiData || [];
    console.log('Quotes type:', typeof quotes, Array.isArray(quotes), 'length:', Array.isArray(quotes) ? quotes.length : 'N/A');

    // Build a lookup map from API response
    const quoteMap: Record<string, any> = {};
    const quoteArray = Array.isArray(quotes) ? quotes : Object.values(quotes);
    console.log('QuoteArray length:', quoteArray.length);
    if (quoteArray.length > 0) {
      console.log('First quote sample:', JSON.stringify(quoteArray[0]).substring(0, 500));
    }
    for (const q of quoteArray) {
      const sym = q.symbol?.toString() || q.code?.toString() || q.ticker?.toString() || '';
      if (sym) quoteMap[sym] = q;
    }
    console.log('QuoteMap keys:', Object.keys(quoteMap).slice(0, 10));

    const validStocks = tasiStocks.map(stock => {
      const q = quoteMap[stock.symbol];
      if (!q) return null;

      const price = q.last_price ?? q.close ?? q.price ?? 0;
      const prevClose = q.previous_close ?? q.prev_close ?? price;
      const change = q.change ?? (price - prevClose);
      const changePercent = q.change_percent ?? q.percent_change ?? (prevClose > 0 ? (change / prevClose) * 100 : 0);

      return {
        symbol: stock.symbol,
        name: q.name || q.company_name || stock.name,
        sector: q.sector || stock.sector,
        price,
        change,
        changePercent,
        volume: q.volume ?? 0,
        high: q.high ?? q.day_high ?? 0,
        low: q.low ?? q.day_low ?? 0,
        open: q.open ?? 0,
        previousClose: prevClose,
        marketCap: q.market_cap ?? q.market_capitalization ?? 0,
        fiftyTwoWeekHigh: q.week_52_high ?? q.fifty_two_week_high ?? 0,
        fiftyTwoWeekLow: q.week_52_low ?? q.fifty_two_week_low ?? 0,
      };
    }).filter(s => s !== null && s.price > 0);

    console.log(`Successfully fetched ${validStocks.length} stocks via SAHMK`);

    return new Response(
      JSON.stringify({ success: true, data: validStocks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching stocks list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
