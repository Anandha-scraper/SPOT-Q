const { prisma } = require('../database/prisma');

function create({ userId, employeeId, department, ip, userAgent }) {
    return prisma.loginActivity.create({
        // Denormalised snapshot of login-time identity — must not follow later profile edits.
        data: { userId, employeeId, department, ip, userAgent },
    });
}

function findRecentByUserId(userId, limit) {
    return prisma.loginActivity.findMany({
        where: { userId },
        orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
        take: limit,
        select: { id: true, loginAt: true, ip: true, userAgent: true },
    });
}

// Replaces the old global O(users) sweep in utils/cleanupLoginActivity.js; onDelete: Cascade makes orphan cleanup unnecessary.
async function trimToLastN(userId, keepCount) {
    const keep = await prisma.loginActivity.findMany({
        where: { userId },
        orderBy: [{ loginAt: 'desc' }, { id: 'desc' }], // tie-break on id: two logins can share a millisecond
        take: keepCount,
        select: { id: true },
    });

    if (keep.length < keepCount) return { deletedCount: 0 };

    const { count } = await prisma.loginActivity.deleteMany({
        where: { userId, id: { notIn: keep.map((row) => row.id) } },
    });

    return { deletedCount: count };
}

module.exports = { create, findRecentByUserId, trimToLastN };
