const express = require('express');
const router = express.Router();
const {
    getPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary,
    updateEntry,
    deleteEntry
} = require('../controllers/Melting-MeltingLogsheet');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/meltingLogService');

// `protect` and checkDepartmentAccess('Melting') are applied at the mount site
// in server.js, not here.

router.get('/filter', filterByDateRange);
router.get('/primary/:date', getPrimaryByDate);
router.post('/primary', createOrUpdatePrimary);
router.post('/table-update', createTableEntry);

router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
