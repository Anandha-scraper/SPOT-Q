const microStructureRepository = require('../repositories/microStructureRepository');
const { AppError } = require('../utils/AppError');
const {
    buildColumns,
    collectMissing,
    invalidInput,
    requireDateAndDisa,
    requireEditableFields,
} = require('../utils/fieldValidation');

const TRIMMED_FIELDS = ['disa', 'partName', 'dateCode', 'heatCode', 'graphiteType', 'remarks'];
const MIN_FIELDS = ['countMin', 'sizeMin', 'ferriteMin', 'pearliteMin', 'carbideMin'];
const MAX_FIELDS = ['countMax', 'sizeMax', 'ferriteMax', 'pearliteMax', 'carbideMax'];
const NUMERIC_FIELDS = ['nodularity', ...MIN_FIELDS, ...MAX_FIELDS];
const REQUIRED_ON_SUBMIT = ['date', 'disa', 'partName', 'dateCode'];
const REQUIRED_FIELDS = ['disa', 'partName', 'dateCode'];
const PROTECTED_ON_UPDATE = [
    'id', '_id', 'microStructureId', 'createdBy', 'createdAt', 'updatedAt', 'date',
];

// nodularity/MIN_FIELDS/MAX_FIELDS are all Float @db columns with no default
// (NOT NULL) — buildColumns maps a blank optional field to null, which Prisma
// rejects. Substituted to 0 here for all of them, not just MAX_FIELDS.
const NO_VALUE = 0;

function buildEntryData(body) {
    const { data, invalid } = buildColumns(body, {
        trimmed: TRIMMED_FIELDS,
        numbers: NUMERIC_FIELDS,
    });

    for (const field of NUMERIC_FIELDS) {
        if (data[field] === null) data[field] = NO_VALUE;
    }

    if (invalid.length) throw invalidInput(invalid);

    return data;
}

async function listEntries({ from, to, disa } = {}) {
    return microStructureRepository.findEntries({ from, to, disa });
}

function filterEntries({ startDate, endDate }) {
    if (!startDate) throw new AppError(400, 'Start date required.');

    return listEntries({ from: startDate, to: endDate || startDate });
}

function getLastDisa() {
    return microStructureRepository.findLatestSavedDisa();
}

const PART_NAME_WINDOW_DAYS = 90;

function listPartNames() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PART_NAME_WINDOW_DAYS);
    return microStructureRepository.findDistinctFieldValues('partName', cutoff.toISOString().split('T')[0]);
}

async function checkPrimary({ date, disa }) {
    requireDateAndDisa(date, disa);

    const dateRow = await microStructureRepository.findDateRow(date);

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
        microStructureRepository.isDisaSaved(dateRow.id, disa),
        microStructureRepository.countEntries(dateRow.id, disa),
        microStructureRepository.countEntriesForDate(dateRow.id),
        microStructureRepository.findLastEntry(dateRow.id, disa),
    ]);

    return {
        exists: isSaved,
        isSaved,
        count,
        lastEntry,
        totalEntriesForDate,
        message: isSaved
            ? `Primary saved. Found ${count} entries for ${disa} on ${date}.`
            : 'Primary not saved yet.',
    };
}

async function savePrimary({ date, disa }) {
    requireDateAndDisa(date, disa);

    const dateRow = await microStructureRepository.ensureDateRow(String(date).trim());
    const trimmedDisa = String(disa).trim();
    await microStructureRepository.saveDisa(dateRow.id, trimmedDisa);

    const [count, totalEntriesForDate] = await Promise.all([
        microStructureRepository.countEntries(dateRow.id, trimmedDisa),
        microStructureRepository.countEntriesForDate(dateRow.id),
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
    const source = body ?? {};

    if (collectMissing(source, REQUIRED_ON_SUBMIT).length) {
        throw new AppError(400, 'Date, DISA, Part Name, and Date Code are required.');
    }

    const missing = collectMissing(source, REQUIRED_FIELDS);
    if (missing.length) throw invalidInput(missing);

    const data = buildEntryData(source);
    const dateRow = await microStructureRepository.ensureDateRow(String(source.date).trim());

    return microStructureRepository.createEntry(dateRow.id, {
        ...data,
        createdBy: userId ?? null,
    });
}

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    requireEditableFields(data);

    const blank = collectMissing(data, REQUIRED_FIELDS.filter((field) => field in data));
    if (blank.length) throw invalidInput(blank);

    return microStructureRepository.updateEntry(entryId, data);
}

function deleteEntry(entryId) {
    return microStructureRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return microStructureRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    filterEntries,
    getLastDisa,
    listPartNames,
    checkPrimary,
    savePrimary,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
