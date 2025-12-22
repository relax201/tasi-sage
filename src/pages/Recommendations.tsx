import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Filter, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { useAllStocks } from '@/hooks/useStockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'buy' | 'hold' | 'sell';

const getRecommendation = (change: number): string => {
  if (change > 2) return 'شراء قوي';
  if (change > 0) return 'شراء';
  if (change > -2) return 'احتفاظ';
  if (change > -4) return 'بيع';
  return 'بيع قوي';
};

const getAiScore = (change: number, volume: number): number => {
  const baseScore = 50 + (change * 5);
  const volumeBonus = Math.min(volume / 1000000, 10);
  return Math.min(100, Math.max(0, Math.round(baseScore + volumeBonus)));
};

const getRiskLevel = (changePercent: number): 'منخفض' | 'متوسط' | 'مرتفع' => {
  const absChange = Math.abs(changePercent);
  if (absChange < 2) return 'منخفض';
  if (absChange < 5) return 'متوسط';
  return 'مرتفع';
};

const Recommendations = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: stocks, isLoading, error } = useAllStocks();

  const stocksWithRecommendations = (stocks || []).map(stock => ({
    ...stock,
    recommendation: getRecommendation(stock.change) as 'شراء قوي' | 'شراء' | 'احتفاظ' | 'بيع' | 'بيع قوي',
    aiScore: getAiScore(stock.change, stock.volume || 0),
    riskLevel: getRiskLevel(stock.changePercent),
    pe: stock.price / 5, // تقدير مبسط
    eps: 5, // تقدير مبسط
  }));

  const filteredStocks = stocksWithRecommendations
    .filter(stock => {
      if (filter === 'all') return true;
      if (filter === 'buy') return stock.recommendation.includes('شراء');
      if (filter === 'hold') return stock.recommendation === 'احتفاظ';
      if (filter === 'sell') return stock.recommendation.includes('بيع');
      return true;
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'buy', label: 'توصيات الشراء' },
    { value: 'hold', label: 'توصيات الاحتفاظ' },
    { value: 'sell', label: 'توصيات البيع' },
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
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">التوصيات الذكية</h1>
          </div>
          <p className="text-muted-foreground">توصيات مبنية على تحليل الذكاء الاصطناعي للسوق السعودي</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          <Filter className="w-5 h-5 text-muted-foreground" />
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="transition-all duration-300"
            >
              {f.label}
            </Button>
          ))}
        </motion.div>

        {/* Results Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-6"
        >
          عرض {filteredStocks.length} توصية
        </motion.p>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3 text-muted-foreground">جاري تحميل البيانات...</span>
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
