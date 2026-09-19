const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, requireStoreAccess } = require('../middlewares/auth');
const cmsThemeController = require('../controllers/cmsThemeController');

function getStoreIdForRequest(req, res, next) {
  if (req.params.storeId && req.params.storeId !== 'me') {
    req.storeId = req.params.storeId;
    return requireStoreAccess(req, res, next);
  }
  req.storeId = req.user.store_id || req.user.active_store_id;
  if (!req.storeId) return res.status(400).json({ error: 'Store context missing' });
  next();
}

router.use(authenticate, getStoreIdForRequest);

// Specific routes
router.get('/', cmsThemeController.getGallery);
router.get('/gallery', cmsThemeController.getGallery);
router.get('/active', cmsThemeController.getActiveTheme);
router.get('/assignment', cmsThemeController.getStoreAssignment);
router.get('/variants', cmsThemeController.getSectionVariants);
router.get('/section-variants', cmsThemeController.getSectionVariants);
router.get('/theme-versions', cmsThemeController.getThemeVersions);
router.get('/theme-versions/:versionId/preview', cmsThemeController.generatePreviewToken);
router.post('/theme-versions/:versionId/publish', cmsThemeController.publishTheme);
router.post('/theme-versions/:versionId/rollback', cmsThemeController.rollbackTheme);

// Theme ID routes
router.get('/:themeId', cmsThemeController.getThemeById);
router.post('/:themeId/apply', cmsThemeController.applyThemeAsDraft);

// Actions
router.post('/apply-draft', cmsThemeController.applyThemeAsDraft);
router.post('/preview-token', cmsThemeController.generatePreviewToken);
router.post('/publish', cmsThemeController.publishTheme);
router.post('/rollback', cmsThemeController.rollbackTheme);

module.exports = router;
