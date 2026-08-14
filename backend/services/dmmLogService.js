const dmmLogRepository = require('../repositories/dmmLogRepository');
const { AppError } = require('../utils/AppError');
const { buildColumns, invalidInput, requireEditableFields } = require('../utils/fieldValidation');

const STRING_FIELDS = ['customer', 'itemDescription', 'time', 'closeUpForceMouldCloseUpPressure', 'remarks'];
const NUMBER_FIELDS = [
    'ppThickness', 'ppHeight', 'spThickness', 'spHeight',
    'coreMaskThickness', 'coreMaskHeightOutside', 'coreMaskHeightInside',
    'sandShotPressureBar', 'correctionShotTime', 'squeezePressure',
    'ppStrippingAcceleration', 'ppStrippingDistance',
    'spStrippingAcceleration', 'spStrippingDistance', 'mouldThicknessPlus10',
];

const PROTECTED_ON_UPDATE = ['id', '_id', 'machineShiftId', 'sNo', 'createdBy', 'createdAt', 'updatedAt'];

// The row id/createdAt/createdBy stay on the wire: EntryActions addresses a
// single parameter row by _id, and the only other id here is the machine-shift's,
// which every row in a group would share.
function toWireParameter({ machineShiftId, ...p }) {
    return { ...p, _id: p.id };
}

function toWireEntry(machineShift) {
    return {
        machine: machineShift.machine,
        shift: machineShift.shift,
        operatorName: machineShift.operatorName,
        checkedBy: machineShift.checkedBy,
        parameters: machineShift.parameters.map(toWireParameter),
    };
}

async function getSettingsByDate({ date, machine, shift }) {
    if (!date) throw new AppError(400, 'Date required.');

    const dmmLog = await dmmLogRepository.findDateRow(String(date).trim());
    if (!dmmLog) return [];

    if (machine && shift) {
        const entry = await dmmLogRepository.findMachineShift(dmmLog.id, String(machine).trim(), String(shift).trim());
        return entry ? [{ date: dmmLog.date, entries: [toWireEntry(entry)] }] : [];
    }

    const rowsForDate = await dmmLogRepository.findMachineShiftsForLog(dmmLog.id);

    if (machine) {
        const machineEntries = rowsForDate.filter((row) => row.machine === String(machine).trim());
        return machineEntries.length ? [{ date: dmmLog.date, entries: machineEntries.map(toWireEntry) }] : [];
    }

    return rowsForDate.length ? [{ date: dmmLog.date, entries: rowsForDate.map(toWireEntry) }] : [];
}

async function saveOperation(date, machine, shifts, userId) {
    const dmmLog = await dmmLogRepository.ensureDateRow(String(date).trim());
    const trimmedMachine = String(machine).trim();

    for (const [shiftKey, shiftData] of Object.entries(shifts ?? {})) {
        const shiftNumber = shiftKey.replace('shift', '');
        const patch = {};
        if (shiftData.operatorName !== undefined) patch.operatorName = shiftData.operatorName || '';
        if (shiftData.checkedBy !== undefined) patch.checkedBy = shiftData.checkedBy || '';
        await dmmLogRepository.upsertMachineShift(dmmLog.id, trimmedMachine, shiftNumber, patch, userId);
    }
}

async function saveParameterRow(date, machine, sectionShift, shiftData, userId) {
    if (!shiftData) return;

    const dmmLog = await dmmLogRepository.ensureDateRow(String(date).trim());
    const trimmedMachine = String(machine).trim();
    const shiftNumber = sectionShift.replace('shift', '');

    const machineShiftId = await dmmLogRepository.ensureMachineShiftId(dmmLog.id, trimmedMachine, shiftNumber);
    const nextSNo = (await dmmLogRepository.countParameters(machineShiftId)) + 1;

    const { data, invalid } = buildColumns(shiftData, { raw: STRING_FIELDS, numbers: NUMBER_FIELDS });
    if (invalid.length) throw invalidInput(invalid);

    // Numeric columns are Float @default(0) NOT NULL; a blank field is now
    // legitimately optional per DdmmSettingParameters.js (frontend no longer
    // forces every shift field non-blank), and buildColumns maps blank to
    // null — default it to 0 instead of letting Prisma reject it, same fix
    // already applied to Disamatic's numeric fields (backend.md).
    NUMBER_FIELDS.forEach((field) => {
        if (data[field] === null) data[field] = 0;
    });

    await dmmLogRepository.createParameterEntry(machineShiftId, { ...data, sNo: nextSNo, createdBy: userId ?? null });
}

async function createSettings({ date, machine, section, ...payload }, userId) {
    if (!date || !machine) throw new AppError(400, 'Date and Machine required.');

    if (section === 'operation') {
        await saveOperation(date, machine, payload.shifts, userId);
    } else if (['shift1', 'shift2', 'shift3'].includes(section)) {
        await saveParameterRow(date, machine, section, payload.parameters?.[section], userId);
    }
    // Any other section is a silent no-op, matching the original controller.

    return { message: `${section} recorded successfully.` };
}

async function getAllSettings() {
    const rows = await dmmLogRepository.findAllMachineShifts();

    const byDateMachine = new Map();
    for (const row of rows) {
        const key = `${row.dmmLog.date}::${row.machine}`;
        if (!byDateMachine.has(key)) {
            byDateMachine.set(key, {
                _id: row.id,
                date: row.dmmLog.date,
                machine: row.machine,
                shifts: {},
                parameters: {},
            });
        }
        const record = byDateMachine.get(key);
        const shiftKey = `shift${row.shift}`;
        // _id/createdBy/createdAt are per-shift (each DmmMachineShift row has its
        // own PK) — the top-level record._id above is ambiguous whenever a
        // date+machine has more than one shift, so EntryActions for Operator
        // Name/Operated By must address this one, not the record-level id.
        record.shifts[shiftKey] = {
            _id: row.id,
            operatorName: row.operatorName || '',
            checkedBy: row.checkedBy || '',
            createdBy: row.createdBy || null,
            createdAt: row.createdAt || null,
        };
        record.parameters[shiftKey] = row.parameters.map(toWireParameter);
    }

    return [...byDateMachine.values()];
}

async function updateMachineShift(id, body) {
    const { data, invalid } = buildColumns(body, { raw: ['operatorName', 'checkedBy'] });
    if (invalid.length) throw invalidInput(invalid);
    requireEditableFields(data);
    return dmmLogRepository.updateMachineShift(id, data);
}

function loadMachineShiftForAuth(id) {
    return dmmLogRepository.findMachineShiftForAuth(id);
}

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const { data, invalid } = buildColumns(patch, { raw: STRING_FIELDS, numbers: NUMBER_FIELDS });

    // The numeric columns are Float @default(0) NOT NULL, and buildColumns maps a
    // blank to null — which Prisma would reject. Report those as invalid instead.
    const blanked = NUMBER_FIELDS.filter((field) => data[field] === null);
    if (invalid.length || blanked.length) throw invalidInput([...invalid, ...blanked]);

    requireEditableFields(data);

    return dmmLogRepository.updateEntry(entryId, data);
}

function deleteEntry(entryId) {
    return dmmLogRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return dmmLogRepository.findEntryAuthInfo(id);
}

// Mirrors disaReportService.js's Component Name suggestion window.
const CUSTOMER_SUGGESTION_WINDOW_DAYS = 90;

function listCustomerNames() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CUSTOMER_SUGGESTION_WINDOW_DAYS);
    return dmmLogRepository.findDistinctFieldValues('dmmParameterEntry', 'customer', cutoff.toISOString().split('T')[0]);
}

module.exports = {
    getSettingsByDate,
    createSettings,
    getAllSettings,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
    updateMachineShift,
    loadMachineShiftForAuth,
    listCustomerNames,
};
