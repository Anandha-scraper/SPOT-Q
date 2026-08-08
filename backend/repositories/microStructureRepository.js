const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.microStructure.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.microStructure.findUnique({ where: { date } });
}

function createEntry(microStructureId, data) {
    return prisma.microStructureEntry.create({ data: { ...data, microStructureId } });
}

async function findEntries({ from, to, disa } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = {};
    if (Object.keys(dateWhere).length) where.microStructure = { date: dateWhere };
    if (disa) where.disa = disa;

    const rows = await prisma.microStructureEntry.findMany({
        where,
        orderBy: [{ microStructure: { date: 'desc' } }, { createdAt: 'asc' }],
        include: { microStructure: { select: { date: true } } },
    });

    return rows.map(({ microStructure, ...entry }) => ({ date: microStructure.date, ...entry }));
}

function countEntries(microStructureId, disa) {
    return prisma.microStructureEntry.count({ where: { microStructureId, disa } });
}

function countEntriesForDate(microStructureId) {
    return prisma.microStructureEntry.count({ where: { microStructureId } });
}

function findLastEntry(microStructureId, disa) {
    return prisma.microStructureEntry.findFirst({
        where: { microStructureId, disa },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
}

function findEntryAuthInfo(id) {
    return prisma.microStructureEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.microStructureEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.microStructureEntry.delete({ where: { id } });
}

async function isDisaSaved(microStructureId, disa) {
    const row = await prisma.microStructureSavedDisa.findUnique({
        where: { microStructureId_disa: { microStructureId, disa } },
        select: { id: true },
    });
    return Boolean(row);
}

function saveDisa(microStructureId, disa) {
    return prisma.microStructureSavedDisa.upsert({
        where: { microStructureId_disa: { microStructureId, disa } },
        create: { microStructureId, disa },
        update: {},
    });
}

async function findLatestSavedDisa() {
    const row = await prisma.microStructureSavedDisa.findFirst({
        orderBy: [{ microStructure: { date: 'desc' } }, { createdAt: 'desc' }],
        select: { disa: true },
    });

    return row ? row.disa : '';
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
    findLatestSavedDisa,
};
