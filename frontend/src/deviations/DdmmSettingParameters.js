// Moulding — DMM Setting Parameters. This department had no deviation config at
// all; the rules below replace the hardcoded requiredFields/numericFields arrays
// that used to live inside DmmSettingParameters.jsx#validateShiftField.
//
// Types and required flags only — no min/max. The real QC spec ranges are not
// recorded anywhere in the codebase, and a wrong number here would flag good data
// as deviant. Add `min`/`max` to a rule when the spec is known; until then a field
// is format-validated (blocking) but never flagged as out-of-spec.

export const validationRanges = [
  // Primary
  { field: 'Date', required: true, type: 'Date', pattern: 'DD/MM/YYYY' },
  { field: 'Machine', required: true, type: 'Text' },

  // Shift parameters — identification
  { field: 'Customer', required: true, type: 'Text' },
  { field: 'Item Description', required: true, type: 'Text' },
  { field: 'Time', required: true, type: 'Time', pattern: 'HH:MM' },

  // Shift parameters — measured values
  { field: 'PP Thickness', required: true, type: 'Number', unit: 'mm' },
  { field: 'PP Height', required: true, type: 'Number', unit: 'mm' },
  { field: 'SP Thickness', required: true, type: 'Number', unit: 'mm' },
  { field: 'SP Height', required: true, type: 'Number', unit: 'mm' },
  { field: 'Core Mask Thickness', required: true, type: 'Number', unit: 'mm' },
  { field: 'Core Mask Height (Outside)', required: true, type: 'Number', unit: 'mm' },
  { field: 'Core Mask Height (Inside)', required: true, type: 'Number', unit: 'mm' },
  { field: 'Sand Shot Pressure', required: true, type: 'Number', unit: 'bar' },
  { field: 'Correction Shot Time', required: true, type: 'Number', unit: 's' },
  { field: 'Squeeze Pressure', required: true, type: 'Number', unit: 'bar' },
  { field: 'PP Stripping Acceleration', required: true, type: 'Number' },
  { field: 'PP Stripping Distance', required: true, type: 'Number', unit: 'mm' },
  { field: 'SP Stripping Acceleration', required: true, type: 'Number' },
  { field: 'SP Stripping Distance', required: true, type: 'Number', unit: 'mm' },
  { field: 'Mould Thickness +10', required: true, type: 'Number', unit: 'mm' },

  // Free text
  { field: 'Close Up Force / Mould Close Up Pressure', required: true, type: 'Text' },
  { field: 'Remarks', required: true, type: 'Text' },
];

export const primaryFieldMapping = {
  Date: 'date',
  Machine: 'machine',
};

// Rule label -> shift-parameter row field name; the form validates one shift row
// at a time (runValidation with the row as formData).
export const shiftFieldMapping = {
  Customer: 'customer',
  'Item Description': 'itemDescription',
  Time: 'time',
  'PP Thickness': 'ppThickness',
  'PP Height': 'ppHeight',
  'SP Thickness': 'spThickness',
  'SP Height': 'spHeight',
  'Core Mask Thickness': 'coreMaskThickness',
  'Core Mask Height (Outside)': 'coreMaskHeightOutside',
  'Core Mask Height (Inside)': 'coreMaskHeightInside',
  'Sand Shot Pressure': 'sandShotPressureBar',
  'Correction Shot Time': 'correctionShotTime',
  'Squeeze Pressure': 'squeezePressure',
  'PP Stripping Acceleration': 'ppStrippingAcceleration',
  'PP Stripping Distance': 'ppStrippingDistance',
  'SP Stripping Acceleration': 'spStrippingAcceleration',
  'SP Stripping Distance': 'spStrippingDistance',
  'Mould Thickness +10': 'mouldThicknessPlus10',
  'Close Up Force / Mould Close Up Pressure': 'closeUpForceMouldCloseUpPressure',
  Remarks: 'remarks',
};

export const fieldMapping = { ...primaryFieldMapping, ...shiftFieldMapping };

// Report-column key -> rule label, for the report page's deviation flags.
export const keyToRuleField = Object.fromEntries(
  Object.entries(fieldMapping).map(([label, key]) => [key, label])
);
