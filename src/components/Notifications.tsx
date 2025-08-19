
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Info, Calendar, Clock, User, Phone, RotateCcw, CheckCircle, Check } from 'lucide-react';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { advanceOrders, heldOrders, updateAdvanceOrder, updateOrder, deleteHeldOrder } = useSupabaseApp();
  const { markAsRead, isRead, getUnreadCount } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Convert advance orders to notifications format
  const advanceNotifications = advanceOrders.map((order) => ({
    id: order.id,
    type: 'advance-order' as const,
    title: 'Advance Order Booking',
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    deliveryDate: order.delivery_date,
    deliveryTime: order.delivery_time,
    total: order.total_amount,
    status: order.status,
    specialInstructions: order.special_instructions,
    time: `${Math.abs(new Date(order.delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) < 1 ? 
      'Today' : 
      Math.ceil(Math.abs(new Date(order.delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + ' days'
    } ${new Date(order.delivery_date) > new Date() ? 'ahead' : 'ago'}`,
    isRead: isRead(`advance-order-${order.id}`)
  }));

  // Convert held orders to notifications format
  const heldNotifications = heldOrders.map((order) => ({
    id: order.id,
    type: 'held-order' as const,
    title: 'Order On Hold',
    customerName: order.original_order?.customer_name || 'Walk-in Customer',
    customerPhone: order.original_order?.customer_phone || 'N/A',
    orderNumber: order.original_order?.order_number,
    total: order.original_order?.total_amount || 0,
    status: 'held',
    reason: order.reason,
    time: `Held ${Math.floor((Date.now() - new Date(order.held_at).getTime()) / (1000 * 60))} min ago`,
    originalOrder: order.original_order,
    isRead: isRead(`held-order-${order.id}`)
  }));

  const allNotifications = [...advanceNotifications, ...heldNotifications];
  const unreadCount = getUnreadCount(allNotifications);

  const handleAdvanceOrderAction = async (orderId: string, action: 'confirm' | 'ready' | 'delivered') => {
    try {
      await updateAdvanceOrder(orderId, { status: action === 'confirm' ? 'confirmed' : action });
      toast({
        title: "Success",
        description: `Advance order marked as ${action}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const handleRecallOrder = async (heldOrderId: string, originalOrderId?: string) => {
    try {
      if (originalOrderId) {
        await updateOrder(originalOrderId, { status: 'pending' });
        await deleteHeldOrder(heldOrderId);
        toast({
          title: "Order Recalled",
          description: "Order has been recalled and is now active",
        });
        navigate('/orders');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recall order",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsRead = (notificationId: string, notificationType: string) => {
    markAsRead(`${notificationType}-${notificationId}`);
  };

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'held-order') {
      return 'bg-red-100 text-red-800';
    }

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600">Manage advance orders and held orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-lg px-3 py-1 bg-red-50 text-red-700 border-red-200">
            {unreadCount} Unread
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {allNotifications.length} Total
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>All Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allNotifications.length > 0 ? allNotifications.map((notification) => (
                <div 
                  key={`${notification.type}-${notification.id}`} 
                  className={`p-6 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-blue-200 bg-blue-50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'held-order' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {notification.type === 'held-order' ? 
                          <Clock className="w-5 h-5 text-red-600" /> : 
                          <Info className="w-5 h-5 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge className="bg-red-500 text-white text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{notification.customerName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{notification.customerPhone}</span>
                          </div>
                          {notification.type === 'held-order' && notification.orderNumber && (
                            <span className="font-medium">Order #{notification.orderNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getStatusBadge(notification.status, notification.type)}>
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                  </div>

                  {notification.type === 'advance-order' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Delivery Date:</span>
                          <span className="font-medium">{new Date(notification.deliveryDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Delivery Time:</span>
                          <span className="font-medium">{notification.deliveryTime || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Amount:</span>
                          <span className="text-lg text-green-600">₹{notification.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {notification.specialInstructions && (
                        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                          <h5 className="font-medium text-yellow-800 mb-1">Special Instructions:</h5>
                          <p className="text-sm text-yellow-700">{notification.specialInstructions}</p>
                        </div>
                      )}

                      <div className="flex space-x-2 flex-wrap">
                        {notification.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceOrderAction(notification.id, 'confirm')}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {notification.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceOrderAction(notification.id, 'ready')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {notification.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvanceOrderAction(notification.id, 'delivered')}
                            className="bg-gray-500 hover:bg-gray-600"
                          >
                            Mark Delivered
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/advances')}
                        >
                          View Details
                        </Button>
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id, notification.type)}
                            className="bg-green-50 hover:bg-green-100 text-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {notification.type === 'held-order' && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Order Amount:</span>
                          <span className="text-lg text-green-600">₹{notification.total.toFixed(2)}</span>
                        </div>
                        {notification.reason && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Hold Reason:</span> {notification.reason}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleRecallOrder(notification.id, notification.originalOrder?.id)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Recall Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/held-orders')}
                        >
                          View Details
                        </Button>
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id, notification.type)}
                            className="bg-green-50 hover:bg-green-100 text-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )) : (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No Notifications</h3>
                  <p className="text-gray-400">All notifications will appear here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
