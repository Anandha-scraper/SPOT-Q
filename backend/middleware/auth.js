// Authentication middleware.
//
// Only `protect` lives here. The department/admin gates are in middleware/access.js
// — this file used to carry near-duplicate copies of them that nothing imported.

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
                // The isTokenExpired flag is part of the response contract.
                return res.status(401).json({
                    success: false,
                    message: 'Session expired',
                    isTokenExpired: true,
                });
            }
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        // Middleware -> Service -> Repository. No Prisma import here.
        //
        // The user is re-read on every request because the JWT carries only
        // { id }: a deactivation or department change therefore takes effect on
        // the very next request rather than at the next login.
        //
        // req.user is serialized so it carries both `id` and `_id`, which keeps
        // controllers/DownloadLog.js working when it is remounted — the last
        // Mongoose-backed department module still on disk.
        req.user = serializeUser(await authService.resolveSessionUser(decoded.id));

        next();
    } catch (error) {
        // AppError from resolveSessionUser ('User no longer exists' /
        // 'User account is deactivated') carries its own 401.
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
