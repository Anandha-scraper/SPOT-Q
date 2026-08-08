const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { assertCookieConfig } = require('./utils/cookie');
const { describePrismaError } = require('./utils/prismaError');
const { connect, disconnect, ping } = require('./database/prisma');
const app = express();
// Fail fast on misconfiguration rather than surfacing it as a 500 on someone's first login.
const REQUIRED_ENV = ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRE'];
const OPTIONAL_ENV = ['DIRECT_URL', 'EDIT_TIME', 'FRONTEND_URL', 'DLOG'];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required env vars: ${missingEnv.join(', ')} — server cannot start.`);
  process.exit(1);
}
OPTIONAL_ENV.filter((key) => !process.env[key]).forEach((key) =>
  console.warn(`env ${key} is not set — using default / dev behaviour.`)
);
const PORT = process.env.PORT;
// A misconfigured auth cookie fails silently in the browser, so refuse to boot.
let cookieConfig;
try {
  cookieConfig = assertCookieConfig();
} catch (err) {
  console.error(`Auth cookie misconfigured: ${err.message}`);
  process.exit(1);
}

// Nginx terminates connections on this host; without this req.ip is the proxy's address.
app.set('trust proxy', 'loopback');

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // No origin covers mobile apps, Postman, and same-origin requests.
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());
const { protect } = require('./middleware/auth');
const { checkDepartmentAccess } = require('./middleware/access');
const authRoutes = require('./routes/auth');
const processRoutes = require('./routes/Process');
const tensileRoutes = require('./routes/Tensile');
const impactRoutes = require('./routes/Impact');
const microTensileRoutes = require('./routes/MicroTensile');
const microStructureRoutes = require('./routes/MicroStructure');
const qcProductionRoutes = require('./routes/QcProduction');
const meltingLogRoutes = require('./routes/Melting-MeltingLogsheet');
const cupolaLogRoutes = require('./routes/Melting-CupolaHolderLog');
const disaReportRoutes = require('./routes/Moulding-DismaticProductReportDISA');
const dmmLogRoutes = require('./routes/Moulding-DmmSettingParameters');
const sandNoteRoutes = require('./routes/SandLab-FoundrySandTestingNote');
const returnSandNoteRoutes = require('./routes/SandLab-ReturnSandFoundrySandTestingNote');
const sandRecordRoutes = require('./routes/SandLab-SandTestingRecord');
const downloadLogRoutes = require('./routes/DownloadLog');
const statsRoutes = require('./routes/stats');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/process', protect, checkDepartmentAccess('Process'), processRoutes);
app.use('/api/v1/tensile', protect, checkDepartmentAccess('Tensile'), tensileRoutes);
app.use('/api/v1/impact-tests', protect, checkDepartmentAccess('Impact'), impactRoutes);
app.use('/api/v1/micro-tensile', protect, checkDepartmentAccess('Micro Tensile'), microTensileRoutes);
app.use('/api/v1/micro-structure', protect, checkDepartmentAccess('Micro Structure'), microStructureRoutes);
app.use('/api/v1/qc-reports', protect, checkDepartmentAccess('QC - production'), qcProductionRoutes);
app.use('/api/v1/melting-logs', protect, checkDepartmentAccess('Melting'), meltingLogRoutes);
app.use('/api/v1/cupola-logs', protect, checkDepartmentAccess('Melting'), cupolaLogRoutes);
app.use('/api/v1/moulding-disa', protect, checkDepartmentAccess('Moulding'), disaReportRoutes);
app.use('/api/v1/moulding-dmm', protect, checkDepartmentAccess('Moulding'), dmmLogRoutes);
app.use('/api/v1/sand-testing-records', protect, checkDepartmentAccess('Sand Lab'), sandRecordRoutes);
app.use('/api/v1/foundry-sand-testing-notes', protect, checkDepartmentAccess('Sand Lab'), sandNoteRoutes);
app.use('/api/v1/return-sand-foundry-sand-testing-notes', protect, checkDepartmentAccess('Sand Lab'), returnSandNoteRoutes);

// No department gate — any logged-in user sees their own history; checkAdminAccess gates /all.
app.use('/api/v1/download-logs', protect, downloadLogRoutes);
app.use('/api/v1/entry-stats', protect, statsRoutes);

app.get('/', (req, res) => {  res.json({
    success: true,
    message: 'SPOT-Q Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/v1/auth/*',
      departments: '/api/v1/*'
    }
  });
});

// Login.jsx polls this every few seconds per open tab — cache to avoid N/3 queries/sec against the pooler.
let dbHealth = { ok: false, checkedAt: 0 };
const HEALTH_TTL_MS = 5000;

app.get('/api/health', async (req, res) => {
  if (Date.now() - dbHealth.checkedAt > HEALTH_TTL_MS) {
    try {
      await ping();
      dbHealth = { ok: true, checkedAt: Date.now() };
    } catch {
      dbHealth = { ok: false, checkedAt: Date.now() };
    }
  }

  // Always 200 — Login.jsx only checks response.ok; callers needing DB state read the database field.
  res.status(200).json({
    status: 'ok',
    database: dbHealth.ok ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.expected) {
    console.warn(`${req.method} ${req.originalUrl} -> ${err.status}: ${err.message}`);
  } else {
    console.error(`Error in ${req.method} ${req.url}:`, err.stack);
  }

  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
      ...(err.details ?? {})
    });
  }

  // describePrismaError never echoes err.message — raw database text must not reach the user.
  const { status, message, fields } = describePrismaError(err);
  res.status(status).json({ success: false, message, fields });
});

app.use('*', (req, res) => res.status(404).json({ success: false, message: 'API Route not found' }));

let server;

connect()
  .then(() => {
    console.log('SPOT-Q Database Connected (Prisma)');

    server = app.listen(PORT, () => {
      console.log(`Server active on port ${PORT}`);
      console.log(`Auth cookie: secure=${cookieConfig.secure}, sameSite=${cookieConfig.sameSite}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is busy.`);
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

const shutdown = (signal) => {
  console.log(`${signal} received — shutting down.`);
  const finish = async () => {
    await disconnect();
    process.exit(0);
  };
  if (server) server.close(finish);
  else finish();
  // Don't hang forever on keep-alive sockets.
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// nodemon restarts with SIGUSR2: drop the pool, then re-raise so it can proceed.
process.once('SIGUSR2', async () => {
  await disconnect();
  process.kill(process.pid, 'SIGUSR2');
});
