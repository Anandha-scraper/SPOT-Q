const { prisma } = require('../database/prisma');

// Turns a list of 'YYYY-MM-DD' date strings into the {day, count} shape the charts expect.
function toDayCounts(dates) {
    const counts = new Map();
    dates.forEach((date) => {
        const day = Number(date.slice(8, 10));
        counts.set(day, (counts.get(day) || 0) + 1);
    });
    return Array.from(counts, ([day, count]) => ({ day, count }));
}

async function countProcessEntries(monthPrefix, userId) {
    const rows = await prisma.processEntry.findMany({
        where: {
            process: { date: { startsWith: monthPrefix } },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { process: { select: { date: true } } },
    });
    return toDayCounts(rows.map((r) => r.process.date));
}

async function countTensileEntries(monthPrefix, userId) {
    const rows = await prisma.tensileEntry.findMany({
        where: {
            tensile: { date: { startsWith: monthPrefix } },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { tensile: { select: { date: true } } },
    });
    return toDayCounts(rows.map((r) => r.tensile.date));
}

async function countImpactEntries(monthPrefix, userId) {
    const rows = await prisma.impactEntry.findMany({
        where: {
            impact: { date: { startsWith: monthPrefix } },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { impact: { select: { date: true } } },
    });
    return toDayCounts(rows.map((r) => r.impact.date));
}

async function countMicroTensileEntries(monthPrefix, userId) {
    const rows = await prisma.microTensileEntry.findMany({
        where: {
            microTensile: { date: { startsWith: monthPrefix } },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { microTensile: { select: { date: true } } },
    });
    return toDayCounts(rows.map((r) => r.microTensile.date));
}

async function countMicroStructureEntries(monthPrefix, userId) {
    const rows = await prisma.microStructureEntry.findMany({
        where: {
            microStructure: { date: { startsWith: monthPrefix } },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { microStructure: { select: { date: true } } },
    });
    return toDayCounts(rows.map((r) => r.microStructure.date));
}

async function countQcProductionEntries(monthPrefix, userId) {
    const rows = await prisma.qcProduction.findMany({
        where: {
            date: { startsWith: monthPrefix },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { date: true },
    });
    return toDayCounts(rows.map((r) => r.date));
}

async function countMeltingLogEntries(monthPrefix, userId) {
    const rows = await prisma.meltingLogEntry.findMany({
        where: {
            primary: { meltingLog: { date: { startsWith: monthPrefix } } },
            ...(userId ? { createdBy: userId } : {}),
        },
        select: { primary: { select: { meltingLog: { select: { date: true } } } } },
    });
    return toDayCounts(rows.map((r) => r.primary.meltingLog.date));
}

// No createdBy on cupola entries (Mongoose never had one) — always department-wide, never per-user.
async function countCupolaLogEntries(monthPrefix) {
    const rows = await prisma.cupolaLogEntry.findMany({
        where: { primary: { cupolaLog: { date: { startsWith: monthPrefix } } } },
        select: { primary: { select: { cupolaLog: { select: { date: true } } } } },
    });
    return toDayCounts(rows.map((r) => r.primary.cupolaLog.date));
}

// No createdBy on DMM parameter entries either — same department-wide caveat as Cupola.
async function countDmmParameterEntries(monthPrefix) {
    const rows = await prisma.dmmParameterEntry.findMany({
        where: { machineShift: { dmmLog: { date: { startsWith: monthPrefix } } } },
        select: { machineShift: { select: { dmmLog: { select: { date: true } } } } },
    });
    return toDayCounts(rows.map((r) => r.machineShift.dmmLog.date));
}

module.exports = {
    countProcessEntries,
    countTensileEntries,
    countImpactEntries,
    countMicroTensileEntries,
    countMicroStructureEntries,
    countQcProductionEntries,
    countMeltingLogEntries,
    countCupolaLogEntries,
    countDmmParameterEntries,
};
