const express = require('express');
const router = express.Router();
const { getMyDownloadLogs, getAllDownloadLogs, recordDownload } = require('../controllers/DownloadLog');
const { checkAdminAccess } = require('../middleware/access');

// Mounted at /api/v1/download-logs behind `protect` (see server.js).
router.get('/all', checkAdminAccess, getAllDownloadLogs); // admin: every department
router.get('/', getMyDownloadLogs);                       // current user's logs
router.post('/', recordDownload);                         // record a download

module.exports = router;
