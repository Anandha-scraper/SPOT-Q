const qcProductionRepository = require('../repositories/qcProductionRepository');
const { AppError } = require('../utils/AppError');
const {
    INVALID,
    isNotRecorded,
    toNullableNumber,
    toRawString,
    buildColumns,
    collectMissing,
    invalidInput,
    requireEditableFields,
} = require('../utils/fieldValidation');

const RANGE_SEPARATOR = ' - ';
const NO_MAX = 0;

// Wire key -> the pair of columns it splits into. The create form posts the
// combined string; the edit modal posts the two columns directly.
const RANGE_FIELDS = {
    cPercent: ['cPercentFrom', 'cPercentTo'],
    siPercent: ['siPercentFrom', 'siPercentTo'],
    mnPercent: ['mnPercentFrom', 'mnPercentTo'],
    pPercent: ['pPercentFrom', 'pPercentTo'],
    sPercent: ['sPercentFrom', 'sPercentTo'],
    mgPercent: ['mgPercentFrom', 'mgPercentTo'],
    cuPercent: ['cuPercentFrom', 'cuPercentTo'],
    crPercent: ['crPercentFrom', 'crPercentTo'],
    graphiteType: ['graphiteTypeFrom', 'graphiteTypeTo'],
    hardnessBHN: ['hardnessBHNFrom', 'hardnessBHNTo'],
};

const FROM_COLUMNS = Object.values(RANGE_FIELDS).map(([from]) => from);
const TO_COLUMNS = Object.values(RANGE_FIELDS).map(([, to]) => to);

const TRIMMED_FIELDS = ['partName'];
const INTEGER_FIELDS = ['noOfMoulds'];
const PLAIN_NUMERIC_FIELDS = ['nodularity', 'noduleCount', 'pearlite', 'ferrite'];

const PROTECTED_ON_UPDATE = ['id', '_id', 'createdBy', 'createdAt', 'updatedAt', 'date'];

const MIN_MOULDS = 1;

function parseRange(raw) {
    if (isNotRecorded(raw)) return { from: null, to: NO_MAX };

    const text = toRawString(raw).trim();

    if (text.includes(RANGE_SEPARATOR)) {
        const [from, to] = text.split(RANGE_SEPARATOR).map((part) => toNullableNumber(part));
        return { from, to: to === null ? NO_MAX : to };
    }

    return { from: toNullableNumber(text), to: NO_MAX };
}

function applyCombinedRanges(source, data, invalid) {
    for (const [wireField, [fromColumn, toColumn]] of Object.entries(RANGE_FIELDS)) {
        if (!Object.prototype.hasOwnProperty.call(source, wireField)) continue;

        const { from, to } = parseRange(source[wireField]);

        if (from === INVALID || to === INVALID) {
            invalid.push(wireField);
            continue;
        }

        data[fromColumn] = from;
        data[toColumn] = to;
    }
}

function buildEntryData(source) {
    const { data, invalid } = buildColumns(source, {
        trimmed: TRIMMED_FIELDS,
        integers: INTEGER_FIELDS,
        numbers: [...PLAIN_NUMERIC_FIELDS, ...FROM_COLUMNS, ...TO_COLUMNS],
    });

    applyCombinedRanges(source, data, invalid);

    for (const column of TO_COLUMNS) {
        if (data[column] === null) data[column] = NO_MAX;
    }

    if (typeof data.noOfMoulds === 'number' && data.noOfMoulds < MIN_MOULDS) {
        invalid.push('noOfMoulds');
    }

    if (invalid.length) throw invalidInput(invalid);

    return data;
}

function buildValueSets(source) {
    const valueSets = {};
    const invalid = [];

    for (const kind of qcProductionRepository.VALUE_KINDS) {
        if (!Object.prototype.hasOwnProperty.call(source, kind)) continue;

        const raw = source[kind];
        if (!Array.isArray(raw)) {
            invalid.push(kind);
            continue;
        }

        if (kind === 'ts' && raw.some((value) => toNullableNumber(value) === INVALID)) {
            invalid.push(kind);
            continue;
        }

        valueSets[kind] = raw.filter((value) => !isNotRecorded(value)).map(toRawString);
    }

    if (invalid.length) throw invalidInput(invalid);

    return valueSets;
}

function listEntries({ from, to } = {}) {
    return qcProductionRepository.findEntries({ from, to });
}

function listPartNames() {
    return qcProductionRepository.findPartNames();
}

async function createEntry(body, userId) {
    const source = body ?? {};

    if (collectMissing(source, ['date']).length) {
        throw new AppError(400, 'Date is required.');
    }

    if (collectMissing(source, ['partName']).length) {
        throw invalidInput(['partName']);
    }

    const data = buildEntryData(source);
    const valueSets = buildValueSets(source);

    return qcProductionRepository.createEntry(
        { ...data, date: String(source.date).trim(), createdBy: userId ?? null },
        valueSets
    );
}

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    const valueSets = buildValueSets(patch);

    if (!Object.keys(valueSets).length) requireEditableFields(data);

    if ('partName' in data && collectMissing(data, ['partName']).length) {
        throw invalidInput(['partName']);
    }

    return qcProductionRepository.updateEntry(entryId, data, valueSets);
}

function deleteEntry(entryId) {
    return qcProductionRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return qcProductionRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    listPartNames,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
