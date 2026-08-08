const returnSandNoteService = require('../services/returnSandNoteService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await returnSandNoteService.listEntries({ startDate, endDate });

    res.status(200).json({ success: true, count: data.length, data });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const data = await returnSandNoteService.createEntry(req.body ?? {}, req.user.id);

    res.status(200).json({ success: true, data, message: 'Note updated successfully.' });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    const data = await returnSandNoteService.updateEntry(req.targetEntry.id, req.body ?? {});

    res.status(200).json({ success: true, data, message: 'Note updated successfully.' });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await returnSandNoteService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Return Sand Foundry Sand Testing Note entry deleted successfully.' });
});
