const express = require('express');
const router = express.Router();
const microController = require('../controllers/MicroStructure');
const MicroStructure = require('../models/MicroStructure');
const { resolveAndAuthorize } = require('../middleware/editWindow');

router.get('/current-date', microController.getCurrentDate);
router.get('/last-disa', microController.getLastDisa);
router.get('/check', microController.checkDateDisaEntries);
router.get('/grouped', microController.getGroupedByDate);
router.get('/by-date', microController.getEntriesByDate);
router.get('/filter', microController.filterEntries);

router.post('/save-primary', microController.savePrimary);
router.post('/', microController.createEntry);

router.route('/:id')
    .put(resolveAndAuthorize(MicroStructure, { mode: 'nested', action: 'edit' }), microController.updateEntry)
    .delete(resolveAndAuthorize(MicroStructure, { mode: 'nested', action: 'delete' }), microController.deleteEntry);

module.exports = router;