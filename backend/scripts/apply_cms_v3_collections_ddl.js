/**
 * Migration script: Create cms_v3_collections tables
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function applyCollectionsMigration() {
  console.log('[MIGRATION] Applying cms_v3_collections schema...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.cms_v3_collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        singular_name VARCHAR(100),
        icon VARCHAR(50) DEFAULT 'Folder',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uk_v3_collections_store_slug UNIQUE(store_id, slug)
      );

      CREATE TABLE IF NOT EXISTS public.cms_v3_collection_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID NOT NULL REFERENCES public.cms_v3_collections(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        required BOOLEAN DEFAULT FALSE,
        default_value TEXT,
        options JSONB DEFAULT '{}'::jsonb,
        position INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uk_v3_fields_collection_slug UNIQUE(collection_id, slug)
      );

      CREATE TABLE IF NOT EXISTS public.cms_v3_collection_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID NOT NULL REFERENCES public.cms_v3_collections(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        status VARCHAR(30) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
        field_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uk_v3_items_collection_slug UNIQUE(collection_id, slug)
      );

      CREATE INDEX IF NOT EXISTS idx_v3_collections_store ON public.cms_v3_collections(store_id);
      CREATE INDEX IF NOT EXISTS idx_v3_items_collection ON public.cms_v3_collection_items(collection_id);
    `);
    console.log('[MIGRATION] Successfully created cms_v3_collections database schema.');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  }
}

applyCollectionsMigration();
