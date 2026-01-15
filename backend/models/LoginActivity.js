const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employeeId: {
        type: String,
        required: true,
        uppercase: true
    },
    department: {
        type: String,
        required: true
    },
    loginAt: {
        type: Date,
        default: Date.now
    },
    ip: String,
    userAgent: String
});

// Index for faster queries
loginActivitySchema.index({ userId: 1, loginAt: -1 });
loginActivitySchema.index({ employeeId: 1, loginAt: -1 });

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
