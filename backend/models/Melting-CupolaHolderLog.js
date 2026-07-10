const mongoose = require('mongoose');

// Sub-schema for a single entry row (one heat).
// Optional value fields use Mixed with a '-' default so an empty cell is stored
// as '-' (hyphen) rather than 0/'' — matching the Process entry convention.
const Mixed = mongoose.Schema.Types.Mixed;
const EntrySchema = new mongoose.Schema({
    heatNo: { type: String, default: '-' },
    // Additions
    cpc: { type: Mixed, default: '-' },
    FeSl: { type: Mixed, default: '-' },
    feMn: { type: Mixed, default: '-' },
    sic: { type: Mixed, default: '-' },
    pureMg: { type: Mixed, default: '-' },
    cu: { type: Mixed, default: '-' },
    feCr: { type: Mixed, default: '-' },
    // Tapping
    actualTime: { type: String, default: '-' },
    tappingTime: { type: String, default: '-' },
    tappingTemp: { type: Mixed, default: '-' },
    metalKg: { type: Mixed, default: '-' },
    // Pouring
    disaLine: { type: String, default: '-' },
    indFur: { type: String, default: '-' },
    bailNo: { type: String, default: '-' },
    // Electrical
    tap: { type: String, default: '-' },
    kw: { type: Mixed, default: '-' },
    // Remarks
    remarks: { type: String, default: '-' }
}, { _id: true, timestamps: true });

// Sub-schema for a primary combination (shift + holderNumber)
const PrimarySchema = new mongoose.Schema({
    shift: { type: String, required: true },
    holderNumber: { type: String, required: true },
    entries: [EntrySchema]
}, { _id: true, timestamps: true });

// Main document — one per date
const CupolaHolderLogSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    primaries: [PrimarySchema]
}, {
    timestamps: true,
    collection: 'cupola_holder_log'
});

module.exports = mongoose.model('CupolaHolderLog', CupolaHolderLogSchema);
