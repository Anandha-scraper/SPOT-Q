const processService = require('../services/processService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

// from/to/disa are optional; with none this returns the whole table, which the report page filters client-side.
exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to, disa } = req.query;
    const entries = await processService.listEntries({ from, to, disa });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

// `data` must be an array of plain strings — the form calls pn.toUpperCase() on each element.
exports.getPartNames = asyncHandler(async (req, res) => {
    const partNames = await processService.listPartNames();
    res.status(200).json({ success: true, count: partNames.length, data: partNames });
});

// Read side of the primary lock; usePrimaryLock branches on `exists`.
exports.checkDateDisaEntries = asyncHandler(async (req, res) => {
    const { date, disa } = req.query;
    const result = await processService.checkPrimary({ date, disa });

    res.status(200).json({
        success: true,
        ...result,
        lastEntry: serializeRow(result.lastEntry),
    });
});

// Write side of the primary lock; idempotent.
exports.savePrimary = asyncHandler(async (req, res) => {
    const { date, disa } = req.body ?? {};
    const result = await processService.savePrimary({ date, disa });

    res.status(200).json({ success: true, ...result });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await processService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'Process record saved successfully.',
    });
});

// Partial: only the keys present in the body are written.
exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await processService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'Process entry updated successfully.',
    });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await processService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Process entry deleted successfully.' });
});
