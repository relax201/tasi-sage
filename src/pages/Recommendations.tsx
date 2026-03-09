import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Filter, Loader2, TrendingUp, TrendingDown, BarChart3, RefreshCw, Activity } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { useAllStocks } from '@/hooks/useStockData';
import { getSpeculativeAnalysis, type SpeculativeResult } from '@/lib/api/stockApi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type FilterType = 'all' | 'buy' | 'hold' | 'sell';

const Recommendations = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: stocks, isLoading: isLoadingStocks } = useAllStocks();
  const [aiResults, setAiResults] = useState<SpeculativeResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!stocks?.length) return;
    setIsAnalyzing(true);
    try {
      const results = await getSpeculativeAnalysis(stocks);
      setAiResults(results);
      setHasAnalyzed(true);
      toast({ title: 'تم التحليل', description: `تم تحليل ${results.length} سهم بنجاح` });
    } catch (error: any) {
      toast({ title: 'خطأ في التحليل', description: error.message || 'فشل التحليل', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Build display data - use AI results if available, otherwise basic momentum
  const displayStocks = hasAnalyzed ? aiResults.map(stock => ({
    ...stock,
    recommendation: stock.aiSignal,
    aiScore: stock.aiConfidence,
    riskLevel: stock.aiRiskLevel as 'منخفض' | 'متوسط' | 'مرتفع',
    entryPrice: stock.aiEntryPrice,
    targetPrice: stock.aiTargetPrice,
    stopLoss: stock.aiStopLoss,
    reasoning: stock.aiReasoning,
    technicalSignal: stock.aiTechnicalSignal,
    momentum: stock.aiMomentum,
  })) : (stocks || []).map(stock => {
    const score = Math.min(100, Math.max(0, Math.round(50 + stock.changePercent * 5 + Math.min((stock.volume || 0) / 1000000, 10))));
    return {
      ...stock,
      recommendation: stock.changePercent > 3 && (stock.volume || 0) > 3000000 ? 'دخول قوي' :
        stock.changePercent > 1.5 ? 'دخول' :
        stock.changePercent > 0 ? 'مراقبة' :
        stock.changePercent > -2 ? 'انتظار' :
        stock.changePercent <= -3 ? 'خروج فوري' : 'خروج',
      aiScore: score,
      riskLevel: (Math.abs(stock.changePercent) > 5 ? 'مرتفع' : Math.abs(stock.changePercent) > 2 ? 'متوسط' : 'منخفض') as 'منخفض' | 'متوسط' | 'مرتفع',
      entryPrice: stock.price * 0.995,
      targetPrice: stock.price * (score > 70 ? 1.05 : 1.03),
      stopLoss: stock.price * 0.97,
      reasoning: '',
      technicalSignal: '',
      momentum: '',
      rsi: 0,
      macd: 0,
      sma20: 0,
      sma50: 0,
      volumeRatio: 0,
    };
  });

  const filteredStocks = displayStocks
    .filter(stock => {
      if (filter === 'all') return true;
      if (filter === 'buy') return stock.recommendation.includes('دخول');
      if (filter === 'hold') return stock.recommendation === 'مراقبة' || stock.recommendation === 'انتظار';
      if (filter === 'sell') return stock.recommendation.includes('خروج');
      return true;
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  const filters: { value: FilterType; label: string; icon: any; count: number }[] = [
    { value: 'all', label: 'الكل', icon: BarChart3, count: displayStocks.length },
    { value: 'buy', label: 'فرص الدخول', icon: TrendingUp, count: displayStocks.filter(s => s.recommendation.includes('دخول')).length },
    { value: 'hold', label: 'مراقبة وانتظار', icon: Activity, count: displayStocks.filter(s => s.recommendation === 'مراقبة' || s.recommendation === 'انتظار').length },
    { value: 'sell', label: 'إشارات خروج', icon: TrendingDown, count: displayStocks.filter(s => s.recommendation.includes('خروج')).length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
      </div>
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">توصيات المضاربة</h1>
                <p className="text-muted-foreground text-sm">إشارات مضاربية قصيرة المدى مبنية على التحليل الفني والذكاء الاصطناعي</p>
              </div>
            </div>
            
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isLoadingStocks || !stocks?.length}
              className="gap-2"
              variant={hasAnalyzed ? 'outline' : 'default'}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحليل بالذكاء الاصطناعي...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {hasAnalyzed ? 'إعادة التحليل' : '🤖 تحليل بالذكاء الاصطناعي'}
                </>
              )}
            </Button>
          </div>
          
          {!hasAnalyzed && (
            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
              💡 اضغط على زر "تحليل بالذكاء الاصطناعي" لجلب مؤشرات فنية حقيقية (RSI, MACD, SMA) وتوصيات AI متقدمة لأعلى 15 سهم بالزخم
            </div>
          )}
          
          {hasAnalyzed && (
            <div className="mt-3 p-3 rounded-lg bg-success/5 border border-success/10 text-sm text-muted-foreground">
              ✅ التوصيات مبنية على: مؤشر RSI الحقيقي، MACD، المتوسطات المتحركة (SMA20/50)، مقارنة الحجم بالمتوسط، وتحليل AI
            </div>
          )}

          <p className="text-xs text-muted-foreground/60 mt-2">⚠️ هذه التوصيات للمضاربة اليومية فقط وليست نصيحة استثمارية</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          <Filter className="w-5 h-5 text-muted-foreground" />
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <Button
                key={f.value}
                variant={filter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="transition-all duration-300 gap-2"
              >
                <Icon className="w-4 h-4" />
                {f.label}
                <span className="text-xs opacity-70">({f.count})</span>
              </Button>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-6"
        >
          عرض {filteredStocks.length} إشارة مضاربية {hasAnalyzed ? '(تحليل AI + فني)' : '(تحليل أولي)'}
        </motion.p>

        {(isLoadingStocks || isAnalyzing) && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-muted-foreground">
              {isAnalyzing ? 'جاري حساب المؤشرات الفنية وتحليل AI...' : 'جاري تحميل البيانات...'}
            </span>
          </div>
        )}

        {!isLoadingStocks && !isAnalyzing && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStocks.map((stock, index) => (
              <RecommendationCard key={stock.symbol} stock={stock} index={index} hasAI={hasAnalyzed} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recommendations;
