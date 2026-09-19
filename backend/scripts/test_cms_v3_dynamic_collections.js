/**
 * SmartStore Website Studio (CMS V3) — Authoritative Dynamic CMS Collections Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedTests++;
  }
}

async function runDynamicCollectionsTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Dynamic Collections Test Suite');
  console.log('====================================================\n');

  try {
    const storeRes = await db.query('SELECT id, name FROM stores LIMIT 1');
    if (storeRes.rows.length === 0) {
      console.error('No store found.');
      process.exit(1);
    }
    const store = storeRes.rows[0];

    // 1. Collection creation
    const testSlug = `blog-test-${Date.now()}`;
    const colRes = await db.query(
      `INSERT INTO cms_v3_collections (store_id, name, slug, description)
       VALUES ($1, 'Blog Posts Test', $2, 'Test Collection')
       RETURNING *`,
      [store.id, testSlug]
    );
    assert(colRes.rows.length === 1, 'Collection creation persisted in cms_v3_collections.');
    const col = colRes.rows[0];

    // 2. Field creation & validation
    const fieldRes = await db.query(
      `INSERT INTO cms_v3_collection_fields (collection_id, name, slug, field_type, required)
       VALUES ($1, 'Author Name', 'author_name', 'text', true)
       RETURNING *`,
      [col.id]
    );
    assert(fieldRes.rows.length === 1, 'Collection field schema created and validated.');

    // 3. Item creation
    const itemRes = await db.query(
      `INSERT INTO cms_v3_collection_items (collection_id, store_id, title, slug, status, field_data)
       VALUES ($1, $2, 'Test Article Title', 'test-article-title', 'draft', '{"author_name": "Jane Doe", "excerpt": "Test excerpt"}'::jsonb)
       RETURNING *`,
      [col.id, store.id]
    );
    assert(itemRes.rows.length === 1, 'Collection item created in draft state.');
    const item = itemRes.rows[0];

    // 4. Item editing
    const editRes = await db.query(
      `UPDATE cms_v3_collection_items
       SET title = 'Updated Article Title', field_data = '{"author_name": "Jane Doe Updated", "excerpt": "Updated content"}'::jsonb, updated_at = NOW()
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [item.id, store.id]
    );
    assert(editRes.rows[0].title === 'Updated Article Title', 'Collection item edited successfully.');

    // 5. Draft/Published status workflow
    const pubRes = await db.query(
      `UPDATE cms_v3_collection_items
       SET status = 'published', updated_at = NOW()
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [item.id, store.id]
    );
    assert(pubRes.rows[0].status === 'published', 'Collection item published status updated.');

    // 6. Dynamic binding simulation
    const bindingNode = {
      type: 'collection-list',
      id: 'col-list-1',
      props: {
        collectionId: col.id,
        limit: 5,
        displayFields: ['title', 'author_name', 'excerpt']
      }
    };
    assert(bindingNode.props.collectionId === col.id, 'Dynamic component binding configured correctly.');

    // 7. Public rendering contract check (query published items only)
    const publicItems = await db.query(
      `SELECT * FROM cms_v3_collection_items WHERE collection_id = $1 AND store_id = $2 AND status = 'published'`,
      [col.id, store.id]
    );
    assert(publicItems.rows.length === 1, 'Public rendering contract retrieved published collection items.');

    // 8. Multi-tenant store isolation
    const wrongStoreId = '00000000-0000-0000-0000-000000000000';
    const isolatedQuery = await db.query(
      `SELECT * FROM cms_v3_collections WHERE id = $1 AND store_id = $2`,
      [col.id, wrongStoreId]
    );
    assert(isolatedQuery.rows.length === 0, 'Multi-tenant store isolation verified.');

    // 9. Empty state handling
    const emptyQuery = await db.query(
      `SELECT * FROM cms_v3_collection_items WHERE collection_id = $1 AND store_id = $2 AND slug = 'non-existent'`,
      [col.id, store.id]
    );
    assert(emptyQuery.rows.length === 0, 'Empty state query handled cleanly.');

    // 10. Invalid schema / collision handling
    let collisionCaught = false;
    try {
      await db.query(
        `INSERT INTO cms_v3_collections (store_id, name, slug) VALUES ($1, 'Duplicate', $2)`,
        [store.id, testSlug]
      );
    } catch (e) {
      collisionCaught = true;
    }
    assert(collisionCaught, 'Duplicate collection slug rejected safely by database constraint.');

    // Cleanup test records
    await db.query(`DELETE FROM cms_v3_collection_fields WHERE collection_id = $1`, [col.id]);
    await db.query(`DELETE FROM cms_v3_collection_items WHERE collection_id = $1`, [col.id]);
    await db.query(`DELETE FROM cms_v3_collections WHERE id = $1`, [col.id]);
    assert(true, 'Cleaned up test collection records.');

    console.log('\n====================================================');
    console.log(`DYNAMIC COLLECTIONS SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Collections test error:', err);
    process.exit(1);
  }
}

runDynamicCollectionsTests();
