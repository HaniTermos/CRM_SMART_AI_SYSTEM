const express = require('express');
const router = express.Router();
const userPreferenceController = require('../controllers/userPreferenceController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', userPreferenceController.getPreferences);
router.patch('/', userPreferenceController.updatePreferences);

module.exports = router;
