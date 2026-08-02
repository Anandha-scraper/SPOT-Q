const { prisma } = require('../database/prisma');

const MY_LOGS_LIMIT = 100;
const ALL_LOGS_LIMIT = 500;

function create(data) {
    return prisma.downloadLog.create({ data });
}

function findByUser(userId) {
    return prisma.downloadLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: MY_LOGS_LIMIT,
        select: { id: true, reportType: true, rangeLabel: true, createdAt: true },
    });
}

function findAll() {
    return prisma.downloadLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: ALL_LOGS_LIMIT,
        select: {
            id: true, employeeId: true, name: true, department: true,
            reportType: true, rangeLabel: true, createdAt: true,
        },
    });
}

module.exports = {
    create,
    findByUser,
    findAll,
};
