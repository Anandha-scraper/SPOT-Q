const downloadLogService = require('../services/downloadLogService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

// Current user's download history (newest first). Powers the profile
// "Download Logs" tab. Returns [] until downloads are recorded.
exports.getMyDownloadLogs = asyncHandler(async (req, res) => {
    const logs = await downloadLogService.listMyLogs(req.user.id);

    res.status(200).json({ success: true, data: serializeRows(logs) });
});

// Admin-only: every department's download logs, with employeeId + department
// so the admin table can show the extra columns.
exports.getAllDownloadLogs = asyncHandler(async (req, res) => {
    const logs = await downloadLogService.listAllLogs();

    res.status(200).json({ success: true, data: serializeRows(logs) });
});

// Record a download. `req.user` supplies identity; the body supplies what
// was exported.
exports.recordDownload = asyncHandler(async (req, res) => {
    const log = await downloadLogService.recordDownload(req.user, req.body ?? {});

    res.status(201).json({ success: true, data: serializeRow(log) });
});
