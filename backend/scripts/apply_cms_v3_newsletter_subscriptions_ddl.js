/**
 * Migration script: Create cms_v3_newsletter_subscriptions table
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function applyMigration() {
  console.log('[MIGRATION] Applying cms_v3_newsletter_subscriptions schema...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.cms_v3_newsletter_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'newsletter_block',
        consent_given BOOLEAN NOT NULL DEFAULT TRUE,
        consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status VARCHAR(30) NOT NULL DEFAULT 'subscribed'
          CHECK (status IN ('subscribed', 'unsubscribed', 'pending_confirmation')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uk_v3_newsletter_store_email UNIQUE(store_id, email)
      );

      CREATE INDEX IF NOT EXISTS idx_v3_newsletter_store ON public.cms_v3_newsletter_subscriptions(store_id);
    `);
    console.log('[MIGRATION] Successfully created cms_v3_newsletter_subscriptions table.');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  }
}

applyMigration();
