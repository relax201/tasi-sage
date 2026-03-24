import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SAHMK_BASE = 'https://app.sahmk.sa/api/v1';

const tasiStocks = [
  // البنوك
  { symbol: '1180', name: 'الأهلي السعودي', sector: 'البنوك' },
  { symbol: '1120', name: 'الراجحي', sector: 'البنوك' },
  { symbol: '1010', name: 'الرياض', sector: 'البنوك' },
  { symbol: '1150', name: 'العربي الوطني', sector: 'البنوك' },
  { symbol: '1050', name: 'بنك الجزيرة', sector: 'البنوك' },
  { symbol: '1020', name: 'البنك السعودي للاستثمار', sector: 'البنوك' },
  { symbol: '1030', name: 'الإنماء', sector: 'البنوك' },
  { symbol: '1080', name: 'البلاد', sector: 'البنوك' },
  { symbol: '1060', name: 'الأول', sector: 'البنوك' },
  // الطاقة
  { symbol: '2222', name: 'أرامكو السعودية', sector: 'الطاقة' },
  { symbol: '2380', name: 'بترورابغ', sector: 'الطاقة' },
  { symbol: '4210', name: 'الحفر العربية', sector: 'الطاقة' },
  { symbol: '2030', name: 'المصافي', sector: 'الطاقة' },
  // المواد الأساسية
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
  { symbol: '2210', name: 'نماء للكيماويات', sector: 'المواد الأساسية' },
  { symbol: '2240', name: 'الزامل للصناعة', sector: 'المواد الأساسية' },
  { symbol: '2300', name: 'صناعة الورق', sector: 'المواد الأساسية' },
  { symbol: '1320', name: 'أنابيب السعودية', sector: 'المواد الأساسية' },
  { symbol: '1210', name: 'بي سي آي', sector: 'المواد الأساسية' },
  { symbol: '2200', name: 'أنابيب', sector: 'المواد الأساسية' },
  // الاتصالات وتقنية المعلومات
  { symbol: '7010', name: 'اس تي سي', sector: 'الاتصالات' },
  { symbol: '7020', name: 'زين السعودية', sector: 'الاتصالات' },
  { symbol: '7030', name: 'موبايلي', sector: 'الاتصالات' },
  { symbol: '7040', name: 'سلوشنز', sector: 'الاتصالات' },
  // التجزئة
  { symbol: '4003', name: 'إكسترا', sector: 'التجزئة' },
  { symbol: '4001', name: 'أسواق العثيم', sector: 'التجزئة' },
  { symbol: '4200', name: 'الدريس', sector: 'التجزئة' },
  { symbol: '4190', name: 'جرير', sector: 'التجزئة' },
  { symbol: '4050', name: 'ساسكو', sector: 'التجزئة' },
  { symbol: '4006', name: 'أسواق المزرعة', sector: 'التجزئة' },
  { symbol: '4160', name: 'ثمار', sector: 'التجزئة' },
  { symbol: '4070', name: 'تهامة', sector: 'التجزئة' },
  // الأغذية والمشروبات
  { symbol: '2280', name: 'المراعي', sector: 'الأغذية' },
  { symbol: '2270', name: 'سدافكو', sector: 'الأغذية' },
  { symbol: '6010', name: 'نادك', sector: 'الأغذية' },
  { symbol: '6020', name: 'صافولا', sector: 'الأغذية' },
  { symbol: '6050', name: 'السعودية للأسماك', sector: 'الأغذية' },
  { symbol: '6090', name: 'جازادكو', sector: 'الأغذية' },
  { symbol: '2100', name: 'وفرة', sector: 'الأغذية' },
  // العقارات
  { symbol: '4300', name: 'دار الأركان', sector: 'العقارات' },
  { symbol: '4320', name: 'الأندلس', sector: 'العقارات' },
  { symbol: '4250', name: 'جبل عمر', sector: 'العقارات' },
  { symbol: '4310', name: 'مدينة المعرفة', sector: 'العقارات' },
  { symbol: '4220', name: 'إعمار', sector: 'العقارات' },
  { symbol: '4230', name: 'البحر الأحمر', sector: 'العقارات' },
  // الرعاية الصحية
  { symbol: '4002', name: 'المواساة', sector: 'الرعاية الصحية' },
  { symbol: '4004', name: 'دله الصحية', sector: 'الرعاية الصحية' },
  { symbol: '4007', name: 'التخصصي', sector: 'الرعاية الصحية' },
  { symbol: '4009', name: 'سليمان الحبيب', sector: 'الرعاية الصحية' },
  { symbol: '4005', name: 'رعاية', sector: 'الرعاية الصحية' },
  // التأمين
  { symbol: '8010', name: 'التعاونية', sector: 'التأمين' },
  { symbol: '8200', name: 'الدرع العربي', sector: 'التأمين' },
  { symbol: '8020', name: 'ملاذ للتأمين', sector: 'التأمين' },
  { symbol: '8030', name: 'ميدغلف', sector: 'التأمين' },
  { symbol: '8040', name: 'أليانز إس إف', sector: 'التأمين' },
  { symbol: '8050', name: 'سلامة', sector: 'التأمين' },
  { symbol: '8060', name: 'ولاء', sector: 'التأمين' },
  { symbol: '8100', name: 'سايكو', sector: 'التأمين' },
  { symbol: '8120', name: 'إتحاد الخليج', sector: 'التأمين' },
  { symbol: '8150', name: 'أسيج', sector: 'التأمين' },
  { symbol: '8160', name: 'التأمين العربية', sector: 'التأمين' },
  { symbol: '8170', name: 'الاتحاد للتأمين', sector: 'التأمين' },
  { symbol: '8180', name: 'الصقر للتأمين', sector: 'التأمين' },
  { symbol: '8190', name: 'المتحدة للتأمين', sector: 'التأمين' },
  { symbol: '8230', name: 'تكافل الراجحي', sector: 'التأمين' },
  { symbol: '8240', name: 'تْشب', sector: 'التأمين' },
  { symbol: '8250', name: 'الجزيرة تكافل', sector: 'التأمين' },
  { symbol: '8270', name: 'بروج للتأمين', sector: 'التأمين' },
  { symbol: '8280', name: 'العالمية', sector: 'التأمين' },
  { symbol: '8300', name: 'الوطنية', sector: 'التأمين' },
  { symbol: '8310', name: 'أمانة للتأمين', sector: 'التأمين' },
  // إسمنت
  { symbol: '3010', name: 'أسمنت العربية', sector: 'إسمنت' },
  { symbol: '3020', name: 'أسمنت اليمامة', sector: 'إسمنت' },
  { symbol: '3030', name: 'أسمنت السعودية', sector: 'إسمنت' },
  { symbol: '3040', name: 'أسمنت القصيم', sector: 'إسمنت' },
  { symbol: '3050', name: 'أسمنت الجنوبية', sector: 'إسمنت' },
  { symbol: '3060', name: 'أسمنت ينبع', sector: 'إسمنت' },
  { symbol: '3080', name: 'أسمنت الشرقية', sector: 'إسمنت' },
  { symbol: '3090', name: 'أسمنت تبوك', sector: 'إسمنت' },
  { symbol: '3091', name: 'أسمنت الجوف', sector: 'إسمنت' },
  { symbol: '3092', name: 'أسمنت الرياض', sector: 'إسمنت' },
  { symbol: '3003', name: 'أسمنت نجران', sector: 'إسمنت' },
  { symbol: '3004', name: 'أسمنت الشمالية', sector: 'إسمنت' },
  // الخدمات المالية
  { symbol: '1820', name: 'مجموعة تداول', sector: 'الخدمات المالية' },
  { symbol: '4080', name: 'سناد القابضة', sector: 'الخدمات المالية' },
  // النقل
  { symbol: '4030', name: 'البحري', sector: 'النقل' },
  { symbol: '4040', name: 'سال', sector: 'النقل' },
  { symbol: '4260', name: 'بدجت السعودية', sector: 'النقل' },
  { symbol: '4261', name: 'ذيب', sector: 'النقل' },
  // المرافق العامة
  { symbol: '5110', name: 'الكهرباء', sector: 'المرافق العامة' },
  { symbol: '2082', name: 'أكوا باور', sector: 'المرافق العامة' },
  { symbol: '2083', name: 'مرافق', sector: 'المرافق العامة' },
  // الفنادق والسياحة
  { symbol: '1810', name: 'سيرا', sector: 'الفنادق والسياحة' },
  { symbol: '4010', name: 'دور', sector: 'الفنادق والسياحة' },
  { symbol: '1830', name: 'لجام للرياضة', sector: 'الفنادق والسياحة' },
  // السلع الرأسمالية
  { symbol: '1214', name: 'شاكر', sector: 'السلع الرأسمالية' },
  { symbol: '1212', name: 'أسترا الصناعية', sector: 'السلع الرأسمالية' },
  { symbol: '1213', name: 'نقي', sector: 'السلع الرأسمالية' },
  { symbol: '2110', name: 'الكابلات', sector: 'السلع الرأسمالية' },
  { symbol: '2160', name: 'أميانتيت', sector: 'السلع الرأسمالية' },
  // الإعلام والترفيه
  { symbol: '4070', name: 'تهامة', sector: 'الإعلام والترفيه' },
  // التطبيقات وخدمات التقنية
  { symbol: '6012', name: 'علم', sector: 'التطبيقات والتقنية' },
  { symbol: '6015', name: 'ثقة', sector: 'التطبيقات والتقنية' },
  // الأدوية
  { symbol: '4015', name: 'جمجوم فارما', sector: 'الأدوية' },
  { symbol: '4014', name: 'الدوائية', sector: 'الأدوية' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('STOCK_API_KEY');
    if (!apiKey) throw new Error('STOCK_API_KEY not configured');

    console.log(`Fetching ${tasiStocks.length} TASI stocks via SAHMK API in batches...`);

    // Split into batches of 30 to avoid API limits
    const BATCH_SIZE = 30;
    const quoteMap: Record<string, any> = {};
    
    for (let i = 0; i < tasiStocks.length; i += BATCH_SIZE) {
      const batch = tasiStocks.slice(i, i + BATCH_SIZE);
      const symbols = batch.map(s => s.symbol).join(',');
      const url = `${SAHMK_BASE}/quotes/?symbols=${symbols}`;

      const response = await fetch(url, {
        headers: { 'X-API-Key': apiKey }
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`SAHMK API error batch ${i / BATCH_SIZE + 1}: ${response.status}: ${errText}`);
        continue; // Skip failed batch, don't fail entirely
      }

      const apiData = await response.json();
      const quotes = apiData?.quotes || apiData?.data || apiData?.results || apiData || [];
      const quoteArray = Array.isArray(quotes) ? quotes : Object.values(quotes);

      for (const q of quoteArray) {
        const sym = q.symbol?.toString() || '';
        if (sym) quoteMap[sym] = q;
      }
      
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: fetched ${quoteArray.length} quotes`);
    }

    // Log missing stocks
    const missingStocks = tasiStocks.filter(s => !quoteMap[s.symbol]);
    if (missingStocks.length > 0) {
      console.log(`Missing ${missingStocks.length} stocks: ${missingStocks.map(s => s.symbol).join(', ')}`);
    }

    const validStocks = tasiStocks.map(stock => {
      const q = quoteMap[stock.symbol];
      if (!q) return null;

      const price = q.price ?? q.last_price ?? q.close ?? 0;
      const change = q.change ?? 0;
      const changePercent = q.change_percent ?? q.percent_change ?? 0;
      const previousClose = price - change;

      return {
        symbol: stock.symbol,
        name: q.name || stock.name,
        sector: q.sector || stock.sector,
        price,
        change,
        changePercent,
        volume: q.volume ?? 0,
        high: q.high ?? q.day_high ?? price,
        low: q.low ?? q.day_low ?? price,
        open: q.open ?? price,
        previousClose,
        marketCap: q.market_cap ?? 0,
        fiftyTwoWeekHigh: q.week_52_high ?? 0,
        fiftyTwoWeekLow: q.week_52_low ?? 0,
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