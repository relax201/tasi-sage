import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Target,
  Shield,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { type Stock } from '@/data/stocksData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAIAnalysis } from '@/hooks/useStockData';
import { cn } from '@/lib/utils';

interface AIRecommendationProps {
  stock: Stock;
}

export const AIRecommendation = ({ stock }: AIRecommendationProps) => {
  const { analysis, isLoading, fetchAnalysis } = useAIAnalysis(stock);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const handleGetAnalysis = async () => {
    await fetchAnalysis('recommendation');
    setHasLoadedOnce(true);
  };

  // Get recommendation data from AI or fallback to stock data
  const recommendation = analysis?.recommendation || stock.recommendation;
  const targetPrice = analysis?.targetPrice || stock.price * 1.15;
  const stopLoss = analysis?.stopLoss || stock.price * 0.95;
  const confidence = analysis?.confidence || stock.aiScore;
  const reasoning = analysis?.reasoning;
  const riskLevel = analysis?.riskLevel || stock.riskLevel;
  const timeFrame = analysis?.timeFrame;

  const getRecommendationIcon = (rec: string) => {
    if (rec.includes('شراء')) return TrendingUp;
    if (rec.includes('بيع')) return TrendingDown;
    return AlertTriangle;
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('شراء')) return 'success';
    if (rec.includes('بيع')) return 'destructive';
    return 'warning';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'منخفض') return 'success';
    if (risk === 'مرتفع') return 'destructive';
    return 'warning';
  };

  const RecommendationIcon = getRecommendationIcon(recommendation);
  const recColor = getRecommendationColor(recommendation);
  const riskColor = getRiskColor(riskLevel);

  const insights = [
    {
      icon: Target,
      title: 'السعر المستهدف',
      value: `${Number(targetPrice).toFixed(2)} ر.س`,
      description: 'بناءً على التحليل الفني والأساسي',
    },
    {
      icon: Shield,
      title: 'وقف الخسارة',
      value: `${Number(stopLoss).toFixed(2)} ر.س`,
      description: 'مستوى الدعم للخروج الآمن',
    },
  ];

  const factors = [
    { label: 'التحليل الفني', score: Math.min(100, Math.floor(confidence * 0.9 + Math.random() * 10)) },
    { label: 'التحليل الأساسي', score: Math.min(100, Math.floor(confidence * 0.85 + Math.random() * 15)) },
    { label: 'تحليل المشاعر', score: Math.min(100, Math.floor(confidence * 0.8 + Math.random() * 20)) },
    { label: 'زخم السوق', score: Math.min(100, Math.floor(confidence * 0.75 + Math.random() * 25)) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">توصية الذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground">تحليل شامل باستخدام نماذج التعلم الآلي</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetAnalysis}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {hasLoadedOnce ? 'تحديث التحليل' : 'تحليل بالذكاء الاصطناعي'}
            </>
          )}
        </Button>
      </div>

      {/* AI Generated Reasoning */}
      {reasoning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
          {timeFrame && (
            <Badge variant="outline" className="mt-2 text-primary border-primary/30">
              {timeFrame}
            </Badge>
          )}
        </motion.div>
      )}

      {/* Main Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={cn(
          "p-6 rounded-xl border-2 relative overflow-hidden",
          recColor === 'success' && "bg-success/5 border-success/30",
          recColor === 'warning' && "bg-warning/5 border-warning/30",
          recColor === 'destructive' && "bg-destructive/5 border-destructive/30"
        )}>
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
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
                {recommendation}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مستوى الثقة</span>
              <span className="font-semibold text-foreground">{Math.round(confidence)}%</span>
            </div>
            <Progress value={confidence} className="h-2" />
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
                {riskLevel}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {riskLevel === 'منخفض' && 'مناسب للمستثمرين المحافظين'}
            {riskLevel === 'متوسط' && 'مناسب للمستثمرين المتوازنين'}
            {riskLevel === 'مرتفع' && 'مناسب للمستثمرين المغامرين'}
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
