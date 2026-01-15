
import React, { useContext, useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/ComponentStyles/UserProfile.css';

const formatDateTime = (d) => {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  } catch {
    return String(d);
  }
};

const formatLoginDateTime = (d) => {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} - ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return String(d);
  }
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
    <div style={{ width: 160, color: '#6B7280', fontWeight: 500 }}>{label}</div>
    <div style={{ color: '#111827' }}>{value ?? '-'}</div>
  </div>
);

const UserProfile = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/v1/auth/department-login-history');
        setHistory(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError(e.message || 'Failed to load login history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // For admin users, require current password
    if (isAdmin) {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordError('All fields are required');
        return;
      }
    } else {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordError('All fields are required');
        return;
      }
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const payload = {
        newPassword: passwordForm.newPassword
      };

      // Include current password for admin users
      if (isAdmin) {
        payload.currentPassword = passwordForm.currentPassword;
      }

      const res = await api.put('/v1/auth/changepassword', payload);

      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setPasswordSuccess('');
          setShowPasswordModal(false);
        }, 2000);
      }
    } catch (e) {
      setPasswordError(e.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <div>
          <h2>User Profile</h2>
          <p>Your account information and recent login activity.</p>
        </div>
        <button
          className="settings-icon-btn"
          onClick={() => setShowPasswordModal(true)}
          title="Change Password"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="user-profile-content">
        <section className="profile-card">
          <h3>Profile Information</h3>
          <InfoRow label="Employee ID" value={user.employeeId} />
          <InfoRow label="Name" value={user.name} />
          <InfoRow label="Department" value={user.department} />
          <InfoRow label="Role" value={user.role} />
          {user.email && <InfoRow label="Email" value={user.email} />}
          {user.createdAt && <InfoRow label="Created" value={formatDateTime(user.createdAt)} />}
          {user.updatedAt && <InfoRow label="Updated" value={formatDateTime(user.updatedAt)} />}
        </section>

        <section className="profile-card">
          <h3>Login Activity</h3>
          {loading ? (
            <div className="status-message">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : history.length === 0 ? (
            <div className="status-message">No login activity yet.</div>
          ) : (
            <ol className="history-list">
              {history.map((entry, idx) => (
                <li key={idx}>{formatLoginDateTime(entry.loginAt)}</li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h3>Change Password</h3>
              <button
                className="close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="password-form">
              {isAdmin && (
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    disabled={passwordLoading}
                    autoFocus
                  />
                </div>
              )}

              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  disabled={passwordLoading}
                  autoFocus={!isAdmin}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  disabled={passwordLoading}
                />
              </div>

              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

              <button
                type="submit"
                className="save-btn"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Saving...' : 'Save Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
