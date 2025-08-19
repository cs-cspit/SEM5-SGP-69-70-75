
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, Receipt, CreditCard, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BillingPayment = () => {
  const [currentBill, setCurrentBill] = useState({
    items: [
      { id: 1, name: 'Classic Vanilla', quantity: 2, price: 3.50 },
      { id: 2, name: 'Chocolate Fudge Sundae', quantity: 1, price: 8.50 },
      { id: 3, name: 'Strawberry Shake', quantity: 1, price: 5.50 }
    ],
    customerName: 'John Doe',
    orderType: 'Dine-in',
    gstRate: 5,
    discount: 0
  });

  const [paymentMode, setPaymentMode] = useState('');
  const [splitBill, setSplitBill] = useState(false);
  const [splitAmount, setSplitAmount] = useState(0);
  const { toast } = useToast();

  const getSubtotal = () => {
    return currentBill.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    return (getSubtotal() * currentBill.discount) / 100;
  };

  const getGSTAmount = () => {
    const discountedAmount = getSubtotal() - getDiscountAmount();
    return (discountedAmount * currentBill.gstRate) / 100;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const gst = getGSTAmount();
    return subtotal - discount + gst;
  };

  const handlePayment = () => {
    if (!paymentMode) {
      toast({
        title: "Select Payment Mode",
        description: "Please select a payment method to proceed",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Payment Successful",
      description: `Payment of ₹${getTotal().toFixed(2)} completed via ${paymentMode}`,
    });
  };

  const printInvoice = () => {
    toast({
      title: "Invoice Printed",
      description: "Invoice has been sent to printer",
    });
  };

  const paymentModes = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'card', name: 'Card', icon: '💳' },
    { id: 'upi', name: 'UPI', icon: '📱' },
    { id: 'paytm', name: 'Paytm', icon: '📲' },
    { id: 'cheque', name: 'Cheque', icon: '📋' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Billing & Payment</h1>
          <p className="text-gray-600">Process payments and generate invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill Summary */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Bill Summary</span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              Customer: {currentBill.customerName} | Order Type: {currentBill.orderType}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentBill.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{getSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={currentBill.discount}
                      onChange={(e) => setCurrentBill({...currentBill, discount: parseFloat(e.target.value) || 0})}
                      className="w-20 h-8 text-sm"
                      placeholder="0"
                    />
                    <span className="text-sm">%</span>
                    <span className="text-red-500">-₹{getDiscountAmount().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span>GST ({currentBill.gstRate}%):</span>
                  <span>₹{getGSTAmount().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xl font-bold text-orange-600">
                  <span>Total:</span>
                  <span>₹{getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Processing */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Modes */}
            <div>
              <Label className="text-base font-medium mb-3 block">Select Payment Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                {paymentModes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant={paymentMode === mode.name ? 'default' : 'outline'}
                    onClick={() => setPaymentMode(mode.name)}
                    className="h-12 justify-start"
                  >
                    <span className="mr-2">{mode.icon}</span>
                    {mode.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Split Bill Option */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="splitBill"
                  checked={splitBill}
                  onChange={(e) => setSplitBill(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="splitBill">Split Bill</Label>
              </div>
              
              {splitBill && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="splitAmount">Split Amount:</Label>
                  <Input
                    id="splitAmount"
                    type="number"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(parseFloat(e.target.value) || 0)}
                    className="w-32"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-600">
                    Remaining: ₹{(getTotal() - splitAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handlePayment}
                className="w-full bg-green-500 hover:bg-green-600 h-12"
                disabled={!paymentMode}
              >
                Process Payment - ₹{getTotal().toFixed(2)}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={printInvoice}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Button variant="outline">
                  <Receipt className="w-4 h-4 mr-2" />
                  Email Receipt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Order #000{i}</p>
                  <p className="text-sm text-gray-600">Cash Payment - Dine-in</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{(150 + i * 50).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{i} mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPayment;
