const express = require('express');
const router = express.Router();
const { getAllEntries, createEntry, updateEntry, deleteEntry } = require('../controllers/SandLab-FoundrySandTestingNote');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/sandNoteService');

// protect/checkDepartmentAccess('Sand Lab') apply at the server.js mount site. GET /date/:date is dropped (zero frontend callers); only GET /?startDate=&endDate= is used.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

// Declared after the static '/' path so it isn't affected by ':id' matching.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
