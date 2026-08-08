// Admin user-management business logic. Never touches req/res.

const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/password');
const { assertPasswordPolicy, normaliseEmployeeId } = require('./authService');
const { AppError } = require('../utils/AppError');
const { DEPARTMENTS, ROLES } = require('../utils/constants');

function listDepartments() {
    return DEPARTMENTS;
}

function listUsers() {
    return userRepository.findAllWithLastLogin();
}

async function createEmployee({ employeeId, name, department, password }) {
    if (!employeeId || !name || !department || !password) {
        throw new AppError(400, 'All fields required.');
    }

    // Everything Mongoose used to do implicitly via schema options.
    const normalisedId = normaliseEmployeeId(employeeId); // was `uppercase: true`
    const trimmedName = String(name).trim(); // was `trim: true`

    if (!DEPARTMENTS.includes(department)) {
        // was the schema `enum`
        throw new AppError(400, 'Invalid department.', { fields: ['department'] });
    }

    assertPasswordPolicy(password); // was `minlength: 6`

    // Friendly pre-check that preserves the previous message and status. The
    // @unique index is still the real guarantee: if two admins submit the same
    // id concurrently, the P2002 backstop in utils/prismaError.js returns 409.
    if (await userRepository.findByEmployeeId(normalisedId)) {
        throw new AppError(400, 'ID already exists.', { fields: ['employeeId'] });
    }

    return userRepository.create({
        employeeId: normalisedId,
        name: trimmedName,
        department,
        role: ROLES.EMPLOYEE, // forced — never read from the request body
        passwordHash: await hashPassword(password), // explicit; no pre-save hook exists
        isActive: true,
    });
}

async function resetPassword(userId, password) {
    assertPasswordPolicy(password);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    await userRepository.updatePasswordHash(userId, await hashPassword(password));
}

async function deleteUser(userId, actingUser) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'User not found');

    // Deliberate hardening over the previous behaviour, which would happily
    // delete an admin by id — AdminDashboard only hid them client-side. Without
    // this, one bad request could remove the last account able to sign in.
    if (actingUser && String(actingUser.id) === String(userId)) {
        throw new AppError(400, 'You cannot delete your own account.');
    }
    if (user.role === ROLES.ADMIN) {
        throw new AppError(403, 'Admin accounts cannot be deleted from here.');
    }

    // The user's login_activities rows go with it via onDelete: Cascade.
    await userRepository.deleteById(userId);
}

module.exports = { listDepartments, listUsers, createEmployee, resetPassword, deleteUser };
