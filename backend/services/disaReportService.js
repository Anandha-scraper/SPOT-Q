const disaReportRepository = require('../repositories/disaReportRepository');
const { AppError } = require('../utils/AppError');
const { buildColumns, invalidInput, requireEditableFields } = require('../utils/fieldValidation');

const MAX_MEMBERS = 4;

const toInt = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

// A row is kept unless every value is the literal empty string — array-valued fields (delays'/mouldHardness's arrays) are never === '', a pre-existing quirk reproduced faithfully, not fixed.
const hasData = (row) => Object.values(row ?? {}).some((v) => v !== '');

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

// Readings are single values stored in fromValue; toValue is vestigial (see
// backend.md). A legacy [from, to] element is still accepted so an older client
// cannot 500 the endpoint.
function zipReadings(values) {
    if (!Array.isArray(values)) return [];
    return values.map((value, position) => ({
        position,
        fromValue: withDefault(Array.isArray(value) ? value[0] : value, ''),
        toValue: '',
    }));
}

// shift is half the @@unique key, so a blank one silently upserts a second
// report for the same day instead of failing — hence the explicit reject.
async function ensureReport(date, shift, createdBy) {
    const trimmedShift = String(shift ?? '').trim();
    if (!date || !trimmedShift) throw new AppError(400, 'Date and shift are required.');
    return disaReportRepository.ensureReportRow(String(date).trim(), trimmedShift, createdBy);
}

// ── section writes ──────────────────────────────────────────────────────────

async function saveProduction(date, shift, rows, userId) {
    const report = await ensureReport(date, shift, userId);
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
        createdBy: userId ?? null,
    }));

    await disaReportRepository.appendSimpleRows('disaProductionEntry', report.id, mapped, startSNo);
    return { message: 'production updated.' };
}

async function saveNextShiftPlan(date, shift, rows, userId) {
    const report = await ensureReport(date, shift, userId);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'nextShiftPlan updated.' };

    const startSNo = await disaReportRepository.countSection('disaNextShiftPlanEntry', report.id);
    const mapped = kept.map((row) => ({
        componentName: withDefault(row.componentName, ''),
        plannedMoulds: toInt(withDefault(row.plannedMoulds, 0)),
        remarks: withDefault(row.remarks, ''),
        createdBy: userId ?? null,
    }));

    await disaReportRepository.appendSimpleRows('disaNextShiftPlanEntry', report.id, mapped, startSNo);
    return { message: 'nextShiftPlan updated.' };
}

async function saveDelays(date, shift, rows, userId) {
    const report = await ensureReport(date, shift, userId);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'delays updated.' };

    const startSNo = await disaReportRepository.countSection('disaDelayEntry', report.id);
    const mapped = kept.map((row) => ({
        delays: withDefault(row.delays, ''),
        intervals: zipParallelArrays(row.durationMinutes, row.fromTime, row.toTime),
        createdBy: userId ?? null,
    }));

    await disaReportRepository.appendDelayRows(report.id, mapped, startSNo);
    return { message: 'delays updated.' };
}

async function saveMouldHardness(date, shift, rows, userId) {
    const report = await ensureReport(date, shift, userId);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'mouldHardness updated.' };

    const startSNo = await disaReportRepository.countSection('disaMouldHardnessEntry', report.id);
    const mapped = kept.map((row) => ({
        componentName: withDefault(row.componentName, ''),
        remarks: withDefault(row.remarks, ''),
        createdBy: userId ?? null,
        readings: [
            ...zipReadings(row.mpPP).map((r) => ({ ...r, kind: 'mpPP' })),
            ...zipReadings(row.mpSP).map((r) => ({ ...r, kind: 'mpSP' })),
            ...zipReadings(row.bsPP).map((r) => ({ ...r, kind: 'bsPP' })),
            ...zipReadings(row.bsSP).map((r) => ({ ...r, kind: 'bsSP' })),
        ],
    }));

    await disaReportRepository.appendMouldHardnessRows(report.id, mapped, startSNo);
    return { message: 'mouldHardness updated.' };
}

async function savePatternTemp(date, shift, rows, userId) {
    const report = await ensureReport(date, shift, userId);
    const kept = (rows ?? []).filter(hasData);
    if (!kept.length) return { message: 'patternTemp updated.' };

    const startSNo = await disaReportRepository.countSection('disaPatternTempEntry', report.id);
    const mapped = kept.map((row) => ({
        item: withDefault(row.item, ''),
        pp: toInt(withDefault(row.pp, 0)),
        sp: toInt(withDefault(row.sp, 0)),
        createdBy: userId ?? null,
    }));

    await disaReportRepository.appendSimpleRows('disaPatternTempEntry', report.id, mapped, startSNo);
    return { message: 'patternTemp updated.' };
}

// ── per-row edit/delete ─────────────────────────────────────────────────────
// Delays/MouldHardness only expose their own scalar columns (delay reason /
// component name+remarks) — the parallel-array child rows have no generic
// multi-array edit UI on the frontend yet, so those stay create-only.

async function updateProductionEntry(id, body) {
    const { data, invalid } = buildColumns(body, {
        raw: ['counterNo', 'componentName', 'cycleTime', 'remarks'],
        integers: ['produced', 'poured', 'mouldsPerHour'],
    });
    if (invalid.length) throw invalidInput(invalid);
    // produced/poured/mouldsPerHour are Int @default(0), not nullable — a
    // cleared field substitutes the column's own default rather than being
    // rejected (same fix as the Micro Tensile/Micro Structure NO_VALUE
    // substitution, see backend.md).
    ['produced', 'poured', 'mouldsPerHour'].forEach((f) => { if (data[f] === null) data[f] = 0; });
    requireEditableFields(data);
    return disaReportRepository.updateProductionEntry(id, data);
}

async function updateNextShiftPlanEntry(id, body) {
    const { data, invalid } = buildColumns(body, {
        raw: ['componentName', 'remarks'],
        integers: ['plannedMoulds'],
    });
    if (invalid.length) throw invalidInput(invalid);
    if (data.plannedMoulds === null) data.plannedMoulds = 0;
    requireEditableFields(data);
    return disaReportRepository.updateNextShiftPlanEntry(id, data);
}

async function updateDelayEntry(id, body) {
    const { data, invalid } = buildColumns(body, { raw: ['delays'] });
    if (invalid.length) throw invalidInput(invalid);

    // durationMinutes/fromTime/toTime are an inherently coupled triple per
    // index — buildColumns only extracts 'delays' above, but body itself
    // still carries the raw arrays, so they're read directly here.
    const hasIntervalEdit = body.durationMinutes !== undefined || body.fromTime !== undefined || body.toTime !== undefined;
    if (!Object.keys(data).length && !hasIntervalEdit) throw new AppError(400, 'No editable fields were provided.');

    const ops = [];
    if (Object.keys(data).length) ops.push(disaReportRepository.updateDelayEntry(id, data));
    if (hasIntervalEdit) ops.push(disaReportRepository.replaceDelayIntervals(id, zipParallelArrays(body.durationMinutes, body.fromTime, body.toTime)));
    return Promise.all(ops);
}

async function updateMouldHardnessEntry(id, body) {
    const { data, invalid } = buildColumns(body, { raw: ['componentName', 'remarks'] });
    if (invalid.length) throw invalidInput(invalid);

    // mpPP/mpSP/bsPP/bsSP are independent of each other — only replace the
    // kind(s) actually present in body, never all 4, or editing one kind
    // would silently wipe the other 3's saved readings.
    const editedKinds = ['mpPP', 'mpSP', 'bsPP', 'bsSP'].filter((k) => body[k] !== undefined);
    if (!Object.keys(data).length && !editedKinds.length) throw new AppError(400, 'No editable fields were provided.');

    const ops = [];
    if (Object.keys(data).length) ops.push(disaReportRepository.updateMouldHardnessEntry(id, data));
    editedKinds.forEach((kind) => {
        const values = (Array.isArray(body[kind]) ? body[kind] : []).map((v) => (Array.isArray(v) ? v[0] : v));
        ops.push(disaReportRepository.replaceMouldHardnessReadingsForKind(id, kind, values));
    });
    return Promise.all(ops);
}

async function updatePatternTempEntry(id, body) {
    const { data, invalid } = buildColumns(body, {
        raw: ['item'],
        integers: ['pp', 'sp'],
    });
    if (invalid.length) throw invalidInput(invalid);
    ['pp', 'sp'].forEach((f) => { if (data[f] === null) data[f] = 0; });
    requireEditableFields(data);
    return disaReportRepository.updatePatternTempEntry(id, data);
}

// Whole-report edit (report page's single Edit/Save, not per-row): a flat
// list of {id, data} per section, applied to the existing per-row update
// functions above and returned as one refreshed report — mirrors
// sandRecordService.js#updateRecord's testParameterEdits handling, extended
// from one child table to five.
const SECTION_UPDATERS = {
    productionEdits: updateProductionEntry,
    nextShiftPlanEdits: updateNextShiftPlanEntry,
    delaysEdits: updateDelayEntry,
    mouldHardnessEdits: updateMouldHardnessEntry,
    patternTempEdits: updatePatternTempEntry,
};

// Same section-name strings createDismaticReport's switch already uses.
const SECTION_MODEL_BY_KEY = {
    production: 'disaProductionEntry',
    nextShiftPlan: 'disaNextShiftPlanEntry',
    delays: 'disaDelayEntry',
    mouldHardness: 'disaMouldHardnessEntry',
    patternTemp: 'disaPatternTempEntry',
};

async function updateReportEntries(reportId, body) {
    const ops = [];
    for (const [key, updater] of Object.entries(SECTION_UPDATERS)) {
        for (const edit of body?.[key] ?? []) {
            if (!edit?.id) continue;
            ops.push(updater(edit.id, edit.data ?? {}));
        }
    }

    // Primary fields (Incharge/PP Operator/Members Present) and Events fields
    // (Significant Event/Maintenance/Supervisor Name) live on the report row
    // itself, not a child table — same allowlisted patch shape savePrimary/
    // saveEvents already use, so the report page's inline edit can correct
    // them too.
    const patch = {};
    if (body?.incharge !== undefined) patch.incharge = String(body.incharge ?? '').trim() || null;
    if (body?.ppOperator !== undefined) patch.ppOperator = String(body.ppOperator ?? '').trim() || null;
    if (body?.significantEvent !== undefined) patch.significantEvent = String(body.significantEvent ?? '').trim() || null;
    if (body?.maintenance !== undefined) patch.maintenance = String(body.maintenance ?? '').trim() || null;
    if (body?.supervisorName !== undefined) patch.supervisorName = String(body.supervisorName ?? '').trim() || null;
    if (Object.keys(patch).length) ops.push(disaReportRepository.updateReportFields(reportId, patch));

    if (body?.members !== undefined) {
        const filtered = Array.isArray(body.members) ? body.members.filter((m) => m && m.trim() !== '') : [];
        if (filtered.length > MAX_MEMBERS) throw new AppError(400, 'Maximum 4 members allowed.');
        ops.push(disaReportRepository.replaceMembers(reportId, filtered));
    }

    await Promise.all(ops);

    // Deletes remaining siblings' sNo, so it must fully complete before the
    // refetch below rather than racing inside Promise.all(ops) above.
    if (body?.deleteRow) {
        const model = SECTION_MODEL_BY_KEY[body.deleteRow.table];
        if (!model) throw new AppError(400, 'Unknown table for row deletion.');
        const deleted = await disaReportRepository.deleteRowAndRenumber(model, body.deleteRow.id, reportId);
        if (!deleted) throw new AppError(404, 'Row not found.');
    }

    const full = await disaReportRepository.findReportWithEverything(reportId);
    return toWireReport(full);
}

function deleteReport(reportId) {
    return disaReportRepository.deleteReport(reportId);
}

// Only the 3 tables with a componentName column — Delays/PatternTemp use
// different fields ('delays'/'item') and aren't relevant here.
const COMPONENT_NAME_MODEL_BY_KEY = {
    production: 'disaProductionEntry',
    nextShiftPlan: 'disaNextShiftPlanEntry',
    mouldHardness: 'disaMouldHardnessEntry',
};
const SUGGESTION_WINDOW_DAYS = 90;

const suggestionCutoffDate = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SUGGESTION_WINDOW_DAYS);
    return cutoff.toISOString().split('T')[0];
};

function listComponentNames(table) {
    const model = COMPONENT_NAME_MODEL_BY_KEY[table];
    if (!model) throw new AppError(400, 'Unknown table for component name suggestions.');
    return disaReportRepository.findDistinctFieldValues(model, 'componentName', suggestionCutoffDate());
}

function listPatternTempItems() {
    return disaReportRepository.findDistinctFieldValues('disaPatternTempEntry', 'item', suggestionCutoffDate());
}

function loadReportForAuth(id) {
    return disaReportRepository.findReportForAuth(id);
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

async function savePrimary({ date, shift, incharge, ppOperator, members, userId }) {
    if (!date || !shift) throw new AppError(400, 'Date and shift are required.');

    const report = await ensureReport(date, shift, userId);
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

// Keeps id (as _id)/createdAt/createdBy on every child row — EntryActions.jsx
// needs all three (row._id to address the edit/delete endpoint, createdAt +
// createdBy to compute the owner-only edit-window countdown client-side).
// Only the internal disaReportId FK is dropped.
function toWireChildRow({ id, disaReportId, ...r }) {
    return { ...r, _id: id };
}

function toWireReport(report) {
    return {
        _id: report.id,
        date: report.date,
        shift: report.shift,
        incharge: report.incharge,
        ppOperator: report.ppOperator,
        // Report-page whole-entry edit/delete permission gating (mirrors
        // sandRecordService.js#toWireDay's createdBy/createdAt).
        createdBy: report.createdBy,
        createdAt: report.createdAt,
        memberspresent: report.members.map((m) => m.name),
        productionDetails: report.production.map(toWireChildRow),
        nextShiftPlan: report.nextShiftPlan.map(toWireChildRow),
        delays: report.delays.map(({ intervals, ...row }) => {
            const { id, disaReportId, ...r } = row;
            return {
                ...r,
                _id: id,
                durationMinutes: intervals.map((iv) => iv.durationMinutes),
                fromTime: intervals.map((iv) => iv.fromTime),
                toTime: intervals.map((iv) => iv.toTime),
            };
        }),
        mouldHardness: report.mouldHardness.map(({ readings, ...row }) => {
            const { id, disaReportId, ...r } = row;
            return {
                ...r,
                _id: id,
                mpPP: readings.filter((rd) => rd.kind === 'mpPP').map((rd) => rd.fromValue),
                mpSP: readings.filter((rd) => rd.kind === 'mpSP').map((rd) => rd.fromValue),
                bsPP: readings.filter((rd) => rd.kind === 'bsPP').map((rd) => rd.fromValue),
                bsSP: readings.filter((rd) => rd.kind === 'bsSP').map((rd) => rd.fromValue),
            };
        }),
        patternTemperature: report.patternTemp.map(toWireChildRow),
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

// One-off repair for reports forked by the missing-shift write bug (see
// backend.md's 2026-08-10 entry): a phantom is mergeable only when its date
// has exactly one real-shift sibling to merge into — an ambiguous date (0 or
// 2+ siblings) is listed as skipped and never guessed at. Read-only unless
// `apply` is true; called from scripts/repairDisaShiftSplit.js.
async function repairShiftSplit({ apply = false } = {}) {
    const phantoms = await disaReportRepository.findPhantomShiftReports();

    // One entry per phantom, in the same order phantoms were found (date
    // ascending) — kept as a single stream, not split into two arrays, so a
    // caller printing them can reproduce the original interleaved MERGE/SKIP
    // report exactly rather than grouping all merges before all skips.
    const results = [];
    for (const phantom of phantoms) {
        const siblings = await disaReportRepository.findSiblingReports(phantom.date);
        const counts = await disaReportRepository.countReportChildren(phantom.id);

        if (siblings.length === 1) {
            results.push({
                type: 'merge', date: phantom.date, phantomId: phantom.id,
                targetId: siblings[0].id, targetShift: siblings[0].shift, counts,
            });
        } else {
            results.push({ type: 'skip', date: phantom.date, siblingShifts: siblings.map((s) => s.shift), counts });
        }
    }

    const plan = results.filter((r) => r.type === 'merge');

    if (apply) {
        for (const row of plan) {
            await disaReportRepository.mergePhantomReport(row.phantomId, row.targetId);
        }
    }

    return { phantomCount: phantoms.length, results, mergedCount: plan.length, applied: apply };
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
    repairShiftSplit,
    updateReportEntries,
    deleteReport,
    loadReportForAuth,
    listComponentNames,
    listPatternTempItems,
};
