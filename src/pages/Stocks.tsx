import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { StockTable } from '@/components/dashboard/StockTable';
import { useAllStocks } from '@/hooks/useStockData';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Stocks = () => {
  const { data: stocks, isLoading, refetch } = useAllStocks();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">قائمة الأسهم</h1>
            <p className="text-muted-foreground">بيانات حية من السوق السعودي</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => refetch()}
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

        <StockTable stocks={stocks || []} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default Stocks;
