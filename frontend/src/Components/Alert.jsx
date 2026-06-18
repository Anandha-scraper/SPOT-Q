import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import { ExcelDownloadButton } from './Buttons';
import '../styles/ComponentStyles/Alert.css';

// Deleting Employee Status Component
const DeletingStatus = () => {
  return (
    <div className="delete-alert-overlay">
      <div className="delete-alert-content">
        <div className="delete-loader">
          <div className="trash-lid"></div>
          <div className="trash-body">
            <div className="trash-line"></div>
            <div className="trash-line"></div>
          </div>
          <div className="deleting-item"></div>
        </div>

        <div className="delete-alert-text">
          <h2 className="delete-alert-title">
            Permanently removing employee...
          </h2>
        </div>
      </div>
    </div>
  );
};

// Creating Employee Status Component

const CreatingEmployeeStatus = () => {
  return (
    <div className="create-alert-overlay">
      <div className="create-alert-content">
        
        {/* The Animation Container */}
        <div className="employee-builder-loader">
          {/* The profile card getting built */}
          <div className="profile-card">
            <div className="profile-avatar"></div>
            <div className="profile-details">
              <div className="detail-line text-short"></div>
              <div className="detail-line text-long"></div>
            </div>
          </div>
          {/* The success indicator badge */}
          <div className="success-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .207 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Status Text */}
        <div className="create-alert-text">
          <h2 className="create-alert-title">
            Onboarding New Member
          </h2>
          <p className="create-alert-subtitle">
            Finalizing profile details...
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline Loader Component
export const InlineLoader = ({ 
  message = 'Loading...', 
  size = 'medium',
  variant = 'primary' 
}) => {
  // Icon mapping based on variant
  const iconMap = {
    primary: <Loader2 className="inline-loader-icon" />,
    success: <CheckCircle2 className="inline-loader-icon" />,
    warning: <AlertTriangle className="inline-loader-icon" />,
    danger: <AlertCircle className="inline-loader-icon" />
  };

  const Icon = iconMap[variant] || iconMap.primary;

  return (
    <div className={`inline-loader inline-loader-${size} inline-loader-variant-${variant}`}>
      <div className={`inline-loader-icon-wrapper inline-loader-${variant}`}>
        {Icon}
      </div>
      <span className="inline-loader-message">{message}</span>
    </div>
  );
};

// Excel Download Modal — popup that collects a From/To date range for export.
// Leaving the dates empty downloads the last 2 months (handled by the caller).
export const ExcelDownloadModal = ({ open, onClose, onDownload, loading = false, title = 'Download Excel' }) => {
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayStr);

  // Reset the fields each time the popup opens
  useEffect(() => {
    if (open) {
      setFrom('');
      setTo(todayStr);
    }
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = () => {
    if (!loading) onClose();
  };

  return (
    <div className="excel-modal-overlay" onClick={handleOverlayClick}>
      <div className="excel-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="excel-modal-header">
          <h2 className="excel-modal-title">{title}</h2>
          <button
            type="button"
            className="excel-modal-close"
            onClick={onClose}
            disabled={loading}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="excel-modal-hint">
          Leave the dates empty to download the last 2 months. Maximum 2 months per download.
        </p>

        <div className="excel-modal-fields">
          <div className="excel-modal-field">
            <label>From Date</label>
            <CustomDatePicker
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={todayStr}
              placeholder="From date"
            />
          </div>
          <div className="excel-modal-field">
            <label>To Date</label>
            <CustomDatePicker
              value={to}
              onChange={(e) => setTo(e.target.value)}
              max={todayStr}
              placeholder="To date"
            />
          </div>
        </div>

        <div className="excel-modal-footer">
          <button
            type="button"
            className="excel-modal-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <ExcelDownloadButton
            onClick={() => onDownload({ from, to })}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

// Toast Notification System
// A lightweight, dependency-free pub/sub store so any handler can raise an
// in-app toast via `toast.error(...)` / `toast.warning(...)` etc. without
// prop-drilling. <AlertHost /> is mounted once at the app root and renders
// the live stack of toasts.

let toastListeners = [];
let activeToasts = [];
let toastSeq = 0;

const broadcastToasts = () => {
  toastListeners.forEach((listener) => listener(activeToasts));
};

const dismissToast = (id) => {
  activeToasts = activeToasts.filter((item) => item.id !== id);
  broadcastToasts();
};

const pushToast = (type, message, { duration = 4000 } = {}) => {
  if (message === undefined || message === null || message === '') return;
  const id = ++toastSeq;
  activeToasts = [...activeToasts, { id, type, message: String(message), duration }];
  broadcastToasts();
  return id;
};

export const toast = {
  success: (message, options) => pushToast('success', message, options),
  error: (message, options) => pushToast('error', message, options),
  warning: (message, options) => pushToast('warning', message, options),
  info: (message, options) => pushToast('info', message, options),
  dismiss: dismissToast,
};

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ToastItem = ({ item, onClose }) => {
  const Icon = TOAST_ICONS[item.type] || Info;

  useEffect(() => {
    if (!item.duration) return undefined;
    const timer = setTimeout(onClose, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onClose]);

  return (
    <div className={`toast toast-${item.type}`} role="alert">
      <span className="toast-icon">
        <Icon size={20} />
      </span>
      <p className="toast-message">{item.message}</p>
      <button type="button" className="toast-close" onClick={onClose} title="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
};

export const AlertHost = () => {
  const [toasts, setToasts] = useState(activeToasts);

  useEffect(() => {
    const listener = (next) => setToasts(next);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onClose={() => dismissToast(item.id)} />
      ))}
    </div>
  );
};

export { CreatingEmployeeStatus };
export default DeletingStatus;