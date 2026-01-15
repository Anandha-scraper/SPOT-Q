import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DeleteButton } from './Buttons';
import { Eye, EyeOff, UserRoundPen } from 'lucide-react';
import DeletingStatus, { CreatingEmployeeStatus } from './Alert';
import '../styles/ComponentStyles/AdminDashboard.css';

const AdminDashboard = () => {

    // Hooks and Context
    const { user, isAdmin, token } = useContext(AuthContext);
    const navigate = useNavigate();

    // Data States
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentView, setCurrentView] = useState('add');
    const [selectedDepartment, setSelectedDepartment] = useState('All');

    // Form States
    const [formData, setFormData] = useState({ employeeId: '', name: '', department: '', password: ''});
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formSuccess, setFormSuccess] = useState('');
    const [showCreatePassword, setShowCreatePassword] = useState(false);

    // Modal States (Crucial missing states)
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Delete Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Creating Employee State
    const [isCreating, setIsCreating] = useState(false);

    // Security Redirect
    useEffect(() => {
        if (!isAdmin) navigate('/');
    }, [isAdmin, navigate]);

    useEffect(() => {
        if (isAdmin) fetchDepartments();
    }, [isAdmin]);

    // Functions
    const fetchDepartments = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/admin/departments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) setDepartments(data.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/v1/auth/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) setUsers(data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
        if (view === 'view' && users.length === 0) fetchUsers();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'employeeId' ? value.toUpperCase() : value }));
        setFormError('');
        setFormSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.name || !formData.department || !formData.password) {
            setFormError('Enter all required fields.');
            return;
        }
        if (formData.password.length < 6) {
            setFormError('Password must be at least 6 characters.');
            return;
        }
        try {
            setFormLoading(true);
            const payload = {
                employeeId: formData.employeeId,
                name: formData.name,
                password: formData.password,
                department: formData.department
            };
            const response = await fetch('http://localhost:5000/api/v1/auth/admin/users', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
                setFormLoading(false);
                setIsCreating(true);
                setFormData({ employeeId: '', name: '', department: '', password: '' });
                if (currentView === 'view') fetchUsers();
                setTimeout(() => {
                    setIsCreating(false);
                    setFormSuccess(`Employee ${formData.name} created successfully.`);
                    setTimeout(() => setFormSuccess(''), 2000);
                }, 3000);
            } else {
                setFormError(data.message || 'Failed to create employee.');
            }
        } catch (error) {
            setFormError('Error connecting to server.');
        } finally {
            if (!isCreating) setFormLoading(false);
        }
    };

    const handleOpenDeleteModal = (userId, employeeId) => {
        setUserToDelete({ userId, employeeId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);
        setIsDeleting(true);
        try {
            const response = await fetch(`http://localhost:5000/api/v1/auth/admin/users/${userToDelete.userId}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                await fetchUsers();
                setTimeout(() => {
                    setIsDeleting(false);
                    setUserToDelete(null);
                }, 1000); // set suration of deleting animation
            } else {
                setIsDeleting(false);
                alert(data.message || 'Failed to delete employee');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setIsDeleting(false);
            alert('Error deleting employee');
        }
    };

    const handleOpenPasswordModal = (targetUser) => {
        setSelectedUser(targetUser);
        setNewPassword('');
        setPasswordError('');
        setShowNewPassword(false);
        setShowPasswordModal(true);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
        }
        try {
            setPasswordLoading(true);
            const response = await fetch(`http://localhost:5000/api/v1/auth/admin/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: newPassword })
            });
            const data = await response.json();
            if (data.success) {
                alert('Password updated successfully!');
                setShowPasswordModal(false);
            }
        } catch (error) {
            setPasswordError('Error updating password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="admin-dash">
            <div className="admin-dash-header">
                <h2 className="admin-dash-title">Admin Employee Management</h2>
                <div className="toggle-buttons">
                    <button className={`tog-btn ${currentView === 'view' ? 'active' : ''}`} onClick={() => handleViewChange('view')}>
                        <span className="admin-toggle"> View Employees</span>
                    </button>
                    <button className={`tog-btn ${currentView === 'add' ? 'active' : ''}`} onClick={() => handleViewChange('add')}>
                        <span className="admin-toggle"> Add Employees</span>
                    </button>
                </div>
            </div>

            {/* VIEW EMPLOYEES TAB */}
            {currentView === 'view' && (
                <div className="emp-card">
                    {loading ? (
                        <div className="loading-state">Loading employees...</div>
                    ) : (
                        <div className="emp-table-container">
                            <table className="emp-table">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Department</th>
                                        <th>Last Login</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users
                                        .filter(u => u.role !== 'admin' && (selectedDepartment === 'All' || u.department === selectedDepartment))
                                        .map((u) => (
                                            <tr key={u._id}>
                                                <td className="emp-id">{u.employeeId}</td>
                                                <td>{u.department}</td>
                                                <td>{u.lastLogin ? (() => {
                                                    const date = new Date(u.lastLogin);
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const year = String(date.getFullYear()).slice(-2);
                                                    let hours = date.getHours();
                                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                                    hours = hours % 12 || 12;
                                                    return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
                                                })() : 'Never'}</td>
                                                <td className="actions">
                                                    {u.role !== 'admin' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleOpenPasswordModal(u)}
                                                                className="action-btn edit-btn"
                                                                title="Change Password"
                                                            >
                                                                <UserRoundPen size={20} />
                                                            </button>
                                                            <DeleteButton onClick={() => handleOpenDeleteModal(u._id, u.employeeId)} />
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ADD EMPLOYEE TAB */}
            {currentView === 'add' && (
                <div className="emp-card">
                    <div className="emp-header">
                        <h3 className="emp-title">Add New Employee</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="emp-form-content">
                        <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <div className="input-block" style={{ flex: 1 }}>
                                <label>Employee ID *</label>
                                <input name="employeeId" value={formData.employeeId} onChange={handleInputChange} required />
                            </div>
                            <div className="input-block" style={{ flex: 1 }}>
                                <label>Department *</label>
                                <select name="department" value={formData.department} onChange={handleInputChange} required>
                                    <option value="">-- Select --</option>
                                    {departments.filter(d => d !== 'Admin').map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <div className="input-block" style={{ flex: 1 }}>
                                <label>Name *</label>
                                <input 
                                    type="text"
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="input-block" style={{ flex: 1, position: 'relative' }}>
                                <label>Password *</label>
                                <input 
                                    type={showCreatePassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    required 
                                    minLength={6}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                                    style={{ position: 'absolute', right: '15px', top: '45px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    {showCreatePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {formError && <div className="status-msg error" style={{ color: 'red' }}>{formError}</div>}
                        {formSuccess && <div className="status-msg success" style={{ color: 'green' }}>{formSuccess}</div>}

                        <button type="submit" className="submit-btn-main" disabled={formLoading} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
                            {formLoading ? 'Creating...' : 'Create Employee'}
                        </button>
                    </form>
                </div>
            )}

            {/* PASSWORD MODAL */}
            {showPasswordModal && selectedUser && (
                <div className="overlay-blur" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Change Password</h3>
                        <p className="modal-subtitle">Update password for <strong>{selectedUser.employeeId}</strong></p>
                        <form onSubmit={handleChangePassword} className="modal-form">
                            <div className="input-block">
                                <label>New Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showNewPassword ? "text" : "password"} 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        required 
                                        minLength={6}
                                        className="modal-input"
                                        placeholder="Enter new password"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="password-toggle"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            {passwordError && <div className="modal-error">{passwordError}</div>}
                            <div className="modal-btns">
                                <button type="submit" disabled={passwordLoading} className="btn-save">
                                    {passwordLoading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && userToDelete && (
                <div className="overlay-blur" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Delete Employee</h2>
                        <p className="modal-subtitle">
                            Are you sure you want to delete <strong>{userToDelete.employeeId}</strong>?
                        </p>
                        <div className="modal-btns">
                            <button 
                                onClick={handleConfirmDelete} 
                                className="btn-delete"
                                type="button"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETING ALERT */}
            {isDeleting && <DeletingStatus />}

            {/* CREATING EMPLOYEE ALERT */}
            {isCreating && <CreatingEmployeeStatus />}
        </div>
    );
};

export default AdminDashboard;