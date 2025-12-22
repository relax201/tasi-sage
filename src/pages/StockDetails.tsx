import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StockInfo } from '@/components/stock/StockInfo';
import { StockChart } from '@/components/stock/StockChart';
import { TechnicalIndicators } from '@/components/stock/TechnicalIndicators';
import { AIRecommendation } from '@/components/stock/AIRecommendation';
import { stocks } from '@/data/stocksData';
import { Button } from '@/components/ui/button';

const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const stock = stocks.find(s => s.symbol === symbol);

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
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <Link to="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
          <ArrowRight className="w-4 h-4" />
          <Link to="/stocks" className="hover:text-foreground transition-colors">الأسهم</Link>
          <ArrowRight className="w-4 h-4" />
          <span className="text-foreground">{stock.name}</span>
        </motion.div>

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
