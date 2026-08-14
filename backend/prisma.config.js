// Prisma 7's CLI reads connection URLs here (not schema.prisma) and doesn't auto-load .env.
require('dotenv').config();

const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('PROD_SPOT_Q_PG_HOST'),
  },
});
