import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Map frontend routes to departments
 * This should match the backend ROUTE_DEPARTMENT_MAP
 */
const ROUTE_DEPARTMENT_MAP = {
  '/tensile': 'Tensile',
  '/tensile/report': 'Tensile',
  '/impact': 'Impact',
  '/impact/report': 'Impact',
  '/micro-tensile': 'Micro Tensile',
  '/micro-tensile/report': 'Micro Tensile',
  '/micro-structure': 'Micro Structure',
  '/micro-structure/report': 'Micro Structure',
  '/qc-production-details': 'QC - production',
  '/qc-production-details/report': 'QC - production',
  '/process': 'Process',
  '/process/report': 'Process',
  '/melting/melting-log-sheet': 'Melting',
  '/melting/melting-log-sheet/report': 'Melting',
  '/melting/cupola-holder-log-sheet': 'Melting',
  '/melting/cupola-holder-log-sheet/report': 'Melting',
  '/moulding/disamatic-product': 'Moulding',
  '/moulding/disamatic-product/report': 'Moulding',
  '/moulding/dmm-setting-parameters': 'Moulding',
  '/moulding/dmm-setting-parameters/report': 'Moulding',
  '/sand-lab/sand-testing-record': 'Sand Lab',
  '/sand-lab/sand-testing-record/report': 'Sand Lab',
  '/sand-lab/foundry-sand-testing-note': 'Sand Lab',
  '/sand-lab/foundry-sand-testing-note/report': 'Sand Lab'
};

/**
 * Map department to default route
 */
const DEPARTMENT_DEFAULT_ROUTE = {
  'Tensile': '/tensile',
  'Impact': '/impact',
  'Micro Tensile': '/micro-tensile',
  'Micro Structure': '/micro-structure',
  'QC - production': '/qc-production-details',
  'Process': '/process',
  'Melting': '/melting/melting-log-sheet',
  'Moulding': '/moulding/disamatic-product',
  'Sand Lab': '/sand-lab/sand-testing-record'
};

/**
 * Get the required department for a given route path
 * @param {string} pathname - The current route path
 * @returns {string|null} - The required department or null if not mapped
 */
function getRequiredDepartment(pathname) {
  // Normalize path - ensure it starts with / and remove query string
  const cleanPath = (pathname.startsWith('/') ? pathname : `/${pathname}`).split('?')[0];
  
  // Check for exact matches first
  if (ROUTE_DEPARTMENT_MAP[cleanPath]) {
    return ROUTE_DEPARTMENT_MAP[cleanPath];
  }
  
  // Sort routes by length (longest first) to match more specific routes first
  // This ensures /tensile/report matches before /tensile
  const sortedRoutes = Object.keys(ROUTE_DEPARTMENT_MAP).sort((a, b) => b.length - a.length);
  
  // Check for path prefixes (for nested routes and reports)
  for (const routePath of sortedRoutes) {
    // Exact match
    if (cleanPath === routePath) {
      return ROUTE_DEPARTMENT_MAP[routePath];
    }
    
    // Check if path is a sub-route (e.g., /tensile/123 matches /tensile)
    // But ensure we're matching at a path segment boundary
    if (cleanPath.startsWith(routePath + '/')) {
      return ROUTE_DEPARTMENT_MAP[routePath];
    }
  }
  
  return null;
}

/**
 * Check if user has access to the required department
 * @param {Object} user - The user object
 * @param {string} requiredDepartment - The required department
 * @returns {boolean} - True if user has access
 */
function hasDepartmentAccess(user, requiredDepartment) {
  if (!user) {
    return false;
  }
  
  // Admin users have access to everything
  if (user.role === 'admin' || user.department === 'Admin') {
    return true;
  }

  // Check if user's department matches the required department
  return user.department === requiredDepartment;
}

/**
 * Department Route Guard Component
 * Protects routes based on user's department
 * Redirects users to their department's default page if they try to access other departments' routes
 */
const DepartmentRouteGuard = ({ children }) => {
  const { user, isAdmin } = useContext(AuthContext);
  const location = useLocation();

  // Admin users can access all routes
  if (isAdmin) {
    return children;
  }

  // Get the required department for the current route
  const requiredDepartment = getRequiredDepartment(location.pathname);

  // If route is not mapped to any department, allow access (for future routes)
  if (!requiredDepartment) {
    return children;
  }

  // Check if user has access to this department
  if (!hasDepartmentAccess(user, requiredDepartment)) {
    // Redirect to user's department default page
    const userDepartment = user?.department;
    const defaultRoute = DEPARTMENT_DEFAULT_ROUTE[userDepartment] || '/micro-tensile';
    
    return <Navigate to={defaultRoute} replace />;
  }

  // User has access, render the component
  return children;
};

export default DepartmentRouteGuard;

