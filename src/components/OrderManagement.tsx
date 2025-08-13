import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Clock, CreditCard, User, Phone, Calendar, MapPin, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

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

const OrderManagement = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAdvanceOrder, setShowAdvanceOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const { toast } = useToast();
  const { menuItems, createOrder, createAdvanceOrder, updateOrder } = useSupabaseApp();
  const isMobile = useIsMobile();
  const location = useLocation();

  const [advanceOrderData, setAdvanceOrderData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryDate: '',
    deliveryTime: '',
    specialInstructions: '',
    items: [] as OrderItem[]
  });

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

  const categories = ['All', 'Ice Cream Scoops', 'Sundaes', 'Shakes', 'Toppings', 'Beverages'];

  const generateOrderId = () => {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  const addToOrder = (item: any) => {
    const existingItem = orderItems.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
    toast({
      title: "Item Added",
      description: `${item.name} added to order`,
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

  const getSubtotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal - discountAmount;
  };

  const holdOrder = () => {
    if (orderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Add items to hold an order",
        variant: "destructive"
      });
      return;
    }

    const orderId = generateOrderId();
    const time = new Date().toLocaleTimeString();
    const heldOrder: HeldOrder = {
      id: orderId,
      items: orderItems,
      totalPrice: getTotal(),
      time,
      customerName,
      customerPhone,
      tableNumber,
    };

    setHeldOrders([...heldOrders, heldOrder]);
    setOrderItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setDiscountAmount(0);

    toast({
      title: "Order Held",
      description: `Order ${orderId} has been held successfully`,
    });
  };

  const recallOrder = (orderId: string) => {
    const orderToRecall = heldOrders.find(order => order.id === orderId);
    if (orderToRecall) {
      setOrderItems(orderToRecall.items);
      setCustomerName(orderToRecall.customerName || '');
      setCustomerPhone(orderToRecall.customerPhone || '');
      setTableNumber(orderToRecall.tableNumber || '');
      setHeldOrders(heldOrders.filter(order => order.id !== orderId));
      
      toast({
        title: "Order Recalled",
        description: `Order ${orderId} has been recalled to current order`,
      });
    }
  };

  const processPayment = () => {
    if (orderItems.length === 0) {
      toast({
        title: "No Items",
        description: "Add items to process payment",
        variant: "destructive"
      });
      return;
    }
    setShowPayment(true);
  };

  const completePayment = async () => {
    if (!paymentMode || !selectedOrderType) {
      toast({
        title: "Missing Information",
        description: "Please select payment method and order type",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        customerName,
        customerPhone,
        tableNumber,
        orderType: selectedOrderType,
        items: orderItems,
        total: getTotal(),
        paymentMethod: paymentMode.toLowerCase()
      };

      const createdOrder = await createOrder(orderData);
      
      if (createdOrder) {
        await updateOrder(createdOrder.id, {
          status: 'completed',
          payment_status: 'paid'
        });

        toast({
          title: "Payment Successful",
          description: `Payment of ₹${getTotal().toFixed(2)} completed via ${paymentMode} for ${selectedOrderType}`,
        });
        
        setOrderItems([]);
        setShowPayment(false);
        setPaymentMode('');
        setSelectedOrderType('');
        setDiscountAmount(0);
        setCustomerName('');
        setCustomerPhone('');
        setTableNumber('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete payment",
        variant: "destructive"
      });
    }
  };

  const submitAdvanceOrder = async () => {
    if (!advanceOrderData.customerName || !advanceOrderData.customerPhone || !advanceOrderData.deliveryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill all mandatory fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        ...advanceOrderData,
        items: orderItems,
        total: getTotal()
      };
      
      await createAdvanceOrder(orderData);
      
      setAdvanceOrderData({
        customerName: '',
        customerPhone: '',
        deliveryDate: '',
        deliveryTime: '',
        specialInstructions: '',
        items: []
      });
      setOrderItems([]);
      setShowAdvanceOrder(false);
      
      toast({
        title: "Success",
        description: "Advance order created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create advance order",
        variant: "destructive"
      });
    }
  };

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (showAdvanceOrder) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Advance Order Registration</h1>
          <Button variant="outline" onClick={() => setShowAdvanceOrder(false)} className="w-full sm:w-auto">
            Back to Orders
          </Button>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={advanceOrderData.customerName}
                  onChange={(e) => setAdvanceOrderData({...advanceOrderData, customerName: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Contact Number *</Label>
                <Input
                  id="customerPhone"
                  value={advanceOrderData.customerPhone}
                  onChange={(e) => setAdvanceOrderData({...advanceOrderData, customerPhone: e.target.value})}
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={advanceOrderData.deliveryDate}
                  onChange={(e) => setAdvanceOrderData({...advanceOrderData, deliveryDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="deliveryTime">Delivery Time</Label>
                <Input
                  id="deliveryTime"
                  type="time"
                  value={advanceOrderData.deliveryTime}
                  onChange={(e) => setAdvanceOrderData({...advanceOrderData, deliveryTime: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Input
                id="specialInstructions"
                value={advanceOrderData.specialInstructions}
                onChange={(e) => setAdvanceOrderData({...advanceOrderData, specialInstructions: e.target.value})}
                placeholder="Any special instructions"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button onClick={submitAdvanceOrder} className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                Register Advance Order
              </Button>
              <Button variant="outline" onClick={() => setShowAdvanceOrder(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Payment Processing</h1>
          <Button variant="outline" onClick={() => setShowPayment(false)} className="w-full sm:w-auto">
            Back to Order
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                    </div>
                    <span className="font-semibold ml-2">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="tableNumber">Table Number</Label>
                  <Input
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Enter table number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="orderType">Order Type *</Label>
                <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discount">Discount Amount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max={getSubtotal()}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter discount amount"
                />
              </div>

              <div>
                <Label>Payment Method *</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  <Button
                    variant={paymentMode === 'Cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMode('Cash')}
                    className="justify-start h-12 text-sm md:text-base"
                  >
                    💵 Cash Payment
                  </Button>
                  <Button
                    variant={paymentMode === 'UPI' ? 'default' : 'outline'}
                    onClick={() => setPaymentMode('UPI')}
                    className="justify-start h-12 text-sm md:text-base"
                  >
                    📱 UPI Payment
                  </Button>
                  <Button
                    variant={paymentMode === 'Card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMode('Card')}
                    className="justify-start h-12 text-sm md:text-base"
                  >
                    💳 Card Payment
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  onClick={completePayment}
                  className="w-full bg-green-500 hover:bg-green-600 h-12 text-sm md:text-base"
                  disabled={!paymentMode || !selectedOrderType}
                >
                  Complete Payment - ₹{getTotal().toFixed(2)}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPayment(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Order Management</h1>
          <p className="text-gray-600 text-sm md:text-base">Take orders and manage transactions</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-3 sm:space-y-0 sm:space-x-3">
          <Button onClick={() => setShowAdvanceOrder(true)} className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto text-sm md:text-base">
            <Calendar className="w-4 h-4 mr-2" />
            Advance Order
          </Button>
          {heldOrders.length > 0 && (
            <Badge variant="outline" className="text-sm md:text-lg px-3 py-1 justify-center sm:justify-start">
              {heldOrders.length} Held Orders
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`${selectedCategory === category ? "bg-orange-500 hover:bg-orange-600" : ""} whitespace-nowrap text-xs md:text-sm`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {filteredItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => addToOrder(item)}
                className="h-16 md:h-20 flex flex-col items-center justify-center bg-white hover:bg-orange-50 border-2 border-gray-200 hover:border-orange-300 text-gray-800 p-2"
                variant="outline"
              >
                <span className="font-semibold text-xs md:text-sm text-center leading-tight line-clamp-2">{item.name}</span>
                <span className="text-green-600 font-bold text-sm md:text-lg">₹{item.price}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Current Order</CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">No items in order</p>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm md:text-base truncate">{item.name}</h4>
                        <p className="text-xs md:text-sm text-gray-600">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center space-x-1 md:space-x-2 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 md:w-8 text-center text-sm md:text-base">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {orderItems.length > 0 && (
            <>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm md:text-base">
                      <span>Subtotal:</span>
                      <span>₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-600 text-sm md:text-base">
                        <span>Discount:</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between text-lg font-bold text-orange-600">
                      <span>Total:</span>
                      <span>₹{getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button onClick={holdOrder} className="w-full bg-blue-500 hover:bg-blue-600 text-sm md:text-base">
                  <Clock className="w-4 h-4 mr-2" />
                  Hold Order
                </Button>
                <Button onClick={processPayment} className="w-full bg-green-500 hover:bg-green-600 text-sm md:text-base">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </>
          )}

          {heldOrders.length > 0 && (
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Held Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {heldOrders.map((order) => (
                    <div key={order.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">Order {order.id}</p>
                          <p className="text-xs md:text-sm text-gray-600">₹{order.totalPrice.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{order.time}</p>
                          {order.customerName && (
                            <p className="text-xs text-gray-500">{order.customerName}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => recallOrder(order.id)}
                          className="bg-orange-500 hover:bg-orange-600 ml-2 text-xs md:text-sm"
                        >
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Recall
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
