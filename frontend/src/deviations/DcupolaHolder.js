// Melting — Cupola Holder Log Sheet. Single source of truth for the Info modal,
// the entry form's row validation, and CupolaHolderLogSheetReport's admin-only
// deviation highlighting. Moved here from pages/Melting/CupolaHolderLogSheet.jsx.
//
// Every rule below describes one column of the input rows, so the form validates
// a row at a time (runValidation with the row as formData).

export const validationRanges = [
  // Auto-generated per holder & date — never typed, so nothing to validate.
  { key: 'heatNo', field: 'Heat No', required: false, type: 'Auto', description: 'Auto-incremented per holder & date' },

  { key: 'cpc', field: 'CPC', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
  { key: 'mFeSl', field: 'Fe Sl', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
  { key: 'feMn', field: 'Fe Mn', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
  { key: 'sic', field: 'SIC', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
  { key: 'pureMg', field: 'Pure Mg', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
  { key: 'cu', field: 'Cu', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
  { key: 'feCr', field: 'Fe Cr', required: false, type: 'Number', min: 0, max: 1000, unit: 'Kgs' },

  { key: 'actualTime', field: 'Actual Time', required: false, type: 'Time', pattern: 'HH:MM' },
  { key: 'tappingTime', field: 'Tapping Time', required: false, type: 'Time', pattern: 'HH:MM' },
  { key: 'tappingTemp', field: 'Temp', required: false, type: 'Number', min: 1, max: 1700, unit: '°C' },
  { key: 'metalKg', field: 'Metal', required: false, type: 'Number', min: 0, max: 5000, unit: 'Kgs' },

  { key: 'disaLine', field: 'DISA Line', required: true, type: 'Select', allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'] },
  { key: 'indFur', field: 'IND FUR', required: false, type: 'Text' },
  { key: 'bailNo', field: 'BAIL NO', required: false, type: 'Text' },
  { key: 'tap', field: 'TAP', required: false, type: 'Text' },
  { key: 'kw', field: 'KW', required: false, type: 'Number', min: 0, max: 5000, unit: 'KW' },
  { key: 'remarks', field: 'Remarks', required: false, type: 'Text' },
];

// Rule label -> input row field name.
export const fieldMapping = {
  'Heat No': 'heatNo',
  CPC: 'cpc',
  'Fe Sl': 'mFeSl',
  'Fe Mn': 'feMn',
  SIC: 'sic',
  'Pure Mg': 'pureMg',
  Cu: 'cu',
  'Fe Cr': 'feCr',
  'Actual Time': 'actualTime',
  'Tapping Time': 'tappingTime',
  Temp: 'tappingTemp',
  Metal: 'metalKg',
  'DISA Line': 'disaLine',
  'IND FUR': 'indFur',
  'BAIL NO': 'bailNo',
  TAP: 'tap',
  KW: 'kw',
  Remarks: 'remarks',
};

// Report pages key their columns by the row field name, so they need the inverse.
export const keyToRuleField = Object.fromEntries(
  Object.entries(fieldMapping).map(([label, key]) => [key, label])
);
