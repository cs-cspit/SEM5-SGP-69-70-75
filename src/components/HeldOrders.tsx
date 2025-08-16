
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface HeldOrder {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  time: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
}

const HeldOrders = () => {
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<HeldOrder | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load held orders from localStorage on component mount
  useEffect(() => {
    const savedHeldOrders = localStorage.getItem('heldOrders');
    if (savedHeldOrders) {
      setHeldOrders(JSON.parse(savedHeldOrders));
    }
  }, []);

  // Save held orders to localStorage whenever heldOrders changes
  useEffect(() => {
    localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  const recallOrder = (order: HeldOrder) => {
    try {
      // Remove the order from held orders
      const updatedHeldOrders = heldOrders.filter(heldOrder => heldOrder.id !== order.id);
      setHeldOrders(updatedHeldOrders);
      
      toast({
        title: "Order Recalled",
        description: `Order ${order.id} has been recalled`,
      });

      // Navigate to orders page with the recalled order data
      navigate('/orders', { 
        state: { 
          recalledOrder: order 
        } 
      });
    } catch (error) {
      console.error('Error recalling order:', error);
      toast({
        title: "Error",
        description: "Failed to recall order",
        variant: "destructive"
      });
    }
  };

  const deleteOrder = (orderId: string) => {
    try {
      const updatedHeldOrders = heldOrders.filter(order => order.id !== orderId);
      setHeldOrders(updatedHeldOrders);
      
      toast({
        title: "Order Deleted",
        description: "Held order has been permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete held order",
        variant: "destructive"
      });
    }
  };

  const getTimeAgo = (timeString: string) => {
    const orderTime = new Date();
    const [time, modifier] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    
    orderTime.setHours(
      modifier === 'PM' && hours !== '12' ? parseInt(hours) + 12 : parseInt(hours),
      parseInt(minutes),
      0,
      0
    );
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ${diffInMinutes % 60}m ago`;
  };

  const getTimeColor = (timeString: string) => {
    const orderTime = new Date();
    const [time, modifier] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    
    orderTime.setHours(
      modifier === 'PM' && hours !== '12' ? parseInt(hours) + 12 : parseInt(hours),
      parseInt(minutes),
      0,
      0
    );
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes > 60) return 'text-red-600';
    if (diffInMinutes > 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Held Orders</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage and recall held orders</p>
          </div>
        </div>
        <Badge variant="outline" className="text-base md:text-lg px-4 py-2 w-full sm:w-auto text-center">
          {heldOrders.length} Orders Held
        </Badge>
      </div>

      {heldOrders.length === 0 ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <Clock className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Held Orders</h3>
            <p className="text-gray-500 text-sm md:text-base">Orders that are held will appear here for easy recall</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {heldOrders.map((order) => (
            <Card key={order.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base md:text-lg">Order {order.id}</CardTitle>
                  <Badge className="bg-gray-100 text-gray-800 text-xs md:text-sm">
                    Held Order
                  </Badge>
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  {order.customerName && <p>Customer: {order.customerName}</p>}
                  {order.tableNumber && <p>Table: {order.tableNumber}</p>}
                  <p className={`font-medium ${getTimeColor(order.time)}`}>
                    Held {getTimeAgo(order.time)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-xs md:text-sm text-gray-700">Order Items:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs md:text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs md:text-sm font-semibold border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => recallOrder(order)}
                      className="bg-blue-500 hover:bg-blue-600 text-xs md:text-sm"
                    >
                      <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Recall
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs md:text-sm"
                    >
                      <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      View
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteOrder(order.id)}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Delete Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Order Details - {selectedOrder.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm md:text-base">Customer Information:</h4>
                <div className="space-y-1 text-xs md:text-sm text-gray-600">
                  <p>Name: {selectedOrder.customerName || 'Not specified'}</p>
                  <p>Phone: {selectedOrder.customerPhone || 'Not specified'}</p>
                  {selectedOrder.tableNumber && (
                    <p>Table: {selectedOrder.tableNumber}</p>
                  )}
                  <p>Time: {selectedOrder.time}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-sm md:text-base">Order Items:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs md:text-sm border-b pb-1">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-600">₹{item.price} × {item.quantity}</p>
                      </div>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold text-sm md:text-base">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{selectedOrder.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={() => {
                    recallOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-sm md:text-base"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Recall Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 text-sm md:text-base"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HeldOrders;
