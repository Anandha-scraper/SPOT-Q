const mongoose = require('mongoose');

// Sub-schema for individual micro tensile test entries
const MicroTensileEntrySchema = new mongoose.Schema({
    // Disa as array for multiple selections
    disa: {
        type: [String],
        default: []
    },

    item: {
        it1 :{
            type: String,
            required: true,
            trim: true
        },

        it2: {
            type: String,
            match: /^\(\d+\/\d+\/\d+\)$/ //Example : (234/3455/3432)
        }
    },

    dateCode: {
        type: String,
        required: true,
        match: /^[0-9][A-Z][0-9]{2}$/  // Example: '3A21'
    },

    heatCode: {
        type: String,
        required: true,
        trim: true
    },

    barDia: {
        type: Number,
        required: true
    },

    gaugeLength: {
        type: Number,
        required: true
    },

    maxLoad: {
        type: Number,
        required: true
    },

    yieldLoad: {
        type: Number,
        required: true
    },

    tensileStrength: {
        type: Number,
        required: true
    },

    yieldStrength: {
        type: Number,
        required: true
    },

    elongation: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    remarks: {
        type: String,
        trim: true,
        default: ''
    },

    testedBy: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true,
    _id: true  // Each entry gets its own _id for editing/deleting
});

// Main schema - one document per date
const MicroTensileSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,  // Only one document per date
        index: true
    },
    entries: {
        type: [MicroTensileEntrySchema],
        default: []  // Array of test entries for this date
    }
}, {
    timestamps: true,
    collection: 'micro_tensile'
});

module.exports = mongoose.model('MicroTensile', MicroTensileSchema);
