-- Migration 016: Resolve schema drift detected in live PostgreSQL database.
-- 1. Add missing nullable columns to public.stores (business_type, theme_config).
-- 2. Ensure public.campaign_status enum exists.
-- 3. Convert public.email_campaigns.status from text to public.campaign_status
--    with default 'draft' and NOT NULL, mapping unknown values to 'draft'.

-- Add missing nullable columns to public.stores idempotently.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS theme_config jsonb;

-- Ensure campaign_status enum exists idempotently.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
  END IF;
END$$;

-- Normalize invalid or NULL status values before changing the column type.
-- Valid enum labels are preserved; anything else is mapped to 'draft'.
UPDATE public.email_campaigns
SET status = 'draft'
WHERE status IS NULL
   OR status::text NOT IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled');

-- Drop any existing default that cannot be auto-cast, alter the type, then set the desired default.
ALTER TABLE public.email_campaigns
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.campaign_status USING status::public.campaign_status,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft';
