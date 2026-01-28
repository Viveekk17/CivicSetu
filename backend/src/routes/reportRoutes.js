const express = require('express');
const { createReport, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(upload.single('image'), createReport);

router.route('/me')
    .get(getMyReports);

module.exports = router;
