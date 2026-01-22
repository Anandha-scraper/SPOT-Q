const mongoose = require('mongoose');

const SandTestingRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  sandShifts : {
    shiftI: {
      rSand: {
        type: [String],
        default: [],
      },
      nSand: {
        type: [String],
        default: [],
      },
      mixingMode: {
        type: [String],
        default: [],
      },
      bentonite: {
        type: [String],
        default: [],
      },
      coalDustPremix: {
        type: [String],
        default: [],
      }
    },
    shiftII: {
      rSand: {
        type: [String],
        default: [],
      },
      nSand: {
        type: [String],
        default: [],
      },
      mixingMode: {
        type: [String],
        default: [],
      },
      bentonite: {
        type: [String],
        default: [],
      },
      coalDustPremix: {
        type: [String],
        default: [],
      }
    },
    shiftIII: {
      rSand: {
        type: [String],
        default: [],
      },
      nSand: {
        type: [String],
        default: [],
      },
      mixingMode: {
        type: [String],
        default: [],
      },
      bentonite: {
        type: [String],
        default: [],
      },
      coalDustPremix: {
        type: [String],
        default: [],
      }
    },
    batchNo: {
      bentonite: {
        type: String,
        trim: true,
        default: "",
      },
      coalDust: {
        type: String,
        trim: true,
        default: "",
      },
      premix: {
        type: String,
        trim: true,
        default: "",
      }
    }
  },
  
  clayShifts: {
    shiftI: {
      totalClay: {
      type: String,
      trim: true,
      default: "",
    },
    activeClay: {
      type: String,
      trim: true,
      default: "",
    },
    deadClay: {
      type: String,
      trim: true,
      default: "",
    },
    vcm: {
      type: String,
      trim: true,
      default: "",
    },
    loi: {
      type: String,
      trim: true,
      default: "",
    },
    afsNo: {
      type: String,
      trim: true,
      default: "",
    },
    fines: {
      type: String,
      trim: true,
      default: "",
    }
  },
  ShiftII: {
    totalClay: {
      type: String,
      trim: true,
      default: "",
    },
    activeClay: {
      type: String,
      trim: true,
      default: "",
    },
    deadClay: {
      type: String,
      trim: true,
      default: "",
    },
    vcm: {
      type: String,
      trim: true,
      default: "",
    },
    loi: {
      type: String,
      trim: true,
      default: "",
    },
    afsNo: {
      type: String,
      trim: true,
      default: "",
    },
    fines: {
      type: String,
      trim: true,
      default: "",
    }
  },
  ShiftIII: {
    totalClay: {
      type: String,
      trim: true,
      default: "",
    },
    activeClay: {
      type: String,
      trim: true,
      default: "",
    },
    deadClay: {
      type: String,
      trim: true,
      default: "",
    },
    vcm: {
      type: String,
      trim: true,
      default: "",
    },
    loi: {
      type: String,
      trim: true,
      default: "",
    },
    afsNo: {
      type: String,
      trim: true,
      default: "",
    },
    fines: {
      type: String,
      trim: true,
      default: "",
    }
  }
},
  mixshifts:{
  ShiftI: {
    mixno:{
    start: {
      type: [String],
      default: [],
    },
    end: {
      type: [String],
      default: [],
    },
    total: {
      type: [String],
      default: [],
    }
  },
    numberOfMixRejected: {
      type: [String],
      default: [],
    },
    returnSandHopperLevel: {
      type: [String],
      default: [],
    }
  },
  ShiftII: {
    mixno:{
      start: {
        type: [String],
        default: [],
      },
      end: {
        type: [String],
        default: [],
      },
      total: {
        type: [String],
        default: [],
      }
    },
    numberOfMixRejected: {
      type: [String],
      default: [],
    },
    returnSandHopperLevel: {
      type: [String],
      default: [],
    },
  },
  ShiftIII: {
    mixno:{
      start: {
        type: [String],
        default: [],
      },
      end: {
        type: [String],
        default: [],
      },
      total: {
        type: [String],
        default: [],
      }
    },
    numberOfMixRejected: {
      type: [String],
      default: [],
    },
    returnSandHopperLevel: {
      type: [String],
      default: [],
    }
  }
},
  sandLump: {
    type: String,
    trim: true,
    default: "",
  },
  newSandWt: {
    type: String,
    trim: true,
    default: "",
  },

  sandFriability: {
    shiftI: {
      type: String,
      trim: true,
      default: "",
    },
    shiftII: {
      type: String,
      trim: true,
      default: "",
    },
    shiftIII: {
      type: String,
      trim: true,
      default: "",
    }
},
testParameter: [{
  sno:{
    type: Number,
    default: 0,
  },
  time:{
    type: Number,
    default: 0,
  },
  mixno:{
    type: Number,
    default: 0,
  },
  permeability: {
      type: Number,
      default: 0,
    },
    gcsFdyA: {
      type: Number,
      default: 0,
    },
    gcsFdyB: {
      type: Number,
      default: 0,
    },
    wts: {
      type: Number,
      default: 0,
    },
    moisture: {
      type: Number,
      default: 0,
    },
    compactability: {
      type: Number,
      default: 0,
    },
    compressibility: {
      type: Number,
      default: 0,
    },
    waterLitre: {
      type: Number,
      default: 0,
    },
    sandTemp: {
    BC: {
      type: Number,
      default: 0,
    },
    WU: {
      type: Number,
      default: 0,
    },
    SSUmax: {
      type: Number,
      default: 0,
    }
  },
    newSandKgs: {
      type: Number,
      default: 0,
    },
    mould : {
      type: Number,
      default: 0,
    },

    bentoniteWithPremix: {
      Kgs: {
      type: Number,
      default: 0,
    },
    Percent: {
      type: Number,
      default: 0,
    }
  },
  bentonite : {
    Kgs: {
    type: Number,
    default: 0,
  },
  Percent: {
    type: Number,
    default: 0,
  }
},
premix:{
  Kgs: {
    type: Number,
    default: 0,
    },
    Percent: {
    type: Number,
    default: 0,
    }
  },
coalDust:{
  Kgs: {
      type: Number,
      default: 0,
    },
    Percent: {
      type: Number,
      default: 0,
    }
  },
    lc: {
      type: Number,
      default: 0,
    },
    CompactabilitySettings: {
      type: Number,
      default: 0,
    },
    mouldStrength: {
      type: Number,
      default: 0,
    },
    shearStrengthSetting: {
      type: Number,
      default: 0,
    },
    preparedSandlumps: {
      type: Number,
      default: 0,
    },
    itemName: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  }],
}, {
    timestamps: true,
    collection: 'sand_testing_record'
});

module.exports = mongoose.model("SandTestingRecord", SandTestingRecordSchema);
