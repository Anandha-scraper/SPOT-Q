const sandNoteRepository = require('../repositories/sandNoteRepository');
const { AppError } = require('../utils/AppError');

const MERGE_SECTIONS = ['clayTests', 'sieveTesting', 'parameters', 'additionalData'];

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
    const sections = { clayTests: {}, sieveTesting: {}, parameters: {}, additionalData: {} };

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
        sandPlant: entry.sandPlant,
        compactibilitySetting: entry.compactibilitySetting,
        shearStrengthSetting: entry.shearStrengthSetting,
        remarks: entry.remarks,
        ...sections,
    };
}

async function listEntries({ startDate, endDate }) {
    const entries = await sandNoteRepository.findEntriesInRange({ from: startDate, to: endDate });
    return entries.map((entry) => toWireEntry(entry, entry.day.date));
}

async function createEntry(body) {
    const { date, shift, section, sandPlant, ...otherData } = body ?? {};
    if (!date || !shift) throw new AppError(400, 'Date and Shift are required.');

    const day = await sandNoteRepository.ensureDateRow(String(date).trim());
    const trimmedShift = String(shift).trim();
    const trimmedPlant = String(sandPlant || '').trim();

    const existing = await sandNoteRepository.findEntry(day.id, trimmedShift, trimmedPlant);
    let entryId;
    if (existing) {
        entryId = existing.id;
    } else {
        if (!sandPlant) throw new AppError(400, 'Sand Plant is required for new entries.');
        entryId = await sandNoteRepository.ensureEntryId(day.id, trimmedShift, trimmedPlant);
    }

    if (section === 'primary') {
        const patch = {};
        if (sandPlant) patch.sandPlant = sandPlant;
        if (otherData.compactibilitySetting !== undefined) patch.compactibilitySetting = otherData.compactibilitySetting;
        if (otherData.shearStrengthSetting !== undefined) patch.shearStrengthSetting = otherData.shearStrengthSetting;
        if (Object.keys(patch).length) await sandNoteRepository.updateEntryFields(entryId, patch);
    } else if (section === 'remarks') {
        if (otherData.remarks !== undefined) {
            await sandNoteRepository.updateEntryFields(entryId, { remarks: otherData.remarks });
        }
    } else {
        // Dispatch is driven by which data keys are present, not by the
        // `section` string — matches the original controller exactly.
        const upserts = [];
        for (const sectionName of MERGE_SECTIONS) {
            if (!otherData[sectionName]) continue;
            for (const [testKey, testValue] of Object.entries(otherData[sectionName])) {
                const testNo = parseInt(String(testKey).replace('test', ''), 10);
                if (!Number.isFinite(testNo)) continue;
                walkLeaves(testValue, '', (fieldPath, value) => {
                    upserts.push(sandNoteRepository.upsertLeaf(entryId, sectionName, testNo, fieldPath, value));
                });
            }
        }
        await Promise.all(upserts);
    }

    const entry = await sandNoteRepository.findEntryWithFields(entryId);
    return toWireEntry(entry, day.date);
}

module.exports = {
    listEntries,
    createEntry,
};
