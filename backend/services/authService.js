// Authentication business logic. Never touches req/res — the controller owns
// HTTP, including setting the cookie. Throws AppError for anything the operator
// should see.

const userRepository = require('../repositories/userRepository');
const loginActivityRepository = require('../repositories/loginActivityRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { parseDurationMs, getEditWindowMs } = require('../utils/duration');
const { toSessionUser } = require('../utils/serialize');
const { AppError } = require('../utils/AppError');
const { MIN_PASSWORD_LENGTH, LOGIN_HISTORY_KEEP } = require('../utils/constants');

// Fallback matches the previous behaviour in controllers/auth.js when
// JWT_EXPIRE is missing or malformed (parseDurationMs logs the warning).
const DEFAULT_JWT_EXPIRE_MS = 8 * 60 * 60 * 1000;

// Mongoose enforced `minlength: 6` on the schema path. Prisma has no validators,
// so every write site must call this explicitly.
function assertPasswordPolicy(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(400, `Minimum ${MIN_PASSWORD_LENGTH} characters.`, {
            fields: ['password'],
        });
    }
}

// Replaces the Mongoose `uppercase: true` / `trim: true` setters, which had no
// Prisma equivalent. Applied on every read and write of employeeId so a user
// seeded as 'admin01' can still sign in as 'ADMIN01' on case-sensitive Postgres.
const normaliseEmployeeId = (value) => String(value ?? '').trim().toUpperCase();

async function login({ employeeId, password, ip, userAgent }) {
    if (!employeeId || !password) {
        throw new AppError(400, 'ID and password are required.');
    }

    const user = await userRepository.findByEmployeeIdWithSecret(normaliseEmployeeId(employeeId));

    // One message for "no such user" and "deactivated" alike, so the endpoint
    // can't be used to enumerate employee IDs.
    if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid credentials or account inactive');
    }

    if (!(await comparePassword(password, user.passwordHash))) {
        throw new AppError(401, 'Invalid credentials.');
    }

    // The JWT carries only { id }. Role and department are re-read on every
    // request by middleware/auth.js, so a deactivation or a department change
    // takes effect immediately rather than at the next login.
    const token = generateToken(user.id);
    const expiresInMs = parseDurationMs(process.env.JWT_EXPIRE, DEFAULT_JWT_EXPIRE_MS);

    // Audit logging must never fail a valid login — same swallow-and-log
    // semantics as before.
    try {
        await loginActivityRepository.create({
            userId: user.id,
            employeeId: user.employeeId,
            department: user.department,
            ip,
            userAgent,
        });
        await loginActivityRepository.trimToLastN(user.id, LOGIN_HISTORY_KEEP);
    } catch (auditError) {
        console.error('Audit Log failed:', auditError.message);
    }

    return {
        token,
        expiresInMs,
        // The frontend feeds this straight to `new Date(...)` and polls it every
        // 10s to decide when to drop the session, so it must stay an ISO string.
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
        editWindowMs: getEditWindowMs(),
        user: toSessionUser(user),
    };
}

// Centralises what middleware/auth.js used to do inline. Messages are
// byte-identical to the previous implementation.
async function resolveSessionUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(401, 'User no longer exists');
    if (!user.isActive) throw new AppError(401, 'User account is deactivated');
    return user;
}

async function changeOwnPassword(userId, { currentPassword, newPassword }) {
    // Previously `newPassword.length` was read with no guard, so a missing field
    // threw a TypeError and surfaced as a 500 instead of a 400.
    assertPasswordPolicy(newPassword);

    // Previously this verification was gated on `if (currentPassword)`, so
    // omitting the field skipped it entirely — anyone holding a valid session
    // cookie could rewrite the password without knowing the old one. It is now
    // unconditionally required. UserProfile.jsx already always sends it.
    if (!currentPassword || typeof currentPassword !== 'string') {
        throw new AppError(400, 'Current password is required.', {
            fields: ['currentPassword'],
        });
    }

    const user = await userRepository.findByIdWithSecret(userId);
    if (!user) throw new AppError(401, 'User no longer exists');

    if (!(await comparePassword(currentPassword, user.passwordHash))) {
        throw new AppError(401, 'Current password incorrect.', { fields: ['currentPassword'] });
    }

    // No pre-save hook exists under Prisma — hashing is explicit at every write.
    await userRepository.updatePasswordHash(userId, await hashPassword(newPassword));
}

function getLoginHistory(userId, limit = LOGIN_HISTORY_KEEP) {
    return loginActivityRepository.findRecentByUserId(userId, limit);
}

module.exports = {
    login,
    resolveSessionUser,
    changeOwnPassword,
    getLoginHistory,
    assertPasswordPolicy,
    normaliseEmployeeId,
};
