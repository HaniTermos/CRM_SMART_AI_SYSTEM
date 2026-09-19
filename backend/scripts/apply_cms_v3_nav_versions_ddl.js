/**
 * Migration script: Create cms_v3_navigation_versions table
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function applyMigration() {
  console.log('[MIGRATION] Applying cms_v3_navigation_versions schema...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.cms_v3_navigation_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
        region VARCHAR(50) NOT NULL,
        version_number INT NOT NULL,
        document JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uk_v3_nav_version UNIQUE(store_id, region, version_number)
      );

      CREATE INDEX IF NOT EXISTS idx_v3_nav_versions_store ON public.cms_v3_navigation_versions(store_id, region);
    `);
    console.log('[MIGRATION] Successfully created cms_v3_navigation_versions table.');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  }
}

applyMigration();
