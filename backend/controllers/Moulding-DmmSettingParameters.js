const dmmLogService = require('../services/dmmLogService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getDMMSettingsByDate = asyncHandler(async (req, res) => {
    const { date, machine, shift } = req.query;
    const data = await dmmLogService.getSettingsByDate({ date, machine, shift });

    res.status(200).json({ success: true, data });
});

exports.createDMMSettings = asyncHandler(async (req, res) => {
    const result = await dmmLogService.createSettings(req.body ?? {});

    res.status(200).json({ success: true, message: result.message });
});

exports.getAllDMMSettings = asyncHandler(async (req, res) => {
    const data = await dmmLogService.getAllSettings();

    res.status(200).json({ success: true, count: data.length, data });
});
