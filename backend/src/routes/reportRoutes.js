const express = require('express');
const { createReport, getMyReports, lookupTicket, getMyTickets, getMyTicketById } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public route for chatbot lookup
router.get('/lookup/:ticketId', lookupTicket);

router.use(protect);

router.route('/')
    .post(upload.single('image'), createReport);

router.route('/all-my-tickets')
    .get(getMyTickets);

router.route('/me')
    .get(getMyReports);

router.route('/ticket/:ticketId')
    .get(getMyTicketById);

module.exports = router;
