const Post = require('../models/Post');
const Submission = require('../models/Submission');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res) => {
    const { submissionId, description, selectedPhotos, tags } = req.body;

    if (!submissionId || !description) {
        return res.status(400).json({ success: false, message: 'Submission ID and description are required' });
    }

    // Check if submission exists and belongs to user
    const submission = await Submission.findOne({
        _id: submissionId,
        user: req.user.id
    });
    if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check if post already exists for this submission
    const existingPost = await Post.findOne({ submission: submissionId });
    if (existingPost) {
        return res.status(400).json({ success: false, message: 'Post already exists for this submission' });
    }

    const post = await Post.create({
        user: req.user.id,
        submission: submissionId,
        description,
        selectedPhotos: selectedPhotos || ['before', 'after'],
        tags: tags || [] // Save tags
    });

    const populatedPost = await Post.findById(post._id)
        .populate('user', 'name profilePicture')
        .populate({
            path: 'submission',
            select: 'photos location type wasteType weight weightKg perPersonCreditsAwarded creditsAwarded verificationDetails createdAt'
        })
        .populate('tags', 'name')
        .populate('comments.user', 'name profilePicture');

    res.status(201).json({
        success: true,
        data: populatedPost
    });
});

// @desc    Get all posts (public feed)
// @route   GET /api/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
        .populate('user', 'name profilePicture')
        .populate({
            path: 'submission',
            select: 'photos location type wasteType weight weightKg perPersonCreditsAwarded creditsAwarded verificationDetails createdAt'
        })
        .populate('tags', 'name')
        .populate('comments.user', 'name profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Post.countDocuments();

    res.json({
        success: true,
        data: posts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Get posts by specific user
// @route   GET /api/posts/user/:userId
// @access  Public
exports.getUserPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
        .populate('user', 'name profilePicture')
        .populate({
            path: 'submission',
            select: 'photos location type wasteType weight weightKg perPersonCreditsAwarded creditsAwarded verificationDetails createdAt'
        })
        .populate('tags', 'name')
        .populate('comments.user', 'name profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Post.countDocuments({ user: req.params.userId });

    res.json({
        success: true,
        data: posts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Toggle like on post
// @route   POST /api/posts/:id/like
// @access  Private
exports.toggleLike = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
        // Unlike: remove user from likes
        post.likes.splice(likeIndex, 1);
    } else {
        // Like: add user to likes
        post.likes.push(userId);
    }

    await post.save();

    res.json({
        success: true,
        data: {
            likes: post.likes,
            likesCount: post.likes.length,
            isLiked: likeIndex === -1
        }
    });
});

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.addComment = asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = {
        user: req.user._id,
        text: text.trim(),
        createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment's user info
    const updatedPost = await Post.findById(post._id)
        .populate('comments.user', 'name profilePicture');

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    res.status(201).json({
        success: true,
        data: newComment
    });
});

// @desc    Delete comment from post
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
exports.deleteComment = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user owns the comment or is the post owner
    if (comment.user.toString() !== req.user._id.toString() &&
        post.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    comment.remove();
    await post.save();

    res.json({
        success: true,
        message: 'Comment deleted successfully'
    });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Admin or Owner)
exports.deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user is owner or admin
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this post'
        });
    }

    await post.deleteOne(); // Use deleteOne() for Mongoose v6+

    res.json({
        success: true,
        message: 'Post removed'
    });
});
