const express = require('express');
const router = express.Router();
const meltingController = require('../controllers/Melting-MeltingLogsheet');

router.get('/filter', meltingController.filterByDateRange);
router.get('/primary/:date', meltingController.getPrimaryByDate);
router.post('/primary', meltingController.createOrUpdatePrimary);
router.post('/table-update', meltingController.createTableEntry);
router.route('/:id')
    .put(meltingController.updateEntry)
    .delete(meltingController.deleteEntry);

module.exports = router;