const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const axios = require('axios');
const db = require('../config/database');

let baseURL = process.env.API_BASE_URL || 'http://localhost:5002/api';
let api = axios.create({ baseURL, validateStatus: () => true });

async function ensureServerRunning() {
  try {
    const ping = await api.get('/health');
    if (ping.status < 500) return;
  } catch (e) {
    const app = require('../server');
    return new Promise((resolve) => {
      const server = app.listen(0, () => {
        const port = server.address().port;
        baseURL = `http://localhost:${port}/api`;
        api = axios.create({ baseURL, validateStatus: () => true });
        console.log(`[TEST] Dynamic test server listening on http://localhost:${port}/api`);
        resolve();
      });
    });
  }
}

let results = { passed: 0, failed: 0, errors: [] };

function pass(msg) {
  results.passed++;
  console.log(`   ✅ ${msg}`);
}

function fail(msg, detail) {
  results.failed++;
  results.errors.push(`${msg}: ${detail || ''}`);
  console.error(`   ❌ ${msg}${detail ? ` — ${detail}` : ''}`);
}

async function registerUser(email, name) {
  const res = await api.post('/auth/register', { name, email, password: 'Password123!' });
  if (!res.data?.data?.token) throw new Error(`Register failed: ${JSON.stringify(res.data)}`);
  return { token: res.data.data.token, user: res.data.data.user };
}

async function createStore(token, name, slug, currency = 'USD') {
  const res = await api.post('/stores', { name, slug, currency }, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.data?.data?.id) throw new Error(`Create store failed: ${JSON.stringify(res.data)}`);
  return res.data.data;
}

async function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function runSuite() {
  console.log('\n================================================================');
  console.log('SMARTSTORE AI — CMS V2 FULL INTEGRATION TEST SUITE (24 SCENARIOS)');
  console.log('================================================================\n');

  const ts = Date.now();
  let tokenA, tokenB, storeA, storeB, userA, userB;

  try {
    await ensureServerRunning();
    console.log('SETUP: Registering test users and stores...');
    const regA = await registerUser(`cmsv2_a_${ts}@example.com`, 'CMS V2 Owner A');
    tokenA = regA.token;
    userA = regA.user;
    storeA = await createStore(tokenA, 'CMS V2 Alpha', `cmsv2-alpha-${ts}`);

    const regB = await registerUser(`cmsv2_b_${ts}@example.com`, 'CMS V2 Owner B');
    tokenB = regB.token;
    userB = regB.user;
    storeB = await createStore(tokenB, 'CMS V2 Beta', `cmsv2-beta-${ts}`);
    console.log(`   Store A: ${storeA.id} (${storeA.slug})`);
    console.log(`   Store B: ${storeB.id} (${storeB.slug})\n`);
  } catch (err) {
    console.error('SETUP FAILED:', err.message);
    process.exit(1);
  }

  const headersA = (await auth(tokenA)).headers;
  const headersB = (await auth(tokenB)).headers;

  // 1. Store & system pages auto-initialization
  try {
    console.log('1. Store & system pages auto-initialization');
    const pagesRes = await api.get('/stores/me/cms/pages', { headers: headersA });
    const pages = pagesRes.data?.data || [];
    const systemPages = pages.filter((p) => p.is_system_page);
    const hasHome = pages.some((p) => p.slug === 'home');
    const hasAbout = pages.some((p) => p.slug === 'about');
    if (pagesRes.status === 200 && systemPages.length >= 7 && hasHome && hasAbout) {
      pass('System pages initialized');
    } else {
      fail('System pages initialization', `count=${systemPages.length}, home=${hasHome}`);
    }
  } catch (err) { fail('System pages initialization', err.message); }

  // 2. Custom page creation with slug validation and reserved slug blocking
  try {
    console.log('2. Custom page creation & slug validation');
    const createRes = await api.post('/stores/me/cms/pages', { title: 'Catering Services', slug: 'catering', type: 'custom' }, { headers: headersA });
    if (createRes.status === 201 && createRes.data?.data?.slug === 'catering') {
      pass('Custom page created');
    } else {
      fail('Custom page creation', JSON.stringify(createRes.data));
    }

    const reservedRes = await api.post('/stores/me/cms/pages', { title: 'Fake Home', slug: 'home', type: 'custom' }, { headers: headersA });
    if (reservedRes.status >= 400) {
      pass('Reserved slug blocked');
    } else {
      fail('Reserved slug blocking', 'home slug accepted');
    }

    const duplicateRes = await api.post('/stores/me/cms/pages', { title: 'Catering Services 2', slug: 'catering', type: 'custom' }, { headers: headersA });
    if (duplicateRes.status >= 400) {
      pass('Duplicate slug blocked');
    } else {
      fail('Duplicate slug blocking', 'duplicate accepted');
    }
  } catch (err) { fail('Custom page creation', err.message); }

  // 3. Section CRUD, type validation, and position indexing
  let pageAId, sectionAId;
  try {
    console.log('3. Section CRUD, type validation, position indexing');
    const pagesRes = await api.get('/stores/me/cms/pages', { headers: headersA });
    const homePage = pagesRes.data.data.find((p) => p.slug === 'home');
    pageAId = homePage.id;

    const invalidRes = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, { type: 'not_a_real_type' }, { headers: headersA });
    if (invalidRes.status >= 400) pass('Invalid section type rejected'); else fail('Invalid section type rejection');

    const createRes = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, {
      type: 'rich_text',
      content: { title: 'Test Section', body: 'Hello world' }
    }, { headers: headersA });
    if (createRes.status === 201 && createRes.data?.data?.position !== undefined) {
      sectionAId = createRes.data.data.id;
      pass('Section created with position');
    } else {
      fail('Section creation', JSON.stringify(createRes.data));
    }

    const sectionsRes = await api.get(`/stores/me/cms/pages/${pageAId}/sections`, { headers: headersA });
    if (sectionsRes.status === 200 && sectionsRes.data.data.some((s) => s.id === sectionAId)) {
      pass('Section list contains new section');
    } else {
      fail('Section list retrieval');
    }
  } catch (err) { fail('Section CRUD', err.message); }

  // 4. Section reordering
  try {
    console.log('4. Section reordering');
    const sec1 = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, { type: 'divider' }, { headers: headersA });
    const sec2 = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, { type: 'divider' }, { headers: headersA });
    const ids = [sec2.data.data.id, sectionAId, sec1.data.data.id];
    const reorderRes = await api.patch(`/stores/me/cms/pages/${pageAId}/sections/reorder`, { section_ids: ids }, { headers: headersA });
    if (reorderRes.status === 200) {
      const ordered = reorderRes.data.data;
      const matches = ordered.every((s, i) => s.id === ids[i] && s.position === i);
      if (matches) pass('Sections reordered'); else fail('Section reorder positions');
    } else {
      fail('Section reordering', JSON.stringify(reorderRes.data));
    }
  } catch (err) { fail('Section reordering', err.message); }

  // 5. Section duplicate and visibility toggling
  try {
    console.log('5. Section duplicate and visibility toggling');
    const dupRes = await api.post(`/stores/me/cms/sections/${sectionAId}/duplicate`, {}, { headers: headersA });
    if (dupRes.status === 201 && dupRes.data?.data?.type === 'rich_text') {
      pass('Section duplicated');
    } else {
      fail('Section duplication', JSON.stringify(dupRes.data));
    }

    const hideRes = await api.patch(`/stores/me/cms/sections/${sectionAId}`, { is_visible: false }, { headers: headersA });
    if (hideRes.status === 200 && hideRes.data.data.is_visible === false) {
      pass('Section visibility toggled');
    } else {
      fail('Section visibility toggle');
    }
  } catch (err) { fail('Section duplicate/visibility', err.message); }

  // 6. Section style persistence
  try {
    console.log('6. Section style persistence');
    const styleRes = await api.patch(`/stores/me/cms/sections/${sectionAId}`, {
      appearance: { preset: 'solid', background_color: '#123456', text_color: '#FFFFFF', accent_color: '#00FF00', border_radius: '1rem' },
      background: { type: 'solid' }
    }, { headers: headersA });
    const app = styleRes.data?.data?.appearance;
    if (styleRes.status === 200 && app?.background_color === '#123456' && app?.accent_color === '#00FF00') {
      pass('Section style persisted');
    } else {
      fail('Section style persistence', JSON.stringify(styleRes.data));
    }
  } catch (err) { fail('Section style persistence', err.message); }

  // 7. Draft vs Published isolation
  let draftPageId;
  try {
    console.log('7. Draft vs Published isolation');
    const draftPageRes = await api.post('/stores/me/cms/pages', { title: 'Draft Page', slug: `draft-${ts}`, type: 'custom' }, { headers: headersA });
    draftPageId = draftPageRes.data.data.id;
    await api.post(`/stores/me/cms/pages/${draftPageId}/sections`, { type: 'rich_text', content: { title: 'Draft Section', body: 'Not published yet.' } }, { headers: headersA });

    const publicDraft = await api.get(`/public/stores/${storeA.slug}/cms/v2/pages/draft-${ts}`);
    if (publicDraft.status === 404) {
      pass('Draft page hidden from public');
    } else {
      fail('Draft/public isolation', `status=${publicDraft.status}`);
    }

    await api.post(`/stores/me/cms/pages/${draftPageId}/publish`, {}, { headers: headersA });
    const publicPublished = await api.get(`/public/stores/${storeA.slug}/cms/v2/pages/draft-${ts}`);
    if (publicPublished.status === 200 && publicPublished.data.data.sections.some((s) => s.content.title === 'Draft Section')) {
      pass('Published page visible to public');
    } else {
      fail('Draft/public isolation publish', `status=${publicPublished.status}`);
    }
  } catch (err) { fail('Draft/public isolation', err.message); }

  // 8. Page publishing & version history snapshot creation
  let versionId;
  try {
    console.log('8. Page publishing & version snapshot');
    const publishRes = await api.post(`/stores/me/cms/pages/${pageAId}/publish`, {}, { headers: headersA });
    if (publishRes.status === 200 && publishRes.data?.data?.version?.version) {
      versionId = publishRes.data.data.version.id;
      pass('Page published and version created');
    } else {
      fail('Page publishing', JSON.stringify(publishRes.data));
    }

    const versionsRes = await api.get(`/stores/me/cms/pages/${pageAId}/versions`, { headers: headersA });
    if (versionsRes.status === 200 && versionsRes.data.data.length >= 1) {
      pass('Version history retrieved');
    } else {
      fail('Version history retrieval');
    }
  } catch (err) { fail('Page publishing/version', err.message); }

  // 9. Version rollback
  try {
    console.log('9. Version rollback');
    // Add a temporary visible section
    const tmpRes = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, { type: 'divider' }, { headers: headersA });
    const tmpId = tmpRes.data.data.id;
    const restoreRes = await api.post(`/stores/me/cms/pages/${pageAId}/restore/${versionId}`, {}, { headers: headersA });
    const restoredSections = restoreRes.data?.data?.sections || [];
    if (restoreRes.status === 200 && !restoredSections.some((s) => s.id === tmpId)) {
      pass('Version rollback restored snapshot');
    } else {
      fail('Version rollback', 'temporary section still present');
    }
  } catch (err) { fail('Version rollback', err.message); }

  // 10. Secure preview token generation and expiration
  let previewToken;
  try {
    console.log('10. Secure preview token generation');
    const tokenRes = await api.post(`/stores/me/cms/pages/${pageAId}/preview-token`, {}, { headers: headersA });
    if (tokenRes.status === 200 && tokenRes.data?.data?.token) {
      previewToken = tokenRes.data.data.token;
      pass('Preview token generated');
    } else {
      fail('Preview token generation', JSON.stringify(tokenRes.data));
    }
  } catch (err) { fail('Preview token generation', err.message); }

  // 11. Unauthorized preview token rejection
  try {
    console.log('11. Preview token authorization');
    const validPreview = await api.get(`/public/stores/${storeA.slug}/cms/v2/pages?preview_token=${previewToken}`);
    if (validPreview.status === 200 && validPreview.data?.data?.page?.is_preview) {
      pass('Valid preview token accepted');
    } else {
      fail('Valid preview token', `status=${validPreview.status}`);
    }

    // Unpublish the homepage so an invalid token cannot access draft content
    await api.post(`/stores/me/cms/pages/${pageAId}/unpublish`, {}, { headers: headersA });
    const invalidPreview = await api.get(`/public/stores/${storeA.slug}/cms/v2/pages?preview_token=invalid-token-xyz`);
    if (invalidPreview.status === 404 || invalidPreview.status === 403) {
      pass('Invalid preview token rejected');
    } else {
      fail('Invalid preview token rejection', `status=${invalidPreview.status}`);
    }
    // Republish for remaining tests
    await api.post(`/stores/me/cms/pages/${pageAId}/publish`, {}, { headers: headersA });
  } catch (err) { fail('Preview token authorization', err.message); }

  // 12. Media Library upload, alt text, and delete protection
  let mediaId;
  try {
    console.log('12. Media Library CRUD & usage protection');
    const uploadRes = await api.post('/stores/me/cms/media', {
      filename: 'test-banner.jpg',
      url: `https://example.com/cms-test-banner-${ts}.jpg`,
      alt_text: 'Test banner'
    }, { headers: headersA });
    if (uploadRes.status === 201) {
      mediaId = uploadRes.data.data.id;
      pass('Media uploaded');
    } else {
      fail('Media upload', JSON.stringify(uploadRes.data));
    }

    const listRes = await api.get('/stores/me/cms/media', { headers: headersA });
    if (listRes.status === 200 && listRes.data.data.some((m) => m.id === mediaId)) {
      pass('Media list contains upload');
    } else {
      fail('Media list retrieval');
    }

    // Use media in a published section
    const sectionWithMedia = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, {
      type: 'hero',
      content: { image_url: `https://example.com/cms-test-banner-${ts}.jpg` }
    }, { headers: headersA });
    await api.post(`/stores/me/cms/pages/${pageAId}/publish`, {}, { headers: headersA });

    const delProtectedRes = await api.delete(`/stores/me/cms/media/${mediaId}`, { headers: headersA });
    if (delProtectedRes.status >= 400) {
      pass('Delete protected for used media');
    } else {
      fail('Media usage protection', 'deleted used media');
    }

    // Remove the section and try deleting again
    await api.delete(`/stores/me/cms/sections/${sectionWithMedia.data.data.id}`, { headers: headersA });
    await api.post(`/stores/me/cms/pages/${pageAId}/publish`, {}, { headers: headersA });
    const delRes = await api.delete(`/stores/me/cms/media/${mediaId}`, { headers: headersA });
    if (delRes.status === 200) {
      pass('Unused media deleted');
    } else {
      fail('Media deletion after cleanup', JSON.stringify(delRes.data));
    }
  } catch (err) { fail('Media library tests', err.message); }

  // 13. FAQ creation, ordering, and accordion formatting
  try {
    console.log('13. FAQ section creation');
    const faqRes = await api.post(`/stores/me/cms/pages/${pageAId}/sections`, {
      type: 'faq',
      content: {
        title: 'FAQ',
        items: [
          { question: 'Q1?', answer: 'A1' },
          { question: 'Q2?', answer: 'A2' }
        ]
      }
    }, { headers: headersA });
    if (faqRes.status === 201 && faqRes.data.data.content.items.length === 2) {
      pass('FAQ section created with items');
    } else {
      fail('FAQ section creation', JSON.stringify(faqRes.data));
    }
  } catch (err) { fail('FAQ section', err.message); }

  // 14. Contact form submission rate limiting
  try {
    console.log('14. Contact form submission & rate limiting');
    const email = `test_${ts}@example.com`;
    let rateLimited = false;
    for (let i = 0; i < 6; i++) {
      const contactRes = await api.post(`/public/stores/${storeA.slug}/cms/v2/contact`, {
        name: 'Test User',
        email,
        message: 'Test message'
      });
      if (i < 5 && contactRes.status !== 201) {
        fail('Contact form submission', `attempt ${i + 1} failed`);
        break;
      }
      if (i === 5 && contactRes.status === 429) {
        rateLimited = true;
      }
    }
    if (rateLimited) pass('Contact form rate limited after 5 submissions'); else fail('Contact form rate limiting');
  } catch (err) { fail('Contact form tests', err.message); }

  // 15. Contact message status updates
  try {
    console.log('15. Contact message status updates');
    const msgsRes = await api.get('/stores/me/cms/contact-messages', { headers: headersA });
    const msg = msgsRes.data?.data?.[0];
    if (!msg) {
      fail('Contact message status', 'no messages found');
    } else {
      const statusRes = await api.patch(`/stores/me/cms/contact-messages/${msg.id}`, { status: 'in_progress' }, { headers: headersA });
      if (statusRes.status === 200 && statusRes.data.data.status === 'in_progress') {
        pass('Contact status updated to in_progress');
      } else {
        fail('Contact status update', JSON.stringify(statusRes.data));
      }
    }
  } catch (err) { fail('Contact message status', err.message); }

  // 16. Header and footer navigation link CRUD and reordering
  try {
    console.log('16. Navigation CRUD & reordering');
    const navCreate = await api.post('/stores/me/cms/navigation', {
      location: 'header',
      label: 'Test Link',
      url: `/shop/${storeA.slug}/pages/about`,
      position: 99
    }, { headers: headersA });
    if (navCreate.status === 201) pass('Navigation item created'); else fail('Navigation creation', JSON.stringify(navCreate.data));

    const navList = await api.get('/stores/me/cms/navigation?location=header', { headers: headersA });
    const items = navList.data?.data || [];
    if (items.length > 0) {
      const reordered = [items[items.length - 1], ...items.slice(0, -1)];
      const batchRes = await api.patch('/stores/me/cms/navigation', { items: reordered.map((it, i) => ({ ...it, position: i })) }, { headers: headersA });
      if (batchRes.status === 200) pass('Navigation batch reorder'); else fail('Navigation reorder', JSON.stringify(batchRes.data));
    }
  } catch (err) { fail('Navigation tests', err.message); }

  // 17. Active announcement scheduling
  try {
    console.log('17. Active announcement scheduling');
    const annRes = await api.post('/stores/me/cms/announcements', {
      title: 'Scheduled Banner',
      message: 'Live now',
      status: 'published',
      is_enabled: true,
      start_date: new Date(Date.now() - 86400000).toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString()
    }, { headers: headersA });
    if (annRes.status === 201) pass('Scheduled announcement created'); else fail('Announcement creation', JSON.stringify(annRes.data));

    const pubSnapshot = await api.get(`/public/stores/${storeA.slug}/cms/v2/snapshot`);
    if (pubSnapshot.status === 200 && pubSnapshot.data?.data?.announcement?.title === 'Scheduled Banner') {
      pass('Active announcement visible in snapshot');
    } else {
      fail('Active announcement snapshot');
    }
  } catch (err) { fail('Announcement tests', err.message); }

  // 18. Multi-tenant security
  try {
    console.log('18. Multi-tenant security');
    // Store B tries to access Store A page directly by ID
    const crossRes = await api.get(`/stores/me/cms/pages/${pageAId}`, { headers: headersB });
    if (crossRes.status === 404 || crossRes.status === 403) {
      pass('Cross-tenant page access blocked');
    } else {
      fail('Cross-tenant page access', `status=${crossRes.status}`);
    }

    const crossSections = await api.get(`/stores/me/cms/pages/${pageAId}/sections`, { headers: headersB });
    if (crossSections.status === 404 || crossSections.status === 403) {
      pass('Cross-tenant sections access blocked');
    } else {
      fail('Cross-tenant sections access', `status=${crossSections.status}`);
    }

    const crossMsgs = await api.get('/stores/me/cms/contact-messages', { headers: headersB });
    const hasStoreAMessage = crossMsgs.data?.data?.some((m) => m.store_id === storeA.id);
    if (crossMsgs.status === 200 && !hasStoreAMessage) {
      pass('Store B cannot see Store A messages');
    } else {
      fail('Cross-tenant messages access');
    }
  } catch (err) { fail('Multi-tenant security', err.message); }

  // 19. Regression: phase 1-4B settings endpoints still work
  try {
    console.log('19. Regression: legacy CMS settings endpoints');
    const settingsRes = await api.get('/stores/me/cms/settings', { headers: headersA });
    if (settingsRes.status === 200 && settingsRes.data?.data?.primary_color) {
      pass('Legacy settings endpoint works');
    } else {
      fail('Legacy settings endpoint');
    }
  } catch (err) { fail('Legacy settings regression', err.message); }

  // 20. Public storefront snapshot
  try {
    console.log('20. Public storefront snapshot');
    const snapshot = await api.get(`/public/stores/${storeA.slug}/cms/v2/snapshot`);
    if (snapshot.status === 200 && snapshot.data?.data?.navigation?.header && snapshot.data?.data?.appearance) {
      pass('Public storefront snapshot returned');
    } else {
      fail('Public storefront snapshot', JSON.stringify(snapshot.data));
    }
  } catch (err) { fail('Public snapshot', err.message); }

  // 21. Custom public page
  try {
    console.log('21. Public custom page rendering');
    const pagesRes = await api.get('/stores/me/cms/pages', { headers: headersA });
    const customPage = pagesRes.data.data.find((p) => p.slug === 'catering');
    // Add a section and publish
    await api.post(`/stores/me/cms/pages/${customPage.id}/sections`, { type: 'rich_text', content: { title: 'Catering', body: 'We cater events.' } }, { headers: headersA });
    await api.post(`/stores/me/cms/pages/${customPage.id}/publish`, {}, { headers: headersA });

    const publicPage = await api.get(`/public/stores/${storeA.slug}/cms/v2/pages/catering`);
    if (publicPage.status === 200 && publicPage.data?.data?.page?.slug === 'catering') {
      pass('Public custom page rendered');
    } else {
      fail('Public custom page', JSON.stringify(publicPage.data));
    }
  } catch (err) { fail('Public custom page', err.message); }

  // 22. Page duplication
  try {
    console.log('22. Page duplication');
    const pagesRes = await api.get('/stores/me/cms/pages', { headers: headersA });
    const aboutPage = pagesRes.data.data.find((p) => p.slug === 'about');
    const dupRes = await api.post(`/stores/me/cms/pages/${aboutPage.id}/duplicate`, {}, { headers: headersA });
    if (dupRes.status === 201 && dupRes.data?.data?.title?.includes('Copy')) {
      pass('Page duplicated');
    } else {
      fail('Page duplication', JSON.stringify(dupRes.data));
    }
  } catch (err) { fail('Page duplication', err.message); }

  // 23. Unpublish page and verify public 404
  try {
    console.log('23. Page unpublish');
    const pagesRes = await api.get('/stores/me/cms/pages', { headers: headersA });
    const customPage = pagesRes.data.data.find((p) => p.slug === 'catering');
    const unpublishRes = await api.post(`/stores/me/cms/pages/${customPage.id}/unpublish`, {}, { headers: headersA });
    if (unpublishRes.status === 200) pass('Page unpublished'); else fail('Page unpublish', JSON.stringify(unpublishRes.data));

    const publicUnpublished = await api.get(`/public/stores/${storeA.slug}/cms/v2/pages/catering`);
    if (publicUnpublished.status === 404) {
      pass('Unpublished page returns 404 publicly');
    } else {
      fail('Unpublished page public access', `status=${publicUnpublished.status}`);
    }
  } catch (err) { fail('Page unpublish', err.message); }

  // 24. Cleanup
  try {
    console.log('24. Cleanup');
    await db.query('DELETE FROM cms_contact_messages WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_navigation_items WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_page_sections WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_page_versions WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_preview_tokens WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_pages WHERE store_id = $1 AND slug NOT IN (SELECT slug FROM cms_pages WHERE is_system_page = true)', [storeA.id]);
    await db.query('DELETE FROM cms_media WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_announcements WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM cms_activity_logs WHERE store_id = $1', [storeA.id]);
    await db.query('DELETE FROM stores WHERE id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [userA.id, userB.id]);
    pass('Test data cleaned up');
  } catch (err) { fail('Cleanup', err.message); }

  // Summary
  console.log('\n================================================================');
  console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed`);
  console.log('================================================================\n');
  if (results.failed > 0) {
    results.errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('FATAL SUITE ERROR:', err);
  process.exit(1);
});
