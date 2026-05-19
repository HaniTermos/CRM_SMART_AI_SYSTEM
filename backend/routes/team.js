const express = require('express');
const router = express.Router({ mergeParams: true });
const teamController = require('../controllers/teamController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.use(authenticate);

// Store members can see the team list
router.get('/', requireStoreAccess, teamController.getMembers);

// Only admins/owners can modify the team
router.post('/', requireStoreAdmin, teamController.addMember);
router.delete('/:userId', requireStoreAdmin, teamController.removeMember);

module.exports = router;
