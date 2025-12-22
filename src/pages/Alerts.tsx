import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, TrendingDown, ArrowLeft, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { cn } from '@/lib/utils';

const Alerts = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { alerts, loading, deleteAlert, toggleAlert } = usePriceAlerts();

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

  const activeAlerts = alerts.filter(a => a.is_active && !a.is_triggered);
  const triggeredAlerts = alerts.filter(a => a.is_triggered);
  const inactiveAlerts = alerts.filter(a => !a.is_active && !a.is_triggered);

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
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">تنبيهات الأسعار</h1>
              <p className="text-muted-foreground">
                {activeAlerts.length} تنبيه نشط
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-secondary rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card className="glass-effect">
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد تنبيهات</h3>
              <p className="text-muted-foreground mb-6">
                أنشئ تنبيهات للأسعار من صفحة تفاصيل السهم
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
          <div className="space-y-8">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  تنبيهات نشطة ({activeAlerts.length})
                </h2>
                <div className="space-y-3">
                  {activeAlerts.map((alert, index) => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      index={index}
                      onDelete={deleteAlert}
                      onToggle={toggleAlert}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  تنبيهات تم تفعيلها ({triggeredAlerts.length})
                </h2>
                <div className="space-y-3">
                  {triggeredAlerts.map((alert, index) => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      index={index}
                      onDelete={deleteAlert}
                      onToggle={toggleAlert}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Alerts */}
            {inactiveAlerts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  تنبيهات متوقفة ({inactiveAlerts.length})
                </h2>
                <div className="space-y-3">
                  {inactiveAlerts.map((alert, index) => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      index={index}
                      onDelete={deleteAlert}
                      onToggle={toggleAlert}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

interface AlertCardProps {
  alert: {
    id: string;
    stock_symbol: string;
    stock_name: string;
    target_price: number;
    alert_type: 'above' | 'below';
    is_active: boolean;
    is_triggered: boolean;
    triggered_at: string | null;
    created_at: string;
  };
  index: number;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

const AlertCard = ({ alert, index, onDelete, onToggle }: AlertCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(
        "glass-effect transition-all",
        !alert.is_active && "opacity-60"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                alert.alert_type === 'above' ? "bg-success/20" : "bg-destructive/20"
              )}>
                {alert.alert_type === 'above' ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/stock/${alert.stock_symbol}`} className="font-semibold hover:text-primary transition-colors">
                    {alert.stock_name}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {alert.stock_symbol}
                  </Badge>
                  {alert.is_triggered && (
                    <Badge variant="default" className="bg-warning text-warning-foreground text-xs">
                      تم التفعيل
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {alert.alert_type === 'above' ? 'عندما يرتفع فوق' : 'عندما ينخفض تحت'}{' '}
                  <span className="font-medium text-foreground">
                    {alert.target_price.toFixed(2)} ريال
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggle(alert.id, !alert.is_active)}
                className={cn(
                  alert.is_active ? "text-success" : "text-muted-foreground"
                )}
              >
                {alert.is_active ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(alert.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Alerts;
