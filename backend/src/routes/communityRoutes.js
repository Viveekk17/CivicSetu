const express = require('express');
const {
    getCommunities,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    deleteCommunity
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getCommunities)
    .post(createCommunity);

router.route('/:id/join').put(joinCommunity);
router.route('/:id/leave').put(leaveCommunity);
router.route('/:id').delete(deleteCommunity);

module.exports = router;
