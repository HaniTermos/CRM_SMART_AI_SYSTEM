
DROP POLICY IF EXISTS "Public can create customer" ON public.customers;
DROP POLICY IF EXISTS "Public can update own by phone" ON public.customers;
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert activities" ON public.customer_activities;
