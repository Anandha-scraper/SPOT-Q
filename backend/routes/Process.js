const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    createEntry,
    checkDateDisaEntries,
    savePrimary,
    getPartNames,
    updateEntry,
    deleteEntry
} = require('../controllers/Process');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/processService');

// `protect` and checkDepartmentAccess('Process') are applied at the mount site
// in server.js, not here.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/check')
    .get(checkDateDisaEntries);

router.route('/save-primary')
    .post(savePrimary);

router.route('/part-names')
    .get(getPartNames);

// Declared after the static paths so '/check', '/save-primary' and
// '/part-names' aren't swallowed by ':id'.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
