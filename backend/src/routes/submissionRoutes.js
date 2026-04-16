const express = require('express');
const router = express.Router();
const {
  analyzePhotos,
  createSubmission,
  checkDuplicate,
  getSubmissions,
  getSubmission,
  deleteSubmission,
  uploadReverification
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

// Routes
router.post('/check-duplicate', checkDuplicate);
router.post('/analyze', upload.array('photos', 5), analyzePhotos);
router.post('/', upload.array('photos', 5), createSubmission);
router.get('/', getSubmissions);
router.get('/:id', getSubmission);
router.delete('/:id', deleteSubmission);
router.post('/:id/re-verify', upload.single('photo'), uploadReverification);

module.exports = router;
