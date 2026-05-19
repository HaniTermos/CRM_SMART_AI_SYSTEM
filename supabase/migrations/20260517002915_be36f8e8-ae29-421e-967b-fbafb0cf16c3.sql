CREATE TYPE public.discount_type AS ENUM ('percent', 'fixed');

CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  code text NOT NULL,
  type public.discount_type NOT NULL DEFAULT 'percent',
  value numeric NOT NULL DEFAULT 0,
  min_subtotal numeric NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, code)
);

CREATE INDEX idx_discount_codes_store ON public.discount_codes(store_id);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active discount codes"
ON public.discount_codes FOR SELECT TO anon, authenticated
USING (active = true);

CREATE POLICY "Members view all discount codes"
ON public.discount_codes FOR SELECT TO authenticated
USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Admins manage discount codes"
ON public.discount_codes FOR ALL TO authenticated
USING (is_store_admin(auth.uid(), store_id))
WITH CHECK (is_store_admin(auth.uid(), store_id));

CREATE TRIGGER trg_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ADD COLUMN discount_code text;
ALTER TABLE public.orders ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;