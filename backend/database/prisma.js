const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');
const buildClient = () => {
    const adapter = new PrismaMssql(process.env.PROD_SPOT_Q_DATABASE_URL);
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
