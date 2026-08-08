const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    getEntriesByDate,
    createTableEntry,
    getStats,
    savePrimary,
    updateEntry,
    deleteEntry
} = require('../controllers/SandLab-SandTestingRecord');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/sandRecordService');

// `protect` and checkDepartmentAccess('Sand Lab') are applied at the mount
// site in server.js, not here.

router.get('/stats', getStats);
router.get('/date/:date', getEntriesByDate);
router.post('/primary', savePrimary);
router.post('/table/:tableNum', createTableEntry);
router.post('/table-update', createTableEntry);
router.route('/')
    .get(getAllEntries);

// :id = SandRecordDay.id (the whole-record unit for report-page inline edit
// and admin delete). Declared after the static paths above so it can't
// swallow them.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
