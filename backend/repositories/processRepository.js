// Data access for the Process department. The only layer that touches Prisma.
// Takes and returns plain objects — never req/res, never AppError.

const { prisma } = require('../database/prisma');

// Get-or-create the date row atomically.
//
// The Mongoose version hand-rolled findOne + create with no race handling, so
// two concurrent first-entries for a new date both took the create branch and
// the loser got a raw 409 with its entry dropped. upsert closes that.
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

// ── entries ──────────────────────────────────────────────────────────────────

function createEntry(processId, data) {
    return prisma.processEntry.create({ data: { ...data, processId } });
}

// Flattened rows for the report: every entry with its parent's `date` hoisted
// onto it, matching the shape the old getAllEntries built by hand.
//
// `filters` are all optional; with none the result is the full table, which is
// exactly what the current frontend expects (it filters client-side).
async function findEntries({ from, to, disa } = {}) {
    const processWhere = {};
    // String comparison is correct here: `date` is VarChar(10) 'YYYY-MM-DD',
    // which is lexicographically ordered.
    if (from) processWhere.gte = from;
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

// "Last" means last created, matching the old array-order semantics where
// entries were push()ed in insertion order.
function findLastEntry(processId, disa) {
    return prisma.processEntry.findFirst({
        where: { processId, disa },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
}

// Minimal projection for middleware/entryAccess.js — it only needs ownership
// and age to authorise.
function findEntryAuthInfo(id) {
    return prisma.processEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

// Partial update: only the keys present in `data` are written, so an edit that
// changes one field leaves every other column untouched.
function updateEntry(id, data) {
    return prisma.processEntry.update({ where: { id }, data });
}

function deleteEntry(id) {
    return prisma.processEntry.delete({ where: { id } });
}

// Distinct part names for the autocomplete. Mapped to plain strings here, not
// in the controller: Prisma's `distinct` returns objects, and the frontend
// calls pn.toUpperCase() on each element — an object would make the Part Name
// field untypeable, with the error swallowed by an empty catch.
async function findPartNames() {
    const rows = await prisma.processEntry.findMany({
        where: { partName: { notIn: ['', '-'] } },
        distinct: ['partName'],
        select: { partName: true },
        orderBy: { partName: 'asc' },
    });

    return rows.map((row) => row.partName);
}

// ── saved DISAs (the "primary lock") ─────────────────────────────────────────

async function isDisaSaved(processId, disa) {
    const row = await prisma.processSavedDisa.findUnique({
        where: { processId_disa: { processId, disa } },
        select: { id: true },
    });
    return Boolean(row);
}

// Idempotent: re-saving an already-saved pair is a no-op rather than a 409.
// The @@unique([processId, disa]) constraint is what makes this safe under
// concurrent requests, replacing the old includes() check in application code.
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
