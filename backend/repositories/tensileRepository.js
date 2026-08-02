const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.tensile.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function createEntry(tensileId, data) {
    return prisma.tensileEntry.create({ data: { ...data, tensileId } });
}

async function findEntries({ from, to } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = Object.keys(dateWhere).length ? { tensile: { date: dateWhere } } : {};

    const rows = await prisma.tensileEntry.findMany({
        where,
        orderBy: [{ tensile: { date: 'desc' } }, { createdAt: 'asc' }],
        include: { tensile: { select: { date: true } } },
    });

    return rows.map(({ tensile, ...entry }) => ({ date: tensile.date, ...entry }));
}

function findEntryAuthInfo(id) {
    return prisma.tensileEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.tensileEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.tensileEntry.delete({ where: { id } });
}

module.exports = {
    ensureDateRow,
    createEntry,
    findEntries,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
};
