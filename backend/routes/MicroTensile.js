const express = require('express');
const router = express.Router();
const microTensileController = require('../controllers/MicroTensile');
const MicroTensile = require('../models/MicroTensile');
const { resolveAndAuthorize } = require('../middleware/editWindow');
router.get('/current-date', microTensileController.getCurrentDate);
router.get('/check', microTensileController.checkDateDisaEntries);
router.get('/grouped', microTensileController.getGroupedByDate);
router.get('/by-date', microTensileController.getEntriesByDate);
router.get('/filter', microTensileController.filterEntries);

router.route('/')
    .get(microTensileController.getAllEntries)
    .post(microTensileController.createEntry);

router.post('/save-primary', microTensileController.savePrimary);

router.route('/:id')
    .put(resolveAndAuthorize(MicroTensile, { mode: 'nested', action: 'edit' }), microTensileController.updateEntry)
    .delete(resolveAndAuthorize(MicroTensile, { mode: 'nested', action: 'delete' }), microTensileController.deleteEntry);

module.exports = router;