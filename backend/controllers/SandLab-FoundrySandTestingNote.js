const sandNoteService = require('../services/sandNoteService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getAllEntries = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await sandNoteService.listEntries({ startDate, endDate });

    res.status(200).json({ success: true, count: data.length, data });
});

exports.createEntry = asyncHandler(async (req, res) => {
    const data = await sandNoteService.createEntry(req.body ?? {});

    res.status(200).json({ success: true, data, message: 'Note updated successfully.' });
});
