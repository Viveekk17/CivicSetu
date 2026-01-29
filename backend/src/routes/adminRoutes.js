const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
    getStats,
    getSubmissions,
    updateSubmissionStatus,
    getReports,
    updateReportStatus,
    getUsers,
    getTransactions,
    getAnalytics,
    getCommunityDetails,
    updateUserCredits,
    getCommunities,
    getUserDetails,
    updateSubmissionCredits,
    deleteSubmission,
    deleteUser,
    getDashboardAnalytics
} = require('../controllers/adminController');

// All routes are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/stats', getStats);
router.get('/submissions', getSubmissions);
router.put('/submissions/:id', updateSubmissionStatus);
router.patch('/submissions/:id/credits', updateSubmissionCredits);
router.delete('/submissions/:id', deleteSubmission);
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/credits', updateUserCredits);
router.delete('/users/:id', deleteUser);
router.get('/communities', getCommunities);
router.get('/communities/:id', getCommunityDetails);
router.get('/transactions', getTransactions);
router.get('/analytics', getAnalytics);
router.get('/dashboard-analytics', getDashboardAnalytics);

module.exports = router;
