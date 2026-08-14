const bcrypt = require('bcryptjs');
const hashPassword = async (plain) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plain, salt);
};
const comparePassword = async (plain, hashed) => {
    return bcrypt.compare(plain, hashed);
};
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
