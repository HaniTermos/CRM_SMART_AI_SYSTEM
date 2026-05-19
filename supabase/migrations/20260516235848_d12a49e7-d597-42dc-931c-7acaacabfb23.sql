
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  kind text NOT NULL,
  summary text,
  next_action text,
  email_subject text,
  email_body text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_insights_customer ON public.ai_insights(customer_id);
CREATE INDEX idx_ai_insights_store ON public.ai_insights(store_id, created_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view insights" ON public.ai_insights
  FOR SELECT TO authenticated USING (is_store_member(auth.uid(), store_id));
CREATE POLICY "Admins manage insights" ON public.ai_insights
  FOR ALL TO authenticated USING (is_store_admin(auth.uid(), store_id))
  WITH CHECK (is_store_admin(auth.uid(), store_id));
