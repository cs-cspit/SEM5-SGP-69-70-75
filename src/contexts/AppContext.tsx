
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Data interfaces
interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
}

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
  total: number;
  timestamp: Date;
  customerName?: string;
  tableNumber?: string;
}

interface CompletedOrder {
  id: string;
  items: OrderItem[];
  total: number;
  timestamp: Date;
  orderType: string;
  paymentMethod: string;
  customerName?: string;
  tableNumber?: string;
}

interface AdvanceOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  deliveryTime: string;
  specialInstructions: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'ready' | 'delivered';
  createdAt: Date;
}

// Context type
interface AppContextType {
  // Menu items
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: number, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: number) => void;
  
  // Held orders
  heldOrders: HeldOrder[];
  addHeldOrder: (order: Omit<HeldOrder, 'id'>) => void;
  removeHeldOrder: (id: string) => void;
  
  // Completed orders
  completedOrders: CompletedOrder[];
  addCompletedOrder: (order: Omit<CompletedOrder, 'id'>) => void;
  
  // Advance orders
  advanceOrders: AdvanceOrder[];
  addAdvanceOrder: (order: Omit<AdvanceOrder, 'id'>) => void;
  updateAdvanceOrder: (id: string, updates: Partial<AdvanceOrder>) => void;
  
  // Real-time data for dashboard
  getTodaysSales: () => number;
  getTotalOrders: () => number;
  getRecentOrders: () => CompletedOrder[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Load data from localStorage or use defaults
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('menuItems');
    return saved ? JSON.parse(saved) : [
    { id: 1, name: 'Classic Vanilla Bean', category: 'Ice Cream Scoops', price: 3.50, description: 'Creamy vanilla ice cream, a timeless favorite' },
    { id: 2, name: 'Chocolate Fudge Blast', category: 'Ice Cream Scoops', price: 6.25, description: 'Rich chocolate ice cream with fudge chunks' },
    { id: 3, name: 'Strawberry Swirl Sundae', category: 'Sundaes', price: 8.50, description: 'Fresh strawberry ice cream with syrup swirls' },
    { id: 4, name: 'Mint Chip Delight', category: 'Ice Cream Scoops', price: 3.75, description: 'Refreshing mint ice cream with chocolate chips' },
    { id: 5, name: 'Caramel Crunch Cone', category: 'Ice Cream Scoops', price: 4.50, description: 'Caramel ice cream in a waffle cone with nuts' },
    { id: 6, name: 'Rocky Road Supreme', category: 'Ice Cream Scoops', price: 7.25, description: 'Chocolate ice cream with marshmallows and nuts' },
    { id: 7, name: 'Vanilla Milkshake', category: 'Shakes', price: 5.25, description: 'Creamy vanilla milkshake' },
    { id: 8, name: 'Chocolate Milkshake', category: 'Shakes', price: 5.50, description: 'Rich chocolate milkshake' },
    { id: 9, name: 'Hot Fudge Sundae', category: 'Sundaes', price: 8.25, description: 'Hot fudge over vanilla ice cream' },
    { id: 10, name: 'Banana Split', category: 'Sundaes', price: 9.50, description: 'Classic banana split with three scoops' },
    { id: 11, name: 'Chocolate Chips', category: 'Toppings', price: 0.75, description: 'Premium chocolate chips' },
    { id: 12, name: 'Whipped Cream', category: 'Toppings', price: 0.50, description: 'Fresh whipped cream' },
    { id: 13, name: 'Cherry', category: 'Toppings', price: 0.25, description: 'Maraschino cherry' },
    { id: 14, name: 'Nuts', category: 'Toppings', price: 1.00, description: 'Mixed nuts' },
    { id: 15, name: 'Hot Chocolate', category: 'Beverages', price: 3.50, description: 'Rich hot chocolate' },
    { id: 16, name: 'Cold Coffee', category: 'Beverages', price: 4.00, description: 'Iced coffee' },
    { id: 17, name: 'Fresh Juice', category: 'Beverages', price: 3.25, description: 'Fresh fruit juice' }
    ];
  });

  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    const saved = localStorage.getItem('heldOrders');
    return saved ? JSON.parse(saved).map((order: any) => ({
      ...order,
      timestamp: new Date(order.timestamp)
    })) : [];
  });

  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>(() => {
    const saved = localStorage.getItem('completedOrders');
    return saved ? JSON.parse(saved).map((order: any) => ({
      ...order,
      timestamp: new Date(order.timestamp)
    })) : [];
  });

  const [advanceOrders, setAdvanceOrders] = useState<AdvanceOrder[]>(() => {
    const saved = localStorage.getItem('advanceOrders');
    return saved ? JSON.parse(saved).map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt)
    })) : [];
  });

  // Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
  }, [menuItems]);

  React.useEffect(() => {
    localStorage.setItem('heldOrders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  React.useEffect(() => {
    localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
  }, [completedOrders]);

  React.useEffect(() => {
    localStorage.setItem('advanceOrders', JSON.stringify(advanceOrders));
  }, [advanceOrders]);

  // Menu items functions
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newId = Math.max(...menuItems.map(i => i.id), 0) + 1;
    setMenuItems([...menuItems, { ...item, id: newId }]);
  };

  const updateMenuItem = (id: number, updates: Partial<MenuItem>) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteMenuItem = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  // Held orders functions
  const addHeldOrder = (order: Omit<HeldOrder, 'id'>) => {
    const newId = Date.now().toString();
    setHeldOrders([...heldOrders, { ...order, id: newId }]);
  };

  const removeHeldOrder = (id: string) => {
    setHeldOrders(heldOrders.filter(order => order.id !== id));
  };

  // Completed orders functions
  const addCompletedOrder = (order: Omit<CompletedOrder, 'id'>) => {
    const newId = Date.now().toString();
    setCompletedOrders([...completedOrders, { ...order, id: newId }]);
  };

  // Advance orders functions
  const addAdvanceOrder = (order: Omit<AdvanceOrder, 'id'>) => {
    const newId = Date.now().toString();
    setAdvanceOrders([...advanceOrders, { ...order, id: newId }]);
  };

  const updateAdvanceOrder = (id: string, updates: Partial<AdvanceOrder>) => {
    setAdvanceOrders(advanceOrders.map(order => 
      order.id === id ? { ...order, ...updates } : order
    ));
  };

  // Real-time data functions - now includes completed advance orders
  const getTodaysSales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Include both regular completed orders and completed advance orders
    const todayCompletedOrders = completedOrders
      .filter(order => order.timestamp >= today)
      .reduce((total, order) => total + order.total, 0);
    
    return todayCompletedOrders;
  };

  const getTotalOrders = () => {
    return completedOrders.length;
  };

  const getRecentOrders = () => {
    return completedOrders
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  };

  const value: AppContextType = {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    heldOrders,
    addHeldOrder,
    removeHeldOrder,
    completedOrders,
    addCompletedOrder,
    advanceOrders,
    addAdvanceOrder,
    updateAdvanceOrder,
    getTodaysSales,
    getTotalOrders,
    getRecentOrders
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
