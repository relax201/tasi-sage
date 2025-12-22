import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch all TASI stocks list
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching TASI stocks list...');

    // List of major TASI stocks with their Yahoo Finance symbols
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
      { symbol: '1140', name: 'البلاد', sector: 'البنوك' },
      
      // الطاقة
      { symbol: '2222', name: 'أرامكو السعودية', sector: 'الطاقة' },
      { symbol: '2380', name: 'بترورابغ', sector: 'الطاقة' },
      { symbol: '4030', name: 'البحري', sector: 'النقل' },
      
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
      { symbol: '4005', name: 'المتقدمة للبتروكيماويات', sector: 'المواد الأساسية' },
      
      // الاتصالات
      { symbol: '7010', name: 'اس تي سي', sector: 'الاتصالات' },
      { symbol: '7020', name: 'زين السعودية', sector: 'الاتصالات' },
      { symbol: '7030', name: 'موبايلي', sector: 'الاتصالات' },
      
      // التجزئة
      { symbol: '4003', name: 'إكسترا', sector: 'التجزئة' },
      { symbol: '4001', name: 'أسواق العثيم', sector: 'التجزئة' },
      { symbol: '4200', name: 'الدريس', sector: 'التجزئة' },
      { symbol: '4190', name: 'جرير', sector: 'التجزئة' },
      { symbol: '4050', name: 'ساسكو', sector: 'التجزئة' },
      { symbol: '4240', name: 'الحكير', sector: 'التجزئة' },
      
      // الأغذية
      { symbol: '2280', name: 'المراعي', sector: 'الأغذية' },
      { symbol: '2270', name: 'سدافكو', sector: 'الأغذية' },
      { symbol: '6010', name: 'نادك', sector: 'الأغذية' },
      { symbol: '6020', name: 'صافولا', sector: 'الأغذية' },
      { symbol: '6050', name: 'صافي', sector: 'الأغذية' },
      { symbol: '4040', name: 'سيسكو', sector: 'الأغذية' },
      { symbol: '2070', name: 'المدينة المنورة', sector: 'الأغذية' },
      { symbol: '2080', name: 'الغذائية', sector: 'الأغذية' },
      { symbol: '2090', name: 'حلواني إخوان', sector: 'الأغذية' },
      { symbol: '2100', name: 'وفرة', sector: 'الأغذية' },
      
      // العقارات
      { symbol: '4300', name: 'دار الأركان', sector: 'العقارات' },
      { symbol: '4320', name: 'الأندلس', sector: 'العقارات' },
      { symbol: '4210', name: 'الفخارية', sector: 'العقارات' },
      { symbol: '4220', name: 'إعمار', sector: 'العقارات' },
      { symbol: '4230', name: 'ريد سي', sector: 'العقارات' },
      { symbol: '4250', name: 'جبل عمر', sector: 'العقارات' },
      { symbol: '4290', name: 'الخليجية العامة', sector: 'العقارات' },
      
      // الرعاية الصحية
      { symbol: '4002', name: 'المواساة', sector: 'الرعاية الصحية' },
      { symbol: '4004', name: 'دله الصحية', sector: 'الرعاية الصحية' },
      { symbol: '4007', name: 'التخصصي', sector: 'الرعاية الصحية' },
      { symbol: '4009', name: 'سليمان الحبيب', sector: 'الرعاية الصحية' },
      { symbol: '4321', name: 'الرعاية الطبية', sector: 'الرعاية الصحية' },
      
      // التأمين
      { symbol: '8010', name: 'التعاونية', sector: 'التأمين' },
      { symbol: '8200', name: 'الدرع العربي', sector: 'التأمين' },
      { symbol: '8030', name: 'ميدغلف', sector: 'التأمين' },
      { symbol: '8020', name: 'ملاذ للتأمين', sector: 'التأمين' },
      { symbol: '8040', name: 'أليانز', sector: 'التأمين' },
      { symbol: '8050', name: 'سلامة', sector: 'التأمين' },
      
      // إسمنت
      { symbol: '3010', name: 'أسمنت العربية', sector: 'إسمنت' },
      { symbol: '3020', name: 'أسمنت اليمامة', sector: 'إسمنت' },
      { symbol: '3030', name: 'أسمنت السعودية', sector: 'إسمنت' },
      { symbol: '3040', name: 'أسمنت القصيم', sector: 'إسمنت' },
      { symbol: '3050', name: 'أسمنت الجنوب', sector: 'إسمنت' },
      { symbol: '3060', name: 'أسمنت ينبع', sector: 'إسمنت' },
      { symbol: '4013', name: 'سمنت نجران', sector: 'إسمنت' },
      
      // الزراعة
      { symbol: '2110', name: 'الشرقية للتنمية', sector: 'الزراعة' },
      { symbol: '2120', name: 'تبوك الزراعية', sector: 'الزراعة' },
      { symbol: '2130', name: 'صدق', sector: 'الزراعة' },
      { symbol: '2140', name: 'القصيم الزراعية', sector: 'الزراعة' },
      { symbol: '2150', name: 'حائل الزراعية', sector: 'الزراعة' },
      
      // النقل
      { symbol: '4080', name: 'سناد القابضة', sector: 'النقل' },
      { symbol: '4260', name: 'بدجت السعودية', sector: 'النقل' },
      
      // الخدمات المالية
      { symbol: '1820', name: 'مجموعة تداول', sector: 'الخدمات المالية' },
    ];

    // Fetch real-time data for all stocks in parallel
    const stockPromises = tasiStocks.map(async (stock) => {
      try {
        const yahooSymbol = `${stock.symbol}.SR`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${stock.symbol}: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (!result) {
          console.error(`No data for ${stock.symbol}`);
          return null;
        }
        
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        const lastIndex = result.timestamp ? result.timestamp.length - 1 : 0;
        
        const price = meta?.regularMarketPrice || 0;
        const previousClose = meta?.chartPreviousClose || meta?.previousClose || price;
        const change = price - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
        
        return {
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          price: price,
          change: change,
          changePercent: changePercent,
          volume: quote?.volume?.[lastIndex] || meta?.regularMarketVolume || 0,
          high: quote?.high?.[lastIndex] || meta?.regularMarketDayHigh || 0,
          low: quote?.low?.[lastIndex] || meta?.regularMarketDayLow || 0,
          open: quote?.open?.[lastIndex] || meta?.regularMarketOpen || 0,
          previousClose: previousClose,
          marketCap: meta?.marketCap || 0,
          fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: meta?.fiftyTwoWeekLow || 0,
        };
      } catch (err) {
        console.error(`Error fetching ${stock.symbol}:`, err);
        return null;
      }
    });

    const results = await Promise.all(stockPromises);
    const validStocks = results.filter(stock => stock !== null && stock.price > 0);

    console.log(`Successfully fetched ${validStocks.length} stocks`);

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
