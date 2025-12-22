import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Activity
} from 'lucide-react';
import { type LiveStock } from '@/lib/api/stockApi';

interface QuickStatsProps {
  stocks: LiveStock[];
}

export const QuickStats = ({ stocks }: QuickStatsProps) => {
  const gainers = stocks.filter(s => s.change > 0).length;
  const losers = stocks.filter(s => s.change < 0).length;
  const totalVolume = stocks.reduce((sum, s) => sum + (s.volume || 0), 0);
  const unchanged = stocks.filter(s => s.change === 0).length;

  const stats = [
    {
      label: 'الأسهم الصاعدة',
      value: gainers.toString(),
      change: `+${gainers}`,
      icon: TrendingUp,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      changeColor: 'text-success',
    },
    {
      label: 'الأسهم الهابطة',
      value: losers.toString(),
      change: `-${losers}`,
      icon: TrendingDown,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      changeColor: 'text-destructive',
    },
    {
      label: 'حجم التداول',
      value: totalVolume > 1000000000 
        ? `${(totalVolume / 1000000000).toFixed(1)}B`
        : `${(totalVolume / 1000000).toFixed(1)}M`,
      change: 'إجمالي',
      icon: BarChart3,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      changeColor: 'text-primary',
    },
    {
      label: 'بدون تغيير',
      value: unchanged.toString(),
      change: '~',
      icon: Activity,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      changeColor: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="glass-effect rounded-xl p-4 hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <span className={`text-xs font-medium ${stat.changeColor}`}>
              {stat.change}
            </span>
          </div>
          
          <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};
