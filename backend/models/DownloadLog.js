const mongoose = require("mongoose");

// DownloadLog — audit trail of report/Excel downloads per employee.
// TEMPLATE: the schema is final, but nothing writes to it yet. The frontend
// export flow (frontend/src/utils/exportToExcel.js) will POST here once the
// download-logging feature is wired end-to-end.
const downloadLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      uppercase: true,
    },
    name: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      required: true,
    },
    // Which department/report screen the download came from (e.g. 'Tensile').
    reportType: {
      type: String,
      default: "",
    },
    // Human-readable date range that was exported, e.g. "01/07/2026 – 07/07/2026".
    rangeLabel: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Newest-first lookups per user (profile "Download Logs" tab).
downloadLogSchema.index({ userId: 1, createdAt: -1 });
// Admin all-departments view.
downloadLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("DownloadLog", downloadLogSchema);
