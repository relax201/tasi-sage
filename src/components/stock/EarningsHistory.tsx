import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface QuarterlyEarning {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  epsDifference: number | null;
  surprisePercent: number | null;
}

interface AnnualEarning {
  date: string;
  earnings: number | null;
  revenue: number | null;
}

interface EarningsTrend {
  period: string;
  growth: number | null;
  earningsEstimate: number | null;
  revenueEstimate: number | null;
}

interface EarningsData {
  quarterly: QuarterlyEarning[];
  annual: AnnualEarning[];
  trend: EarningsTrend[];
}

interface EarningsHistoryProps {
  earnings?: EarningsData;
  currentPrice?: number;
}

export const EarningsHistory = ({ earnings, currentPrice = 0 }: EarningsHistoryProps) => {
  const [period, setPeriod] = useState<'quarterly' | 'annual'>('quarterly');

  const formatNumber = (value: number | null, decimals = 2): string => {
    if (value === null || value === undefined) return 'غير متوفر';
    return value.toFixed(decimals);
  };

  const formatLargeNumber = (value: number | null): string => {
    if (value === null || value === undefined) return 'غير متوفر';
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} مليار`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)} مليون`;
    return value.toFixed(2);
  };

  const calculatePE = (eps: number | null): string => {
    if (!eps || eps <= 0 || !currentPrice) return 'غير متوفر';
    return (currentPrice / eps).toFixed(2);
  };

  const hasQuarterlyData = earnings?.quarterly && earnings.quarterly.length > 0;
  const hasAnnualData = earnings?.annual && earnings.annual.length > 0;
  const hasTrendData = earnings?.trend && earnings.trend.length > 0;

  if (!hasQuarterlyData && !hasAnnualData) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            تاريخ الأرباح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            بيانات الأرباح التاريخية غير متوفرة لهذا السهم
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            تاريخ الأرباح (EPS) ومكرر الربحية (P/E)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'quarterly' | 'annual')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="quarterly" disabled={!hasQuarterlyData}>
                <Calendar className="w-4 h-4 ml-2" />
                ربع سنوي
              </TabsTrigger>
              <TabsTrigger value="annual" disabled={!hasAnnualData}>
                <Calendar className="w-4 h-4 ml-2" />
                سنوي
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quarterly" className="space-y-4">
              {hasQuarterlyData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">الفترة</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">EPS الفعلي</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">EPS المتوقع</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">P/E</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">المفاجأة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings?.quarterly.slice(0, 8).map((item, index) => (
                        <motion.tr
                          key={item.date}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium">{item.date}</td>
                          <td className="py-3 px-2">{formatNumber(item.epsActual)}</td>
                          <td className="py-3 px-2 text-muted-foreground">{formatNumber(item.epsEstimate)}</td>
                          <td className="py-3 px-2">{calculatePE(item.epsActual)}</td>
                          <td className="py-3 px-2">
                            {item.surprisePercent !== null ? (
                              <Badge 
                                variant="outline"
                                className={item.surprisePercent >= 0 
                                  ? 'text-success border-success/30 bg-success/10' 
                                  : 'text-destructive border-destructive/30 bg-destructive/10'
                                }
                              >
                                {item.surprisePercent >= 0 ? (
                                  <TrendingUp className="w-3 h-3 ml-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 ml-1" />
                                )}
                                {item.surprisePercent.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد بيانات ربع سنوية</p>
              )}
            </TabsContent>

            <TabsContent value="annual" className="space-y-4">
              {hasAnnualData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">السنة</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">الأرباح</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">الإيرادات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings?.annual.map((item, index) => (
                        <motion.tr
                          key={item.date}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium">{item.date}</td>
                          <td className="py-3 px-2">{formatLargeNumber(item.earnings)}</td>
                          <td className="py-3 px-2">{formatLargeNumber(item.revenue)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد بيانات سنوية</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Earnings Trend */}
          {hasTrendData && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">توقعات الأرباح المستقبلية</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {earnings?.trend.slice(0, 4).map((item, index) => (
                  <motion.div
                    key={item.period}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-muted/30 rounded-lg p-3"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{item.period}</p>
                    {item.growth !== null && (
                      <div className="flex items-center gap-1">
                        {item.growth >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className={item.growth >= 0 ? 'text-success' : 'text-destructive'}>
                          {(item.growth * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {item.earningsEstimate !== null && (
                      <p className="text-sm mt-1">
                        EPS: {formatNumber(item.earningsEstimate)}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
