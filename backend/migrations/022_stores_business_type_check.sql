-- Migration 022: Drop restrictive check constraints on stores.business_type and orders.payment_method
-- Allows varied business types (bakery, cafe, coffee_shop, etc.) and payment methods (credit_card, wallet, etc.)

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_business_type_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
