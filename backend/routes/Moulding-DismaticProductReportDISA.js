const express = require('express');
const router = express.Router();
const {
    createDismaticReport,
    getDismaticReportsByDateRange,
    getDismaticReportByDate,
    getPrimaryDataByDateShift,
    savePrimaryData,
    repairShiftSplit,
    updateReport,
    deleteReport,
    getComponentNames,
    getPatternTempItems
} = require('../controllers/Moulding-DismaticProductReportDISA');
const { checkAdminAccess } = require('../middleware/access');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadReportForAuth } = require('../services/disaReportService');

// protect/checkDepartmentAccess('Moulding') apply at the server.js mount site.

router.get('/by-date', getDismaticReportByDate);
router.get('/range', getDismaticReportsByDateRange);
router.get('/primary', getPrimaryDataByDateShift);
router.get('/component-names/:table', getComponentNames);
router.get('/pattern-temp-items', getPatternTempItems);
router.post('/', createDismaticReport);
router.post('/primary', savePrimaryData);

// One-off repair, admin-only regardless of department (checkAdminAccess, not
// checkDepartmentAccess) — was previously a CLI-only script; see backend.md.
router.post('/admin/repair-shift-split', checkAdminAccess, repairShiftSplit);

// Whole-report edit/delete — one entry (the report page's Edit/Save/Delete)
// addresses every section at once. Mirrors SandLab-SandTestingRecord.js's
// /:id shape. Must stay after the /by-date, /range, /primary GET routes above
// so :id doesn't shadow them.
router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadReportForAuth, action: 'edit' }), updateReport)
    .delete(authorizeEntry({ loadEntry: loadReportForAuth, action: 'delete' }), deleteReport);

module.exports = router;
