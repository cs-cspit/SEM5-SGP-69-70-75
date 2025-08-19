
import React from 'react';
import { Bell, User, LogOut, Home, ShoppingCart, Calendar, FileText, Clock, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, advanceOrders, heldOrders } = useSupabaseApp();
  const { getUnreadCount } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/menu', label: 'Menu', icon: Menu },
    { path: '/orders', label: 'New Orders', icon: ShoppingCart },
    { path: '/advances', label: 'Advances', icon: Calendar },
    { path: '/held-orders', label: 'Held Orders', icon: Clock },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  // Convert to notification format to count unread
  const allNotifications = [
    ...advanceOrders.map(order => ({ type: 'advance-order', id: order.id })),
    ...heldOrders.map(order => ({ type: 'held-order', id: order.id }))
  ];

  const unreadCount = getUnreadCount(allNotifications);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - Navigation */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1">
          <h1 className="text-xl font-bold text-orange-600">Savaliya</h1>
          <span className="text-sm text-gray-500">POS</span>
        </div>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 ${
                  isActive 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Right side - Notifications and User */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative" onClick={() => navigate('/notifications')}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {user?.email || 'User'}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
