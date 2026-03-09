import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Filter, Loader2, Zap, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { useAllStocks } from '@/hooks/useStockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LiveStock } from '@/lib/api/stockApi';

type FilterType = 'all' | 'buy' | 'hold' | 'sell';

// === خوارزمية التوصيات المضاربية ===

const getMomentumScore = (stock: LiveStock): number => {
  // زخم السعر: التغير اليومي (وزن 40%)
  const priceScore = Math.min(Math.max(stock.changePercent * 10 + 50, 0), 100);
  
  // زخم الحجم: حجم تداول مرتفع = إشارة أقوى (وزن 30%)
  const avgVolume = 2000000; // متوسط تقريبي
  const volumeRatio = (stock.volume || 0) / avgVolume;
  const volumeScore = Math.min(volumeRatio * 30 + 20, 100);
  
  // قوة الاتجاه: العلاقة بين الافتتاح والإغلاق (وزن 15%)
  const openCloseSpread = stock.open ? ((stock.price - stock.open) / stock.open) * 100 : 0;
  const trendScore = Math.min(Math.max(openCloseSpread * 15 + 50, 0), 100);
  
  // نطاق التداول اليومي (وزن 15%)
  const dayRange = stock.high && stock.low ? ((stock.high - stock.low) / stock.low) * 100 : 0;
  const volatilityScore = Math.min(dayRange * 10 + 30, 100);
  
  return Math.round(priceScore * 0.4 + volumeScore * 0.3 + trendScore * 0.15 + volatilityScore * 0.15);
};

const getSpeculativeRecommendation = (stock: LiveStock, score: number): string => {
  const volumeHigh = (stock.volume || 0) > 3000000;
  const strongMove = Math.abs(stock.changePercent) > 3;
  
  if (stock.changePercent > 3 && volumeHigh) return 'دخول قوي';
  if (stock.changePercent > 1.5 && score > 60) return 'دخول';
  if (stock.changePercent > 0 && stock.changePercent <= 1.5) return 'مراقبة';
  if (stock.changePercent > -2 && stock.changePercent <= 0) return 'انتظار';
  if (stock.changePercent <= -3 && volumeHigh) return 'خروج فوري';
  return 'خروج';
};

const getSpeculativeRisk = (stock: LiveStock): 'منخفض' | 'متوسط' | 'مرتفع' => {
  const absChange = Math.abs(stock.changePercent);
  const volumeHigh = (stock.volume || 0) > 5000000;
  
  if (absChange > 5 || (absChange > 3 && volumeHigh)) return 'مرتفع';
  if (absChange > 2 || volumeHigh) return 'متوسط';
  return 'منخفض';
};

const getEntryPrice = (stock: LiveStock, recommendation: string): number => {
  if (recommendation.includes('دخول')) {
    // نقطة الدخول = السعر الحالي أو أقل قليلاً
    return parseFloat((stock.price * 0.995).toFixed(2));
  }
  return stock.price;
};

const getTargetPrice = (stock: LiveStock, score: number): number => {
  const multiplier = score > 70 ? 1.05 : score > 50 ? 1.03 : 1.015;
  return parseFloat((stock.price * multiplier).toFixed(2));
};

const getStopLoss = (stock: LiveStock): number => {
  return parseFloat((stock.price * 0.97).toFixed(2));
};

const Recommendations = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: stocks, isLoading, error } = useAllStocks();

  const stocksWithRecommendations = (stocks || []).map(stock => {
    const momentumScore = getMomentumScore(stock);
    const recommendation = getSpeculativeRecommendation(stock, momentumScore);
    const riskLevel = getSpeculativeRisk(stock);
    const entryPrice = getEntryPrice(stock, recommendation);
    const targetPrice = getTargetPrice(stock, momentumScore);
    const stopLoss = getStopLoss(stock);
    
    return {
      ...stock,
      recommendation: recommendation as any,
      aiScore: momentumScore,
      riskLevel,
      entryPrice,
      targetPrice,
      stopLoss,
      pe: stock.price / 5,
      eps: 5,
    };
  });

  const filteredStocks = stocksWithRecommendations
    .filter(stock => {
      if (filter === 'all') return true;
      if (filter === 'buy') return stock.recommendation.includes('دخول');
      if (filter === 'hold') return stock.recommendation === 'مراقبة' || stock.recommendation === 'انتظار';
      if (filter === 'sell') return stock.recommendation.includes('خروج');
      return true;
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  const filters: { value: FilterType; label: string; icon: any; count: number }[] = [
    { value: 'all', label: 'الكل', icon: BarChart3, count: stocksWithRecommendations.length },
    { value: 'buy', label: 'فرص الدخول', icon: TrendingUp, count: stocksWithRecommendations.filter(s => s.recommendation.includes('دخول')).length },
    { value: 'hold', label: 'مراقبة وانتظار', icon: Zap, count: stocksWithRecommendations.filter(s => s.recommendation === 'مراقبة' || s.recommendation === 'انتظار').length },
    { value: 'sell', label: 'إشارات خروج', icon: TrendingDown, count: stocksWithRecommendations.filter(s => s.recommendation.includes('خروج')).length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Background Glow */}
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">توصيات المضاربة</h1>
          </div>
          <p className="text-muted-foreground">إشارات مضاربية قصيرة المدى مبنية على الزخم وحجم التداول وحركة السعر</p>
          <p className="text-xs text-muted-foreground/60 mt-1">⚠️ هذه التوصيات للمضاربة اليومية فقط وليست نصيحة استثمارية</p>
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

        {/* Results Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-6"
        >
          عرض {filteredStocks.length} إشارة مضاربية
        </motion.p>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3 text-muted-foreground">جاري تحليل الزخم...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20 text-destructive">
            حدث خطأ في تحميل البيانات
          </div>
        )}

        {/* Recommendations Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStocks.map((stock, index) => (
              <RecommendationCard key={stock.symbol} stock={stock} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recommendations;
