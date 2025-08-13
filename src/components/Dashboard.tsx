import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Plus, 
  FileText, 
  Menu as MenuIcon, 
  Calendar,
  Bell,
  ArrowUpRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    getTodaysSales, 
    getTotalOrders, 
    getRecentOrders, 
    orders, 
    advanceOrders,
    getWeeklySales,
    getMonthlySales,
    getOrdersCount
  } = useSupabaseApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    todaySales: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    todayOrders: 0,
    weeklyOrders: 0,
    monthlyOrders: 0,
    todayCustomers: 0,
    weeklyCustomers: 0,
    monthlyCustomers: 0
  });

  const salesData = [
    { period: 'Today', revenue: realTimeData.todaySales, orders: realTimeData.todayOrders, customers: realTimeData.todayCustomers },
    { period: 'Weekly', revenue: realTimeData.weeklyRevenue, orders: realTimeData.weeklyOrders, customers: realTimeData.weeklyCustomers },
    { period: 'Monthly', revenue: realTimeData.monthlyRevenue, orders: realTimeData.monthlyOrders, customers: realTimeData.monthlyCustomers }
  ];

  // Generate notifications from advance orders
  const notifications = advanceOrders.slice(0, 3).map((order, index) => ({
    type: 'info',
    message: `Advance order scheduled for ${new Date(order.delivery_date).toLocaleDateString()} at ${order.delivery_time || 'TBD'} by ${order.customer_name}`,
    time: `${index + 1} hour${index > 0 ? 's' : ''} ago`
  }));

  const quickActions = [
    { 
      icon: Plus, 
      label: 'New Order', 
      path: '/orders', 
      color: 'from-emerald-500 to-teal-500',
      description: 'Take customer orders'
    },
    { 
      icon: FileText, 
      label: 'Reports', 
      path: '/reports', 
      color: 'from-blue-500 to-indigo-500',
      description: 'View analytics'
    },
    { 
      icon: MenuIcon, 
      label: 'Menu', 
      path: '/menu', 
      color: 'from-purple-500 to-pink-500',
      description: 'Manage items'
    },
    { 
      icon: Calendar, 
      label: 'Advances', 
      path: '/advances', 
      color: 'from-orange-500 to-red-500',
      description: 'Pre-orders'
    }
  ];

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    
    // Get analytics data
    const todaySales = getTodaysSales();
    const weeklyRevenue = getWeeklySales();
    const monthlyRevenue = getMonthlySales();
    
    const todayOrders = getOrdersCount('today');
    const weeklyOrders = getOrdersCount('week');
    const monthlyOrders = getOrdersCount('month');
    
    // Assuming one customer per order for simplicity
    const todayCustomers = todayOrders;
    const weeklyCustomers = weeklyOrders;
    const monthlyCustomers = monthlyOrders;
    
    setRealTimeData({
      todaySales,
      weeklyRevenue,
      monthlyRevenue,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      todayCustomers,
      weeklyCustomers,
      monthlyCustomers
    });
    setIsRefreshing(false);
  };

  // Auto-refresh every 30 seconds and on component mount
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [orders, advanceOrders]);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time insights for Savaliya Ice Cream Parlor</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline" className="flex items-center space-x-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salesData.map((data, index) => (
          <Card key={data.period} className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                {data.period} Sales
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-800">₹{data.revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Orders</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{data.orders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">Customers</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{data.customers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-red-500" />
              <span>Recent Advance Bookings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map((notification, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-purple-50 hover:from-purple-50 hover:to-pink-50 transition-all duration-200">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'warning' ? 'bg-yellow-400' :
                    notification.type === 'info' ? 'bg-blue-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No advance bookings available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex items-center justify-start space-x-3 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50"
                  onClick={() => handleQuickAction(action.path)}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold block">{action.label}</span>
                    <span className="text-xs text-gray-500">{action.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
