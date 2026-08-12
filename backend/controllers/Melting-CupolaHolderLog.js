const cupolaLogService = require('../services/cupolaLogService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getPrimaryByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const { shift, holderNumber } = req.query;
    const data = await cupolaLogService.fetchPrimaryByDate({ date, shift, holderNumber });

    res.status(200).json({ success: true, data });
});

exports.filterByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await cupolaLogService.filterByDateRange({ startDate, endDate });

    res.status(200).json({ success: true, count: data.length, data });
});

exports.createTableEntry = asyncHandler(async (req, res) => {
    const { entryCount, addedCount } = await cupolaLogService.createTableEntry(req.body ?? {}, req.user.id);

    res.status(200).json({
        success: true,
        entryCount,
        addedCount,
        message: `${addedCount} ${addedCount === 1 ? 'entry' : 'entries'} saved successfully.`,
    });
});

exports.createOrUpdatePrimary = asyncHandler(async (req, res) => {
    const data = await cupolaLogService.createOrUpdatePrimary(req.body ?? {});

    res.status(200).json({ success: true, data });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    await cupolaLogService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({ success: true, message: 'Cupola entry updated successfully.' });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await cupolaLogService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Cupola entry deleted successfully.' });
});

exports.updatePrimary = asyncHandler(async (req, res) => {
    const data = await cupolaLogService.updatePrimary(req.targetEntry.id, req.body);

    res.status(200).json({ success: true, data, message: 'Primary updated successfully.' });
});

exports.deletePrimary = asyncHandler(async (req, res) => {
    const { deletedEntryCount } = await cupolaLogService.deletePrimary(req.targetEntry.id);

    res.status(200).json({
        success: true,
        message: deletedEntryCount
            ? `Primary and its ${deletedEntryCount} ${deletedEntryCount === 1 ? 'entry' : 'entries'} deleted successfully.`
            : 'Primary deleted successfully.',
    });
});
