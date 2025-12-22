import { useState } from 'react';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useAuth } from '@/hooks/useAuth';

interface PriceAlertDialogProps {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
}

export const PriceAlertDialog = ({ 
  stockSymbol, 
  stockName, 
  currentPrice 
}: PriceAlertDialogProps) => {
  const { isAuthenticated } = useAuth();
  const { createAlert } = usePriceAlerts();
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setIsLoading(false);
      return;
    }

    const success = await createAlert(stockSymbol, stockName, price, alertType);
    setIsLoading(false);
    
    if (success) {
      setOpen(false);
      setTargetPrice(currentPrice.toString());
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="w-4 h-4" />
          <span>تنبيه السعر</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            إنشاء تنبيه سعري
          </DialogTitle>
          <DialogDescription>
            سيتم إشعارك عندما يصل سعر {stockName} للقيمة المحددة
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">السعر الحالي</p>
            <p className="text-xl font-bold text-primary">{currentPrice.toFixed(2)} ريال</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-price">السعر المستهدف</Label>
            <Input
              id="target-price"
              type="number"
              step="0.01"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="أدخل السعر المستهدف"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label>نوع التنبيه</Label>
            <Select value={alertType} onValueChange={(v) => setAlertType(v as 'above' | 'below')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span>عندما يرتفع فوق</span>
                  </div>
                </SelectItem>
                <SelectItem value="below">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span>عندما ينخفض تحت</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء التنبيه'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
