const express = require('express');
const router = express.Router();
const {
    createDismaticReport,
    getDismaticReportsByDateRange,
    getDismaticReportByDate,
    updateDismaticReport,
    deleteDismaticReport
} = require('../controllers/Moulding-DismaticProductReportDISA');

router.get('/by-date', getDismaticReportByDate);
router.get('/range', getDismaticReportsByDateRange);
router.post('/', createDismaticReport);
router.route('/:id')
    .put(updateDismaticReport)
    .delete(deleteDismaticReport);

module.exports = router;
