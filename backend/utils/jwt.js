const jwt = require('jsonwebtoken');

exports.generateToken = (userId) => {
    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE) {
        console.error('No ENV found for JWT configuration ');
        throw new Error('Server configuration error: JWT variables missing');
    }
    return jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: process.env.JWT_EXPIRE, 
            algorithm: 'HS256' 
        }
    );
};

exports.verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        console.error('No JWT_SECRET found ');
        throw new Error('JWT_SECRET missing');
    }
    
    return jwt.verify(token, process.env.JWT_SECRET);
};