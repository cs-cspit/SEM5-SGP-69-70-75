import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, User, CreditCard, Package, Eye, Filter } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const TotalOrders = () => {
  const { completedOrders } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filteredOrders = completedOrders.filter(order => {
    const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || order.orderType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'dine-in': return 'bg-blue-100 text-blue-800';
      case 'takeaway': return 'bg-green-100 text-green-800';
      case 'delivery': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash': return '💵';
      case 'UPI': return '📱';
      case 'Cheque': return '📋';
      default: return '💳';
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getTotalRevenue = () => {
    return filteredOrders.reduce((total, order) => total + order.total, 0);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Total Orders</h1>
          <p className="text-gray-600">View all completed orders and transactions</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {completedOrders.length} Total Orders
          </Badge>
          <Badge className="text-lg px-4 py-2 bg-green-500">
            ₹{getTotalRevenue().toFixed(2)} Revenue
          </Badge>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="All">All Orders</SelectItem>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {completedOrders.length === 0 
                ? "Completed orders will appear here" 
                : "Try adjusting your search criteria"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <Badge className={getOrderTypeColor(order.orderType)}>
                    {order.orderType}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(order.timestamp)}</span>
                  </div>
                  {order.customerName && (
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-4 h-4" />
                      <span>{order.customerName}</span>
                    </div>
                  )}
                  {order.tableNumber && (
                    <div className="text-sm text-gray-600">
                      <span>{order.tableNumber}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Order Items Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Items ({order.items.length}):</h4>
                  <div className="max-h-24 overflow-y-auto">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate">{item.name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>{getPaymentMethodIcon(order.paymentMethod)}</span>
                    <span className="text-sm font-medium">{order.paymentMethod}</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{order.total.toFixed(2)}
                  </div>
                </div>

                {/* Actions */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order Details - #{selectedOrder.id}</CardTitle>
                <Badge className={getOrderTypeColor(selectedOrder.orderType)}>
                  {selectedOrder.orderType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Information:</h4>
                  <p className="text-sm text-gray-600">Order ID: {selectedOrder.id}</p>
                  <p className="text-sm text-gray-600">Date: {formatDateTime(selectedOrder.timestamp)}</p>
                  <p className="text-sm text-gray-600">Type: {selectedOrder.orderType}</p>
                  {selectedOrder.tableNumber && (
                    <p className="text-sm text-gray-600">Table: {selectedOrder.tableNumber}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Customer & Payment:</h4>
                  <p className="text-sm text-gray-600">Customer: {selectedOrder.customerName || 'Walk-in'}</p>
                  <p className="text-sm text-gray-600">Payment: {selectedOrder.paymentMethod}</p>
                  <p className="text-sm text-green-600 font-medium">Total: ₹{selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Detailed Items */}
              <div>
                <h4 className="font-medium mb-3">Order Items:</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                      </div>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
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

export default TotalOrders;