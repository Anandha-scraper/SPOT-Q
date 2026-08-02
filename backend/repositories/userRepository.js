// Data access for users. The only layer that touches Prisma.
// Takes and returns plain objects — never req/res, never AppError.
// Raw Prisma errors bubble up to the global handler via utils/prismaError.js.

const { prisma } = require('../database/prisma');

// The public column allowlist. passwordHash is absent, and adding it here
// should fail review — see the layered defence described in findWithSecret below.
const USER_PUBLIC_SELECT = Object.freeze({
    id: true,
    employeeId: true,
    name: true,
    department: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
});

function findById(id) {
    return prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
}

function findByEmployeeId(employeeId) {
    return prisma.user.findUnique({ where: { employeeId }, select: USER_PUBLIC_SELECT });
}

// ── The only two functions in the codebase that read the password hash ───────
// Both are named *WithSecret so a leak is greppable:
//   grep -rn "WithSecret" backend/{services,controllers}
// should only ever hit services/authService.js, which consumes the hash and
// returns a public user. Neither result may be handed to a controller as-is.
//
// `omit: { passwordHash: false }` opts back in against the global omit set in
// database/prisma.js. It cannot be combined with `select`, so these two spread
// the allowlist explicitly.

function findByEmployeeIdWithSecret(employeeId) {
    return prisma.user.findUnique({
        where: { employeeId },
        omit: { passwordHash: false },
    });
}

function findByIdWithSecret(id) {
    return prisma.user.findUnique({
        where: { id },
        omit: { passwordHash: false },
    });
}
// ─────────────────────────────────────────────────────────────────────────────

// Replaces the N+1 in the old controllers/auth.js#getAllUsers, which issued one
// LoginActivity.findOne per user. Prisma compiles the `take: 1` inside a
// relation to a window function, so this is a fixed number of queries no matter
// how many users exist.
async function findAllWithLastLogin() {
    const rows = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }, // matches the previous .sort({ createdAt: -1 })
        select: {
            ...USER_PUBLIC_SELECT,
            loginActivities: {
                // Tie-break on id: two logins can land in the same millisecond,
                // and without a deterministic secondary key "the latest" flaps.
                orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
                take: 1,
                select: { loginAt: true },
            },
        },
    });

    // Flatten here, not in the service: callers must never see the relation.
    // `null` rather than undefined — JSON.stringify drops undefined keys, which
    // would silently remove lastLogin from the admin table's payload.
    return rows.map(({ loginActivities, ...user }) => ({
        ...user,
        lastLogin: loginActivities[0]?.loginAt ?? null,
    }));
}

function create(data) {
    return prisma.user.create({ data, select: USER_PUBLIC_SELECT });
}

function updatePasswordHash(id, passwordHash) {
    return prisma.user.update({
        where: { id },
        data: { passwordHash },
        select: USER_PUBLIC_SELECT,
    });
}

// Throws P2025 if the row is absent — mapped to a 404 by utils/prismaError.js.
function deleteById(id) {
    return prisma.user.delete({ where: { id }, select: USER_PUBLIC_SELECT });
}

function countByRole(role) {
    return prisma.user.count({ where: { role } });
}

module.exports = {
    USER_PUBLIC_SELECT,
    findById,
    findByEmployeeId,
    findByEmployeeIdWithSecret,
    findByIdWithSecret,
    findAllWithLastLogin,
    create,
    updatePasswordHash,
    deleteById,
    countByRole,
};
