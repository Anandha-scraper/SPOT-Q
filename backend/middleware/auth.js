const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');
exports.protect = async (req, res, next) => {
    try {
        let token = req.cookies?.token || 
                   (req.headers.authorization?.startsWith('Bearer ') ? 
                    req.headers.authorization.split(' ')[1] : null);

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, no token provided' 
            });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Session expired',
                    isTokenExpired: true 
                });
            }
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'User account is deactivated' });
        }

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
exports.checkAdminAccess = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.department === 'Admin')) {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied' 
        });
    }
};
exports.checkDepartmentAccess = (requiredDept) => {
    return (req, res, next) => {
        if (req.user.role === 'admin' || req.user.department === 'Admin') {
            return next();
        }
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

//  Authentication & Authorization

// PURPOSE:
// This middleware handles user authentication using JWT tokens and provides

// MAIN FUNCTIONS:

// 1) protect - Main authentication middleware that validates JWT tokens
//    - Extracts token from cookies or Authorization header
//    - Verifies token validity and expiration
//    - Loads user from database and attaches to req.user
//    - Blocks access if token is missing, expired, or invalid
// Example usage:
//      router.get('/profile', protect, getUserProfile);
//      // User must be logged in to access this route

// 2) checkAdminAccess - Ensures only admin users can proceed
//    - Requires protect middleware to run first
//    - Checks if user.role === 'admin' OR user.department === 'Admin'
//    - Returns 403 Forbidden if user is not an admin
// Example usage:
//      router.delete('/users/:id', protect, checkAdminAccess, deleteUser);
//      // Only admins can delete users

// 3) checkDepartmentAccess(requiredDept) - Department-based access control
//    - Takes department name as parameter (e.g., 'Tensile', 'Melting')
//    - Admins can access all departments (automatic bypass)
//    - Regular users can only access their own department
//    - Returns 403 if user's department doesn't match required department
// Example usage:
//      router.use('/api/v1/tensile', protect, checkDepartmentAccess('Tensile'), tensileRouter);
//      // Only Tensile department users (and admins) can access

// TOKEN EXTRACTION:
// Tokens are accepted from two sources (in order of priority):
//   1. HTTP-only cookie named 'token'
//   2. Authorization header: "Bearer <token>"

// AUTHENTICATION FLOW:
//   1. Extract token from cookie or header
//   2. Verify token signature and expiration
//   3. Decode token to get user ID
//   4. Fetch user from database (excluding password)
//   5. Check if user still exists and is active
//   6. Attach user object to req.user for downstream use
//   7. Call next() to proceed to next middleware/route handler

// ERROR RESPONSES:
//   - 401: No token, invalid token, expired token, user not found, user deactivated
//   - 403: Insufficient permissions (admin/department access denied)
//   - 500: Server error during authentication process
