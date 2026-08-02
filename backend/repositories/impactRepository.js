const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.impact.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function createEntry(impactId, data) {
    return prisma.impactEntry.create({ data: { ...data, impactId } });
}

async function findEntries({ from, to } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = Object.keys(dateWhere).length ? { impact: { date: dateWhere } } : {};

    const rows = await prisma.impactEntry.findMany({
        where,
        orderBy: [{ impact: { date: 'desc' } }, { createdAt: 'asc' }],
        include: { impact: { select: { date: true } } },
    });

    return rows.map(({ impact, ...entry }) => ({ date: impact.date, ...entry }));
}

function findEntryAuthInfo(id) {
    return prisma.impactEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.impactEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.impactEntry.delete({ where: { id } });
}

module.exports = {
    ensureDateRow,
    createEntry,
    findEntries,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
};
