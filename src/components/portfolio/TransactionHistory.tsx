import { motion } from 'framer-motion';
import { Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PortfolioTransaction } from '@/hooks/usePortfolio';

interface TransactionHistoryProps {
  transactions: PortfolioTransaction[];
  onDelete: (id: string) => void;
}

export const TransactionHistory = ({ transactions, onDelete }: TransactionHistoryProps) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>لا توجد عمليات مسجلة</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">السهم</TableHead>
            <TableHead className="text-center">الكمية</TableHead>
            <TableHead className="text-center">السعر</TableHead>
            <TableHead className="text-center">الإجمالي</TableHead>
            <TableHead className="text-center">التاريخ</TableHead>
            <TableHead className="text-center">ملاحظات</TableHead>
            <TableHead className="text-center">حذف</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t, index) => (
            <motion.tr
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="border-b border-border/50 hover:bg-muted/30"
            >
              <TableCell>
                <Badge
                  variant={t.transaction_type === 'buy' ? 'default' : 'destructive'}
                  className="gap-1"
                >
                  {t.transaction_type === 'buy' ? (
                    <><ArrowDownCircle className="h-3 w-3" /> شراء</>
                  ) : (
                    <><ArrowUpCircle className="h-3 w-3" /> بيع</>
                  )}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium">{t.stock_name}</span>
                <span className="text-xs text-muted-foreground mr-1">({t.stock_symbol})</span>
              </TableCell>
              <TableCell className="text-center">{t.quantity.toLocaleString('ar-SA')}</TableCell>
              <TableCell className="text-center">{Number(t.price_per_share).toFixed(2)}</TableCell>
              <TableCell className="text-center font-medium">
                {Number(t.total_amount).toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ريال
              </TableCell>
              <TableCell className="text-center text-sm">
                {new Date(t.transaction_date).toLocaleDateString('ar-SA')}
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground max-w-[120px] truncate">
                {t.notes || '-'}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
