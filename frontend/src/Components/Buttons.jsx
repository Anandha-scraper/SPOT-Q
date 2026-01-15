import React, { forwardRef } from 'react';
import { Settings, Filter, X, Pencil, Trash2 } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import '../styles/ComponentStyles/Buttons.css';

// ===========================
// Base Button Component
// ===========================
const Button = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  type = 'button',
  ariaLabel,
  ...rest
}) => {
  const base = `btn btn--${variant}`;
  const combined = `${base} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      className={combined}
      disabled={disabled}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
};

// ===========================
// Logout Functionality
// ===========================
export const handleLogout = () => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = '/login';
};

// ===========================
// Logout Buttons
// ===========================
export const LogoutButton = ({ onClick }) => (
  <div className="logout-wrapper">
    <button onClick={onClick || handleLogout}>LOGOUT</button>
  </div>
);

export const AdminLogoutButton = ({ onClick }) => (
  <div className="admin-button-wrapper">
    <button onClick={onClick} className="admin-logout">LOG OUT</button>
  </div>
);

// ===========================
// Action Buttons
// ===========================
export const EditButton = ({ onClick }) => (
  <button
    onClick={onClick}
    type="button"
    title="Edit"
    className="action-button edit"
  >
    <Pencil size={16} />
  </button>
);

export const DeleteButton = ({ onClick }) => (
  <button
    onClick={onClick}
    type="button"
    title="Delete"
    className="action-button delete"
  >
    <Trash2 size={16} />
  </button>
);

export const DeleteUserButton = ({ onClick }) => (
  <div className="delete-button-wrapper">
    <button onClick={onClick}>Delete User</button>
  </div>
);

// ===========================
// Filter & Clear Buttons
// ===========================
export const FilterButton = ({ onClick, disabled = false, children }) => (
  <div className="filter-button-wrapper">
    <button onClick={onClick} type="button" disabled={disabled} title="Filter">
      <Filter size={18} />
      {children || 'Filter'}
    </button>
  </div>
);

export const ClearButton = ({ onClick, disabled = false, children }) => (
  <div className="filter-button-wrapper">
    <button onClick={onClick} type="button" disabled={disabled} title="Clear Filter" className="clear-btn">
      <X size={18} />
      {children || 'Clear'}
    </button>
  </div>
);

// ===========================
// Icon Buttons
// ===========================
export const EyeButton = ({ onClick, isVisible = false }) => (
  <div className="eye-button-wrapper">
    <button
      onClick={onClick}
      type="button"
      title={isVisible ? "Hide password" : "Show password"}
    >
      {isVisible ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )}
    </button>
  </div>
);

export const SettingsButton = ({ onClick }) => (
  <div className="settings-button-wrapper">
    <button onClick={onClick} type="button" title="Settings">
      <Settings size={18} />
    </button>
  </div>
);

// ===========================
// DISA Dropdown Component
// ===========================
export const DisaDropdown = forwardRef(({ value, onChange, name, disabled, onKeyDown, className = '' }, ref) => {
  const disaOptions = ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'];

  return (
    <div className={`disa-dropdown-wrapper ${className}`}>
      <select
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
      >
        <option value="">Select DISA</option>
        {disaOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
});
DisaDropdown.displayName = 'DisaDropdown';

// ===========================
// Date Picker Component
// ===========================
export const DatePicker = forwardRef(({ value, onChange, name, max, placeholder, style, disabled, onKeyDown }, ref) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <CustomDatePicker
      ref={ref}
      value={value}
      onChange={onChange}
      name={name}
      max={max || today}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
      onKeyDown={onKeyDown}
    />
  );
});
DatePicker.displayName = 'DatePicker';

export { Button };
export default Button;
