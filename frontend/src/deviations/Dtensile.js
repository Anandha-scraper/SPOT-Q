// Tensile — validation/deviation rules. Single source of truth consumed by
// Tensile.jsx (Info.jsx reference card + submit validation) and
// TensileReport.jsx (admin-only isDeviant() highlighting).
export const validationRanges = [
  {
    field: 'Date Of Inspection',
    required: true,
    type: 'Date',
    pattern: 'YYYY-MM-DD'
  },
  {
    field: 'Item',
    required: true,
    type: 'Text',
    pattern: 'e.g., Cast Iron Bar'
  },
  {
    field: 'Date Code',
    required: false,
    type: 'Text',
    format: 'dateCode',
    pattern: '5E04 (1 digit, 1 letter, 2 digits)'
  },
  {
    field: 'Heat Code',
    required: false,
    type: 'Number',
    pattern: 'e.g., 12345'
  },
  {
    field: 'Dia',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'mm',
    pattern: 'e.g., 12.5'
  },
  {
    field: 'Lo',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'mm',
    pattern: 'e.g., 50.0'
  },
  {
    field: 'Li',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'mm',
    pattern: 'e.g., 58.0'
  },
  {
    field: 'Breaking Load',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'kN',
    pattern: 'e.g., 48.5'
  },
  {
    field: 'Yield Load',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'kN',
    pattern: 'e.g., 38.0'
  },
  {
    field: 'UTS',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'N/mm²',
    pattern: 'e.g., 680.0'
  },
  {
    field: 'YS',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'N/mm²',
    pattern: 'e.g., 460.0'
  },
  {
    field: 'Elongation',
    required: false,
    type: 'Number',
    min: 0,
    max: 100,
    unit: '%',
    pattern: 'e.g., 18.5'
  },
  {
    field: 'Tested By',
    required: false,
    type: 'Text',
    pattern: 'e.g., John Doe'
  },
  {
    field: 'Remarks',
    required: false,
    type: 'Text',
    maxLength: 200
  }
];

export const fieldMapping = {
  'Date Of Inspection': 'dateOfInspection',
  'Item': 'item',
  'Date Code': 'dateCode',
  'Heat Code': 'heatCode',
  'Dia': 'dia',
  'Lo': 'lo',
  'Li': 'li',
  'Breaking Load': 'breakingLoad',
  'Yield Load': 'yieldLoad',
  'UTS': 'uts',
  'YS': 'ys',
  'Elongation': 'elongation',
  'Tested By': 'testedBy',
  'Remarks': 'remarks'
};
