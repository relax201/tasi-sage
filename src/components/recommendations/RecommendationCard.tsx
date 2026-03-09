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
  CircleStop,
  Activity,
  BarChart3
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
  reasoning?: string;
  technicalSignal?: string;
  momentum?: string;
  rsi?: number;
  macd?: number;
  sma20?: number;
  sma50?: number;
  volumeRatio?: number;
  [key: string]: any;
}

interface RecommendationCardProps {
  stock: SpeculativeStock;
  index: number;
  hasAI?: boolean;
}

export const RecommendationCard = ({ stock, index, hasAI }: RecommendationCardProps) => {
  const isPositive = stock.change >= 0;

  const getRecommendationStyle = (rec: string) => {
    if (rec === 'دخول قوي') return { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', icon: TrendingUp };
    if (rec === 'دخول') return { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success', icon: ArrowDownToLine };
    if (rec === 'مراقبة') return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: Eye };
    if (rec === 'انتظار') return { bg: 'bg-muted/20', border: 'border-muted-foreground/20', text: 'text-muted-foreground', icon: Clock };
    if (rec === 'خروج فوري') return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive', icon: CircleStop };
    if (rec === 'خروج') return { bg: 'bg-destructive/5', border: 'border-destructive/20', text: 'text-destructive', icon: ArrowUpFromLine };
    return { bg: 'bg-muted/10', border: 'border-muted-foreground/20', text: 'text-muted-foreground', icon: AlertTriangle };
  };

  const style = getRecommendationStyle(stock.recommendation);
  const RecIcon = style.icon;

  const targetPrice = stock.targetPrice || stock.price * 1.03;
  const stopLoss = stock.stopLoss || stock.price * 0.97;
  const potentialReturn = ((targetPrice / stock.price - 1) * 100).toFixed(1);
  const potentialLoss = ((stopLoss / stock.price - 1) * 100).toFixed(1);
  const riskReward = Math.abs(parseFloat(potentialReturn) / parseFloat(potentialLoss) || 1).toFixed(1);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-destructive';
    if (rsi < 30) return 'text-success';
    return 'text-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "glass-effect rounded-2xl p-5 border-2 hover:shadow-glow transition-all duration-300",
        style.border
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", style.bg)}>
            <RecIcon className={cn("w-5 h-5", style.text)} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground leading-tight">{stock.name}</h3>
            <p className="text-xs text-muted-foreground">{stock.symbol} • {stock.sector}</p>
          </div>
        </div>
        
        <Badge variant="outline" className={cn("font-semibold text-xs", style.text, style.border)}>
          {stock.recommendation}
        </Badge>
      </div>

      {/* Price & Change */}
      <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-secondary/30">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">السعر الحالي</p>
          <p className="text-xl font-bold text-foreground">{stock.price.toFixed(2)} ر.س</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-muted-foreground mb-0.5">التغير</p>
          <p className={cn("text-base font-semibold", isPositive ? "text-success" : "text-destructive")}>
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Technical Indicators (only when AI analyzed) */}
      {hasAI && stock.rsi !== undefined && stock.rsi > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-secondary/40 text-center">
            <span className="text-[10px] text-muted-foreground block">RSI</span>
            <span className={cn("font-bold text-sm", getRSIColor(stock.rsi))}>{stock.rsi?.toFixed(0)}</span>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40 text-center">
            <span className="text-[10px] text-muted-foreground block">MACD</span>
            <span className={cn("font-bold text-sm", (stock.macd || 0) > 0 ? 'text-success' : 'text-destructive')}>
              {stock.macd?.toFixed(2)}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40 text-center">
            <span className="text-[10px] text-muted-foreground block">حجم/متوسط</span>
            <span className={cn("font-bold text-sm", (stock.volumeRatio || 0) > 1.5 ? 'text-success' : 'text-foreground')}>
              {stock.volumeRatio?.toFixed(1)}x
            </span>
          </div>
        </div>
      )}

      {/* Volume & Momentum */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-muted-foreground text-xs">حجم التداول</span>
        <span className="font-medium text-foreground text-xs">{formatVolume(stock.volume || 0)}</span>
      </div>

      {/* AI Confidence Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {hasAI ? <Activity className="w-3.5 h-3.5 text-primary" /> : <Zap className="w-3.5 h-3.5 text-primary" />}
            <span className="text-xs font-medium text-foreground">{hasAI ? 'ثقة AI' : 'نقاط الزخم'}</span>
          </div>
          <span className="font-bold text-sm text-foreground">{stock.aiScore}/100</span>
        </div>
        <Progress value={stock.aiScore} className="h-1.5" />
      </div>

      {/* AI Reasoning */}
      {hasAI && stock.reasoning && (
        <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground leading-relaxed">{stock.reasoning}</p>
        </div>
      )}

      {/* Entry, Target, Stop Loss */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <ArrowDownToLine className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">دخول</span>
          </div>
          <p className="font-semibold text-foreground text-xs">{(stock.entryPrice || stock.price).toFixed(2)}</p>
        </div>
        <div className="p-2 rounded-lg bg-success/5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Target className="w-3 h-3 text-success" />
            <span className="text-[10px] text-muted-foreground">هدف</span>
          </div>
          <p className="font-semibold text-success text-xs">{targetPrice.toFixed(2)}</p>
        </div>
        <div className="p-2 rounded-lg bg-destructive/5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Shield className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-muted-foreground">وقف</span>
          </div>
          <p className="font-semibold text-destructive text-xs">{stopLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Technical Signal + Risk/Reward */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">العائد/المخاطرة</span>
          <span className="font-semibold text-foreground">1:{riskReward}</span>
        </div>
        {hasAI && stock.technicalSignal && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
            {stock.technicalSignal}
          </Badge>
        )}
      </div>

      {/* Risk Level */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <span className="text-muted-foreground">المخاطرة</span>
        <Badge variant="outline" className={cn(
          "text-[10px]",
          stock.riskLevel === 'منخفض' && "text-success border-success/30",
          stock.riskLevel === 'متوسط' && "text-warning border-warning/30",
          stock.riskLevel === 'مرتفع' && "text-destructive border-destructive/30"
        )}>
          {stock.riskLevel}
        </Badge>
      </div>

      {/* Action */}
      <Link to={`/stock/${stock.symbol}`}>
        <Button variant="glow" className="w-full text-sm">
          عرض التحليل الكامل
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
};
