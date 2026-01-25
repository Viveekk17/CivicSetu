const express = require('express');
const router = express.Router();
const {
  analyzePhotos,
  createSubmission,
  getSubmissions,
  getSubmission,
  deleteSubmission
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

// Routes
router.post('/analyze', upload.array('photos', 5), analyzePhotos);
router.post('/', upload.array('photos', 5), createSubmission);
router.get('/', getSubmissions);
router.get('/:id', getSubmission);
router.delete('/:id', deleteSubmission);

module.exports = router;
