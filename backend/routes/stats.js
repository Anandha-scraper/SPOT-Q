const express = require('express');
const router = express.Router();
const { getEntryStats } = require('../controllers/stats');

// Mounted at /api/v1/entry-stats behind `protect` (see server.js).
router.get('/', getEntryStats);

module.exports = router;
