export const validationRanges = [
  { field: 'Date', required: true, type: 'Date' },
  { field: 'Shift', required: true, type: 'Select', allowedValues: ['Shift 1', 'Shift 2', 'Shift 3'] },
  { field: 'Plant', required: true, type: 'Select', allowedValues: ['Eirich', 'Disa', 'Foundry-A'], description: 'Select the return sand plant' },
  // Clay Parameters
  { field: 'Total Clay — Input 1 & 2 & 3', required: false, type: 'Number', description: 'Formula: (Input1 − Input2) / Input3 × 100 = Solution %' },
  { field: 'Total Clay (Solution %)', required: false, type: 'Number', unit: '%', min: 11.0, max: 14.5 },
  { field: 'Active Clay — Input 1 & 2', required: false, type: 'Number', description: 'Formula: Input1 × Input2 = Solution %' },
  { field: 'Active Clay (Solution %)', required: false, type: 'Number', unit: '%', min: 8.5, max: 11.0 },
  { field: 'Dead Clay — Input 1 & 2', required: false, type: 'Number', description: 'Formula: Input1 − Input2 = Solution %' },
  { field: 'Dead Clay (Solution %)', required: false, type: 'Number', unit: '%', min: 2.0, max: 4.0 },
  { field: 'VCM — Input 1 & 2 & 3', required: false, type: 'Number', description: 'Formula: (Input1 − Input2) / Input3 × 100 = Solution %' },
  { field: 'VCM (Solution %)', required: false, type: 'Number', unit: '%', min: 2.0, max: 3.2 },
  { field: 'LOI — Input 1 & 2 & 3', required: false, type: 'Number', description: 'Formula: (Input1 − Input2) / Input3 × 100 = Solution %' },
  { field: 'LOI (Solution %)', required: false, type: 'Number', unit: '%', min: 4.5, max: 6.0 },
  // Sieve Testing
  { field: 'Sieve Size — % Wt Retained (TEST-1 & TEST-2)', required: false, type: 'Number', unit: '%', description: 'Enter % weight retained on each sieve size' },
  { field: 'Sieve Total', required: false, type: 'Number', description: 'Auto-computed as the numeric sum of the sieve column; not editable' },
  { field: 'MF Product (TEST-1 & TEST-2)', required: false, type: 'Number', description: 'Enter the product value for each MF sieve row' }
];
