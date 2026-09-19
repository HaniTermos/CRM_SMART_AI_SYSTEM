-- ============================================
-- SmartStore AI Migration 008: Order Payment Status
-- ============================================

-- payment_status: tracks verified payment state
-- Default is 'unpaid' — orders must be explicitly confirmed as paid
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid';

-- refunded_amount: tracks the dollar amount refunded (used for net revenue calculation)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Widen payment_method constraint to support all payment types
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash_on_delivery', 'card', 'online', 'stripe', 'cash', 'apple_pay', 'google_pay'));

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
