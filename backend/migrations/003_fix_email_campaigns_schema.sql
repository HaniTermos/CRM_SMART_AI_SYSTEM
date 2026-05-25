
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
  END IF;
END$$;

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'New Campaign',
  ADD COLUMN IF NOT EXISTS content_html text NOT NULL DEFAULT '<p></p>',
  ADD COLUMN IF NOT EXISTS target_segment public.customer_segment,
  ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

ALTER TABLE public.email_campaigns
  ALTER COLUMN status SET DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS email_campaigns_store_idx ON public.email_campaigns(store_id);