const disaReportService = require('../services/disaReportService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getDismaticReportByDate = asyncHandler(async (req, res) => {
    const { date } = req.query;
    const reports = await disaReportService.getReportsForDate(date);

    res.status(200).json({ success: true, data: reports, count: reports.length });
});

exports.getDismaticReportsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await disaReportService.getReportsInRange(startDate, endDate);

    res.status(200).json({ success: true, count: data.length, data });
});

// Each section is its own function now, not a switch on req.body.section — 'basicInfo'/'all'/'eventSection' were dead branches (no frontend caller) and aren't reproduced.
exports.createDismaticReport = asyncHandler(async (req, res) => {
    const { date, shift, section, ...payload } = req.body ?? {};

    let result;
    switch (section) {
        case 'production':
            result = await disaReportService.saveProduction(date, shift, payload.productionTable, req.user.id);
            break;
        case 'nextShiftPlan':
            result = await disaReportService.saveNextShiftPlan(date, shift, payload.nextShiftPlanTable, req.user.id);
            break;
        case 'delays':
            result = await disaReportService.saveDelays(date, shift, payload.delaysTable, req.user.id);
            break;
        case 'mouldHardness':
            result = await disaReportService.saveMouldHardness(date, shift, payload.mouldHardnessTable, req.user.id);
            break;
        case 'patternTemp':
            result = await disaReportService.savePatternTemp(date, shift, payload.patternTempTable, req.user.id);
            break;
        case 'events':
            result = await disaReportService.saveEvents(date, shift, payload);
            break;
        default:
            result = { message: `${section} updated.` };
    }

    res.status(200).json({ success: true, message: result.message });
});

// Whole-report edit/delete (report page's single Edit/Save/Delete, not
// per-row) — authorizeEntry (middleware) already resolved req.targetEntry via
// loadReportForAuth in the route.
exports.updateReport = asyncHandler(async (req, res) => {
    const data = await disaReportService.updateReportEntries(req.targetEntry.id, req.body);
    res.status(200).json({ success: true, data, message: 'Entry updated successfully.' });
});

exports.deleteReport = asyncHandler(async (req, res) => {
    await disaReportService.deleteReport(req.targetEntry.id);
    res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
});

exports.getPrimaryDataByDateShift = asyncHandler(async (req, res) => {
    const { date, shift } = req.query;
    const data = await disaReportService.getPrimaryByDateShift(date, shift);

    if (!data) {
        return res.status(200).json({ success: true, data: null, message: 'No data found for this date and shift.' });
    }

    res.status(200).json({ success: true, data });
});

exports.savePrimaryData = asyncHandler(async (req, res) => {
    const { date, shift, incharge, ppOperator, members } = req.body ?? {};
    const data = await disaReportService.savePrimary({ date, shift, incharge, ppOperator, members });

    res.status(200).json({ success: true, data, message: 'Primary data saved successfully.' });
});

// Admin-only one-off repair for reports forked by the missing-shift write bug
// — see backend.md. `apply: true` writes; anything else (including omitted)
// is a dry-run preview of what would change.
exports.repairShiftSplit = asyncHandler(async (req, res) => {
    const data = await disaReportService.repairShiftSplit({ apply: req.body?.apply === true });

    res.status(200).json({ success: true, data });
});
