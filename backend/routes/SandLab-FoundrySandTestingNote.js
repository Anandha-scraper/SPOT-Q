const express = require('express');
const router = express.Router();
const { 
    getAllEntries, 
    getEntriesByDate,
    createEntry, 
    updateEntry, 
    deleteEntry 
} = require('../controllers/SandLab-FoundrySandTestingNote');

router.get('/date/:date', getEntriesByDate);
router.route('/')
    .get(getAllEntries)
    .post(createEntry);
router.route('/:id')
    .put(updateEntry)
    .delete(deleteEntry);

module.exports = router;