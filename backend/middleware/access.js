const ROUTE_DEPARTMENT_MAP = {
    '/api/v1/tensile': 'Tensile',
    '/api/v1/impact-tests': 'Impact',
    '/api/v1/micro-tensile-tests': 'Micro Tensile',
    '/api/v1/micro-structure': 'Micro Structure',
    '/api/v1/qc-reports': 'QC - production',
    '/api/v1/process': 'Process',
    '/api/v1/melting-logs': 'Melting',
    '/api/v1/cupola-holder-logs': 'Melting',
    '/api/v1/dmm-settings': 'Moulding',
    '/api/v1/dismatic-reports': 'Moulding',
    '/api/v1/sand-testing-records': 'Sand Lab',
    '/api/v1/foundry-sand-testing-notes': 'Sand Lab'
};

const getRequiredDepartment = (path) => {
    const pathWithoutQuery = path.split('?')[0];
    if (ROUTE_DEPARTMENT_MAP[pathWithoutQuery]) {
        return ROUTE_DEPARTMENT_MAP[pathWithoutQuery];
    }
    for (const routePath in ROUTE_DEPARTMENT_MAP) {
        if (pathWithoutQuery.startsWith(routePath + '/') || pathWithoutQuery === routePath) {
            return ROUTE_DEPARTMENT_MAP[routePath];
        }
    }
    return null;
};

exports.checkDepartmentAccess = (requiredDept) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const requestPath = req.originalUrl || req.path;
        if (requestPath.startsWith('/api/v1/auth') || requestPath === '/api/health') {
            return next();
        }
        let deptToCheck = requiredDept;
        if (!deptToCheck) {
            deptToCheck = getRequiredDepartment(requestPath);
        }
        if (!deptToCheck) return next(); 
        const isAdmin = req.user.role === 'admin' || req.user.department === 'Admin';
        if (isAdmin) return next();
        if (req.user.department !== deptToCheck) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires '${deptToCheck}' access. Your department: '${req.user.department}'`
            });
        }
        next();
    };
};


exports.checkAdminAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const isAdmin = req.user.role === 'admin' || req.user.department === 'Admin';
    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Access Control & Department-Based Route Protection
// This middleware enforces department-based access control for API routes.
// It ensures users can only access routes belonging to their department.
// MAIN COMPONENTS:

// 1) ROUTE_DEPARTMENT_MAP - Maps API routes to department names
//    Example: '/api/v1/tensile' belongs to 'Tensile' department

// 2) getRequiredDepartment(path) - Determines which department a route belongs to
//    Example: getRequiredDepartment('/api/v1/tensile/123') returns 'Tensile'

// 3) checkDepartmentAccess(requiredDept) - Main middleware that checks if user has access
//    Example: router.use(checkDepartmentAccess('Tensile')) protects Tensile routes

// 4) checkAdminAccess - Middleware that allows only admin users
//    Example: router.get('/admin/users', checkAdminAccess, getUsers)

// USAGE EXAMPLES:
//
// Example 1: Protect a specific department route
//   router.use('/api/v1/tensile', checkDepartmentAccess('Tensile'), tensileRouter);
//
// Example 2: Auto-detect department from route map
//   router.use('/api/v1/tensile', checkDepartmentAccess(), tensileRouter);
//
// Example 3: Protect admin-only routes
//   router.get('/api/v1/admin/users', checkAdminAccess, getAllUsers);
