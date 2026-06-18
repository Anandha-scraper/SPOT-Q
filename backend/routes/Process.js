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
const Process = require('../models/Process');
const { resolveAndAuthorize } = require('../middleware/editWindow');

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/check')
    .get(checkDateDisaEntries);

router.route('/save-primary')
    .post(savePrimary);

router.route('/part-names')
    .get(getPartNames);

router.route('/:id')
    .put(resolveAndAuthorize(Process, { mode: 'nested', action: 'edit' }), updateEntry)
    .delete(resolveAndAuthorize(Process, { mode: 'nested', action: 'delete' }), deleteEntry);

module.exports = router;