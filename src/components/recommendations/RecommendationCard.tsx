import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Zap,
  ChevronLeft,
  Target,
  Shield,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Clock,
  CircleStop
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SpeculativeStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  recommendation: string;
  aiScore: number;
  riskLevel: 'منخفض' | 'متوسط' | 'مرتفع';
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  [key: string]: any;
}

interface RecommendationCardProps {
  stock: SpeculativeStock;
  index: number;
}

export const RecommendationCard = ({ stock, index }: RecommendationCardProps) => {
  const isPositive = stock.change >= 0;

  const getRecommendationStyle = (rec: string) => {
    if (rec === 'دخول قوي') return { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', icon: TrendingUp };
    if (rec === 'دخول') return { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success', icon: ArrowDownToLine };
    if (rec === 'مراقبة') return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: Eye };
    if (rec === 'انتظار') return { bg: 'bg-muted/20', border: 'border-muted-foreground/20', text: 'text-muted-foreground', icon: Clock };
    if (rec === 'خروج فوري') return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive', icon: CircleStop };
    if (rec === 'خروج') return { bg: 'bg-destructive/5', border: 'border-destructive/20', text: 'text-destructive', icon: ArrowUpFromLine };
    // fallback for old recommendations
    if (rec.includes('شراء')) return { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', icon: TrendingUp };
    if (rec === 'احتفاظ') return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: AlertTriangle };
    return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive', icon: TrendingDown };
  };

  const style = getRecommendationStyle(stock.recommendation);
  const RecIcon = style.icon;

  const targetPrice = stock.targetPrice || (stock.price * 1.03);
  const stopLoss = stock.stopLoss || (stock.price * 0.97);
  const potentialReturn = ((targetPrice / stock.price - 1) * 100).toFixed(1);
  const potentialLoss = ((stopLoss / stock.price - 1) * 100).toFixed(1);
  const riskReward = Math.abs(parseFloat(potentialReturn) / parseFloat(potentialLoss)).toFixed(1);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "glass-effect rounded-2xl p-6 border-2 hover:shadow-glow transition-all duration-300",
        style.border
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", style.bg)}>
            <RecIcon className={cn("w-6 h-6", style.text)} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{stock.name}</h3>
            <p className="text-sm text-muted-foreground">{stock.symbol} • {stock.sector}</p>
          </div>
        </div>
        
        <Badge variant="outline" className={cn("font-semibold", style.text, style.border)}>
          {stock.recommendation}
        </Badge>
      </div>

      {/* Price & Change */}
      <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-secondary/30">
        <div>
          <p className="text-sm text-muted-foreground mb-1">السعر الحالي</p>
          <p className="text-2xl font-bold text-foreground">{stock.price.toFixed(2)} ر.س</p>
        </div>
        <div className="text-left">
          <p className="text-sm text-muted-foreground mb-1">التغير اليوم</p>
          <p className={cn(
            "text-lg font-semibold",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">حجم التداول</span>
        <span className="font-medium text-foreground">{formatVolume(stock.volume || 0)}</span>
      </div>

      {/* Momentum Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">نقاط الزخم</span>
          </div>
          <span className="font-bold text-foreground">{stock.aiScore}/100</span>
        </div>
        <Progress value={stock.aiScore} className="h-2" />
      </div>

      {/* Entry, Target, Stop Loss */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDownToLine className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">دخول</span>
          </div>
          <p className="font-semibold text-foreground text-sm">{(stock.entryPrice || stock.price).toFixed(2)}</p>
        </div>
        <div className="p-2 rounded-lg bg-success/5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-3 h-3 text-success" />
            <span className="text-[10px] text-muted-foreground">هدف</span>
          </div>
          <p className="font-semibold text-success text-sm">{targetPrice.toFixed(2)}</p>
        </div>
        <div className="p-2 rounded-lg bg-destructive/5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-muted-foreground">وقف</span>
          </div>
          <p className="font-semibold text-destructive text-sm">{stopLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Risk/Reward */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">العائد/المخاطرة</span>
          <span className="font-semibold text-foreground">1:{riskReward}</span>
        </div>
        <Badge variant="outline" className={cn(
          "text-xs",
          stock.riskLevel === 'منخفض' && "text-success border-success/30",
          stock.riskLevel === 'متوسط' && "text-warning border-warning/30",
          stock.riskLevel === 'مرتفع' && "text-destructive border-destructive/30"
        )}>
          {stock.riskLevel}
        </Badge>
      </div>

      {/* Action */}
      <Link to={`/stock/${stock.symbol}`}>
        <Button variant="glow" className="w-full">
          عرض التحليل الكامل
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
};
