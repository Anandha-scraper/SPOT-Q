const cupolaLogRepository = require('../repositories/cupolaLogRepository');
const { AppError } = require('../utils/AppError');
const { buildColumns } = require('../utils/fieldValidation');

// Wire key -> column. Only FeSl differs (kept lowercase-s here for casing
// consistency with the other two-letter element symbols).
const WIRE_TO_COLUMN = { FeSl: 'feSl' };
const COLUMN_TO_WIRE = { feSl: 'FeSl' };

const ENTRY_COLUMNS = [
    'heatNo', 'cpc', 'feSl', 'feMn', 'sic', 'pureMg', 'cu', 'feCr',
    'actualTime', 'tappingTime', 'tappingTemp', 'metalKg',
    'disaLine', 'indFur', 'bailNo', 'tap', 'kw', 'remarks',
];

function toColumnRow(wireRow) {
    const out = {};
    for (const key of Object.keys(wireRow ?? {})) {
        out[WIRE_TO_COLUMN[key] ?? key] = wireRow[key];
    }
    const { data } = buildColumns(out, { raw: ENTRY_COLUMNS });
    return data;
}

function toWireEntry(entry) {
    const row = { _id: entry.id, id: entry.id };
    for (const column of ENTRY_COLUMNS) {
        row[COLUMN_TO_WIRE[column] ?? column] = entry[column];
    }
    return row;
}

function toWireEntryRow(entry, primary, cupolaLogDate) {
    return {
        _id: entry.id,
        primaryId: primary.id,
        date: cupolaLogDate,
        shift: primary.shift,
        holderNumber: primary.holderNumber,
        entryCount: primary._count.entries,
        ...toWireEntry(entry),
    };
}

async function findPrimaryForDate(date, shift, holderNumber) {
    const cupolaLog = await cupolaLogRepository.findDateRow(date);
    if (!cupolaLog) return null;

    const primary = await cupolaLogRepository.findPrimary(cupolaLog.id, shift, holderNumber);
    return primary ? { ...primary, date: cupolaLog.date } : null;
}

async function fetchPrimaryByDate({ date, shift, holderNumber }) {
    const primary = await findPrimaryForDate(date, shift ?? '', holderNumber ?? '');
    if (!primary) return null;

    return {
        _id: primary.id,
        date: primary.date,
        shift: primary.shift,
        holderNumber: primary.holderNumber,
        entryCount: primary._count.entries,
        entries: primary.entries.map(toWireEntry),
    };
}

async function filterByDateRange({ startDate, endDate }) {
    if (!startDate || !endDate) {
        throw new AppError(400, 'Start and end dates are required.');
    }

    const { entries, emptyPrimaries } = await cupolaLogRepository.findEntries({ from: startDate, to: endDate });

    const rows = entries.map((entry) => toWireEntryRow(entry, entry.primary, entry.primary.cupolaLog.date));

    for (const primary of emptyPrimaries) {
        rows.push({
            _id: primary.id,
            date: primary.cupolaLog.date,
            shift: primary.shift,
            holderNumber: primary.holderNumber,
            entryCount: 0,
        });
    }

    return rows;
}

async function createTableEntry(body) {
    const { primaryData, data } = body ?? {};
    if (!data || !primaryData?.date) {
        throw new AppError(400, 'Data and date are required.');
    }

    const cupolaLog = await cupolaLogRepository.ensureDateRow(String(primaryData.date).trim());
    const shift = primaryData.shift || '';
    const holderNumber = primaryData.holderNumber || '';
    const primaryId = await cupolaLogRepository.ensurePrimaryId(cupolaLog.id, shift, holderNumber);

    const entriesArray = Array.isArray(data) ? data : [data];
    const rows = entriesArray.map(toColumnRow);
    await cupolaLogRepository.createEntries(primaryId, rows);

    const primary = await cupolaLogRepository.findPrimary(cupolaLog.id, shift, holderNumber);

    return { entryCount: primary._count.entries, addedCount: entriesArray.length };
}

async function createOrUpdatePrimary({ primaryData }) {
    if (!primaryData?.date) throw new AppError(400, 'Date is required.');

    const cupolaLog = await cupolaLogRepository.ensureDateRow(String(primaryData.date).trim());
    const shift = primaryData.shift || '';
    const holderNumber = primaryData.holderNumber || '';
    await cupolaLogRepository.ensurePrimaryId(cupolaLog.id, shift, holderNumber);

    const primary = await cupolaLogRepository.findPrimary(cupolaLog.id, shift, holderNumber);

    return {
        _id: primary.id,
        date: cupolaLog.date,
        shift: primary.shift,
        holderNumber: primary.holderNumber,
        entryCount: primary._count.entries,
    };
}

module.exports = {
    fetchPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary,
};
