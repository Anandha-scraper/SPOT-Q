const DownloadLog = require("../models/DownloadLog");

// Current user's download history (newest first). Powers the profile
// "Download Logs" tab. Returns [] until downloads are recorded.
exports.getMyDownloadLogs = async (req, res) => {
  try {
    const logs = await DownloadLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("reportType rangeLabel createdAt");

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Download Log Fetch Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch download logs" });
  }
};

// Admin-only: every department's download logs, with employeeId + department
// so the admin table can show the extra columns.
exports.getAllDownloadLogs = async (req, res) => {
  try {
    const logs = await DownloadLog.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .select("employeeId name department reportType rangeLabel createdAt");

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Download Log (All) Fetch Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch download logs" });
  }
};

// Record a download. TEMPLATE: functional, but not yet called from the
// frontend export flow. `req.user` supplies identity; the body supplies
// what was exported.
exports.recordDownload = async (req, res) => {
  try {
    const { reportType = "", rangeLabel = "" } = req.body;

    const log = await DownloadLog.create({
      userId: req.user._id,
      employeeId: req.user.employeeId,
      name: req.user.name,
      department: req.user.department,
      reportType,
      rangeLabel,
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error("Download Log Record Error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to record download" });
  }
};
