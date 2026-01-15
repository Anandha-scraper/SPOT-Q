const express = require('express');
const router = express.Router();
const { login, verify, createEmployee, getAllUsers, updateEmployee, deleteEmployee, changePassword, getDepartments } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { checkAdminAccess } = require('../middleware/access');


router.post('/login', login);
router.get('/verify', protect, verify);
router.put('/changepassword', protect, changePassword); 
router.use('/admin', protect, checkAdminAccess); 
router.get('/admin/users', getAllUsers);
router.post('/admin/users', createEmployee);
router.get('/admin/departments', getDepartments);
router.route('/admin/users/:id')
    .put(updateEmployee)
    .delete(deleteEmployee);

module.exports = router;