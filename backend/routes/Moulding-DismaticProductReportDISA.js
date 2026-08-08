const express = require('express');
const router = express.Router();
const {
    createDismaticReport,
    getDismaticReportsByDateRange,
    getDismaticReportByDate,
    getPrimaryDataByDateShift,
    savePrimaryData
} = require('../controllers/Moulding-DismaticProductReportDISA');

// protect/checkDepartmentAccess('Moulding') apply at the server.js mount site; no /:id route, matching the original module.

router.get('/by-date', getDismaticReportByDate);
router.get('/range', getDismaticReportsByDateRange);
router.get('/primary', getPrimaryDataByDateShift);
router.post('/', createDismaticReport);
router.post('/primary', savePrimaryData);

module.exports = router;
