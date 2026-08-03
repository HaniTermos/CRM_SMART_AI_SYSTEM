const express = require('express');
const router = express.Router({ mergeParams: true });
const crmController = require('../controllers/crmController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate);
router.use(requireStoreAccess);
router.get('/pipelines', crmController.getPipelines);
router.post('/pipelines', crmController.createPipeline);
router.get('/pipelines/:pipelineId/stages', crmController.getStages);
router.post('/pipelines/:pipelineId/stages', crmController.createStage);
router.get('/deals', crmController.getDeals);
router.post('/deals', crmController.createDeal);
router.patch('/deals/:dealId', crmController.updateDeal);
router.get('/deals/:dealId/notes', crmController.getDealNotes);
router.post('/deals/:dealId/notes', crmController.createDealNote);

module.exports = router;