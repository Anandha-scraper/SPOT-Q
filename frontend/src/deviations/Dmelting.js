// Melting Log Sheet — validation/deviation rules. Single source of truth
// consumed by MeltingLogSheet.jsx (Info.jsx reference card + submit
// validation) and MeltingLogSheetReport.jsx (admin-only isDeviant()
// highlighting).
//
// RULE SCHEMA: Each validation rule defines constraints for a field including:
// - field: UI label (acts as primary key for field mapping)
// - required: Boolean flag for mandatory field validation
// - type: Validation strategy selector (Text, Number, Integer, Time, etc.)
// - min/max: Boundary constraints for numeric fields
// - pattern: User-facing example/regex pattern (documentation)
export const validationRanges = [
  // TABLE 1 - Charging Composition
  {
    field: 'Heat No',
    required: false,
    type: 'Text',
    pattern: 'e.g., A-001'
  },
  {
    field: 'Grade',
    required: false,
    type: 'Text',
    allowedValues:['SG','FG']
  },
  {
    field: 'Charging Time',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'IF Bath',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Liquid Metal - Press & Pour',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Liquid Metal - Holder',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'SG MS Steel',
    required: false,
    type: 'Number',
    min: 400,
    max:2500,
    unit: 'Kgs'
  },
  {
    field: 'Grey MS Steel',
    required: false,
    type: 'Number',
    min: 400,
    max: 2500,
    unit: 'Kgs'
  },
  {
    field: 'Returns (SG)',
    required: false,
    type: 'Number',
    min: 500,
    max:2500,
    unit: 'Kgs'
  },
  {
    field: 'Pig Iron',
    required: false,
    type: 'Number',
    min: 0,
    max:350,
    unit: 'Kgs'
  },
  {
    field: 'Borings',
    required: false,
    type: 'Number',
    min: 0,
    max:1900,
    unit: 'Kgs'
  },
  {
    field: 'Final Bath',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  // TABLE 2 - Fuel & Additives
  {
    field: 'Char Coal',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'CPC (Furnace)',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'CPC (L/C)',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Silicon Carbide (Furnace)',
    required: false,
    type: 'Number',
    min: 3,
    max: 9,
    unit: 'Kgs'
  },
  {
    field: 'Ferrosilicon (Furnace)',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Ferrosilicon (L/C)',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Ferromanganese (Furnace)',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Ferromanganese (L/C)',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Cu',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Cr',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Pure Mg',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Iron Pyrite',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  // TABLE 3 - Lab Analysis
  {
    field: 'Lab Coin Time',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Lab Coin Temp (C)',
    required: false,
    type: 'Number',
    min: 0,
    unit: '°C'
  },
  {
    field: 'Deslag Time From',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Deslag Time To',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Metal Ready Time',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Waiting for Tapping From',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Waiting for Tapping To',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Reason',
    required: false,
    type: 'Text',
    pattern: 'e.g., Maintenance delay'
  },
  // TABLE 4 - Temperature Monitoring
  {
    field: 'Temp Time',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Temp C - SG',
    required: false,
    type: 'Number',
    min: 1440,
    max:1550,
    unit: '°C'
  },
  {
    field: 'Direct Furnace',
    required: false,
    type: 'Number',
    min: 0,
    unit: '°C'
  },
  {
    field: 'Holder to Furnace',
    required: false,
    type: 'Number',
    min: 0,
    unit: '°C'
  },
  {
    field: 'Furnace to Holder',
    required: false,
    type: 'Number',
    min: 0,
    unit: '°C'
  },
  {
    field: 'DISA No',
    required: false,
    type: 'Text',
    allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
  },
  {
    field: 'Item',
    required: false,
    type: 'Text',
    pattern: 'e.g., Item-001'
  },
  // TABLE 5 - Furnace Power
  {
    field: 'Furnace 1 KW',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'KW'
  },
  {
    field: 'Furnace 1 A',
    required: false,
    type: 'Number',
    min: 2000,
    max:3500,
    unit: 'Amps'
  },
  {
    field: 'Furnace 1 V',
    required: false,
    type: 'Number',
    min: 500,
    max:1000,
    unit: 'Volts'
  },
  {
    field: 'Furnace 4 Hz',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Hz'
  },
  {
    field: 'Furnace 4 Gld',
    required: false,
    type: 'Number',
    min: 0.6,
    max: 95,
    unit: 'Amps'
  },
  {
    field: 'Furnace 4 KW/Hr',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'KW/Hr'
  }
];

// Maps UI labels in validationRanges to actual form data property names across
// the five table states (table1, table2, table3, table4, table5).
export const fieldMapping = {
  // TABLE 1
  'Heat No': 'heatNo',
  'Grade': 'grade',
  'Charging Time': ['chargingTimeHour', 'chargingTimeMinute'],
  'IF Bath': 'ifBath',
  'Liquid Metal - Press & Pour': 'liquidMetalPressPour',
  'Liquid Metal - Holder': 'liquidMetalHolder',
  'SG MS Steel': 'sgMsSteel',
  'Grey MS Steel': 'greyMsSteel',
  'Returns (SG)': 'returnsSg',
  'Pig Iron': 'pigIron',
  'Borings': 'borings',
  'Final Bath': 'finalBath',
  // TABLE 2
  'Char Coal': 'charCoal',
  'CPC (Furnace)': 'cpcFur',
  'CPC (L/C)': 'cpcLc',
  'Silicon Carbide (Furnace)': 'siliconCarbideFur',
  'Ferrosilicon (Furnace)': 'ferrosiliconFur',
  'Ferrosilicon (L/C)': 'ferrosiliconLc',
  'Ferromanganese (Furnace)': 'ferroManganeseFur',
  'Ferromanganese (L/C)': 'ferroManganeseLc',
  'Cu': 'cu',
  'Cr': 'cr',
  'Pure Mg': 'pureMg',
  'Iron Pyrite': 'ironPyrite',
  // TABLE 3
  'Lab Coin Time': ['labCoinTimeHour', 'labCoinTimeMinute'],
  'Lab Coin Temp (C)': 'labCoinTempC',
  'Deslag Time From': ['deslagingTimeFromHour', 'deslagingTimeFromMinute'],
  'Deslag Time To': ['deslagingTimeToHour', 'deslagingTimeToMinute'],
  'Metal Ready Time': ['metalReadyTimeHour', 'metalReadyTimeMinute'],
  'Waiting for Tapping From': ['waitingForTappingFromHour', 'waitingForTappingFromMinute'],
  'Waiting for Tapping To': ['waitingForTappingToHour', 'waitingForTappingToMinute'],
  'Reason': 'reason',
  // TABLE 4
  'Temp Time': ['timeHour', 'timeMinute'],
  'Temp C - SG': 'tempCSg',
  'Direct Furnace': 'directFurnace',
  'Holder to Furnace': 'holderToFurnace',
  'Furnace to Holder': 'furnaceToHolder',
  'DISA No': 'disaNo',
  'Item': 'item',
  // TABLE 5
  'Furnace 1 KW': 'furnace1Kw',
  'Furnace 1 A': 'furnace1A',
  'Furnace 1 V': 'furnace1V',
  'Furnace 4 Hz': 'furnace4Hz',
  'Furnace 4 Gld': 'furnace4Gld',
  'Furnace 4 KW/Hr': 'furnace4KwHr'
};
