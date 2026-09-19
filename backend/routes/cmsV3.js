const express = require('express');
const router = express.Router();
const cmsV3Controller = require('../controllers/cmsV3Controller');
const { authenticateToken, requireStoreAccess } = require('../middlewares/auth');

const cmsV3CollectionsController = require('../controllers/cmsV3CollectionsController');
const cmsController = require('../controllers/cmsController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const CMS_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'cms');
if (!fs.existsSync(CMS_UPLOAD_DIR)) {
  fs.mkdirSync(CMS_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CMS_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = allowed.test(file.mimetype);
    const extensionOk = allowed.test(ext);
    if (mime && extensionOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, gif, webp, svg) are allowed'));
    }
  }
});

// All V3 administration endpoints require authentication & store authorization
router.use(authenticateToken);
router.use(requireStoreAccess);

// Site Configuration & Feature Flag
router.get('/site-config', cmsV3Controller.getSiteConfig);
router.post('/site-config', cmsV3Controller.updateSiteConfig);

// Page Manager CRUD & Lifecycle
router.get('/pages', cmsV3Controller.getPages);
router.post('/pages', cmsV3Controller.createPage);
router.get('/pages/:pageId', cmsV3Controller.getPage);
router.put('/pages/:pageId', cmsV3Controller.updatePage);
router.post('/pages/:pageId/duplicate', cmsV3Controller.duplicatePage);
router.delete('/pages/:pageId', cmsV3Controller.deletePage);
router.get('/pages/:pageId/versions', cmsV3Controller.getPageVersions);
router.post('/pages/:pageId/save-draft', cmsV3Controller.saveDraft);
router.post('/pages/:pageId/publish', cmsV3Controller.publishPage);
router.post('/pages/:pageId/rollback', cmsV3Controller.rollbackPage);

// Template Gallery
router.get('/templates', cmsV3Controller.getTemplates);
router.get('/templates/:slug', cmsV3Controller.getTemplateBySlug);

// Theme Studio & Token Customization
router.get('/themes', cmsV3Controller.getThemes);
router.post('/themes/apply-draft', cmsV3Controller.applyThemeDraft);
router.post('/themes/publish', cmsV3Controller.publishTheme);
router.put('/themes/tokens', cmsV3Controller.updateThemeTokens);

// Navigation Designer
router.get('/navigation', cmsV3Controller.getNavigation);
router.put('/navigation/draft', cmsV3Controller.saveNavigationDraft);

// Media Library
router.get('/media', cmsV3Controller.getMedia);
router.post('/media', cmsV3Controller.uploadMedia);
router.post('/media/upload', upload.single('file'), cmsController.uploadMediaItem);
router.delete('/media/:mediaId', cmsV3Controller.deleteMedia);

// Forms & Submissions
router.get('/forms', cmsV3Controller.getForms);
router.post('/forms', cmsV3Controller.createForm);
router.get('/forms/:formId/submissions', cmsV3Controller.getFormSubmissions);

// Global Symbols
router.get('/symbols', cmsV3Controller.getGlobalSymbols);
router.post('/symbols', cmsV3Controller.createGlobalSymbol);
router.put('/symbols/:symbolId', cmsV3Controller.updateGlobalSymbol);

// Dynamic CMS Collections
router.get('/collections', cmsV3CollectionsController.getCollections);
router.post('/collections', cmsV3CollectionsController.createCollection);
router.get('/collections/:collectionId/items', cmsV3CollectionsController.getCollectionItems);
router.post('/collections/:collectionId/items', cmsV3CollectionsController.createCollectionItem);

// AI Workflows
router.post('/ai/generate-site', cmsV3Controller.generateSiteWithAi);
router.post('/ai/propose-edits', cmsV3Controller.proposeEditsWithAi);
router.post('/ai/apply-operations', cmsV3Controller.applyAiOperations);
router.post('/ai/audit', cmsV3Controller.runAiAudit);
router.get('/ai/runs', cmsV3Controller.getAiRuns);

// Staging test page initializer
router.post('/staging/init-hero-test', cmsV3Controller.initStagingTestPage);

module.exports = router;
