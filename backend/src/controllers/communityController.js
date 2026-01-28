const Community = require('../models/Community');
const User = require('../models/User');

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all communities (Leaderboard)
// @route   GET /api/communities
// @access  Private
exports.getCommunities = asyncHandler(async (req, res) => {
    // Fetch communities and populate creator
    // For dynamic leaderboard, we might want to sort by stats
    let communities = await Community.find()
        .populate('creator', 'name')
        .populate('members', 'name impact') // Populate members to calculate impact if needed
        .sort({ 'stats.totalPollutionSaved': -1 });

    // Optional: Recalculate stats on the fly if not using cached stats
    // This is expensive for large data but fine for prototype
    const populatedCommunities = communities.map(community => {
        const totalPollution = community.members.reduce((acc, member) => {
            // Handle if member or member.impact is missing/null
            return acc + (member.impact?.pollutionSaved || 0);
        }, 0);

        const totalTrees = community.members.reduce((acc, member) => {
            return acc + (member.impact?.treesPlanted || 0);
        }, 0);

        // Update the object (not saving to DB here to avoid write load on every read, 
        // unless we want to sync)
        // Ideally we update these stats when a user makes a submission or joins.
        // For now, let's just return the calculated values.

        return {
            ...community.toObject(),
            totalPollutionSaved: totalPollution,
            totalTreesPlanted: totalTrees
        };
    });

    // Sort again by calculated pollution
    populatedCommunities.sort((a, b) => b.totalPollutionSaved - a.totalPollutionSaved);

    res.json({
        success: true,
        count: populatedCommunities.length,
        data: populatedCommunities
    });
});

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = asyncHandler(async (req, res) => {
    const { name, description, members } = req.body;

    // Check if initial members passed (IDs)
    // Creator is always added
    let initialMembers = [req.user.id];

    if (members && Array.isArray(members)) {
        // Filter valid IDs and combine
        initialMembers = [...new Set([...initialMembers, ...members])];
    }

    const community = await Community.create({
        name,
        description,
        creator: req.user.id,
        members: initialMembers
    });

    res.status(201).json({
        success: true,
        data: community
    });
});

// @desc    Join community
// @route   PUT /api/communities/:id/join
// @access  Private
exports.joinCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);

    if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check if already member
    if (community.members.includes(req.user.id)) {
        return res.status(400).json({ success: false, message: 'User already a member' });
    }

    community.members.push(req.user.id);
    await community.save();

    res.json({
        success: true,
        data: community
    });
});

// @desc    Leave community
// @route   PUT /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);

    if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Creator cannot leave (delete instead)
    if (community.creator.toString() === req.user.id) {
        return res.status(400).json({ success: false, message: 'Creator cannot leave the community. Delete it instead.' });
    }

    community.members = community.members.filter(m => m.toString() !== req.user.id);
    await community.save();

    res.json({
        success: true,
        data: community
    });
});

// @desc    Delete community
// @route   DELETE /api/communities/:id
// @access  Private
exports.deleteCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);

    if (!community) {
        return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check ownership
    if (community.creator.toString() !== req.user.id) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this community' });
    }

    await community.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});
