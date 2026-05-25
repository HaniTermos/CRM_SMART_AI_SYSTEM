ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS redemption_code text;

ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS redeemed_at timestamptz;

ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS redemption_notes text;

CREATE UNIQUE INDEX IF NOT EXISTS crm_deals_redemption_code_idx ON public.crm_deals(redemption_code);
