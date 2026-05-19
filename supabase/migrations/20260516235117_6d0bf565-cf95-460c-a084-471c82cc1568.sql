
ALTER TABLE public.customers
  ADD CONSTRAINT customers_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT order_items_product_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.customer_activities
  ADD CONSTRAINT activities_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  ADD CONSTRAINT activities_customer_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.products
  ADD CONSTRAINT products_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
  ADD CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
