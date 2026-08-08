const impactRepository = require('../repositories/impactRepository');
const { AppError } = require('../utils/AppError');
const {
    buildColumns,
    collectMissing,
    invalidInput,
    requireEditableFields,
} = require('../utils/fieldValidation');

const TRIMMED_FIELDS = ['partName', 'dateCode', 'specification', 'observedValue', 'remarks'];

// Matches frontend/src/deviations/Dimpact.js's validationRanges — only these
// two are required: true there. Specification/Observed Value/Remarks are
// required: false, so they must stay optional here too, or a blank Observed
// Value (Impact.jsx never backfills it with '-' like every other optional
// field, since it's a NumberArray not a scalar) fails collectMissing() and
// the entry can never be saved without at least one observed value.
const REQUIRED_FIELDS = ['partName', 'dateCode'];
const PROTECTED_ON_UPDATE = ['id', '_id', 'impactId', 'createdBy', 'createdAt', 'updatedAt', 'date'];

// A comma-separated list of numbers — this guards observedValue's actual
// numeric shape (same intent as the numbers/integers buildColumns options
// elsewhere), not a QC spec preference, so it stays enforced.
const OBSERVED_VALUE_PATTERN = /^(\d+([.,]\d+)?)(\s*,\s*\d+([.,]\d+)?)*$/;

function buildEntryData(body) {
    // partName/dateCode formats are QC spec hints, not hard input limits —
    // the real recorded value must be accepted even outside spec.
    const { data, invalid } = buildColumns(body, {
        trimmed: TRIMMED_FIELDS,
        patterns: {
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
