const express = require('express');
const router = express.Router();
const cupolaController = require('../controllers/Melting-CupolaHolderLog');

router.get('/primary/:date/:shift/:holderNumber', cupolaController.getPrimaryByDate);
router.route('/')
    .get(cupolaController.getAllEntries)
    .post(cupolaController.createEntry); 
router.route('/:id')
    .put(cupolaController.updateEntry)
    .delete(cupolaController.deleteEntry);

module.exports = router;