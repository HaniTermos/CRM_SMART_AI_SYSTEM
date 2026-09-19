const express = require('express');
const router = express.Router({ mergeParams: true });
const growthController = require('../controllers/growthController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/daily-pulse', growthController.getDailyPulse);
router.patch('/recommendations/:id/view', growthController.markViewed);
router.patch('/recommendations/:id/dismiss', growthController.markDismissed);
router.post('/recommendations/:id/execute', growthController.executeAction);

router.get('/experiments', growthController.getExperiments);
router.get('/experiments/:id', growthController.getExperimentById);
router.post('/experiments/:id/complete', growthController.completeExperiment);
router.post('/experiments/:id/recalculate', growthController.recalculateExperiment);
router.get('/impact-summary', growthController.getImpactSummary);

router.get('/monthly-strategy', growthController.getMonthlyStrategy);
router.post('/monthly-strategy/refresh', growthController.refreshMonthlyStrategy);
router.get('/monthly-strategy/history', growthController.getMonthlyStrategyHistory);
router.patch('/monthly-strategy/recommendations/:id/view', growthController.markMonthlyRecViewed);
router.patch('/monthly-strategy/recommendations/:id/dismiss', growthController.markMonthlyRecDismissed);

router.get('/external-signals', growthController.getExternalSignals);
router.post('/external-signals', growthController.createExternalSignal);
router.patch('/external-signals/:id', growthController.updateExternalSignal);
router.patch('/external-signals/:id/verify', growthController.verifyExternalSignal);
router.patch('/external-signals/:id/reject', growthController.rejectExternalSignal);
router.delete('/external-signals/:id', growthController.deleteExternalSignal);

module.exports = router;
