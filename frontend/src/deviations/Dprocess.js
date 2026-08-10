export const validationRanges = [
  {
    field: 'Date',
    required: true,
    type: 'Date',
    pattern: 'DD/MM/YYYY'
  },
  {
    field: 'DISA',
    required: true,
    type: 'Select',
    allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
  },
  {
    field: 'Part Name',
    required: true,
    type: 'Text',
    pattern: 'e.g., ABC-123'
  },
  {
    field: 'Date Code',
    required: true,
    type: 'Text',
    format: 'dateCode',
    pattern: 'e.g., 6F25'
  },
  {
    field: 'Heat Code',
    required: false,
    type: 'Number'
  },
  {
    field: 'Qty. Of Moulds',
    required: false,
    type: 'Number',
    min: 0
  },
  {
    field: 'Metal Composition - C',
    required: false,
    type: 'Number',
    min: 0,
    max:100,
    unit: '%'
  },
  {
    field: 'Metal Composition - Si',
    required: false,
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Metal Composition - Mn',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Metal Composition - P',
    required: false,
    type: 'Number',
    min: 0,
    max: 100,
    unit: '%'
  },
  {
    field: 'Metal Composition - S',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Metal Composition - Mg F/L',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Metal Composition - Cu',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Metal Composition - Cr',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Time of Pouring (Range)',
    required: false,
    type: 'Time Range',
    // The 60-minute cap is a spec note for the Info card, not a numeric bound —
    // these are clock times, so a numeric min/max would compare the wrong thing.
    unit: 'max 60 min',
    pattern: 'HH:MM - HH:MM'
  },
  {
    field: 'Pouring Temp',
    required: false,
    type: 'Number Range',
    requireMinForMax: true,
    min: 0,
    unit: '°C',
    pattern: 'Min - Max (e.g., 1400 - 1500)'
  },
  {
    field: 'PP Code',
    required: false,
    type: 'Integer'
  },
  {
    field: 'Treatment No',
    required: false,
    type: 'Integer'
  },
  {
    field: 'F/C No.',
    required: false,
    type: 'Select',
    allowedValues: ['1', '2', '3', '4','H1','H2']
  },
  {
    field: 'Heat No',
    required: false,
    type:'Number',
    min:0
  },
  {
    field: 'Con No',
    required: false,
    type: 'Number'
  },
  {
    field: 'Tapping Time',
    required: false,
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Corrective Addition - C',
    required: false,
    type: 'Number',
    min: 0,
    max:100,
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Si',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Mn',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - S',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Cr',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Cu',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Sn',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Tapping Wt',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Mg',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'Kgs'
  },
  {
    field: 'Res. Mg. Convertor',
    required: false,
    type: 'Number',
    min: 0,
    max: 100,
    unit: '%'
  },
  {
    field: 'Rec. Of Mg',
    required: false,
    type: 'Number',
    min: 0,
    unit: '%'
  },
  {
    field: 'Stream Inoculant',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'gm/Sec',
    pattern: 'e.g., 5.5'
  },
  {
    field: 'P.Time',
    required: false,
    type: 'Number',
    min: 0,
    unit: 'sec',
    pattern: 'e.g., 120'
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
  'DISA': 'disa',
  'Part Name': 'partName',
  'Date Code': 'datecode',
  'Heat Code': 'heatcode',
  'Qty. Of Moulds': 'quantityOfMoulds',
  'Metal Composition - C': 'metalCompositionC',
  'Metal Composition - Si': 'metalCompositionSi',
  'Metal Composition - Mn': 'metalCompositionMn',
  'Metal Composition - P': 'metalCompositionP',
  'Metal Composition - S': 'metalCompositionS',
  'Metal Composition - Mg F/L': 'metalCompositionMgFL',
  'Metal Composition - Cu': 'metalCompositionCu',
  'Metal Composition - Cr': 'metalCompositionCr',
  'Pouring Temp': ['pouringTemperatureMin', 'pouringTemperatureMax'],
  'PP Code': 'ppCode',
  'Treatment No': 'treatmentNo',
  'F/C No.': 'fcNo',
  'Heat No': 'heatNo',
  'Con No': 'conNo',
  'Corrective Addition - C': 'correctiveAdditionC',
  'Corrective Addition - Si': 'correctiveAdditionSi',
  'Corrective Addition - Mn': 'correctiveAdditionMn',
  'Corrective Addition - S': 'correctiveAdditionS',
  'Corrective Addition - Cr': 'correctiveAdditionCr',
  'Corrective Addition - Cu': 'correctiveAdditionCu',
  'Corrective Addition - Sn': 'correctiveAdditionSn',
  'Tapping Wt': 'tappingWt',
  'Mg': 'mg',
  'Res. Mg. Convertor': 'resMgConvertor',
  'Rec. Of Mg': 'recOfMg',
  'Stream Inoculant': 'streamInoculant',
  'P.Time': 'pTime',
  'Remarks': 'remarks'
};
