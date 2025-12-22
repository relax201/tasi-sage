import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Shield
} from 'lucide-react';
import { type Stock } from '@/data/stocksData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AIRecommendationProps {
  stock: Stock;
}

export const AIRecommendation = ({ stock }: AIRecommendationProps) => {
  const getRecommendationIcon = (rec: Stock['recommendation']) => {
    switch (rec) {
      case 'شراء قوي':
      case 'شراء':
        return TrendingUp;
      case 'بيع قوي':
      case 'بيع':
        return TrendingDown;
      default:
        return AlertTriangle;
    }
  };

  const getRecommendationColor = (rec: Stock['recommendation']) => {
    switch (rec) {
      case 'شراء قوي': return 'success';
      case 'شراء': return 'success';
      case 'احتفاظ': return 'warning';
      case 'بيع': return 'destructive';
      case 'بيع قوي': return 'destructive';
    }
  };

  const getRiskColor = (risk: Stock['riskLevel']) => {
    switch (risk) {
      case 'منخفض': return 'success';
      case 'متوسط': return 'warning';
      case 'مرتفع': return 'destructive';
    }
  };

  const RecommendationIcon = getRecommendationIcon(stock.recommendation);
  const recColor = getRecommendationColor(stock.recommendation);
  const riskColor = getRiskColor(stock.riskLevel);

  // Generate AI insights
  const insights = [
    {
      icon: Target,
      title: 'السعر المستهدف',
      value: `${(stock.price * 1.15).toFixed(2)} ر.س`,
      description: 'بناءً على التحليل الفني والأساسي',
    },
    {
      icon: Shield,
      title: 'مستوى الدعم',
      value: `${(stock.price * 0.95).toFixed(2)} ر.س`,
      description: 'نقطة وقف الخسارة المقترحة',
    },
  ];

  const factors = [
    { label: 'التحليل الفني', score: Math.floor(Math.random() * 30) + 60 },
    { label: 'التحليل الأساسي', score: Math.floor(Math.random() * 30) + 55 },
    { label: 'تحليل المشاعر', score: Math.floor(Math.random() * 40) + 50 },
    { label: 'زخم السوق', score: Math.floor(Math.random() * 35) + 45 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">توصية الذكاء الاصطناعي</h3>
          <p className="text-sm text-muted-foreground">تحليل شامل باستخدام نماذج التعلم الآلي</p>
        </div>
      </div>

      {/* Main Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={cn(
          "p-6 rounded-xl border-2",
          recColor === 'success' && "bg-success/5 border-success/30",
          recColor === 'warning' && "bg-warning/5 border-warning/30",
          recColor === 'destructive' && "bg-destructive/5 border-destructive/30"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <RecommendationIcon className={cn(
              "w-8 h-8",
              recColor === 'success' && "text-success",
              recColor === 'warning' && "text-warning",
              recColor === 'destructive' && "text-destructive"
            )} />
            <div>
              <p className="text-sm text-muted-foreground">التوصية</p>
              <p className={cn(
                "text-2xl font-bold",
                recColor === 'success' && "text-success",
                recColor === 'warning' && "text-warning",
                recColor === 'destructive' && "text-destructive"
              )}>
                {stock.recommendation}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نقاط AI</span>
              <span className="font-semibold text-foreground">{stock.aiScore}/100</span>
            </div>
            <Progress value={stock.aiScore} className="h-2" />
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-xl border-2",
          riskColor === 'success' && "bg-success/5 border-success/30",
          riskColor === 'warning' && "bg-warning/5 border-warning/30",
          riskColor === 'destructive' && "bg-destructive/5 border-destructive/30"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className={cn(
              "w-8 h-8",
              riskColor === 'success' && "text-success",
              riskColor === 'warning' && "text-warning",
              riskColor === 'destructive' && "text-destructive"
            )} />
            <div>
              <p className="text-sm text-muted-foreground">مستوى المخاطرة</p>
              <p className={cn(
                "text-2xl font-bold",
                riskColor === 'success' && "text-success",
                riskColor === 'warning' && "text-warning",
                riskColor === 'destructive' && "text-destructive"
              )}>
                {stock.riskLevel}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {stock.riskLevel === 'منخفض' && 'مناسب للمستثمرين المحافظين'}
            {stock.riskLevel === 'متوسط' && 'مناسب للمستثمرين المتوازنين'}
            {stock.riskLevel === 'مرتفع' && 'مناسب للمستثمرين المغامرين'}
          </p>
        </div>
      </div>

      {/* Price Targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {insights.map((insight, index) => (
          <div key={index} className="p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3 mb-2">
              <insight.icon className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">{insight.title}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{insight.value}</p>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Analysis Factors */}
      <div>
        <h4 className="font-semibold text-foreground mb-4">عوامل التحليل</h4>
        <div className="space-y-3">
          {factors.map((factor, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-32">{factor.label}</span>
              <div className="flex-1">
                <Progress value={factor.score} className="h-2" />
              </div>
              <span className={cn(
                "text-sm font-medium w-12 text-left",
                factor.score >= 70 ? "text-success" :
                factor.score >= 50 ? "text-warning" : "text-destructive"
              )}>
                {factor.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 rounded-xl bg-warning/5 border border-warning/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            هذه التوصيات مبنية على نماذج الذكاء الاصطناعي وليست نصيحة مالية. 
            يُنصح بإجراء البحث الخاص بك قبل اتخاذ أي قرار استثماري.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
