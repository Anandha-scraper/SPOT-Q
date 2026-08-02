// Single source of truth for the values that used to be duplicated between the
// Mongoose schema enums and controllers/auth.js.

// The exact strings the frontend compares against. Casing and spacing are
// load-bearing — note the lowercase p in 'QC - production' and the
// space-hyphen-space. app.jsx#routeMap, DepartmentRouteGuard and
// middleware/access.js all match these literally, so a "tidy-up" here silently
// locks users out of their department.
// Returned verbatim by GET /admin/departments; AdminDashboard filters 'Admin'
// out of its dropdown client-side.
const DEPARTMENTS = Object.freeze([
    'Melting',
    'Sand Lab',
    'Moulding',
    'Process',
    'Micro Tensile',
    'Tensile',
    'QC - production',
    'Micro Structure',
    'Impact',
    'Admin',
]);

const ROLES = Object.freeze({ ADMIN: 'admin', EMPLOYEE: 'employee' });

const ADMIN_DEPARTMENT = 'Admin';

// Was `minlength: 6` on the Mongoose password path.
const MIN_PASSWORD_LENGTH = 6;

// How many login rows to retain per user.
const LOGIN_HISTORY_KEEP = 5;

const AUTH_COOKIE_NAME = '__session';

module.exports = {
    DEPARTMENTS,
    ROLES,
    ADMIN_DEPARTMENT,
    MIN_PASSWORD_LENGTH,
    LOGIN_HISTORY_KEEP,
    AUTH_COOKIE_NAME,
};
