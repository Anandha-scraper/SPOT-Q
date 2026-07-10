const mongoose = require('mongoose');

const QcProductionSchema = new mongoose.Schema({

    date: {
        type: Date,
        required: true
    },

    partName: {
        type: String,
        required: true,
        trim: true
     },

    noOfMoulds: {
        type: Number,
        min: 1
        },

    cPercentFrom: {
        type: Number
    },
    cPercentTo: {
        type: Number,
        default: 0
    },

    siPercentFrom: {
        type: Number
    },
    siPercentTo: {
        type: Number,
        default: 0
    },

    mnPercentFrom: {
        type: Number
    },
    mnPercentTo: {
        type: Number,
        default: 0
    },

    pPercentFrom: {
        type: Number
    },
    pPercentTo: {
        type: Number,
        default: 0
    },

    sPercentFrom: {
         type: Number
    },
    sPercentTo: {
         type: Number,
         default: 0
    },

    mgPercentFrom: {
        type: Number
    },
    mgPercentTo: {
        type: Number,
        default: 0
    },

    cuPercentFrom: {
        type: Number
    },
    cuPercentTo: {
        type: Number,
        default: 0
    },

    crPercentFrom: {
        type: Number
    },
    crPercentTo: {
        type: Number,
        default: 0
    },

    nodularity: {
        type: Number
    },

    noduleCount: {
        type: Number
    },

    graphiteTypeFrom: {
        type: Number
    },
    graphiteTypeTo: {
        type: Number,
        default: 0
    },

    pearlite: {
        type: Number
    },

    ferrite: {
        type: Number
    },

    hardnessBHNFrom: {
        type: Number
    },
    hardnessBHNTo: {
        type: Number,
        default: 0
    },

    ts: [{
        type: Number,
    }],
    ys: [{
        type: String,
        trim: true
    }],
    el: [{
        type: String,
        trim: true
    }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'qc_production_details'
});

module.exports = mongoose.model('QcProduction', QcProductionSchema);
