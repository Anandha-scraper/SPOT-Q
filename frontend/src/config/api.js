// Relative URLs, resolved against whatever origin served the page. In dev the Vite proxy
// forwards /api to :5000; in production nginx proxies /api to 127.0.0.1:5000 on the same
// origin. Leave VITE_API_BASE UNSET — it is substituted at build time, so setting it bakes an
// absolute host into the bundle and moves every call cross-origin (CORS + a preflight each).
const API_BASE = import.meta.env.VITE_API_BASE ?? '';
export const API_ENDPOINTS = {
  // Health — mounted at /api/health, deliberately outside the /api/v1 prefix.
  health:           `${API_BASE}/api/health`,
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
  entryStatsAdmin:  `${API_BASE}/api/v1/entry-stats/admin`,   // admin: per-day counts across all departments
  // Departments
  tensile:                 `${API_BASE}/api/v1/tensile`,
  impactTests:             `${API_BASE}/api/v1/impact-tests`,
  microTensile:            `${API_BASE}/api/v1/micro-tensile`,
  microStructure:          `${API_BASE}/api/v1/micro-structure`,
  qcReports:               `${API_BASE}/api/v1/qc-reports`,
  process:                 `${API_BASE}/api/v1/process`,
  sandTestingRecords:      `${API_BASE}/api/v1/sand-testing-records`,
  foundrySandTestingNotes: `${API_BASE}/api/v1/foundry-sand-testing-notes`,
  returnSandFoundrySandTestingNotes: `${API_BASE}/api/v1/return-sand-foundry-sand-testing-notes`,
  mouldingDisa:            `${API_BASE}/api/v1/moulding-disa`,
  mouldingDmm:             `${API_BASE}/api/v1/moulding-dmm`,
  meltingLogs:             `${API_BASE}/api/v1/melting-logs`,
  cupolaLogs:              `${API_BASE}/api/v1/cupola-logs`,
};
