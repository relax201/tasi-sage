import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { stocks } from '@/data/stocksData';

interface AddTransactionDialogProps {
  onSubmit: (
    symbol: string,
    name: string,
    type: 'buy' | 'sell',
    quantity: number,
    price: number,
    notes?: string
  ) => Promise<boolean>;
  defaultSymbol?: string;
  defaultName?: string;
}

export const AddTransactionDialog = ({ onSubmit, defaultSymbol, defaultName }: AddTransactionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState(defaultSymbol || '');
  const [name, setName] = useState(defaultName || '');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = stocks.filter(
    (s) =>
      s.symbol.includes(searchQuery) ||
      s.name.includes(searchQuery)
  ).slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !quantity || !price) return;

    setIsSubmitting(true);
    const success = await onSubmit(symbol, name, type, parseInt(quantity), parseFloat(price), notes || undefined);
    setIsSubmitting(false);

    if (success) {
      setOpen(false);
      setSymbol(defaultSymbol || '');
      setName(defaultName || '');
      setQuantity('');
      setPrice('');
      setNotes('');
      setSearchQuery('');
    }
  };

  const handleStockSelect = (s: { symbol: string; name: string }) => {
    setSymbol(s.symbol);
    setName(s.name);
    setSearchQuery('');
  };

  const total = (parseInt(quantity) || 0) * (parseFloat(price) || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة عملية
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل عملية جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>نوع العملية</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'buy' | 'sell')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">شراء</SelectItem>
                <SelectItem value="sell">بيع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!defaultSymbol && (
            <div className="space-y-2">
              <Label>السهم</Label>
              <Input
                placeholder="ابحث بالرمز أو الاسم..."
                value={symbol ? `${symbol} - ${name}` : searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSymbol('');
                  setName('');
                }}
              />
              {searchQuery && !symbol && (
                <div className="max-h-32 overflow-y-auto border rounded-md bg-popover">
                  {filteredStocks.map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      className="w-full text-right px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => handleStockSelect(s)}
                    >
                      {s.symbol} - {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="عدد الأسهم"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="سعر السهم"
                required
              />
            </div>
          </div>

          {total > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-sm text-muted-foreground">الإجمالي: </span>
              <span className="font-bold text-lg">{total.toLocaleString('ar-SA')} ريال</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting || !symbol || !quantity || !price}>
              {isSubmitting ? 'جاري التسجيل...' : 'تسجيل'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
