// Prevents hard-coded values from being scattered throughout your backend and gives the whole application one consistent source for them.
const DEPARTMENTS = Object.freeze(['Melting', 'Sand Lab', 'Moulding', 'Process', 'Micro Tensile', 'Tensile', 'QC - production', 'Micro Structure', 'Impact', 'Admin',]);
const ROLES = Object.freeze({ ADMIN: 'admin', EMPLOYEE: 'employee' });
const ADMIN_DEPARTMENT = 'Admin';
const MIN_PASSWORD_LENGTH = 6;
const LOGIN_HISTORY_KEEP = 5;
const AUTH_COOKIE_NAME = '__session';
module.exports = { DEPARTMENTS, ROLES, ADMIN_DEPARTMENT, MIN_PASSWORD_LENGTH, LOGIN_HISTORY_KEEP, AUTH_COOKIE_NAME,};
