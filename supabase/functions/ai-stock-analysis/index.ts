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
    const { stockData, analysisType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Performing AI analysis for: ${stockData.name}, type: ${analysisType}`);

    let systemPrompt = '';
    let userPrompt = '';

    if (analysisType === 'recommendation') {
      systemPrompt = `أنت محلل مالي خبير متخصص في السوق السعودي (تاسي) مع خبرة تزيد عن 15 عاماً في التحليل الفني والأساسي.
      
      مهمتك تقديم تحليل احترافي شامل يتضمن:
      1. التوصية الرئيسية مع مستوى الثقة
      2. الأسعار المستهدفة على المدى القصير والمتوسط والطويل
      3. مستويات الدعم والمقاومة الرئيسية
      4. تحليل نقاط القوة والضعف
      5. تحليل المؤشرات الفنية
      6. تقييم المخاطر المحتملة

      ملاحظة مهمة: قد تكون بعض البيانات المالية غير متوفرة (مثل P/E و EPS). في هذه الحالة:
      - ركز على التحليل الفني وحركة السعر والأحجام
      - استخدم نطاق 52 أسبوع لتحديد الاتجاه
      - لا تذكر عدم توفر البيانات كنقطة ضعف رئيسية
      - قدم تحليلاً مفيداً بناءً على البيانات المتاحة
      
      يجب أن تكون إجابتك باللغة العربية وبتنسيق JSON كالتالي:
      {
        "recommendation": "شراء قوي" أو "شراء" أو "احتفاظ" أو "بيع" أو "بيع قوي",
        "targetPrice": رقم السعر المستهدف الرئيسي,
        "targetPriceShort": رقم السعر المستهدف قصير المدى (1-3 أشهر),
        "targetPriceMedium": رقم السعر المستهدف متوسط المدى (3-6 أشهر),
        "targetPriceLong": رقم السعر المستهدف طويل المدى (6-12 شهر),
        "stopLoss": رقم وقف الخسارة,
        "support1": رقم مستوى الدعم الأول,
        "support2": رقم مستوى الدعم الثاني,
        "resistance1": رقم مستوى المقاومة الأول,
        "resistance2": رقم مستوى المقاومة الثاني,
        "confidence": نسبة الثقة من 0 إلى 100,
        "reasoning": "شرح تفصيلي للتوصية في 3-4 جمل يوضح أسباب التوصية والعوامل المؤثرة",
        "riskLevel": "منخفض" أو "متوسط" أو "مرتفع",
        "timeFrame": "قصير المدى" أو "متوسط المدى" أو "طويل المدى",
        "trend": "صاعد" أو "هابط" أو "عرضي",
        "momentum": "قوي" أو "متوسط" أو "ضعيف",
        "technicalScore": رقم من 0 إلى 100 للتحليل الفني,
        "fundamentalScore": رقم من 0 إلى 100 للتحليل الأساسي,
        "sentimentScore": رقم من 0 إلى 100 لتحليل المشاعر,
        "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
        "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
        "risks": ["خطر محتمل 1", "خطر محتمل 2"],
        "catalysts": ["محفز 1", "محفز 2"],
        "sectorOutlook": "إيجابي" أو "محايد" أو "سلبي",
        "volumeAnalysis": "تحليل مختصر لحجم التداول",
        "priceAction": "تحليل مختصر لحركة السعر"
      }`;

      // تحديد البيانات المتوفرة
      const hasPE = stockData.pe && stockData.pe > 0;
      const hasEPS = stockData.eps && stockData.eps > 0;
      const hasMarketCap = stockData.marketCap && stockData.marketCap > 0;
      const has52WeekData = stockData.fiftyTwoWeekHigh && stockData.fiftyTwoWeekLow;
      
      // حساب موقع السعر ضمن نطاق 52 أسبوع
      let pricePosition = '';
      if (has52WeekData) {
        const range = stockData.fiftyTwoWeekHigh - stockData.fiftyTwoWeekLow;
        const positionPercent = ((stockData.price - stockData.fiftyTwoWeekLow) / range * 100).toFixed(1);
        pricePosition = `موقع السعر ضمن نطاق 52 أسبوع: ${positionPercent}% (قريب من ${parseFloat(positionPercent) > 50 ? 'الأعلى' : 'الأدنى'})`;
      }
      
      userPrompt = `قم بتحليل احترافي شامل للسهم التالي وقدم توصيتك المفصلة:
      
      === بيانات السهم الأساسية ===
      اسم السهم: ${stockData.name}
      الرمز: ${stockData.symbol}
      القطاع: ${stockData.sector || 'غير محدد'}
      
      === بيانات السعر ===
      السعر الحالي: ${stockData.price} ريال
      سعر الافتتاح: ${stockData.open || stockData.price} ريال
      أعلى سعر اليوم: ${stockData.high || stockData.price} ريال
      أدنى سعر اليوم: ${stockData.low || stockData.price} ريال
      الإغلاق السابق: ${stockData.previousClose || stockData.price} ريال
      
      === الأداء ===
      التغير اليومي: ${stockData.change?.toFixed(2) || 0} ريال
      نسبة التغير: ${stockData.changePercent?.toFixed(2) || 0}%
      حجم التداول: ${stockData.volume?.toLocaleString() || 0} سهم
      
      === نطاق 52 أسبوع ===
      أعلى سعر: ${stockData.fiftyTwoWeekHigh || 'غير متاح'} ريال
      أدنى سعر: ${stockData.fiftyTwoWeekLow || 'غير متاح'} ريال
      ${pricePosition}
      
      === المؤشرات المالية ===
      ${hasPE ? `مكرر الربحية (P/E): ${stockData.pe}` : ''}
      ${hasEPS ? `ربحية السهم (EPS): ${stockData.eps}` : ''}
      ${hasMarketCap ? `القيمة السوقية: ${(stockData.marketCap / 1000000000).toFixed(2)} مليار ريال` : ''}
      
      ${!hasPE && !hasEPS ? 'ملاحظة: البيانات المالية الأساسية غير متوفرة، يرجى التركيز على التحليل الفني وحركة السعر.' : ''}
      
      قدم تحليلك المهني الشامل بتنسيق JSON المطلوب. كن دقيقاً في تحديد الأسعار المستهدفة ومستويات الدعم والمقاومة بناءً على البيانات المتاحة.`;
    } else if (analysisType === 'technical') {
      systemPrompt = `أنت محلل فني خبير متخصص في التحليل الفني للأسواق المالية.
      
      قم بتحليل المؤشرات الفنية للسهم وقدم تقييماً شاملاً يتضمن:
      1. الاتجاه العام (صاعد/هابط/عرضي)
      2. مستويات الدعم والمقاومة
      3. إشارات RSI و MACD
      4. تحليل حركة السعر
      5. توقعات الحركة القادمة
      
      يجب أن تكون إجابتك بتنسيق JSON كالتالي:
      {
        "trend": "صاعد" أو "هابط" أو "عرضي",
        "trendStrength": "قوي" أو "متوسط" أو "ضعيف",
        "support1": رقم مستوى الدعم الأول,
        "support2": رقم مستوى الدعم الثاني,
        "resistance1": رقم مستوى المقاومة الأول,
        "resistance2": رقم مستوى المقاومة الثاني,
        "rsiValue": رقم تقديري لـ RSI من 0 إلى 100,
        "rsiSignal": "تشبع شرائي" أو "تشبع بيعي" أو "محايد",
        "macdSignal": "إشارة شراء" أو "إشارة بيع" أو "محايد",
        "movingAverageSignal": "فوق المتوسطات" أو "تحت المتوسطات" أو "عند المتوسطات",
        "volumeTrend": "متزايد" أو "متناقص" أو "مستقر",
        "overallSignal": "شراء قوي" أو "شراء" أو "محايد" أو "بيع" أو "بيع قوي",
        "analysis": "تحليل فني مفصل في 3-4 جمل",
        "shortTermOutlook": "توقع قصير المدى",
        "patterns": ["نموذج فني 1", "نموذج فني 2"]
      }`;
      
      userPrompt = `قم بالتحليل الفني المفصل للسهم التالي:
      
      اسم السهم: ${stockData.name}
      الرمز: ${stockData.symbol}
      السعر الحالي: ${stockData.price}
      سعر الافتتاح: ${stockData.open || stockData.price}
      أعلى سعر: ${stockData.high || stockData.price}
      أدنى سعر: ${stockData.low || stockData.price}
      الإغلاق السابق: ${stockData.previousClose || stockData.price}
      حجم التداول: ${stockData.volume || 0}
      أعلى 52 أسبوع: ${stockData.fiftyTwoWeekHigh || 'غير متاح'}
      أدنى 52 أسبوع: ${stockData.fiftyTwoWeekLow || 'غير متاح'}
      
      قدم التحليل الفني المفصل بتنسيق JSON المطلوب.`;
    } else {
      systemPrompt = `أنت محلل مالي خبير. قدم ملخصاً شاملاً عن السهم باللغة العربية.`;
      userPrompt = `قدم ملخصاً عن السهم ${stockData.name} (${stockData.symbol}) في قطاع ${stockData.sector || 'غير محدد'}.`;
    }

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الاستخدام. الرجاء المحاولة لاحقاً.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log('AI Response received:', content?.substring(0, 200));

    // Try to parse JSON from the response
    let parsedAnalysis;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        parsedAnalysis = { analysis: content };
      }
    } catch (e) {
      console.log('Could not parse JSON, using raw content');
      parsedAnalysis = { analysis: content };
    }

    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
