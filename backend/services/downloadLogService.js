const downloadLogRepository = require('../repositories/downloadLogRepository');

function listMyLogs(userId) {
    return downloadLogRepository.findByUser(userId);
}

function listAllLogs() {
    return downloadLogRepository.findAll();
}

function recordDownload(user, { reportType = '', rangeLabel = '' } = {}) {
    return downloadLogRepository.create({
        userId: user.id,
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        reportType,
        rangeLabel,
    });
}

module.exports = {
    listMyLogs,
    listAllLogs,
    recordDownload,
};
