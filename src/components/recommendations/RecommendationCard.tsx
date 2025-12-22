import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  Target,
  Shield
} from 'lucide-react';
import { type Stock } from '@/data/stocksData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  stock: Stock;
  index: number;
}

export const RecommendationCard = ({ stock, index }: RecommendationCardProps) => {
  const isPositive = stock.change >= 0;

  const getRecommendationStyle = (rec: Stock['recommendation']) => {
    switch (rec) {
      case 'شراء قوي':
        return { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', icon: TrendingUp };
      case 'شراء':
        return { bg: 'bg-success/5', border: 'border-success/20', text: 'text-success', icon: TrendingUp };
      case 'احتفاظ':
        return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: AlertTriangle };
      case 'بيع':
        return { bg: 'bg-destructive/5', border: 'border-destructive/20', text: 'text-destructive', icon: TrendingDown };
      case 'بيع قوي':
        return { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive', icon: TrendingDown };
    }
  };

  const style = getRecommendationStyle(stock.recommendation);
  const RecIcon = style.icon;

  const targetPrice = (stock.price * (1 + (stock.aiScore - 50) / 100)).toFixed(2);
  const potentialReturn = ((parseFloat(targetPrice) / stock.price - 1) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
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
      <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-secondary/30">
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

      {/* AI Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">نقاط الذكاء الاصطناعي</span>
          </div>
          <span className="font-bold text-foreground">{stock.aiScore}/100</span>
        </div>
        <Progress value={stock.aiScore} className="h-2" />
      </div>

      {/* Targets */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">السعر المستهدف</span>
          </div>
          <p className="font-semibold text-foreground">{targetPrice} ر.س</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">العائد المتوقع</span>
          </div>
          <p className={cn(
            "font-semibold",
            parseFloat(potentialReturn) >= 0 ? "text-success" : "text-destructive"
          )}>
            {parseFloat(potentialReturn) >= 0 ? '+' : ''}{potentialReturn}%
          </p>
        </div>
      </div>

      {/* Risk Level */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">مستوى المخاطرة</span>
        <Badge variant="outline" className={cn(
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
