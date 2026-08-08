const tensileRepository = require('../repositories/tensileRepository');
const { AppError } = require('../utils/AppError');
const {
    buildColumns,
    collectMissing,
    invalidInput,
    requireEditableFields,
} = require('../utils/fieldValidation');

const TRIMMED_FIELDS = ['item', 'dateCode', 'heatCode', 'remarks'];
const RAW_STRING_FIELDS = ['testedBy'];
const NUMERIC_FIELDS = ['dia', 'lo', 'li', 'breakingLoad', 'yieldLoad', 'uts', 'ys', 'elongation'];

const REQUIRED_ON_CREATE = ['item', 'dateCode'];
const PROTECTED_ON_UPDATE = ['id', '_id', 'tensileId', 'createdBy', 'createdAt', 'updatedAt', 'date'];

function buildEntryData(body) {
    // dateCode's format is a QC spec hint, not a hard input limit — the real
    // recorded value must be accepted even outside spec, so no pattern check here.
    const { data, invalid } = buildColumns(body, {
        trimmed: TRIMMED_FIELDS,
        raw: RAW_STRING_FIELDS,
        numbers: NUMERIC_FIELDS,
    });

    if (invalid.length) throw invalidInput(invalid);

    return data;
}

function listEntries({ from, to } = {}) {
    return tensileRepository.findEntries({ from, to });
}

function filterEntries({ startDate, endDate }) {
    if (!startDate) throw new AppError(400, 'Start date required.');

    return tensileRepository.findEntries({ from: startDate, to: endDate || startDate });
}

async function createEntry(body, userId) {
    const source = body ?? {};

    if (collectMissing(source, ['date', ...REQUIRED_ON_CREATE]).length) {
        throw new AppError(400, 'Item, Date, and Date Code are required.');
    }

    const data = buildEntryData(source);
    const dateRow = await tensileRepository.ensureDateRow(String(source.date).trim());

    return tensileRepository.createEntry(dateRow.id, { ...data, createdBy: userId ?? null });
}

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    requireEditableFields(data);

    const blank = collectMissing(data, REQUIRED_ON_CREATE.filter((f) => f in data));
    if (blank.length) throw invalidInput(blank);

    return tensileRepository.updateEntry(entryId, data);
}

function deleteEntry(entryId) {
    return tensileRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return tensileRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    filterEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
