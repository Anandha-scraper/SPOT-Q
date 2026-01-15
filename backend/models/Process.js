const mongoose = require('mongoose');

const ProcessSchema = new mongoose.Schema({
    // Combined fields for backward compatibility
    partNameDateHeatCode: {
        type: String,
        trim: true
    },
    streamInnoculantPTime: {
        type: String,
        trim: true
    },
    fcNoHeatNo: {
        type: String,
        trim: true
    },

    // Separate fields (preferred)
    partName: { 
        type: String, 
        trim: true 
    },

    date: { 
        type: String, 
        required: true 
    },

    heatCode: { 
        type: String, 
        trim: true 
    },

    quantityOfMoulds: { 
        type: Number, 
        default: 0
    },

    // Metal Composition fields
    metalCompositionC: { 
        type: Number, 
        default: 0
    },
    metalCompositionSi: { 
        type: Number, 
        default: 0
    },
    metalCompositionMn: { 
        type: Number, 
        default: 0
    },
    metalCompositionP: { 
        type: Number, 
        default: 0
    },
    metalCompositionS: { 
        type: Number, 
        default: 0
    },
    metalCompositionMgFL: { 
        type: Number, 
        default: 0
    },
    metalCompositionCu: { 
        type: Number, 
        default: 0
    },
    metalCompositionCr: { 
        type: Number, 
        default: 0
    },

    timeOfPouring: { 
        type: String
    },

    pouringTemperature: {
        type: Number, 
        default: 0
    },

    ppCode: {
        type: String,
        trim: true
    },

    treatmentNo: {
        type: String,
        trim: true
    },

    fcNo: {
        type: String,
        trim: true
    },

    heatNo: {
        type: String,
        trim: true
    },

    conNo: {
        type: String,
        trim: true
    },

    tappingTime: {
        type: String
    },

    // Corrective Addition fields
    correctiveAdditionC: {
        type: Number,
        default: 0
    },
    correctiveAdditionSi: {
        type: Number,
        default: 0
    },
    correctiveAdditionMn: {
        type: Number,
        default: 0
    },
    correctiveAdditionS: {
        type: Number,
        default: 0
    },
    correctiveAdditionCr: {
        type: Number,
        default: 0
    },
    correctiveAdditionCu: {
        type: Number,
        default: 0
    },
    correctiveAdditionSn: {
        type: Number,
        default: 0
    },

    tappingWt: {
        type: Number,
        default: 0
    },

    mg: {
        type: Number,
        default: 0
    },

    resMgConvertor: { 
        type: Number, 
        default: 0 
    },

    recOfMg: { 
        type: Number, 
        default: 0 
    },

    streamInoculant: { 
        type: Number, 
        default: 0 
    },

    pTime: { 
        type: Number, 
        default: 0 
    },

    remarks: { 
        type: String, 
        trim: true, 
        default: '' 
    }
    
}, {
    timestamps: true,
    collection: 'process'
});

module.exports = mongoose.model('Process', ProcessSchema);
