// QC Production — validation/deviation rules. Single source of truth
// consumed by QcProductionDetails.jsx (Info.jsx reference card + submit
// validation) and QcProductionDetailsReport.jsx (admin-only isDeviant()
// highlighting).
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
    pattern: 'e.g., Brake Disc'
  },
  {
    field: 'No. of Moulds',
    required: false,
    type: 'Number',
    min: 1
  },
  {
    field: 'C % (Carbon)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'Si % (Silicon)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'Mn % (Manganese)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'P % (Phosphorus)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'S % (Sulfur)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'Mg % (Magnesium)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'Cu % (Copper)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'Cr % (Chromium)',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '%'
  },
  {
    field: 'Nodularity',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Nodule count',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Graphite Type',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0
  },
  {
    field: 'Pearlite',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Ferrite',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Hardness BHN',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: 'BHN'
  },
  {
    field: 'TS (Tensile Strength)',
    type: 'Dynamic Array',
    min: 0,
    required:false,
    unit: 'MPa',
    maxRows: 4,
  },
  {
    field: 'YS (Yield Strength)',
    required: false,
    type: 'Dynamic Range Array',
    min: 0,
    unit: 'MPa',
    requireMinForMax: true,
    maxRows: 4,
  },
  {
    field: 'EL (Elongation)',
    type: 'Dynamic Range Array',
    min: 0,
    unit: '%',
    required: false,
    requireMinForMax: true,
    maxRows: 4
  }
];

export const fieldMapping = {
  'Date': 'date',
  'Part Name': 'partName',
  'No. of Moulds': 'noOfMoulds',
  'C % (Carbon)': ['cPercentMin', 'cPercentMax'],
  'Si % (Silicon)': ['siPercentMin', 'siPercentMax'],
  'Mn % (Manganese)': ['mnPercentMin', 'mnPercentMax'],
  'P % (Phosphorus)': ['pPercentMin', 'pPercentMax'],
  'S % (Sulfur)': ['sPercentMin', 'sPercentMax'],
  'Mg % (Magnesium)': ['mgPercentMin', 'mgPercentMax'],
  'Cu % (Copper)': ['cuPercentMin', 'cuPercentMax'],
  'Cr % (Chromium)': ['crPercentMin', 'crPercentMax'],
  'Nodularity': 'nodularity',
  'Nodule count': 'noduleCount',
  'Graphite Type': ['graphiteTypeMin', 'graphiteTypeMax'],
  'Pearlite': 'pearlite',
  'Ferrite': 'ferrite',
  'Hardness BHN': ['hardnessBHNMin', 'hardnessBHNMax'],
  'TS (Tensile Strength)': 'tsValues',
  'YS (Yield Strength)': 'ysValues',
  'EL (Elongation)': 'elValues'
};
