const microTensileService = require('../services/microTensileService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to, disa } = req.query;
    const entries = await microTensileService.listEntries({ from, to, disa });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.filterEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const entries = await microTensileService.filterEntries({ startDate, endDate });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

// `data` must be an array of plain strings — mirrors MicroStructure's getPartNames.
exports.getItemNames = asyncHandler(async (req, res) => {
    const names = await microTensileService.listItemNames();
    res.status(200).json({ success: true, count: names.length, data: names });
});

exports.checkDateDisaEntries = asyncHandler(async (req, res) => {
    const { date, disa } = req.query;
    const result = await microTensileService.checkPrimary({ date, disa });

    res.status(200).json({
        success: true,
        ...result,
        lastEntry: serializeRow(result.lastEntry),
    });
});

exports.savePrimary = asyncHandler(async (req, res) => {
    const { date, disa } = req.body ?? {};
    const result = await microTensileService.savePrimary({ date, disa });

    res.status(200).json({ success: true, ...result });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await microTensileService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'MicroTensile entry recorded successfully.',
    });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await microTensileService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'MicroTensile entry updated successfully.',
    });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await microTensileService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'MicroTensile entry deleted successfully.' });
});
