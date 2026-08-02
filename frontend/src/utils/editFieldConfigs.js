// Per-department field configs for EditEntryModal — see frontend.md for the full shape.
import { API_ENDPOINTS } from '../config/api';

const DISA_OPTIONS = ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'];
const FC_NO_OPTIONS = ['1', '2', '3', '4', 'H1', 'H2'];

export const processEditConfig = {
    endpoint: API_ENDPOINTS.process,
    title: 'Edit Process Entry',
    fields: [
        { name: 'disa', label: 'DISA', type: 'select', options: DISA_OPTIONS },
        { name: 'partName', label: 'Part Name', type: 'text' },
        { name: 'datecode', label: 'Date Code', type: 'text' },
        { name: 'heatcode', label: 'Heat Code', type: 'text' },
        { name: 'quantityOfMoulds', label: 'Qty of Moulds', type: 'number' },
        { name: 'metalCompositionC', label: 'Metal C %', type: 'text' },
        { name: 'metalCompositionSi', label: 'Metal Si %', type: 'text' },
        { name: 'metalCompositionMn', label: 'Metal Mn %', type: 'text' },
        { name: 'metalCompositionP', label: 'Metal P %', type: 'text' },
        { name: 'metalCompositionS', label: 'Metal S %', type: 'text' },
        { name: 'metalCompositionMgFL', label: 'Metal Mg F/L %', type: 'text' },
        { name: 'metalCompositionCu', label: 'Metal Cu %', type: 'text' },
        { name: 'metalCompositionCr', label: 'Metal Cr %', type: 'text' },
        { name: 'pouringTemperatureMin', label: 'Pouring Temp Min', type: 'number' },
        { name: 'pouringTemperatureMax', label: 'Pouring Temp Max', type: 'number' },
        { name: 'timeOfPouring', label: 'Time of Pouring', type: 'text' },
        { name: 'ppCode', label: 'PP Code', type: 'text' },
        { name: 'treatmentNo', label: 'Treatment No', type: 'text' },
        { name: 'fcNo', label: 'F/C No', type: 'select', options: FC_NO_OPTIONS },
        { name: 'heatNo', label: 'Heat No', type: 'text' },
        { name: 'conNo', label: 'Con No', type: 'text' },
        { name: 'tappingTime', label: 'Tapping Time', type: 'text' },
        { name: 'correctiveAdditionC', label: 'Corr. C', type: 'text' },
        { name: 'correctiveAdditionSi', label: 'Corr. Si', type: 'text' },
        { name: 'correctiveAdditionMn', label: 'Corr. Mn', type: 'text' },
        { name: 'correctiveAdditionS', label: 'Corr. S', type: 'text' },
        { name: 'correctiveAdditionCr', label: 'Corr. Cr', type: 'text' },
        { name: 'correctiveAdditionCu', label: 'Corr. Cu', type: 'text' },
        { name: 'correctiveAdditionSn', label: 'Corr. Sn', type: 'text' },
        { name: 'tappingWt', label: 'Tapping Wt', type: 'text' },
        { name: 'mg', label: 'Mg', type: 'text' },
        { name: 'resMgConvertor', label: 'Res Mg Convertor', type: 'text' },
        { name: 'recOfMg', label: 'Rec of Mg', type: 'text' },
        { name: 'streamInoculant', label: 'Stream Inoculant', type: 'text' },
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

export const impactEditConfig = {
    endpoint: API_ENDPOINTS.impactTests,
    title: 'Edit Impact Entry',
    fields: [
        { name: 'partName', label: 'Part Name', type: 'text' },
        { name: 'dateCode', label: 'Date Code', type: 'text' },
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
        { name: 'item', label: 'Item', type: 'text' },
        { name: 'dateCode', label: 'Date Code', type: 'text' },
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
        { name: 'disa', label: 'DISA', type: 'select', options: DISA_OPTIONS },
        { name: 'item.it1', label: 'Item (it1)', type: 'text' },
        { name: 'item.it2', label: 'Item (it2)', type: 'text' },
        { name: 'dateCode', label: 'Date Code', type: 'text' },
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
        { name: 'disa', label: 'DISA', type: 'select', options: DISA_OPTIONS },
        { name: 'partName', label: 'Part Name', type: 'text' },
        { name: 'dateCode', label: 'Date Code', type: 'text' },
        { name: 'heatCode', label: 'Heat Code', type: 'text' },
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
        { name: 'partName', label: 'Part Name', type: 'text' },
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
