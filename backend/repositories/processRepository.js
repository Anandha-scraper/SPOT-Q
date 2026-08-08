const { prisma } = require('../database/prisma');

// upsert closes a race the old hand-rolled findOne+create had: two concurrent first-entries for a new date could both take the create branch.
function ensureDateRow(date) {
    return prisma.process.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.process.findUnique({ where: { date } });
}

function createEntry(processId, data) {
    return prisma.processEntry.create({ data: { ...data, processId } });
}

// Flattens each entry with its parent's date hoisted on; filters are optional, defaulting to the full table (frontend filters client-side).
async function findEntries({ from, to, disa } = {}) {
    const processWhere = {};
    if (from) processWhere.gte = from; // date is VarChar(10) 'YYYY-MM-DD', lexicographically ordered
    if (to) processWhere.lte = to;

    const where = {};
    if (Object.keys(processWhere).length) where.process = { date: processWhere };
    if (disa) where.disa = disa;

    const rows = await prisma.processEntry.findMany({
        where,
        orderBy: [{ process: { date: 'desc' } }, { createdAt: 'asc' }],
        include: { process: { select: { date: true } } },
    });

    return rows.map(({ process, ...entry }) => ({ date: process.date, ...entry }));
}

function countEntries(processId, disa) {
    return prisma.processEntry.count({ where: { processId, disa } });
}

function countEntriesForDate(processId) {
    return prisma.processEntry.count({ where: { processId } });
}

function findLastEntry(processId, disa) {
    return prisma.processEntry.findFirst({
        where: { processId, disa },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // "last" = last created, matching the old array push() order
    });
}

// Minimal projection for middleware/entryAccess.js — only ownership and age are needed to authorise.
function findEntryAuthInfo(id) {
    return prisma.processEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.processEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.processEntry.delete({ where: { id } });
}

// Mapped to plain strings here, not the controller — Prisma's distinct returns objects, and pn.toUpperCase() on one throws.
async function findPartNames() {
    const rows = await prisma.processEntry.findMany({
        where: { partName: { notIn: ['', '-'] } },
        distinct: ['partName'],
        select: { partName: true },
        orderBy: { partName: 'asc' },
    });

    return rows.map((row) => row.partName);
}

async function isDisaSaved(processId, disa) {
    const row = await prisma.processSavedDisa.findUnique({
        where: { processId_disa: { processId, disa } },
        select: { id: true },
    });
    return Boolean(row);
}

// Idempotent — the @@unique([processId, disa]) constraint makes re-saving a no-op instead of a 409 under concurrent requests.
function saveDisa(processId, disa) {
    return prisma.processSavedDisa.upsert({
        where: { processId_disa: { processId, disa } },
        create: { processId, disa },
        update: {},
    });
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
    findPartNames,
    isDisaSaved,
    saveDisa,
};
