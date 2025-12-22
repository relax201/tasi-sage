import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { type LiveStock } from '@/lib/api/stockApi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'price' | 'changePercent' | 'volume';
type SortDirection = 'asc' | 'desc';

const sectors = [
  'الكل',
  'الطاقة',
  'البنوك',
  'المواد الأساسية',
  'الاتصالات',
  'النقل',
  'التجزئة',
  'الأغذية',
];

interface StockTableProps {
  stocks: LiveStock[];
  isLoading?: boolean;
}

export const StockTable = ({ stocks, isLoading }: StockTableProps) => {
  const [selectedSector, setSelectedSector] = useState('الكل');
  const [sortField, setSortField] = useState<SortField>('changePercent');
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

  if (isLoading) {
    return (
      <div className="glass-effect rounded-2xl p-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل الأسهم...</p>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">لا توجد بيانات متاحة</p>
      </div>
    );
  }

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
                  أعلى / أدنى
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
                    transition={{ delay: index * 0.03 }}
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
                        {stock.volume > 1000000 
                          ? `${(stock.volume / 1000000).toFixed(2)}M`
                          : `${(stock.volume / 1000).toFixed(0)}K`
                        }
                      </p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-sm">
                        <span className="text-success">{stock.high.toFixed(2)}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-destructive">{stock.low.toFixed(2)}</span>
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
