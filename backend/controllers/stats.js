const statsService = require('../services/statsService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getEntryStats = asyncHandler(async (req, res) => {
    const data = await statsService.getPersonalStats(req.user);
    res.status(200).json({ success: true, data });
});

exports.getAdminEntryStats = asyncHandler(async (req, res) => {
    const data = await statsService.getAdminStats();
    res.status(200).json({ success: true, data });
});
