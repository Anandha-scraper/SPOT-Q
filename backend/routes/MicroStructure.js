const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    filterEntries,
    getLastDisa,
    checkDateDisaEntries,
    savePrimary,
    createEntry,
    updateEntry,
    deleteEntry
} = require('../controllers/MicroStructure');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/microStructureService');

// `protect` and checkDepartmentAccess('Micro Structure') are applied at the
// mount site in server.js, not here.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/filter')
    .get(filterEntries);

router.route('/last-disa')
    .get(getLastDisa);

router.route('/check')
    .get(checkDateDisaEntries);

router.route('/save-primary')
    .post(savePrimary);

// Declared after the static paths so they aren't swallowed by ':id'.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
