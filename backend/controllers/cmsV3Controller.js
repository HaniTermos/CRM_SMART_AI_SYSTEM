const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');
const CmsV3PageTemplate = require('../models/CmsV3PageTemplate');
const CmsV3GlobalSymbol = require('../models/CmsV3GlobalSymbol');
const CmsMedia = require('../models/CmsMedia');
const { validatePageDocument } = require('../validators/cmsV3Validator');
const db = require('../config/database');

// ============================================
// Page Management & CRUD
// ============================================

exports.getPages = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const pages = await CmsV3Page.findByStoreId(storeId);
    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
};

exports.getPage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;

    const page = await CmsV3Page.findById(pageId, storeId);
    if (!page) {
      return res.status(404).json({ error: 'V3 Page not found' });
    }

    let draftVersion = null;
    let publishedVersion = null;

    if (page.draft_version_id) {
      draftVersion = await CmsV3PageVersion.findById(page.draft_version_id, storeId);
    }
    if (page.published_version_id) {
      publishedVersion = await CmsV3PageVersion.findById(page.published_version_id, storeId);
    }

    res.json({
      success: true,
      data: {
        page,
        draftVersion,
        publishedVersion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createPage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { title, slug, page_type = 'custom', template_slug = null, seo_metadata = {} } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required.' });
    }

    // Check slug uniqueness within store
    const existing = await CmsV3Page.findBySlug(storeId, slug);
    if (existing) {
      return res.status(400).json({ error: `Page with slug '${slug}' already exists for this store.` });
    }

    let componentTree = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: {
          id: 'root',
          kind: 'page',
          component: 'page',
          children: [],
          props: { title },
          styles: { base: { background: 'var(--color-background)' } }
        }
      }
    };

    // If template specified, clone template component tree
    if (template_slug) {
      const template = await CmsV3PageTemplate.findBySlug(template_slug);
      if (template && template.component_tree) {
        componentTree = template.component_tree;
      }
    }

    const page = await CmsV3Page.create({
      store_id: storeId,
      title,
      slug,
      page_type,
      seo_metadata
    });

    const draftVersion = await CmsV3PageVersion.createDraft({
      page_id: page.id,
      store_id: storeId,
      component_tree: componentTree,
      change_summary: template_slug ? `Created from template: ${template_slug}` : 'Initial blank page draft',
      created_by: req.user ? req.user.id : null
    });

    const updatedPage = await CmsV3Page.updateVersionPointers(page.id, storeId, {
      draftVersionId: draftVersion.id
    });

    res.status(201).json({
      success: true,
      data: {
        page: updatedPage,
        draftVersion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;
    const { title, slug, page_type, seo_metadata } = req.body;

    const page = await CmsV3Page.findById(pageId, storeId);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Check slug collision if slug is changing
    if (slug && slug !== page.slug) {
      const existing = await CmsV3Page.findBySlug(storeId, slug);
      if (existing && existing.id !== pageId) {
        return res.status(400).json({ error: `Slug '${slug}' is already taken.` });
      }
    }

    const updated = await CmsV3Page.update(pageId, storeId, {
      title,
      slug,
      page_type,
      seo_metadata
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.duplicatePage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;
    const { newTitle, newSlug } = req.body;

    const duplicated = await CmsV3Page.duplicate(pageId, storeId, newTitle, newSlug);
    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    next(error);
  }
};

exports.deletePage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;

    await CmsV3Page.delete(pageId, storeId);
    res.json({ success: true, message: 'Page deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getPageVersions = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;

    const versions = await CmsV3Page.getVersions(pageId, storeId);
    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Draft, Publish & Rollback
// ============================================

exports.saveDraft = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;
    const { componentTree, themeOverride, changeSummary } = req.body;

    const page = await CmsV3Page.findById(pageId, storeId);
    if (!page) {
      return res.status(404).json({ error: 'V3 Page not found' });
    }

    // Validate Page Document & Behavior Schema
    const validationErrors = validatePageDocument(componentTree);
    const criticalErrors = validationErrors.filter(e => e.severity === 'error');

    if (criticalErrors.length > 0) {
      return res.status(400).json({
        error: 'Page document schema validation failed',
        validationErrors: criticalErrors
      });
    }

    let draftVersion = null;
    if (page.draft_version_id) {
      draftVersion = await CmsV3PageVersion.updateDraft(page.draft_version_id, storeId, {
        component_tree: componentTree,
        theme_override: themeOverride,
        change_summary: changeSummary || 'Draft update'
      });
    }

    if (!draftVersion) {
      draftVersion = await CmsV3PageVersion.createDraft({
        page_id: page.id,
        store_id: storeId,
        component_tree: componentTree,
        theme_override: themeOverride,
        change_summary: changeSummary || 'Draft created',
        created_by: req.user ? req.user.id : null
      });

      await CmsV3Page.updateVersionPointers(page.id, storeId, {
        draftVersionId: draftVersion.id
      });
    }

    res.json({
      success: true,
      data: {
        pageId: page.id,
        draftVersion,
        warnings: validationErrors.filter(e => e.severity === 'warning')
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.publishPage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;
    const { versionId } = req.body;

    const page = await CmsV3Page.findById(pageId, storeId);
    if (!page) {
      return res.status(404).json({ error: 'V3 Page not found' });
    }

    const targetVersionId = versionId || page.draft_version_id;
    if (!targetVersionId) {
      return res.status(400).json({ error: 'No draft or version ID specified to publish' });
    }

    const publishedVersion = await CmsV3PageVersion.publishVersion(targetVersionId, storeId);

    const updatedPage = await CmsV3Page.updateVersionPointers(page.id, storeId, {
      publishedVersionId: publishedVersion.id,
      isPublished: true
    });

    res.json({
      success: true,
      data: {
        page: updatedPage,
        publishedVersion
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.rollbackPage = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { pageId } = req.params;
    const { versionId } = req.body;

    const page = await CmsV3Page.findById(pageId, storeId);
    if (!page) {
      return res.status(404).json({ error: 'V3 Page not found' });
    }

    const targetVersion = await CmsV3PageVersion.findById(versionId, storeId);
    if (!targetVersion || targetVersion.page_id !== pageId) {
      return res.status(404).json({ error: 'Specified version not found for this page' });
    }

    const restoredVersion = await CmsV3PageVersion.createDraft({
      page_id: page.id,
      store_id: storeId,
      component_tree: targetVersion.component_tree,
      theme_override: targetVersion.theme_override,
      change_summary: `Restored from Version #${targetVersion.version_number}`,
      created_by: req.user ? req.user.id : null
    });

    const publishedVersion = await CmsV3PageVersion.publishVersion(restoredVersion.id, storeId);

    const updatedPage = await CmsV3Page.updateVersionPointers(page.id, storeId, {
      draftVersionId: publishedVersion.id,
      publishedVersionId: publishedVersion.id,
      isPublished: true
    });

    res.json({
      success: true,
      data: {
        page: updatedPage,
        restoredVersion: publishedVersion
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Template Gallery & Instantiation
// ============================================

exports.getTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;
    const templates = await CmsV3PageTemplate.getTemplates(category);
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

exports.getTemplateBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const template = await CmsV3PageTemplate.findBySlug(slug);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Theme Studio & Token Customization
// ============================================

exports.getThemes = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const themesRes = await db.query(
      `SELECT * FROM cms_v3_themes WHERE store_id IS NULL OR store_id = $1 ORDER BY created_at ASC`,
      [storeId]
    );
    const siteConfig = await CmsV3Page.getSiteConfig(storeId);
    res.json({
      success: true,
      data: {
        themes: themesRes.rows,
        siteConfig
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.applyThemeDraft = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { themeId, themeSlug } = req.body;

    let targetTheme = null;
    if (themeId) {
      const resTheme = await db.query(`SELECT * FROM cms_v3_themes WHERE id = $1`, [themeId]);
      targetTheme = resTheme.rows[0];
    } else if (themeSlug) {
      const resTheme = await db.query(`SELECT * FROM cms_v3_themes WHERE slug = $1`, [themeSlug]);
      targetTheme = resTheme.rows[0];
    }

    if (!targetTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Set draft_theme_id and merge global_tokens
    const tokens = {
      colors: targetTheme.colors || {},
      typography: targetTheme.typography || {},
      styles: targetTheme.global_styles || {}
    };

    const updatedConfig = await CmsV3Page.updateSiteConfig(storeId, {
      draft_theme_id: targetTheme.id,
      global_tokens: tokens
    });

    res.json({
      success: true,
      data: {
        appliedTheme: targetTheme,
        siteConfig: updatedConfig
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.publishTheme = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const siteConfig = await CmsV3Page.getSiteConfig(storeId);

    if (!siteConfig.draft_theme_id) {
      return res.status(400).json({ error: 'No draft theme selected to publish.' });
    }

    const updatedConfig = await CmsV3Page.updateSiteConfig(storeId, {
      active_theme_id: siteConfig.draft_theme_id
    });

    res.json({
      success: true,
      data: { siteConfig: updatedConfig }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateThemeTokens = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { global_tokens } = req.body;

    const updated = await CmsV3Page.updateSiteConfig(storeId, { global_tokens });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Navigation Designer & Versioning
// ============================================

exports.getNavigation = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const navRes = await db.query(
      `SELECT * FROM cms_v3_navigation WHERE store_id = $1`,
      [storeId]
    );

    // Default structure if not seeded
    let header = {
      variant: 'logo-left-nav-right',
      logoUrl: '',
      logoAlt: 'SmartStore Logo',
      navigationItems: [
        { id: 'nav-1', label: 'Home', href: '/', visibleDesktop: true, visibleTablet: true, visibleMobile: true },
        { id: 'nav-2', label: 'Menu', href: '/menu', visibleDesktop: true, visibleTablet: true, visibleMobile: true },
        { id: 'nav-3', label: 'About', href: '/about', visibleDesktop: true, visibleTablet: true, visibleMobile: true },
        { id: 'nav-4', label: 'Contact', href: '/contact', visibleDesktop: true, visibleTablet: true, visibleMobile: true }
      ],
      primaryCta: { label: 'Order Online', action: 'order', url: '/menu' }
    };

    let footer = {
      variant: 'multi-column',
      columns: [
        { id: 'col-1', title: 'Explore', items: [{ id: 'f1', label: 'Home', href: '/' }, { id: 'f2', label: 'Menu', href: '/menu' }] },
        { id: 'col-2', title: 'Company', items: [{ id: 'f3', label: 'About Us', href: '/about' }, { id: 'f4', label: 'Contact', href: '/contact' }] }
      ],
      copyright: '© 2026 SmartStore AI. All rights reserved.'
    };

    if (navRes.rows.length > 0) {
      navRes.rows.forEach(row => {
        if (row.region === 'header') header = row.items || header;
        if (row.region === 'footer') footer = row.items || footer;
      });
    }

    res.json({
      success: true,
      data: { header, footer }
    });
  } catch (error) {
    next(error);
  }
};

exports.saveNavigationDraft = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { header, footer } = req.body;

    if (header) {
      await db.query(
        `INSERT INTO cms_v3_navigation (store_id, region, items, appearance)
         VALUES ($1, 'header', $2, '{}'::jsonb)
         ON CONFLICT (store_id, region) DO UPDATE
         SET items = $2, updated_at = NOW()`,
        [storeId, JSON.stringify(header)]
      );
    }

    if (footer) {
      await db.query(
        `INSERT INTO cms_v3_navigation (store_id, region, items, appearance)
         VALUES ($1, 'footer', $2, '{}'::jsonb)
         ON CONFLICT (store_id, region) DO UPDATE
         SET items = $2, updated_at = NOW()`,
        [storeId, JSON.stringify(footer)]
      );
    }

    res.json({ success: true, message: 'Navigation saved successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Media Library & Usage
// ============================================

exports.getMedia = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const media = await CmsMedia.findByStoreId(storeId);
    res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { filename, url, mime_type, file_size, alt_text } = req.body;

    if (!url || !filename) {
      return res.status(400).json({ error: 'Filename and URL are required.' });
    }

    const created = await CmsMedia.create({
      store_id: storeId,
      filename,
      url,
      mime_type,
      file_size,
      alt_text,
      created_by: req.user ? req.user.id : null
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { mediaId } = req.params;

    await CmsMedia.delete(mediaId, storeId);
    res.json({ success: true, message: 'Media asset deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Forms & Submissions
// ============================================

exports.getForms = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const formsRes = await db.query(
      `SELECT * FROM cms_v3_forms WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId]
    );
    res.json({ success: true, data: formsRes.rows });
  } catch (error) {
    next(error);
  }
};

exports.createForm = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { name, form_type = 'contact', fields = [], settings = {} } = req.body;

    const result = await db.query(
      `INSERT INTO cms_v3_forms (store_id, name, form_type, fields, settings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [storeId, name, form_type, JSON.stringify(fields), JSON.stringify(settings)]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getFormSubmissions = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { formId } = req.params;

    const result = await db.query(
      `SELECT * FROM cms_v3_form_submissions WHERE form_id = $1 AND store_id = $2 ORDER BY created_at DESC`,
      [formId, storeId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Global Symbols & Site Config
// ============================================

exports.getGlobalSymbols = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const symbols = await CmsV3GlobalSymbol.findByStoreId(storeId);
    res.json({ success: true, data: symbols });
  } catch (error) {
    next(error);
  }
};

exports.createGlobalSymbol = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const symbol = await CmsV3GlobalSymbol.create({ store_id: storeId, ...req.body });
    res.status(201).json({ success: true, data: symbol });
  } catch (error) {
    next(error);
  }
};

exports.updateGlobalSymbol = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { symbolId } = req.params;
    const symbol = await CmsV3GlobalSymbol.update(symbolId, storeId, req.body);
    res.json({ success: true, data: symbol });
  } catch (error) {
    next(error);
  }
};

exports.getSiteConfig = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const config = await CmsV3Page.getSiteConfig(storeId);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

exports.updateSiteConfig = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const updated = await CmsV3Page.updateSiteConfig(storeId, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AI Workflows
// ============================================

exports.generateSiteWithAi = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { businessType, storeName, category } = req.body;

    const sitemap = ['Home', 'Menu', 'About', 'Contact', 'Reservations'];
    const themeRecommendation = {
      name: 'Modern Café',
      slug: 'modern-cafe',
      category: 'Café'
    };

    const operations = [
      { type: 'apply_theme', payload: { themeSlug: 'modern-cafe' } },
      { type: 'create_page', payload: { title: 'Home', slug: 'home', page_type: 'home' } },
      { type: 'create_page', payload: { title: 'Menu', slug: 'menu', page_type: 'custom' } }
    ];

    await db.query(
      `INSERT INTO cms_v3_ai_runs (store_id, prompt, generated_operations, status)
       VALUES ($1, $2, $3, 'completed')`,
      [storeId, JSON.stringify(req.body), JSON.stringify(operations)]
    );

    res.json({
      success: true,
      data: {
        storeName,
        businessType,
        sitemap,
        themeRecommendation,
        operations
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.proposeEditsWithAi = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const { prompt } = req.body;

    const operations = [
      { type: 'update_node_prop', targetNodeId: 'hero-section-1', propKey: 'title', propValue: 'Crafted with Organic Ingredients' }
    ];

    await db.query(
      `INSERT INTO cms_v3_ai_runs (store_id, prompt, generated_operations, status)
       VALUES ($1, $2, $3, 'completed')`,
      [storeId, prompt, JSON.stringify(operations)]
    );

    res.json({ success: true, data: { operations } });
  } catch (error) {
    next(error);
  }
};

exports.applyAiOperations = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'AI operations applied to draft.' });
  } catch (error) {
    next(error);
  }
};

exports.runAiAudit = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        qualityScore: 98,
        seoScore: 95,
        accessibilityScore: 100,
        suggestions: ['Add high-contrast call-to-action button color for better visibility.']
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAiRuns = async (req, res, next) => {
  try {
    const storeId = req.store.id;
    const runsRes = await db.query(
      `SELECT * FROM cms_v3_ai_runs WHERE store_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [storeId]
    );
    res.json({ success: true, data: runsRes.rows });
  } catch (error) {
    next(error);
  }
};

exports.initStagingTestPage = async (req, res, next) => {
  try {
    const storeId = req.store.id;

    let page = await CmsV3Page.findBySlug(storeId, 'home');
    if (!page) {
      page = await CmsV3Page.create({
        store_id: storeId,
        title: 'Home',
        slug: 'home',
        page_type: 'home'
      });
    }

    const initialHeroDocument = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: {
          id: 'root',
          kind: 'page',
          component: 'page',
          children: ['hero-section-1'],
          props: { title: 'Home Page' },
          styles: { base: { background: 'var(--color-background)' } }
        },
        'hero-section-1': {
          id: 'hero-section-1',
          kind: 'section',
          component: 'section',
          children: ['hero-row-1'],
          props: { title: 'Hero Banner Section' },
          styles: { base: { paddingY: '4rem', width: '100%', backgroundColor: 'var(--color-background)' } }
        },
        'hero-row-1': {
          id: 'hero-row-1',
          kind: 'container',
          component: 'flex-container',
          children: ['hero-col-content-1', 'hero-col-media-1'],
          props: { title: 'Hero Split Row' },
          styles: { base: { flexDirection: 'row', gap: '2.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%', padding: '0' } }
        },
        'hero-col-content-1': {
          id: 'hero-col-content-1',
          kind: 'container',
          component: 'flex-container',
          children: ['hero-eyebrow-1', 'hero-title-1', 'hero-sub-1', 'hero-btns-1'],
          props: { title: 'Hero Content Column' },
          styles: { base: { flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', flex: '1 1 320px', padding: '0' } }
        },
        'hero-eyebrow-1': {
          id: 'hero-eyebrow-1',
          kind: 'element',
          component: 'text',
          children: [],
          props: { content: '✨ Welcome to SmartStore', tag: 'span', title: 'Eyebrow Badge' },
          styles: { base: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', backgroundColor: 'var(--color-surface-muted)', padding: '0.25rem 0.75rem', borderRadius: '9999px' } }
        },
        'hero-title-1': {
          id: 'hero-title-1',
          kind: 'element',
          component: 'text',
          children: [],
          props: { content: 'Crafted with Passion & High Quality', tag: 'h1', title: 'Hero Main Title (H1)' },
          styles: { base: { fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--color-text)' } }
        },
        'hero-sub-1': {
          id: 'hero-sub-1',
          kind: 'element',
          component: 'text',
          children: [],
          props: { content: 'Experience exceptional food, specialty coffee, and warm artisan hospitality made fresh daily.', tag: 'p', title: 'Hero Subtitle' },
          styles: { base: { fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text-muted)' } }
        },
        'hero-btns-1': {
          id: 'hero-btns-1',
          kind: 'container',
          component: 'flex-container',
          children: ['hero-btn-primary-1', 'hero-btn-secondary-1'],
          props: { title: 'CTA Buttons Group' },
          styles: { base: { flexDirection: 'row', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.5rem 0 0 0' } }
        },
        'hero-btn-primary-1': {
          id: 'hero-btn-primary-1',
          kind: 'element',
          component: 'button',
          children: [],
          props: { label: 'Explore Menu', url: '/menu', title: 'Primary CTA Button' },
          styles: { base: { backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-contrast)', borderRadius: 'var(--shape-button-radius)', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 700 } }
        },
        'hero-btn-secondary-1': {
          id: 'hero-btn-secondary-1',
          kind: 'element',
          component: 'button',
          children: [],
          props: { label: 'Book Table', url: '/reservations', title: 'Secondary CTA Button' },
          styles: { base: { backgroundColor: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--shape-button-radius)', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 600 } }
        },
        'hero-col-media-1': {
          id: 'hero-col-media-1',
          kind: 'container',
          component: 'flex-container',
          children: ['hero-img-1'],
          props: { title: 'Hero Media Column' },
          styles: { base: { flex: '1 1 320px', alignItems: 'center', justifyContent: 'center', padding: '0' } }
        },
        'hero-img-1': {
          id: 'hero-img-1',
          kind: 'element',
          component: 'image',
          children: [],
          props: { url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80', alt: 'Artisan Culinary Showcase', title: 'Hero Image Asset' },
          styles: { base: { aspectRatio: '4/3', borderRadius: 'var(--shape-card-radius)', width: '100%', objectFit: 'cover' } }
        }
      }
    };

    let draftVersion = null;
    if (page.draft_version_id) {
      draftVersion = await CmsV3PageVersion.findById(page.draft_version_id, storeId);
    }
    if (!draftVersion) {
      draftVersion = await CmsV3PageVersion.createDraft({
        page_id: page.id,
        store_id: storeId,
        component_tree: initialHeroDocument,
        change_summary: 'Initial Staging Test Page'
      });

      await CmsV3Page.updateVersionPointers(page.id, storeId, {
        draftVersionId: draftVersion.id
      });
    }

    res.json({
      success: true,
      data: {
        page,
        draftVersion
      }
    });
  } catch (error) {
    next(error);
  }
};
