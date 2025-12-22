import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { marketIndices } from '@/data/stocksData';
import { cn } from '@/lib/utils';

export const MarketOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {marketIndices.map((index, i) => {
        const isPositive = index.change >= 0;
        
        return (
          <motion.div
            key={index.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-effect rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{index.name}</h3>
              <div className={cn(
                "p-2 rounded-xl",
                isPositive ? "bg-success/10" : "bg-destructive/10"
              )}>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-3xl font-bold text-foreground">
                {index.value.toLocaleString('ar-SA')}
              </p>
              
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? '+' : ''}{index.change.toFixed(2)}
                </span>
                <span className={cn(
                  "text-sm font-medium px-2 py-0.5 rounded-md",
                  isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            
            {/* Decorative element */}
            <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className={cn(
                "absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-full",
                isPositive ? "bg-success" : "bg-destructive"
              )} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
