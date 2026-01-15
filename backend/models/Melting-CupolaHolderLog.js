const mongoose = require('mongoose');

const CupolaHolderLogSchema = new mongoose.Schema({

    date: {
        type: Date,
        required: true
    },

    shift: {
        type: String,
        required: true

    },

    holderno :{
        type : Number,
        required : true
    },
    
    heatNo: { 
        type: String, 
        required: false, 
        trim: true, 
        sparse: true,
        unique: true 
    },

    additions: {
        cpc: { 
            type: Number, 
            min: 0 
        },

        FeSl: { 
            type: Number, 
            min: 0 
        },

        feMn: { 
            type: Number, 
            min: 0 
        },

        sic: { 
            type: Number, 
            min: 0 
        },

        pureMg: { 
            type: Number, 
            min: 0 
        },

        cu: { 
            type: Number, 
            min: 0 
        },

        feCr: { 
            type: Number, 
            min: 0 
        },
    },

    tapping: {
        time: {

        actualTime: { 
            type: String 
        },

        tappingTime: { 
            type: String 
        }
    },
    
        tempC: { 
            type: Number 
        },
        metalKgs: { 
            type: Number, 
            min: 0 
        },
    },

    pouring: {
        disaLine: { 
            type: String, 
            trim: true 
        },
        indFur: { 
            type: String, 
            trim: true 
        },

        bailNo: { 
            type: String, 
            trim: true 
        },
    },

    electrical: {
        tap: { 
            type: String, 
            trim: true 
        },

        kw: { 
            type: Number 
        },
    }
}, {
    timestamps: true,
    collection: 'cupola_holder_log'
});

module.exports = mongoose.model('CupolaHolderLog', CupolaHolderLogSchema);
