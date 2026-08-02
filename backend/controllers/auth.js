// HTTP layer only: read the request, call a service, shape the response.
// No Prisma import, no try/catch (asyncHandler forwards rejections to the
// global handler in server.js), no business rules.

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

// PUBLIC AUTHENTICATION

exports.login = asyncHandler(async (req, res) => {
    const { employeeId, password } = req.body ?? {};

    const { token, expiresInMs, expiresAt, editWindowMs, user } = await authService.login({
        employeeId,
        password,
        // req.ip is only correct because of app.set('trust proxy', 'loopback').
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.cookie(AUTH_COOKIE_NAME, token, { ...getAuthCookieOptions(), maxAge: expiresInMs });

    // Deliberately flat, not wrapped in `data` — Login.jsx and AuthContext read
    // data.expiresAt / data.editWindowMs / data.user off the top level.
    res.status(200).json({ success: true, expiresAt, editWindowMs, user });
});

// PROTECTED USER ACTIONS

exports.verify = asyncHandler(async (req, res) => {
    // req.user was already serialized (carrying both id and _id) by `protect`.
    // The frontend reads only editWindowMs plus the status code here — any
    // non-200 makes it wipe the session, so this is the entire
    // session-invalidation mechanism.
    res.status(200).json({ success: true, user: req.user, editWindowMs: getEditWindowMs() });
});

exports.logout = asyncHandler(async (req, res) => {
    // The flags must match the ones used to set the cookie, or the browser
    // silently ignores the clear — see the comment in utils/cookie.js.
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

// ADMIN USER MANAGEMENT

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
