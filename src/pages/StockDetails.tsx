import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StockInfo } from '@/components/stock/StockInfo';
import { StockChart } from '@/components/stock/StockChart';
import { TechnicalIndicators } from '@/components/stock/TechnicalIndicators';
import { AIRecommendation } from '@/components/stock/AIRecommendation';
import { stocks, type Stock } from '@/data/stocksData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStockQuote, useRefreshStockData } from '@/hooks/useStockData';
import { useToast } from '@/hooks/use-toast';

const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { toast } = useToast();
  const baseStock = stocks.find(s => s.symbol === symbol);
  
  // Fetch live data
  const { data: liveQuote, isLoading: isLoadingQuote, error: quoteError, refetch } = useStockQuote(symbol || '');
  const { refresh, isRefreshing } = useRefreshStockData();
  
  const [liveStock, setLiveStock] = useState<Stock | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Update stock with live data when available
  useEffect(() => {
    if (liveQuote && baseStock) {
      setLiveStock({
        ...baseStock,
        price: liveQuote.price || baseStock.price,
        change: liveQuote.change || baseStock.change,
        changePercent: liveQuote.changePercent || baseStock.changePercent,
        high: liveQuote.high || baseStock.high,
        low: liveQuote.low || baseStock.low,
        volume: liveQuote.volume || baseStock.volume,
      });
      setIsLive(true);
    }
  }, [liveQuote, baseStock]);

  const handleRefresh = async () => {
    if (symbol) {
      const newData = await refresh(symbol);
      if (newData && baseStock) {
        setLiveStock({
          ...baseStock,
          price: newData.price || baseStock.price,
          change: newData.change || baseStock.change,
          changePercent: newData.changePercent || baseStock.changePercent,
          high: newData.high || baseStock.high,
          low: newData.low || baseStock.low,
          volume: newData.volume || baseStock.volume,
        });
        setIsLive(true);
      }
    }
  };

  // Use live stock data if available, otherwise fallback to base stock
  const stock = liveStock || baseStock;

  if (!stock) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">السهم غير موجود</h1>
          <p className="text-muted-foreground mb-8">لم يتم العثور على السهم المطلوب</p>
          <Link to="/">
            <Button>العودة للرئيسية</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
      </div>
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
            <ArrowRight className="w-4 h-4" />
            <Link to="/stocks" className="hover:text-foreground transition-colors">الأسهم</Link>
            <ArrowRight className="w-4 h-4" />
            <span className="text-foreground">{stock.name}</span>
          </motion.div>

          <div className="flex items-center gap-3">
            {/* Live Status Badge */}
            <Badge 
              variant="outline" 
              className={isLive ? "text-success border-success/30 bg-success/10" : "text-muted-foreground"}
            >
              {isLive ? (
                <>
                  <Wifi className="w-3 h-3 ml-1" />
                  بيانات حية
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 ml-1" />
                  بيانات تجريبية
                </>
              )}
            </Badge>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingQuote}
              className="gap-2"
            >
              {isRefreshing || isLoadingQuote ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  تحديث السعر
                </>
              )}
            </Button>
          </div>
        </div>

        {/* API Error Notice */}
        {quoteError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30"
          >
            <p className="text-sm text-warning">
              ⚠️ تعذر جلب البيانات الحية. يتم عرض البيانات التجريبية حالياً. 
              <span className="text-muted-foreground mr-2">
                (تأكد من صحة مفتاح API وأن الخدمة متاحة)
              </span>
            </p>
          </motion.div>
        )}

        <div className="space-y-8">
          {/* Stock Info */}
          <StockInfo stock={stock} />

          {/* Price Chart */}
          <StockChart basePrice={stock.price} symbol={stock.symbol} />

          {/* AI Recommendation */}
          <AIRecommendation stock={stock} />

          {/* Technical Indicators */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">المؤشرات الفنية</h2>
            <TechnicalIndicators basePrice={stock.price} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default StockDetails;
