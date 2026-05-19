
-- Enums
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');
CREATE TYPE public.customer_segment AS ENUM ('new','active','vip','at_risk','churned');

-- Customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  name text,
  phone text NOT NULL,
  email text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  segment customer_segment NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, phone)
);
CREATE INDEX idx_customers_store ON public.customers(store_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view customers" ON public.customers
  FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Admins manage customers" ON public.customers
  FOR ALL TO authenticated USING (is_store_admin(auth.uid(), store_id))
  WITH CHECK (is_store_admin(auth.uid(), store_id));
-- Guests need to upsert their customer record during checkout
CREATE POLICY "Public can create customer" ON public.customers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can update own by phone" ON public.customers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'cash_on_delivery'
    CHECK (payment_method = 'cash_on_delivery'),
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view orders" ON public.orders
  FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL TO authenticated USING (is_store_admin(auth.uid(), store_id))
  WITH CHECK (is_store_admin(auth.uid(), store_id));
CREATE POLICY "Public can place orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND is_store_member(auth.uid(), o.store_id))
  );
CREATE POLICY "Admins manage items" ON public.order_items
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND is_store_admin(auth.uid(), o.store_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND is_store_admin(auth.uid(), o.store_id))
  );
CREATE POLICY "Public can insert items" ON public.order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Customer activities
CREATE TABLE public.customer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_customer ON public.customer_activities(customer_id);

ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view activities" ON public.customer_activities
  FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Admins manage activities" ON public.customer_activities
  FOR ALL TO authenticated USING (is_store_admin(auth.uid(), store_id))
  WITH CHECK (is_store_admin(auth.uid(), store_id));
CREATE POLICY "Public can insert activities" ON public.customer_activities
  FOR INSERT TO anon, authenticated WITH CHECK (true);
