// Per-department field configs for EditEntryModal — see frontend.md for the full shape.
import { API_ENDPOINTS } from '../config/api';

const DISA_OPTIONS = ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'];
const FC_NO_OPTIONS = ['1', '2', '3', '4', 'H1', 'H2'];

// Must stay byte-identical to Buttons.jsx's dropdowns — these values ARE the
// primary key, so a mismatch renders the select blank and a save rewrites the
// combination to ''.
const SHIFT_OPTIONS = ['Shift 1', 'Shift 2', 'Shift 3'];
const FURNACE_OPTIONS = ['1', '2', '3', '4'];
const PANEL_OPTIONS = ['A', 'B', 'C', 'D'];
const HOLDER_OPTIONS = ['1', '2', '3', '4'];

export const processEditConfig = {
    endpoint: API_ENDPOINTS.process,
    title: 'Edit Process Entry',
    fields: [
        { name: 'disa', label: 'DISA', type: 'select', options: DISA_OPTIONS, required: true },
        { name: 'partName', label: 'Part Name', type: 'text', required: true, uppercase: true },
        { name: 'datecode', label: 'Date Code', type: 'text', required: true, uppercase: true },
        { name: 'heatcode', label: 'Heat Code', type: 'number', required: true },
        { name: 'quantityOfMoulds', label: 'Qty of Moulds', type: 'number' },
        { name: 'metalCompositionC', label: 'Metal C %', type: 'number' },
        { name: 'metalCompositionSi', label: 'Metal Si %', type: 'number' },
        { name: 'metalCompositionMn', label: 'Metal Mn %', type: 'number' },
        { name: 'metalCompositionP', label: 'Metal P %', type: 'number' },
        { name: 'metalCompositionS', label: 'Metal S %', type: 'number' },
        { name: 'metalCompositionMgFL', label: 'Metal Mg F/L %', type: 'number' },
        { name: 'metalCompositionCu', label: 'Metal Cu %', type: 'number' },
        { name: 'metalCompositionCr', label: 'Metal Cr %', type: 'number' },
        { name: 'pouringTemperatureMin', label: 'Pouring Temp Min', type: 'number' },
        { name: 'pouringTemperatureMax', label: 'Pouring Temp Max', type: 'number' },
        { name: 'timeOfPouring', label: 'Time of Pouring', type: 'text' },
        { name: 'ppCode', label: 'PP Code', type: 'number' },
        { name: 'treatmentNo', label: 'Treatment No', type: 'number' },
        { name: 'fcNo', label: 'F/C No', type: 'select', options: FC_NO_OPTIONS },
        { name: 'heatNo', label: 'Heat No', type: 'number' },
        { name: 'conNo', label: 'Con No', type: 'number' },
        { name: 'tappingTime', label: 'Tapping Time', type: 'text' },
        { name: 'correctiveAdditionC', label: 'Corr. C', type: 'number' },
        { name: 'correctiveAdditionSi', label: 'Corr. Si', type: 'number' },
        { name: 'correctiveAdditionMn', label: 'Corr. Mn', type: 'number' },
        { name: 'correctiveAdditionS', label: 'Corr. S', type: 'number' },
        { name: 'correctiveAdditionCr', label: 'Corr. Cr', type: 'number' },
        { name: 'correctiveAdditionCu', label: 'Corr. Cu', type: 'number' },
        { name: 'correctiveAdditionSn', label: 'Corr. Sn', type: 'number' },
        { name: 'tappingWt', label: 'Tapping Wt', type: 'number' },
        { name: 'mg', label: 'Mg', type: 'number' },
        { name: 'resMgConvertor', label: 'Res Mg Convertor', type: 'number' },
        { name: 'recOfMg', label: 'Rec of Mg', type: 'number' },
        { name: 'streamInoculant', label: 'Stream Inoculant', type: 'number' },
        { name: 'pTime', label: 'P Time', type: 'text' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' }
    ]
};

// Field names are the flat names from the report's /filter response; the backend maps them to the nested entry paths (primary date/shift/furnace/panel aren't edited here).
export const meltingEditConfig = {
    endpoint: API_ENDPOINTS.meltingLogs,
    title: 'Edit Melting Log Entry',
    fields: [
        { name: 'heatNo', label: 'Heat No', type: 'text' },
        { name: 'grade', label: 'Grade', type: 'select', options: ['SG', 'FG'] },
        { name: 'chargingTime', label: 'Charging Time', type: 'text' },
        { name: 'ifBath', label: 'If Bath', type: 'text' },
        { name: 'liquidMetalPressPour', label: 'Liquid Metal (Press & Pour)', type: 'text' },
        { name: 'liquidMetalHolder', label: 'Liquid Metal (Holder)', type: 'text' },
        { name: 'sgMsSteel', label: 'SG-MS Steel', type: 'text' },
        { name: 'greyMsSteel', label: 'Grey MS Steel', type: 'text' },
        { name: 'returnsSg', label: 'Returns SG', type: 'text' },
        { name: 'pigIron', label: 'Pig Iron', type: 'text' },
        { name: 'borings', label: 'Borings', type: 'text' },
        { name: 'finalBath', label: 'Final Bath', type: 'text' },
        { name: 'charCoal', label: 'Char Coal', type: 'text' },
        { name: 'cpcFur', label: 'CPC (Furnace)', type: 'text' },
        { name: 'cpcLc', label: 'CPC (L/C)', type: 'text' },
        { name: 'siliconCarbideFur', label: 'Silicon Carbide (Furnace)', type: 'text' },
        { name: 'ferrosiliconFur', label: 'Ferrosilicon (Furnace)', type: 'text' },
        { name: 'ferrosiliconLc', label: 'Ferrosilicon (L/C)', type: 'text' },
        { name: 'ferroManganeseFur', label: 'Ferromanganese (Furnace)', type: 'text' },
        { name: 'ferroManganeseLc', label: 'Ferromanganese (L/C)', type: 'text' },
        { name: 'cu', label: 'Cu', type: 'text' },
        { name: 'cr', label: 'Fe-Cr', type: 'text' },
        { name: 'pureMg', label: 'Pure Mg', type: 'text' },
        { name: 'ironPyrite', label: 'Iron Pyrite', type: 'text' },
        { name: 'labCoinTime', label: 'Lab Coin Time', type: 'text' },
        { name: 'labCoinTempC', label: 'Lab Coin Temp (°C)', type: 'text' },
        { name: 'deslagingTimeFrom', label: 'Deslagging From', type: 'text' },
        { name: 'deslagingTimeTo', label: 'Deslagging To', type: 'text' },
        { name: 'metalReadyTime', label: 'Metal Ready Time', type: 'text' },
        { name: 'waitingForTappingFrom', label: 'Waiting Tapping From', type: 'text' },
        { name: 'waitingForTappingTo', label: 'Waiting Tapping To', type: 'text' },
        { name: 'reason', label: 'Reason', type: 'textarea' },
        { name: 'time', label: 'Tapping Time', type: 'text' },
        { name: 'tempCSg', label: 'Temp °C (Non-SG)', type: 'text' },
        { name: 'directFurnace', label: 'Direct Furnace', type: 'text' },
        { name: 'holderToFurnace', label: 'Holder → Furnace', type: 'text' },
        { name: 'furnaceToHolder', label: 'Furnace → Holder', type: 'text' },
        { name: 'disaNo', label: 'DISA No', type: 'select', options: DISA_OPTIONS },
        { name: 'item', label: 'Item', type: 'text' },
        { name: 'furnace1Kw', label: 'F1-2-3 kW', type: 'text' },
        { name: 'furnace1A', label: 'F1-2-3 A', type: 'text' },
        { name: 'furnace1V', label: 'F1-2-3 V', type: 'text' },
        { name: 'furnace4Hz', label: 'F4 Hz', type: 'text' },
        { name: 'furnace4Gld', label: 'F4 GLD', type: 'text' },
        { name: 'furnace4KwHr', label: 'F4 kW/Hr', type: 'text' }
    ]
};

// Primary edit only ever touches the five totals — Date/Shift/Furnace/Panel
// are the combination's unique key, and the backend now protects them from
// PUT /primary/:id unconditionally (see PROTECTED_ON_PRIMARY_UPDATE). To
// change a combination, delete it (cascades its entries, see deleteConfirm
// below) and re-save the primary with the correct key instead of renaming it
// in place. Separate from meltingEditConfig because it targets /primary/:id, not /:id.
export const meltingPrimaryEditConfig = {
    endpoint: `${API_ENDPOINTS.meltingLogs}/primary`,
    title: 'Edit Melting Primary',
    deleteConfirm: {
        title: 'Delete this primary combination?',
        // entry.entryCount is threaded in by MeltingLogSheetReport.jsx's primaryRowOf().
        description: (entry) => {
            const count = entry?.entryCount ?? 0;
            const entriesPhrase = count > 0 ? ` and its ${count} recorded ${count === 1 ? 'entry' : 'entries'}` : '';
            return `This primary${entriesPhrase} will be permanently deleted. This action cannot be undone.`;
        }
    },
    fields: [
        // required guards a NOT NULL Float column, not a validationRanges rule:
        // a cleared number field posts '' and the backend rejects it.
        { name: 'cumulativeLiquidMetal', label: 'Cumul. Liquid Metal (kgs)', type: 'number', required: true },
        { name: 'finalKWHr', label: 'Final KW/Hr', type: 'number', required: true },
        { name: 'initialKWHr', label: 'Initial KW/Hr', type: 'number', required: true },
        { name: 'totalUnits', label: 'Total Units', type: 'number', required: true },
        { name: 'cumulativeUnits', label: 'Cumul. Units', type: 'number', required: true }
    ]
};

// Every column is String @default("-") and the form posts the '-' sentinel, so
// these stay type:'text' — type:'number' would reject valid stored data.
export const cupolaEditConfig = {
    endpoint: API_ENDPOINTS.cupolaLogs,
    title: 'Edit Cupola Holder Entry',
    fields: [
        { name: 'heatNo', label: 'Heat No', type: 'text' },
        { name: 'cpc', label: 'CPC', type: 'text' },
        { name: 'FeSl', label: 'Fe Sl', type: 'text' },
        { name: 'feMn', label: 'Fe Mn', type: 'text' },
        { name: 'sic', label: 'SIC', type: 'text' },
        { name: 'pureMg', label: 'Pure Mg', type: 'text' },
        { name: 'cu', label: 'Cu', type: 'text' },
        { name: 'feCr', label: 'Fe Cr', type: 'text' },
        { name: 'actualTime', label: 'Actual Time', type: 'text' },
        { name: 'tappingTime', label: 'Tapping Time', type: 'text' },
        { name: 'tappingTemp', label: 'Temp °C', type: 'text' },
        { name: 'metalKg', label: 'Metal (KG)', type: 'text' },
        { name: 'disaLine', label: 'DISA LINE', type: 'select', options: DISA_OPTIONS, required: true },
        { name: 'indFur', label: 'IND FUR', type: 'text' },
        { name: 'bailNo', label: 'BAIL NO', type: 'text' },
        { name: 'tap', label: 'TAP', type: 'text' },
        { name: 'kw', label: 'KW', type: 'text' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' }
    ]
};

export const cupolaPrimaryEditConfig = {
    endpoint: `${API_ENDPOINTS.cupolaLogs}/primary`,
    title: 'Edit Cupola Primary',
    deleteConfirm: {
        title: 'Delete this primary combination?',
        description: 'Every entry recorded under this date, shift and holder is deleted with it. This action cannot be undone.'
    },
    fields: [
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'shift', label: 'Shift', type: 'select', options: SHIFT_OPTIONS, required: true },
        { name: 'holderNumber', label: 'Holder No', type: 'select', options: HOLDER_OPTIONS, required: true }
    ]
};

// One DmmParameterEntry row. `required` mirrors DdmmSettingParameters.js, where
// every parameter field is required — and the 15 numeric ones are NOT NULL
// Float columns the backend rejects a blank for.
export const dmmEditConfig = {
    endpoint: API_ENDPOINTS.mouldingDmm,
    title: 'Edit DMM Parameters Entry',
    fields: [
        { name: 'customer', label: 'Customer', type: 'text', required: true },
        { name: 'itemDescription', label: 'Item Description', type: 'text', required: true },
        { name: 'time', label: 'Time', type: 'text', required: true },
        { name: 'ppThickness', label: 'PP Thickness (mm)', type: 'number', required: true },
        { name: 'ppHeight', label: 'PP Height (mm)', type: 'number', required: true },
        { name: 'spThickness', label: 'SP Thickness (mm)', type: 'number', required: true },
        { name: 'spHeight', label: 'SP Height (mm)', type: 'number', required: true },
        { name: 'coreMaskThickness', label: 'Core Mask Thickness (mm)', type: 'number', required: true },
        { name: 'coreMaskHeightOutside', label: 'Core Mask Height Outside (mm)', type: 'number', required: true },
        { name: 'coreMaskHeightInside', label: 'Core Mask Height Inside (mm)', type: 'number', required: true },
        { name: 'sandShotPressureBar', label: 'Sand Shot Pressure (Bar)', type: 'number', required: true },
        { name: 'correctionShotTime', label: 'Correction Shot Time (s)', type: 'number', required: true },
        { name: 'squeezePressure', label: 'Squeeze Pressure (Kg/cm²)', type: 'number', required: true },
        { name: 'ppStrippingAcceleration', label: 'PP Stripping Acceleration', type: 'number', required: true },
        { name: 'ppStrippingDistance', label: 'PP Stripping Distance', type: 'number', required: true },
        { name: 'spStrippingAcceleration', label: 'SP Stripping Acceleration', type: 'number', required: true },
        { name: 'spStrippingDistance', label: 'SP Stripping Distance', type: 'number', required: true },
        { name: 'mouldThicknessPlus10', label: 'Mould Thickness ±10mm', type: 'number', required: true },
        { name: 'closeUpForceMouldCloseUpPressure', label: 'Close-Up Force / Pressure', type: 'text', required: true },
        { name: 'remarks', label: 'Remarks', type: 'textarea', required: true }
    ]
};

export const impactEditConfig = {
    endpoint: API_ENDPOINTS.impactTests,
    title: 'Edit Impact Entry',
    fields: [
        { name: 'partName', label: 'Part Name', type: 'text', required: true },
        { name: 'dateCode', label: 'Date Code', type: 'text', required: true, uppercase: true },
        { name: 'specification', label: 'Specification', type: 'text' },
        // Stored as a comma-separated list ("12.5, 34.6"); edited as one row per value.
        { name: 'observedValue', label: 'Observed Value', type: 'numberList', serialize: 'csv' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' }
    ]
};

export const tensileEditConfig = {
    endpoint: API_ENDPOINTS.tensile,
    title: 'Edit Tensile Entry',
    fields: [
        { name: 'item', label: 'Item', type: 'text', required: true },
        { name: 'dateCode', label: 'Date Code', type: 'text', uppercase: true },
        { name: 'heatCode', label: 'Heat Code', type: 'text' },
        { name: 'dia', label: 'Diameter', type: 'number' },
        { name: 'lo', label: 'Lo', type: 'number' },
        { name: 'li', label: 'Li', type: 'number' },
        { name: 'breakingLoad', label: 'Breaking Load', type: 'number' },
        { name: 'yieldLoad', label: 'Yield Load', type: 'number' },
        { name: 'uts', label: 'UTS', type: 'number' },
        { name: 'ys', label: 'YS', type: 'number' },
        { name: 'elongation', label: 'Elongation', type: 'number' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
        { name: 'testedBy', label: 'Tested By', type: 'text' }
    ]
};

export const microTensileEditConfig = {
    endpoint: API_ENDPOINTS.microTensile,
    title: 'Edit Micro Tensile Entry',
    fields: [
        { name: 'disa', label: 'DISA', type: 'select', options: DISA_OPTIONS, required: true },
        { name: 'item.it1', label: 'Item (it1)', type: 'text', required: true },
        { name: 'item.it2', label: 'Item (it2)', type: 'text' },
        { name: 'dateCode', label: 'Date Code', type: 'text', required: true, uppercase: true },
        { name: 'heatCode', label: 'Heat Code', type: 'text' },
        { name: 'barDia', label: 'Bar Dia', type: 'number' },
        { name: 'gaugeLength', label: 'Gauge Length', type: 'number' },
        { name: 'maxLoad', label: 'Max Load', type: 'number' },
        { name: 'yieldLoad', label: 'Yield Load', type: 'number' },
        { name: 'tensileStrength', label: 'Tensile Strength', type: 'number' },
        { name: 'yieldStrength', label: 'Yield Strength', type: 'number' },
        { name: 'elongation', label: 'Elongation', type: 'number' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' },
        { name: 'testedBy', label: 'Tested By', type: 'text' }
    ]
};

export const microStructureEditConfig = {
    endpoint: API_ENDPOINTS.microStructure,
    title: 'Edit Micro Structure Entry',
    fields: [
        { name: 'disa', label: 'DISA', type: 'select', options: DISA_OPTIONS, required: true },
        { name: 'partName', label: 'Part Name', type: 'text', required: true },
        { name: 'dateCode', label: 'Date Code', type: 'text', required: true, uppercase: true },
        { name: 'heatCode', label: 'Heat Code', type: 'number' },
        { name: 'nodularity', label: 'Nodularity %', type: 'number' },
        { name: 'graphiteType', label: 'Graphite Type', type: 'text' },
        { name: 'countMin', label: 'Count Min', type: 'number' },
        { name: 'countMax', label: 'Count Max', type: 'number' },
        { name: 'sizeMin', label: 'Size Min', type: 'number' },
        { name: 'sizeMax', label: 'Size Max', type: 'number' },
        { name: 'ferriteMin', label: 'Ferrite Min %', type: 'number' },
        { name: 'ferriteMax', label: 'Ferrite Max %', type: 'number' },
        { name: 'pearliteMin', label: 'Pearlite Min %', type: 'number' },
        { name: 'pearliteMax', label: 'Pearlite Max %', type: 'number' },
        { name: 'carbideMin', label: 'Carbide Min %', type: 'number' },
        { name: 'carbideMax', label: 'Carbide Max %', type: 'number' },
        { name: 'remarks', label: 'Remarks', type: 'textarea' }
    ]
};

// ts/ys/el are variable-length arrays capped at 4 rows, matching the entry form — ts holds numbers, ys/el hold 'min - max' strings.
export const qcProductionEditConfig = {
    endpoint: API_ENDPOINTS.qcReports,
    title: 'Edit QC Production Entry',
    fields: [
        { name: 'partName', label: 'Part Name', type: 'text', required: true },
        { name: 'noOfMoulds', label: 'No. of Moulds', type: 'number' },
        { name: 'cPercentFrom', label: 'C % From', type: 'number' },
        { name: 'cPercentTo', label: 'C % To', type: 'number' },
        { name: 'siPercentFrom', label: 'Si % From', type: 'number' },
        { name: 'siPercentTo', label: 'Si % To', type: 'number' },
        { name: 'mnPercentFrom', label: 'Mn % From', type: 'number' },
        { name: 'mnPercentTo', label: 'Mn % To', type: 'number' },
        { name: 'pPercentFrom', label: 'P % From', type: 'number' },
        { name: 'pPercentTo', label: 'P % To', type: 'number' },
        { name: 'sPercentFrom', label: 'S % From', type: 'number' },
        { name: 'sPercentTo', label: 'S % To', type: 'number' },
        { name: 'mgPercentFrom', label: 'Mg % From', type: 'number' },
        { name: 'mgPercentTo', label: 'Mg % To', type: 'number' },
        { name: 'cuPercentFrom', label: 'Cu % From', type: 'number' },
        { name: 'cuPercentTo', label: 'Cu % To', type: 'number' },
        { name: 'crPercentFrom', label: 'Cr % From', type: 'number' },
        { name: 'crPercentTo', label: 'Cr % To', type: 'number' },
        { name: 'nodularity', label: 'Nodularity', type: 'number' },
        { name: 'noduleCount', label: 'Nodule Count', type: 'number' },
        { name: 'graphiteTypeFrom', label: 'Graphite Type From', type: 'number' },
        { name: 'graphiteTypeTo', label: 'Graphite Type To', type: 'number' },
        { name: 'pearlite', label: 'Pearlite', type: 'number' },
        { name: 'ferrite', label: 'Ferrite', type: 'number' },
        { name: 'hardnessBHNFrom', label: 'Hardness BHN From', type: 'number' },
        { name: 'hardnessBHNTo', label: 'Hardness BHN To', type: 'number' },
        { name: 'ts', label: 'TS', type: 'numberList', max: 4 },
        { name: 'ys', label: 'YS', type: 'rangeList', max: 4 },
        { name: 'el', label: 'EL', type: 'rangeList', max: 4 }
    ]
};
