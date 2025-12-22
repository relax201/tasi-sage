import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { StockTable } from '@/components/dashboard/StockTable';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { useAllStocks, useMarketIndices } from '@/hooks/useStockData';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: stocks, isLoading: stocksLoading, error: stocksError, refetch: refetchStocks } = useAllStocks();
  const { data: indices, isLoading: indicesLoading, error: indicesError, refetch: refetchIndices } = useMarketIndices();

  const isLoading = stocksLoading || indicesLoading;
  const hasError = stocksError || indicesError;

  const handleRefresh = () => {
    refetchStocks();
    refetchIndices();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
      </div>
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
            <p className="text-muted-foreground">بيانات حية من السوق السعودي</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            تحديث
          </Button>
        </motion.div>

        {/* Loading State */}
        {isLoading && !stocks && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جاري تحميل بيانات السوق...</p>
          </div>
        )}

        {/* Error State */}
        {hasError && !stocks && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-foreground font-semibold mb-2">تعذر تحميل البيانات</p>
            <p className="text-muted-foreground mb-4">حدث خطأ أثناء جلب بيانات السوق</p>
            <Button onClick={handleRefresh}>إعادة المحاولة</Button>
          </div>
        )}

        {/* Content */}
        {(stocks || !isLoading) && (
          <div className="space-y-8">
            {/* Market Indices */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">المؤشرات الرئيسية</h2>
              <MarketOverview indices={indices || []} isLoading={indicesLoading} />
            </section>

            {/* Quick Stats */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">إحصائيات سريعة</h2>
              <QuickStats stocks={stocks || []} />
            </section>

            {/* Top Movers */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">الأسهم الأكثر نشاطاً</h2>
              <TopMovers stocks={stocks || []} />
            </section>

            {/* Stock Table */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">جميع الأسهم</h2>
              <StockTable stocks={stocks || []} isLoading={stocksLoading} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
