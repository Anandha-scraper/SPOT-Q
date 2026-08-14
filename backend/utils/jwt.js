const jwt = require('jsonwebtoken');
exports.generateToken = (userId) => {
    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE) {
        throw new Error('Server configuration error: JWT_SECRET/JWT_EXPIRE missing');
    }
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
        algorithm: 'HS256',
    });
};

exports.verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('Server configuration error: JWT_SECRET missing');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
};