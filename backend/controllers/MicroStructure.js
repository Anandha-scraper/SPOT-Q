const microStructureService = require('../services/microStructureService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to, disa } = req.query;
    const entries = await microStructureService.listEntries({ from, to, disa });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.filterEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const entries = await microStructureService.filterEntries({ startDate, endDate });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

exports.getLastDisa = asyncHandler(async (req, res) => {
    const lastDisa = await microStructureService.getLastDisa();

    res.status(200).json({ success: true, lastDisa });
});

exports.checkDateDisaEntries = asyncHandler(async (req, res) => {
    const { date, disa } = req.query;
    const result = await microStructureService.checkPrimary({ date, disa });

    res.status(200).json({
        success: true,
        ...result,
        lastEntry: serializeRow(result.lastEntry),
    });
});

exports.savePrimary = asyncHandler(async (req, res) => {
    const { date, disa } = req.body ?? {};
    const result = await microStructureService.savePrimary({ date, disa });

    res.status(200).json({ success: true, ...result });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await microStructureService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'MicroStructure record added successfully.',
    });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await microStructureService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'MicroStructure entry updated successfully.',
    });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await microStructureService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'MicroStructure entry deleted successfully.' });
});
