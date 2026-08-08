const authService = require('../services/authService');
const userService = require('../services/userService');
const { asyncHandler } = require('../utils/asyncHandler');
const { getAuthCookieOptions } = require('../utils/cookie');
const { getEditWindowMs } = require('../utils/duration');
const { AUTH_COOKIE_NAME } = require('../utils/constants');
const {
    serializeUser,
    serializeUsers,
    serializeLoginActivities,
} = require('../utils/serialize');

// Public authentication

exports.login = asyncHandler(async (req, res) => {
    const { employeeId, password } = req.body ?? {};

    const { token, expiresInMs, expiresAt, editWindowMs, user } = await authService.login({
        employeeId,
        password,
        ip: req.ip || req.headers['x-forwarded-for'], // correct only because of app.set('trust proxy', 'loopback')
        userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.cookie(AUTH_COOKIE_NAME, token, { ...getAuthCookieOptions(), maxAge: expiresInMs });

    // Deliberately flat, not wrapped in `data` — Login.jsx/AuthContext read these fields off the top level.
    res.status(200).json({ success: true, expiresAt, editWindowMs, user });
});

// Protected user actions

exports.verify = asyncHandler(async (req, res) => {
    // Any non-200 here wipes the frontend's session — this is its entire session-invalidation mechanism.
    res.status(200).json({ success: true, user: req.user, editWindowMs: getEditWindowMs() });
});

exports.logout = asyncHandler(async (req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    await authService.changeOwnPassword(req.user.id, { currentPassword, newPassword });
    res.status(200).json({ success: true, message: 'Password updated.' });
});

exports.getLoginHistory = asyncHandler(async (req, res) => {
    const history = await authService.getLoginHistory(req.user.id);
    res.status(200).json({ success: true, data: serializeLoginActivities(history) });
});

// Admin user management

exports.getDepartments = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: userService.listDepartments() });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.listUsers();
    res.status(200).json({ success: true, data: serializeUsers(users) });
});

exports.createEmployee = asyncHandler(async (req, res) => {
    const user = await userService.createEmployee(req.body ?? {});
    res.status(201).json({
        success: true,
        message: 'Employee created',
        data: serializeUser(user),
    });
});

exports.resetEmployeePassword = asyncHandler(async (req, res) => {
    const { password } = req.body ?? {};
    await userService.resetPassword(req.params.id, password);
    res.status(200).json({ success: true, message: 'Password reset successfully.' });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
});
