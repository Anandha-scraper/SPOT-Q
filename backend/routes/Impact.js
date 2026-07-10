const express = require('express');
const router = express.Router();
const Impact = require('../models/Impact');
const { resolveAndAuthorize } = require('../middleware/editWindow');
const {
    createEntry,
    getEntriesByDate,
    getGroupedByDate,
    getCurrentDate,
    getValidationSchema,
    filterEntries,
    updateEntry,
    deleteEntry
} = require('../controllers/Impact');

router.get('/current-date', getCurrentDate);
router.get('/validation-schema', getValidationSchema);
router.get('/grouped', getGroupedByDate);
router.get('/by-date', getEntriesByDate);
router.get('/filter', filterEntries);
router.post('/', createEntry);

router.route('/:id')
    .put(resolveAndAuthorize(Impact, { mode: 'nested', action: 'edit' }), updateEntry)
    .delete(resolveAndAuthorize(Impact, { mode: 'nested', action: 'delete' }), deleteEntry);

module.exports = router;
