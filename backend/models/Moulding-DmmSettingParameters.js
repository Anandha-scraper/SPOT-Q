const mongoose = require('mongoose');

const DmmSettingParametersSchema = new mongoose.Schema({

    // Primary Identifier - combination of date and machine
    date: {
        type: Date,
        required: true,
        index: true
    },
    
    machine: {
        type: String, // Changed to String to match frontend input
        required: true,
        index: true,
        trim: true
    },

    shifts: {
        shift1: {
            operatorName: {
                type: String,
                default: ''
            },
            checkedBy: {
                type: String,
                default: ''
            }
        },
        shift2: {
            operatorName: {
                type: String,
                default: ''
            },
            checkedBy: {
                type: String,
                default: ''
            }
        },
        shift3: {
            operatorName: {
                type: String,
                default: ''
            },
            checkedBy: {
                type: String,
                default: ''
            }
        }
    },

    parameters: {
        shift1: [{
            sNo: {
                type: Number,
                required: true
            },
            customer: {
                type: String,
                default: ''
            },
            itemDescription: {
                type: String,
                default: ''
            },
            time: {
                type: String,
                default: ''
            },
            ppThickness: {
                type: Number,
                default: 0
            },
            ppheight: {
                type: Number,
                default: 0
            },
            spThickness: {
                type: Number,
                default: 0
            },
            spHeight: {
                type: Number,
                default: 0
            },
            CoreMaskThickness: {
                type: Number,
                default: 0
            },
            CoreMaskHeight: {
                type: Number,
                default: 0
            },
            sandShotPressurebar: {
                type: Number,
                default: 0
            },
            correctionShotTime: {
                type: Number,
                default: 0
            },
            squeezePressure: {
                type: Number,
                default: 0
            },
            ppStrippingAcceleration: {
                type: Number,
                default: 0
            },
            ppStrippingDistance: {
                type: Number,
                default: 0
            },
            spStrippingAcceleration: {
                type: Number,
                default: 0
            },
            spStrippingDistance: {
                type: Number,
                default: 0
            },
            mouldThickness: {
                type: Number,
                default: 0
            },
            closeUpForceMouldCloseUpPressure: {
                type: String,
                default: ''
            },
            remarks: {
                type: String,
                default: ''
            }
        }],
        shift2: [{
            sNo: {
                type: Number,
                required: true
            },
            customer: {
                type: String,
                default: ''
            },
            itemDescription: {
                type: String,
                default: ''
            },
            time: {
                type: String,
                default: ''
            },
            ppThickness: {
                type: Number,
                default: 0
            },
            ppHeight: {
                type: Number,
                default: 0
            },
            spThickness: {
                type: Number,
                default: 0
            },
            spHeight: {
                type: Number,
                default: 0
            },
            CoreMaskThickness: {
                type: Number,
                default: 0
            },
            CoreMaskHeight: {
                type: Number,
                default: 0
            },
            sandShotPressurebar: {
                type: Number,
                default: 0
            },
            correctionShotTime: {
                type: Number,
                default: 0
            },
            squeezePressure: {
                type: Number,
                default: 0
            },
            ppStrippingAcceleration: {
                type: Number,
                default: 0
            },
            ppStrippingDistance: {
                type: Number,
                default: 0
            },
            spStrippingAcceleration: {
                type: Number,
                default: 0
            },
            spStrippingDistance: {
                type: Number,
                default: 0
            },
            mouldThickness: {
                type: Number,
                default: 0
            },
            closeUpForceMouldCloseUpPressure: {
                type: String,
                default: ''
            },
            remarks: {
                type: String,
                default: ''
            }
        }],
        shift3: [{
            sNo: {
                type: Number,
                required: true
            },
            customer: {
                type: String,
                default: ''
            },
            itemDescription: {
                type: String,
                default: ''
            },
            time: {
                type: String,
                default: ''
            },
            ppThickness: {
                type: Number,
                default: 0
            },
            ppHeight: {
                type: Number,
                default: 0
            },
            spThickness: {
                type: Number,
                default: 0
            },
            spHeight: {
                type: Number,
                default: 0
            },
            CoreMaskThickness: {
                type: Number,
                default: 0
            },
            CoreMaskHeight: {
                type: Number,
                default: 0
            },
            sandShotPressurebar: {
                type: Number,
                default: 0
            },
            correctionShotTime: {
                type: Number,
                default: 0
            },
            squeezePressure: {
                type: Number,
                default: 0
            },
            ppStrippingAcceleration: {
                type: Number,
                default: 0
            },
            ppStrippingDistance: {
                type: Number,
                default: 0
            },
            spStrippingAcceleration: {
                type: Number,
                default: 0
            },
            spStrippingDistance: {
                type: Number,
                default: 0
            },
            mouldThickness: {
                type: Number,
                default: 0
            },
            closeUpForceMouldCloseUpPressure: {
                type: String,
                default: ''
            },
            remarks: {
                type: String,
                default: ''
            }
        }]
    }
}, {
    timestamps: true,
    collection: 'dmm_setting_parameters'
});

// Composite unique index on date + machine (primary identifier)
// This ensures one record per date-machine combination
DmmSettingParametersSchema.index({ date: 1, machine: 1 }, { unique: true });

module.exports = mongoose.model('DmmSettingParameters', DmmSettingParametersSchema);
