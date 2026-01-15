const express = require('express');
const router = express.Router();
const { 
    createEntry, 
    getEntriesByDate, 
    getGroupedByDate, 
    updateEntry, 
    deleteEntry, 
    getCurrentDate, 
    getValidationSchema, 
    filterEntries 
} = require('../controllers/Tensile');
router.get('/current-date', getCurrentDate);
router.get('/validation-schema', getValidationSchema);
router.get('/grouped', getGroupedByDate); 
router.get('/by-date', getEntriesByDate); 
router.get('/filter', filterEntries);     
router.post('/', createEntry);
router.route('/:id')
    .put(updateEntry)  
    .delete(deleteEntry); 

module.exports = router;