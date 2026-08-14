// Moulding — Disamatic Product. Single source of truth for the Info modal, the
// entry form's blocking validation, and DisamaticProductReport's admin-only
// deviation highlighting. Moved here from pages/Moulding/DisamaticProduct.jsx so
// every department's rules live under src/deviations/.

export const validationRanges = [
  // Primary
  { field: 'Date', required: true, type: 'Date', pattern: 'DD/MM/YYYY', description: 'Select a valid date. Cannot be in the future.' },
  { field: 'Shift', required: true, type: 'Select', allowedValues: ['Shift 1', 'Shift 2', 'Shift 3'], description: 'Select the current shift' },
  { field: 'Incharge',  type: 'Text', description: 'Name of the shift incharge' },
  { field: 'PP Operator',  type: 'Text', description: 'Name of the PP operator' },
  { field: 'Members Present',  type: 'Text', maxRows: 4, description: 'Up to 4 members can be added' },

  // Production table
  { field: 'Counter No', type: 'Text', description: 'Enter counter number' },
  { field: 'Component Name', type: 'Text', description: 'Name of the component produced' },
  { field: 'Produced', type: 'Number', min: 0, description: 'Number of moulds produced' },
  { field: 'Poured', type: 'Number', min: 0, description: 'Number of moulds poured' },
  { field: 'Cycle Time', type: 'Text', description: 'Cycle time for production' },
  { field: 'Moulds/Hour', type: 'Number', min: 0, description: 'Number of moulds per hour' },
  { field: 'Remarks (Production)', type: 'Text', description: 'Production remarks' },

  // Next shift plan
  { field: 'Component Name (Plan)', type: 'Text', description: 'Component planned for next shift' },
  { field: 'Planned Moulds', type: 'Number', min: 0, description: 'Number of moulds planned' },
  { field: 'Remarks (Plan)', type: 'Text', description: 'Planning remarks' },

  // Delays
  { field: 'Delay Reason', type: 'Text', description: 'Description of the delay' },
  { field: 'Duration (Minutes)', type: 'NumberArray', min: 1, max: 30, unit: 'min', description: 'Duration cannot exceed 30 minutes per entry' },
  { field: 'From Time', type: 'Time', pattern: 'HH:MM AM/PM', description: 'Start time of delay' },
  { field: 'To Time', type: 'Time', pattern: 'HH:MM AM/PM', description: 'End time of delay' },

  // Mould hardness — each cell holds one or more single readings.
  { field: 'Component Name (Hardness)', type: 'Text', description: 'Component name for hardness test' },
  { field: 'Mould Penetrant (PP)', type: 'Number', unit: 'N/cm²', description: 'One reading per entry for the PP side; add more as needed' },
  { field: 'Mould Penetrant (SP)', type: 'Number', unit: 'N/cm²', description: 'One reading per entry for the SP side; add more as needed' },
  { field: 'B-Scale (PP)', type: 'Number', description: 'One reading per entry for the PP side; add more as needed' },
  { field: 'B-Scale (SP)', type: 'Number', description: 'One reading per entry for the SP side; add more as needed' },
  { field: 'Remarks (Hardness)', type: 'Text', description: 'Hardness test remarks' },

  // Pattern temperature
  { field: 'Item', type: 'Text', description: 'Name of the pattern item' },
  { field: 'PP (Temp)', type: 'Number', description: 'PP side temperature value' },
  { field: 'SP (Temp)', type: 'Number', description: 'SP side temperature value' },

  // Events & maintenance
  { field: 'Significant Event', type: 'Text', description: 'Any significant events during the shift' },
  { field: 'Maintenance', type: 'Text', description: 'Maintenance activities or needs' },
  { field: 'Supervisor Name', type: 'Text', description: 'Name of the supervisor' },
];

// This form is sectioned, and each table's rows are validated one row at a time
// (runValidation with the row as formData), so the mapping is split per section
// rather than being one flat fieldMapping.
export const primaryFieldMapping = {
  Date: 'date',
  Shift: 'shift',
  Incharge: 'incharge',
  'PP Operator': 'ppOperator',
};

export const productionFieldMapping = {
  'Counter No': 'counterNo',
  'Component Name': 'componentName',
  Produced: 'produced',
  Poured: 'poured',
  'Cycle Time': 'cycleTime',
  'Moulds/Hour': 'mouldsPerHour',
  'Remarks (Production)': 'remarks',
};

export const nextShiftPlanFieldMapping = {
  'Component Name (Plan)': 'componentName',
  'Planned Moulds': 'plannedMoulds',
  'Remarks (Plan)': 'remarks',
};

// durationMinutes/fromTime/toTime are parallel arrays on one row.
export const delaysFieldMapping = {
  'Delay Reason': 'delays',
  'Duration (Minutes)': 'durationMinutes',
};

// mpPP/mpSP/bsPP/bsSP are arrays of [from, to] pairs — validated per pair by the
// form against the matching 'Number Range' rule, not through this mapping.
export const mouldHardnessFieldMapping = {
  'Component Name (Hardness)': 'componentName',
  'Remarks (Hardness)': 'remarks',
};

export const HARDNESS_READING_RULES = {
  mpPP: 'Mould Penetrant (PP)',
  mpSP: 'Mould Penetrant (SP)',
  bsPP: 'B-Scale (PP)',
  bsSP: 'B-Scale (SP)',
};

export const patternTempFieldMapping = {
  Item: 'item',
  'PP (Temp)': 'pp',
  'SP (Temp)': 'sp',
};

export const eventsFieldMapping = {
  'Significant Event': 'significantEvent',
  Maintenance: 'maintenance',
  'Supervisor Name': 'supervisorName',
};

// Report-column key -> rule label, for DisamaticProductReport's deviation flags.
export const fieldMapping = {
  ...primaryFieldMapping,
  ...productionFieldMapping,
  ...nextShiftPlanFieldMapping,
  ...delaysFieldMapping,
  ...mouldHardnessFieldMapping,
  ...patternTempFieldMapping,
  ...eventsFieldMapping,
};
