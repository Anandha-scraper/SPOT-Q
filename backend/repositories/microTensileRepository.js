const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.microTensile.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.microTensile.findUnique({ where: { date } });
}

function createEntry(microTensileId, data) {
    return prisma.microTensileEntry.create({ data: { ...data, microTensileId } });
}

async function findEntries({ from, to, disa } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = {};
    if (Object.keys(dateWhere).length) where.microTensile = { date: dateWhere };
    if (disa) where.disa = disa;

    const rows = await prisma.microTensileEntry.findMany({
        where,
        orderBy: [{ microTensile: { date: 'desc' } }, { createdAt: 'asc' }],
        include: { microTensile: { select: { date: true } } },
    });

    return rows.map(({ microTensile, ...entry }) => ({ date: microTensile.date, ...entry }));
}

function countEntries(microTensileId, disa) {
    return prisma.microTensileEntry.count({ where: { microTensileId, disa } });
}

function countEntriesForDate(microTensileId) {
    return prisma.microTensileEntry.count({ where: { microTensileId } });
}

function findLastEntry(microTensileId, disa) {
    return prisma.microTensileEntry.findFirst({
        where: { microTensileId, disa },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
}

function findEntryAuthInfo(id) {
    return prisma.microTensileEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.microTensileEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.microTensileEntry.delete({ where: { id } });
}

async function isDisaSaved(microTensileId, disa) {
    const row = await prisma.microTensileSavedDisa.findUnique({
        where: { microTensileId_disa: { microTensileId, disa } },
        select: { id: true },
    });
    return Boolean(row);
}

function saveDisa(microTensileId, disa) {
    return prisma.microTensileSavedDisa.upsert({
        where: { microTensileId_disa: { microTensileId, disa } },
        create: { microTensileId, disa },
        update: {},
    });
}

// Mirrors microStructureRepository.js#findDistinctFieldValues — single-model
// department, so no `model` param needed, just the field name.
async function findDistinctFieldValues(field, cutoffDate) {
    const rows = await prisma.microTensileEntry.findMany({
        where: { [field]: { notIn: ['', '-'] }, microTensile: { date: { gte: cutoffDate } } },
        distinct: [field],
        select: { [field]: true },
        orderBy: { [field]: 'asc' },
    });
    return rows.map((row) => row[field]);
}

module.exports = {
    ensureDateRow,
    findDateRow,
    createEntry,
    findEntries,
    countEntries,
    countEntriesForDate,
    findLastEntry,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
    isDisaSaved,
    saveDisa,
    findDistinctFieldValues,
};
