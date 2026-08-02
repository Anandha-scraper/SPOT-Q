// Prisma 7's CLI reads connection URLs here (not schema.prisma) and doesn't auto-load .env.
require('dotenv').config();

const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations need a real session, not the :6543 transaction pooler — see backend.md.
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
});
