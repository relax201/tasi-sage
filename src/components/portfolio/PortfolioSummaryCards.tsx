import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PortfolioSummary } from '@/hooks/usePortfolio';

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
}

export const PortfolioSummaryCards = ({ summary }: PortfolioSummaryCardsProps) => {
  const isProfit = summary.totalProfitLoss >= 0;

  const cards = [
    {
      title: 'إجمالي المستثمر',
      value: `${summary.totalInvested.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ريال`,
      icon: Wallet,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'القيمة الحالية',
      value: `${summary.totalCurrentValue.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ريال`,
      icon: BarChart3,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'الربح / الخسارة',
      value: `${isProfit ? '+' : ''}${summary.totalProfitLoss.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ريال`,
      subtitle: `${isProfit ? '+' : ''}${summary.totalProfitLossPercent.toFixed(2)}%`,
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-emerald-500' : 'text-red-500',
      bg: isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      title: 'عدد الأسهم',
      value: summary.holdingsCount.toString(),
      icon: PieChart,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${card.title === 'الربح / الخسارة' ? card.color : ''}`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className={`text-sm font-medium ${card.color}`}>{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
