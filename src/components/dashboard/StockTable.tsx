import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { stocks, sectors, type Stock } from '@/data/stocksData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'price' | 'changePercent' | 'volume' | 'aiScore';
type SortDirection = 'asc' | 'desc';

export const StockTable = () => {
  const [selectedSector, setSelectedSector] = useState('الكل');
  const [sortField, setSortField] = useState<SortField>('aiScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredStocks = stocks.filter(stock => 
    selectedSector === 'الكل' || stock.sector === selectedSector
  );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'ar') 
        : bValue.localeCompare(aValue, 'ar');
    }
    
    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getRecommendationColor = (rec: Stock['recommendation']) => {
    switch (rec) {
      case 'شراء قوي': return 'bg-success/20 text-success border-success/30';
      case 'شراء': return 'bg-success/10 text-success border-success/20';
      case 'احتفاظ': return 'bg-warning/10 text-warning border-warning/20';
      case 'بيع': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'بيع قوي': return 'bg-destructive/20 text-destructive border-destructive/30';
    }
  };

  const getRiskColor = (risk: Stock['riskLevel']) => {
    switch (risk) {
      case 'منخفض': return 'text-success';
      case 'متوسط': return 'text-warning';
      case 'مرتفع': return 'text-destructive';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sector Filter */}
      <div className="flex flex-wrap gap-2">
        {sectors.map((sector) => (
          <Button
            key={sector}
            variant={selectedSector === sector ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSector(sector)}
            className="transition-all duration-300"
          >
            {sector}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-effect rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right p-4 font-semibold text-muted-foreground">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    السهم
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-right p-4 font-semibold text-muted-foreground">
                  <button 
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    السعر
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-right p-4 font-semibold text-muted-foreground">
                  <button 
                    onClick={() => handleSort('changePercent')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    التغير
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-right p-4 font-semibold text-muted-foreground hidden md:table-cell">
                  <button 
                    onClick={() => handleSort('volume')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    الحجم
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="text-right p-4 font-semibold text-muted-foreground hidden lg:table-cell">
                  التوصية
                </th>
                <th className="text-right p-4 font-semibold text-muted-foreground">
                  <button 
                    onClick={() => handleSort('aiScore')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    نقاط AI
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock, index) => {
                const isPositive = stock.change >= 0;
                
                return (
                  <motion.tr
                    key={stock.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-foreground">{stock.name}</p>
                        <p className="text-sm text-muted-foreground">{stock.symbol} • {stock.sector}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{stock.price.toFixed(2)} ر.س</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className={cn(
                          "font-medium",
                          isPositive ? "text-success" : "text-destructive"
                        )}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-muted-foreground">
                        {(stock.volume / 1000000).toFixed(2)}M
                      </p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge 
                        variant="outline" 
                        className={cn("font-medium", getRecommendationColor(stock.recommendation))}
                      >
                        {stock.recommendation}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              stock.aiScore >= 70 ? "bg-success" : 
                              stock.aiScore >= 50 ? "bg-warning" : "bg-destructive"
                            )}
                            style={{ width: `${stock.aiScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">{stock.aiScore}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Link to={`/stock/${stock.symbol}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
