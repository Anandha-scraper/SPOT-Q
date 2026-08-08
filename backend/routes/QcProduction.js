const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    getPartNames,
    createEntry,
    updateEntry,
    deleteEntry
} = require('../controllers/QcProduction');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/qcProductionService');

// `protect` and checkDepartmentAccess('QC - production') are applied at the
// mount site in server.js, not here.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/part-names')
    .get(getPartNames);

// Flat department: the row IS the entry, so authorizeEntry resolves it directly.
// Declared after '/part-names' so that path isn't swallowed by ':id'.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
