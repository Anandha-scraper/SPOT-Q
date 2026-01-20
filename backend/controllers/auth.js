const User = require('../models/user');
const LoginActivity = require('../models/LoginActivity');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');

// Centralized Department List
const DEPARTMENTS = [
    'Melting', 'Sand Lab', 'Moulding', 'Process', 'Micro Tensile',
    'Tensile', 'QC - production', 'Micro Structure', 'Impact', 'Admin'
];

// PUBLIC AUTHENTICATION
exports.login = async (req, res) => {
    try {
        const { employeeId, password } = req.body;
        
        if (!employeeId || !password) {
            return res.status(400).json({ success: false, message: 'ID and password are required.' });
        }

        const user = await User.findOne({ employeeId: employeeId.toUpperCase() }).select('+password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate fresh JWT token for this login
        const token = generateToken(user._id);

        // Convert JWT_EXPIRE to seconds 
        const expiresInSeconds = (() => {
         const expire = process.env.JWT_EXPIRE;
         if (!isNaN(expire)) return parseInt(expire); 
    
        // strings like '1h', '8h', '1d'
         const match = expire.match(/^(\d+)([smhd])$/);
         if (!match) return 60;// Default to 60 seconds if format is invalid 
    
         const value = parseInt(match[1]);
         const unit = match[2];
    
         const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
        return value * multipliers[unit];
    })();

        const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000)).toISOString();

        // Set JWT token in httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiresInSeconds * 1000
        });

        // Async Audit Logging
        try {
            await LoginActivity.create({
                userId: user._id,
                employeeId: user.employeeId,
                department: user.department,
                ip: req.ip || req.headers['x-forwarded-for'],
                userAgent: req.headers['user-agent'] || 'Unknown'
            });
        } catch (auditError) {
            console.error('Audit Log failed:', auditError.message);
        }

        res.status(200).json({
            success: true,
            expiresAt, 
            user: {
                id: user._id,
                employeeId: user.employeeId,
                name: user.name,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// PROTECTED USER ACTIONS
exports.verify = async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
};

exports.logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Minimum 6 characters.' });

        const user = await User.findById(req.user._id).select('+password');
        
        if (currentPassword) {
            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) return res.status(401).json({ success: false, message: 'Current password incorrect.' });
        }

        user.password = await hashPassword(newPassword);
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Password update failed.' });
    }
};

// ADMIN USER MANAGEMENT
exports.createEmployee = async (req, res) => {
    try {
        const { employeeId, name, department, password } = req.body;

        if (!employeeId || !name || !department || !password) {
            return res.status(400).json({ success: false, message: 'All fields required.' });
        }

        const exists = await User.findOne({ employeeId: employeeId.toUpperCase() });
        if (exists) return res.status(400).json({ success: false, message: 'ID already exists.' });

        const user = new User({
            employeeId: employeeId.toUpperCase(),
            name,
            department,
            password: password,
            role: "employee"
        });

        await user.save();
        res.status(201).json({ success: true, message: "Employee created", data: user });
    } catch (error) {
        console.error('Create Employee Error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: errors.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message || 'Creation failed.' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const usersWithLastLogin = await Promise.all(users.map(async (user) => {
            const lastLogin = await LoginActivity.findOne({ userId: user._id })
                .sort({ loginAt: -1 });

            const userObj = user.toJSON();
            userObj.lastLogin = lastLogin ? lastLogin.loginAt : null;
            return userObj;
        }));

        res.status(200).json({ success: true, data: usersWithLastLogin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed.' });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { name, department, password, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        if (user._id.toString() === req.user._id.toString() && isActive === false) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
        }

        if (name) user.name = name;
        if (department && DEPARTMENTS.includes(department)) user.department = department;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (password) user.password = password;

        await user.save();
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Update failed.' });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
        }
        
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(500).json({ success: false, message: 'Delete failed.' });
    }
};

exports.getDepartments = async (req, res) => {
    res.status(200).json({ success: true, data: DEPARTMENTS });
};

exports.getLoginHistory = async (req, res) => {
    try {
        const loginHistory = await LoginActivity.find({ userId: req.user._id })
            .sort({ loginAt: -1 })
            .limit(5)
            .select('loginAt ip userAgent');
        
        res.status(200).json({ success: true, data: loginHistory });
    } catch (error) {
        console.error('Login History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch login history' });
    }
};