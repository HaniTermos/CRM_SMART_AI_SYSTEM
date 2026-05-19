CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text NOT NULL DEFAULT 'manual',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_adj_store ON public.inventory_adjustments(store_id, created_at DESC);
CREATE INDEX idx_inv_adj_product ON public.inventory_adjustments(product_id, created_at DESC);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view adjustments"
ON public.inventory_adjustments FOR SELECT TO authenticated
USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Admins manage adjustments"
ON public.inventory_adjustments FOR ALL TO authenticated
USING (is_store_admin(auth.uid(), store_id))
WITH CHECK (is_store_admin(auth.uid(), store_id));