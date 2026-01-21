const express = require('express');
const router = express.Router();
const {
    getAllEntries,
    getEntriesByDate,
    createTableEntry,
    updateEntry,
    deleteEntry,
    getStats
} = require('../controllers/SandLab-SandTestingRecord');

router.get('/stats', getStats);
router.get('/date/:date', getEntriesByDate);
router.post('/table:tableNum', createTableEntry);
router.post('/table-update', createTableEntry);
router.route('/')
    .get(getAllEntries);
router.route('/:id')
    .put(updateEntry)
    .delete(deleteEntry);

module.exports = router;