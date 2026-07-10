const express = require('express');
const router = express.Router();
const meltingController = require('../controllers/Melting-MeltingLogsheet');
const MeltingLogsheet = require('../models/Melting-MeltingLogsheet');
const { resolveAndAuthorize } = require('../middleware/editWindow');

router.get('/filter', meltingController.filterByDateRange);
router.get('/primary/:date', meltingController.getPrimaryByDate);
router.post('/primary', meltingController.createOrUpdatePrimary);
router.post('/table-update', meltingController.createTableEntry);

router.route('/:id')
    .put(resolveAndAuthorize(MeltingLogsheet, { mode: 'deepNested', action: 'edit' }), meltingController.updateEntry)
    .delete(resolveAndAuthorize(MeltingLogsheet, { mode: 'deepNested', action: 'delete' }), meltingController.deleteEntry);

module.exports = router;