const jwt = require('jsonwebtoken');
exports.generateToken = (userId) => {
    if (!process.env.PROD_SPOT_Q_JWT_SECRET || !process.env.PROD_SPOT_Q_JWT_EXPIRE) {
        throw new Error('Server configuration error: PROD_SPOT_Q_JWT_SECRET/PROD_SPOT_Q_JWT_EXPIRE missing');
    }
    return jwt.sign({ id: userId }, process.env.PROD_SPOT_Q_JWT_SECRET, {
        expiresIn: process.env.PROD_SPOT_Q_JWT_EXPIRE,
        algorithm: 'HS256',
    });
};

exports.verifyToken = (token) => {
    if (!process.env.PROD_SPOT_Q_JWT_SECRET) {
        throw new Error('Server configuration error: PROD_SPOT_Q_JWT_SECRET missing');
    }
    return jwt.verify(token, process.env.PROD_SPOT_Q_JWT_SECRET);
};