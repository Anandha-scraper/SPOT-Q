const mongoose = require('mongoose');

// Sub-schema for individual micro structure test entries
const MicroStructureEntrySchema = new mongoose.Schema({
    disa: {
        type: String,
        required: true,
        trim: true
    },

    partName: {
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
        required: true,
        trim: true
    },

    nodularity: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    graphiteType: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    countNos: {
        type: String,
        required: true,
        trim: true
    },

    size: {
        type: String,
        required: true,
        trim: true
    },

    ferrite: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    pearlite: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    carbide: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    remarks: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true,
    _id: true  // Each entry gets its own _id for editing/deleting
});

// Main schema - one document per date
const MicroStructureSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,  // Only one document per date
        index: true
    },
    entries: {
        type: [MicroStructureEntrySchema],
        default: []  // Array of test entries for this date
    }
}, {
    timestamps: true,
    collection: 'micro_structure'
});

module.exports = mongoose.model('MicroStructure', MicroStructureSchema);
