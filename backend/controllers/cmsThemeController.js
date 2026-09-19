const ThemeService = require('../services/ThemeService');
const CmsThemeAssignment = require('../models/CmsThemeAssignment');
const CmsTheme = require('../models/CmsTheme');

exports.getGallery = async (req, res) => {
  try {
    const themes = await ThemeService.getGallery();
    res.json({ success: true, themes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getThemeById = async (req, res) => {
  try {
    const { themeId } = req.params;
    const theme = await CmsTheme.findById(themeId);
    if (!theme) return res.status(404).json({ error: 'Theme not found' });
    res.json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveTheme = async (req, res) => {
  try {
    const store_id = req.storeId;
    const assignment = await CmsThemeAssignment.getAssignment(store_id);
    res.json({ success: true, active_theme: assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getThemeVersions = async (req, res) => {
  try {
    const store_id = req.storeId;
    const history = await CmsThemeAssignment.getVersionHistory(store_id);
    res.json({ success: true, versions: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSectionVariants = async (req, res) => {
  try {
    const variants = await ThemeService.getSectionVariants();
    res.json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStoreAssignment = async (req, res) => {
  try {
    const store_id = req.storeId;
    const assignment = await CmsThemeAssignment.getAssignment(store_id);
    const history = await CmsThemeAssignment.getVersionHistory(store_id);
    res.json({ success: true, assignment, version_history: history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.applyThemeAsDraft = async (req, res) => {
  try {
    const store_id = req.storeId;
    const user_id = req.user.id;
    const { theme_slug, theme_id } = req.body;
    const targetSlug = theme_slug || req.params.themeId;

    if (!targetSlug && !theme_id) return res.status(400).json({ error: 'theme_slug or theme_id is required' });

    let slugToUse = targetSlug;
    if (!slugToUse && theme_id) {
      const foundTheme = await CmsTheme.findById(theme_id);
      if (foundTheme) slugToUse = foundTheme.slug;
    }

    const version = await ThemeService.applyThemeAsDraft(store_id, slugToUse, user_id);
    res.status(201).json({ success: true, draft_version: version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generatePreviewToken = async (req, res) => {
  try {
    const store_id = req.storeId;
    const versionId = req.params.versionId || req.body.version_id;

    const tokenData = await ThemeService.generatePreviewToken(store_id, versionId);
    res.json({ success: true, ...tokenData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.publishTheme = async (req, res) => {
  try {
    const store_id = req.storeId;
    const versionId = req.params.versionId || req.body.version_id;

    if (!versionId) return res.status(400).json({ error: 'version_id is required' });

    const published = await ThemeService.publishTheme(store_id, versionId);
    res.json({ success: true, published_version: published });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rollbackTheme = async (req, res) => {
  try {
    const store_id = req.storeId;
    const versionId = req.params.versionId || req.body.target_version_id || req.body.version_id;

    if (!versionId) return res.status(400).json({ error: 'version_id is required' });

    const rolledBack = await ThemeService.rollbackTheme(store_id, versionId);
    res.json({ success: true, active_version: rolledBack });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
