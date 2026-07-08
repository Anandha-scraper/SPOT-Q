import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  User, LogIn, Calendar, Clock, UserRoundPen, Activity,
  Shield, Building2, IdCard, Timer, Download, BarChart3, RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import '../styles/ComponentStyles/PopUp.css';
import { EyeButton } from './Buttons';
import { API_ENDPOINTS } from '../config/api';
import '../styles/ComponentStyles/UserProfile.css';

// Register the Chart.js pieces used by the employee bar chart + admin line chart.
ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Filler, Tooltip, Legend
);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Admin overview: every department + the multi-form departments' sub-forms.
// MOCK ONLY — real per-department entry counts will come from the backend later.
const ADMIN_DEPARTMENTS = [
  'Melting · Log Sheet',
  'Melting · Cupola Holder',
  'Sand Lab · Testing Record',
  'Sand Lab · Foundry Note',
  'Moulding · DISA',
  'Moulding · DMM',
  'Process',
  'Tensile',
  'Impact',
  'Micro Tensile',
  'Micro Structure',
  'QC - Production'
];

const DEPT_COLORS = [
  '#5B9AA9', '#e11d48', '#2563eb', '#f59e0b', '#16a34a', '#9333ea',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5', '#0d9488'
];

// Convert a #rrggbb color to an rgba() string with the given alpha.
const transparentize = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EditCard = ({ isOpen, onClose, onSave, onCancel, departmentName, saveText = 'Save', loading = false, error = '', children }) => {
  if (!isOpen) return null;
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && (onClose || onCancel)) (onClose || onCancel)();
  };
  return (
    <div className="editcard-overlay" onClick={handleBackdropClick}>
      <div className="editcard-container" onClick={(e) => e.stopPropagation()}>
        <div className="editcard-header">
          <h2 className="editcard-title">Edit {departmentName} Test</h2>
        </div>
        <div className="editcard-body">{children}</div>
        <div className="editcard-footer">
          {error && <span className="editcard-error">{error}</span>}
          <button className="editcard-btn editcard-btn-save" onClick={onSave} disabled={loading}>
            {loading ? 'Saving...' : saveText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Format an ISO timestamp into "DD / MM / YYYY" + "HH:MM:SS".
const formatDateTime = (iso) => {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).replace(/\//g, ' / ');
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  return { date, time };
};

const UserProfile = () => {
  // ---- Auth ----
  const { user, expiresAt, isAdmin } = useContext(AuthContext);
  const location = useLocation();
  const currentPage = location.pathname;

  const userData = user || { name: 'Unknown', role: '', department: '', employeeId: '' };

  // ---- Tabs ----
  const [currentView, setCurrentView] = useState('profile');

  // ---- Password modal ----
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  // ---- Login history ----
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ---- Download logs ----
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(true);

  // ---- Entry stats (activity chart) ----
  const [entryStats, setEntryStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ---- Live countdown to auto-logout ----
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch login history for the current user
  useEffect(() => {
    async function fetchLoginHistory() {
      try {
        setHistoryLoading(true);
        const res = await fetch(API_ENDPOINTS.loginHistory, { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const formatted = data.data.map((login) => {
            const { date, time } = formatDateTime(login.loginAt);
            return { id: login._id, date, time, loginAt: login.loginAt, ip: login.ip };
          });
          setLoginHistory(formatted);
        } else {
          setLoginHistory([]);
        }
      } catch (error) {
        console.error('Error fetching login history:', error);
        setLoginHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
    if (user) fetchLoginHistory();
  }, [user]);

  // Fetch download logs (admin => all departments, else own)
  useEffect(() => {
    async function fetchDownloadLogs() {
      try {
        setDownloadLoading(true);
        const endpoint = isAdmin ? API_ENDPOINTS.downloadLogsAll : API_ENDPOINTS.downloadLogs;
        const res = await fetch(endpoint, { credentials: 'include' });
        const data = await res.json();
        setDownloadLogs(data.success && Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error('Error fetching download logs:', error);
        setDownloadLogs([]);
      } finally {
        setDownloadLoading(false);
      }
    }
    if (user) fetchDownloadLogs();
  }, [user, isAdmin]);

  // Fetch per-day entry stats for the current month (non-admin only)
  const fetchEntryStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(API_ENDPOINTS.entryStats, { credentials: 'include' });
      const data = await res.json();
      setEntryStats(data.success ? data.data : null);
    } catch (error) {
      console.error('Error fetching entry stats:', error);
      setEntryStats(null);
    } finally {
      setStatsLoading(false);
    }
  };
  useEffect(() => {
    if (user && !isAdmin) fetchEntryStats();
    else setStatsLoading(false);
  }, [user, isAdmin]);

  // ---- Derived session values ----
  const sessionStarted = loginHistory[0]
    ? `${loginHistory[0].date} · ${loginHistory[0].time}`
    : '—';

  const countdown = useMemo(() => {
    if (!expiresAt) return { text: '—', warn: false, expired: false };
    const remaining = new Date(expiresAt).getTime() - now;
    if (remaining <= 0) return { text: '00:00:00', warn: true, expired: true };
    const totalSec = Math.floor(remaining / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return { text: `${h}:${m}:${s}`, warn: remaining <= 5 * 60 * 1000, expired: false };
  }, [expiresAt, now]);

  // ---- Activity chart data ----
  const chart = useMemo(() => {
    const nowDate = new Date();
    const year = entryStats?.year || nowDate.getFullYear();
    const month = entryStats?.month || (nowDate.getMonth() + 1); // 1-based
    const daysInMonth = entryStats?.daysInMonth || new Date(year, month, 0).getDate();

    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const countByDay = {};
    (entryStats?.counts || []).forEach((c) => { countByDay[c.day] = c.count; });
    const values = labels.map((day) => countByDay[day] || 0);

    const data = {
      labels,
      datasets: [{
        label: 'Entries',
        data: values,
        backgroundColor: 'rgba(91, 154, 169, 0.55)',
        hoverBackgroundColor: 'rgba(91, 154, 169, 0.9)',
        borderColor: '#5B9AA9',
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 22
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { title: (items) => `Day ${items[0].label} · ${MONTH_NAMES[month - 1]}` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b', precision: 0, stepSize: 1 },
          grid: { color: '#eef2f6' }
        }
      }
    };

    return { data, options, title: `${MONTH_NAMES[month - 1]} ${year}` };
  }, [entryStats]);

  // ---- Admin all-department line chart (MOCK) ----
  // Memoized with a stable dependency so the random mock data does not
  // regenerate on every countdown tick. Follows the pasted Chart.js config:
  // smooth lines (tension), animated hover radius, yellow hover point, tooltip off.
  const adminChart = useMemo(() => {
    const nowDate = new Date();
    const year = nowDate.getFullYear();
    const month = nowDate.getMonth() + 1; // 1-based current month (real date)
    // Day-of-month range for the current month, matching the per-day charts
    // used across the departments.
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const datasets = ADMIN_DEPARTMENTS.map((dept, i) => {
      const color = DEPT_COLORS[i % DEPT_COLORS.length];
      return {
        label: dept,
        data: labels.map(() => Math.round(Math.random() * 40) + 5),
        borderColor: color,
        backgroundColor: transparentize(color, 0.5),
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2
      };
    });

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        radius: { duration: 400, easing: 'linear', loop: (context) => context.active }
      },
      elements: {
        point: { hoverRadius: 12, hoverBackgroundColor: 'yellow' }
      },
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      plugins: {
        tooltip: { enabled: false },
        legend: {
          position: 'top',
          labels: { boxWidth: 12, boxHeight: 12, font: { size: 10 }, padding: 8 }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { color: '#64748b', precision: 0 }, grid: { color: '#eef2f6' } }
      }
    };

    return { data: { labels, datasets }, options, title: `${MONTH_NAMES[month - 1]} ${year}` };
  }, []);

  // ---- Password handlers ----
  const handlePasswordModalOpen = () => setIsPasswordModalOpen(true);
  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordError('');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPassword({ current: false, new: false, confirm: false });
  };
  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError('');
  };
  const handlePasswordSave = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.changePassword, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordError(data.message || 'Failed to change password');
        setPasswordLoading(false);
        return;
      }
      setPasswordLoading(false);
      handlePasswordModalClose();
    } catch (error) {
      setPasswordError('Failed to change password');
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'downloads', label: 'Download Logs', icon: Download },
    { key: 'activity', label: 'Activity', icon: BarChart3 }
  ];

  return (
    <div className="user-profile-container">
      {/* Header */}
      <div className="user-profile-header">
        <div className="user-profile-header-text">
          <h2>
            <User size={28} style={{ color: '#5B9AA9' }} />
            User Profile
          </h2>
        </div>
      </div>

      {/* Tab bar */}
      <div className="profile-tabs">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`profile-tab ${currentView === key ? 'active' : ''}`}
            onClick={() => setCurrentView(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ---------------- PROFILE TAB ---------------- */}
      {currentView === 'profile' && (
        <div className="profile-content-grid">
          {/* Left: identity + login history */}
          <div className="user-profile-panel">
            <button
              onClick={handlePasswordModalOpen}
              className="profile-edit-btn"
              title="Change Password"
            >
              <UserRoundPen size={18} />
            </button>

            <div className="user-info-section">
              <div className="user-info-header">
                <div className="user-avatar">
                  <User size={28} style={{ color: 'white' }} />
                </div>
                <div className="user-info-main">
                  <h3 className="user-name">{userData.name}</h3>
                  <span className="user-role-badge">
                    <Shield size={12} /> {userData.role || 'employee'}
                  </span>
                </div>
              </div>

              <div className="user-info-details">
                <div className="detail-item">
                  <label className="detail-label"><IdCard size={12} /> Employee ID</label>
                  <p className="detail-value">{userData.employeeId || '—'}</p>
                </div>
                <div className="detail-item">
                  <label className="detail-label"><Building2 size={12} /> Department</label>
                  <p className="detail-value">{userData.department || '—'}</p>
                </div>
              </div>
            </div>

            <div className="panel-divider"></div>

            <div className="login-history-section">
              <div className="login-history-header">
                <h3 className="login-history-title">
                  <LogIn size={18} style={{ color: '#5B9AA9' }} />
                  Login History
                </h3>
                <p className="login-history-subtitle">Last 5 logins</p>
              </div>
              <div className="login-history-table">
                <div className="login-history-table-header">
                  <div className="table-col-date">DATE</div>
                  <div className="table-col-time">TIME</div>
                </div>
                <div className="login-history-rows">
                  {historyLoading ? (
                    <div className="login-history-loading"><p>Loading login history...</p></div>
                  ) : loginHistory.length > 0 ? (
                    loginHistory.slice(0, 5).map((login) => (
                      <div key={login.id} className="login-history-row">
                        <div className="table-col-date">
                          <span className="login-row-icon"><Calendar size={14} style={{ color: '#5B9AA9' }} /></span>
                          {login.date}
                        </div>
                        <div className="table-col-time">
                          <span className="login-row-icon"><Clock size={14} style={{ color: '#5B9AA9' }} /></span>
                          {login.time}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="login-history-empty"><p>No login history available</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: live session */}
          <div className="activity-panel">
            <div className="activity-header">
              <h3 className="activity-title">
                <Activity size={18} style={{ color: '#5B9AA9' }} />
                Session Overview
              </h3>
            </div>

            {/* Auto-logout countdown */}
            <div className={`session-countdown-card ${countdown.warn ? 'countdown-warn' : ''}`}>
              <div className="session-countdown-head">
                <span className="status-pulse"></span>
                <Timer size={16} />
                <h4>{countdown.expired ? 'Session Expired' : 'Auto Logout In'}</h4>
              </div>
              <p className="countdown-value">{countdown.text}</p>
              <p className="countdown-note">
                {countdown.expired
                  ? 'You will be signed out momentarily.'
                  : 'You will be automatically signed out when this reaches zero.'}
              </p>
            </div>

            {/* Session facts */}
            <div className="session-facts">
              <div className="session-fact">
                <div className="session-fact-icon"><LogIn size={16} /></div>
                <div className="session-fact-body">
                  <p className="session-fact-label">Session Started</p>
                  <p className="session-fact-value">{sessionStarted}</p>
                </div>
              </div>
              <div className="session-fact">
                <div className="session-fact-icon session-fact-icon-green"><Activity size={16} /></div>
                <div className="session-fact-body">
                  <p className="session-fact-label">Last Active</p>
                  <p className="session-fact-value">Active now</p>
                </div>
              </div>
              <div className="session-fact">
                <div className="session-fact-icon"><Clock size={16} /></div>
                <div className="session-fact-body">
                  <p className="session-fact-label">Current Page</p>
                  <p className="session-fact-value">{currentPage}</p>
                </div>
              </div>
            </div>

            <div className="status-badge-card">
              <div className="status-badge">
                <span className="status-pulse"></span>
                Session Active
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DOWNLOAD LOGS TAB ---------------- */}
      {currentView === 'downloads' && (
        <div className="download-logs-panel">
          <div className="download-logs-header">
            <h3 className="download-logs-title">
              <Download size={18} style={{ color: '#5B9AA9' }} />
              Download Logs
            </h3>
            <p className="download-logs-subtitle">
              {isAdmin
                ? 'Report downloads across all departments'
                : 'Your recent report downloads'}
            </p>
          </div>

          <div className="download-log-table-wrap">
            <table className={`download-log-table ${isAdmin ? 'is-admin' : ''}`}>
              <thead>
                <tr>
                  <th>S.No</th>
                  {isAdmin && <th>Dept</th>}
                  {isAdmin && <th>Emp ID</th>}
                  <th>Date</th>
                  <th>Range Downloaded</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {downloadLoading ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 4} className="download-log-state">Loading download logs...</td>
                  </tr>
                ) : downloadLogs.length > 0 ? (
                  downloadLogs.map((log, index) => {
                    const { date, time } = formatDateTime(log.createdAt);
                    return (
                      <tr key={log._id || index}>
                        <td>{index + 1}</td>
                        {isAdmin && <td>{log.department || '—'}</td>}
                        {isAdmin && <td>{log.employeeId || '—'}</td>}
                        <td>{date}</td>
                        <td>{log.rangeLabel || log.reportType || '—'}</td>
                        <td>{time}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 4} className="download-log-state">
                      Download history will appear here once you export a report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- ACTIVITY TAB ---------------- */}
      {currentView === 'activity' && (
        isAdmin ? (
          /* Admin: all-department overview (MOCK data, backend wired later) */
          <div className="activity-chart-panel">
            <div className="activity-chart-head">
              <div>
                <h3 className="activity-chart-title">
                  <BarChart3 size={18} style={{ color: '#5B9AA9' }} />
                  Department Entry Trends
                </h3>
                <p className="activity-chart-subtitle">
                  {adminChart.title} · daily entries per department &amp; sub-department
                  <span className="mock-tag">Preview · mock data</span>
                </p>
              </div>
            </div>

            <div className="activity-chart-card is-admin">
              <Line data={adminChart.data} options={adminChart.options} />
            </div>
          </div>
        ) : (
          /* Employee: own per-day entries for the current month */
          <div className="activity-chart-panel">
            <div className="activity-chart-head">
              <div>
                <h3 className="activity-chart-title">
                  <BarChart3 size={18} style={{ color: '#5B9AA9' }} />
                  Entries This Month
                </h3>
                <p className="activity-chart-subtitle">{chart.title} · entries submitted per day</p>
              </div>
              <button className="chart-refresh-btn" onClick={fetchEntryStats} title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="activity-chart-card">
              {statsLoading ? (
                <div className="activity-chart-state">Loading activity...</div>
              ) : (
                <Bar data={chart.data} options={chart.options} />
              )}
            </div>
          </div>
        )
      )}

      {/* Password Change Modal */}
      <EditCard
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordModalClose}
        departmentName="Password"
        onSave={handlePasswordSave}
        onCancel={handlePasswordModalClose}
        saveText="Change Password"
        loading={passwordLoading}
        error={passwordError}
      >
        <div className="password-change-form">
          <div className="password-form-group">
            <label htmlFor="currentPassword" className="password-label">Current Password</label>
            <div className="password-input-wrapper">
              <input
                id="currentPassword"
                type={showPassword.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Enter current password"
                className="password-input"
                disabled={passwordLoading}
              />
              <EyeButton
                onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                isVisible={showPassword.current}
              />
            </div>
          </div>
          <div className="password-form-group">
            <label htmlFor="newPassword" className="password-label">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                type={showPassword.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Enter new password"
                className="password-input"
                disabled={passwordLoading}
              />
              <EyeButton
                onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                isVisible={showPassword.new}
              />
            </div>
          </div>
          <div className="password-form-group">
            <label htmlFor="confirmPassword" className="password-label">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={showPassword.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
                className="password-input"
                disabled={passwordLoading}
              />
              <EyeButton
                onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                isVisible={showPassword.confirm}
              />
            </div>
          </div>
        </div>
      </EditCard>
    </div>
  );
};

export default UserProfile;
