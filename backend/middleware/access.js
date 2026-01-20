// Registery routes of departments
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
    
    // Check for exact matches
    if (ROUTE_DEPARTMENT_MAP[pathWithoutQuery]) {
        return ROUTE_DEPARTMENT_MAP[pathWithoutQuery];
    }
    
    // Check for nested routes (e.g., /api/v1/tensile/123)
    for (const routePath in ROUTE_DEPARTMENT_MAP) {
        if (pathWithoutQuery.startsWith(routePath + '/') || pathWithoutQuery === routePath) {
            return ROUTE_DEPARTMENT_MAP[routePath];
        }
    }
    return null;
};

exports.checkDepartmentAccess = (requiredDept) => {
    
    return (req, res, next) => {
        // 1. checks found user from auth 
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // 2. Server health and auth routes bypass
        const requestPath = req.originalUrl || req.path;
        if (requestPath.startsWith('/api/v1/auth') || requestPath === '/api/health') {
            return next();
        }

        // 3. Use requiredDept from argument, or fallback to route map
        let deptToCheck = requiredDept;
        if (!deptToCheck) {
            deptToCheck = getRequiredDepartment(requestPath);
        }
        if (!deptToCheck) return next(); // No mapping? Allow through (e.g., system routes)

        // 4. Admin Bypass check
        const isAdmin = req.user.role === 'admin' || req.user.department === 'Admin';
        if (isAdmin) return next();

        // 5. No other department access another than their own
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