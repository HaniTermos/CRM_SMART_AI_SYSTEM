const express = require('express');
const router = express.Router({ mergeParams: true });
const reservationController = require('../controllers/reservationController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate, requireStoreAccess);

router.get('/', reservationController.getReservations);
router.post('/', reservationController.createReservation);
router.get('/:id', reservationController.getReservation);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;