const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    filterEntries,
    createEntry,
    updateEntry,
    deleteEntry
} = require('../controllers/Impact');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/impactService');

// `protect` and checkDepartmentAccess('Impact') are applied at the mount site
// in server.js, not here.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/filter')
    .get(filterEntries);

// Declared after the static paths so '/filter' isn't swallowed by ':id'.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
