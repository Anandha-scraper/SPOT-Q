const meltingLogService = require('../services/meltingLogService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow } = require('../utils/serialize');

exports.getPrimaryByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const { shift, furnaceNo, panel } = req.query;
    const data = await meltingLogService.fetchPrimaryByDate({ date, shift, furnaceNo, panel });

    res.status(200).json({ success: true, data });
});

exports.filterByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await meltingLogService.filterByDateRange({ startDate, endDate });

    res.status(200).json({ success: true, data });
});

exports.createTableEntry = asyncHandler(async (req, res) => {
    const { entry, entryCount } = await meltingLogService.createTableEntry(req.body ?? {}, req.user.id);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        entryCount,
        message: 'Entry saved successfully.',
    });
});

exports.createOrUpdatePrimary = asyncHandler(async (req, res) => {
    const data = await meltingLogService.createOrUpdatePrimary(req.body ?? {}, req.user.id);

    res.status(200).json({ success: true, data });
});

exports.updateEntry = asyncHandler(async (req, res) => {
    await meltingLogService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({ success: true, message: 'Melting entry updated successfully.' });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
    await meltingLogService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Melting entry deleted successfully.' });
});

exports.updatePrimary = asyncHandler(async (req, res) => {
    const data = await meltingLogService.updatePrimary(req.targetEntry.id, req.body);

    res.status(200).json({ success: true, data, message: 'Primary updated successfully.' });
});

exports.deletePrimary = asyncHandler(async (req, res) => {
    const { deletedEntryCount } = await meltingLogService.deletePrimary(req.targetEntry.id);

    res.status(200).json({
        success: true,
        message: deletedEntryCount
            ? `Primary and its ${deletedEntryCount} ${deletedEntryCount === 1 ? 'entry' : 'entries'} deleted successfully.`
            : 'Primary deleted successfully.',
    });
});

// Admin-only one-off repair for primaries saved before MeltingLogPrimary
// gained createdBy — see backend.md. `apply: true` writes; anything else
// (including omitted) is a dry-run preview of what would change.
exports.backfillPrimaryOwners = asyncHandler(async (req, res) => {
    const data = await meltingLogService.backfillPrimaryCreatedBy({ apply: req.body?.apply === true });

    res.status(200).json({ success: true, data });
});
