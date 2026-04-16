const express = require('express');
const router = express.Router();
const { getEstimate, getZoneCriticality } = require('../controllers/creditController');

router.get('/estimate', getEstimate);
router.get('/criticality', getZoneCriticality);

module.exports = router;
