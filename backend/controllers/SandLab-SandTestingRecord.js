const sandRecordService = require('../services/sandRecordService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate, plant, page = 1, limit = 10 } = req.query;
    const { total, pages, data } = await sandRecordService.getAllEntries({ startDate, endDate, plant, page, limit });

    res.status(200).json({ success: true, total, pages, data });
});

exports.getEntriesByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const { plant } = req.query;
    const entry = await sandRecordService.getEntryByDate(date, plant);

    res.status(200).json({ success: true, data: entry ? [entry] : [] });
});

exports.createTableEntry = asyncHandler(async (req, res) => {
    const tableNum = req.params.tableNum || req.body.tableNum;
    const result = await sandRecordService.createTableEntry({ ...req.body, tableNum });

    res.status(200).json({ success: true, data: result, message: result.message });
});

exports.getStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, plant } = req.query;
    const data = await sandRecordService.getStats({ startDate, endDate, plant });

    res.status(200).json({ success: true, data });
});
