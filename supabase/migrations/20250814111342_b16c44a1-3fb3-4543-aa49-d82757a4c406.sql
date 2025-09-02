
-- Update RLS policies to ensure proper data isolation by user

-- First, let's update the orders table policies
DROP POLICY IF EXISTS "Orders are viewable by authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

CREATE POLICY "Users can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can create their own orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own orders" 
  ON public.orders 
  FOR UPDATE 
  USING (created_by = auth.uid());

-- Update order_items policies
DROP POLICY IF EXISTS "Order items are viewable by authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can manage order items" ON public.order_items;

CREATE POLICY "Users can view their own order items" 
  ON public.order_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.created_by = auth.uid()
  ));

CREATE POLICY "Users can manage their own order items" 
  ON public.order_items 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.created_by = auth.uid()
  ));

-- Update advance_orders policies
DROP POLICY IF EXISTS "Advance orders are viewable by authenticated users" ON public.advance_orders;
DROP POLICY IF EXISTS "Authenticated users can manage advance orders" ON public.advance_orders;

CREATE POLICY "Users can view their own advance orders" 
  ON public.advance_orders 
  FOR SELECT 
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own advance orders" 
  ON public.advance_orders 
  FOR ALL 
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Update advance_order_items policies
DROP POLICY IF EXISTS "Advance order items are viewable by authenticated users" ON public.advance_order_items;
DROP POLICY IF EXISTS "Authenticated users can manage advance order items" ON public.advance_order_items;

CREATE POLICY "Users can view their own advance order items" 
  ON public.advance_order_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.advance_orders 
    WHERE advance_orders.id = advance_order_items.advance_order_id 
    AND advance_orders.created_by = auth.uid()
  ));

CREATE POLICY "Users can manage their own advance order items" 
  ON public.advance_order_items 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.advance_orders 
    WHERE advance_orders.id = advance_order_items.advance_order_id 
    AND advance_orders.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.advance_orders 
    WHERE advance_orders.id = advance_order_items.advance_order_id 
    AND advance_orders.created_by = auth.uid()
  ));

-- Update held_orders policies
DROP POLICY IF EXISTS "Held orders are viewable by authenticated users" ON public.held_orders;
DROP POLICY IF EXISTS "Authenticated users can manage held orders" ON public.held_orders;

CREATE POLICY "Users can view their own held orders" 
  ON public.held_orders 
  FOR SELECT 
  USING (held_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = held_orders.original_order_id 
    AND orders.created_by = auth.uid()
  ));

CREATE POLICY "Users can manage their own held orders" 
  ON public.held_orders 
  FOR ALL 
  USING (held_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = held_orders.original_order_id 
    AND orders.created_by = auth.uid()
  ))
  WITH CHECK (held_by = auth.uid());

-- For menu_items, we'll keep admin-only management but allow all authenticated users to view
-- This is because menu items are typically shared across all users in a restaurant POS system
-- If you want user-specific menu items, let me know and I can modify this

-- Update notifications to be role-based or user-specific
DROP POLICY IF EXISTS "Notifications are viewable by authenticated users" ON public.notifications;

CREATE POLICY "Users can view relevant notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (
    recipient_role IS NULL OR 
    recipient_role = 'all' OR 
    (recipient_role = 'admin' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )) OR
    (recipient_role = 'staff' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'staff'
    ))
  );
