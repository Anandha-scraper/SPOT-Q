// Micro Tensile — validation/deviation rules. Single source of truth
// consumed by MicroTensile.jsx (Info.jsx reference card + submit validation)
// and MicroTensileReport.jsx (admin-only isDeviant() highlighting). Mirrors
// the required/min/max constraints on backend/models/MicroTensile.js.
export const validationRanges = [
  { field: 'Date', required: true, type: 'Date', pattern: 'DD/MM/YYYY' },
  { field: 'DISA', required: true, type: 'Select', allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'] },
  { field: 'Item', required: true, type: 'Text', pattern: 'e.g., Volvo Bkt 234' },
  { field: 'Item (Optional)', required: false, type: 'Text', pattern: 'e.g., 343/34/56' },
  { field: 'Date Code', required: true, type: 'Text', format: 'dateCode', pattern: 'e.g., 5E04' },
  { field: 'Heat Code', required: false, type: 'Integer', min: 0, pattern: 'e.g., 1' },
  { field: 'Bar Dia', required: false, type: 'Number', unit: 'mm', min: 0, pattern: 'e.g., 6.0' },
  { field: 'Gauge Length', required: false, type: 'Number', unit: 'mm', min: 0, pattern: 'e.g., 30.0' },
  { field: 'Max Load', required: false, type: 'Number', min: 0, exclusiveMin: true, unit: 'Kgs or KN', pattern: 'e.g., 1560' },
  { field: 'Yield Load', required: false, type: 'Number', min: 0, exclusiveMin: true, unit: 'Kgs or KN', pattern: 'e.g., 1290' },
  { field: 'Tensile Strength', required: false, type: 'Number', min: 0, exclusiveMin: true, unit: 'Kg/mm² or MPa', pattern: 'e.g., 550' },
  { field: 'Yield Strength', required: false, type: 'Number', min: 0, exclusiveMin: true, unit: 'Kg/mm² or MPa', pattern: 'e.g., 455' },
  { field: 'Elongation', required: false, type: 'Number', min: 0, unit: '%', pattern: 'e.g., 18.5' },
  { field: 'Remarks', required: false, type: 'Text' },
  { field: 'Tested By', required: false, type: 'Text', pattern: 'e.g., Shanmugam' }
];

export const fieldMapping = {
  'Date': 'date',
  'DISA': 'disa',
  'Item': 'item',
  'Item (Optional)': 'itemSecond',
  'Date Code': 'dateCode',
  'Heat Code': 'heatCode',
  'Bar Dia': 'barDia',
  'Gauge Length': 'gaugeLength',
  'Max Load': 'maxLoad',
  'Yield Load': 'yieldLoad',
  'Tensile Strength': 'tensileStrength',
  'Yield Strength': 'yieldStrength',
  'Elongation': 'elongation',
  'Remarks': 'remarks',
  'Tested By': 'testedBy'
};
