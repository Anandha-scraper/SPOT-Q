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
        trim: true
    },

    heatCode: {
        type: String,
        required: true,
        trim: true
    },

    // Numeric value bounds are validated on the frontend (validationRanges in
    // MicroStructure.jsx); the model only enforces type/presence so it persists
    // whatever passes that validation.
    nodularity: {
        type: Number,
        required: true
    },

    graphiteType: {
        type: String,
        required: true,
        trim: true
    },

    countMin: {
        type: Number,
        required: true
    },
    countMax: {
        type: Number,
        default: 0
    },

    sizeMin: {
        type: Number,
        required: true
    },
    sizeMax: {
        type: Number,
        default: 0
    },

    ferriteMin: {
        type: Number,
        required: true
    },
    ferriteMax: {
        type: Number,
        default: 0
    },

    pearliteMin: {
        type: Number,
        required: true
    },
    pearliteMax: {
        type: Number,
        default: 0
    },

    carbideMin: {
        type: Number,
        required: true
    },
    carbideMax: {
        type: Number,
        default: 0
    },

    remarks: {
        type: String,
        trim: true,
        default: ''
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    _id: true
});

// Main schema - one document per date
const MicroStructureSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    savedDisas: [{
        type: String,
        trim: true
    }],
    entries: {
        type: [MicroStructureEntrySchema],
        default: []
    }
}, {
    timestamps: true,
    collection: 'micro_structure'
});

module.exports = mongoose.model('MicroStructure', MicroStructureSchema);
