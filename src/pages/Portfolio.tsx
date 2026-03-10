import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, RefreshCw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAllStocks } from '@/hooks/useStockData';
import { PortfolioSummaryCards } from '@/components/portfolio/PortfolioSummaryCards';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { TransactionHistory } from '@/components/portfolio/TransactionHistory';
import { AddTransactionDialog } from '@/components/portfolio/AddTransactionDialog';

const Portfolio = () => {
  const {
    transactions,
    isLoading,
    isAuthenticated,
    addTransaction,
    deleteTransaction,
    getHoldings,
    getSummary,
    refresh,
  } = usePortfolio();

  const { data: liveStocks } = useAllStocks();

  const currentPrices = useMemo(() => {
    const map: Record<string, number> = {};
    liveStocks?.forEach((s) => {
      map[s.symbol] = s.price;
    });
    return map;
  }, [liveStocks]);

  const holdings = useMemo(() => getHoldings(currentPrices), [getHoldings, currentPrices]);
  const summary = useMemo(() => getSummary(currentPrices), [getSummary, currentPrices]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Briefcase className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-bold">سجل دخولك لعرض المحفظة</h2>
          <Link to="/auth">
            <Button className="gap-2">
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">المحفظة الاستثمارية</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <AddTransactionDialog onSubmit={addTransaction} />
          </div>
        </motion.div>

        <div className="space-y-6">
          <PortfolioSummaryCards summary={summary} />

          <Tabs defaultValue="holdings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="holdings">الأسهم المملوكة</TabsTrigger>
              <TabsTrigger value="history">سجل العمليات</TabsTrigger>
            </TabsList>

            <TabsContent value="holdings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">أسهمك الحالية</CardTitle>
                </CardHeader>
                <CardContent>
                  <HoldingsTable holdings={holdings} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">سجل العمليات</CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionHistory transactions={transactions} onDelete={deleteTransaction} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
