const express = require('express');
const router = express.Router();
const {
    getPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary
} = require('../controllers/Melting-CupolaHolderLog');

// `protect` and checkDepartmentAccess('Melting') are applied at the mount site
// in server.js, not here. No /:id route — Cupola has no edit/delete path,
// matching the original Mongoose module exactly.

router.get('/filter', filterByDateRange);
router.get('/primary/:date', getPrimaryByDate);
router.post('/primary', createOrUpdatePrimary);
router.post('/table-update', createTableEntry);

module.exports = router;
