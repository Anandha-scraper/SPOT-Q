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

// DMM stores shift as bare "1"/"2"/"3" (dmmLogService.js); DISA stores "Shift 1"/"Shift
// 2"/"Shift 3" (ShiftDropdown). Normalize both to a shared shift1/shift2/shift3 key.
function normalizeShiftKey(shift) {
    const match = String(shift).match(/[123]/);
    return match ? `shift${match[0]}` : null;
}

// [{date, shift}] -> [{day, shift1, shift2, shift3}], for the Moulding personal chart's
// per-shift breakdown tooltip.
function toDayShiftCounts(rows) {
    const byDay = new Map();
    rows.forEach(({ date, shift }) => {
        const key = normalizeShiftKey(shift);
        if (!key) return;
        const day = Number(date.slice(8, 10));
        if (!byDay.has(day)) byDay.set(day, { shift1: 0, shift2: 0, shift3: 0 });
        byDay.get(day)[key] += 1;
    });
    return Array.from(byDay, ([day, shifts]) => ({ day, ...shifts }));
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

// Shift-aware sibling of countDmmParameterEntries, for the Moulding user's own
// two-line (Disamatic/DMM) chart — day-only counts don't carry enough detail
// for its per-shift tooltip breakdown.
async function countDmmParameterEntriesByShift(monthPrefix) {
    const rows = await prisma.dmmParameterEntry.findMany({
        where: { machineShift: { dmmLog: { date: { startsWith: monthPrefix } } } },
        select: { machineShift: { select: { shift: true, dmmLog: { select: { date: true } } } } },
    });
    return toDayShiftCounts(rows.map((r) => ({ date: r.machineShift.dmmLog.date, shift: r.machineShift.shift })));
}

// DISA has no single per-entry "count" the way DMM's parameter rows do (see
// statsService.js) — a DISA shift's activity spans all 6 of DisaReport's child
// tables, so this sums rows across all of them. Members is a capped-at-4 crew
// roster, not a repeatable log like the other 5 — included anyway per an
// explicit product decision (see backend.md's changelog) even though it makes
// the Disamatic total not purely "activity volume" the way DMM's is.
async function countDisaEntriesByShift(monthPrefix) {
    const where = { report: { date: { startsWith: monthPrefix } } };
    const select = { report: { select: { date: true, shift: true } } };
    const [members, production, nextShiftPlan, delays, mouldHardness, patternTemp] = await Promise.all([
        prisma.disaReportMember.findMany({ where, select }),
        prisma.disaProductionEntry.findMany({ where, select }),
        prisma.disaNextShiftPlanEntry.findMany({ where, select }),
        prisma.disaDelayEntry.findMany({ where, select }),
        prisma.disaMouldHardnessEntry.findMany({ where, select }),
        prisma.disaPatternTempEntry.findMany({ where, select }),
    ]);
    const rows = [...members, ...production, ...nextShiftPlan, ...delays, ...mouldHardness, ...patternTemp]
        .map((r) => ({ date: r.report.date, shift: r.report.shift }));
    return toDayShiftCounts(rows);
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
    countDmmParameterEntriesByShift,
    countDisaEntriesByShift,
};
