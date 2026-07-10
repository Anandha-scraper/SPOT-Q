const mongoose = require('mongoose');

// Sub-schema for individual test entries
const ImpactEntrySchema = new mongoose.Schema({
    partName: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Za-z0-9\s\-]+$/  // Alphanumeric, spaces, hyphens
    },
    dateCode: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9][A-Z][0-9]{2}$/  // Example: '3A21'
    },
    specification: {
        type: String,
        required: true,
        trim: true
    },
    observedValue: {
        type: String,
        required: true,
        trim: true,
        match: /^(\d+([.,]\d+)?)(\s*,\s*\d+([.,]\d+)?)*$/
    },
    remarks: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    _id: true
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
