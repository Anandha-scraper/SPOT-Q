const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    filterEntries,
    checkDateDisaEntries,
    savePrimary,
    createEntry,
    updateEntry,
    deleteEntry,
    getItemNames
} = require('../controllers/MicroTensile');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/microTensileService');

// `protect` and checkDepartmentAccess('Micro Tensile') are applied at the mount
// site in server.js, not here.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/filter')
    .get(filterEntries);

router.route('/item-names')
    .get(getItemNames);

router.route('/check')
    .get(checkDateDisaEntries);

router.route('/save-primary')
    .post(savePrimary);

// Declared after the static paths so they aren't swallowed by ':id'.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
