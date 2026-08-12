// Micro Structure — validation/deviation rules. Single source of truth
// consumed by MicroStructure.jsx (Info.jsx reference card + submit
// validation) and MicroStructureReport.jsx (admin-only isDeviant()
// highlighting). Each rule carries the state `key` it validates (a string
// for single fields, a [min, max] pair for range fields), so `handleSubmit`
// can verify the whole form by iterating this array alone.
export const validationRanges = [
  {
    field: 'Date',
    key: 'date',
    required: true,
    type: 'Date',
    pattern: 'DD/MM/YYYY'
  },
  {
    field: 'DISA',
    key: 'disa',
    required: true,
    type: 'Select',
    allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
  },
  {
    field: 'Part Name',
    key: 'partName',
    required: true,
    type: 'Text',
    pattern: 'e.g., Brake Disc'
  },
  {
    field: 'Date Code',
    key: 'dateCode',
    required: true,
    type: 'Text',
    format: 'dateCode',
    pattern: 'e.g., 3A15'
  },
  {
    field: 'Heat Code',
    key: 'heatCode',
    required: false,
    type: 'Number',
    pattern: 'e.g., 20'
  },
  {
    field: 'Nodularity %',
    key: 'nodularity',
    required: false,
    type: 'Number',
    min: 0,
    max: 100,
    unit: '%'
  },
  {
    field: 'Graphite Type',
    key: 'graphiteType',
    required: false,
    type: 'Text'
  },
  // Range fields - combined min/max pairs
  {
    field: 'Count Range',
    key: ['countMin', 'countMax'],
    required: false,
    type: 'NumberRange',
    requireMinForMax: true,
    min: 0,
    unit: 'count'
  },
  {
    field: 'Size Range',
    key: ['sizeMin', 'sizeMax'],
    required: false,
    type: 'NumberRange',
    requireMinForMax: true,
    min: 0,
    unit: 'μm'
  },
  {
    field: 'Ferrite Range %',
    key: ['ferriteMin', 'ferriteMax'],
    required: false,
    type: 'NumberRange',
    requireMinForMax: true,
    min: 0,
    max: 100,
    unit: '%'
  },
  {
    field: 'Pearlite Range %',
    key: ['pearliteMin', 'pearliteMax'],
    required: false,
    type: 'NumberRange',
    requireMinForMax: true,
    min: 0,
    max: 100,
    unit: '%'
  },
  {
    field: 'Carbide Range %',
    key: ['carbideMin', 'carbideMax'],
    required: false,
    type: 'NumberRange',
    requireMinForMax: true,
    min: 0,
    max: 100,
    unit: '%'
  },
  {
    field: 'Remarks',
    key: 'remarks',
    required: false,
    type: 'Text'
  }
];

// Rule `key` doubles as the formData key, so the mapping falls out of the rules.
export const fieldMapping = Object.fromEntries(validationRanges.map(r => [r.field, r.key]));
