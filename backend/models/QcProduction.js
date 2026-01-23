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
        required: true,
        min: 1 
        },

    cPercent: { 
        type: String, 
        required: true,
        trim: true
    },

    siPercent: { 
        type: String, 
        required: true,
        trim: true
    },

    mnPercent: { 
        type: String,
        required: true,
        trim: true
    },

    pPercent: { 
        type: String,
        required: true,
        trim: true
    },

    sPercent: {
         type: String, 
         required: true,
         trim: true
    },

    mgPercent: { 
        type: String,
        required: true,
        trim: true
    },

    cuPercent: {
        type: String,
        required: true,
        trim: true
    },

    crPercent: { 
        type: String,
        required: true,
        trim: true
    },

    nodularity: {
        type: String,
        required: true,
        trim: true
    },

    graphiteType: {
        type: String,
        required: true,
        trim: true
    },

    pearliteFerrite: { 
        type: String,
        required: true,
        trim: true
    },

    hardnessBHN: { 
        type: String,
        required: true,
        trim: true
    },

    ts: { 
        type: String,
        required: true,
        trim: true
    },
    ys: { 
        type: String,
        required: true,
        trim: true
    },
    el: { 
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'qc_production_details'
});

module.exports = mongoose.model('QcProduction', QcProductionSchema);
