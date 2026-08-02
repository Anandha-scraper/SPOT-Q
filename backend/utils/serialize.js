const SENSITIVE_KEYS = ['password', 'passwordHash'];
function withDualId(row) {
    if (!row) return null;

    const out = { ...row };
    for (const key of SENSITIVE_KEYS) delete out[key];
    if (out.id !== undefined) out._id = String(out.id);

    return out;
}
const toSessionUser = (user) => ({
    id: user.id,
    _id: String(user.id),
    employeeId: user.employeeId,
    name: user.name,
    role: user.role,
    department: user.department,
});

const serializeUser = (user, extra = {}) => (user ? { ...withDualId(user), ...extra } : null);
const serializeUsers = (rows) => rows.map((user) => serializeUser(user));
const serializeLoginActivity = withDualId;
const serializeLoginActivities = (rows) => rows.map(withDualId);
const serializeRow = (row, extra = {}) => (row ? { ...withDualId(row), ...extra } : null);
const serializeRows = (rows) => rows.map((row) => serializeRow(row));

module.exports = {
    toSessionUser,
    serializeUser,
    serializeUsers,
    serializeLoginActivity,
    serializeLoginActivities,
    serializeRow,
    serializeRows,
};
