import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteButton } from '@/components/stock/FavoriteButton';
import { cn } from '@/lib/utils';

const Favorites = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { favorites, loading } = useFavorites();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            رجوع
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الأسهم المفضلة</h1>
              <p className="text-muted-foreground">
                {favorites.length} سهم في قائمتك
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-secondary rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <Card className="glass-effect">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد أسهم مفضلة</h3>
              <p className="text-muted-foreground mb-6">
                ابدأ بإضافة الأسهم التي تهمك لمتابعتها بسهولة
              </p>
              <Link to="/stocks">
                <Button>
                  <TrendingUp className="w-4 h-4 ml-2" />
                  تصفح الأسهم
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav, index) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/stock/${fav.stock_symbol}`}>
                  <Card className="glass-effect hover:border-primary/50 transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {fav.stock_symbol}
                          </Badge>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {fav.stock_name}
                          </h3>
                        </div>
                        <FavoriteButton 
                          stockSymbol={fav.stock_symbol} 
                          stockName={fav.stock_name}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        أضيف في {new Date(fav.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;
