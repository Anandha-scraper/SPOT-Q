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
    type: 'Number',
    unit: '°C',
  },
  {
    field: 'Qty. Of Moulds',
    type: 'Number',
  },
  {
    field: 'Metal Composition - C',
    type: 'Number',
    unit: '%',
  },
  {
    field: 'Metal Composition - Si',
    type: 'Number',
    unit: '%',
    
  },
  {
    field: 'Metal Composition - Mn',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Metal Composition - P',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Metal Composition - S',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Metal Composition - Mg F/L',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Metal Composition - Cu',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Metal Composition - Cr',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Time of Pouring (Range)',
    type: 'Time Range',
    unit: '60 min',
    pattern: 'HH:MM - HH:MM'
  },
  {
    field: 'Pouring Temp',
    type: 'Number Range',
    requireMinForMax: true,
    unit: '°C',
    pattern: 'Min - Max (e.g., 1400 - 1500)'
  },
  {
    field: 'PP Code',
    type: 'Integer'
  },
  {
    field: 'Treatment No',
    type: 'Integer',
  },
  {
    field: 'F/C No.',
    type: 'Select',
    allowedValues: ['1', '2', '3', '4','H1','H2']
  },
  {
    field: 'Heat No',
    type: 'Number'
  },
  {
    field: 'Con No',
    type: 'Number'
  },
  {
    field: 'Tapping Time',
    type: 'Time',
    pattern: 'HH:MM'
  },
  {
    field: 'Corrective Addition - C',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Si',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Mn',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - S',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Cr',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Cu',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Corrective Addition - Sn',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Tapping Wt',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Mg',
    type: 'Number',
    unit: 'Kgs'
  },
  {
    field: 'Res. Mg. Convertor',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Rec. Of Mg',
    type: 'Number',
    unit: '%'
  },
  {
    field: 'Stream Inoculant',
    type: 'Number',
    unit: 'gm/Sec',
    pattern: 'e.g., 5.5'
  },
  {
    field: 'P.Time',
    type: 'Number Range',
    requireMinForMax: true,
    unit: 'sec',
    pattern: 'From - To (e.g., 12 - 14)'
  },
  {
    field: 'Remarks',
    required: false,
    type: 'Text',
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
  'P.Time': ['pTimeFrom', 'pTimeTo'],
  'Remarks': 'remarks'
};
