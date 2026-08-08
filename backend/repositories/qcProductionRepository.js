const { prisma } = require('../database/prisma');

const VALUE_KINDS = ['ts', 'ys', 'el'];
const NUMERIC_KIND = 'ts';

const includeValues = { values: { orderBy: { position: 'asc' } } };

function toValueRows(valueSets) {
    return Object.entries(valueSets).flatMap(([kind, values]) =>
        values.map((value, position) => ({ kind, position, value: String(value) }))
    );
}

function toWireRow({ values, ...entry }) {
    const grouped = { ts: [], ys: [], el: [] };

    for (const row of values) {
        if (!VALUE_KINDS.includes(row.kind)) continue;
        grouped[row.kind].push(row.kind === NUMERIC_KIND ? Number(row.value) : row.value);
    }

    return { ...entry, ...grouped };
}

async function createEntry(data, valueSets) {
    const row = await prisma.qcProduction.create({
        data: { ...data, values: { create: toValueRows(valueSets) } },
        include: includeValues,
    });

    return toWireRow(row);
}

async function findEntries({ from, to } = {}) {
    const where = {};
    if (from) where.date = { ...where.date, gte: from };
    if (to) where.date = { ...where.date, lte: to };

    const rows = await prisma.qcProduction.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'asc' }],
        include: includeValues,
    });

    return rows.map(toWireRow);
}

function findEntryAuthInfo(id) {
    return prisma.qcProduction.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

async function updateEntry(id, data, valueSets) {
    const replacedKinds = Object.keys(valueSets);

    if (!replacedKinds.length) {
        const row = await prisma.qcProduction.update({
            where: { id },
            data,
            include: includeValues,
        });
        return toWireRow(row);
    }

    const row = await prisma.$transaction(async (tx) => {
        await tx.qcProductionValue.deleteMany({
            where: { qcProductionId: id, kind: { in: replacedKinds } },
        });

        return tx.qcProduction.update({
            where: { id },
            data: { ...data, values: { create: toValueRows(valueSets) } },
            include: includeValues,
        });
    });

    return toWireRow(row);
}

function deleteEntry(id) {
    return prisma.qcProduction.delete({ where: { id } });
}

async function findPartNames() {
    const rows = await prisma.qcProduction.findMany({
        where: { partName: { notIn: ['', '-'] } },
        distinct: ['partName'],
        select: { partName: true },
        orderBy: { partName: 'asc' },
    });

    return rows.map((row) => row.partName);
}

module.exports = {
    VALUE_KINDS,
    createEntry,
    findEntries,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
    findPartNames,
};
