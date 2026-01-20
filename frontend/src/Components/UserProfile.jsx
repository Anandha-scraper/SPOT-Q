import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/ComponentStyles/UserProfile.css';

const UserProfile = () => {
  const { user } = useContext(AuthContext);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/auth/login-history', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Get last 5 login records
        setLoginHistory(data.data.slice(0, 5));
      } else {
        setError(data.message || 'Failed to load login history');
      }
    } catch (err) {
      setError('Error fetching login history');
      console.error('Login history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!user) return null;

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <h1>User Profile</h1>
        <p>Your account information and recent activity</p>
      </div>

      <div className="profile-content">
        {/* User Information Card */}
        <div className="profile-card">
          <h2 className="card-title">Profile Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Employee ID</span>
              <span className="info-value">{user.employeeId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">{user.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Department</span>
              <span className="info-value">{user.department}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role</span>
              <span className="info-value">{user.role}</span>
            </div>
          </div>
        </div>

        {/* Login History Card */}
        <div className="profile-card">
          <h2 className="card-title">Recent Login Activity</h2>
          <p className="card-subtitle">Last 5 login sessions</p>
          
          {loading ? (
            <div className="loading-state">Loading login history...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : loginHistory.length === 0 ? (
            <div className="empty-state">No login history available</div>
          ) : (
            <div className="login-history-list">
              {loginHistory.map((login, index) => (
                <div key={login._id || index} className="login-item">
                  <div className="login-number">{index + 1}</div>
                  <div className="login-details">
                    <div className="login-date">{formatDate(login.loginAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
