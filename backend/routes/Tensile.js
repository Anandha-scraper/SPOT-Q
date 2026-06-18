const express = require('express');
const router = express.Router();
const {
    createEntry,
    getEntriesByDate,
    getGroupedByDate,
    getCurrentDate,
    getValidationSchema,
    filterEntries,
    getAllEntries,
    updateEntry,
    deleteEntry
} = require('../controllers/Tensile');
const Tensile = require('../models/Tensile');
const { resolveAndAuthorize } = require('../middleware/editWindow');
router.get('/current-date', getCurrentDate);
router.get('/validation-schema', getValidationSchema);
router.get('/grouped', getGroupedByDate);
router.get('/by-date', getEntriesByDate);
router.get('/filter', filterEntries);
router.get('/', getAllEntries);
router.post('/', createEntry);
router.route('/:id')
    .put(resolveAndAuthorize(Tensile, { mode: 'nested', action: 'edit' }), updateEntry)
    .delete(resolveAndAuthorize(Tensile, { mode: 'nested', action: 'delete' }), deleteEntry);

module.exports = router;