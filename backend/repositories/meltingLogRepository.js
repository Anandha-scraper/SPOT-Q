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

function findEntryAuthInfo(id) {
    return prisma.meltingLogEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.meltingLogEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.meltingLogEntry.delete({ where: { id } });
}

module.exports = {
    ensureDateRow,
    findDateRow,
    findPrimary,
    upsertPrimary,
    ensurePrimaryId,
    createEntry,
    findEntries,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
};
