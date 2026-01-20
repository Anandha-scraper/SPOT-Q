const bcrypt = require('bcryptjs');
// Basic Hashing Utility
const hashPassword = async (plain) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plain, salt);
};
const comparePassword = async (plain, hashed) => {
    return bcrypt.compare(plain, hashed);
};

const excludeSensitiveFieldsFromJSON = function() {
    const obj = this.toObject();
    delete obj.password; // Hide the password hash
    delete obj.__v;      // Hide the Mongoose version key
    return obj;
};

const hashPasswordPreSave = async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    
    try {
        this.password = await hashPassword(this.password);
        next();
    } catch (error) {
        next(error);
    }
};

const comparePasswordMethod = async function(candidatePassword) {
    // If password wasn't selected in the query, we fetch it specifically
    let userWithPassword = this;
    if (!this.password) {
        userWithPassword = await this.model('User').findById(this._id).select('+password');
    }

    if (!userWithPassword || !userWithPassword.password) return false;
    return await comparePassword(candidatePassword, userWithPassword.password);
};

exports.applyPasswordUtilities = (schema) => {
    schema.pre('save', hashPasswordPreSave);
    schema.methods.comparePassword = comparePasswordMethod;
    schema.methods.toJSON = excludeSensitiveFieldsFromJSON;
};

// Also export raw functions for manual use if needed in scripts/controllers
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;