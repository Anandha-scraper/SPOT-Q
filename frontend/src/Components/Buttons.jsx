import React, { forwardRef } from 'react';
import { Settings, Filter, X, Pencil, Trash2, Plus, Minus, Save, RefreshCw } from 'lucide-react';
import '../styles/ComponentStyles/Buttons.css';

// Action Buttons
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


// Filter & Clear Buttons

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

// Icon Buttons

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

export const PlusButton = ({ onClick, disabled = false, title = "Add entry" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="plus-button"
    title={title}
  >
    <Plus size={14} />
  </button>
);

export const MinusButton = ({ onClick, disabled = false, title = "Remove entry" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="minus-button"
    title={title}
  >
    <Minus size={14} />
  </button>
);


// Submit , Reset , Lock Primary Buttons

export const SubmitButton = ({ onClick, disabled = false, children, type = 'button' }) => (
  <div className="submit-button-wrapper">
    <button onClick={onClick} type={type} disabled={disabled} title={children || 'Submit'}>
      <Save size={18} />
      {children || 'Submit'}
    </button>
  </div>
);

export const ResetButton = ({ onClick, disabled = false, children }) => (
  <div className="reset-button-wrapper">
    <button onClick={onClick} type="button" disabled={disabled} title={children || 'Reset'}>
      <RefreshCw size={18} />
      {children || 'Reset'}
    </button>
  </div>
);

export const LockPrimaryButton = ({ onClick, disabled = false, isLocked = false }) => (
  <div className="lock-primary-button-wrapper">
    <button onClick={onClick} type="button" disabled={disabled} title={isLocked ? 'Unlock Primary' : 'Lock Primary'}>
      {isLocked ? 'Unlock Primary' : 'Lock Primary'}
    </button>
  </div>
);

// Time Input Components

export const TimeInput = forwardRef(({ 
  hourRef, 
  minuteRef, 
  hourName, 
  minuteName, 
  hourValue, 
  minuteValue, 
  onChange, 
  onKeyDown, 
  validationState = null 
}, ref) => {
  const validHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const validMinutes = Array.from({ length: 60 }, (_, i) => i); // [0, 1, 2, ..., 59]

  const handleInputChange = (e) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    const name = e.target.name;
    
    // Limit to 2 digits
    if (value.length > 2) return;
    
    // Validate against allowed values
    if (name === hourName) {
      if (value === '' || validHours.includes(numValue)) {
        onChange(e);
      }
    } else if (name === minuteName) {
      if (value === '' || validMinutes.includes(numValue)) {
        onChange(e);
      }
    }
  };

  return (
    <div 
      className="time-input-wrapper"
      style={{
        border: validationState === null 
          ? '2px solid #cbd5e1' 
          : validationState 
          ? '2px solid #10b981' 
          : '2px solid #ef4444',
        borderRadius: '8px',
        padding: '0.375rem 0.5rem',
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content'
      }}
    >
      <div className="time-inputs-group">
        <input 
          ref={hourRef}
          type="text" 
          inputMode="numeric"
          name={hourName}
          value={hourValue}
          onChange={handleInputChange}
          onInput={(e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="HH" 
          style={{ width: '60px', border: 'none', outline: 'none' }}
        />
        <span>:</span>
        <input 
          ref={minuteRef}
          type="text" 
          inputMode="numeric"
          name={minuteName}
          value={minuteValue}
          onChange={handleInputChange}
          onInput={(e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="MM" 
          style={{ width: '60px', border: 'none', outline: 'none' }}
        />
      </div>
    </div>
  );
});
TimeInput.displayName = 'TimeInput';

export const TimeRangeInput = forwardRef(({ 
  startHourRef, 
  startMinuteRef, 
  endHourRef, 
  endMinuteRef,
  startHourName, 
  startMinuteName,
  endHourName,
  endMinuteName,
  startHourValue, 
  startMinuteValue,
  endHourValue,
  endMinuteValue,
  onChange, 
  onKeyDown, 
  validationState = null 
}, ref) => {
  const validHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const validMinutes = Array.from({ length: 60 }, (_, i) => i); // [0, 1, 2, ..., 59]

  const handleInputChange = (e) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    const name = e.target.name;
    
    // Limit to 2 digits
    if (value.length > 2) return;
    
    // Validate against allowed values
    if (name === startHourName || name === endHourName) {
      if (value === '' || validHours.includes(numValue)) {
        onChange(e);
      }
    } else if (name === startMinuteName || name === endMinuteName) {
      if (value === '' || validMinutes.includes(numValue)) {
        onChange(e);
      }
    }
  };

  return (
    <div 
      className="time-range-input-wrapper"
      style={{
        border: validationState === null 
          ? '2px solid #cbd5e1' 
          : validationState 
          ? '2px solid #10b981' 
          : '2px solid #ef4444',
        borderRadius: '8px',
        padding: '0.375rem 0.5rem',
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content'
      }}
    >
      <div className="time-inputs-group">
        <input 
          ref={startHourRef}
          type="text" 
          inputMode="numeric"
          name={startHourName}
          value={startHourValue}
          onChange={handleInputChange}
          onInput={(e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="HH" 
          style={{ width: '60px', border: 'none', outline: 'none' }}
        />
        <span>:</span>
        <input 
          ref={startMinuteRef}
          type="text" 
          inputMode="numeric"
          name={startMinuteName}
          value={startMinuteValue}
          onChange={handleInputChange}
          onInput={(e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="MM" 
          style={{ width: '60px', border: 'none', outline: 'none' }}
        />
      </div>
      <span className="time-separator">-</span>
      <div className="time-inputs-group">
        <input 
          ref={endHourRef}
          type="text" 
          inputMode="numeric"
          name={endHourName}
          value={endHourValue}
          onChange={handleInputChange}
          onInput={(e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="HH" 
          style={{ width: '60px', border: 'none', outline: 'none' }}
        />
        <span>:</span>
        <input 
          ref={endMinuteRef}
          type="text" 
          inputMode="numeric"
          name={endMinuteName}
          value={endMinuteValue}
          onChange={handleInputChange}
          onInput={(e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="MM" 
          style={{ width: '60px', border: 'none', outline: 'none' }}
        />
      </div>
    </div>
  );
});
TimeRangeInput.displayName = 'TimeRangeInput';

 // DISA Dropdown Component

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
