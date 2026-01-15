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
        type: Number, 
        required: true
    },

    siPercent: { 
        type: Number, 
        required: true
    },

    mnPercent: { 
        type: Number,
        required: true 
    },

    pPercent: { 
        type: Number,
        required: true
    },

    sPercent: {
         type: Number, 
         required: true 
    },

    mgPercent: { 
        type: Number,
        required: true 
    },

    cuPercent: {
        type: Number,
        required: true 
    },

    crPercent: { 
        type: Number,
        required: true 
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
        type: Number,
        required: true 
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
