const express = require('express');
const router = express.Router();
const microController = require('../controllers/MicroStructure');

router.get('/current-date', microController.getCurrentDate);
router.get('/grouped', microController.getGroupedByDate);
router.get('/by-date', microController.getEntriesByDate);
router.get('/filter', microController.filterEntries);

router.post('/', microController.createEntry);
router.route('/:id')
    .put(microController.updateEntry)
    .delete(microController.deleteEntry);

module.exports = router;