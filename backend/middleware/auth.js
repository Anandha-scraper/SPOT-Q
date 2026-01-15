const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');
// 1. Protect Middleware (Ensures the user is logged in and the token is valid/not expired. )
exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        let token = req.headers.authorization?.startsWith('Bearer ') ? 
                   req.headers.authorization.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, no token provided' 
            });
        }

        // Verify token (Checks .env and expiration automatically)
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Session expired. Please log in again.',
                    isTokenExpired: true 
                });
            }
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token. Please log in again.' 
            });
        }

        // Check if user exists and is still active
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'User account is deactivated' });
        }

        // Attach user to request object for use in other middlewares/controllers
        req.user = user;
        next();

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
};
 // 2. Admin Access Middleware
exports.checkAdminAccess = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.department === 'Admin')) {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.' 
        });
    }
};
 // 3. Department Access Middleware
exports.checkDepartmentAccess = (requiredDept) => {
    return (req, res, next) => {
        // Admins can bypass department checks
        if (req.user.role === 'admin' || req.user.department === 'Admin') {
            return next();
        }

        // Check if user matches the required department
        if (req.user.department === requiredDept) {
            next();
        } else {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. You do not belong to the ${requiredDept} department.` 
            });
        }
    };
};