// Prisma 7's CLI reads connection URLs here (not schema.prisma) and doesn't auto-load .env.
require('dotenv').config();

const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // SQL Server has no pooler/session split, so the CLI and the runtime adapter share one
    // connection string. (Supabase needed a separate DIRECT_URL here; that no longer applies.)
    url: env('PROD_SPOT_Q_DATABASE_URL'),
  },
});
