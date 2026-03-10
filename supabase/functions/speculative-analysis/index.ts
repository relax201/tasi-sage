import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SAHMK_BASE = 'https://app.sahmk.sa/api/v1';

// حساب RSI من البيانات التاريخية
function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// حساب MACD
function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };
  
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdValue = ema12 - ema26;
  const signalValue = macdValue * 0.8; // تقريب
  
  return { macd: macdValue, signal: signalValue, histogram: macdValue - signalValue };
}

// حساب المتوسطات المتحركة
function calculateSMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// حساب متوسط حجم التداول
function calculateAvgVolume(volumes: number[], period = 20): number {
  if (!volumes.length) return 0;
  const slice = volumes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { stocks } = await req.json();
    const apiKey = Deno.env.get('STOCK_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) throw new Error('STOCK_API_KEY not configured');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    console.log(`Analyzing ${stocks.length} stocks for speculative recommendations...`);

    // الخطوة 1: جلب البيانات التاريخية لأعلى 15 سهم بالزخم
    const sortedByMomentum = [...stocks].sort((a: any, b: any) => {
      const scoreA = Math.abs(a.changePercent) * (a.volume || 1);
      const scoreB = Math.abs(b.changePercent) * (b.volume || 1);
      return scoreB - scoreA;
    }).slice(0, 15);

    const technicalResults: any[] = [];

    // جلب التاريخ وحساب المؤشرات الفنية لكل سهم
    for (const stock of sortedByMomentum) {
      try {
        const histResponse = await fetch(`${SAHMK_BASE}/history/${stock.symbol}/`, {
          headers: { 'X-API-Key': apiKey }
        });
        
        let rsi = 50, macd = 0, macdSignal = 0, sma20 = stock.price, sma50 = stock.price;
        let avgVolume = stock.volume || 0;
        let volumeRatio = 1;
        
        if (histResponse.ok) {
          const histData = await histResponse.json();
          const history = Array.isArray(histData) ? histData : 
                         histData.data ? histData.data : 
                         histData.history ? histData.history : [];
          
          if (history.length > 5) {
            const closes = history.map((h: any) => parseFloat(h.close || h.price || 0)).filter((c: number) => c > 0);
            const volumes = history.map((h: any) => parseFloat(h.volume || 0));
            
            if (closes.length > 14) {
              rsi = calculateRSI(closes);
              const macdResult = calculateMACD(closes);
              macd = macdResult.macd;
              macdSignal = macdResult.signal;
              sma20 = calculateSMA(closes, 20);
              sma50 = calculateSMA(closes, 50);
              avgVolume = calculateAvgVolume(volumes);
              volumeRatio = avgVolume > 0 ? (stock.volume || 0) / avgVolume : 1;
            }
          }
        }

        technicalResults.push({
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          high: stock.high,
          low: stock.low,
          open: stock.open,
          previousClose: stock.previousClose,
          // المؤشرات الفنية الحقيقية
          rsi: Math.round(rsi * 100) / 100,
          macd: Math.round(macd * 100) / 100,
          macdSignal: Math.round(macdSignal * 100) / 100,
          sma20: Math.round(sma20 * 100) / 100,
          sma50: Math.round(sma50 * 100) / 100,
          volumeRatio: Math.round(volumeRatio * 100) / 100,
          avgVolume: Math.round(avgVolume),
        });
      } catch (e) {
        console.error(`Error fetching history for ${stock.symbol}:`, e);
        technicalResults.push({
          ...stock,
          rsi: 50, macd: 0, macdSignal: 0, sma20: stock.price, sma50: stock.price,
          volumeRatio: 1, avgVolume: stock.volume || 0,
        });
      }
    }

    console.log(`Computed technicals for ${technicalResults.length} stocks, calling AI...`);

    // الخطوة 2: إرسال للذكاء الاصطناعي للتحليل المضاربي
    const stocksSummary = technicalResults.map(s => 
      `${s.name} (${s.symbol}): سعر=${s.price} تغير=${s.changePercent}% حجم=${s.volume} RSI=${s.rsi} MACD=${s.macd} SMA20=${s.sma20} SMA50=${s.sma50} نسبة_الحجم=${s.volumeRatio}x`
    ).join('\n');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{
          type: "function",
          function: {
            name: "speculative_recommendations",
            description: "تقديم توصيات مضاربية لأسهم السوق السعودي",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      signal: { type: "string", enum: ["دخول قوي", "دخول", "مراقبة", "انتظار", "خروج", "خروج فوري"] },
                      entryPrice: { type: "number" },
                      targetPrice: { type: "number" },
                      stopLoss: { type: "number" },
                      confidence: { type: "number", description: "0-100" },
                      reasoning: { type: "string", description: "سبب التوصية في جملة واحدة" },
                      technicalSignal: { type: "string", enum: ["صعودي قوي", "صعودي", "محايد", "هبوطي", "هبوطي قوي"] },
                      riskLevel: { type: "string", enum: ["منخفض", "متوسط", "مرتفع"] },
                      momentum: { type: "string", enum: ["قوي", "متوسط", "ضعيف"] },
                    },
                    required: ["symbol", "signal", "entryPrice", "targetPrice", "stopLoss", "confidence", "reasoning", "technicalSignal", "riskLevel", "momentum"],
                    additionalProperties: false
                  }
                }
              },
              required: ["recommendations"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "speculative_recommendations" } },
        messages: [
          {
            role: 'system',
            content: `أنت محلل فني ومضارب خبير في السوق السعودي (تاسي) مع خبرة 10+ سنوات في المضاربة اليومية.

قواعد التحليل المضاربي:
1. RSI فوق 70 = تشبع شرائي (خروج أو انتظار)، تحت 30 = تشبع بيعي (فرصة دخول)
2. MACD موجب وصاعد = إشارة صعودية، سالب وهابط = إشارة هبوطية
3. السعر فوق SMA20 = اتجاه صاعد قصير، فوق SMA50 = اتجاه صاعد متوسط
4. حجم تداول أعلى من المتوسط بـ 1.5x+ = تأكيد للحركة
5. نقطة الدخول يجب أن تكون عند أقرب دعم أو السعر الحالي
6. الهدف = أقرب مقاومة أو 3-5% من نقطة الدخول
7. وقف الخسارة = 2-3% تحت نقطة الدخول
8. كن حذراً وواقعياً - لا تبالغ في التفاؤل

حلل كل سهم بناءً على المؤشرات الفنية الحقيقية المقدمة وقدم توصية مضاربية دقيقة.`
          },
          {
            role: 'user',
            content: `حلل الأسهم التالية وقدم توصيات مضاربية لكل سهم:\n\n${stocksSummary}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز حد الاستخدام، حاول لاحقاً' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد للحساب' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error('AI analysis failed');
    }

    const aiResult = await aiResponse.json();
    let recommendations: any[] = [];

    // استخراج النتائج من tool_calls
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        recommendations = parsed.recommendations || [];
      } catch (e) {
        console.error('Failed to parse tool call:', e);
      }
    }

    // دمج المؤشرات الفنية مع توصيات AI
    const finalResults = technicalResults.map(stock => {
      const aiRec = recommendations.find((r: any) => r.symbol === stock.symbol);
      return {
        ...stock,
        aiSignal: aiRec?.signal || 'مراقبة',
        aiEntryPrice: aiRec?.entryPrice || stock.price,
        aiTargetPrice: aiRec?.targetPrice || stock.price * 1.03,
        aiStopLoss: aiRec?.stopLoss || stock.price * 0.97,
        aiConfidence: aiRec?.confidence || 50,
        aiReasoning: aiRec?.reasoning || '',
        aiTechnicalSignal: aiRec?.technicalSignal || 'محايد',
        aiRiskLevel: aiRec?.riskLevel || 'متوسط',
        aiMomentum: aiRec?.momentum || 'متوسط',
      };
    });

    console.log(`Successfully analyzed ${finalResults.length} stocks`);

    return new Response(
      JSON.stringify({ success: true, data: finalResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Speculative analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
