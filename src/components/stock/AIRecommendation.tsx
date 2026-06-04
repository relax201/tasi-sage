import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Target,
  Shield,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUpDown
} from 'lucide-react';
import { type Stock } from '@/data/stocksData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAIAnalysis } from '@/hooks/useStockData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AIRecommendationProps {
  stock: Stock;
}

export const AIRecommendation = ({ stock }: AIRecommendationProps) => {
  const { analysis, isLoading, fetchAnalysis } = useAIAnalysis(stock);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const handleGetAnalysis = async () => {
    await fetchAnalysis('recommendation');
    setHasLoadedOnce(true);
    setShowDetails(true);
  };

  // Fire Telegram notification when the analysis indicates a buy/strong-buy
  useEffect(() => {
    if (!analysis?.recommendation) return;
    const rec = analysis.recommendation;
    if (rec.includes('شراء')) {
      // Don't block the UI - fire and forget
      supabase.functions.invoke('telegram-notify', {
        body: {
          recommendation: {
            symbol: stock.symbol,
            stock_name: stock.name,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            target_price: analysis.targetPrice ?? analysis.targetPriceShort ?? 0,
            stop_loss: analysis.stopLoss ?? 0,
            confidence: analysis.confidence ?? 0,
            recommendation: rec,
            reasoning: analysis.reasoning ?? '',
          },
        },
      })
        .then(({ data }) => {
          if (data?.success) {
            toast({
              title: '🔔 تم إرسال إشعار Telegram',
              description: rec.includes('قوي') ? '🚨 شراء قوي' : '📊 شراء',
            });
          }
        })
        .catch(() => null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis?.recommendation]);

  // Get recommendation data from AI or fallback to stock data
  const recommendation = analysis?.recommendation || stock.recommendation;
  const targetPrice = analysis?.targetPrice || stock.price * 1.15;
  const targetPriceShort = analysis?.targetPriceShort;
  const targetPriceMedium = analysis?.targetPriceMedium;
  const targetPriceLong = analysis?.targetPriceLong;
  const stopLoss = analysis?.stopLoss || stock.price * 0.95;
  const confidence = analysis?.confidence || stock.aiScore;
  const reasoning = analysis?.reasoning;
  const riskLevel = analysis?.riskLevel || stock.riskLevel;
  const timeFrame = analysis?.timeFrame;
  const trend = analysis?.trend;
  const momentum = analysis?.momentum;
  
  // Support and Resistance levels
  const support1 = analysis?.support1;
  const support2 = analysis?.support2;
  const resistance1 = analysis?.resistance1;
  const resistance2 = analysis?.resistance2;
  
  // Scores
  const technicalScore = analysis?.technicalScore || Math.floor(confidence * 0.9);
  const fundamentalScore = analysis?.fundamentalScore || Math.floor(confidence * 0.85);
  const sentimentScore = analysis?.sentimentScore || Math.floor(confidence * 0.8);
  
  // Analysis details
  const strengths = analysis?.strengths || [];
  const weaknesses = analysis?.weaknesses || [];
  const risks = analysis?.risks || [];
  const catalysts = analysis?.catalysts || [];
  const volumeAnalysis = analysis?.volumeAnalysis;
  const priceAction = analysis?.priceAction;
  const sectorOutlook = analysis?.sectorOutlook;

  const getRecommendationIcon = (rec: string) => {
    if (rec.includes('شراء قوي')) return TrendingUp;
    if (rec.includes('شراء')) return TrendingUp;
    if (rec.includes('بيع قوي')) return TrendingDown;
    if (rec.includes('بيع')) return TrendingDown;
    return AlertTriangle;
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('شراء قوي')) return 'success';
    if (rec.includes('شراء')) return 'success';
    if (rec.includes('بيع قوي')) return 'destructive';
    if (rec.includes('بيع')) return 'destructive';
    return 'warning';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'منخفض') return 'success';
    if (risk === 'مرتفع') return 'destructive';
    return 'warning';
  };

  const getTrendIcon = (t: string) => {
    if (t === 'صاعد') return TrendingUp;
    if (t === 'هابط') return TrendingDown;
    return TrendingUpDown;
  };

  const RecommendationIcon = getRecommendationIcon(recommendation);
  const recColor = getRecommendationColor(recommendation);
  const riskColor = getRiskColor(riskLevel);

  const scoreItems = [
    { label: 'التحليل الفني', score: technicalScore, icon: BarChart3 },
    { label: 'التحليل الأساسي', score: fundamentalScore, icon: Activity },
    { label: 'تحليل المشاعر', score: sentimentScore, icon: Zap },
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
          <div className="flex flex-wrap gap-2 mt-3">
            {timeFrame && (
              <Badge variant="outline" className="text-primary border-primary/30">
                <Clock className="w-3 h-3 mr-1" />
                {timeFrame}
              </Badge>
            )}
            {trend && (
              <Badge variant="outline" className={cn(
                "border-primary/30",
                trend === 'صاعد' && "text-success",
                trend === 'هابط' && "text-destructive",
                trend === 'عرضي' && "text-warning"
              )}>
                {(() => {
                  const TrendIcon = getTrendIcon(trend);
                  return <TrendIcon className="w-3 h-3 mr-1" />;
                })()}
                {trend}
              </Badge>
            )}
            {momentum && (
              <Badge variant="outline" className="text-muted-foreground border-muted/30">
                <Activity className="w-3 h-3 mr-1" />
                زخم {momentum}
              </Badge>
            )}
            {sectorOutlook && (
              <Badge variant="outline" className={cn(
                "border-primary/30",
                sectorOutlook === 'إيجابي' && "text-success",
                sectorOutlook === 'سلبي' && "text-destructive",
                sectorOutlook === 'محايد' && "text-warning"
              )}>
                نظرة القطاع: {sectorOutlook}
              </Badge>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Recommendation and Risk */}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">السعر المستهدف</span>
          </div>
          <p className="text-xl font-bold text-success">{Number(targetPrice).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">ر.س</p>
        </div>
        
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">وقف الخسارة</span>
          </div>
          <p className="text-xl font-bold text-destructive">{Number(stopLoss).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">ر.س</p>
        </div>
        
        {support1 && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <ChevronDown className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">الدعم الأول</span>
            </div>
            <p className="text-xl font-bold text-primary">{Number(support1).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </div>
        )}
        
        {resistance1 && (
          <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <ChevronUp className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">المقاومة الأولى</span>
            </div>
            <p className="text-xl font-bold text-warning">{Number(resistance1).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </div>
        )}
      </div>

      {/* Multi-timeframe Targets */}
      {(targetPriceShort || targetPriceMedium || targetPriceLong) && (
        <div className="mb-6 p-4 rounded-xl bg-secondary/30">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            الأهداف السعرية حسب المدى
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {targetPriceShort && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">قصير المدى</p>
                <p className="text-lg font-bold text-foreground">{Number(targetPriceShort).toFixed(2)} ر.س</p>
                <p className="text-xs text-muted-foreground">1-3 أشهر</p>
              </div>
            )}
            {targetPriceMedium && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">متوسط المدى</p>
                <p className="text-lg font-bold text-foreground">{Number(targetPriceMedium).toFixed(2)} ر.س</p>
                <p className="text-xs text-muted-foreground">3-6 أشهر</p>
              </div>
            )}
            {targetPriceLong && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">طويل المدى</p>
                <p className="text-lg font-bold text-foreground">{Number(targetPriceLong).toFixed(2)} ر.س</p>
                <p className="text-xs text-muted-foreground">6-12 شهر</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Scores */}
      <div className="mb-6">
        <h4 className="font-semibold text-foreground mb-4">تقييم التحليل</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scoreItems.map((item, index) => (
            <div key={index} className="p-4 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2 mb-3">
                <item.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={item.score} className="h-2 flex-1" />
                <span className={cn(
                  "text-sm font-bold min-w-[40px]",
                  item.score >= 70 ? "text-success" :
                  item.score >= 50 ? "text-warning" : "text-destructive"
                )}>
                  {item.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {showDetails && (strengths.length > 0 || weaknesses.length > 0 || risks.length > 0 || catalysts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 mb-6"
          >
            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths.length > 0 && (
                <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                  <h5 className="font-medium text-success mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    نقاط القوة
                  </h5>
                  <ul className="space-y-2">
                    {strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-success mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {weaknesses.length > 0 && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                  <h5 className="font-medium text-destructive mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    نقاط الضعف
                  </h5>
                  <ul className="space-y-2">
                    {weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-destructive mt-1">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Risks and Catalysts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {risks.length > 0 && (
                <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                  <h5 className="font-medium text-warning mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    المخاطر المحتملة
                  </h5>
                  <ul className="space-y-2">
                    {risks.map((risk, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-warning mt-1">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {catalysts.length > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h5 className="font-medium text-primary mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    المحفزات
                  </h5>
                  <ul className="space-y-2">
                    {catalysts.map((catalyst, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {catalyst}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Volume and Price Action Analysis */}
            {(volumeAnalysis || priceAction) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {volumeAnalysis && (
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      تحليل حجم التداول
                    </h5>
                    <p className="text-sm text-muted-foreground">{volumeAnalysis}</p>
                  </div>
                )}
                
                {priceAction && (
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      تحليل حركة السعر
                    </h5>
                    <p className="text-sm text-muted-foreground">{priceAction}</p>
                  </div>
                )}
              </div>
            )}

            {/* Additional Support/Resistance Levels */}
            {(support2 || resistance2) && (
              <div className="p-4 rounded-xl bg-secondary/30">
                <h5 className="font-medium text-foreground mb-3">مستويات الدعم والمقاومة الإضافية</h5>
                <div className="grid grid-cols-2 gap-4">
                  {support2 && (
                    <div>
                      <span className="text-xs text-muted-foreground">الدعم الثاني</span>
                      <p className="text-lg font-bold text-primary">{Number(support2).toFixed(2)} ر.س</p>
                    </div>
                  )}
                  {resistance2 && (
                    <div>
                      <span className="text-xs text-muted-foreground">المقاومة الثانية</span>
                      <p className="text-lg font-bold text-warning">{Number(resistance2).toFixed(2)} ر.س</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Details Button */}
      {hasLoadedOnce && (strengths.length > 0 || weaknesses.length > 0 || risks.length > 0) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mb-4 gap-2"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4" />
              إخفاء التفاصيل
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              عرض التفاصيل الكاملة
            </>
          )}
        </Button>
      )}

      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            هذه التوصيات مبنية على نماذج الذكاء الاصطناعي وليست نصيحة مالية. 
            يُنصح بإجراء البحث الخاص بك واستشارة مستشار مالي معتمد قبل اتخاذ أي قرار استثماري.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
