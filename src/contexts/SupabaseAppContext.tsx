import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Database interfaces matching Supabase schema
interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  in_stock: boolean;
  stock_quantity: number;
}

interface OrderItem {
  id: string;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  menu_item?: MenuItem;
}

interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  table_number?: string;
  order_type: 'dine-in' | 'takeaway' | 'delivery' | 'advance-order';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'held';
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method?: 'cash' | 'card' | 'upi';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  order_items?: OrderItem[];
}

interface AdvanceOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_date: string;
  delivery_time?: string;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  status: 'pending' | 'confirmed' | 'ready' | 'delivered';
  special_instructions?: string;
  created_at: string;
  advance_order_items?: OrderItem[];
}

interface HeldOrder {
  id: string;
  original_order_id: string;
  held_by?: string;
  held_at: string;
  reason?: string;
  original_order?: Order;
}

// Context type
interface SupabaseAppContextType {
  // Auth
  user: any;
  loading: boolean;
  
  // Menu items
  menuItems: MenuItem[];
  loadMenuItems: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'in_stock' | 'stock_quantity'>) => Promise<void>;
  updateMenuItem: (id: number, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: number) => Promise<void>;
  
  // Orders
  orders: Order[];
  loadOrders: () => Promise<void>;
  createOrder: (orderData: any) => Promise<Order | null>;
  updateOrder: (id: string, updates: Partial<Omit<Order, 'order_type' | 'status'>> & {
    order_type?: 'dine-in' | 'takeaway' | 'delivery' | 'advance-order';
    status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'held';
  }) => Promise<void>;
  
  // Advance orders
  advanceOrders: AdvanceOrder[];
  loadAdvanceOrders: () => Promise<void>;
  createAdvanceOrder: (orderData: any) => Promise<void>;
  updateAdvanceOrder: (id: string, updates: Partial<Omit<AdvanceOrder, 'status'>> & {
    status?: 'pending' | 'confirmed' | 'ready' | 'delivered';
  }) => Promise<void>;
  
  // Held orders
  heldOrders: HeldOrder[];
  loadHeldOrders: () => Promise<void>;
  createHeldOrder: (orderId: string, reason?: string) => Promise<void>;
  deleteHeldOrder: (id: string) => Promise<void>;
  
  // Dashboard stats
  getTodaysSales: () => number;
  getTotalOrders: () => number;
  getRecentOrders: () => Order[];
  getWeeklySales: () => number;
  getMonthlySales: () => number;
  getOrdersCount: (period: 'today' | 'week' | 'month') => number;
}

const SupabaseAppContext = createContext<SupabaseAppContextType | undefined>(undefined);

export const useSupabaseApp = () => {
  const context = useContext(SupabaseAppContext);
  if (!context) {
    throw new Error('useSupabaseApp must be used within a SupabaseAppProvider');
  }
  return context;
};

export const SupabaseAppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [advanceOrders, setAdvanceOrders] = useState<AdvanceOrder[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const { toast } = useToast();

  // Clear all data when user logs out or changes
  const clearAllData = () => {
    console.log('Clearing all data for user logout/change');
    setMenuItems([]);
    setOrders([]);
    setAdvanceOrders([]);
    setHeldOrders([]);
  };

  // Auth setup with proper data clearing
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        clearAllData();
      }
      
      const newUser = session?.user ?? null;
      const previousUserId = user?.id;
      const newUserId = newUser?.id;
      
      // If user changed (different user ID), clear data
      if (previousUserId && newUserId && previousUserId !== newUserId) {
        console.log('User changed from', previousUserId, 'to', newUserId, '- clearing data');
        clearAllData();
      }
      
      setUser(newUser);
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user is authenticated - with user change detection
  useEffect(() => {
    if (user) {
      console.log('Loading data for user:', user.id);
      loadMenuItems();
      loadOrders();
      loadAdvanceOrders();
      loadHeldOrders();
    } else {
      clearAllData();
    }
  }, [user?.id]); // Depend on user.id to reload when user changes

  // Menu Items functions
  const loadMenuItems = async () => {
    if (!user) return;
    
    try {
      console.log('Loading menu items for user:', user.id);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      console.log('Loaded menu items:', data?.length || 0);
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'in_stock' | 'stock_quantity'>) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...item, in_stock: true, stock_quantity: 0 }])
        .select()
        .single();

      if (error) throw error;
      
      setMenuItems(prev => [...prev, data]);
      toast({
        title: "Success",
        description: `${item.name} added to menu`,
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive"
      });
    }
  };

  const updateMenuItem = async (id: number, updates: Partial<MenuItem>) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setMenuItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      
      toast({
        title: "Success",
        description: "Menu item updated",
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive"
      });
    }
  };

  const deleteMenuItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMenuItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Menu item deleted",
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive"
      });
    }
  };

  // Orders functions - with proper user filtering
  const loadOrders = async () => {
    if (!user) return;
    
    try {
      console.log('Loading orders for user:', user.id);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          table_number,
          order_type,
          status,
          total_amount,
          tax_amount,
          discount_amount,
          payment_method,
          payment_status,
          created_by,
          created_at,
          updated_at,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            menu_item_id,
            created_at,
            menu_item:menu_items (
              id,
              name,
              price,
              category,
              description,
              in_stock,
              stock_quantity,
              created_at,
              updated_at
            )
          )
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded orders:', data?.length || 0, 'for user:', user.id);
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const createOrder = async (orderData: any): Promise<Order | null> => {
    try {
      console.log('Creating order with data:', orderData);
      
      // Generate order number using the database function
      const { data: orderNumberResult, error: orderNumberError } = await supabase.rpc('generate_order_number');
      
      if (orderNumberError) {
        console.error('Error generating order number:', orderNumberError);
        throw orderNumberError;
      }

      // Properly type the order insert data to match the database schema
      const orderInsertData = {
        order_number: orderNumberResult,
        customer_name: orderData.customerName || null,
        customer_phone: orderData.customerPhone || null,
        table_number: orderData.tableNumber || null,
        order_type: (orderData.orderType as 'dine-in' | 'takeaway' | 'delivery' | 'advance-order') || 'dine-in',
        status: 'pending' as 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'held',
        total_amount: orderData.total || 0,
        tax_amount: orderData.taxAmount || 0,
        discount_amount: orderData.discountAmount || 0,
        payment_method: (orderData.paymentMethod as 'cash' | 'card' | 'upi') || null,
        payment_status: 'pending' as 'pending' | 'paid' | 'refunded',
        created_by: user?.id || null
      };

      console.log('Inserting order:', orderInsertData);

      // Insert single object, not array
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          table_number,
          order_type,
          status,
          total_amount,
          tax_amount,
          discount_amount,
          payment_method,
          payment_status,
          created_by,
          created_at,
          updated_at
        `)
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      console.log('Order created:', order);

      // Add order items if they exist
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }));

        console.log('Inserting order items:', orderItems);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Order items error:', itemsError);
          throw itemsError;
        }
      }

      await loadOrders();
      
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      
      return order;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: `Failed to create order: ${error.message}`,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateOrder = async (id: string, updates: Partial<Omit<Order, 'order_type' | 'status'>> & {
    order_type?: 'dine-in' | 'takeaway' | 'delivery' | 'advance-order';
    status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'held';
  }) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  // Advance Orders functions - with proper user filtering
  const loadAdvanceOrders = async () => {
    if (!user) return;
    
    try {
      console.log('Loading advance orders for user:', user.id);
      const { data, error } = await supabase
        .from('advance_orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          delivery_date,
          delivery_time,
          total_amount,
          advance_amount,
          remaining_amount,
          status,
          special_instructions,
          created_by,
          created_at,
          updated_at,
          advance_order_items (
            id,
            quantity,
            unit_price,
            total_price,
            menu_item_id,
            created_at,
            menu_item:menu_items (
              id,
              name,
              price,
              category,
              description,
              in_stock,
              stock_quantity,
              created_at,
              updated_at
            )
          )
        `)
        .eq('created_by', user.id)
        .order('delivery_date', { ascending: true });

      if (error) throw error;
      console.log('Loaded advance orders:', data?.length || 0, 'for user:', user.id);
      setAdvanceOrders(data || []);
    } catch (error) {
      console.error('Error loading advance orders:', error);
    }
  };

  const createAdvanceOrder = async (orderData: any) => {
    try {
      console.log('Creating advance order with data:', orderData);
      
      const { data: order, error: orderError } = await supabase
        .from('advance_orders')
        .insert([{
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          customer_email: orderData.customerEmail || null,
          delivery_date: orderData.deliveryDate,
          delivery_time: orderData.deliveryTime || null,
          total_amount: orderData.total || 0,
          advance_amount: orderData.advanceAmount || 0,
          remaining_amount: (orderData.total || 0) - (orderData.advanceAmount || 0),
          status: 'pending',
          special_instructions: orderData.specialInstructions || null,
          created_by: user?.id || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items if they exist
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map((item: any) => ({
          advance_order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('advance_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      await loadAdvanceOrders();
      
      toast({
        title: "Success",
        description: "Advance order created successfully",
      });
    } catch (error: any) {
      console.error('Error creating advance order:', error);
      toast({
        title: "Error",
        description: `Failed to create advance order: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const updateAdvanceOrder = async (id: string, updates: Partial<Omit<AdvanceOrder, 'status'>> & {
    status?: 'pending' | 'confirmed' | 'ready' | 'delivered';
  }) => {
    try {
      // If order is being delivered, add remaining amount to revenue calculations
      if (updates.status === 'delivered') {
        const order = advanceOrders.find(o => o.id === id);
        if (order && order.remaining_amount > 0) {
          // The remaining amount will be included in revenue calculations automatically
          // since we check for delivered status in our analytics functions
        }
      }

      const { error } = await supabase
        .from('advance_orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadAdvanceOrders();
      
      if (updates.status === 'delivered') {
        toast({
          title: "Order Delivered",
          description: "Advance order marked as delivered. Full amount included in revenue.",
        });
      }
    } catch (error) {
      console.error('Error updating advance order:', error);
      toast({
        title: "Error",
        description: "Failed to update advance order",
        variant: "destructive"
      });
    }
  };

  // Held Orders functions - with proper user filtering
  const loadHeldOrders = async () => {
    if (!user) return;
    
    try {
      console.log('Loading held orders for user:', user.id);
      const { data, error } = await supabase
        .from('held_orders')
        .select(`
          id,
          original_order_id,
          held_by,
          held_at,
          recalled_at,
          recalled_by,
          reason,
          original_order:orders!held_orders_original_order_id_fkey (
            id,
            order_number,
            customer_name,
            customer_phone,
            table_number,
            order_type,
            status,
            total_amount,
            tax_amount,
            discount_amount,
            payment_method,
            payment_status,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('held_by', user.id)
        .order('held_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded held orders:', data?.length || 0, 'for user:', user.id);
      setHeldOrders(data || []);
    } catch (error) {
      console.error('Error loading held orders:', error);
    }
  };

  const createHeldOrder = async (orderId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('held_orders')
        .insert([{
          original_order_id: orderId,
          held_by: user?.id,
          reason: reason
        }]);

      if (error) throw error;

      // Update order status to held
      await updateOrder(orderId, { status: 'held' });
      await loadHeldOrders();
      
      toast({
        title: "Success",
        description: "Order held successfully",
      });
    } catch (error) {
      console.error('Error holding order:', error);
      toast({
        title: "Error",
        description: "Failed to hold order",
        variant: "destructive"
      });
    }
  };

  const deleteHeldOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('held_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadHeldOrders();
      
      toast({
        title: "Success",
        description: "Held order deleted",
      });
    } catch (error) {
      console.error('Error deleting held order:', error);
      toast({
        title: "Error",
        description: "Failed to delete held order",
        variant: "destructive"
      });
    }
  };

  const getTodaysSales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate revenue from completed/paid orders
    const ordersRevenue = orders
      .filter(order => 
        (order.status === 'completed' || order.payment_status === 'paid') && 
        new Date(order.created_at) >= today
      )
      .reduce((total, order) => total + order.total_amount, 0);

    // Calculate revenue from advance orders - full amount for delivered orders, advance amount for confirmed
    const advanceRevenue = advanceOrders
      .filter(order => new Date(order.created_at) >= today)
      .reduce((total, order) => {
        if (order.status === 'delivered') {
          return total + order.total_amount; // Full amount for delivered orders
        } else if (order.status === 'confirmed') {
          return total + order.advance_amount; // Only advance amount for confirmed orders
        }
        return total;
      }, 0);

    return ordersRevenue + advanceRevenue;
  };

  const getTotalOrders = () => {
    const completedOrders = orders.filter(order => order.status === 'completed' || order.payment_status === 'paid').length;
    const confirmedAdvanceOrders = advanceOrders.filter(order => order.status === 'confirmed' || order.status === 'delivered').length;
    return completedOrders + confirmedAdvanceOrders;
  };

  const getRecentOrders = () => {
    return orders
      .filter(order => order.status === 'completed' || order.payment_status === 'paid')
      .slice(0, 10);
  };

  // New helper functions for better analytics including advance orders with remaining amounts
  const getWeeklySales = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const ordersRevenue = orders
      .filter(order => 
        (order.status === 'completed' || order.payment_status === 'paid') && 
        new Date(order.created_at) >= weekAgo
      )
      .reduce((total, order) => total + order.total_amount, 0);

    const advanceRevenue = advanceOrders
      .filter(order => new Date(order.created_at) >= weekAgo)
      .reduce((total, order) => {
        if (order.status === 'delivered') {
          return total + order.total_amount; // Full amount for delivered orders
        } else if (order.status === 'confirmed') {
          return total + order.advance_amount; // Only advance amount for confirmed orders
        }
        return total;
      }, 0);

    return ordersRevenue + advanceRevenue;
  };

  const getMonthlySales = () => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const ordersRevenue = orders
      .filter(order => 
        (order.status === 'completed' || order.payment_status === 'paid') && 
        new Date(order.created_at) >= monthAgo
      )
      .reduce((total, order) => total + order.total_amount, 0);

    const advanceRevenue = advanceOrders
      .filter(order => new Date(order.created_at) >= monthAgo)
      .reduce((total, order) => {
        if (order.status === 'delivered') {
          return total + order.total_amount; // Full amount for delivered orders
        } else if (order.status === 'confirmed') {
          return total + order.advance_amount; // Only advance amount for confirmed orders
        }
        return total;
      }, 0);

    return ordersRevenue + advanceRevenue;
  };

  const getOrdersCount = (period: 'today' | 'week' | 'month') => {
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    
    const ordersCount = orders.filter(order => 
      (order.status === 'completed' || order.payment_status === 'paid') && 
      new Date(order.created_at) >= startDate
    ).length;

    const advanceCount = advanceOrders.filter(order => 
      (order.status === 'confirmed' || order.status === 'delivered') && 
      new Date(order.created_at) >= startDate
    ).length;

    return ordersCount + advanceCount;
  };

  const value: SupabaseAppContextType = {
    user,
    loading,
    menuItems,
    loadMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    orders,
    loadOrders,
    createOrder,
    updateOrder,
    advanceOrders,
    loadAdvanceOrders,
    createAdvanceOrder,
    updateAdvanceOrder,
    heldOrders,
    loadHeldOrders,
    createHeldOrder,
    deleteHeldOrder,
    getTodaysSales,
    getTotalOrders,
    getRecentOrders,
    getWeeklySales,
    getMonthlySales,
    getOrdersCount
  };

  return (
    <SupabaseAppContext.Provider value={value}>
      {children}
    </SupabaseAppContext.Provider>
  );
};
