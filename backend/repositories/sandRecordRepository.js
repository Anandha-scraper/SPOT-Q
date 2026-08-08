const { prisma } = require('../database/prisma');

function ensureDayRow(date, plant, createdBy) {
    return prisma.sandRecordDay.upsert({
        where: { date_plant: { date, plant } },
        create: { date, plant, createdBy },
        update: {},
    });
}

function findDayRow(date, plant) {
    const where = { date };
    if (plant) where.plant = plant;
    return prisma.sandRecordDay.findFirst({ where });
}

function updateDayFields(recordId, data) {
    return prisma.sandRecordDay.update({ where: { id: recordId }, data });
}

// Scalar leaf: overwrite-if-non-empty, so a single upsert at position 0.
function upsertScalarValue(recordId, section, shiftKey, field, value) {
    return prisma.sandRecordValue.upsert({
        where: { recordId_section_shiftKey_field_position: { recordId, section, shiftKey, field, position: 0 } },
        create: { recordId, section, shiftKey, field, position: 0, value },
        update: { value },
    });
}

// Array leaf: append-only. Existing values are never touched; new ones land
// at the next free positions.
async function appendArrayValues(recordId, section, shiftKey, field, values) {
    if (!values.length) return;

    const existingCount = await prisma.sandRecordValue.count({
        where: { recordId, section, shiftKey, field },
    });

    await prisma.sandRecordValue.createMany({
        data: values.map((value, i) => ({
            recordId, section, shiftKey, field, position: existingCount + i, value,
        })),
    });
}

// Edit path: writes an already-saved OR brand-new leaf at a specific
// position — scalar or array, both address the same (recordId, section,
// shiftKey, field, position) unique key, scalars always at position 0. An
// upsert (not a strict update) because the report page's inline edit can
// target a position that never existed before: Plus-adding a new array
// element, or switching Table 1b's radio to whichever of coalDust/premix
// wasn't previously saved.
function updateValueAtPosition(recordId, section, shiftKey, field, position, value) {
    return prisma.sandRecordValue.upsert({
        where: { recordId_section_shiftKey_field_position: { recordId, section, shiftKey, field, position } },
        create: { recordId, section, shiftKey, field, position, value },
        update: { value },
    });
}

// Paired with updateValueAtPosition for the report page's array-resync edit:
// after upserting positions 0..values.length-1, anything still on record at
// or beyond that length is a leftover from before the array was shortened
// (Minus) and must go, or it would reappear as trailing stale values on the
// next read.
function deleteValuesFromPosition(recordId, section, shiftKey, field, fromPosition) {
    return prisma.sandRecordValue.deleteMany({
        where: { recordId, section, shiftKey, field, position: { gte: fromPosition } },
    });
}

function findValues(recordId) {
    return prisma.sandRecordValue.findMany({
        where: { recordId },
        orderBy: [{ section: 'asc' }, { shiftKey: 'asc' }, { field: 'asc' }, { position: 'asc' }],
    });
}

function createTestParameter(recordId, data) {
    return prisma.sandRecordTestParameter.create({ data: { ...data, recordId } });
}

function findTestParameters(recordId) {
    return prisma.sandRecordTestParameter.findMany({ where: { recordId }, orderBy: { createdAt: 'asc' } });
}

// Table 5 rows have their own PK (unlike the generic path/value leaves above),
// so editing one already-saved row is a plain update by id.
function updateTestParameterRow(id, data) {
    return prisma.sandRecordTestParameter.update({ where: { id }, data });
}

function findDayAuthInfo(id) {
    return prisma.sandRecordDay.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function deleteDay(id) {
    return prisma.sandRecordDay.delete({ where: { id } });
}

async function findDayWithEverything(recordId) {
    const [day, values, testParameters] = await Promise.all([
        prisma.sandRecordDay.findUnique({ where: { id: recordId } }),
        findValues(recordId),
        findTestParameters(recordId),
    ]);
    return { ...day, values, testParameters };
}

async function findDaysPage({ from, to, plant, skip, take }) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const where = {};
    if (Object.keys(dateWhere).length) where.date = dateWhere;
    if (plant) where.plant = plant;

    const [total, days] = await Promise.all([
        prisma.sandRecordDay.count({ where }),
        prisma.sandRecordDay.findMany({
            where, orderBy: { date: 'desc' }, skip, take,
            include: { values: true, testParameters: { orderBy: { createdAt: 'asc' } } },
        }),
    ]);

    return { total, days };
}

function aggregateStats({ from, to, plant }) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    const recordWhere = {};
    if (Object.keys(dateWhere).length) recordWhere.date = dateWhere;
    if (plant) recordWhere.plant = plant;

    return prisma.sandRecordTestParameter.aggregate({
        where: Object.keys(recordWhere).length ? { record: recordWhere } : {},
        _avg: { permeability: true, moisture: true, gcsFdyA: true },
    });
}

module.exports = {
    ensureDayRow,
    findDayRow,
    updateDayFields,
    upsertScalarValue,
    updateValueAtPosition,
    deleteValuesFromPosition,
    appendArrayValues,
    findValues,
    createTestParameter,
    findTestParameters,
    updateTestParameterRow,
    findDayAuthInfo,
    deleteDay,
    findDayWithEverything,
    findDaysPage,
    aggregateStats,
};
