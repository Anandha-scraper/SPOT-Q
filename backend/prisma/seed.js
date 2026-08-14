// Seeds the initial admin account.  npm run create-admin
require('dotenv').config();
const { prisma, disconnect } = require('../database/prisma');
const { hashPassword } = require('../utils/password');
const { ROLES, ADMIN_DEPARTMENT, MIN_PASSWORD_LENGTH } = require('../utils/constants');
function describe(label, user) {
    console.log(label);
    console.log(`  Employee ID : ${user.employeeId}`);
    console.log(`  Name        : ${user.name}`);
    console.log(`  Role        : ${user.role}`);
    console.log(`  Department  : ${user.department}`);
}

async function main() {
    const employeeId = (process.env.PROD_SPOT_Q_ADMIN_ID || '').trim().toUpperCase();
    const name = (process.env.PROD_SPOT_Q_ADMIN_NAME || 'Administrator').trim();
    const password = process.env.PROD_SPOT_Q_ADMIN_PASSWORD;
    if (!employeeId || !password) {
        console.error('Missing required env vars: PROD_SPOT_Q_ADMIN_ID, PROD_SPOT_Q_ADMIN_PASSWORD');
        process.exit(1);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        console.error(`PROD_SPOT_Q_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        process.exit(1);
    }
    const existing = await prisma.user.findUnique({ where: { employeeId } });

    if (existing) {
        describe('Admin already exists — no changes made.', existing);
        return;
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            employeeId,
            name,
            passwordHash,
            role: ROLES.ADMIN,
            department: ADMIN_DEPARTMENT,
            isActive: true,
        },
    });

    describe('Admin created successfully.', user);
}

main()
    .catch((error) => {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnect();
    });
