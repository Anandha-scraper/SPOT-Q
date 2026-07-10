const mongoose = require('mongoose');

// Entry schema for array of process entries
const ProcessEntrySchema = new mongoose.Schema({
    disa: {
        type: String,
        required: true,
        trim: true
    },
    partName: { 
        type: String, 
        trim: true,
        default: '' 
    },
    datecode: {
        type: String,
        trim: true,
        default: '',
        match: /^[0-9][A-Z][0-9]{2}$/  // Example: '3A21'
    },
    heatcode: { 
        type: String, 
        trim: true,
        default: '' 
    },
    quantityOfMoulds: { 
        type: Number, 
        default: 0
    },
    metalCompositionC: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionSi: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionMn: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionP: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionS: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionMgFL: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionCu: { type: mongoose.Schema.Types.Mixed, default: '-' },
    metalCompositionCr: { type: mongoose.Schema.Types.Mixed, default: '-' },
    timeOfPouring: { type: String, default: '' }, 
    pouringTemperatureMin: { type: Number, default: 0 },
    pouringTemperatureMax: { type: Number, default: 0 },
    ppCode: { type: String, trim: true, default: '' },
    treatmentNo: { type: String, trim: true, default: '' },
    fcNo: { type: String, trim: true, default: '' },
    heatNo: { type: String, trim: true, default: '' },
    conNo: { type: String, trim: true, default: '' },
    tappingTime: { type: String, default: '' },
    correctiveAdditionC: { type: mongoose.Schema.Types.Mixed, default: '-' },
    correctiveAdditionSi: { type: mongoose.Schema.Types.Mixed, default: '-' },
    correctiveAdditionMn: { type: mongoose.Schema.Types.Mixed, default: '-' },
    correctiveAdditionS: { type: mongoose.Schema.Types.Mixed, default: '-' },
    correctiveAdditionCr: { type: mongoose.Schema.Types.Mixed, default: '-' },
    correctiveAdditionCu: { type: mongoose.Schema.Types.Mixed, default: '-' },
    correctiveAdditionSn: { type: mongoose.Schema.Types.Mixed, default: '-' },
    tappingWt: { type: mongoose.Schema.Types.Mixed, default: '-' },
    mg: { type: mongoose.Schema.Types.Mixed, default: '-' },
    resMgConvertor: { type: mongoose.Schema.Types.Mixed, default: '-' },
    recOfMg: { type: mongoose.Schema.Types.Mixed, default: '-' },
    streamInoculant: { type: mongoose.Schema.Types.Mixed, default: '-' },
    pTime: { type: mongoose.Schema.Types.Mixed, default: '-' },
    remarks: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true, timestamps: true });

const ProcessSchema = new mongoose.Schema({
    date: { 
        type: String, 
        required: true,
        unique: true
    },
    savedDisas: [{
        type: String,
        trim: true
    }],
    entries: [ProcessEntrySchema]
}, {
    timestamps: true,
    collection: 'process'
});

module.exports = mongoose.model('Process', ProcessSchema);
