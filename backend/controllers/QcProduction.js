const qcProductionService = require('../services/qcProductionService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const entries = await qcProductionService.listEntries({ from, to });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

// The response key is `partNames`, not `data` — QcProductionDetails.jsx reads
// data.partNames and calls .toUpperCase() on each element.
exports.getPartNames = asyncHandler(async (req, res) => {
    const partNames = await qcProductionService.listPartNames();

    res.status(200).json({ success: true, partNames });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await qcProductionService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'Entry added to production log.',
    });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await qcProductionService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'QC production entry updated successfully.',
    });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await qcProductionService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'QC production entry deleted successfully.' });
});
