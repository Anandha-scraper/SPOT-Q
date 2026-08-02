const impactRepository = require('../repositories/impactRepository');
const { AppError } = require('../utils/AppError');
const {
    buildColumns,
    collectMissing,
    invalidInput,
    requireEditableFields,
} = require('../utils/fieldValidation');

const TRIMMED_FIELDS = ['partName', 'dateCode', 'specification', 'observedValue', 'remarks'];

const REQUIRED_FIELDS = TRIMMED_FIELDS;
const PROTECTED_ON_UPDATE = ['id', '_id', 'impactId', 'createdBy', 'createdAt', 'updatedAt', 'date'];

const PART_NAME_PATTERN = /^[A-Za-z0-9\s\-]+$/;
const DATECODE_PATTERN = /^[0-9][A-Z][0-9]{2}$/;
const OBSERVED_VALUE_PATTERN = /^(\d+([.,]\d+)?)(\s*,\s*\d+([.,]\d+)?)*$/;

function buildEntryData(body) {
    const { data, invalid } = buildColumns(body, {
        trimmed: TRIMMED_FIELDS,
        patterns: {
            partName: PART_NAME_PATTERN,
            dateCode: DATECODE_PATTERN,
            observedValue: OBSERVED_VALUE_PATTERN,
        },
    });

    if (invalid.length) throw invalidInput(invalid);

    return data;
}

function listEntries({ from, to } = {}) {
    return impactRepository.findEntries({ from, to });
}

function filterEntries({ startDate, endDate }) {
    if (!startDate) throw new AppError(400, 'Start date required.');

    return impactRepository.findEntries({ from: startDate, to: endDate || startDate });
}

async function createEntry(body, userId) {
    const source = body ?? {};

    if (collectMissing(source, ['date', ...REQUIRED_FIELDS]).length) {
        throw new AppError(400, 'Required fields missing.');
    }

    const data = buildEntryData(source);
    const dateRow = await impactRepository.ensureDateRow(String(source.date).trim());

    return impactRepository.createEntry(dateRow.id, { ...data, createdBy: userId ?? null });
}

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    requireEditableFields(data);

    const blank = collectMissing(data, REQUIRED_FIELDS.filter((field) => field in data));
    if (blank.length) throw invalidInput(blank);

    return impactRepository.updateEntry(entryId, data);
}

function deleteEntry(entryId) {
    return impactRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return impactRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    filterEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
