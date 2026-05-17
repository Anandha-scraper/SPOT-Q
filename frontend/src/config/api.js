const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error('❌ VITE_API_URL is not defined in .env — frontend cannot start.');
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();
// Base URL for building custom endpoints  
export const API_URL = API_BASE_URL;
// Helper function to build API URLs
export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;
// Dynamic API endpoints that adapt to the environment
export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/v1/auth/login`,
  logout: `${API_BASE_URL}/api/v1/auth/logout`,
  verify: `${API_BASE_URL}/api/v1/auth/verify`,
  loginHistory: `${API_BASE_URL}/api/v1/auth/login-history`,
  changePassword: `${API_BASE_URL}/api/v1/auth/changepassword`,
  // Admin
  adminDepartments: `${API_BASE_URL}/api/v1/auth/admin/departments`,
  adminUsers: `${API_BASE_URL}/api/v1/auth/admin/users`,
  // Departments
  tensile: `${API_BASE_URL}/api/v1/tensile`,
  impactTests: `${API_BASE_URL}/api/v1/impact-tests`,
  microTensile: `${API_BASE_URL}/api/v1/micro-tensile`,
  microStructure: `${API_BASE_URL}/api/v1/micro-structure`,
  qcReports: `${API_BASE_URL}/api/v1/qc-reports`,
  process: `${API_BASE_URL}/api/v1/process`,
  sandTestingRecords: `${API_BASE_URL}/api/v1/sand-testing-records`,
  foundrySandTestingNotes: `${API_BASE_URL}/api/v1/foundry-sand-testing-notes`,
  mouldingDisa: `${API_BASE_URL}/api/v1/moulding-disa`,
  mouldingDmm: `${API_BASE_URL}/api/v1/moulding-dmm`,
  meltingLogs: `${API_BASE_URL}/api/v1/melting-logs`,
  cupolaLogs: `${API_BASE_URL}/api/v1/cupola-logs`,
};

export default API_URL;
