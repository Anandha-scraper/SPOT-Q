const { prisma } = require('../database/prisma');

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

async function findAllWithLastLogin() {
    const rows = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            ...USER_PUBLIC_SELECT,
            loginActivities: {
                orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
                take: 1,
                select: { loginAt: true },
            },
        },
    });

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

function deleteById(id) {
    return prisma.user.delete({ where: { id }, select: USER_PUBLIC_SELECT });
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
};
