import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { StockTable } from '@/components/dashboard/StockTable';

const Stocks = () => {
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">قائمة الأسهم</h1>
          <p className="text-muted-foreground">استعرض جميع أسهم السوق السعودي مع التحليلات والتوصيات</p>
        </motion.div>

        <StockTable />
      </main>
    </div>
  );
};

export default Stocks;
