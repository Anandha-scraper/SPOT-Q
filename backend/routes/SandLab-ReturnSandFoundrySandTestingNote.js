const express = require('express');
const router = express.Router();
const { getAllEntries, createEntry, updateEntry, deleteEntry } = require('../controllers/SandLab-ReturnSandFoundrySandTestingNote');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/returnSandNoteService');

// protect/checkDepartmentAccess('Sand Lab') apply at the server.js mount site.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

// Declared after the static '/' path so it isn't affected by ':id' matching.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
