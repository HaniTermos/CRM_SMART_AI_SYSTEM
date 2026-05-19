CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'hidden');

CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  customer_phone text,
  author_name text NOT NULL,
  rating smallint NOT NULL,
  comment text,
  status public.review_status NOT NULL DEFAULT 'pending',
  verified_purchase boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_reviews_product ON public.product_reviews(product_id, status);
CREATE INDEX idx_reviews_store ON public.product_reviews(store_id, status, created_at DESC);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved reviews"
ON public.product_reviews FOR SELECT TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Members view all reviews"
ON public.product_reviews FOR SELECT TO authenticated
USING (is_store_member(auth.uid(), store_id));

CREATE POLICY "Admins manage reviews"
ON public.product_reviews FOR ALL TO authenticated
USING (is_store_admin(auth.uid(), store_id))
WITH CHECK (is_store_admin(auth.uid(), store_id));

CREATE TRIGGER trg_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();