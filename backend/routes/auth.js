const express = require('express');
const router = express.Router();
const { login, verify, logout, createEmployee, getAllUsers, updateEmployee, deleteEmployee, changePassword, getDepartments, getLoginHistory } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { checkAdminAccess } = require('../middleware/access');


router.post('/login', login);
router.get('/verify', protect, verify);
router.post('/logout', protect, logout);
router.put('/changepassword', protect, changePassword);
router.get('/login-history', protect, getLoginHistory);
router.use('/admin', protect, checkAdminAccess); 
router.get('/admin/users', getAllUsers);
router.post('/admin/users', createEmployee);
router.get('/admin/departments', getDepartments);
router.route('/admin/users/:id')
    .put(updateEmployee)
    .delete(deleteEmployee);

module.exports = router;