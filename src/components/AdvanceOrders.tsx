
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Phone, MapPin, Clock, Plus, Minus, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const AdvanceOrders = () => {
  const { advanceOrders, createAdvanceOrder, updateAdvanceOrder, menuItems } = useSupabaseApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryDate: '',
    deliveryTime: '',
    specialInstructions: '',
    advanceAmount: 0
  });

  const addMenuItem = (menuItemId: string) => {
    const menuItem = menuItems.find(item => item.id.toString() === menuItemId);
    if (!menuItem) return;

    const existingItem = orderItems.find(item => item.id === menuItem.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        category: menuItem.category
      }]);
    }

    toast({
      title: "Item Added",
      description: `${menuItem.name} added to advance order`,
    });
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    } else {
      setOrderItems(orderItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id: number) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const getTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.deliveryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to the advance order",
        variant: "destructive"
      });
      return;
    }

    try {
      await createAdvanceOrder({
        ...formData,
        items: orderItems,
        total: getTotal()
      });
      
      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deliveryDate: '',
        deliveryTime: '',
        specialInstructions: '',
        advanceAmount: 0
      });
      setOrderItems([]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating advance order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateAdvanceOrder(orderId, { status: status as any });
      toast({
        title: "Status Updated",
        description: `Order status updated to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  if (showCreateForm) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Create Advance Order</h1>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Back to Orders
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryDate">Delivery Date *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    type="time"
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Input
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                    placeholder="Any special instructions"
                  />
                </div>
                <div>
                  <Label htmlFor="advanceAmount">Advance Amount (₹)</Label>
                  <Input
                    id="advanceAmount"
                    type="number"
                    min="0"
                    max={getTotal()}
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData({...formData, advanceAmount: parseFloat(e.target.value) || 0})}
                    placeholder="Enter advance amount"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Add Items</Label>
                  <Select onValueChange={addMenuItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item to add" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {menuItems
                        .filter(item => item.in_stock)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} - ₹{item.price}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right ml-4">
                        <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {orderItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-lg font-bold text-green-600">₹{getTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span>Advance Amount:</span>
                      <span className="text-blue-600">₹{formData.advanceAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Remaining:</span>
                      <span className="text-orange-600">₹{(getTotal() - formData.advanceAmount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center space-x-4">
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              Create Advance Order
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Advance Orders</h1>
          <p className="text-gray-600">Manage pre-orders and advance bookings</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          New Advance Order
        </Button>
      </div>

      {advanceOrders.length === 0 ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Advance Orders</h3>
            <p className="text-gray-500">Create your first advance order to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {advanceOrders.map((order) => (
            <Card key={order.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="flex items-center"><Phone className="w-4 h-4 mr-1" />{order.customer_phone}</p>
                  <p className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{new Date(order.delivery_date).toLocaleDateString()}</p>
                  {order.delivery_time && (
                    <p className="flex items-center"><Clock className="w-4 h-4 mr-1" />{order.delivery_time}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Amount:</span>
                    <span className="font-semibold">₹{order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Advance Paid:</span>
                    <span className="text-green-600">₹{order.advance_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="text-orange-600">₹{order.remaining_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Select onValueChange={(status) => updateOrderStatus(order.id, status)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Advance Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Customer Information:</h4>
                <p className="text-sm"><strong>Name:</strong> {selectedOrder.customer_name}</p>
                <p className="text-sm"><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                {selectedOrder.customer_email && (
                  <p className="text-sm"><strong>Email:</strong> {selectedOrder.customer_email}</p>
                )}
                <p className="text-sm"><strong>Delivery Date:</strong> {new Date(selectedOrder.delivery_date).toLocaleDateString()}</p>
                {selectedOrder.delivery_time && (
                  <p className="text-sm"><strong>Delivery Time:</strong> {selectedOrder.delivery_time}</p>
                )}
                {selectedOrder.special_instructions && (
                  <p className="text-sm"><strong>Instructions:</strong> {selectedOrder.special_instructions}</p>
                )}
              </div>

              {selectedOrder.advance_order_items && selectedOrder.advance_order_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Order Items:</h4>
                  <div className="space-y-2">
                    {selectedOrder.advance_order_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.menu_item?.name || 'Unknown Item'}</span>
                          <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-semibold">₹{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Payment Summary:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">₹{selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Paid:</span>
                    <span className="text-green-600">₹{selectedOrder.advance_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Remaining:</span>
                    <span className="text-orange-600">₹{selectedOrder.remaining_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setSelectedOrder(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvanceOrders;
