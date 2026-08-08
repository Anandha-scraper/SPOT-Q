const express = require('express');
const router = express.Router();
const {
    getPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary
} = require('../controllers/Melting-CupolaHolderLog');

// protect/checkDepartmentAccess('Melting') apply at the server.js mount site; no /:id route — Cupola has no edit/delete path.

router.get('/filter', filterByDateRange);
router.get('/primary/:date', getPrimaryByDate);
router.post('/primary', createOrUpdatePrimary);
router.post('/table-update', createTableEntry);

module.exports = router;
