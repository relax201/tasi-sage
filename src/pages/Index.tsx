import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { StockTable } from '@/components/dashboard/StockTable';
import { TopMovers } from '@/components/dashboard/TopMovers';

const Index = () => {
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة شاملة على أداء السوق السعودي</p>
        </motion.div>

        <div className="space-y-8">
          {/* Market Indices */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">المؤشرات الرئيسية</h2>
            <MarketOverview />
          </section>

          {/* Quick Stats */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">إحصائيات سريعة</h2>
            <QuickStats />
          </section>

          {/* Top Movers */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">الأسهم الأكثر نشاطاً</h2>
            <TopMovers />
          </section>

          {/* Stock Table */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">جميع الأسهم</h2>
            <StockTable />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
