const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Mount Routes
app.use('/api/auth', authRoutes);

// QC Testing Routes
app.use('/api/v1/tensile-tests', tensileRoutes);
app.use('/api/v1/impact-tests', impactRoutes);
app.use('/api/v1/micro-tensile-tests', microTensileRoutes);
app.use('/api/v1/micro-structure', microStructureRoutes);
app.use('/api/v1/qc-reports', qcProductionRoutes);

// Production Routes
app.use('/api/v1/process-records', processRoutes);

// Melting Routes
app.use('/api/v1/melting-logs', meltingLogsheetRoutes);
app.use('/api/v1/cupola-holder-logs', cupolaHolderLogRoutes);

// Moulding Routes
app.use('/api/v1/dmm-settings', dmmSettingParametersRoutes);
app.use('/api/v1/dismatic-reports', dismaticProductReportRoutes);

// SandLab Routes
app.use('/api/v1/sand-testing-records', sandTestingRecordRoutes);
app.use('/api/v1/foundry-sand-testing-notes', foundrySandTestingNoteRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error' 
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
    console.log(`Try stopping the existing server or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
