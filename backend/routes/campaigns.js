const express = require('express');
const router = express.Router({ mergeParams: true });
const campaignController = require('../controllers/campaignController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate);
router.use(requireStoreAccess);

router.get('/smtp-status', campaignController.getSmtpStatus);
router.post('/test-smtp', campaignController.testSmtp);
router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.patch('/:campaignId', campaignController.updateCampaign);
router.post('/:campaignId/send', campaignController.sendCampaign);

module.exports = router;