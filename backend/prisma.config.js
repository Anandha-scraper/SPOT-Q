// Prisma 7 moved connection URLs out of schema.prisma and into this file.
// It configures the Prisma CLI only (migrate / studio / db execute) — the
// runtime client gets its connection from a driver adapter in database/prisma.js.
//
// Prisma 7 no longer loads .env automatically, hence the explicit dotenv call.
require('dotenv').config();

const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations must NOT go through the Supavisor transaction pooler (:6543):
    // DDL and advisory locks need a real session, so use the direct :5432 URL.
    // Falls back to DATABASE_URL for deployments without a separate pooler
    // (e.g. the future SQL Server box, where DIRECT_URL is dropped entirely).
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
});
