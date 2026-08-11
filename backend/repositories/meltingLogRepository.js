const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.meltingLog.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.meltingLog.findUnique({ where: { date } });
}

function findPrimary(meltingLogId, shift, furnaceNo, panel) {
    return prisma.meltingLogPrimary.findUnique({
        where: { meltingLogId_shift_furnaceNo_panel: { meltingLogId, shift, furnaceNo, panel } },
        include: { _count: { select: { entries: true } } },
    });
}

function upsertPrimary(meltingLogId, shift, furnaceNo, panel, data) {
    return prisma.meltingLogPrimary.upsert({
        where: { meltingLogId_shift_furnaceNo_panel: { meltingLogId, shift, furnaceNo, panel } },
        create: { meltingLogId, shift, furnaceNo, panel, ...data },
        update: data,
        include: { _count: { select: { entries: true } } },
    });
}

async function ensurePrimaryId(meltingLogId, shift, furnaceNo, panel) {
    const primary = await prisma.meltingLogPrimary.upsert({
        where: { meltingLogId_shift_furnaceNo_panel: { meltingLogId, shift, furnaceNo, panel } },
        create: { meltingLogId, shift, furnaceNo, panel },
        update: {},
        select: { id: true },
    });
    return primary.id;
}

function createEntry(primaryId, data) {
    return prisma.meltingLogEntry.create({ data: { ...data, primaryId } });
}

async function findEntries({ from, to } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = Object.keys(dateWhere).length
        ? { primary: { meltingLog: { date: dateWhere } } }
        : {};

    const primariesWhere = Object.keys(dateWhere).length ? { meltingLog: { date: dateWhere } } : {};

    const [entries, emptyPrimaries] = await Promise.all([
        prisma.meltingLogEntry.findMany({
            where,
            orderBy: [{ primary: { meltingLog: { date: 'desc' } } }, { createdAt: 'asc' }],
            include: {
                primary: {
                    select: {
                        id: true, shift: true, furnaceNo: true, panel: true,
                        cumulativeLiquidMetal: true, finalKwhr: true, initialKwhr: true,
                        totalUnits: true, cumulativeUnits: true, isLocked: true,
                        meltingLog: { select: { date: true } },
                        _count: { select: { entries: true } },
                    },
                },
            },
        }),
        prisma.meltingLogPrimary.findMany({
            where: { ...primariesWhere, entries: { none: {} } },
            include: { meltingLog: { select: { date: true } }, _count: { select: { entries: true } } },
        }),
    ]);

    return { entries, emptyPrimaries };
}

function findConflictingPrimary(meltingLogId, shift, furnaceNo, panel) {
    return prisma.meltingLogPrimary.findUnique({
        where: { meltingLogId_shift_furnaceNo_panel: { meltingLogId, shift, furnaceNo, panel } },
        select: { id: true },
    });
}

function findPrimaryById(id) {
    return prisma.meltingLogPrimary.findUnique({
        where: { id },
        select: { id: true, meltingLogId: true, shift: true, furnaceNo: true, panel: true },
    });
}

function updatePrimary(id, data) {
    return prisma.meltingLogPrimary.update({
        where: { id },
        data,
        include: { meltingLog: { select: { date: true } }, _count: { select: { entries: true } } },
    });
}

// The entries go with it via the onDelete: Cascade FK; the count is read first
// only so the response can say how many rows the admin actually removed.
async function deletePrimary(id) {
    const primary = await prisma.meltingLogPrimary.findUnique({
        where: { id },
        select: { _count: { select: { entries: true } } },
    });
    if (!primary) return null;

    await prisma.meltingLogPrimary.delete({ where: { id } });
    return { deletedEntryCount: primary._count.entries };
}

function findEntryAuthInfo(id) {
    return prisma.meltingLogEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.meltingLogEntry.update({ where: { id }, data });
}

async function deleteEntry(id) {
    const entry = await prisma.meltingLogEntry.findUnique({ where: { id }, select: { primaryId: true } });
    if (!entry) return null;

    return prisma.$transaction(async (tx) => {
        const deleted = await tx.meltingLogEntry.delete({ where: { id } });

        const remaining = await tx.meltingLogEntry.count({ where: { primaryId: entry.primaryId } });
        if (remaining === 0) {
            await tx.meltingLogPrimary.delete({ where: { id: entry.primaryId } });
        }

        return deleted;
    });
}

module.exports = {
    ensureDateRow,
    findDateRow,
    findPrimary,
    upsertPrimary,
    ensurePrimaryId,
    createEntry,
    findEntries,
    findConflictingPrimary,
    findPrimaryById,
    updatePrimary,
    deletePrimary,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
};
