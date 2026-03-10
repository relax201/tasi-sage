import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SAHMK_BASE = 'https://app.sahmk.sa/api/v1';

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
  const signalValue = macdValue * 0.8;
  return { macd: macdValue, signal: signalValue, histogram: macdValue - signalValue };
}

function calculateSMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) throw new Error('STOCK_API_KEY not configured');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log(`Analyzing ${stocks.length} stocks for speculative recommendations...`);

    const sortedByMomentum = [...stocks].sort((a: any, b: any) => {
      const scoreA = Math.abs(a.changePercent) * (a.volume || 1);
      const scoreB = Math.abs(b.changePercent) * (b.volume || 1);
      return scoreB - scoreA;
    }).slice(0, 15);

    const technicalResults: any[] = [];

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
        } else {
          await histResponse.text();
        }

        technicalResults.push({
          symbol: stock.symbol, name: stock.name, sector: stock.sector,
          price: stock.price, change: stock.change, changePercent: stock.changePercent,
          volume: stock.volume, high: stock.high, low: stock.low,
          open: stock.open, previousClose: stock.previousClose,
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

    const stocksSummary = technicalResults.map(s => 
      `${s.name} (${s.symbol}): سعر=${s.price} تغير=${s.changePercent}% حجم=${s.volume} RSI=${s.rsi} MACD=${s.macd} SMA20=${s.sma20} SMA50=${s.sma50} نسبة_الحجم=${s.volumeRatio}x`
    ).join('\n');

    const systemPrompt = `أنت محلل فني ومضارب خبير في السوق السعودي (تاسي) مع خبرة 10+ سنوات في المضاربة اليومية.

قواعد التحليل المضاربي:
1. RSI فوق 70 = تشبع شرائي (خروج أو انتظار)، تحت 30 = تشبع بيعي (فرصة دخول)
2. MACD موجب وصاعد = إشارة صعودية، سالب وهابط = إشارة هبوطية
3. السعر فوق SMA20 = اتجاه صاعد قصير، فوق SMA50 = اتجاه صاعد متوسط
4. حجم تداول أعلى من المتوسط بـ 1.5x+ = تأكيد للحركة
5. نقطة الدخول يجب أن تكون عند أقرب دعم أو السعر الحالي
6. الهدف = أقرب مقاومة أو 3-5% من نقطة الدخول
7. وقف الخسارة = 2-3% تحت نقطة الدخول
8. كن حذراً وواقعياً - لا تبالغ في التفاؤل

أجب بتنسيق JSON فقط بدون أي نص إضافي. يجب أن يكون الجواب مصفوفة JSON تحتوي على كائنات بالحقول التالية لكل سهم:
symbol, signal (أحد: "دخول قوي", "دخول", "مراقبة", "انتظار", "خروج", "خروج فوري"), entryPrice, targetPrice, stopLoss, confidence (0-100), reasoning, technicalSignal (أحد: "صعودي قوي", "صعودي", "محايد", "هبوطي", "هبوطي قوي"), riskLevel (أحد: "منخفض", "متوسط", "مرتفع"), momentum (أحد: "قوي", "متوسط", "ضعيف")`;

    const userPrompt = `حلل الأسهم التالية وقدم توصيات مضاربية لكل سهم. أجب بمصفوفة JSON فقط:\n\n${stocksSummary}`;

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      throw new Error('AI analysis failed');
    }

    const aiResult = await aiResponse.json();
    let recommendations: any[] = [];

    const content = aiResult.choices?.[0]?.message?.content || '';
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e, 'Content:', content.substring(0, 500));
    }

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
