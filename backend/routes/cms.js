const express = require('express');
const router = express.Router({ mergeParams: true });
const cmsController = require('../controllers/cmsController');
const { authenticate } = require('../middlewares/auth');
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
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.use(authenticate);

// Overview
router.get('/overview', cmsController.getCmsOverview);

// Brand Settings & Appearance
router.get('/settings', cmsController.getCmsSettings);
router.patch('/settings', cmsController.updateCmsSettings);
router.post('/settings/publish', cmsController.publishCmsSettings);
router.post('/settings/rollback', cmsController.rollbackCmsSettings);

// Page V2 Endpoints
router.get('/pages', cmsController.getCmsPagesV2);
router.post('/pages', cmsController.createCmsPageV2);
router.get('/pages/:pageId', cmsController.getCmsPageV2ById);
router.patch('/pages/:pageId', cmsController.updateCmsPageV2);
router.delete('/pages/:pageId', cmsController.deleteCmsPageV2);

router.post('/pages/:pageId/publish', cmsController.publishCmsPageV2);
router.post('/pages/:pageId/unpublish', cmsController.unpublishCmsPageV2);
router.post('/pages/:pageId/duplicate', cmsController.duplicateCmsPageV2);
router.get('/pages/:pageId/versions', cmsController.getCmsPageVersionsV2);
router.post('/pages/:pageId/restore/:versionId', cmsController.restoreCmsPageVersionV2);
router.post('/pages/:pageId/preview-token', cmsController.generatePreviewToken);

// Section V2 Endpoints
router.get('/pages/:pageId/sections', cmsController.getCmsPageSectionsV2);
router.post('/pages/:pageId/sections', cmsController.createCmsPageSectionV2);
router.patch('/pages/:pageId/sections/reorder', cmsController.reorderCmsPageSectionsV2);
router.patch('/sections/:sectionId', cmsController.updateCmsPageSectionV2);
router.post('/sections/:sectionId/duplicate', cmsController.duplicateCmsPageSectionV2);
router.delete('/sections/:sectionId', cmsController.deleteCmsPageSectionV2);

// Media Library (With Usage Protection)
router.get('/media', cmsController.getMediaLibrary);
router.post('/media', cmsController.createMediaItem);
router.post('/media/upload', upload.single('file'), cmsController.uploadMediaItem);
router.patch('/media/:id', cmsController.updateMediaItem);
router.delete('/media/:id', cmsController.deleteMediaItem);

// Navigation Manager
router.get('/navigation', cmsController.getNavigationItems);
router.post('/navigation', cmsController.createNavigationItem);
router.patch('/navigation', cmsController.updateNavigationBatch);
router.delete('/navigation/:id', cmsController.deleteNavigationItem);

// Contact Form Inbox
router.get('/contact-messages', cmsController.getContactMessages);
router.get('/contact-messages/analytics', cmsController.getContactMessageAnalytics);
router.patch('/contact-messages/:id', cmsController.updateContactMessageStatus);
router.delete('/contact-messages/:id', cmsController.deleteContactMessage);

// Announcements
router.get('/announcements', cmsController.getAnnouncements);
router.post('/announcements', cmsController.createAnnouncement);
router.patch('/announcements/:id', cmsController.updateAnnouncement);
router.post('/announcements/:id/publish', cmsController.publishAnnouncement);
router.delete('/announcements/:id', cmsController.deleteAnnouncement);

// Activity Logs
router.get('/activity', cmsController.getCmsActivityLogs);

// Themes
router.get('/themes', cmsController.getCmsThemes);
router.post('/themes/:themeId/apply', cmsController.applyCmsTheme);

// Appointments / Table Reservations
router.get('/appointments', cmsController.getCmsAppointments);
router.post('/appointments', cmsController.createCmsAppointment);
router.patch('/appointments/:id/status', cmsController.updateCmsAppointmentStatus);
router.delete('/appointments/:id', cmsController.deleteCmsAppointment);

// Menu Presentation Studio
router.get('/menu-presentation', cmsController.getCmsMenuPresentation);
router.patch('/menu-presentation', cmsController.updateCmsMenuPresentation);

module.exports = router;
