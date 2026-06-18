const mongoose = require('mongoose');

// Sub-schema for a single table entry (one row of all 5 tables).
// Optional value fields use Mixed with a '-' default so an empty cell is stored
// as '-' (hyphen) rather than 0/'' — matching the Process entry convention.
const Mixed = mongoose.Schema.Types.Mixed;
const EntrySchema = new mongoose.Schema({
    // Table 1 - Charging Details
    heatno: { type: Mixed, default: '-' },
    grade: { type: String, default: '-' },
    chargingkgs: {
        time: { type: String, default: '-' },
        ifbath: { type: Mixed, default: '-' },
        liquidmetal: {
            presspour: { type: Mixed, default: '-' },
            holder: { type: Mixed, default: '-' }
        },
        sqmssteel: { type: Mixed, default: '-' },
        greymssteel: { type: Mixed, default: '-' },
        returnSg: { type: Mixed, default: '-' },
        pigiron: { type: Mixed, default: '-' },
        borings: { type: Mixed, default: '-' },
        finalbath: { type: Mixed, default: '-' }
    },

    // Table 2 - Additions
    charcoal: { type: Mixed, default: '-' },
    cpc: {
        fur: { type: Mixed, default: '-' },
        lc: { type: Mixed, default: '-' }
    },
    siliconcarbide: {
        fur: { type: Mixed, default: '-' }
    },
    ferroSilicon: {
        fur: { type: Mixed, default: '-' },
        lc: { type: Mixed, default: '-' }
    },
    ferroManganese: {
        fur: { type: Mixed, default: '-' },
        lc: { type: Mixed, default: '-' }
    },
    cu: { type: Mixed, default: '-' },
    cr: { type: Mixed, default: '-' },
    pureMg: { type: Mixed, default: '-' },
    ironPyrite: { type: Mixed, default: '-' },

    // Table 3 - Timing Details
    labCoin: {
        time: { type: String, default: '-' },
        tempC: { type: Mixed, default: '-' }
    },
    deslagingTime: {
        from: { type: String, default: '-' },
        to: { type: String, default: '-' }
    },
    metalReadyTime: { type: String, default: '-' },
    waitingForTapping: {
        from: { type: String, default: '-' },
        to: { type: String, default: '-' }
    },
    reason: { type: String, default: '-' },

    // Table 4 - Metal Tapping
    metalTapping: {
        time: { type: String, default: '-' },
        tempCSg: { type: Mixed, default: '-' }
    },
    directFurnace: { type: Mixed, default: '-' },
    holderToFurnace: { type: Mixed, default: '-' },
    furnaceToHolder: { type: Mixed, default: '-' },
    disaNo: { type: String, default: '-' },
    item: { type: String, default: '-' },

    // Table 5 - Electrical Readings
    electricalReadings: {
        furnace1: {
            kw: { type: Mixed, default: '-' },
            v: { type: Mixed, default: '-' },
            a: { type: Mixed, default: '-' }
        },
        furnace2: {
            kw: { type: Mixed, default: '-' },
            v: { type: Mixed, default: '-' },
            a: { type: Mixed, default: '-' }
        },
        furnace3: {
            kw: { type: Mixed, default: '-' },
            v: { type: Mixed, default: '-' },
            a: { type: Mixed, default: '-' }
        },
        furnace4: {
            hz: { type: Mixed, default: '-' },
            gld: { type: Mixed, default: '-' },
            kwhr: { type: Mixed, default: '-' }
        }
    },

    // Stamped on creation so non-admins can edit their own entry within EDIT_TIME.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true, timestamps: true });

// Sub-schema for a primary combination (shift + furnace + panel)
const PrimarySchema = new mongoose.Schema({
    shift: { type: String, required: true },
    furnaceNo: { type: String, required: true },
    panel: { type: String, required: true },
    cumulativeLiquidMetal: { type: Number, default: 0 },
    finalkwhr: { type: Number, default: 0 },
    initialkwhr: { type: Number, default: 0 },
    totoalunits: { type: Number, default: 0 },
    cumulativeunits: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    entries: [EntrySchema]
}, { _id: true, timestamps: true });

// Main document - one per date
const MeltingLogsheetSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    primaries: [PrimarySchema]
}, {
    timestamps: true,
    collection: 'melting_log_sheet'
});

module.exports = mongoose.model('MeltingLogsheet', MeltingLogsheetSchema);
