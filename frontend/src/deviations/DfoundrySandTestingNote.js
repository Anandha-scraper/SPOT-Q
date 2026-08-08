export const validationRanges = [
  { field: 'Date', required: true, type: 'Date' },
  { field: 'Shift', required: true, type: 'Select', allowedValues: ['Shift I', 'Shift II', 'Shift III'] },
  { field: 'Sand Plant', required: true, type: 'Select', allowedValues: ['Eirich', 'Disa', 'Foundry-A'], description: 'Select the sand plant' },
  { field: 'Compactability Setting', required: false, type: 'Text', pattern: 'e.g. J.C. mode', description: 'Enter the compactability machine setting' },
  { field: 'Shear/Mould Strength Setting', required: false, type: 'Text', pattern: 'e.g. MP.VOX', description: 'Enter the shear/mould strength machine setting' },
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
  { field: 'MF Product (TEST-1 & TEST-2)', required: false, type: 'Number', description: 'Enter the product value for each MF sieve row' },
  // Test Parameters
  { field: 'Compactability', required: false, type: 'Number', unit: '%', min: 33, max: 40 },
  { field: 'Permeability', required: false, type: 'Number', min: 90, max: 160 },
  { field: 'GCS', required: false, type: 'Number', unit: 'Gm/cm²', description: 'Green Compressive Strength' },
  { field: 'WTS', required: false, type: 'Number', unit: 'N/cm²', min: 0.15, description: 'Minimum 0.15' },
  { field: 'Moisture', required: false, type: 'Number', unit: '%', min: 3.0, max: 4.0 },
  { field: 'Bentonite', required: false, type: 'Number', description: 'Bentonite addition quantity' },
  { field: 'CoalDust', required: false, type: 'Number', description: 'Coal dust addition quantity' },
  { field: 'Hopper Level', required: false, type: 'Text', description: 'Return sand hopper level reading' },
  { field: 'Shear Strength', required: false, type: 'Number', unit: 'N/cm²' },
  { field: 'Dust Collector Settings', required: false, type: 'Text', description: 'Dust collector machine settings' },
  { field: 'Return Sand Moisture', required: false, type: 'Number', unit: '%' },
  // Additional Data
  { field: 'AFS No.', required: false, type: 'Number', min: 48, description: 'Minimum 48' },
  { field: 'Fines', required: false, type: 'Number', unit: '%', max: 10, description: 'Maximum 10%' },
  { field: 'GD', required: false, type: 'Number', description: 'Green Density value' },
  // Remarks
  { field: 'Remarks', required: false, type: 'Text', maxLength: 80, description: 'Any additional observations or notes' }
];
