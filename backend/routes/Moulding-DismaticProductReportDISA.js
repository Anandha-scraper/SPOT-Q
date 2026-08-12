const express = require('express');
const router = express.Router();
const {
    createDismaticReport,
    getDismaticReportsByDateRange,
    getDismaticReportByDate,
    getPrimaryDataByDateShift,
    savePrimaryData,
    repairShiftSplit
} = require('../controllers/Moulding-DismaticProductReportDISA');
const { checkAdminAccess } = require('../middleware/access');

// protect/checkDepartmentAccess('Moulding') apply at the server.js mount site; no /:id route, matching the original module.

router.get('/by-date', getDismaticReportByDate);
router.get('/range', getDismaticReportsByDateRange);
router.get('/primary', getPrimaryDataByDateShift);
router.post('/', createDismaticReport);
router.post('/primary', savePrimaryData);

// One-off repair, admin-only regardless of department (checkAdminAccess, not
// checkDepartmentAccess) — was previously a CLI-only script; see backend.md.
router.post('/admin/repair-shift-split', checkAdminAccess, repairShiftSplit);

module.exports = router;
