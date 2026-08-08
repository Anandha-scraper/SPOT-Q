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
    const { entryCount, addedCount } = await cupolaLogService.createTableEntry(req.body ?? {});

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
