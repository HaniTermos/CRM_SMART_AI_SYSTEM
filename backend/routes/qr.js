const express = require('express');
const router = express.Router({ mergeParams: true });
const qrController = require('../controllers/qrController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate, requireStoreAccess);

router.get('/', qrController.getQrCodes);
router.get('/:id', qrController.getQrCodeById);
router.post('/generate', qrController.generateQr);
router.delete('/:id', qrController.deleteQrCode);

module.exports = router;
