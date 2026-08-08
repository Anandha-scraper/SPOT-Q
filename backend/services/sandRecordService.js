const sandRecordRepository = require('../repositories/sandRecordRepository');
const { AppError } = require('../utils/AppError');
const { buildColumns } = require('../utils/fieldValidation');

const VALID_PLANTS = ['Eirich', 'Disa', 'Foundry-A'];

const TABLE1_SHIFTS = ['shiftI', 'shiftII', 'shiftIII'];
const TABLE1_ARRAY_FIELDS = ['rSand', 'nSand', 'mixingMode', 'bentonite', 'coalDustPremix'];
const TABLE1_BATCH_FIELDS = ['bentonite', 'coalDust', 'premix'];

const TABLE2_SHIFTS = ['shiftI', 'ShiftII', 'ShiftIII'];
const TABLE2_SCALAR_FIELDS = ['totalClay', 'activeClay', 'deadClay', 'vcm', 'loi', 'afsNo', 'fines'];

const TABLE3_SHIFTS = ['ShiftI', 'ShiftII', 'ShiftIII'];
const TABLE3_ARRAY_FIELDS = [
    ['mixno.start', (shift) => shift.mixno?.start],
    ['mixno.end', (shift) => shift.mixno?.end],
    ['mixno.total', (shift) => shift.mixno?.total],
    ['numberOfMixRejected', (shift) => shift.numberOfMixRejected],
    ['returnSandHopperLevel', (shift) => shift.returnSandHopperLevel],
];

const TABLE4_FRIABILITY_SHIFTS = ['shiftI', 'shiftII', 'shiftIII'];

// Wire -> column, for the handful of testParameter fields that differ.
const TESTPARAM_WIRE_TO_COLUMN = {
    CompactabilitySettings: 'compactabilitySettings',
};
// gcsFdyA/gcsFdyB, bentoniteKgs/Percent, premixKgs/Percent, coalDustKgs/Percent
// are radio-driven: the option the user didn't pick stores the '-' sentinel
// rather than a numeric 0, which would be indistinguishable from a genuine
// zero reading — so they're raw/String, not numbers, matching `time`.
const TESTPARAM_STRING_FIELDS = [
    'time', 'mixno', 'itemName', 'remarks',
    'gcsFdyA', 'gcsFdyB',
    'bentoniteKgs', 'bentonitePercent', 'bentoniteCheckpoint',
    'premixKgs', 'premixPercent', 'coalDustKgs', 'coalDustPercent',
];
const TESTPARAM_NUMBER_FIELDS = [
    'sno', 'permeability', 'wts', 'moisture',
    'compactability', 'compressibility', 'waterLitre',
    'sandTempBC', 'sandTempWU', 'sandTempSSUmax',
    'newSandKgs', 'mould',
    'bentoniteWithPremixKgs', 'bentoniteWithPremixPercent',
    'lc', 'compactabilitySettings', 'mouldStrength', 'shearStrengthSetting', 'preparedSandlumps',
];

const nonEmpty = (value) => typeof value === 'string' && value.trim() !== '';
const filterNonEmpty = (values) => (Array.isArray(values) ? values.filter(nonEmpty) : []);

function getCurrentDate() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function requirePlant(plant) {
    if (!VALID_PLANTS.includes(plant)) {
        throw new AppError(400, 'A valid plant ("Eirich", "Disa", or "Foundry-A") is required.');
    }
}

async function ensureRecord(date, plant, createdBy) {
    requirePlant(plant);
    return sandRecordRepository.ensureDayRow(String(date || getCurrentDate()).trim(), plant, createdBy);
}

// ── table writes ─────────────────────────────────────────────────────────────

async function saveTable1(recordId, body) {
    for (const shift of TABLE1_SHIFTS) {
        const shiftData = body[shift];
        if (!shiftData) continue;
        for (const field of TABLE1_ARRAY_FIELDS) {
            const values = filterNonEmpty(shiftData[field]);
            if (values.length) await sandRecordRepository.appendArrayValues(recordId, 'sandShifts', shift, field, values);
        }
    }

    if (body.batchNo) {
        for (const field of TABLE1_BATCH_FIELDS) {
            if (nonEmpty(body.batchNo[field])) {
                await sandRecordRepository.upsertScalarValue(recordId, 'sandShifts', 'batchNo', field, body.batchNo[field]);
            }
        }
    }
}

async function saveTable2(recordId, body) {
    for (const shift of TABLE2_SHIFTS) {
        const shiftData = body[shift];
        if (!shiftData) continue;
        for (const field of TABLE2_SCALAR_FIELDS) {
            if (nonEmpty(shiftData[field])) {
                await sandRecordRepository.upsertScalarValue(recordId, 'clayShifts', shift, field, shiftData[field]);
            }
        }
    }
}

async function saveTable3(recordId, body) {
    for (const shift of TABLE3_SHIFTS) {
        const shiftData = body[shift];
        if (!shiftData) continue;
        for (const [field, getValues] of TABLE3_ARRAY_FIELDS) {
            const values = filterNonEmpty(getValues(shiftData));
            if (values.length) await sandRecordRepository.appendArrayValues(recordId, 'mixshifts', shift, field, values);
        }
    }
}

async function saveTable4(recordId, body) {
    const patch = {};
    if (nonEmpty(body.sandLump)) patch.sandLump = body.sandLump;
    if (nonEmpty(body.newSandWt)) patch.newSandWt = body.newSandWt;
    if (Object.keys(patch).length) await sandRecordRepository.updateDayFields(recordId, patch);

    if (body.sandFriability) {
        for (const shift of TABLE4_FRIABILITY_SHIFTS) {
            if (nonEmpty(body.sandFriability[shift])) {
                await sandRecordRepository.upsertScalarValue(recordId, 'sandFriability', shift, 'value', body.sandFriability[shift]);
            }
        }
    }
}

function toColumnBody(wireBody) {
    const out = {};
    for (const key of Object.keys(wireBody ?? {})) {
        out[TESTPARAM_WIRE_TO_COLUMN[key] ?? key] = wireBody[key];
    }
    return out;
}

// Nested wire object -> its flat columns, added to `flattened` only when present, so buildColumns can tell "absent" from "present but blank" (else an explicit null hits a NOT NULL @default(0) column and Prisma rejects the create).
const NESTED_NUMBER_GROUPS = [
    ['sandTemp', { BC: 'sandTempBC', WU: 'sandTempWU', SSUmax: 'sandTempSSUmax' }],
    ['bentoniteWithPremix', { Kgs: 'bentoniteWithPremixKgs', Percent: 'bentoniteWithPremixPercent' }],
    ['bentonite', { Kgs: 'bentoniteKgs', Percent: 'bentonitePercent', Checkpoint: 'bentoniteCheckpoint' }],
    ['premix', { Kgs: 'premixKgs', Percent: 'premixPercent' }],
    ['coalDust', { Kgs: 'coalDustKgs', Percent: 'coalDustPercent' }],
];

async function saveTable5(recordId, body) {
    if (!body || typeof body !== 'object') return;

    const flattened = toColumnBody(body);
    for (const [wireKey, columnMap] of NESTED_NUMBER_GROUPS) {
        delete flattened[wireKey];
        if (!body[wireKey]) continue;
        for (const [innerKey, column] of Object.entries(columnMap)) {
            if (body[wireKey][innerKey] !== undefined) flattened[column] = body[wireKey][innerKey];
        }
    }

    const { data } = buildColumns(flattened, { raw: TESTPARAM_STRING_FIELDS, numbers: TESTPARAM_NUMBER_FIELDS });

    // Only the remaining Float @default(0) columns can produce null here
    // (raw/String fields always come back as a string from toRawString) —
    // deleting a null key lets the DB default apply instead of violating
    // the NOT NULL constraint.
    for (const key of Object.keys(data)) {
        if (data[key] === null) delete data[key];
    }

    await sandRecordRepository.createTestParameter(recordId, data);
}

const TABLE_HANDLERS = { 1: saveTable1, 2: saveTable2, 3: saveTable3, 4: saveTable4, 5: saveTable5 };

async function createTableEntry({ tableNum, plant, ...body }, userId) {
    const num = Number(tableNum ?? body.tableNum);
    const handler = TABLE_HANDLERS[num];
    if (!handler) throw new AppError(400, 'Invalid Table Number');

    const targetDate = body.date || getCurrentDate();
    const resolvedPlant = plant || body.plant;
    const record = await ensureRecord(targetDate, resolvedPlant, userId);

    await handler(record.id, body);

    return { date: record.date, plant: record.plant, message: `Table ${num} recorded for ${record.date}` };
}

// ── reads ────────────────────────────────────────────────────────────────────

function toWireDay(day) {
    const sections = {};
    for (const v of day.values) {
        sections[v.section] ??= {};
        sections[v.section][v.shiftKey] ??= {};
        const bucket = sections[v.section][v.shiftKey];

        if (v.field.includes('.')) {
            const [outer, inner] = v.field.split('.');
            bucket[outer] ??= {};
            bucket[outer][inner] ??= [];
            bucket[outer][inner][v.position] = v.value;
        } else if (v.shiftKey === 'batchNo' || v.section === 'sandFriability' || v.section === 'clayShifts') {
            bucket[v.field] = v.value; // scalar
        } else {
            bucket[v.field] ??= [];
            bucket[v.field][v.position] = v.value;
        }
    }

    return {
        _id: day.id,
        date: day.date,
        plant: day.plant,
        sandLump: day.sandLump,
        newSandWt: day.newSandWt,
        // Report-page inline edit/delete permission gating (EntryActions.jsx-style).
        createdBy: day.createdBy,
        createdAt: day.createdAt,
        sandShifts: sections.sandShifts ?? {},
        clayShifts: sections.clayShifts ?? {},
        mixshifts: sections.mixshifts ?? {},
        sandFriability: Object.fromEntries(
            Object.entries(sections.sandFriability ?? {}).map(([shift, bucket]) => [shift, bucket.value])
        ),
        // _id kept (unlike the other stripped fields) so the report page's
        // inline edit can address a specific historical Table 5 row.
        testParameter: (day.testParameters ?? []).map(({ id, recordId, createdAt, ...p }) => ({ _id: id, ...p })),
    };
}

async function getAllEntries({ startDate, endDate, plant, page = 1, limit = 10 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const { total, days } = await sandRecordRepository.findDaysPage({
        from: startDate, to: endDate, plant, skip, take: Number(limit),
    });

    return { total, pages: Math.ceil(total / Number(limit)), data: days.map(toWireDay) };
}

async function getEntryByDate(date, plant) {
    const day = await sandRecordRepository.findDayRow(date, plant);
    if (!day) return null;
    const full = await sandRecordRepository.findDayWithEverything(day.id);
    return toWireDay(full);
}

async function getEntryById(id) {
    const full = await sandRecordRepository.findDayWithEverything(id);
    if (!full || !full.id) return null;
    return toWireDay(full);
}

// Persists just the Date+Plant combination (no table data) — lets the entry
// page lock the primary combination before any section is filled in, same as
// the other Sand Lab departments' "Save Primary" step.
async function savePrimary({ date, plant }, userId) {
    const record = await ensureRecord(date, plant, userId);
    return { date: record.date, plant: record.plant };
}

// Report-page inline edit: a flat list of leaves to resync in place, rather
// than the per-table append-shaped body createTableEntry takes. Each `edits`
// entry carries the leaf's *entire current array* (`values`) — a scalar leaf
// is just a 1-element array — and gets resynced by upserting positions
// 0..values.length-1 then deleting anything left over at or beyond that
// length. One shape covers Table 1a/1b/2/3/4 uniformly: correcting an
// existing value, Plus-adding a new position, and Minus-removing one are all
// just "here's the array now" from the frontend's point of view; Table 3's
// mixno.total is deliberately never sent this way — it's derived from
// start/end and included as its own `edits` entry only when those change.
// `testParameterEdits` updates Table 5 rows by their own id. `dayFieldEdits`
// covers the two scalar columns on SandRecordDay itself (sandLump/newSandWt).
async function updateRecord(recordId, body) {
    const { edits = [], testParameterEdits = [], dayFieldEdits = {} } = body ?? {};

    const ops = [];

    for (const e of edits) {
        if (!e || !e.section || !e.shiftKey || !e.field || !Array.isArray(e.values)) continue;
        e.values.forEach((value, position) => {
            ops.push(sandRecordRepository.updateValueAtPosition(recordId, e.section, e.shiftKey, e.field, position, String(value)));
        });
        ops.push(sandRecordRepository.deleteValuesFromPosition(recordId, e.section, e.shiftKey, e.field, e.values.length));
    }

    for (const t of testParameterEdits) {
        if (!t || !t.id) continue;
        const flattened = toColumnBody(t.data ?? {});
        const { data } = buildColumns(flattened, { raw: TESTPARAM_STRING_FIELDS, numbers: TESTPARAM_NUMBER_FIELDS });
        for (const key of Object.keys(data)) {
            if (data[key] === null) delete data[key];
        }
        if (Object.keys(data).length) ops.push(sandRecordRepository.updateTestParameterRow(t.id, data));
    }

    const dayPatch = {};
    if (nonEmpty(dayFieldEdits.sandLump)) dayPatch.sandLump = dayFieldEdits.sandLump;
    if (nonEmpty(dayFieldEdits.newSandWt)) dayPatch.newSandWt = dayFieldEdits.newSandWt;
    if (Object.keys(dayPatch).length) ops.push(sandRecordRepository.updateDayFields(recordId, dayPatch));

    await Promise.all(ops);

    return getEntryById(recordId);
}

function deleteRecord(recordId) {
    return sandRecordRepository.deleteDay(recordId);
}

function loadEntryForAuth(id) {
    return sandRecordRepository.findDayAuthInfo(id);
}

async function getStats({ startDate, endDate, plant }) {
    const result = await sandRecordRepository.aggregateStats({ from: startDate, to: endDate, plant });
    if (result._avg.permeability === null && result._avg.moisture === null && result._avg.gcsFdyA === null) {
        return {};
    }
    return {
        avgPermeability: result._avg.permeability,
        avgMoisture: result._avg.moisture,
        avgGcs: result._avg.gcsFdyA,
    };
}

module.exports = {
    createTableEntry,
    getAllEntries,
    getEntryByDate,
    getEntryById,
    getStats,
    savePrimary,
    updateRecord,
    deleteRecord,
    loadEntryForAuth,
};
