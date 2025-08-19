
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, Calendar as CalendarIcon, FileText, Download } from 'lucide-react';
import { useSupabaseApp } from '@/contexts/SupabaseAppContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Reports = () => {
  const { orders, advanceOrders, menuItems } = useSupabaseApp();
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [dateRangeMode, setDateRangeMode] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    dailySales: [],
    topProducts: [],
    ordersByType: [],
    revenueGrowth: 0
  });

  const calculateReports = () => {
    let startDate: Date;
    let endDate: Date = new Date();

    if (dateRangeMode && fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
    } else {
      const period = parseInt(selectedPeriod);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
    }
    
    // Filter completed orders within the selected period
    const completedOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return (order.status === 'completed' || order.payment_status === 'paid') &&
        orderDate >= startDate && orderDate <= endDate;
    });

    // Filter advance orders within the selected period
    const periodAdvanceOrders = advanceOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Calculate revenue including advance order remaining amounts for delivered orders
    const ordersRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    let advanceRevenue = 0;
    periodAdvanceOrders.forEach(order => {
      if (order.status === 'delivered') {
        // For delivered orders, include the full amount (advance + remaining)
        advanceRevenue += order.total_amount;
      } else if (order.status === 'confirmed') {
        // For confirmed orders, only include the advance amount
        advanceRevenue += order.advance_amount;
      }
    });
    
    const totalRevenue = ordersRevenue + advanceRevenue;
    
    const totalOrders = completedOrders.length + periodAdvanceOrders.filter(order => 
      order.status === 'confirmed' || order.status === 'delivered'
    ).length;
    
    const totalCustomers = totalOrders; // Assuming one customer per order
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate daily sales for the chart
    const dailySalesMap = new Map();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toLocaleDateString();
      dailySalesMap.set(dateStr, { date: dateStr, sales: 0, orders: 0 });
    }

    // Add regular orders
    completedOrders.forEach(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString();
      if (dailySalesMap.has(orderDate)) {
        const dayData = dailySalesMap.get(orderDate);
        dayData.sales += order.total_amount;
        dayData.orders += 1;
      }
    });

    // Add advance orders with proper revenue calculation
    periodAdvanceOrders.forEach(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString();
      if (dailySalesMap.has(orderDate)) {
        const dayData = dailySalesMap.get(orderDate);
        if (order.status === 'delivered') {
          dayData.sales += order.total_amount; // Full amount for delivered
        } else if (order.status === 'confirmed') {
          dayData.sales += order.advance_amount; // Only advance for confirmed
        }
        dayData.orders += 1;
      }
    });

    const dailySales = Array.from(dailySalesMap.values());

    // Calculate top products from order items and advance order items
    const productSales = new Map();
    
    // Add regular order items
    completedOrders.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach(item => {
          const productName = item.menu_item?.name || 'Unknown Product';
          if (!productSales.has(productName)) {
            productSales.set(productName, { name: productName, sales: 0, quantity: 0 });
          }
          const product = productSales.get(productName);
          product.sales += item.total_price;
          product.quantity += item.quantity;
        });
      }
    });

    // Add advance order items
    periodAdvanceOrders.forEach(order => {
      if (order.advance_order_items && (order.status === 'confirmed' || order.status === 'delivered')) {
        order.advance_order_items.forEach(item => {
          const productName = item.menu_item?.name || 'Unknown Product';
          if (!productSales.has(productName)) {
            productSales.set(productName, { name: productName, sales: 0, quantity: 0 });
          }
          const product = productSales.get(productName);
          product.sales += item.total_price;
          product.quantity += item.quantity;
        });
      }
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Calculate orders by type including advance orders
    const orderTypeMap = new Map();
    completedOrders.forEach(order => {
      const type = order.order_type || 'dine-in';
      orderTypeMap.set(type, (orderTypeMap.get(type) || 0) + 1);
    });

    // Add advance orders as a separate type
    const confirmedAdvanceOrders = periodAdvanceOrders.filter(order => 
      order.status === 'confirmed' || order.status === 'delivered'
    );
    if (confirmedAdvanceOrders.length > 0) {
      orderTypeMap.set('advance-order', confirmedAdvanceOrders.length);
    }

    const ordersByType = Array.from(orderTypeMap.entries()).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      count
    }));

    // Calculate revenue growth (compare with previous period)
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    if (dateRangeMode && fromDate && toDate) {
      const periodLength = toDate.getTime() - fromDate.getTime();
      previousPeriodEnd = new Date(fromDate);
      previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);
    } else {
      const period = parseInt(selectedPeriod);
      previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (period * 2));
      previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - period);
    }

    const previousPeriodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return (order.status === 'completed' || order.payment_status === 'paid') &&
        orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
    });

    const previousAdvanceOrders = advanceOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
    });

    const previousOrdersRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    let previousAdvanceRevenue = 0;
    previousAdvanceOrders.forEach(order => {
      if (order.status === 'delivered') {
        previousAdvanceRevenue += order.total_amount; // Full amount for delivered
      } else if (order.status === 'confirmed') {
        previousAdvanceRevenue += order.advance_amount; // Only advance for confirmed
      }
    });
    
    const previousRevenue = previousOrdersRevenue + previousAdvanceRevenue;
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    setReportData({
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      dailySales,
      topProducts,
      ordersByType,
      revenueGrowth
    });
  };

  useEffect(() => {
    calculateReports();
  }, [orders, advanceOrders, selectedPeriod, dateRangeMode, fromDate, toDate]);

  const downloadCSV = () => {
    const dateRangeText = dateRangeMode && fromDate && toDate 
      ? `${format(fromDate, 'dd-MMM-yyyy')}-to-${format(toDate, 'dd-MMM-yyyy')}`
      : `${selectedPeriod}-days`;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `₹${reportData.totalRevenue.toLocaleString()}`],
      ['Total Orders', reportData.totalOrders],
      ['Total Customers', reportData.totalCustomers],
      ['Average Order Value', `₹${reportData.avgOrderValue.toFixed(2)}`],
      ['Revenue Growth', `${reportData.revenueGrowth.toFixed(1)}%`],
      [''],
      ['Top Products', ''],
      ['Product Name', 'Sales', 'Quantity'],
      ...reportData.topProducts.map(product => [
        product.name,
        `₹${product.sales.toFixed(2)}`,
        product.quantity
      ]),
      [''],
      ['Orders by Type', ''],
      ['Type', 'Count'],
      ...reportData.ordersByType.map(type => [type.type, type.count])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${dateRangeText}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const dateRangeText = dateRangeMode && fromDate && toDate 
      ? `${format(fromDate, 'dd MMM yyyy')} to ${format(toDate, 'dd MMM yyyy')}`
      : `Last ${selectedPeriod} days`;

    // Create a simple HTML structure for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Business Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Business Report</h1>
            <p>Period: ${dateRangeText}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <h3>Total Revenue</h3>
              <p>₹${reportData.totalRevenue.toLocaleString()}</p>
            </div>
            <div class="metric">
              <h3>Total Orders</h3>
              <p>${reportData.totalOrders}</p>
            </div>
            <div class="metric">
              <h3>Total Customers</h3>
              <p>${reportData.totalCustomers}</p>
            </div>
            <div class="metric">
              <h3>Average Order Value</h3>
              <p>₹${reportData.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
          
          <h2>Top Products</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Sales</th>
                <th>Quantity</th>
                <th>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.topProducts.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>₹${product.sales.toFixed(2)}</td>
                  <td>${product.quantity}</td>
                  <td>₹${(product.sales / product.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Orders by Type</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.ordersByType.map(type => `
                <tr>
                  <td>${type.type}</td>
                  <td>${type.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow!.document.write(htmlContent);
    printWindow!.document.close();
    printWindow!.focus();
    printWindow!.print();
  };

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-3">
            <Button onClick={downloadCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={downloadPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={dateRangeMode ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangeMode(!dateRangeMode)}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Date Range
            </Button>
            
            {!dateRangeMode ? (
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[150px] justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd MMM yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[150px] justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd MMM yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportData.totalRevenue.toLocaleString()}</div>
            <p className={`text-xs ${reportData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reportData.revenueGrowth >= 0 ? '+' : ''}{reportData.revenueGrowth.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Including advance orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Unique customers served
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reportData.avgOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Average per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                <Bar dataKey="sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Type */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Orders by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.ordersByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.ordersByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Order Count */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Daily Order Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product Name</th>
                  <th className="text-right p-2">Quantity Sold</th>
                  <th className="text-right p-2">Total Sales</th>
                  <th className="text-right p-2">Avg. Price</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topProducts.map((product, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{product.name}</td>
                    <td className="p-2 text-right">{product.quantity}</td>
                    <td className="p-2 text-right">₹{product.sales.toFixed(2)}</td>
                    <td className="p-2 text-right">₹{(product.sales / product.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
