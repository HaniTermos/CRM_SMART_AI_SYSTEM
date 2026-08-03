const express = require('express');
const router = express.Router({ mergeParams: true });
const teamController = require('../controllers/teamController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', requireStoreAccess, teamController.getMembers);
router.post('/', requireStoreAdmin, teamController.addMember);
router.delete('/:userId', requireStoreAdmin, teamController.removeMember);

module.exports = router;
