const downloadLogRepository = require('../repositories/downloadLogRepository');

// Per-user retention cap for DownloadLog, unlike LOGIN_HISTORY_KEEP this is
// env-configurable since ops may want a different download-log retention
// window per deployment. Falls back to 200 if PROD_SPOT_Q_DLOG is unset or non-numeric.
const DOWNLOAD_LOG_KEEP = Number(process.env.PROD_SPOT_Q_DLOG);

function listMyLogs(userId) {
    return downloadLogRepository.findByUser(userId);
}

function listAllLogs() {
    return downloadLogRepository.findAll();
}

async function recordDownload(user, { reportType = '', rangeLabel = '' } = {}) {
    const log = await downloadLogRepository.create({
        userId: user.id,
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        reportType,
        rangeLabel,
    });

    try {
        await downloadLogRepository.trimToLastN(user.id, DOWNLOAD_LOG_KEEP);
    } catch (trimError) {
        console.error('Download log trim failed:', trimError.message);
    }

    return log;
}

module.exports = {
    listMyLogs,
    listAllLogs,
    recordDownload,
};
