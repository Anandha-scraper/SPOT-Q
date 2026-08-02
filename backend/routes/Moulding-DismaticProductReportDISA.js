const express = require('express');
const router = express.Router();
const {
    createDismaticReport,
    getDismaticReportsByDateRange,
    getDismaticReportByDate,
    getPrimaryDataByDateShift,
    savePrimaryData
} = require('../controllers/Moulding-DismaticProductReportDISA');

// `protect` and checkDepartmentAccess('Moulding') are applied at the mount
// site in server.js, not here. No /:id route — matches the original module,
// which never had one.

router.get('/by-date', getDismaticReportByDate);
router.get('/range', getDismaticReportsByDateRange);
router.get('/primary', getPrimaryDataByDateShift);
router.post('/', createDismaticReport);
router.post('/primary', savePrimaryData);

module.exports = router;
