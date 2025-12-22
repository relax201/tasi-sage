import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import { generateIndicatorData } from '@/data/stocksData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StockChartProps {
  basePrice: number;
  symbol: string;
}

const timeframes = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

export const StockChart = ({ basePrice, symbol }: StockChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(30);
  const [showIndicators, setShowIndicators] = useState(true);
  
  const data = generateIndicatorData(basePrice, selectedTimeframe);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-effect rounded-lg p-3 border border-border">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">الإغلاق: </span>
              <span className="font-semibold text-foreground">{payload[0]?.value?.toFixed(2)} ر.س</span>
            </p>
            {showIndicators && payload[1] && (
              <p className="text-sm">
                <span className="text-muted-foreground">SMA20: </span>
                <span className="font-semibold text-primary">{payload[1]?.value?.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-foreground">الرسم البياني للسعر</h3>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.label}
                variant={selectedTimeframe === tf.days ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(tf.days)}
                className="text-xs"
              >
                {tf.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant={showIndicators ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowIndicators(!showIndicators)}
          >
            المؤشرات
          </Button>
        </div>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(222, 30%, 18%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="hsl(174, 72%, 46%)"
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
            {showIndicators && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {showIndicators && (
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">السعر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">SMA20</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
