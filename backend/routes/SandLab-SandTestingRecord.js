const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    getEntriesByDate,
    createTableEntry,
    getStats
} = require('../controllers/SandLab-SandTestingRecord');

// `protect` and checkDepartmentAccess('Sand Lab') are applied at the mount
// site in server.js, not here. No /:id route — matches the original module.

router.get('/stats', getStats);
router.get('/date/:date', getEntriesByDate);
router.post('/table/:tableNum', createTableEntry);
router.post('/table-update', createTableEntry);
router.route('/')
    .get(getAllEntries);

module.exports = router;
