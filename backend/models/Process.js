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
        default: ''
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
    metalCompositionC: { type: Number, default: 0 },
    metalCompositionSi: { type: Number, default: 0 },
    metalCompositionMn: { type: Number, default: 0 },
    metalCompositionP: { type: Number, default: 0 },
    metalCompositionS: { type: Number, default: 0 },
    metalCompositionMgFL: { type: Number, default: 0 },
    metalCompositionCu: { type: Number, default: 0 },
    metalCompositionCr: { type: Number, default: 0 },
    timeOfPouring: { type: String, default: '' },
    pouringTemperature: { type: Number, default: 0 },
    ppCode: { type: String, trim: true, default: '' },
    treatmentNo: { type: String, trim: true, default: '' },
    fcNo: { type: String, trim: true, default: '' },
    heatNo: { type: String, trim: true, default: '' },
    conNo: { type: String, trim: true, default: '' },
    tappingTime: { type: String, default: '' },
    correctiveAdditionC: { type: Number, default: 0 },
    correctiveAdditionSi: { type: Number, default: 0 },
    correctiveAdditionMn: { type: Number, default: 0 },
    correctiveAdditionS: { type: Number, default: 0 },
    correctiveAdditionCr: { type: Number, default: 0 },
    correctiveAdditionCu: { type: Number, default: 0 },
    correctiveAdditionSn: { type: Number, default: 0 },
    tappingWt: { type: Number, default: 0 },
    mg: { type: Number, default: 0 },
    resMgConvertor: { type: Number, default: 0 },
    recOfMg: { type: Number, default: 0 },
    streamInoculant: { type: Number, default: 0 },
    pTime: { type: Number, default: 0 },
    remarks: { type: String, trim: true, default: '' }
}, { _id: true });

const ProcessSchema = new mongoose.Schema({
    date: { 
        type: String, 
        required: true,
        unique: true
    },
    entries: [ProcessEntrySchema]
}, {
    timestamps: true,
    collection: 'process'
});

module.exports = mongoose.model('Process', ProcessSchema);
