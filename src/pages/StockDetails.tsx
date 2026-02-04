import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StockInfo } from '@/components/stock/StockInfo';
import { StockChart } from '@/components/stock/StockChart';
import { TechnicalIndicators } from '@/components/stock/TechnicalIndicators';
import { AIRecommendation } from '@/components/stock/AIRecommendation';
import { EarningsHistory } from '@/components/stock/EarningsHistory';
import { FavoriteButton } from '@/components/stock/FavoriteButton';
import { PriceAlertDialog } from '@/components/stock/PriceAlertDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStockData, useRefreshStock } from '@/hooks/useStockData';
import { useNotifications } from '@/hooks/useNotifications';

const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { checkAlertsAgainstPrices } = useNotifications();
  
  // Fetch live data
  const { data: stockData, isLoading, error, refetch } = useStockData(symbol || '');
  const { refresh, isRefreshing } = useRefreshStock();

  // Check alerts whenever stock data is updated
  useEffect(() => {
    if (stockData && stockData.price > 0) {
      checkAlertsAgainstPrices([stockData]);
    }
  }, [stockData, checkAlertsAgainstPrices]);

  const handleRefresh = async () => {
    if (symbol) {
      await refresh(symbol);
      refetch();
    }
  };

  // Build stock object from live data
  const stock = stockData ? {
    symbol: symbol || '',
    name: stockData.name || symbol,
    sector: stockData.sector || 'غير محدد',
    price: stockData.price || 0,
    change: stockData.change || 0,
    changePercent: stockData.changePercent || 0,
    volume: stockData.volume || 0,
    high: stockData.high || 0,
    low: stockData.low || 0,
    open: stockData.open || 0,
    previousClose: stockData.previousClose || 0,
    marketCap: stockData.marketCap || 0,
    pe: stockData.peRatio ?? stockData.pe ?? 0,
    eps: stockData.eps ?? 0,
    recommendation: 'احتفاظ' as const,
    riskLevel: 'متوسط' as const,
    aiScore: 50,
    history: stockData.history || [],
  } : null;

  const isLive = !!stockData && stockData.price > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">جاري تحميل بيانات السهم...</p>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">تعذر تحميل بيانات السهم</h1>
          <p className="text-muted-foreground mb-8">
            {error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => refetch()}>إعادة المحاولة</Button>
            <Link to="/">
              <Button variant="outline">العودة للرئيسية</Button>
            </Link>
          </div>
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
            <FavoriteButton 
              stockSymbol={stock.symbol} 
              stockName={stock.name}
              showLabel
            />
            
            <PriceAlertDialog 
              stockSymbol={stock.symbol}
              stockName={stock.name}
              currentPrice={stock.price}
            />

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
                  غير متصل
                </>
              )}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stock Info */}
          <StockInfo stock={stock} />

          {/* Price Chart */}
          <StockChart 
            basePrice={stock.price} 
            symbol={stock.symbol}
          />

          {/* AI Recommendation */}
          <AIRecommendation stock={stock} />

          {/* Earnings History */}
          <EarningsHistory 
            earnings={stockData?.earnings} 
            currentPrice={stock.price}
          />

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
