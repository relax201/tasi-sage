import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

const stats = [
  {
    label: 'الأسهم الصاعدة',
    value: '128',
    change: '+12',
    icon: TrendingUp,
    color: 'success',
  },
  {
    label: 'الأسهم الهابطة',
    value: '67',
    change: '-8',
    icon: TrendingDown,
    color: 'destructive',
  },
  {
    label: 'حجم التداول',
    value: '4.2B',
    change: '+15%',
    icon: BarChart3,
    color: 'primary',
  },
  {
    label: 'الصفقات',
    value: '156K',
    change: '+5%',
    icon: Activity,
    color: 'warning',
  },
];

export const QuickStats = () => {
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
            <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>
            <span className={`text-xs font-medium text-${stat.color}`}>
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
