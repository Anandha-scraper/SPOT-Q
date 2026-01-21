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