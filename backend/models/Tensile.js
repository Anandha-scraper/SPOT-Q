const mongoose = require('mongoose');

// Sub-schema for individual tensile test entries
const TensileEntrySchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        trim: true
    },

    dateCode: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9][A-Z][0-9]{2}$/  // Example: '3A21'
    },

    heatCode: {
        type: String,
        trim: true
    },

    dia: {
        type: Number
    },

    lo: {
        type: Number
    },

    li: {
        type: Number
    },

    breakingLoad: {
        type: Number
    },

    yieldLoad: {
        type: Number
    },

    uts: {
        type: Number
    },

    ys: {
        type: Number
    },

    elongation: {
        type: Number
    },

    remarks: {
        type: String,
        trim: true,
        default: ''
    },

    testedBy: {
        type: String
    }
}, {
    timestamps: true,
    _id: true  // Each entry gets its own _id for editing/deleting
});

// Main schema - one document per date
const TensileSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,  // Only one document per date
        index: true
    },
    entries: {
        type: [TensileEntrySchema],
        default: []  // Array of test entries for this date
    }
}, {
    timestamps: true,
    collection: 'tensile'
});

module.exports = mongoose.model('Tensile', TensileSchema);
