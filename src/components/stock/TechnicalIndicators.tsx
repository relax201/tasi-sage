import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { generateIndicatorData } from '@/data/stocksData';
import { cn } from '@/lib/utils';

interface TechnicalIndicatorsProps {
  basePrice: number;
}

export const TechnicalIndicators = ({ basePrice }: TechnicalIndicatorsProps) => {
  const data = generateIndicatorData(basePrice, 30);
  
  const currentRSI = data[data.length - 1]?.rsi || 50;
  const currentMACD = data[data.length - 1]?.macd || 0;

  const getRSIStatus = (rsi: number) => {
    if (rsi >= 70) return { text: 'تشبع شرائي', color: 'text-destructive' };
    if (rsi <= 30) return { text: 'تشبع بيعي', color: 'text-success' };
    return { text: 'محايد', color: 'text-warning' };
  };

  const getMACDSignal = (macd: number) => {
    if (macd > 0.5) return { text: 'إشارة شراء قوية', color: 'text-success' };
    if (macd > 0) return { text: 'إشارة شراء', color: 'text-success' };
    if (macd < -0.5) return { text: 'إشارة بيع قوية', color: 'text-destructive' };
    return { text: 'إشارة بيع', color: 'text-destructive' };
  };

  const rsiStatus = getRSIStatus(currentRSI);
  const macdSignal = getMACDSignal(currentMACD);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* RSI Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">مؤشر القوة النسبية (RSI)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              القيمة الحالية: <span className="font-semibold text-foreground">{currentRSI.toFixed(1)}</span>
            </p>
          </div>
          <span className={cn("font-medium px-3 py-1 rounded-lg bg-secondary", rsiStatus.color)}>
            {rsiStatus.text}
          </span>
        </div>
        
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <ReferenceLine y={70} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="hsl(142, 72%, 46%)" strokeDasharray="3 3" />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(222, 47%, 10%)', 
                  border: '1px solid hsl(222, 30%, 18%)',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
              />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-destructive" />
            <span className="text-muted-foreground">تشبع شرائي (70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-success" />
            <span className="text-muted-foreground">تشبع بيعي (30)</span>
          </div>
        </div>
      </motion.div>

      {/* MACD Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">مؤشر MACD</h3>
            <p className="text-sm text-muted-foreground mt-1">
              القيمة الحالية: <span className="font-semibold text-foreground">{currentMACD.toFixed(3)}</span>
            </p>
          </div>
          <span className={cn("font-medium px-3 py-1 rounded-lg bg-secondary", macdSignal.color)}>
            {macdSignal.text}
          </span>
        </div>
        
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine y={0} stroke="hsl(215, 20%, 55%)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(222, 47%, 10%)', 
                  border: '1px solid hsl(222, 30%, 18%)',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(215, 20%, 55%)' }}
              />
              <Bar
                dataKey="macd"
                fill="hsl(174, 72%, 46%)"
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                dot={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">MACD</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-warning" />
            <span className="text-muted-foreground">خط الإشارة</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
