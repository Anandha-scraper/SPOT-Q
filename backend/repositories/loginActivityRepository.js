// Data access for the login audit trail. The only layer that touches Prisma.

const { prisma } = require('../database/prisma');

function create({ userId, employeeId, department, ip, userAgent }) {
    return prisma.loginActivity.create({
        // employeeId/department are deliberate denormalised snapshots of who the
        // user was at login time — not a join, and they must not follow later
        // profile edits.
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

// Retention, scoped to one user.
//
// This replaces the whole of the old utils/cleanupLoginActivity.js, which ran a
// FULL GLOBAL sweep synchronously inside every login request: a distinct() over
// all userIds, then a find + deleteMany per user, plus an orphan pass over the
// users collection. That was O(users) queries on the login hot path.
//
// Orphan cleanup is gone entirely — the FK's onDelete: Cascade makes orphaned
// rows impossible by construction.
async function trimToLastN(userId, keepCount) {
    const keep = await prisma.loginActivity.findMany({
        where: { userId },
        // Tie-break on id for the same reason as findAllWithLastLogin: two
        // logins can share a millisecond, and without a deterministic secondary
        // key the "keep" set is not stable between the read and the delete.
        orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
        take: keepCount,
        select: { id: true },
    });

    // Nothing to trim until the user is actually over the limit.
    if (keep.length < keepCount) return { deletedCount: 0 };

    const { count } = await prisma.loginActivity.deleteMany({
        where: { userId, id: { notIn: keep.map((row) => row.id) } },
    });

    return { deletedCount: count };
}

module.exports = { create, findRecentByUserId, trimToLastN };
