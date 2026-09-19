const express = require('express');
const router = express.Router({ mergeParams: true });
const floorController = require('../controllers/floorController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate, requireStoreAccess);

router.get('/', floorController.getFloors);
router.post('/', floorController.createFloor);
router.get('/:id', floorController.getFloor);
router.put('/:id', floorController.updateFloor);
router.delete('/:id', floorController.deleteFloor);

router.post('/:floorId/layouts', floorController.createLayout);
router.put('/:floorId/layouts/:layoutId', floorController.updateLayout);
router.delete('/:floorId/layouts/:layoutId', floorController.deleteLayout);
router.post('/:floorId/layouts/:layoutId/save', floorController.saveLayout);

router.post('/:floorId/layouts/:layoutId/elements', floorController.createElement);
router.put('/:floorId/layouts/:layoutId/elements/:elementId', floorController.updateElement);
router.delete('/:floorId/layouts/:layoutId/elements/:elementId', floorController.deleteElement);

module.exports = router;