const express = require('express');
const router = express.Router();
const qcController = require('../controllers/QcProduction');
const QcProduction = require('../models/QcProduction');
const { resolveAndAuthorize } = require('../middleware/editWindow');

router.route('/')
    .get(qcController.getAllEntries)
    .post(qcController.createEntry);

// GET /part-names - Get unique part names for autocomplete
router.get('/part-names', qcController.getPartNames);

// QcProduction is a flat model: each document IS an entry (mode: 'flat')
router.route('/:id')
    .put(resolveAndAuthorize(QcProduction, { mode: 'flat', action: 'edit' }), qcController.updateEntry)
    .delete(resolveAndAuthorize(QcProduction, { mode: 'flat', action: 'delete' }), qcController.deleteEntry);

module.exports = router;