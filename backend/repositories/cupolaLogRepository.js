const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.cupolaLog.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.cupolaLog.findUnique({ where: { date } });
}

function findPrimary(cupolaLogId, shift, holderNumber) {
    return prisma.cupolaLogPrimary.findUnique({
        where: { cupolaLogId_shift_holderNumber: { cupolaLogId, shift, holderNumber } },
        include: { entries: { orderBy: { createdAt: 'asc' } }, _count: { select: { entries: true } } },
    });
}

async function ensurePrimaryId(cupolaLogId, shift, holderNumber) {
    const primary = await prisma.cupolaLogPrimary.upsert({
        where: { cupolaLogId_shift_holderNumber: { cupolaLogId, shift, holderNumber } },
        create: { cupolaLogId, shift, holderNumber },
        update: {},
        select: { id: true },
    });
    return primary.id;
}

function createEntries(primaryId, rows, createdBy) {
    return prisma.cupolaLogEntry.createMany({
        data: rows.map((data) => ({ ...data, primaryId, createdBy: createdBy ?? null })),
    });
}

function findConflictingPrimary(cupolaLogId, shift, holderNumber) {
    return prisma.cupolaLogPrimary.findUnique({
        where: { cupolaLogId_shift_holderNumber: { cupolaLogId, shift, holderNumber } },
        select: { id: true },
    });
}

function findPrimaryById(id) {
    return prisma.cupolaLogPrimary.findUnique({
        where: { id },
        select: { id: true, cupolaLogId: true, shift: true, holderNumber: true },
    });
}

function updatePrimary(id, data) {
    return prisma.cupolaLogPrimary.update({
        where: { id },
        data,
        include: { cupolaLog: { select: { date: true } }, _count: { select: { entries: true } } },
    });
}

async function deletePrimary(id) {
    const primary = await prisma.cupolaLogPrimary.findUnique({
        where: { id },
        select: { _count: { select: { entries: true } } },
    });
    if (!primary) return null;

    await prisma.cupolaLogPrimary.delete({ where: { id } });
    return { deletedEntryCount: primary._count.entries };
}

function findEntryAuthInfo(id) {
    return prisma.cupolaLogEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.cupolaLogEntry.update({ where: { id }, data });
}

// Mirrors meltingLogRepository#deleteEntry: a primary left with no entries is
// deleted with its last child, so it never resurfaces as an empty report row.
async function deleteEntry(id) {
    const entry = await prisma.cupolaLogEntry.findUnique({ where: { id }, select: { primaryId: true } });
    if (!entry) return null;

    return prisma.$transaction(async (tx) => {
        const deleted = await tx.cupolaLogEntry.delete({ where: { id } });

        const remaining = await tx.cupolaLogEntry.count({ where: { primaryId: entry.primaryId } });
        if (remaining === 0) {
            await tx.cupolaLogPrimary.delete({ where: { id: entry.primaryId } });
        }

        return deleted;
    });
}

async function findEntries({ from, to } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = Object.keys(dateWhere).length ? { primary: { cupolaLog: { date: dateWhere } } } : {};
    const primariesWhere = Object.keys(dateWhere).length ? { cupolaLog: { date: dateWhere } } : {};

    const [entries, emptyPrimaries] = await Promise.all([
        prisma.cupolaLogEntry.findMany({
            where,
            orderBy: [{ primary: { cupolaLog: { date: 'desc' } } }, { createdAt: 'asc' }],
            include: {
                primary: {
                    select: {
                        id: true, shift: true, holderNumber: true,
                        cupolaLog: { select: { date: true } },
                        _count: { select: { entries: true } },
                    },
                },
            },
        }),
        prisma.cupolaLogPrimary.findMany({
            where: { ...primariesWhere, entries: { none: {} } },
            include: { cupolaLog: { select: { date: true } } },
        }),
    ]);

    return { entries, emptyPrimaries };
}

module.exports = {
    ensureDateRow,
    findDateRow,
    findPrimary,
    ensurePrimaryId,
    createEntries,
    findEntries,
    findConflictingPrimary,
    findPrimaryById,
    updatePrimary,
    deletePrimary,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
};
