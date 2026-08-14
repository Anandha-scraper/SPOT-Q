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
    const employeeId = (process.env.ADMIN_ID || '').trim().toUpperCase();
    const name = (process.env.ADMIN_NAME || 'Administrator').trim();
    const password = process.env.ADMIN_PASSWORD;
    const allowReset = process.env.ADMIN_RESET_PASSWORD === 'true';
    if (!employeeId || !password) {
        console.error('Missing required env vars: ADMIN_ID, ADMIN_PASSWORD');
        process.exit(1);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        console.error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        process.exit(1);
    }
    const existing = await prisma.user.findUnique({ where: { employeeId } });

    // Only one admin account is allowed. If an admin already exists under a different
    // employeeId, refuse rather than silently creating a second one.
    if (!existing) {
        const otherAdmin = await prisma.user.findFirst({ where: { role: ROLES.ADMIN } });
        if (otherAdmin) {
            console.error(`An admin already exists: ${otherAdmin.employeeId}. Only one admin is allowed.`);
            console.error(`Set ADMIN_ID=${otherAdmin.employeeId} to manage that account instead.`);
            process.exit(1);
        }
    }

    if (existing && !allowReset) {
        describe('Admin already exists — no changes made.', existing);
        console.log('  (set ADMIN_RESET_PASSWORD=true to overwrite the password)');
        return;
    }
    const passwordHash = await hashPassword(password);
    const user = existing
        ? await prisma.user.update({
              where: { employeeId },
              data: {
                  passwordHash,
                  name,
                  role: ROLES.ADMIN,
                  department: ADMIN_DEPARTMENT,
                  isActive: true,
              },
          })
        : await prisma.user.create({
              data: {
                  employeeId,
                  name,
                  passwordHash,
                  role: ROLES.ADMIN,
                  department: ADMIN_DEPARTMENT,
                  isActive: true,
              },
          });

    describe(existing ? 'Admin password reset.' : 'Admin created successfully.', user);
}

main()
    .catch((error) => {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnect();
    });
