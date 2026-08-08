const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');
const buildClient = () => {
    const adapter = new PrismaMssql(process.env.DATABASE_URL);

    return new PrismaClient({
        adapter,
        omit: { user: { passwordHash: true } },
        log: process.env.PRISMA_LOG === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
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
