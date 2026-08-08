const express = require('express');
const router = express.Router();
const { getEntryStats, getAdminEntryStats } = require('../controllers/stats');
const { checkAdminAccess } = require('../middleware/access');
router.get('/', getEntryStats);
router.get('/admin', checkAdminAccess, getAdminEntryStats);

module.exports = router;
