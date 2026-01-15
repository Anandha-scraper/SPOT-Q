const mongoose = require('mongoose');

const DismaticProductReportDISASchema = new mongoose.Schema({
    // Basic Information - Primary Identifier
    date: {
        type: Date,
        required: true,
        unique: true, // Primary identifier - one record per date
        index: true // Index for faster queries
    },
    shift: {
        type: String,
        required: true,
        trim: true,
        index: true // Index for faster queries
    },
    incharge: {
        type: String,
        default: '',
        trim: true
    },
    memberspresent: {
        type: String,
        default: '',
        trim: true
    },
    
    // Production Table
    productionDetails: [{
        sNo: {
            type: Number,
            required: true
        },
        counterNo: {
            type: String,
            default: '',
            trim: true
        },
        componentName: {
            type: String,
            default: '',
            trim: true
        },
        produced: {
            type: Number,
            default: 0
        },
        poured: {
            type: Number,
            default: 0
        },
        cycleTime: {
            type: String,
            default: '',
            trim: true
        },
        mouldsPerHour: {
            type: Number,
            default: 0
        },
        remarks: {
            type: String,
            default: '',
            trim: true
        }
    }],

    // Next Shift Plan Table
    nextShiftPlan: [{
        sNo: {
            type: Number,
            required: true
        },
        componentName: {
            type: String,
            default: '',
            trim: true
        },
        plannedMoulds: {
            type: Number,
            default: 0
        },
        remarks: {
            type: String,
            default: '',
            trim: true
        }
    }],

    // Delays Table
    delays: [{
        sNo: {
            type: Number,
            required: true
        },
        delays: {
            type: String,
            default: '',
            trim: true
        },
        durationMinutes: {
            type: Number,
            default: 0
        },
        durationTime: {
            type: String,
            default: '',
            trim: true
        }
    }],

    // Mould Hardness Table
    mouldHardness: [{
        sNo: {
            type: Number,
            required: true
        },
        componentName: {
            type: String,
            default: '',
            trim: true
        },
        mpPP: {
            type: Number,
            default: 0
        },
        mpSP: {
            type: Number,
            default: 0
        },
        bsPP: {
            type: Number,
            default: 0
        },
        bsSP: {
            type: Number,
            default: 0
        },
        remarks: {
            type: String,
            default: '',
            trim: true
        }
    }],

    // Pattern Temperature Table
    patternTemperature: [{
        sNo: {
            type: Number,
            required: true
        },
        item: {
            type: String,
            default: '',
            trim: true
        },
        pp: {
            type: Number,
            default: 0
        },
        sp: {
            type: Number,
            default: 0
        }
    }],

    // Additional Fields
    // NOTE: No default values - fields will be undefined if not set
    // This prevents empty strings from being saved and triggering locks
    significantEvent: {
        type: String,
        trim: true
    },
    maintenance: {
        type: String,
        trim: true
    },
    supervisorName: {
        type: String,
        trim: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    collection: 'disamatic_product' // Explicit collection name in snake_case
});

// Date is already indexed and unique as primary identifier
// Index for date range queries (descending for latest first)
DismaticProductReportDISASchema.index({ date: -1 });

module.exports = mongoose.model('DismaticProductReportDISA', DismaticProductReportDISASchema);
