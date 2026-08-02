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

function createEntries(primaryId, rows) {
    return prisma.cupolaLogEntry.createMany({ data: rows.map((data) => ({ ...data, primaryId })) });
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
};
