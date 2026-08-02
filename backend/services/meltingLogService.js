const meltingLogRepository = require('../repositories/meltingLogRepository');
const { AppError } = require('../utils/AppError');
const { buildColumns, collectMissing, invalidInput, requireEditableFields } = require('../utils/fieldValidation');

// Wire key -> SQL column, for the handful of entry fields whose flat name
// (from the old controller's FLAT_TO_PATH) differs from the column name here.
// Everything not listed maps to itself.
const WIRE_TO_COLUMN = {
    heatNo: 'heatno',
    ifBath: 'chargingIfBath',
    liquidMetalPressPour: 'chargingLiquidMetalPressPour',
    liquidMetalHolder: 'chargingLiquidMetalHolder',
    sgMsSteel: 'chargingSgMsSteel',
    greyMsSteel: 'chargingGreyMsSteel',
    returnsSg: 'chargingReturnsSg',
    pigIron: 'chargingPigIron',
    borings: 'chargingBorings',
    finalBath: 'chargingFinalBath',
    time: 'metalTappingTime',
    tempCSg: 'metalTappingTempCSg',
};
const COLUMN_TO_WIRE = Object.fromEntries(Object.entries(WIRE_TO_COLUMN).map(([w, c]) => [c, w]));

// The 51 entry fields, as columns. Includes furnace2/furnace3 Kw/A/V — the old
// FLAT_TO_PATH omitted them from the edit whitelist (they could be created but
// never edited); using the same allowlist for create and update closes that gap.
const ENTRY_COLUMNS = [
    'heatno', 'grade',
    'chargingTime', 'chargingIfBath', 'chargingLiquidMetalPressPour', 'chargingLiquidMetalHolder',
    'chargingSgMsSteel', 'chargingGreyMsSteel', 'chargingReturnsSg', 'chargingPigIron',
    'chargingBorings', 'chargingFinalBath',
    'charCoal', 'cpcFur', 'cpcLc',
    'siliconCarbideFur', 'ferrosiliconFur', 'ferrosiliconLc', 'ferroManganeseFur', 'ferroManganeseLc',
    'cu', 'cr', 'pureMg', 'ironPyrite',
    'labCoinTime', 'labCoinTempC', 'deslagingTimeFrom', 'deslagingTimeTo', 'metalReadyTime',
    'waitingForTappingFrom', 'waitingForTappingTo', 'reason',
    'metalTappingTime', 'metalTappingTempCSg',
    'directFurnace', 'holderToFurnace', 'furnaceToHolder', 'disaNo', 'item',
    'furnace1Kw', 'furnace1A', 'furnace1V',
    'furnace2Kw', 'furnace2A', 'furnace2V',
    'furnace3Kw', 'furnace3A', 'furnace3V',
    'furnace4Hz', 'furnace4Gld', 'furnace4KwHr',
];

const PRIMARY_VALUE_FIELDS = [
    'cumulativeLiquidMetal', 'finalKwhr', 'initialKwhr', 'totalUnits', 'cumulativeUnits',
];

const PROTECTED_ON_UPDATE = ['id', '_id', 'primaryId', 'createdBy', 'createdAt', 'updatedAt'];

function toColumnBody(wireBody) {
    const source = wireBody ?? {};
    const out = {};
    for (const key of Object.keys(source)) {
        out[WIRE_TO_COLUMN[key] ?? key] = source[key];
    }
    return out;
}

function buildEntryData(wireBody) {
    const columnBody = toColumnBody(wireBody);
    const { data, invalid } = buildColumns(columnBody, { raw: ENTRY_COLUMNS });

    if (invalid.length) throw invalidInput(invalid.map((c) => COLUMN_TO_WIRE[c] ?? c));

    return data;
}

function toWirePrimary(primary, meltingLogDate) {
    if (!primary) return null;

    return {
        _id: primary.id,
        id: primary.id,
        date: meltingLogDate,
        shift: primary.shift,
        furnaceNo: primary.furnaceNo,
        panel: primary.panel,
        cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
        finalKWHr: primary.finalKwhr,
        initialKWHr: primary.initialKwhr,
        totalUnits: primary.totalUnits,
        cumulativeUnits: primary.cumulativeUnits,
        isLocked: primary.isLocked,
        entryCount: primary._count?.entries ?? 0,
    };
}

function toWireEntryRow(entry, primary, meltingLogDate) {
    const row = {
        _id: entry.id,
        id: entry.id,
        primaryId: primary.id,
        date: meltingLogDate,
        shift: primary.shift,
        furnaceNo: primary.furnaceNo,
        panel: primary.panel,
        cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
        finalKWHr: primary.finalKwhr,
        initialKWHr: primary.initialKwhr,
        totalUnits: primary.totalUnits,
        cumulativeUnits: primary.cumulativeUnits,
        isLocked: primary.isLocked,
        entryCount: primary._count.entries,
        createdAt: entry.createdAt,
        createdBy: entry.createdBy,
    };

    for (const column of ENTRY_COLUMNS) {
        row[COLUMN_TO_WIRE[column] ?? column] = entry[column];
    }

    return row;
}

function toWireEmptyPrimaryRow(primary, meltingLogDate) {
    return {
        _id: primary.id,
        date: meltingLogDate,
        shift: primary.shift,
        furnaceNo: primary.furnaceNo,
        panel: primary.panel,
        cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
        finalKWHr: primary.finalKwhr,
        initialKWHr: primary.initialKwhr,
        totalUnits: primary.totalUnits,
        cumulativeUnits: primary.cumulativeUnits,
        isLocked: primary.isLocked,
        entryCount: 0,
    };
}

// The old controller resolved the parent date-doc first, then searched its
// primaries array in memory. With real tables that's a single query once the
// date has a row; if it doesn't, there is nothing to find.
async function findPrimaryForDate(date, shift, furnaceNo, panel) {
    const meltingLog = await meltingLogRepository.findDateRow(date);
    if (!meltingLog) return null;

    const primary = await meltingLogRepository.findPrimary(meltingLog.id, shift, furnaceNo, panel);
    return primary ? { ...primary, date: meltingLog.date } : null;
}

async function fetchPrimaryByDate({ date, shift, furnaceNo, panel }) {
    const primary = await findPrimaryForDate(date, shift ?? '', furnaceNo ?? '', panel ?? '');
    if (!primary) return null;
    return toWirePrimary(primary, primary.date);
}

async function filterByDateRange({ startDate, endDate }) {
    if (!startDate || !endDate) {
        throw new AppError(400, 'Start and end dates are required.');
    }

    const { entries, emptyPrimaries } = await meltingLogRepository.findEntries({ from: startDate, to: endDate });

    const rows = entries.map((entry) =>
        toWireEntryRow(entry, entry.primary, entry.primary.meltingLog.date));

    for (const primary of emptyPrimaries) {
        rows.push(toWireEmptyPrimaryRow(primary, primary.meltingLog.date));
    }

    return rows;
}

async function createTableEntry(body, userId) {
    const { primaryData, data } = body ?? {};
    if (!data || !primaryData?.date) {
        throw new AppError(400, 'Data and date are required.');
    }

    const meltingLog = await meltingLogRepository.ensureDateRow(String(primaryData.date).trim());
    const primaryId = await meltingLogRepository.ensurePrimaryId(
        meltingLog.id,
        primaryData.shift || '',
        primaryData.furnaceNo || '',
        primaryData.panel || ''
    );

    const entryData = buildEntryData(data);
    const entry = await meltingLogRepository.createEntry(primaryId, { ...entryData, createdBy: userId ?? null });

    const primary = await findPrimaryForDate(
        meltingLog.date, primaryData.shift || '', primaryData.furnaceNo || '', primaryData.panel || ''
    );

    return { entry, entryCount: primary._count.entries };
}

async function createOrUpdatePrimary({ primaryData, isLocked }) {
    if (!primaryData?.date) throw new AppError(400, 'Date is required.');

    const meltingLog = await meltingLogRepository.ensureDateRow(String(primaryData.date).trim());
    const shift = primaryData.shift || '';
    const furnaceNo = primaryData.furnaceNo || '';
    const panel = primaryData.panel || '';

    const patch = {};
    for (const field of PRIMARY_VALUE_FIELDS) {
        const wireKey = field === 'finalKwhr' ? 'finalKWHr' : field === 'initialKwhr' ? 'initialKWHr' : field;
        if (primaryData[wireKey] !== undefined) patch[field] = Number(primaryData[wireKey]);
    }
    if (isLocked !== undefined) patch.isLocked = isLocked;

    const primary = await meltingLogRepository.upsertPrimary(meltingLog.id, shift, furnaceNo, panel, patch);

    return toWirePrimary(primary, meltingLog.date);
}

async function updateEntry(entryId, body) {
    const patch = { ...(body ?? {}) };
    PROTECTED_ON_UPDATE.forEach((field) => delete patch[field]);

    const data = buildEntryData(patch);
    requireEditableFields(data);

    return meltingLogRepository.updateEntry(entryId, data);
}

function deleteEntry(entryId) {
    return meltingLogRepository.deleteEntry(entryId);
}

function loadEntryForAuth(id) {
    return meltingLogRepository.findEntryAuthInfo(id);
}

module.exports = {
    fetchPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary,
    updateEntry,
    deleteEntry,
    loadEntryForAuth,
};
