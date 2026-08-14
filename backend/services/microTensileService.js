const microTensileRepository = require('../repositories/microTensileRepository');
const {
    buildColumns,
    collectMissing,
    invalidInput,
    requireDateAndDisa,
    requireEditableFields,
} = require('../utils/fieldValidation');

const TRIMMED_FIELDS = ['disa', 'itemIt1', 'heatCode', 'remarks', 'testedBy'];
const RAW_STRING_FIELDS = ['itemIt2', 'dateCode'];
const NUMERIC_FIELDS = [
    'barDia', 'gaugeLength', 'maxLoad', 'yieldLoad',
    'tensileStrength', 'yieldStrength', 'elongation',
];

const REQUIRED_FIELDS = ['disa', 'itemIt1', 'dateCode'];

// The 7 NUMERIC_FIELDS are Float @db columns with no default (NOT NULL) —
// buildColumns maps a blank optional field to null, which Prisma rejects.
// Substituted to 0 here, mirroring microStructureService.js's MAX_FIELDS/
// NO_VALUE handling for the same NOT-NULL-no-default shape.
const NO_VALUE = 0;

const PROTECTED_ON_UPDATE = [
    'id', '_id', 'microTensileId', 'createdBy', 'createdAt', 'updatedAt', 'date',
];

const COLUMN_TO_WIRE_NAME = { itemIt1: 'item.it1', itemIt2: 'item.it2' };
const toWireFields = (fields) => fields.map((field) => COLUMN_TO_WIRE_NAME[field] ?? field);

function flattenItem(body) {
    const source = { ...(body ?? {}) };
    const { item } = source;
    delete source.item;

    if (item && typeof item === 'object') {
        if ('it1' in item) source.itemIt1 = item.it1;
        if ('it2' in item) source.itemIt2 = item.it2;
    }

    return source;
}

function toWireEntry(row) {
    if (!row) return null;

    const { itemIt1, itemIt2, ...rest } = row;
    return { ...rest, item: { it1: itemIt1, it2: itemIt2 } };
}

// dateCode/itemIt2 formats and elongation's 0-100 range are QC spec hints,
// not hard input limits — the real recorded value must be accepted even
// outside spec.
function buildEntryData(source) {
    const { data, invalid } = buildColumns(source, {
        trimmed: TRIMMED_FIELDS,
        raw: RAW_STRING_FIELDS,
        numbers: NUMERIC_FIELDS,
    });

    for (const field of NUMERIC_FIELDS) {
        if (data[field] === null) data[field] = NO_VALUE;
    }

    if (invalid.length) throw invalidInput(toWireFields(invalid));

    return data;
}

async function listEntries({ from, to, disa } = {}) {
    const rows = await microTensileRepository.findEntries({ from, to, disa });
    return rows.map(toWireEntry);
}

function filterEntries({ startDate, endDate }) {
    return listEntries({ from: startDate, to: endDate || startDate });
}

const ITEM_NAME_WINDOW_DAYS = 90;

function listItemNames() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ITEM_NAME_WINDOW_DAYS);
    return microTensileRepository.findDistinctFieldValues('itemIt1', cutoff.toISOString().split('T')[0]);
}

async function checkPrimary({ date, disa }) {
    requireDateAndDisa(date, disa);

    const dateRow = await microTensileRepository.findDateRow(date);

    if (!dateRow) {
        return {
            exists: false,
            isSaved: false,
            count: 0,
            lastEntry: null,
            totalEntriesForDate: 0,
            message: 'No entries found for this date.',
        };
    }

    const [isSaved, count, totalEntriesForDate, lastEntry] = await Promise.all([
        microTensileRepository.isDisaSaved(dateRow.id, disa),
        microTensileRepository.countEntries(dateRow.id, disa),
        microTensileRepository.countEntriesForDate(dateRow.id),
        microTensileRepository.findLastEntry(dateRow.id, disa),
    ]);

    return {
        exists: isSaved,
        isSaved,
        count,
        lastEntry: toWireEntry(lastEntry),
        totalEntriesForDate,
        message: isSaved
            ? `Primary saved. Found ${count} entries for ${disa} on ${date}.`
            : 'Primary not saved yet.',
    };
}

async function savePrimary({ date, disa }) {
    requireDateAndDisa(date, disa);

    const dateRow = await microTensileRepository.ensureDateRow(String(date).trim());
    await microTensileRepository.saveDisa(dateRow.id, String(disa).trim());

    const [count, totalEntriesForDate] = await Promise.all([
        microTensileRepository.countEntries(dateRow.id, String(disa).trim()),
        microTensileRepository.countEntriesForDate(dateRow.id),
    ]);

    return {
        exists: true,
        isSaved: true,
        count,
        totalEntriesForDate,
        message: 'Primary data saved successfully.',
    };
}

async function createEntry(body, userId) {
    const source = flattenItem(body);
    requireDateAndDisa(source.date, source.disa);

    const missing = collectMissing(source, REQUIRED_FIELDS);
    if (missing.length) throw invalidInput(toWireFields(missing));

    const data = buildEntryData(source);
    const dateRow = await microTensileRepository.ensureDateRow(String(source.date).trim());

    const entry = await microTensileRepository.createEntry(dateRow.id, {
        ...data,
        createdBy: userId ?? null,
    });

    return toWireEntry(entry);
}

async function updateEntry(entryId, body) {
    const patch = flattenItem(body);
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    requireEditableFields(data);

    const blank = collectMissing(data, REQUIRED_FIELDS.filter((field) => field in data));
    if (blank.length) throw invalidInput(toWireFields(blank));

    const entry = await microTensileRepository.updateEntry(entryId, data);
    return toWireEntry(entry);
}

function deleteEntry(entryId) {
    return microTensileRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return microTensileRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    filterEntries,
    listItemNames,
    checkPrimary,
    savePrimary,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
