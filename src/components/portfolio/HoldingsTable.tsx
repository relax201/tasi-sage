import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PortfolioHolding } from '@/hooks/usePortfolio';

interface HoldingsTableProps {
  holdings: PortfolioHolding[];
}

export const HoldingsTable = ({ holdings }: HoldingsTableProps) => {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">لا توجد أسهم في المحفظة</p>
        <p className="text-sm mt-1">أضف عملية شراء للبدء</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">السهم</TableHead>
            <TableHead className="text-center">الكمية</TableHead>
            <TableHead className="text-center">متوسط الشراء</TableHead>
            <TableHead className="text-center">السعر الحالي</TableHead>
            <TableHead className="text-center">التكلفة</TableHead>
            <TableHead className="text-center">القيمة الحالية</TableHead>
            <TableHead className="text-center">الربح/الخسارة</TableHead>
            <TableHead className="text-center">النسبة</TableHead>
            <TableHead className="text-center">تفاصيل</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding, index) => {
            const isProfit = holding.profitLoss >= 0;
            return (
              <motion.tr
                key={holding.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50 hover:bg-muted/30"
              >
                <TableCell className="font-medium">
                  <div>
                    <p className="font-bold">{holding.name}</p>
                    <p className="text-xs text-muted-foreground">{holding.symbol}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">{holding.totalShares.toLocaleString('ar-SA')}</TableCell>
                <TableCell className="text-center">{holding.avgBuyPrice.toFixed(2)}</TableCell>
                <TableCell className="text-center font-medium">{holding.currentPrice.toFixed(2)}</TableCell>
                <TableCell className="text-center">{holding.totalInvested.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}</TableCell>
                <TableCell className="text-center">{holding.currentValue.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold flex items-center justify-center gap-1 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isProfit ? '+' : ''}{holding.profitLoss.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={isProfit ? 'default' : 'destructive'} className="text-xs">
                    {isProfit ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/stock/${holding.symbol}`} className="text-primary hover:underline">
                    <ExternalLink className="h-4 w-4 inline" />
                  </Link>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
