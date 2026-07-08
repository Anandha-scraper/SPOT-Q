// All paths are relative so the Vite proxy forwards them to Express.
// In production, set VITE_API_BASE to your backend URL (e.g. https://api.spot-q.com).
// In development, leave it empty — the proxy handles it automatically.
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

// Helper to build URLs — works in both dev (proxy) and production (absolute)
export const buildApiUrl = (path) => `${API_BASE}${path}`;

export const API_ENDPOINTS = {
  // Auth
  login:            `${API_BASE}/api/v1/auth/login`,
  logout:           `${API_BASE}/api/v1/auth/logout`,
  verify:           `${API_BASE}/api/v1/auth/verify`,
  loginHistory:     `${API_BASE}/api/v1/auth/login-history`,
  changePassword:   `${API_BASE}/api/v1/auth/changepassword`,
  // Admin
  adminDepartments: `${API_BASE}/api/v1/auth/admin/departments`,
  adminUsers:       `${API_BASE}/api/v1/auth/admin/users`,
  // Profile — download logs & activity stats
  downloadLogs:     `${API_BASE}/api/v1/download-logs`,       // current user's logs (+ POST to record)
  downloadLogsAll:  `${API_BASE}/api/v1/download-logs/all`,   // admin: all departments
  entryStats:       `${API_BASE}/api/v1/entry-stats`,         // per-day entry counts for current month
  // Departments
  tensile:                 `${API_BASE}/api/v1/tensile`,
  impactTests:             `${API_BASE}/api/v1/impact-tests`,
  microTensile:            `${API_BASE}/api/v1/micro-tensile`,
  microStructure:          `${API_BASE}/api/v1/micro-structure`,
  qcReports:               `${API_BASE}/api/v1/qc-reports`,
  process:                 `${API_BASE}/api/v1/process`,
  sandTestingRecords:      `${API_BASE}/api/v1/sand-testing-records`,
  foundrySandTestingNotes: `${API_BASE}/api/v1/foundry-sand-testing-notes`,
  mouldingDisa:            `${API_BASE}/api/v1/moulding-disa`,
  mouldingDmm:             `${API_BASE}/api/v1/moulding-dmm`,
  meltingLogs:             `${API_BASE}/api/v1/melting-logs`,
  cupolaLogs:              `${API_BASE}/api/v1/cupola-logs`,
};

export default API_BASE;
