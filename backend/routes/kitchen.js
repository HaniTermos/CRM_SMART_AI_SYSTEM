const express = require('express');
const router = express.Router({ mergeParams: true });
const kitchenController = require('../controllers/kitchenController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate, requireStoreAccess);

router.get('/', kitchenController.getTickets);
router.post('/', kitchenController.createTicket);
router.put('/:id/status', kitchenController.updateStatus);
router.delete('/:id', kitchenController.deleteTicket);

module.exports = router;