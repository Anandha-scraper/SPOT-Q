const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const buildClient = () => {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({
        adapter,
        omit: { user: { passwordHash: true } },
        log: ['warn', 'error'],
    });
};
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__spotqPrisma ?? buildClient();
if (!globalForPrisma.__spotqPrisma) globalForPrisma.__spotqPrisma = prisma;
async function connect() {
    await prisma.$connect();
}
async function ping() {
    await prisma.$queryRaw`SELECT 1`;
    return true;
}

async function disconnect() {
    await prisma.$disconnect();
}

module.exports = { prisma, connect, ping, disconnect };
