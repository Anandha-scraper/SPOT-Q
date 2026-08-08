const { verifyToken } = require('../utils/jwt');
const authService = require('../services/authService');
const { serializeUser } = require('../utils/serialize');
const { AUTH_COOKIE_NAME } = require('../utils/constants');

exports.protect = async (req, res, next) => {
    try {
        const token =
            req.cookies?.[AUTH_COOKIE_NAME] ||
            (req.headers.authorization?.startsWith('Bearer ')
                ? req.headers.authorization.split(' ')[1]
                : null);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided',
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
                    isTokenExpired: true,
                });
            }
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        // Re-read on every request since the JWT carries only { id } — a deactivation takes effect next request, not next login.
        req.user = serializeUser(await authService.resolveSessionUser(decoded.id));

        next();
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication',
        });
    }
};
