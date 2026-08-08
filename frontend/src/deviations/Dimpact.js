// Impact — validation/deviation rules. Single source of truth consumed by
// Impact.jsx (Info.jsx reference card + submit validation) and
// ImpactReport.jsx (admin-only isDeviant() highlighting).
export const validationRanges = [
  {
    field: 'Date',
    required: true,
    type: 'Date',
    pattern: 'DD/MM/YYYY'
  },
  {
    field: 'Part Name',
    required: true,
    type: 'Text',
    pattern: 'Alphanumeric'
  },
  {
    field: 'Date Code',
    required: true,
    type: 'Text',
    format: 'dateCode',
    pattern: 'e.g., 6F25'
  },
  {
    field: 'Specification',
    required: false,
    type: 'Text',
    pattern: 'e.g., 12.5 J, 30° unnotch'
  },
  {
    field: 'Observed Value',
    required: false,
    type: 'NumberArray',
    pattern: 'Individual number inputs (e.g., 12.5 each)',
    min: 0,
    maxRows: 5,
  },
  {
    field: 'Remarks',
    required: false,
    type: 'Text',
    maxLength: 200
  }
];

export const fieldMapping = {
  'Date': 'date',
  'Part Name': 'partName',
  'Date Code': 'dateCode',
  'Specification': 'specification',
  'Observed Value': 'observedValues',
  'Remarks': 'remarks'
};
