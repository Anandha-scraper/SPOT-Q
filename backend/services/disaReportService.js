const disaReportRepository = require('../repositories/disaReportRepository');
const { AppError } = require('../utils/AppError');

const MAX_MEMBERS = 4;

const toInt = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

// Mirrors the old formatTable's row filter exactly: a row is kept unless
// EVERY value is the literal empty string. Array-valued fields (delays'
// durationMinutes/fromTime/toTime, mouldHardness's mpPP/mpSP/bsPP/bsSP) are
// never === '', so rows in those two sections are effectively never dropped —
// a pre-existing quirk, reproduced faithfully rather than "fixed".
const hasData = (row) => Object.values(row ?? {}).some((v) => v !== '');

// Mirrors `row[key] || schemaMap[key]` — falls back to the section default
// when the incoming value is falsy.
const withDefault = (value, fallback) => (value || value === 0 ? value : fallback);

function zipParallelArrays(durationMinutes, fromTime, toTime) {
    const a = Array.isArray(durationMinutes) ? durationMinutes : [];
    const b = Array.isArray(fromTime) ? fromTime : [];
    const c = Array.isArray(toTime) ? toTime : [];
    const length = Math.max(a.length, b.length, c.length);

    return Array.from({ length }, (_, i) => ({
        position: i,
        durationMinutes: withDefault(a[i], ''),
        fromTime: withDefault(b[i], ''),
        toTime: withDefault(c[i], ''),
    }));
}

function zipPairs(pairs) {
    if (!Array.isArray(pairs)) return [];
    return pairs.map(([from, to], position) => ({
        position,
        fromValue: withDefault(from, ''),
        toValue: withDefault(to, ''),
    }));
}

async function ensureReport(date, shift) {
    if (!date) throw new AppError(400, 'Date is required.');
    return disaReportRepository.ensureReportRow(String(date).trim(), String(shift ?? '').trim());
}

// ── section writes ──────────────────────────────────────────────────────────

async function saveProduction(date, shift, rows) {
    const report = await ensureReport(date, shift);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'production updated.' };

    const startSNo = await disaReportRepository.countSection('disaProductionEntry', report.id);
    const mapped = kept.map((row) => ({
        counterNo: withDefault(row.counterNo, ''),
        componentName: withDefault(row.componentName, ''),
        produced: toInt(withDefault(row.produced, 0)),
        poured: toInt(withDefault(row.poured, 0)),
        cycleTime: withDefault(row.cycleTime, ''),
        mouldsPerHour: toInt(withDefault(row.mouldsPerHour, 0)),
        remarks: withDefault(row.remarks, ''),
    }));

    await disaReportRepository.appendSimpleRows('disaProductionEntry', report.id, mapped, startSNo);
    return { message: 'production updated.' };
}

async function saveNextShiftPlan(date, shift, rows) {
    const report = await ensureReport(date, shift);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'nextShiftPlan updated.' };

    const startSNo = await disaReportRepository.countSection('disaNextShiftPlanEntry', report.id);
    const mapped = kept.map((row) => ({
        componentName: withDefault(row.componentName, ''),
        plannedMoulds: toInt(withDefault(row.plannedMoulds, 0)),
        remarks: withDefault(row.remarks, ''),
    }));

    await disaReportRepository.appendSimpleRows('disaNextShiftPlanEntry', report.id, mapped, startSNo);
    return { message: 'nextShiftPlan updated.' };
}

async function saveDelays(date, shift, rows) {
    const report = await ensureReport(date, shift);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'delays updated.' };

    const startSNo = await disaReportRepository.countSection('disaDelayEntry', report.id);
    const mapped = kept.map((row) => ({
        delays: withDefault(row.delays, ''),
        intervals: zipParallelArrays(row.durationMinutes, row.fromTime, row.toTime),
    }));

    await disaReportRepository.appendDelayRows(report.id, mapped, startSNo);
    return { message: 'delays updated.' };
}

async function saveMouldHardness(date, shift, rows) {
    const report = await ensureReport(date, shift);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'mouldHardness updated.' };

    const startSNo = await disaReportRepository.countSection('disaMouldHardnessEntry', report.id);
    const mapped = kept.map((row) => ({
        componentName: withDefault(row.componentName, ''),
        remarks: withDefault(row.remarks, ''),
        readings: [
            ...zipPairs(row.mpPP).map((r) => ({ ...r, kind: 'mpPP' })),
            ...zipPairs(row.mpSP).map((r) => ({ ...r, kind: 'mpSP' })),
            ...zipPairs(row.bsPP).map((r) => ({ ...r, kind: 'bsPP' })),
            ...zipPairs(row.bsSP).map((r) => ({ ...r, kind: 'bsSP' })),
        ],
    }));

    await disaReportRepository.appendMouldHardnessRows(report.id, mapped, startSNo);
    return { message: 'mouldHardness updated.' };
}

async function savePatternTemp(date, shift, rows) {
    const report = await ensureReport(date, shift);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'patternTemp updated.' };

    const startSNo = await disaReportRepository.countSection('disaPatternTempEntry', report.id);
    const mapped = kept.map((row) => ({
        item: withDefault(row.item, ''),
        pp: toInt(withDefault(row.pp, 0)),
        sp: toInt(withDefault(row.sp, 0)),
    }));

    await disaReportRepository.appendSimpleRows('disaPatternTempEntry', report.id, mapped, startSNo);
    return { message: 'patternTemp updated.' };
}

async function saveEvents(date, shift, { significantEvent, maintenance, supervisorName }) {
    const report = await ensureReport(date, shift);
    const patch = {};
    if (significantEvent) patch.significantEvent = significantEvent;
    if (maintenance) patch.maintenance = maintenance;
    if (supervisorName) patch.supervisorName = supervisorName;

    if (Object.keys(patch).length) await disaReportRepository.updateReportFields(report.id, patch);
    return { message: 'events updated.' };
}

// ── primary ──────────────────────────────────────────────────────────────────

async function getPrimaryByDateShift(date, shift) {
    if (!date || !shift) throw new AppError(400, 'Date and shift are required.');

    const report = await disaReportRepository.findReportRow(String(date).trim(), String(shift).trim());
    if (!report) return null;

    const [production, nextShiftPlan, delays, mouldHardness, patternTemp, members] = await Promise.all([
        disaReportRepository.countSection('disaProductionEntry', report.id),
        disaReportRepository.countSection('disaNextShiftPlanEntry', report.id),
        disaReportRepository.countSection('disaDelayEntry', report.id),
        disaReportRepository.countSection('disaMouldHardnessEntry', report.id),
        disaReportRepository.countSection('disaPatternTempEntry', report.id),
        disaReportRepository.findMembers(report.id),
    ]);

    return {
        date: report.date,
        shift: report.shift,
        incharge: report.incharge,
        ppOperator: report.ppOperator,
        memberspresent: members.map((m) => m.name),
        productionCount: production,
        nextShiftPlanCount: nextShiftPlan,
        delaysCount: delays,
        mouldHardnessCount: mouldHardness,
        patternTempCount: patternTemp,
        significantEvent: report.significantEvent,
        maintenance: report.maintenance,
        supervisorName: report.supervisorName,
    };
}

async function savePrimary({ date, shift, incharge, ppOperator, members }) {
    if (!date || !shift) throw new AppError(400, 'Date and shift are required.');

    const report = await ensureReport(date, shift);
    const patch = {};
    if (incharge !== undefined && incharge !== null) patch.incharge = incharge.trim() || null;
    if (ppOperator !== undefined && ppOperator !== null) patch.ppOperator = ppOperator.trim() || null;

    if (Object.keys(patch).length) await disaReportRepository.updateReportFields(report.id, patch);

    let memberNames = null;
    if (members !== undefined && members !== null) {
        const filtered = Array.isArray(members) ? members.filter((m) => m && m.trim() !== '') : [];
        if (filtered.length > MAX_MEMBERS) throw new AppError(400, 'Maximum 4 members allowed.');
        await disaReportRepository.replaceMembers(report.id, filtered);
        memberNames = filtered;
    }

    const updated = await disaReportRepository.findReportRow(report.date, report.shift);

    return {
        date: updated.date,
        shift: updated.shift,
        incharge: updated.incharge,
        ppOperator: updated.ppOperator,
        memberspresent: memberNames ?? [],
    };
}

// ── reads ────────────────────────────────────────────────────────────────────

async function getReportsForDate(date) {
    if (!date) throw new AppError(400, 'Date is required.');
    return disaReportRepository.findReportsForDate(String(date).trim());
}

function toWireReport(report) {
    return {
        _id: report.id,
        date: report.date,
        shift: report.shift,
        incharge: report.incharge,
        ppOperator: report.ppOperator,
        memberspresent: report.members.map((m) => m.name),
        productionDetails: report.production.map(({ id, disaReportId, createdAt, ...r }) => r),
        nextShiftPlan: report.nextShiftPlan.map(({ id, disaReportId, createdAt, ...r }) => r),
        delays: report.delays.map(({ intervals, id, disaReportId, createdAt, ...r }) => ({
            ...r,
            durationMinutes: intervals.map((iv) => iv.durationMinutes),
            fromTime: intervals.map((iv) => iv.fromTime),
            toTime: intervals.map((iv) => iv.toTime),
        })),
        mouldHardness: report.mouldHardness.map(({ readings, id, disaReportId, createdAt, ...r }) => ({
            ...r,
            mpPP: readings.filter((rd) => rd.kind === 'mpPP').map((rd) => [rd.fromValue, rd.toValue]),
            mpSP: readings.filter((rd) => rd.kind === 'mpSP').map((rd) => [rd.fromValue, rd.toValue]),
            bsPP: readings.filter((rd) => rd.kind === 'bsPP').map((rd) => [rd.fromValue, rd.toValue]),
            bsSP: readings.filter((rd) => rd.kind === 'bsSP').map((rd) => [rd.fromValue, rd.toValue]),
        })),
        patternTemperature: report.patternTemp.map(({ id, disaReportId, createdAt, ...r }) => r),
        significantEvent: report.significantEvent,
        maintenance: report.maintenance,
        supervisorName: report.supervisorName,
    };
}

async function getReportsInRange(startDate, endDate) {
    if (!startDate || !endDate) throw new AppError(400, 'Range required.');
    const reports = await disaReportRepository.findReportsInRange(startDate, endDate);
    return reports.map(toWireReport);
}

module.exports = {
    saveProduction,
    saveNextShiftPlan,
    saveDelays,
    saveMouldHardness,
    savePatternTemp,
    saveEvents,
    getPrimaryByDateShift,
    savePrimary,
    getReportsForDate,
    getReportsInRange,
};
