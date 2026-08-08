const { prisma } = require('../database/prisma')
//instead of bringing all logs makes to fetch a limited number of logs for admin(ALL_LOGS_LIMIT) and per employee(MY_LOGS_LIMIT).
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

// Mirrors loginActivityRepository.trimToLastN: keep the newest keepCount rows
// for this user, delete the rest.
async function trimToLastN(userId, keepCount) {
    const keep = await prisma.downloadLog.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // tie-break on id: two downloads can share a millisecond
        take: keepCount,
        select: { id: true },
    });

    if (keep.length < keepCount) return { deletedCount: 0 };

    const { count } = await prisma.downloadLog.deleteMany({
        where: { userId, id: { notIn: keep.map((row) => row.id) } },
    });

    return { deletedCount: count };
}

module.exports = {
    create,
    findByUser,
    findAll,
    trimToLastN,
};
