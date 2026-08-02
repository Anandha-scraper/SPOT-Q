const tensileService = require('../services/tensileService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const entries = await tensileService.listEntries({ from, to });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.filterEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const entries = await tensileService.filterEntries({ startDate, endDate });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await tensileService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'Tensile entry created successfully.',
    });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await tensileService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'Tensile entry updated successfully.',
    });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await tensileService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Tensile entry deleted successfully.' });
});
