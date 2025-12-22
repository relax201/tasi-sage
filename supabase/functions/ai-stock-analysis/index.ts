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
      systemPrompt = `أنت محلل مالي خبير متخصص في السوق السعودي (تاسي). قم بتحليل بيانات السهم وقدم توصية واضحة.
      
      يجب أن تكون إجابتك باللغة العربية وبتنسيق JSON كالتالي:
      {
        "recommendation": "شراء قوي" أو "شراء" أو "احتفاظ" أو "بيع" أو "بيع قوي",
        "targetPrice": رقم السعر المستهدف,
        "stopLoss": رقم وقف الخسارة,
        "confidence": نسبة الثقة من 0 إلى 100,
        "reasoning": "شرح مختصر للتوصية في جملتين",
        "riskLevel": "منخفض" أو "متوسط" أو "مرتفع",
        "timeFrame": "قصير المدى" أو "متوسط المدى" أو "طويل المدى"
      }`;
      
      userPrompt = `قم بتحليل السهم التالي وقدم توصيتك:
      
      اسم السهم: ${stockData.name}
      الرمز: ${stockData.symbol}
      القطاع: ${stockData.sector}
      السعر الحالي: ${stockData.price} ريال
      التغير اليومي: ${stockData.changePercent}%
      حجم التداول: ${stockData.volume}
      أعلى سعر: ${stockData.high}
      أدنى سعر: ${stockData.low}
      مكرر الربحية: ${stockData.pe}
      ربحية السهم: ${stockData.eps}
      القيمة السوقية: ${stockData.marketCap}
      
      قدم تحليلك وتوصيتك بتنسيق JSON المطلوب.`;
    } else if (analysisType === 'technical') {
      systemPrompt = `أنت محلل فني خبير. قم بتحليل المؤشرات الفنية للسهم وقدم تقييماً شاملاً باللغة العربية.
      
      يجب أن تكون إجابتك بتنسيق JSON كالتالي:
      {
        "trend": "صاعد" أو "هابط" أو "جانبي",
        "support": رقم مستوى الدعم,
        "resistance": رقم مستوى المقاومة,
        "rsiSignal": "تشبع شرائي" أو "تشبع بيعي" أو "محايد",
        "macdSignal": "إشارة شراء" أو "إشارة بيع" أو "محايد",
        "overallSignal": "إيجابي" أو "سلبي" أو "محايد",
        "analysis": "تحليل فني مختصر في 2-3 جمل"
      }`;
      
      userPrompt = `قم بالتحليل الفني للسهم التالي:
      
      اسم السهم: ${stockData.name}
      السعر الحالي: ${stockData.price}
      أعلى سعر: ${stockData.high}
      أدنى سعر: ${stockData.low}
      الإغلاق السابق: ${stockData.previousClose}
      حجم التداول: ${stockData.volume}
      
      قدم التحليل الفني بتنسيق JSON المطلوب.`;
    } else {
      systemPrompt = `أنت محلل مالي خبير. قدم ملخصاً شاملاً عن السهم باللغة العربية.`;
      userPrompt = `قدم ملخصاً عن السهم ${stockData.name} (${stockData.symbol}) في قطاع ${stockData.sector}.`;
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
