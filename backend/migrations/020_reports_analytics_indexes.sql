-- Migration 020: Reports analytics support
-- Adds order source/channel column and reporting indexes.

-- Add source/channel column to orders if missing.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'dine_in';

CREATE INDEX IF NOT EXISTS idx_orders_store_created_at ON public.orders(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_source ON public.orders(store_id, source);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
