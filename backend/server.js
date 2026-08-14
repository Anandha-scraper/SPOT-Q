const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { ping } = require('./database/prisma');
const app = express();
const PORT = process.env.PROD_SPOT_Q_PORT;
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.PROD_SPOT_Q_FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use('/api/v1/download-logs', protect, downloadLogRoutes);
app.use('/api/v1/entry-stats', protect, statsRoutes);

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

app.listen(PORT, () => {
  console.log(`Server active on port ${PORT}`);
});
