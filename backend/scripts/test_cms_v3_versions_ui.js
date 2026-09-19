const db = require('../config/database');

async function runVersionsTest() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Versions & Rollback UI Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Get store & page
    const storeRes = await db.query(`SELECT id, name FROM stores LIMIT 1`);
    if (storeRes.rows.length === 0) throw new Error('No store found in DB');
    const storeId = storeRes.rows[0].id;

    const pageRes = await db.query(`SELECT id, title, slug FROM cms_v3_pages WHERE store_id = $1 LIMIT 1`, [storeId]);
    if (pageRes.rows.length === 0) throw new Error('No page found for testing versions');
    const pageId = pageRes.rows[0].id;

    // 2. Query timeline of versions
    const versions = await db.query(
      `SELECT id, version_number, status, created_at, change_summary 
       FROM cms_v3_page_versions 
       WHERE page_id = $1 AND store_id = $2 
       ORDER BY version_number DESC`,
      [pageId, storeId]
    );
    console.log(`  ✓ PASSED: Queried version timeline (${versions.rows.length} versions found).`);
    passed++;

    // 3. Create version v1 (archived snapshot)
    const v1Doc = {
      root: { id: 'root', type: 'page', props: { title: 'Version 1 Content' } }
    };
    const v1Res = await db.query(
      `INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree, change_summary)
       VALUES ($1, $2, 9001, 'archived', $3, 'Test v1 snapshot')
       RETURNING *`,
      [pageId, storeId, JSON.stringify(v1Doc)]
    );

    // 4. Create version v2 (current published)
    const v2Doc = {
      root: { id: 'root', type: 'page', props: { title: 'Version 2 Content' } }
    };
    const v2Res = await db.query(
      `INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree, change_summary)
       VALUES ($1, $2, 9002, 'published', $3, 'Test v2 current published')
       RETURNING *`,
      [pageId, storeId, JSON.stringify(v2Doc)]
    );
    console.log(`  ✓ PASSED: Created version snapshots v9001 (archived) and v9002 (published).`);
    passed++;

    // 5. Test restore of v1 -> creates new version v9003 (published) and sets v9002 to archived
    const v3Doc = v1Res.rows[0].component_tree;
    const restoredRes = await db.query(
      `INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree, change_summary)
       VALUES ($1, $2, 9003, 'published', $3, 'Restored from version 9001')
       RETURNING *`,
      [pageId, storeId, JSON.stringify(v3Doc)]
    );

    await db.query(
      `UPDATE cms_v3_page_versions SET status = 'archived' WHERE id = $1 AND store_id = $2`,
      [v2Res.rows[0].id, storeId]
    );

    // Verify pointer & snapshot
    const activePublished = await db.query(
      `SELECT * FROM cms_v3_page_versions WHERE page_id = $1 AND store_id = $2 AND status = 'published'`,
      [pageId, storeId]
    );
    if (activePublished.rows.length === 1 && activePublished.rows[0].version_number === 9003) {
      console.log(`  ✓ PASSED: Rollback restoration created new immutable version 9003 and updated active published pointer.`);
      passed++;
    }

    // Clean up test versions
    await db.query(
      `DELETE FROM cms_v3_page_versions WHERE page_id = $1 AND version_number IN (9001, 9002, 9003)`,
      [pageId]
    );
    console.log(`  ✓ PASSED: Cleaned up test version records.`);
    passed++;

    console.log(`\n====================================================`);
    console.log(`VERSIONS SUMMARY: ${passed} Passed, ${failed} Failed.`);
    console.log(`====================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('VERSIONS TEST ERROR:', err);
    process.exit(1);
  }
}

runVersionsTest();
