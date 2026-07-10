const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const { assertCookieConfig } = require('./utils/cookie');
const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  console.error(' PORT is not defined in .env — server cannot start.');
  process.exit(1);
}

// A misconfigured auth cookie fails silently in the browser, so refuse to boot.
let cookieConfig;
try {
  cookieConfig = assertCookieConfig();
} catch (err) {
  console.error(`Auth cookie misconfigured: ${err.message}`);
  process.exit(1);
}

// Nginx terminates connections on the same host; without this req.ip is the
// proxy's address and every login audit record reads 127.0.0.1.
app.set('trust proxy', 'loopback');


// 1. Global Middlewa
// Configure CORS to accept requests from development and production
const allowedOrigins = [
    'http://localhost:3000',   // Vite dev server
    process.env.FRONTEND_URL  // Production URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
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

// 2. Security Middleware
const { protect } = require('./middleware/auth'); // Standardized name
const { checkDepartmentAccess } = require('./middleware/access');

// 3. Import Department Routes
const authRoutes = require('./routes/auth');
const tensileRoutes = require('./routes/Tensile');
const impactRoutes = require('./routes/Impact');
const microTensileRoutes = require('./routes/MicroTensile');
const microStructureRoutes = require('./routes/MicroStructure');
const qcProductionRoutes = require('./routes/QcProduction');
const processRoutes = require('./routes/Process');
const meltingLogsheetRoutes = require('./routes/Melting-MeltingLogsheet');
const cupolaHolderLogRoutes = require('./routes/Melting-CupolaHolderLog');
const dmmSettingParametersRoutes = require('./routes/Moulding-DmmSettingParameters');
const dismaticProductReportRoutes = require('./routes/Moulding-DismaticProductReportDISA');
const sandTestingRecordRoutes = require('./routes/SandLab-SandTestingRecord');
const foundrySandTestingNoteRoutes = require('./routes/SandLab-FoundrySandTestingNote');
const downloadLogRoutes = require('./routes/DownloadLog');
const entryStatsRoutes = require('./routes/stats');

// 4. Import Controllers for Initialization
const impactCtrl = require('./controllers/Impact');
const tensileCtrl = require('./controllers/Tensile');
const microTCtrl = require('./controllers/MicroTensile');
const microSCtrl = require('./controllers/MicroStructure');
const qcProdCtrl = require('./controllers/QcProduction');
const processCtrl = require('./controllers/Process');
const disaCtrl = require('./controllers/Moulding-DismaticProductReportDISA');
const sandRecCtrl = require('./controllers/SandLab-SandTestingRecord');
const sandNoteCtrl = require('./controllers/SandLab-FoundrySandTestingNote');
const dmmCtrl = require('./controllers/Moulding-DmmSettingParameters');
const meltingCtrl = require('./controllers/Melting-MeltingLogsheet');

// 5. Database Connection & Global Sync
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('SPOT-Q Database Connected');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Full Error:', err);
  });

// Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from DB');
});

// 6. Mount Routes
// Public
app.use('/api/v1/auth', authRoutes);

// Private (Gated by Department)
app.use('/api/v1/tensile', protect, checkDepartmentAccess('Tensile'), tensileRoutes);
app.use('/api/v1/impact-tests', protect, checkDepartmentAccess('Impact'), impactRoutes);
app.use('/api/v1/micro-tensile', protect, checkDepartmentAccess('Micro Tensile'), microTensileRoutes);
app.use('/api/v1/micro-structure', protect, checkDepartmentAccess('Micro Structure'), microStructureRoutes);
app.use('/api/v1/qc-reports', protect, checkDepartmentAccess('QC - production'), qcProductionRoutes);
app.use('/api/v1/process', protect, checkDepartmentAccess('Process'), processRoutes);
app.use('/api/v1/sand-testing-records', protect, checkDepartmentAccess('Sand Lab'), sandTestingRecordRoutes);
app.use('/api/v1/foundry-sand-testing-notes', protect, checkDepartmentAccess('Sand Lab'), foundrySandTestingNoteRoutes);
app.use('/api/v1/moulding-disa', protect, checkDepartmentAccess('Moulding'), dismaticProductReportRoutes);
app.use('/api/v1/moulding-dmm', protect, checkDepartmentAccess('Moulding'), dmmSettingParametersRoutes);
app.use('/api/v1/melting-logs', protect, checkDepartmentAccess('Melting'), meltingLogsheetRoutes);
app.use('/api/v1/cupola-logs', protect, checkDepartmentAccess('Melting'), cupolaHolderLogRoutes);

// Cross-department, per-user features (any authenticated user; no department gate)
app.use('/api/v1/download-logs', protect, downloadLogRoutes);
app.use('/api/v1/entry-stats', protect, entryStatsRoutes);

// 7. System Utilities
app.get('/', (req, res) => {
  res.json({ 
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date() });
});

// Global Error Handlers
app.use((err, req, res, next) => {
  console.error(`Error in ${req.method} ${req.url}:`, err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.use('*', (req, res) => res.status(404).json({ success: false, message: 'API Route not found' }));

// 8. Start
const server = app.listen(PORT, async () => {
  console.log(`Server active on port ${PORT}`);
  console.log(`Auth cookie: secure=${cookieConfig.secure}, sameSite=${cookieConfig.sameSite}`);
});

// Graceful Error Management
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is busy. Killing process and retrying...`);
    process.exit(1);
  }
});
