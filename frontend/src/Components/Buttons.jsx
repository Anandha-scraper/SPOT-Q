import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
} from "react";
import {
  Settings,
  Filter,
  X,
  Pencil,
  Trash2,
  Plus,
  Minus,
  Save,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Table2,
} from "lucide-react";
import { Time } from "@internationalized/date";
import "../styles/ComponentStyles/Buttons.css";

// Export Time class for use in other components
export { Time };

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
      {children || "Filter"}
    </button>
  </div>
);

export const ClearButton = ({ onClick, disabled = false, children }) => (
  <div className="filter-button-wrapper">
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      title="Clear Filter"
      className="clear-btn"
    >
      <X size={18} />
      {children || "Clear"}
    </button>
  </div>
);

// Admin-only report-page toggle: highlights values outside their declared QC
// spec. Same size/shape as FilterButton/ClearButton (shares .filter-button-wrapper),
// own amber color so "active" reads distinctly from Filter/Clear.
export const DeviationToggleButton = ({ active = false, onClick, disabled = false }) => (
  <div className="filter-button-wrapper">
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      title="Highlight values outside their declared QC spec"
      className={`deviation-toggle-btn${active ? " active" : ""}`}
    >
      <AlertTriangle size={18} />
      {active ? "Hide Deviations" : "Show Deviations"}
    </button>
  </div>
);

// Entry Navigation Button (prev / next for date-range browsing)
export const EntryNavButton = ({
  direction = "next",
  onClick,
  disabled = false,
  title,
}) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <div className="filter-button-wrapper" style={{ display: "inline-block" }}>
      <button
        onClick={onClick}
        type="button"
        disabled={disabled}
        title={
          title || (direction === "prev" ? "Previous entry" : "Next entry")
        }
        style={{
          padding: "0",
          width: "38px",
          minHeight: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: disabled
            ? "linear-gradient(135deg, #FF7F50 0%, #FF6A3D 100%)"
            : "linear-gradient(135deg, #FF7F50 0%, #FF6A3D 100%)",
        }}
      >
        <Icon size={18} />
      </button>
    </div>
  );
};

// Excel Download Button

export const ExcelDownloadButton = ({
  onClick,
  disabled = false,
  loading = false,
}) => (
  <div className="excel-button-wrapper">
    <button
      onClick={onClick}
      type="button"
      disabled={disabled || loading}
      title={loading ? "Preparing download…" : "Download Excel"}
      className="excel-btn"
    >
      {loading ? (
        <Loader2 size={18} className="excel-btn-spin" />
      ) : (
        <FileSpreadsheet size={18} />
      )}
      {loading ? "Downloading…" : "Excel"}
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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

export const PlusButton = ({
  onClick,
  disabled = false,
  title = "Add entry",
}) => (
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

export const MinusButton = ({
  onClick,
  disabled = false,
  title = "Remove entry",
  small = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`minus-button${small ? " small" : ""}`}
    title={title}
  >
    <Minus size={small ? 10 : 14} />
  </button>
);

// Submit , Reset , Lock Primary Buttons

export const SubmitButton = forwardRef(
  ({ onClick, disabled = false, children, type = "button", loading = false }, ref) => (
    <div className="submit-button-wrapper">
      <button
        ref={ref}
        onClick={onClick}
        type={type}
        disabled={disabled || loading}
        title={loading ? "Saving..." : (children || "Submit")}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {loading ? "Saving..." : (children || "Submit")}
      </button>
    </div>
  ),
);
SubmitButton.displayName = "SubmitButton";

export const ResetButton = forwardRef(
  ({ onClick, disabled = false, children }, ref) => (
    <div className="reset-button-wrapper">
      <button
        ref={ref}
        onClick={onClick}
        type="button"
        disabled={disabled}
        title={children || "Reset"}
      >
        <RefreshCw size={18} />
        {children || "Reset"}
      </button>
    </div>
  ),
);
ResetButton.displayName = "ResetButton";

export const LockPrimaryButton = forwardRef(
  (
    {
      onClick,
      disabled = false,
      isLocked = false,
      statusMessage = null,
      statusVariant = "primary",
      label = "Save Primary",
    },
    ref,
  ) => (
    <div className="lock-primary-button-wrapper">
      <button
        ref={ref}
        onClick={onClick}
        type="button"
        disabled={disabled || isLocked || !!statusMessage}
        title={statusMessage || (isLocked ? "Primary Saved" : label)}
        className={statusMessage ? `status-${statusVariant}` : ""}
        style={
          !statusMessage && isLocked
            ? { backgroundColor: "#10b981", cursor: "not-allowed", opacity: 0.8 }
            : {}
        }
      >
        {statusMessage || (isLocked ? "Primary Saved" : label)}
      </button>
    </div>
  ),
);
LockPrimaryButton.displayName = "LockPrimaryButton";

// Record navigator for report pages: Prev / Table / Next over a list of
// combinations, showing one detail view at a time. Extracted from the three
// SandLab report pages, which still carry their own inline copies.
const navButtonStyle = (disabled) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "8px",
  border: "2px solid",
  background: "#fff",
  color: disabled ? "#94a3b8" : "#5B9AA9",
  borderColor: disabled ? "#cbd5e1" : "#5B9AA9",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 600,
  fontSize: "0.8rem",
});

export const EntryNavigator = ({
  currentIndex,
  total,
  showTable = false,
  onPrev,
  onNext,
  onToggleTable,
}) => {
  if (total <= 1) return null;

  const atFirst = showTable || currentIndex === 0;
  const atLast = showTable || currentIndex === total - 1;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button type="button" onClick={onPrev} disabled={atFirst} style={navButtonStyle(atFirst)} title="Previous">
        <ChevronLeft size={16} /> Prev
      </button>
      <button
        type="button"
        onClick={onToggleTable}
        style={{ ...navButtonStyle(false), ...(showTable ? { background: "#5B9AA9", color: "#fff" } : {}) }}
        title="Show combinations table"
      >
        <Table2 size={16} /> Table
      </button>
      <button type="button" onClick={onNext} disabled={atLast} style={navButtonStyle(atLast)} title="Next">
        Next <ChevronRight size={16} />
      </button>
      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
        {currentIndex + 1} / {total}
      </span>
    </div>
  );
};

// DISA Dropdown Component

export const DisaDropdown = forwardRef(
  (
    {
      value,
      onChange,
      name,
      disabled,
      onKeyDown,
      className = "",
      onFocus,
      onBlur,
      style,
    },
    ref,
  ) => {
    const disaOptions = ["DISA 1", "DISA 2", "DISA 3", "DISA 4"];

    return (
      <div className={`disa-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          style={style}
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
  },
);
DisaDropdown.displayName = "DisaDropdown";

// Plant Dropdown Component (Return Sand Foundry Sand Testing Note) — same
// look/structure as DisaDropdown, different fixed option set.

export const PlantDropdown = forwardRef(
  (
    {
      value,
      onChange,
      name,
      disabled,
      onKeyDown,
      className = "",
      onFocus,
      onBlur,
      style,
    },
    ref,
  ) => {
    const plantOptions = ["Eirich", "Disa", "Foundry-A"];

    return (
      <div className={`disa-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          style={style}
        >
          {plantOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
PlantDropdown.displayName = "PlantDropdown";

// Filter DISA Dropdown Component (for reports with "All" option)

export const FilterDisaDropdown = forwardRef(
  (
    {
      value,
      onChange,
      name,
      disabled,
      onKeyDown,
      className = "",
      style = {},
      options = [],
    },
    ref,
  ) => {
    // Default DISA options if none provided
    const defaultDisaOptions = ["DISA 1", "DISA 2", "DISA 3", "DISA 4"];
    const disaOptions = options.length > 0 ? options : defaultDisaOptions;

    return (
      <div className={`disa-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          style={style}
        >
          <option value="All">All</option>
          {disaOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
FilterDisaDropdown.displayName = "FilterDisaDropdown";

// Machine Dropdown Component

export const MachineDropdown = forwardRef(
  (
    {
      value,
      onChange,
      name,
      disabled,
      onKeyDown,
      className = "",
      style = {},
      id,
    },
    ref,
  ) => {
    const machineOptions = ["1", "2", "3", "4"];

    return (
      <div className={`machine-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          style={style}
        >
          <option value="">Select Machine</option>
          {machineOptions.map((option) => (
            <option key={option} value={option}>
              Machine {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
MachineDropdown.displayName = "MachineDropdown";

// Shift Dropdown Component

export const ShiftDropdown = forwardRef(
  (
    { value, onChange, name, disabled, onKeyDown, onMouseDown, className = "" },
    ref,
  ) => {
    const shiftOptions = ["Shift 1", "Shift 2", "Shift 3"];

    return (
      <div className={`shift-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          tabIndex={disabled ? -1 : 0}
          style={{
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? "#f1f5f9" : "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <option value="">Select Shift</option>
          {shiftOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
ShiftDropdown.displayName = "ShiftDropdown";

// Furnace Number Dropdown Component

export const FurnaceDropdown = forwardRef(
  (
    { value, onChange, name, disabled, onKeyDown, onMouseDown, className = "" },
    ref,
  ) => {
    const furnaceOptions = ["1", "2", "3", "4"];

    return (
      <div className={`shift-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          tabIndex={disabled ? -1 : 0}
          style={{
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? "#f1f5f9" : "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <option value="">Select Furnace</option>
          {furnaceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
FurnaceDropdown.displayName = "FurnaceDropdown";

// Holder Number Dropdown Component

export const HolderDropdown = forwardRef(
  ({ value, onChange, name, disabled, onKeyDown, className = "" }, ref) => {
    const holderOptions = ["1", "2", "3", "4"];

    return (
      <div className={`shift-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
        >
          <option value="">Select Holder</option>
          {holderOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
HolderDropdown.displayName = "HolderDropdown";

// Panel Dropdown Component

export const PanelDropdown = forwardRef(
  (
    { value, onChange, name, disabled, onKeyDown, onMouseDown, className = "" },
    ref,
  ) => {
    const panelOptions = ["A", "B", "C", "D"];

    return (
      <div className={`shift-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          tabIndex={disabled ? -1 : 0}
          style={{
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? "#f1f5f9" : "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <option value="">Select Panel</option>
          {panelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
PanelDropdown.displayName = "PanelDropdown";

// SG/FG Grade Dropdown Component

export const SgFgDropdown = forwardRef(
  (
    {
      value,
      onChange,
      name,
      disabled,
      onKeyDown,
      onFocus,
      onBlur,
      className = "",
    },
    ref,
  ) => {
    const gradeOptions = ["SG", "FG"];

    return (
      <div className={`shift-dropdown-wrapper ${className}`}>
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          tabIndex={disabled ? -1 : 0}
          style={{
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.6 : 1,
            backgroundColor: disabled ? "#f1f5f9" : "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <option value="">Select Grade</option>
          {gradeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  },
);
SgFgDropdown.displayName = "SgFgDropdown";

export const CustomTimeInput = forwardRef(
  (
    {
      value,
      onChange,
      className = "",
      hasError = false,
      onFocus,
      onBlur,
      onEnterPress,
      disabled = false,
      style = {},
      ...props
    },
    ref,
  ) => {
    const hourRef = useRef(null);
    const minuteRef = useRef(null);
    const periodRef = useRef(null);

    // Refs for timeout management to prevent memory leaks
    const hourTimeoutRef = useRef(null);
    const minuteTimeoutRef = useRef(null);
    const hourBufferRef = useRef("");
    const minuteBufferRef = useRef("");

    // Expose focus method to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        hourRef.current?.focus();
        hourRef.current?.select();
      },
    }));

    // Extract hour, minute, period from Time object or initialize with defaults
    const [hour, setHour] = useState("");
    const [minute, setMinute] = useState("");
    const [period, setPeriod] = useState("AM");

    // Clean up timeouts on unmount
    useEffect(() => {
      return () => {
        if (hourTimeoutRef.current) clearTimeout(hourTimeoutRef.current);
        if (minuteTimeoutRef.current) clearTimeout(minuteTimeoutRef.current);
      };
    }, []);

    // Sync with external value prop
    useEffect(() => {
      if (value && value.hour != null && value.minute != null) {
        const hour24 = value.hour;
        const displayHour =
          hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const displayPeriod = hour24 >= 12 ? "PM" : "AM";

        setHour(String(displayHour).padStart(2, "0"));
        setMinute(String(value.minute).padStart(2, "0"));
        setPeriod(displayPeriod);
      } else {
        setHour("");
        setMinute("");
        setPeriod("AM");
      }
    }, [value]);

    // Create Time object from current values and call onChange
    const updateTime = (newHour, newMinute, newPeriod) => {
      if (newHour && newMinute) {
        const hour24 =
          newPeriod === "PM"
            ? parseInt(newHour) === 12
              ? 12
              : parseInt(newHour) + 12
            : parseInt(newHour) === 12
              ? 0
              : parseInt(newHour);

        const timeObj = new Time(hour24, parseInt(newMinute));
        onChange(timeObj);
      } else if (!newHour && !newMinute) {
        onChange(null);
      }
    };

    const handleHourChange = (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if (val.length > 2) val = val.slice(0, 2);

      // Clear any existing timeout
      if (hourTimeoutRef.current) {
        clearTimeout(hourTimeoutRef.current);
        hourTimeoutRef.current = null;
      }

      if (val === "") {
        // Field cleared
        hourBufferRef.current = "";
        setHour("");
        updateTime("", minute, period);
        return;
      }

      const inputLength = val.length;

      if (inputLength === 1) {
        // Allow any single digit to be entered
        setHour(val);
        hourBufferRef.current = val;
      } else if (inputLength === 2) {
        // Two digits entered - validate the complete value
        let num = parseInt(val);

        // Only accept hours between 01 and 12
        if (num < 1 || num > 12) {
          // Invalid hour, revert to previous value
          setHour(hourBufferRef.current);
          return;
        }

        const finalHour = String(num).padStart(2, "0");
        setHour(finalHour);
        updateTime(finalHour, minute, period);
        hourBufferRef.current = "";

        // Don't auto-advance - user must press Tab/Enter
      }
    };

    const handleMinuteChange = (e) => {
      let val = e.target.value.replace(/\D/g, "");
      if (val.length > 2) val = val.slice(0, 2);

      // Clear any existing timeout
      if (minuteTimeoutRef.current) {
        clearTimeout(minuteTimeoutRef.current);
        minuteTimeoutRef.current = null;
      }

      if (val === "") {
        // Field cleared
        minuteBufferRef.current = "";
        setMinute("");
        updateTime(hour, "", period);
        return;
      }

      const inputLength = val.length;

      if (inputLength === 1) {
        // Allow any single digit to be entered
        setMinute(val);
        minuteBufferRef.current = val;
      } else if (inputLength === 2) {
        // Two digits entered - validate the complete value
        let num = parseInt(val);

        // Only accept minutes between 00 and 59
        if (num > 59) {
          // Invalid minute, revert to previous value
          setMinute(minuteBufferRef.current);
          return;
        }

        const finalMinute = String(num).padStart(2, "0");
        setMinute(finalMinute);
        updateTime(hour, finalMinute, period);
        minuteBufferRef.current = "";

        // Don't auto-advance - user must press Tab/Enter
      }
    };

    const handlePeriodChange = (newPeriod) => {
      setPeriod(newPeriod);
      updateTime(hour, minute, newPeriod);
    };

    const handleHourKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        // Clear timeout if moving forward
        if (hourTimeoutRef.current) {
          clearTimeout(hourTimeoutRef.current);
          hourTimeoutRef.current = null;
        }

        // Pad single digit hour before moving
        if (hour && hour.length === 1) {
          const paddedHour = hour.padStart(2, "0");
          setHour(paddedHour);
          updateTime(paddedHour, minute, period);
        }

        if (e.key === "Enter") {
          e.preventDefault();
          minuteRef.current?.focus();
          minuteRef.current?.select();
        }
      }
    };

    const handleMinuteKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        // Clear timeout if moving forward
        if (minuteTimeoutRef.current) {
          clearTimeout(minuteTimeoutRef.current);
          minuteTimeoutRef.current = null;
        }

        // If minute is empty, set to "00"
        if (!minute || minute === "") {
          setMinute("00");
          updateTime(hour, "00", period);
        } else if (minute.length === 1) {
          // Pad single digit minute before moving
          const paddedMinute = minute.padStart(2, "0");
          setMinute(paddedMinute);
          updateTime(hour, paddedMinute, period);
        }

        if (e.key === "Enter") {
          e.preventDefault();
          periodRef.current?.focus();
        }
      }
    };

    const handlePeriodKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // Blur the period field to complete the time input
        periodRef.current?.blur();

        // Use parent's onEnterPress callback for proper navigation
        if (onEnterPress) {
          onEnterPress(e);
          return;
        }

        // Fallback: find next focusable element outside this time input
        const allFocusables = Array.from(
          document.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
          ),
        ).filter((el) => el.offsetParent !== null);

        const idx = allFocusables.indexOf(periodRef.current);
        if (idx > -1 && idx < allFocusables.length - 1) {
          allFocusables[idx + 1].focus();
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        handlePeriodChange(period === "AM" ? "PM" : "AM");
      } else if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        handlePeriodChange("AM");
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePeriodChange("PM");
      }
    };

    const handleHourFocus = () => {
      if (onFocus) onFocus();
    };

    const handleHourBlur = () => {
      // Clear timeout when leaving the field
      if (hourTimeoutRef.current) {
        clearTimeout(hourTimeoutRef.current);
        hourTimeoutRef.current = null;
      }

      // Pad hour to 2 digits when leaving the field
      if (hour && hour.length === 1) {
        const num = parseInt(hour);
        const paddedHour = (num < 1 ? 1 : num).toString().padStart(2, "0");
        setHour(paddedHour);
        updateTime(paddedHour, minute, period);
      }

      hourBufferRef.current = "";
      if (onBlur) onBlur();
    };

    const handleMinuteBlur = () => {
      // Clear timeout when leaving the field
      if (minuteTimeoutRef.current) {
        clearTimeout(minuteTimeoutRef.current);
        minuteTimeoutRef.current = null;
      }

      // If minute is empty, set to "00"
      if (!minute || minute === "") {
        setMinute("00");
        updateTime(hour, "00", period);
      } else if (minute.length === 1) {
        // Pad minute to 2 digits when leaving the field
        const paddedMinute = minute.padStart(2, "0");
        setMinute(paddedMinute);
        updateTime(hour, paddedMinute, period);
      }

      minuteBufferRef.current = "";
      if (onBlur) onBlur();
    };

    const getClassName = () => {
      let classes = `custom-time-input-container ${className}`;
      if (hasError) {
        classes += " has-error";
      }
      if (disabled) {
        classes += " disabled";
      }
      return classes;
    };

    return (
      <div
        ref={ref}
        className={getClassName()}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.25rem 0.75rem",
          border: hasError ? "2px solid #ef4444" : "2px solid #cbd5e1",
          borderRadius: "8px",
          backgroundColor: disabled ? "#f3f4f6" : "#fff",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
          transition: "all 0.3s ease",
          fontSize: "0.875rem",
        }}
      >
        <input
          ref={hourRef}
          type="text"
          value={hour}
          onChange={handleHourChange}
          onKeyDown={handleHourKeyDown}
          onFocus={handleHourFocus}
          onBlur={handleHourBlur}
          disabled={disabled}
          placeholder="HH"
          maxLength={2}
          className="time-input-field"
          style={{
            width: "2.5rem",
            border: "none",
            outline: "none",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: "500",
            backgroundColor: "transparent",
            padding: "0",
            borderRadius: "6px",
            cursor: "text",
          }}
        />
        <span style={{ fontWeight: "600", color: "#64748b" }}>:</span>
        <input
          ref={minuteRef}
          type="text"
          value={minute}
          onChange={handleMinuteChange}
          onKeyDown={handleMinuteKeyDown}
          onBlur={handleMinuteBlur}
          disabled={disabled}
          placeholder="MM"
          maxLength={2}
          className="time-input-field"
          style={{
            width: "2.5rem",
            border: "none",
            outline: "none",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: "500",
            backgroundColor: "transparent",
            padding: "0",
            borderRadius: "6px",
            cursor: "text",
          }}
        />
        <select
          ref={periodRef}
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value)}
          onKeyDown={handlePeriodKeyDown}
          onBlur={onBlur}
          disabled={disabled}
          className="time-period-select"
          style={{
            width: "3.5rem",
            border: "none",
            outline: "none",
            fontSize: "0.875rem",
            fontWeight: "600",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: "0",
            color: "#1e293b",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            borderRadius: "6px",
          }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    );
  },
);
CustomTimeInput.displayName = "CustomTimeInput";

// Department Trend Filter Dropdown (admin UserProfile chart filter)
export const DeptTrendDropdown = ({ value, onChange, options = [], style = {} }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      padding: "0.2rem 0.55rem",
      border: `1.5px solid ${value ? "#5b9aa9" : "#e2e8f0"}`,
      borderRadius: "0.4rem",
      background: value ? "rgba(91,154,169,0.08)" : "#f8fafc",
      color: value ? "#1e293b" : "#64748b",
      fontSize: "0.72rem",
      fontWeight: 600,
      cursor: "pointer",
      outline: "none",
      transition: "border-color 0.2s ease, background 0.2s ease",
      maxWidth: "14rem",
      ...style,
    }}
  >
    <option value="">All Departments</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

// Section Toggles Component (reusable checkboxes with clear button)

export const SectionToggles = ({
  sections = [],
  show = {},
  onToggle,
  onClear,
  onSelectAll,
}) => {
  const anyActive = Object.values(show).some(Boolean);
  const allActive = sections.length > 0 && sections.every(({ key }) => show[key]);

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: "1.5rem",
      }}
    >
      {sections.map(({ key, label }) => (
        <label
          key={key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: show[key] ? "#0f766e" : "#64748b",
            userSelect: "none",
            whiteSpace: "nowrap",
            padding: "0.35rem 0.65rem",
            borderRadius: "6px",
            background: show[key] ? "#f0fdfa" : "transparent",
            border: show[key]
              ? "1.5px solid #99f6e4"
              : "1.5px solid transparent",
            transition: "all 0.2s ease",
          }}
        >
          <input
            type="checkbox"
            checked={!!show[key]}
            onChange={() => onToggle(key)}
            style={{
              accentColor: "#0f766e",
              width: "17px",
              height: "17px",
              cursor: "pointer",
            }}
          />
          {label}
        </label>
      ))}
      {onSelectAll && !allActive && (
        <button
          onClick={onSelectAll}
          style={{
            padding: "0.3rem 0.7rem",
            borderRadius: "6px",
            border: "1.5px solid #99f6e4",
            background: "#f0fdfa",
            color: "#0f766e",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
        >
          Select All
        </button>
      )}
      {anyActive && (
        <button
          onClick={onClear}
          style={{
            padding: "0.3rem 0.7rem",
            borderRadius: "6px",
            border: "1.5px solid #fca5a5",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
};

// Pagination Component

export const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Number of pages to show around current page
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(totalPages, currentPage + halfShow);

    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < showPages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + showPages - 1);
      } else {
        startPage = Math.max(1, endPage - showPages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const showLeftEllipsis = pageNumbers[0] > 2;

  return (
    <div className={`custom-pagination-wrapper ${className}`}>
      <div className="custom-pagination">
        {/* Previous */}
        <button
          className="pagination-nav pagination-prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>

        {/* First page if not in range */}
        {pageNumbers[0] > 1 && (
          <>
            <button className="pagination-item" onClick={() => onPageChange(1)}>
              1
            </button>
            {showLeftEllipsis && (
              <span className="pagination-ellipsis">...</span>
            )}
          </>
        )}

        {/* Page Numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`pagination-item ${page === currentPage ? "pagination-active" : ""}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* Next */}
        <button
          className="pagination-nav pagination-next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};
