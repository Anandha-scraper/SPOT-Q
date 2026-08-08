const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.returnSandNoteDay.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findEntry(dayId, shift, plant) {
    return prisma.returnSandNoteEntry.findUnique({
        where: { dayId_shift_plant: { dayId, shift, plant } },
        include: { fields: true },
    });
}

async function ensureEntryId(dayId, shift, plant, createdBy) {
    const entry = await prisma.returnSandNoteEntry.upsert({
        where: { dayId_shift_plant: { dayId, shift, plant } },
        create: { dayId, shift, plant, createdBy },
        update: {},
        select: { id: true },
    });
    return entry.id;
}

// One upsert per leaf, replacing the old deep-merge's "overwrite if non-empty" on the (entry, section, testNo, fieldPath) unique key.
function upsertLeaf(entryId, section, testNo, fieldPath, value) {
    return prisma.returnSandNoteField.upsert({
        where: { entryId_section_testNo_fieldPath: { entryId, section, testNo, fieldPath } },
        create: { entryId, section, testNo, fieldPath, value },
        update: { value },
    });
}

function findEntryWithFields(entryId) {
    return prisma.returnSandNoteEntry.findUnique({
        where: { id: entryId },
        include: { day: { select: { date: true } }, fields: true },
    });
}

function findEntryAuthInfo(id) {
    return prisma.returnSandNoteEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function deleteEntry(id) {
    return prisma.returnSandNoteEntry.delete({ where: { id } });
}

function findEntriesInRange({ from, to } = {}) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    return prisma.returnSandNoteEntry.findMany({
        where: Object.keys(dateWhere).length ? { day: { date: dateWhere } } : {},
        orderBy: [{ day: { date: 'desc' } }],
        include: { day: { select: { date: true } }, fields: true },
    });
}

module.exports = {
    ensureDateRow,
    findEntry,
    ensureEntryId,
    upsertLeaf,
    findEntryWithFields,
    findEntryAuthInfo,
    deleteEntry,
    findEntriesInRange,
};
