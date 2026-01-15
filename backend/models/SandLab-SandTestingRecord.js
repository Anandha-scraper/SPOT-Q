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
        type: String,
        trim: true,
        default: "",
      },
      nSand: {
        type: String,
        trim: true,
        default: "",
      },
      mixingMode: {
        type: String,
        trim: true,
        default: "",
      },
      bentonite: {
        type: String,
        trim: true,
        default: "",
      },
      coalDustPremix: {
        type: String,
        trim: true,
        default: "",
      },
      batchNo: {
        bentonite: {
          type: String,
          trim: true,
          default: "",
        },
        coalDustPremix: {
          type: String,
          trim: true,
          default: "",
        }
      }
    },
    shiftII: {
      rSand: {
        type: String,
        trim: true,
        default: "",
      },
      nSand: {
        type: String,
        trim: true,
        default: "",
      },
      mixingMode: {
        type: String,
        trim: true,
        default: "",
      },
      bentonite: {
        type: String,
        trim: true,
        default: "",
      },
      coalDustPremix: {
        type: String,
        trim: true,
        default: "",
      },
      batchNo: {
        bentonite: {
          type: String,
          trim: true,
          default: "",
        },
        coalDustPremix: {
          type: String,
          trim: true,
          default: "",
        }
      }
    },
    shiftIII: {
      rSand: {
        type: String,
        trim: true,
        default: "",
      },
      nSand: {
        type: String,
        trim: true,
        default: "",
      },
      mixingMode: {
        type: String,
        trim: true,
        default: "",
      },
      bentonite: {
        type: String,
        trim: true,
        default: "",
      },
      coalDustPremix: {
        type: String,
        trim: true,
        default: "",
      },
      batchNo: {
        bentonite: {
          type: String,
          trim: true,
          default: "",
        },
        coalDustPremix: {
          type: String,
          trim: true,
          default: "",
        }
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
      type: String,
      trim: true,
      default: "",
    },
    end: {
      type: String,
      trim: true,
      default: "",
    },
    total: {
      type: String,
      trim: true,
      default: "",
    }
  },
    numberOfMixRejected: {
      type: Number,
      default: 0,
    },
    returnSandHopperLevel: {
      type: Number,
      default: 0,
    }
  },
  ShiftII: {
    mixno:{
      start: {
        type: String,
        trim: true,
        default: "",
      },
      end: {
        type: String,
        trim: true,
        default: "",
      },
      total: {
        type: String,
        trim: true,
        default: "",
      }
    },
    numberOfMixRejected: {
      type: String,
      trim: true,
      default: "",
    },
    returnSandHopperLevel: {
      type: Number,
      default: 0,
    },
  },
  ShiftIII: {
    mixno:{
      start: {
        type: String,
        trim: true,
        default: "",
      },
      end: {
        type: String,
        trim: true,
        default: "",
      },
      total: {
        type: String,
        trim: true,
        default: "",
      }
    },
    numberOfMixRejected: {
      type: Number,
      default: 0,
    },
    returnSandHopperLevel: {
      type: Number,
      default: 0,
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
testParameter: {
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
  },
}, {
    timestamps: true,
    collection: 'sand_testing_record'
});

module.exports = mongoose.model("SandTestingRecord", SandTestingRecordSchema);
