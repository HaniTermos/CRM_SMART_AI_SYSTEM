const CmsSettings = require('../models/CmsSettings');
const CmsMedia = require('../models/CmsMedia');
const CmsAnnouncement = require('../models/CmsAnnouncement');
const CmsPageV2 = require('../models/CmsPageV2');
const CmsPageSection = require('../models/CmsPageSection');
const CmsPageVersion = require('../models/CmsPageVersion');
const CmsNavigation = require('../models/CmsNavigation');
const CmsContactMessage = require('../models/CmsContactMessage');
const CmsPreviewToken = require('../models/CmsPreviewToken');
const CmsActivityLog = require('../models/CmsActivityLog');
const CmsTheme = require('../models/CmsTheme');
const AiService = require('../services/AiService');
const db = require('../config/database');

async function getStoreIdForRequest(req) {
  if (req.params.storeId) {
    if (req.user && req.user.role !== 'admin') {
      const accessRes = await db.query(
        `SELECT store_id FROM user_roles WHERE user_id = $1 AND store_id = $2`,
        [req.user.id, req.params.storeId]
      );
      if (accessRes.rows.length === 0) {
        const err = new Error('Access denied: User does not have permission for this store');
        err.status = 403;
        throw err;
      }
    }
    return req.params.storeId;
  }

  if (!req.user) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }

  const roleRes = await db.query(
    `SELECT store_id FROM user_roles WHERE user_id = $1 LIMIT 1`,
    [req.user.id]
  );
  if (roleRes.rows.length === 0) {
    const err = new Error('No store associated with user');
    err.status = 403;
    throw err;
  }
  return roleRes.rows[0].store_id;
}

// 0. Overview Handler
exports.getCmsOverview = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const settings = await CmsSettings.findByStoreId(storeId);
    const pages = await CmsPageV2.findByStoreId(storeId);
    const media = await CmsMedia.findByStoreId(storeId);
    const announcements = await CmsAnnouncement.findByStoreId(storeId);
    const activity = await CmsActivityLog.findByStoreId(storeId, 10);

    const publishedPagesCount = pages.filter(p => p.status === 'published').length;
    const draftPagesCount = pages.filter(p => p.status === 'draft').length;

    res.json({
      success: true,
      data: {
        settings,
        stats: {
          total_pages: pages.length,
          published_pages: publishedPagesCount,
          draft_pages: draftPagesCount,
          total_media: media.length,
          total_announcements: announcements.length,
          last_published_at: settings.published_at
        },
        recent_pages: pages.slice(0, 5),
        recent_activity: activity
      }
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 1. Settings & Appearance Handlers
exports.getCmsSettings = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const settings = await CmsSettings.findByStoreId(storeId);
    res.json({ success: true, data: settings });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateCmsSettings = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsSettings.updateDraft(storeId, req.body);
    await CmsActivityLog.log(storeId, req.user?.id, 'update_draft_settings', { fields: Object.keys(req.body) });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.publishCmsSettings = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const published = await CmsSettings.publish(storeId);
    await CmsActivityLog.log(storeId, req.user?.id, 'publish_homepage', { version: published.version });
    res.json({ success: true, data: published });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.rollbackCmsSettings = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const rolledBack = await CmsSettings.rollback(storeId);
    await CmsActivityLog.log(storeId, req.user?.id, 'rollback_homepage', { version: rolledBack.version });
    res.json({ success: true, data: rolledBack });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 2. Page V2 Handlers
exports.getCmsPagesV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const pages = await CmsPageV2.findByStoreId(storeId);
    res.json({ success: true, data: pages });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createCmsPageV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const created = await CmsPageV2.create({ ...req.body, store_id: storeId });
    
    // Create initial default section for new custom pages
    await CmsPageSection.create({
      store_id: storeId,
      page_id: created.id,
      type: 'rich_text',
      position: 0,
      content: { title: created.title, body: 'Welcome to ' + created.title }
    });

    await CmsActivityLog.log(storeId, req.user?.id, 'create_page', { page_id: created.id, title: created.title, slug: created.slug });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getCmsPageV2ById = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const page = await CmsPageV2.findById(req.params.pageId, storeId);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    const sections = await CmsPageSection.findByPageId(page.id, storeId);
    res.json({ success: true, data: { ...page, sections } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateCmsPageV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsPageV2.update(req.params.pageId, storeId, req.body);
    await CmsActivityLog.log(storeId, req.user?.id, 'update_page_metadata', { page_id: req.params.pageId });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteCmsPageV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const deleted = await CmsPageV2.delete(req.params.pageId, storeId);
    await CmsActivityLog.log(storeId, req.user?.id, 'delete_page', { page_id: req.params.pageId });
    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.publishCmsPageV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const versionRecord = await CmsPageVersion.createVersion(req.params.pageId, storeId, req.user?.id);
    await CmsActivityLog.log(storeId, req.user?.id, 'publish_page', { page_id: req.params.pageId, version: versionRecord.version });
    const updatedPage = await CmsPageV2.findById(req.params.pageId, storeId);
    res.json({ success: true, data: { page: updatedPage, version: versionRecord } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.unpublishCmsPageV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsPageV2.update(req.params.pageId, storeId, { status: 'draft' });
    await CmsActivityLog.log(storeId, req.user?.id, 'unpublish_page', { page_id: req.params.pageId });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.duplicateCmsPageV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const original = await CmsPageV2.findById(req.params.pageId, storeId);
    if (!original) return res.status(404).json({ error: 'Page not found' });

    const newSlug = original.slug + '-copy-' + Math.floor(Math.random() * 1000);
    const created = await CmsPageV2.create({
      store_id: storeId,
      title: original.title + ' (Copy)',
      slug: newSlug,
      type: 'custom',
      is_system_page: false,
      show_in_navigation: false,
      status: 'draft'
    });

    const originalSections = await CmsPageSection.findByPageId(original.id, storeId);
    for (const sec of originalSections) {
      await CmsPageSection.create({
        store_id: storeId,
        page_id: created.id,
        type: sec.type,
        position: sec.position,
        is_visible: sec.is_visible,
        visibility: sec.visibility,
        content: sec.content,
        layout: sec.layout,
        appearance: sec.appearance,
        background: sec.background,
        responsive: sec.responsive
      });
    }

    await CmsActivityLog.log(storeId, req.user?.id, 'duplicate_page', { original_id: original.id, new_id: created.id });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getCmsPageVersionsV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const versions = await CmsPageVersion.findByPageId(req.params.pageId, storeId);
    res.json({ success: true, data: versions });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.restoreCmsPageVersionV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const restored = await CmsPageVersion.restoreVersion(req.params.pageId, req.params.versionId, storeId);
    await CmsActivityLog.log(storeId, req.user?.id, 'restore_page_version', { page_id: req.params.pageId, version_id: req.params.versionId });
    const updatedPage = await CmsPageV2.findById(req.params.pageId, storeId);
    const sections = await CmsPageSection.findByPageId(req.params.pageId, storeId);
    res.json({ success: true, data: { page: updatedPage, sections } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.generatePreviewToken = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const tokenObj = await CmsPreviewToken.generateToken(storeId, req.user.id, req.params.pageId);
    res.json({ success: true, data: tokenObj });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 3. Section Handlers
exports.getCmsPageSectionsV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const page = await CmsPageV2.findById(req.params.pageId, storeId);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    const sections = await CmsPageSection.findByPageId(req.params.pageId, storeId);
    res.json({ success: true, data: sections });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createCmsPageSectionV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const created = await CmsPageSection.create({
      ...req.body,
      store_id: storeId,
      page_id: req.params.pageId
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.reorderCmsPageSectionsV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsPageSection.reorder(req.params.pageId, storeId, req.body.section_ids);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateCmsPageSectionV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsPageSection.update(req.params.sectionId, storeId, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.duplicateCmsPageSectionV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const duplicated = await CmsPageSection.duplicate(req.params.sectionId, storeId);
    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteCmsPageSectionV2 = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    await CmsPageSection.delete(req.params.sectionId, storeId);
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 4. Media Library Handlers (With Usage Protection)
exports.getMediaLibrary = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const media = await CmsMedia.findByStoreId(storeId);
    res.json({ success: true, data: media });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createMediaItem = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const data = {
      ...req.body,
      store_id: storeId,
      created_by: req.user?.id
    };
    const media = await CmsMedia.create(data);
    await CmsActivityLog.log(storeId, req.user?.id, 'upload_media', { media_id: media.id, filename: media.filename });
    res.status(201).json({ success: true, data: media });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.uploadMediaItem = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/cms/${req.file.filename}`;
    const media = await CmsMedia.create({
      store_id: storeId,
      filename: req.file.originalname,
      url,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      alt_text: req.body.alt_text || req.file.originalname,
      created_by: req.user?.id
    });
    await CmsActivityLog.log(storeId, req.user?.id, 'upload_media', { media_id: media.id, filename: media.filename });
    res.status(201).json({ success: true, data: media });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateMediaItem = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsMedia.update(req.params.id, storeId, req.body);
    if (!updated) return res.status(404).json({ error: 'Media asset not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteMediaItem = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const media = await CmsMedia.findById(req.params.id, storeId);
    if (!media) return res.status(404).json({ error: 'Media asset not found' });

    // Usage Protection Check
    const usageCheck = await db.query(
      `SELECT id FROM cms_page_sections WHERE store_id = $1 AND content::text LIKE $2 LIMIT 1`,
      [storeId, `%${media.url}%`]
    );
    if (usageCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete media asset: it is currently used in active page sections' });
    }

    const deleted = await CmsMedia.delete(req.params.id, storeId);
    await CmsActivityLog.log(storeId, req.user?.id, 'delete_media', { media_id: req.params.id });
    res.json({ success: true, message: 'Media asset deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 5. Navigation Handlers
exports.getNavigationItems = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const items = await CmsNavigation.findByStoreId(storeId, req.query.location);
    res.json({ success: true, data: items });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createNavigationItem = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const created = await CmsNavigation.create({ ...req.body, store_id: storeId });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateNavigationBatch = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsNavigation.updateBatch(storeId, req.body.items);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteNavigationItem = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    await CmsNavigation.delete(req.params.id, storeId);
    res.json({ success: true, message: 'Navigation item deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 6. Contact Messages Handlers
exports.getContactMessages = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const messages = await CmsContactMessage.findByStoreId(storeId, { status: req.query.status });
    res.json({ success: true, data: messages });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.getContactMessageAnalytics = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const days = parseInt(req.query.days) || 30;
    const analytics = await CmsContactMessage.getAnalytics(storeId, days);
    res.json({ success: true, data: analytics });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateContactMessageStatus = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsContactMessage.updateStatus(req.params.id, storeId, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteContactMessage = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    await CmsContactMessage.delete(req.params.id, storeId);
    res.json({ success: true, message: 'Contact message deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 7. Announcements Handlers
exports.getAnnouncements = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const announcements = await CmsAnnouncement.findByStoreId(storeId);
    res.json({ success: true, data: announcements });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const created = await CmsAnnouncement.create({ ...req.body, store_id: storeId });
    await CmsActivityLog.log(storeId, req.user?.id, 'create_announcement', { id: created.id, title: created.title });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const updated = await CmsAnnouncement.update(req.params.id, storeId, req.body);
    if (!updated) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.publishAnnouncement = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const published = await CmsAnnouncement.publish(req.params.id, storeId);
    if (!published) return res.status(404).json({ error: 'Announcement not found' });
    await CmsActivityLog.log(storeId, req.user?.id, 'publish_announcement', { id: published.id });
    res.json({ success: true, data: published });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const deleted = await CmsAnnouncement.delete(req.params.id, storeId);
    if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
    await CmsActivityLog.log(storeId, req.user?.id, 'delete_announcement', { id: req.params.id });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 8. Activity Log Handler
exports.getCmsActivityLogs = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const logs = await CmsActivityLog.findByStoreId(storeId);
    res.json({ success: true, data: logs });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 9. Theme Handlers
exports.getCmsThemes = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const themes = await CmsTheme.findAll();
    const settings = await CmsSettings.findByStoreId(storeId);
    res.json({ success: true, data: { themes, current_theme_id: settings.theme_id || null } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.applyCmsTheme = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const theme = await CmsTheme.findById(req.params.themeId);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });

    const colors = theme.colors || {};
    const fonts = theme.fonts || {};
    const updates = {
      theme_id: theme.id,
      primary_color: colors.primary_color,
      accent_color: colors.accent_color,
      font_family: fonts.font_family,
      theme_mode: colors.background_color && isDarkColor(colors.background_color) ? 'dark' : 'light'
    };

    const updated = await CmsSettings.updateDraft(storeId, updates);
    await CmsActivityLog.log(storeId, req.user?.id, 'update_draft_settings', { theme_id: theme.id, theme_name: theme.name });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

function isDarkColor(hex) {
  if (!hex) return false;
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized.length === 3 ? sanitized.split('').map((c) => c + c).join('') : sanitized, 16);
  if (isNaN(bigint)) return false;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

// 10. AI Builder Handlers
exports.generateWebsiteWithAI = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const storeRes = await db.query(`SELECT name, slug, currency FROM stores WHERE id = $1`, [storeId]);
    const store = storeRes.rows[0];
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const { prompt, apply = false } = req.body || {};
    const plan = await AiService.generateWebsitePlan(store, prompt);

    if (apply) {
      const homePage = await CmsPageV2.findBySlug(storeId, 'home');
      if (!homePage) return res.status(404).json({ error: 'Home page not found' });

      await CmsPageSection.deleteByPageId(homePage.id, storeId);
      for (let i = 0; i < plan.sections.length; i++) {
        const s = plan.sections[i];
        await CmsPageSection.create({
          store_id: storeId,
          page_id: homePage.id,
          type: s.type,
          position: i,
          content: s.content || {},
          appearance: s.appearance || {},
          background: s.background || {},
          layout: s.layout || { width: 'contained', padding_top: 'medium', padding_bottom: 'medium' }
        });
      }
      await CmsActivityLog.log(storeId, req.user?.id, 'ai_generate_website', { sections_count: plan.sections.length });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.editPageWithAI = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const page = await CmsPageV2.findById(req.body.pageId, storeId);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const storeRes = await db.query(`SELECT name, slug, currency FROM stores WHERE id = $1`, [storeId]);
    const store = storeRes.rows[0];
    const existingSections = await CmsPageSection.findByPageId(page.id, storeId);
    const { prompt, apply = false } = req.body || {};
    const plan = await AiService.editPagePlan(store, page, existingSections, prompt);

    if (apply) {
      await CmsPageSection.deleteByPageId(page.id, storeId);
      for (let i = 0; i < plan.sections.length; i++) {
        const s = plan.sections[i];
        await CmsPageSection.create({
          store_id: storeId,
          page_id: page.id,
          type: s.type,
          position: i,
          content: s.content || {},
          appearance: s.appearance || {},
          background: s.background || {},
          layout: s.layout || { width: 'contained', padding_top: 'medium', padding_bottom: 'medium' }
        });
      }
      await CmsActivityLog.log(storeId, req.user?.id, 'ai_edit_page', { page_id: page.id, sections_count: plan.sections.length });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.applyAIPlan = async (req, res, next) => {
  try {
    const storeId = await getStoreIdForRequest(req);
    const { pageId, sections } = req.body || {};
    if (!pageId || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'pageId and sections array are required' });
    }
    const page = await CmsPageV2.findById(pageId, storeId);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    await CmsPageSection.deleteByPageId(page.id, storeId);
    const created = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!CmsPageSection.VALID_SECTION_TYPES.includes(s.type)) continue;
      const section = await CmsPageSection.create({
        store_id: storeId,
        page_id: page.id,
        type: s.type,
        position: i,
        content: s.content || {},
        appearance: s.appearance || {},
        background: s.background || {},
        layout: s.layout || { width: 'contained', padding_top: 'medium', padding_bottom: 'medium' }
      });
      created.push(section);
    }
    await CmsActivityLog.log(storeId, req.user?.id, 'ai_apply_plan', { page_id: page.id, sections_count: created.length });
    res.json({ success: true, data: { page, sections: created } });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 11. CMS Appointments / Restaurant Table Reservations
exports.getCmsAppointments = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const storeId = await getStoreIdForRequest(req);
    const result = await db.query(
      `SELECT * FROM cms_appointments WHERE store_id = $1 ORDER BY reservation_date DESC, reservation_time DESC`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.createCmsAppointment = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const storeId = await getStoreIdForRequest(req);
    const { guest_name, phone, email, reservation_date, reservation_time, party_size, table_preference, special_requests, dietary_notes } = req.body || {};
    if (!guest_name || !phone || !reservation_date || !reservation_time) {
      return res.status(400).json({ error: 'guest_name, phone, reservation_date, and reservation_time are required' });
    }
    const result = await db.query(
      `INSERT INTO cms_appointments
       (store_id, guest_name, phone, email, reservation_date, reservation_time, party_size, table_preference, special_requests, dietary_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [storeId, guest_name, phone, email || null, reservation_date, reservation_time, Number(party_size || 2), table_preference || 'indoor', special_requests || null, dietary_notes || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateCmsAppointmentStatus = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const storeId = await getStoreIdForRequest(req);
    const { status } = req.body || {};
    const result = await db.query(
      `UPDATE cms_appointments SET status = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3 RETURNING *`,
      [status, req.params.id, storeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.deleteCmsAppointment = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const storeId = await getStoreIdForRequest(req);
    await db.query(`DELETE FROM cms_appointments WHERE id = $1 AND store_id = $2`, [req.params.id, storeId]);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

// 12. Menu Presentation Studio
exports.getCmsMenuPresentation = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const storeId = await getStoreIdForRequest(req);
    const result = await db.query(`SELECT * FROM cms_menu_presentation WHERE store_id = $1`, [storeId]);
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          store_id: storeId,
          layout_design: 'tabs',
          image_aspect_ratio: '16:9',
          show_dietary_badges: true,
          show_search_bar: true,
          sold_out_behavior: 'dim',
          sticky_order_cta: true,
          category_order: [],
          custom_settings: {}
        }
      });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

exports.updateCmsMenuPresentation = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const storeId = await getStoreIdForRequest(req);
    const { layout_design, image_aspect_ratio, show_dietary_badges, show_search_bar, sold_out_behavior, sticky_order_cta, category_order, custom_settings } = req.body || {};
    const result = await db.query(
      `INSERT INTO cms_menu_presentation (store_id, layout_design, image_aspect_ratio, show_dietary_badges, show_search_bar, sold_out_behavior, sticky_order_cta, category_order, custom_settings, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (store_id) DO UPDATE SET
         layout_design = COALESCE(EXCLUDED.layout_design, cms_menu_presentation.layout_design),
         image_aspect_ratio = COALESCE(EXCLUDED.image_aspect_ratio, cms_menu_presentation.image_aspect_ratio),
         show_dietary_badges = COALESCE(EXCLUDED.show_dietary_badges, cms_menu_presentation.show_dietary_badges),
         show_search_bar = COALESCE(EXCLUDED.show_search_bar, cms_menu_presentation.show_search_bar),
         sold_out_behavior = COALESCE(EXCLUDED.sold_out_behavior, cms_menu_presentation.sold_out_behavior),
         sticky_order_cta = COALESCE(EXCLUDED.sticky_order_cta, cms_menu_presentation.sticky_order_cta),
         category_order = COALESCE(EXCLUDED.category_order, cms_menu_presentation.category_order),
         custom_settings = COALESCE(EXCLUDED.custom_settings, cms_menu_presentation.custom_settings),
         updated_at = NOW()
       RETURNING *`,
      [
        storeId,
        layout_design || 'tabs',
        image_aspect_ratio || '16:9',
        show_dietary_badges ?? true,
        show_search_bar ?? true,
        sold_out_behavior || 'dim',
        sticky_order_cta ?? true,
        JSON.stringify(category_order || []),
        JSON.stringify(custom_settings || {})
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};
