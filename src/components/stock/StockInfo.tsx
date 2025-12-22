import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Building2, DollarSign, BarChart3, Activity } from 'lucide-react';
import { type Stock } from '@/data/stocksData';
import { cn } from '@/lib/utils';

interface StockInfoProps {
  stock: Stock;
}

export const StockInfo = ({ stock }: StockInfoProps) => {
  const isPositive = stock.change >= 0;

  const stats = [
    { label: 'الافتتاح', value: `${stock.open.toFixed(2)} ر.س` },
    { label: 'الأعلى', value: `${stock.high.toFixed(2)} ر.س`, highlight: 'success' },
    { label: 'الأدنى', value: `${stock.low.toFixed(2)} ر.س`, highlight: 'destructive' },
    { label: 'الإغلاق السابق', value: `${stock.previousClose.toFixed(2)} ر.س` },
    { label: 'الحجم', value: `${(stock.volume / 1000000).toFixed(2)}M` },
    {
      label: 'القيمة السوقية',
      value: stock.marketCap > 0 ? `${(stock.marketCap / 1000000000).toFixed(1)}B ر.س` : 'غير متوفر',
    },
    { label: 'مكرر الربحية', value: stock.pe > 0 ? stock.pe.toFixed(2) : 'غير متوفر' },
    { label: 'ربحية السهم', value: stock.eps !== 0 ? `${stock.eps.toFixed(2)} ر.س` : 'غير متوفر' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{stock.name}</h1>
            <span className="px-3 py-1 rounded-lg bg-secondary text-muted-foreground text-sm">
              {stock.symbol}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span>{stock.sector}</span>
          </div>
        </div>

        <div className="text-left">
          <p className="text-3xl font-bold text-foreground mb-1">
            {stock.price.toFixed(2)} <span className="text-lg text-muted-foreground">ر.س</span>
          </p>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <span className={cn(
              "font-semibold",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-xl bg-secondary/50"
          >
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className={cn(
              "text-lg font-semibold",
              stat.highlight === 'success' && "text-success",
              stat.highlight === 'destructive' && "text-destructive",
              !stat.highlight && "text-foreground"
            )}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
