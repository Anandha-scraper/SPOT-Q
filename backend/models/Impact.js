const mongoose = require('mongoose');

// Sub-schema for individual test entries
const ImpactEntrySchema = new mongoose.Schema({
    partName: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Za-z\s\-]+$/  // Alphanumeric, spaces, hyphens
    },
    dateCode: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9][A-Z][0-9]{2}$/  // Example: '3A21'
    },
    specification: {
        val:{
            type: Number,
            required: true
        },

        constraint: {
            type: String
        }
    },
    observedValue: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9]+(\s*,\s*[0-9]+)?$/
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
const ImpactSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,  // Only one document per date
        index: true
    },
    entries: {
        type: [ImpactEntrySchema],
        default: []  // Array of test entries for this date
    }
}, {
    timestamps: true,
    collection: 'impact'
});

module.exports = mongoose.model('Impact', ImpactSchema);
