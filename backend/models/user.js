const mongoose = require('mongoose');
const { applyPasswordUtilities } = require('../utils/password');

// User Schema
const userSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    department: {
        type: String,
        enum: ['Melting', 'Sand Lab', 'Moulding', 'Process', 'Micro Tensile', 'Tensile', 'QC - production', 'Micro Structure', 'Impact', 'Admin'],
        required: true
    },

    role: {
        type: String,
        enum: ['admin', 'employee'],
        default: 'employee',
        required: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{ timestamps: true });

// Apply password utilities (hashing, comparison, toJSON)
applyPasswordUtilities(userSchema);

module.exports = mongoose.model('User', userSchema);