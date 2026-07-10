// Per-department form configuration for the generic DepartmentContext.
//
// Each entry describes one department's persistent draft slice:
//   - initialFormData:   the form field defaults (copied verbatim from the old
//                        per-department context files, so behaviour is unchanged).
//   - initialValidation: the per-field validation map (only for departments that
//                        drive validation through the shared context: Impact,
//                        MicroStructure, QcProduction). Departments that keep
//                        validation local (Process, Tensile, MicroTensile) omit it.
//   - initialMeta:       department-specific persistent extras surfaced under their
//                        existing names (e.g. isPrimarySaved / entryCount / the
//                        Process pouring-time objects).
//
// Adding a new department later means adding one entry here — no new context code.

// UTC-based YYYY-MM-DD, matching the previous per-department contexts' getCurrentDate().
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const departmentFormConfig = {
  process: {
    initialFormData: {
      date: getCurrentDate(),
      disa: '',
      partName: '',
      datecode: '',
      heatcode: '',
      quantityOfMoulds: '',
      metalCompositionC: '',
      metalCompositionSi: '',
      metalCompositionMn: '',
      metalCompositionP: '',
      metalCompositionS: '',
      metalCompositionMgFL: '',
      metalCompositionCu: '',
      metalCompositionCr: '',
      pouringTemperatureMin: '',
      pouringTemperatureMax: '',
      ppCode: '',
      treatmentNo: '',
      fcNo: '',
      heatNo: '',
      conNo: '',
      correctiveAdditionC: '',
      correctiveAdditionSi: '',
      correctiveAdditionMn: '',
      correctiveAdditionS: '',
      correctiveAdditionCr: '',
      correctiveAdditionCu: '',
      correctiveAdditionSn: '',
      tappingWt: '',
      mg: '',
      resMgConvertor: '',
      recOfMg: '',
      streamInoculant: '',
      pTime: '',
      remarks: ''
    },
    initialMeta: {
      pouringFromTime: { hours: '', minutes: '' },
      pouringToTime: { hours: '', minutes: '' },
      tappingTime: { hours: '', minutes: '' },
      isPrimarySaved: false,
      entryCount: 0
    }
  },

  impact: {
    initialFormData: {
      date: getCurrentDate(),
      partName: '',
      dateCode: '',
      specification: '',
      observedValue: '',
      remarks: ''
    },
    initialValidation: {
      date: null,
      partName: null,
      dateCode: null,
      specification: null,
      observedValue: null,
      remarks: null
    }
  },

  'micro-structure': {
    initialFormData: {
      date: '',
      disa: '',
      partName: '',
      dateCode: '',
      heatCode: '',
      nodularity: '',
      graphiteType: '',
      countMin: '',
      countMax: '',
      sizeMin: '',
      sizeMax: '',
      ferriteMin: '',
      ferriteMax: '',
      pearliteMin: '',
      pearliteMax: '',
      carbideMin: '',
      carbideMax: '',
      remarks: ''
    },
    initialValidation: {
      date: null,
      disa: null,
      partName: null,
      dateCode: null,
      heatCode: null,
      nodularity: null,
      graphiteType: null,
      countMin: null,
      countMax: null,
      sizeMin: null,
      sizeMax: null,
      ferriteMin: null,
      ferriteMax: null,
      pearliteMin: null,
      pearliteMax: null,
      carbideMin: null,
      carbideMax: null,
      remarks: null
    },
    initialMeta: {
      isPrimarySaved: false,
      entryCount: 0
    }
  },

  'qc-production': {
    initialFormData: {
      date: '',
      partName: '',
      noOfMoulds: '',
      cPercentMin: '',
      cPercentMax: '',
      siPercentMin: '',
      siPercentMax: '',
      mnPercentMin: '',
      mnPercentMax: '',
      pPercentMin: '',
      pPercentMax: '',
      sPercentMin: '',
      sPercentMax: '',
      mgPercentMin: '',
      mgPercentMax: '',
      cuPercentMin: '',
      cuPercentMax: '',
      crPercentMin: '',
      crPercentMax: '',
      nodularity: '',
      noduleCount: '',
      graphiteTypeMin: '',
      graphiteTypeMax: '',
      pearlite: '',
      ferrite: '',
      hardnessBHNMin: '',
      hardnessBHNMax: '',
      tsValues: [{ value: '' }],
      ysValues: [{ min: '', max: '' }],
      elValues: [{ min: '', max: '' }]
    },
    initialValidation: {
      date: null,
      partName: null,
      noOfMoulds: null,
      cPercentMin: null,
      cPercentMax: null,
      siPercentMin: null,
      siPercentMax: null,
      mnPercentMin: null,
      mnPercentMax: null,
      pPercentMin: null,
      pPercentMax: null,
      sPercentMin: null,
      sPercentMax: null,
      mgPercentMin: null,
      mgPercentMax: null,
      cuPercentMin: null,
      cuPercentMax: null,
      crPercentMin: null,
      crPercentMax: null,
      nodularity: null,
      noduleCount: null,
      graphiteTypeMin: null,
      graphiteTypeMax: null,
      pearlite: null,
      ferrite: null,
      hardnessBHNMin: null,
      hardnessBHNMax: null,
      tsValues: null,
      ysValues: null,
      elValues: null
    }
  },

  tensile: {
    initialFormData: {
      dateOfInspection: getCurrentDate(),
      item: '',
      dateCode: '',
      heatCode: '',
      dia: '',
      lo: '',
      li: '',
      breakingLoad: '',
      yieldLoad: '',
      uts: '',
      ys: '',
      elongation: '',
      remarks: '',
      testedBy: ''
    }
  },

  'micro-tensile': {
    initialFormData: {
      date: '',
      disa: '',
      item: '',
      itemSecond: '',
      dateCode: '',
      heatCode: '',
      barDia: '',
      gaugeLength: '',
      maxLoad: '',
      yieldLoad: '',
      tensileStrength: '',
      yieldStrength: '',
      elongation: '',
      remarks: '',
      testedBy: ''
    },
    initialMeta: {
      isPrimarySaved: false,
      entryCount: 0
    }
  },

  // Melting is a two-form department (deepNested: primaries[].entries[]). Each form
  // keeps several named draft containers (a primary header + the entry tables/rows)
  // rather than a single formData object, so they live in initialMeta and are surfaced
  // under their existing names (primaryData/setPrimaryData, table1/setTable1, ...).
  // Validation, primary-lock/API-derived flags and transient UI stay local in the pages.
  'melting-log-sheet': {
    initialFormData: {},
    initialMeta: {
      primaryData: {
        date: getCurrentDate(),
        shift: '',
        furnaceNo: '',
        panel: '',
        cumulativeLiquidMetal: '',
        finalKWHr: '',
        initialKWHr: '',
        totalUnits: '',
        cumulativeUnits: ''
      },
      table1: {
        heatNo: '',
        grade: '',
        chargingTimeHour: '',
        chargingTimeMinute: '',
        ifBath: '',
        liquidMetalPressPour: '',
        liquidMetalHolder: '',
        sgMsSteel: '',
        greyMsSteel: '',
        returnsSg: '',
        pigIron: '',
        borings: '',
        finalBath: ''
      },
      table2: {
        charCoal: '',
        cpcFur: '',
        cpcLc: '',
        siliconCarbideFur: '',
        ferrosiliconFur: '',
        ferrosiliconLc: '',
        ferroManganeseFur: '',
        ferroManganeseLc: '',
        cu: '',
        cr: '',
        pureMg: '',
        ironPyrite: ''
      },
      table3: {
        labCoinTimeHour: '',
        labCoinTimeMinute: '',
        labCoinTempC: '',
        deslagingTimeFromHour: '',
        deslagingTimeFromMinute: '',
        deslagingTimeToHour: '',
        deslagingTimeToMinute: '',
        metalReadyTimeHour: '',
        metalReadyTimeMinute: '',
        waitingForTappingFromHour: '',
        waitingForTappingFromMinute: '',
        waitingForTappingToHour: '',
        waitingForTappingToMinute: '',
        reason: ''
      },
      table4: {
        timeHour: '',
        timeMinute: '',
        tempCSg: '',
        directFurnace: '',
        holderToFurnace: '',
        furnaceToHolder: '',
        disaNo: '',
        item: ''
      },
      table5: {
        furnace1Kw: '',
        furnace1A: '',
        furnace1V: '',
        furnace2Kw: '',
        furnace2A: '',
        furnace2V: '',
        furnace3Kw: '',
        furnace3A: '',
        furnace3V: '',
        furnace4Hz: '',
        furnace4Gld: '',
        furnace4KwHr: ''
      }
    }
  },

  'cupola-holder-log-sheet': {
    initialFormData: {},
    initialMeta: {
      primaryData: {
        date: getCurrentDate(),
        shift: '',
        holderNumber: ''
      },
      inputRows: [
        {
          cpc: '', mFeSl: '', feMn: '', sic: '', pureMg: '', cu: '', feCr: '',
          actualTimeHour: '', actualTimeMinute: '',
          tappingTimeHour: '', tappingTimeMinute: '',
          tappingTemp: '', metalKg: '',
          disaLine: '', indFur: '', bailNo: '', tap: '', kw: '',
          remarks: ''
        }
      ]
    }
  }
};
