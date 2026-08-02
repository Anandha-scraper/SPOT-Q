const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.sandNoteDay.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.sandNoteDay.findUnique({ where: { date } });
}

function findEntry(sandNoteDayId, shift, sandPlant) {
    return prisma.sandNoteEntry.findUnique({
        where: { sandNoteDayId_shift_sandPlant: { sandNoteDayId, shift, sandPlant } },
        include: { fields: true },
    });
}

async function ensureEntryId(sandNoteDayId, shift, sandPlant) {
    const entry = await prisma.sandNoteEntry.upsert({
        where: { sandNoteDayId_shift_sandPlant: { sandNoteDayId, shift, sandPlant } },
        create: { sandNoteDayId, shift, sandPlant },
        update: {},
        select: { id: true },
    });
    return entry.id;
}

function updateEntryFields(entryId, data) {
    return prisma.sandNoteEntry.update({ where: { id: entryId }, data });
}

// One upsert per leaf, replacing the old deep-merge's "overwrite if non-empty" on the (entry, section, testNo, fieldPath) unique key.
function upsertLeaf(entryId, section, testNo, fieldPath, value) {
    return prisma.sandNoteField.upsert({
        where: { entryId_section_testNo_fieldPath: { entryId, section, testNo, fieldPath } },
        create: { entryId, section, testNo, fieldPath, value },
        update: { value },
    });
}

function findEntryWithFields(entryId) {
    return prisma.sandNoteEntry.findUnique({ where: { id: entryId }, include: { fields: true } });
}

function findEntriesInRange({ from, to } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    return prisma.sandNoteEntry.findMany({
        where: Object.keys(dateWhere).length ? { day: { date: dateWhere } } : {},
        orderBy: [{ day: { date: 'desc' } }],
        include: { day: { select: { date: true } }, fields: true },
    });
}

function findEntriesForDate(sandNoteDayId) {
    return prisma.sandNoteEntry.findMany({
        where: { sandNoteDayId },
        include: { fields: true },
    });
}

module.exports = {
    ensureDateRow,
    findDateRow,
    findEntry,
    ensureEntryId,
    updateEntryFields,
    upsertLeaf,
    findEntryWithFields,
    findEntriesInRange,
    findEntriesForDate,
};
