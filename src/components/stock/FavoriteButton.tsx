import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  stockSymbol: string;
  stockName: string;
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export const FavoriteButton = ({ 
  stockSymbol, 
  stockName, 
  size = 'default',
  showLabel = false 
}: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const isFav = isFavorite(stockSymbol);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(stockSymbol, stockName);
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "transition-all duration-300",
        isFav && "text-destructive hover:text-destructive"
      )}
    >
      <motion.div
        whileTap={{ scale: 0.8 }}
        animate={isFav ? { scale: [1, 1.2, 1] } : {}}
      >
        <Heart 
          className={cn(iconSize, isFav && "fill-current")} 
        />
      </motion.div>
      {showLabel && (
        <span className="mr-2">
          {isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        </span>
      )}
    </Button>
  );
};
