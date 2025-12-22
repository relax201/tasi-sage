import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Heart, Bell, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const UserMenu = () => {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تسجيل الخروج',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'تم تسجيل الخروج',
        description: 'نراك قريباً!'
      });
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-secondary animate-pulse" />
    );
  }

  if (!isAuthenticated) {
    return (
      <Link to="/auth">
        <Button variant="default" size="sm" className="gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">تسجيل الدخول</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-5 h-5 text-primary" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">مرحباً!</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { navigate('/favorites'); setIsOpen(false); }}>
          <Heart className="ml-2 w-4 h-4" />
          <span>المفضلة</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { navigate('/alerts'); setIsOpen(false); }}>
          <Bell className="ml-2 w-4 h-4" />
          <span>التنبيهات</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="ml-2 w-4 h-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
