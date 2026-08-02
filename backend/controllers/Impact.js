const impactService = require('../services/impactService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const entries = await impactService.listEntries({ from, to });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.filterEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const entries = await impactService.filterEntries({ startDate, endDate });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await impactService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'Impact entry created successfully.',
    });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await impactService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'Impact entry updated successfully.',
    });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await impactService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Impact entry deleted successfully.' });
});
