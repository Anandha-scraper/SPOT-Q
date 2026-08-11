const meltingLogRepository = require('../repositories/meltingLogRepository');
const { AppError } = require('../utils/AppError');
const {
    buildColumns, collectMissing, invalidInput, isMissing, requireEditableFields,
} = require('../utils/fieldValidation');

// Wire key -> SQL column for the handful of entry fields that differ from the old FLAT_TO_PATH name; everything else maps to itself.
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

// The 51 entry fields as columns; furnace2/3 Kw/A/V share the create+update allowlist now, closing a gap where the old FLAT_TO_PATH let them be created but never edited.
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

const PRIMARY_KEY_FIELDS = ['shift', 'furnaceNo', 'panel'];
const PRIMARY_WIRE_TO_COLUMN = {
    cumulativeLiquidMetal: 'cumulativeLiquidMetal',
    finalKWHr: 'finalKwhr',
    initialKWHr: 'initialKwhr',
    totalUnits: 'totalUnits',
    cumulativeUnits: 'cumulativeUnits',
};
const PROTECTED_ON_PRIMARY_UPDATE = ['id', '_id', 'meltingLogId', 'entryCount', 'createdAt', 'updatedAt'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

// Real tables make this a single query once the date has a row, replacing the old in-memory search through the date-doc's primaries array.
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

// The five primary values are Float @default(0) NOT NULL, so buildColumns'
// `numbers` option is deliberately not used here — it maps '' and '-' to null,
// which Prisma then rejects against a NOT NULL column. isMissing is checked
// before Number(), which would otherwise turn a cleared field into a silent 0.
function buildPrimaryValues(body, patch, invalid) {
    for (const [wireKey, column] of Object.entries(PRIMARY_WIRE_TO_COLUMN)) {
        if (!Object.prototype.hasOwnProperty.call(body, wireKey)) continue;

        const value = body[wireKey];
        const parsed = Number(String(value).trim());
        if (isMissing(value) || !Number.isFinite(parsed)) invalid.push(wireKey);
        else patch[column] = parsed;
    }
}

async function updatePrimary(primaryId, body) {
    const current = await meltingLogRepository.findPrimaryById(primaryId);
    if (!current) throw new AppError(404, 'Primary not found.');

    const source = { ...(body ?? {}) };
    PROTECTED_ON_PRIMARY_UPDATE.forEach((field) => delete source[field]);

    const { data: keyData, invalid } = buildColumns(source, { trimmed: PRIMARY_KEY_FIELDS });
    // A blank key field would silently collide with every other blank-keyed primary.
    invalid.push(...collectMissing(keyData, Object.keys(keyData)));

    const patch = { ...keyData };
    buildPrimaryValues(source, patch, invalid);

    if (typeof source.isLocked === 'boolean') patch.isLocked = source.isLocked;

    let meltingLogId = current.meltingLogId;
    if (Object.prototype.hasOwnProperty.call(source, 'date')) {
        const date = String(source.date ?? '').trim();
        if (!DATE_PATTERN.test(date)) invalid.push('date');
        else {
            const meltingLog = await meltingLogRepository.ensureDateRow(date);
            meltingLogId = meltingLog.id;
            patch.meltingLogId = meltingLogId;
        }
    }

    if (invalid.length) throw invalidInput(invalid);
    requireEditableFields(patch);

    const conflict = await meltingLogRepository.findConflictingPrimary(
        meltingLogId,
        patch.shift ?? current.shift,
        patch.furnaceNo ?? current.furnaceNo,
        patch.panel ?? current.panel
    );
    if (conflict && conflict.id !== primaryId) {
        throw new AppError(409, 'A primary already exists for this date, shift, furnace and panel.');
    }

    const updated = await meltingLogRepository.updatePrimary(primaryId, patch);
    return toWirePrimary(updated, updated.meltingLog.date);
}

async function deletePrimary(primaryId) {
    const result = await meltingLogRepository.deletePrimary(primaryId);
    if (!result) throw new AppError(404, 'Primary not found.');
    return result;
}

function loadEntryForAuth(id) {
    return meltingLogRepository.findEntryAuthInfo(id);
}

function loadPrimaryForAuth(id) {
    return meltingLogRepository.findPrimaryById(id);
}

module.exports = {
    fetchPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary,
    updateEntry,
    deleteEntry,
    updatePrimary,
    deletePrimary,
    loadEntryForAuth,
    loadPrimaryForAuth,
};
