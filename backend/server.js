const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// 1. Global Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
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
  .then(async () => {
    console.log('SPOT-Q Database Connected');

    try {
      console.log('Synchronizing Daily Department Records...');
      // Ensures today's entry exists for all depts
      await Promise.all([
        impactCtrl.initializeTodayEntry(),
        tensileCtrl.initializeTodayEntry(),
        microTCtrl.initializeTodayEntry(),
        microSCtrl.initializeTodayEntry(),
        qcProdCtrl.initializeTodayEntry(),
        processCtrl.initializeTodayEntry(),
        disaCtrl.initializeTodayEntry(),
        sandRecCtrl.initializeTodayEntry(),
        sandNoteCtrl.initializeTodayEntry(),
        dmmCtrl.initializeTodayEntry(),
        meltingCtrl.initializeTodayEntry()
      ]);
      console.log('All Departments Initialized');
    } catch (error) {
      console.error('Critical: Initialization failed:', error.message);
    }
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

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

// 7. System Utilities
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
  
  // Initialize daily entry management for all departments
  const { initializeDailyEntry, ensureTodayEntry } = require('./utils/dailyEntryManager');
  const Process = require('./models/Process');
  
  // Setup cron job for Process department
  initializeDailyEntry(Process, 'Process');
  
  // Create today's entry if it doesn't exist
  await ensureTodayEntry(Process, 'Process');
});

// Graceful Error Management
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is busy. Killing process and retrying...`);
    process.exit(1);
  }
});


//  Main Application Entry Point

// PURPOSE:
// This is the central server file that initializes the Express application,
// connects to MongoDB, configures middleware, sets up all department routes,
// and manages daily record synchronization for the SPOT-Q quality control system.

// APPLICATION STARTUP FLOW:

// 1) GLOBAL MIDDLEWARE SETUP
//    - CORS: Allows frontend (localhost:5173, localhost:3000) to make requests
//      Example: Frontend at localhost:5173 can call API at localhost:5000
//    - express.json(): Parses incoming JSON request bodies
//      Example: POST /api/v1/tensile with JSON body gets parsed automatically
//    - cookieParser(): Reads authentication cookies from requests
//      Example: JWT token stored in HTTP-only cookie is extracted

// 2) SECURITY MIDDLEWARE IMPORT
//    - protect: Validates JWT tokens and loads user into req.user
//    - checkDepartmentAccess: Ensures users can only access their department's routes
//      Example: Tensile user cannot access Melting routes (403 Forbidden)

// 3) DEPARTMENT ROUTES IMPORT
//    - All route files from /routes directory are imported
//    - Each department has its own router: Tensile, Impact, Melting, etc.
//      Example: tensileRoutes handles all /api/v1/tensile/* endpoints

// 4) CONTROLLERS IMPORT FOR INITIALIZATION
//    - Controllers are imported to call their initializeTodayEntry() functions
//    - This ensures each department has a record for today's date
//      Example: If today is 2026-01-23 and no Impact record exists, it's created

// 5) DATABASE CONNECTION & GLOBAL SYNC
//    - Connects to MongoDB using MONGODB_URI from .env file
//    - On successful connection, calls initializeTodayEntry() for all departments
//    - This runs in parallel using Promise.all() for efficiency
//      Example: All 11 departments get today's entry created simultaneously

// 6) MOUNT ROUTES WITH PROTECTION
//    - Public routes: /api/v1/auth (login, logout) - No protection needed
//    - Private routes: All department routes require authentication + department access
//      Example flow for /api/v1/tensile:
//        Request → protect (validate JWT) → checkDepartmentAccess('Tensile') 
//        → tensileRoutes → controller → response

//    Route Protection Pattern:
//      app.use('/api/v1/tensile', protect, checkDepartmentAccess('Tensile'), tensileRoutes);
//      - protect: User must be logged in
//      - checkDepartmentAccess('Tensile'): User must belong to Tensile department
//      - tensileRoutes: Actual route handlers (GET, POST, PUT, DELETE)

// 7) SYSTEM UTILITIES
//    - Health check endpoint: GET /api/health
//      Returns server status and MongoDB connection state
//      Example response: { status: 'ok', mongodb: 'connected', timestamp: '2026-01-23...' }

//    - Global error handler: Catches all unhandled errors
//      Logs error and returns 500 Internal Server Error

//    - 404 handler: Catches all undefined routes
//      Returns 404 API Route not found

// 8) SERVER START & DAILY ENTRY MANAGEMENT
//    - Starts Express server on PORT (default 5000)
//    - Initializes cron jobs for daily entry management
//    - Creates today's Process entry if missing
//      Example: Cron job runs at midnight to create next day's records

// DEPARTMENT ROUTES MAP:
//   /api/v1/tensile                      → Tensile department
//   /api/v1/impact-tests                 → Impact department
//   /api/v1/micro-tensile                → Micro Tensile department
//   /api/v1/micro-structure              → Micro Structure department
//   /api/v1/qc-reports                   → QC - production department
//   /api/v1/process                      → Process department
//   /api/v1/sand-testing-records         → Sand Lab department
//   /api/v1/foundry-sand-testing-notes   → Sand Lab department
//   /api/v1/moulding-disa                → Moulding department
//   /api/v1/moulding-dmm                 → Moulding department
//   /api/v1/melting-logs                 → Melting department
//   /api/v1/cupola-logs                  → Melting department

// ENVIRONMENT VARIABLES REQUIRED (.env file):
//   - MONGODB_URI: MongoDB connection string
//   - PORT: Server port (optional, defaults to 5000)
//   - JWT_SECRET: Secret key for JWT token signing (used in auth middleware)

// EXAMPLE REQUEST FLOW:
//   1. User logs in via POST /api/v1/auth/login
//   2. Server validates credentials, returns JWT token in cookie
//   3. User requests GET /api/v1/tensile/reports
//   4. protect middleware validates JWT token
//   5. checkDepartmentAccess('Tensile') verifies user is in Tensile dept
//   6. Request reaches tensileRoutes → controller → database query
//   7. Response sent back with tensile reports
