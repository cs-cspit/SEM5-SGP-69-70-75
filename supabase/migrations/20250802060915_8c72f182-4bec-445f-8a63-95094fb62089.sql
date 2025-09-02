
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  order_count INTEGER;
  new_order_number TEXT;
BEGIN
  SELECT COUNT(*) INTO order_count
  FROM public.orders o
  WHERE o.order_number LIKE order_date || '%';

  new_order_number := order_date || LPAD((order_count + 1)::TEXT, 4, '0');
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;
