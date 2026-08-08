const returnSandNoteRepository = require('../repositories/returnSandNoteRepository');
const { AppError } = require('../utils/AppError');

const MERGE_SECTIONS = ['clayTests', 'sieveTesting'];
const PLANTS = ['Eirich', 'Disa', 'Foundry-A'];

// Recursively emits (dotPath, value) for every non-empty leaf — the write-side mirror of the old recursive deep-merge.
function walkLeaves(obj, prefix, emit) {
    for (const [key, value] of Object.entries(obj ?? {})) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            walkLeaves(value, path, emit);
        } else if (value !== undefined && value !== null && value !== '') {
            emit(path, String(value));
        }
    }
}

function setNestedPath(target, path, value) {
    const parts = path.split('.');
    let node = target;
    for (let i = 0; i < parts.length - 1; i += 1) {
        if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
        node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
}

// Reconstructs the original nested clayTests.test1.totalClay.input1-style
// shape from the flat (section, testNo, fieldPath, value) rows.
function toWireEntry(entry, date) {
    const sections = { clayTests: {}, sieveTesting: {} };

    for (const field of entry.fields) {
        if (!(field.section in sections)) continue;
        const testKey = `test${field.testNo}`;
        if (!sections[field.section][testKey]) sections[field.section][testKey] = {};
        setNestedPath(sections[field.section][testKey], field.fieldPath, field.value);
    }

    return {
        _id: entry.id,
        date,
        shift: entry.shift,
        plant: entry.plant,
        // Report-page inline edit/delete permission gating (EntryActions.jsx-style).
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        ...sections,
    };
}

async function listEntries({ startDate, endDate }) {
    const entries = await returnSandNoteRepository.findEntriesInRange({ from: startDate, to: endDate });
    return entries.map((entry) => toWireEntry(entry, entry.day.date));
}

// Shared by createEntry and updateEntry — dispatch is driven by which data
// keys are present, not by the `section` string, matching the Foundry Sand
// Testing Note pattern.
async function applySectionData(entryId, section, otherData) {
    if (section === 'primary') return;

    const upserts = [];
    for (const sectionName of MERGE_SECTIONS) {
        if (!otherData[sectionName]) continue;
        for (const [testKey, testValue] of Object.entries(otherData[sectionName])) {
            const testNo = parseInt(String(testKey).replace('test', ''), 10);
            if (!Number.isFinite(testNo)) continue;
            walkLeaves(testValue, '', (fieldPath, value) => {
                upserts.push(returnSandNoteRepository.upsertLeaf(entryId, sectionName, testNo, fieldPath, value));
            });
        }
    }
    await Promise.all(upserts);
}

async function createEntry(body, userId) {
    const { date, shift, section, plant, ...otherData } = body ?? {};
    if (!date || !shift) throw new AppError(400, 'Date and Shift are required.');

    if (plant && !PLANTS.includes(plant)) {
        throw new AppError(400, `Plant must be one of: ${PLANTS.join(', ')}.`);
    }

    const day = await returnSandNoteRepository.ensureDateRow(String(date).trim());
    const trimmedShift = String(shift).trim();
    const trimmedPlant = String(plant || '').trim();

    const existing = await returnSandNoteRepository.findEntry(day.id, trimmedShift, trimmedPlant);
    let entryId;
    if (existing) {
        entryId = existing.id;
    } else {
        if (!plant) throw new AppError(400, 'Plant is required for new entries.');
        entryId = await returnSandNoteRepository.ensureEntryId(day.id, trimmedShift, trimmedPlant, userId);
    }

    await applySectionData(entryId, section, otherData);

    const entry = await returnSandNoteRepository.findEntryWithFields(entryId);
    return toWireEntry(entry, entry.day.date);
}

async function updateEntry(entryId, body) {
    const { section, ...otherData } = body ?? {};

    await applySectionData(entryId, section, otherData);

    const entry = await returnSandNoteRepository.findEntryWithFields(entryId);
    return toWireEntry(entry, entry.day.date);
}

function deleteEntry(entryId) {
    return returnSandNoteRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return returnSandNoteRepository.findEntryAuthInfo(id);
}

module.exports = {
    listEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
