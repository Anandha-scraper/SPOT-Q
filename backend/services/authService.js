const userRepository = require('../repositories/userRepository');
const loginActivityRepository = require('../repositories/loginActivityRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { parseDurationMs, getEditWindowMs } = require('../utils/duration');
const { toSessionUser } = require('../utils/serialize');
const { AppError } = require('../utils/AppError');
const { MIN_PASSWORD_LENGTH, LOGIN_HISTORY_KEEP } = require('../utils/constants');

const DEFAULT_JWT_EXPIRE_MS = 8 * 60 * 60 * 1000;

function assertPasswordPolicy(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(400, `Minimum ${MIN_PASSWORD_LENGTH} characters.`, {
            fields: ['password'],
        });
    }
}

// Applied on every read/write of employeeId so a user seeded as 'admin01' can still sign in as 'ADMIN01' on case-sensitive Postgres.
const normaliseEmployeeId = (value) => String(value ?? '').trim().toUpperCase();

async function login({ employeeId, password, ip, userAgent }) {
    if (!employeeId || !password) {
        throw new AppError(400, 'ID and password are required.');
    }

    const user = await userRepository.findByEmployeeIdWithSecret(normaliseEmployeeId(employeeId));

    // Same message for "no such user" and "deactivated" so the endpoint can't be used to enumerate employee IDs.
    if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid credentials or account inactive');
    }

    if (!(await comparePassword(password, user.passwordHash))) {
        throw new AppError(401, 'Invalid credentials.');
    }

    const token = generateToken(user.id);
    const expiresInMs = parseDurationMs(process.env.JWT_EXPIRE, DEFAULT_JWT_EXPIRE_MS);

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
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(), // frontend polls this every 10s, must stay a parseable ISO string
        editWindowMs: getEditWindowMs(),
        user: toSessionUser(user),
    };
}

async function resolveSessionUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(401, 'User no longer exists');
    if (!user.isActive) throw new AppError(401, 'User account is deactivated');
    return user;
}

async function changeOwnPassword(userId, { currentPassword, newPassword }) {
    assertPasswordPolicy(newPassword);

    // Unconditionally required — omitting it used to skip verification entirely, letting anyone with a valid session rewrite the password.
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
