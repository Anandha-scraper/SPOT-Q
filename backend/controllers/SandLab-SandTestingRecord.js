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
    const result = await sandRecordService.createTableEntry({ ...req.body, tableNum }, req.user.id);

    res.status(200).json({ success: true, data: result, message: result.message });
});

exports.savePrimary = asyncHandler(async (req, res) => {
    const { date, plant } = req.body;
    const data = await sandRecordService.savePrimary({ date, plant }, req.user.id);

    res.status(200).json({ success: true, data });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const data = await sandRecordService.updateRecord(req.targetEntry.id, req.body ?? {});

    res.status(200).json({ success: true, data, message: 'Sand Testing Record updated successfully.' });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await sandRecordService.deleteRecord(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Sand Testing Record deleted successfully.' });
});

exports.getStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, plant } = req.query;
    const data = await sandRecordService.getStats({ startDate, endDate, plant });

    res.status(200).json({ success: true, data });
});
