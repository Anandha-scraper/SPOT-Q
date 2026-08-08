const dmmLogRepository = require('../repositories/dmmLogRepository');
const { AppError } = require('../utils/AppError');
const { buildColumns } = require('../utils/fieldValidation');

const STRING_FIELDS = ['customer', 'itemDescription', 'time', 'closeUpForceMouldCloseUpPressure', 'remarks'];
const NUMBER_FIELDS = [
    'ppThickness', 'ppHeight', 'spThickness', 'spHeight',
    'coreMaskThickness', 'coreMaskHeightOutside', 'coreMaskHeightInside',
    'sandShotPressureBar', 'correctionShotTime', 'squeezePressure',
    'ppStrippingAcceleration', 'ppStrippingDistance',
    'spStrippingAcceleration', 'spStrippingDistance', 'mouldThicknessPlus10',
];

function toWireEntry(machineShift) {
    return {
        machine: machineShift.machine,
        shift: machineShift.shift,
        operatorName: machineShift.operatorName,
        checkedBy: machineShift.checkedBy,
        parameters: machineShift.parameters.map(({ id, machineShiftId, createdAt, ...p }) => p),
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

async function saveOperation(date, machine, shifts) {
    const dmmLog = await dmmLogRepository.ensureDateRow(String(date).trim());
    const trimmedMachine = String(machine).trim();

    for (const [shiftKey, shiftData] of Object.entries(shifts ?? {})) {
        const shiftNumber = shiftKey.replace('shift', '');
        const patch = {};
        if (shiftData.operatorName !== undefined) patch.operatorName = shiftData.operatorName || '';
        if (shiftData.checkedBy !== undefined) patch.checkedBy = shiftData.checkedBy || '';
        await dmmLogRepository.upsertMachineShift(dmmLog.id, trimmedMachine, shiftNumber, patch);
    }
}

async function saveParameterRow(date, machine, sectionShift, shiftData) {
    if (!shiftData) return;

    const dmmLog = await dmmLogRepository.ensureDateRow(String(date).trim());
    const trimmedMachine = String(machine).trim();
    const shiftNumber = sectionShift.replace('shift', '');

    const machineShiftId = await dmmLogRepository.ensureMachineShiftId(dmmLog.id, trimmedMachine, shiftNumber);
    const nextSNo = (await dmmLogRepository.countParameters(machineShiftId)) + 1;

    const { data } = buildColumns(shiftData, { raw: STRING_FIELDS, numbers: NUMBER_FIELDS });
    await dmmLogRepository.createParameterEntry(machineShiftId, { ...data, sNo: nextSNo });
}

async function createSettings({ date, machine, section, ...payload }) {
    if (!date || !machine) throw new AppError(400, 'Date and Machine required.');

    if (section === 'operation') {
        await saveOperation(date, machine, payload.shifts);
    } else if (['shift1', 'shift2', 'shift3'].includes(section)) {
        await saveParameterRow(date, machine, section, payload.parameters?.[section]);
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
        record.shifts[shiftKey] = { operatorName: row.operatorName || '', checkedBy: row.checkedBy || '' };
        record.parameters[shiftKey] = row.parameters.map(({ id, machineShiftId, createdAt, ...p }) => p);
    }

    return [...byDateMachine.values()];
}

module.exports = {
    getSettingsByDate,
    createSettings,
    getAllSettings,
};
