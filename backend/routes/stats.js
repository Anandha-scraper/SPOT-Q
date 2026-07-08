const express = require('express');
const router = express.Router();
const { getEntryStats, getAdminEntryStats } = require('../controllers/stats');
const { checkAdminAccess } = require('../middleware/access');

// Mounted at /api/v1/entry-stats behind `protect` (see server.js).
router.get('/', getEntryStats);                       // per-user (current dept)
router.get('/admin', checkAdminAccess, getAdminEntryStats); // all departments

module.exports = router;
