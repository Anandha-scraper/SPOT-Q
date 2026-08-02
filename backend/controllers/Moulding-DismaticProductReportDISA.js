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

// The old "smart updater" dispatched on req.body.section via a switch; each
// section is now its own service function. 'basicInfo', 'all' and
// 'eventSection' were dead code (no frontend caller ever sent them) and are
// not reproduced here.
exports.createDismaticReport = asyncHandler(async (req, res) => {
    const { date, shift, section, ...payload } = req.body ?? {};

    let result;
    switch (section) {
        case 'production':
            result = await disaReportService.saveProduction(date, shift, payload.productionTable);
            break;
        case 'nextShiftPlan':
            result = await disaReportService.saveNextShiftPlan(date, shift, payload.nextShiftPlanTable);
            break;
        case 'delays':
            result = await disaReportService.saveDelays(date, shift, payload.delaysTable);
            break;
        case 'mouldHardness':
            result = await disaReportService.saveMouldHardness(date, shift, payload.mouldHardnessTable);
            break;
        case 'patternTemp':
            result = await disaReportService.savePatternTemp(date, shift, payload.patternTempTable);
            break;
        case 'events':
            result = await disaReportService.saveEvents(date, shift, payload);
            break;
        default:
            result = { message: `${section} updated.` };
    }

    res.status(200).json({ success: true, message: result.message });
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
