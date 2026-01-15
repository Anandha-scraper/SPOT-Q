const express = require('express');
const router = express.Router();
const { 
    getAllEntries, 
    createEntry, 
    updateEntry, 
    deleteEntry 
} = require('../controllers/Process');

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

router.route('/:id')
    .put(updateEntry)
    .delete(deleteEntry);

module.exports = router;