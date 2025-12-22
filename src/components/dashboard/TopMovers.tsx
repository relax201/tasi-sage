import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronLeft } from 'lucide-react';
import { stocks } from '@/data/stocksData';
import { cn } from '@/lib/utils';

export const TopMovers = () => {
  const topGainers = [...stocks]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
    
  const topLosers = [...stocks]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Gainers */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-success/10">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">الأكثر ارتفاعاً</h3>
        </div>
        
        <div className="space-y-3">
          {topGainers.map((stock, index) => (
            <Link 
              key={stock.symbol} 
              to={`/stock/${stock.symbol}`}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-success/10 text-success text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{stock.name}</p>
                  <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-success font-semibold">
                  +{stock.changePercent.toFixed(2)}%
                </span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Top Losers */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-effect rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-destructive/10">
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">الأكثر انخفاضاً</h3>
        </div>
        
        <div className="space-y-3">
          {topLosers.map((stock, index) => (
            <Link 
              key={stock.symbol} 
              to={`/stock/${stock.symbol}`}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{stock.name}</p>
                  <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-destructive font-semibold">
                  {stock.changePercent.toFixed(2)}%
                </span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
