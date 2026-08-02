// Process department business logic. Never touches req/res.
//
// Everything the Mongoose schema used to enforce implicitly lives here now:
// `required`, `trim`, the datecode regex, the default values, and the
// number-vs-'-' coercion. Prisma has no validation or setter layer.

const processRepository = require('../repositories/processRepository');
const {
    buildColumns,
    invalidInput,
    requireDateAndDisa,
    requireEditableFields,
} = require('../utils/fieldValidation');

// The 21 former `Mixed` fields plus the plain strings. Blank optionals arrive
// from the form as the literal '-' and are stored verbatim — the report renders
// the stored value directly, so translating '-' to null here would change what
// operators see.
const SENTINEL_FIELDS = [
    'metalCompositionC', 'metalCompositionSi', 'metalCompositionMn', 'metalCompositionP',
    'metalCompositionS', 'metalCompositionMgFL', 'metalCompositionCu', 'metalCompositionCr',
    'correctiveAdditionC', 'correctiveAdditionSi', 'correctiveAdditionMn', 'correctiveAdditionS',
    'correctiveAdditionCr', 'correctiveAdditionCu', 'correctiveAdditionSn',
    'tappingWt', 'mg', 'resMgConvertor', 'recOfMg', 'streamInoculant', 'pTime',
];

// Fields the old Mongoose schema declared with `trim: true`.
const TRIMMED_FIELDS = [
    'disa', 'partName', 'datecode', 'heatcode',
    'ppCode', 'treatmentNo', 'fcNo', 'heatNo', 'conNo', 'remarks',
];

// Not trimmed by the old schema — these are formatted time strings.
const RAW_STRING_FIELDS = ['timeOfPouring', 'tappingTime'];

const NUMERIC_FIELDS = ['quantityOfMoulds', 'pouringTemperatureMin', 'pouringTemperatureMax'];

const DATECODE_PATTERN = /^[0-9][A-Z][0-9]{2}$/;

function buildEntryData(body) {
    const { data, invalid } = buildColumns(body, {
        trimmed: TRIMMED_FIELDS,
        raw: [...RAW_STRING_FIELDS, ...SENTINEL_FIELDS],
        integers: NUMERIC_FIELDS,
        patterns: { datecode: DATECODE_PATTERN },
    });

    if (invalid.length) throw invalidInput(invalid);

    return data;
}

// ── read ─────────────────────────────────────────────────────────────────────

// All optional. With no filters this returns the whole table, which is what the
// current report page expects (it filters client-side).
function listEntries({ from, to, disa } = {}) {
    return processRepository.findEntries({ from, to, disa });
}

function listPartNames() {
    return processRepository.findPartNames();
}

// ── primary lock ─────────────────────────────────────────────────────────────

// `exists` means "this DISA has been saved as a primary for this date" — NOT
// "a row exists for this date". The frontend's usePrimaryLock hook branches on
// exactly this flag to decide whether to unlock the form.
async function checkPrimary({ date, disa }) {
    requireDateAndDisa(date, disa);

    const dateRow = await processRepository.findDateRow(date);

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
        processRepository.isDisaSaved(dateRow.id, disa),
        processRepository.countEntries(dateRow.id, disa),
        processRepository.countEntriesForDate(dateRow.id),
        processRepository.findLastEntry(dateRow.id, disa),
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

    const dateRow = await processRepository.ensureDateRow(date);
    await processRepository.saveDisa(dateRow.id, disa);

    const [count, totalEntriesForDate] = await Promise.all([
        processRepository.countEntries(dateRow.id, disa),
        processRepository.countEntriesForDate(dateRow.id),
    ]);

    return {
        exists: true,
        isSaved: true,
        count,
        totalEntriesForDate,
        message: 'Primary saved successfully.',
    };
}

// ── write ────────────────────────────────────────────────────────────────────

async function createEntry(body, userId) {
    const { date, disa } = body ?? {};
    requireDateAndDisa(date, disa);

    const data = buildEntryData(body);
    const dateRow = await processRepository.ensureDateRow(date);

    return processRepository.createEntry(dateRow.id, { ...data, createdBy: userId ?? null });
}

// `date`, ownership and timestamps are never editable. The middleware has
// already authorised this entry, so no re-check here.
const PROTECTED_ON_UPDATE = ['id', '_id', 'processId', 'createdBy', 'createdAt', 'updatedAt', 'date'];

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    requireEditableFields(data);

    return processRepository.updateEntry(entryId, data);
}

function deleteEntry(entryId) {
    return processRepository.deleteEntry(entryId);
}

// Used by routes/Process.js to feed middleware/entryAccess.js.
function loadEntryForAuth(id) {
    return processRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    listPartNames,
    checkPrimary,
    savePrimary,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
