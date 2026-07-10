import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { CustomTimeInput, Time, ShiftDropdown, HolderDropdown, PlusButton, MinusButton } from '../../Components/Buttons';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { InlineLoader } from '../../Components/InlineLoader';
import { API_ENDPOINTS } from '../../config/api';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import '../../styles/PageStyles/Melting/CupolaHolderLogSheet.css';

const CupolaHolderLogSheet = () => {
  // Validation-range info modal (driven by the same validationRanges that powers validation)
  const { isOpen, openModal, closeModal } = useInfoModal();

  // Primary Data — Date defaults to today (still editable; future dates blocked by the picker)
  // Draft containers persist across Form <-> Report navigation (shared context).
  const { primaryData, setPrimaryData, inputRows, setInputRows } = useDepartmentForm('cupola-holder-log-sheet');

  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primarySavedVisual, setPrimarySavedVisual] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);
  const [fetchingPrimary, setFetchingPrimary] = useState(false);
  const [isPrimaryDataSaved, setIsPrimaryDataSaved] = useState(false);
  const [dynamicCheckAlert, setDynamicCheckAlert] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationSaved, setShowCombinationSaved] = useState(false);
  // Controls the exit animation phase before fully hiding the message
  const [closingCombinationMsg, setClosingCombinationMsg] = useState(false);

  // Sequential validation highlighting
  const [dateErrorHighlight, setDateErrorHighlight] = useState(false);
  const [shiftErrorHighlight, setShiftErrorHighlight] = useState(false);
  const [holderNumberErrorHighlight, setHolderNumberErrorHighlight] = useState(false);

  // Validation flag for primary section
  const [primarySubmitted, setPrimarySubmitted] = useState(false);

  // Refs for navigation
  const dateRef = useRef(null);
  const shiftRef = useRef(null);
  const holderRef = useRef(null);
  const primarySaveButtonRef = useRef(null);

  // Helper function for primary field validation classes
  const classFor = (value, submitted, required = false) => {
    const has = value !== undefined && value !== null && String(value).trim() !== '';
    if (submitted && required && !has) return 'cupola-error-outline';
    return '';
  };

  // Handle Enter/Tab key navigation for primary section
  const handlePrimaryKeyDown = (e, nextRef, currentField = null) => {
    // Block e, E, +, - keys for numeric inputs
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
      e.preventDefault();
      return;
    }
    
    // Handle Enter and Tab for navigation within primary section
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      
      // Navigate to next field
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  // Get next available field after date
  const getNextAfterDate = () => {
    if (primaryData.date) return shiftRef;
    return dateRef; // Stay on date if not filled
  };

  // Get next available field after shift
  const getNextAfterShift = () => {
    if (primaryData.date && primaryData.shift) return holderRef;
    if (!primaryData.date) return dateRef;
    return shiftRef; // Stay on shift if not filled
  };

  // Get next available field after holder
  const getNextAfterHolder = () => {
    if (primaryData.date && primaryData.shift && primaryData.holderNumber) {
      return primarySaveButtonRef;
    }
    if (!primaryData.date) return dateRef;
    if (!primaryData.shift) return shiftRef;
    return holderRef; // Stay on holder if not filled
  };

  // Auto-dismiss dynamic check alert
  useEffect(() => {
    if (dynamicCheckAlert) {
      const timer = setTimeout(() => {
        setDynamicCheckAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [dynamicCheckAlert]);

  // Auto-incremented Heat No
  const [heatNo, setHeatNo] = useState(1);

  // Multiple input rows
  const createEmptyRow = () => ({
    cpc: '', mFeSl: '', feMn: '', sic: '', pureMg: '', cu: '', feCr: '',
    actualTimeHour: '', actualTimeMinute: '',
    tappingTimeHour: '', tappingTimeMinute: '',
    tappingTemp: '', metalKg: '',
    disaLine: '', indFur: '', bailNo: '', tap: '', kw: '',
    remarks: ''
  });

  // inputRows draft state now comes from the shared context (see destructure above).

  const [submitLoading, setSubmitLoading] = useState(false);

  // Submitted rows displayed above the input rows
  const [submittedRows, setSubmittedRows] = useState([]);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({}); // { rowIndex: { fieldName: true/false } }
  const [focusedField, setFocusedField] = useState(null); // { rowIndex, fieldName }
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for Enter-key navigation across table cells
  const inputRefs = useRef({});

  // Helper functions to convert between Time object and hour/minute strings
  const createTimeFromHourMinute = (hour, minute) => {
    if (!hour && !minute) return null;
    const h = parseInt(hour) || 0;
    const m = parseInt(minute) || 0;
    return new Time(h, m);
  };

  const handleTimeChange = (rowIndex, hourField, minuteField, timeValue) => {
    setInputRows(prev => {
      const updated = [...prev];
      if (!timeValue) {
        updated[rowIndex] = { ...updated[rowIndex], [hourField]: '', [minuteField]: '' };
      } else {
        updated[rowIndex] = { ...updated[rowIndex], [hourField]: timeValue.hour.toString(), [minuteField]: timeValue.minute.toString() };
      }
      return updated;
    });

    // Validate time fields after change
    const hourValue = timeValue ? timeValue.hour.toString() : '';
    const minuteValue = timeValue ? timeValue.minute.toString() : '';
    const hourValid = validateField(hourField, hourValue);
    const minuteValid = validateField(minuteField, minuteValue);

    if (hourValid && minuteValid) {
      // Clear errors for both hour and minute fields
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[rowIndex]) {
          delete newErrors[rowIndex][hourField];
          delete newErrors[rowIndex][minuteField];
          if (Object.keys(newErrors[rowIndex]).length === 0) {
            delete newErrors[rowIndex];
          }
        }
        return newErrors;
      });
      if (Object.keys(validationErrors).length <= 1) {
        setErrorMessage('');
      }
    } else if (submitAttempted) {
      // Set errors if submit was attempted
      setValidationErrors(prev => ({
        ...prev,
        [rowIndex]: {
          ...(prev[rowIndex] || {}),
          ...(hourValid ? {} : { [hourField]: true }),
          ...(minuteValid ? {} : { [minuteField]: true })
        }
      }));
    }
  };

  // Single source of truth for both the Info modal and field validation.
  // Each entry's `key` matches the input row field name so validateField can look it up.
  const validationRanges = [
    { key: 'heatNo', field: 'Heat No', type: 'Auto', description: 'Auto-incremented per holder & date' },
    { key: 'cpc',    field: 'CPC',     type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'mFeSl',  field: 'Fe Sl',   type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'feMn',   field: 'Fe Mn',   type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'sic',    field: 'SIC',     type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'pureMg', field: 'Pure Mg', type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'cu',     field: 'Cu',      type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'feCr',   field: 'Fe Cr',   type: 'Number', min: 0, max: 1000, unit: 'Kgs' },
    { key: 'actualTime',  field: 'Actual Time',  type: 'Time', pattern: 'HH:MM' },
    { key: 'tappingTime', field: 'Tapping Time', type: 'Time', pattern: 'HH:MM' },
    { key: 'tappingTemp', field: 'Temp', type: 'Number', min: 1, max: 1700, unit: '°C' },
    { key: 'metalKg',     field: 'Metal', type: 'Number', min: 0, max: 5000, unit: 'Kgs' },
    { key: 'disaLine', field: 'DISA Line', type: 'Select', allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'],required:true },
    { key: 'indFur', field: 'IND FUR', type: 'Text' },
    { key: 'bailNo', field: 'BAIL NO', type: 'Text' },
    { key: 'tap',    field: 'TAP',     type: 'Text' },
    { key: 'kw',     field: 'KW',      type: 'Number', min: 0, max: 5000, unit: 'KW' },
    { key: 'remarks', field: 'Remarks', type: 'Text' },
  ];

  // Derived min/max lookup used by validateField — keeps validation in lock-step with the Info modal
  const FIELD_RANGES = Object.fromEntries(
    validationRanges
      .filter(r => r.key && (r.min !== undefined || r.max !== undefined))
      .map(r => [r.key, { min: r.min, max: r.max }])
  );

  // Which row fields are required — derived from validationRanges (single source of truth).
  // The two time entries map onto their hour/minute sub-fields used by the row state.
  const REQUIRED_FIELDS = (() => {
    const set = {};
    validationRanges.forEach(r => {
      if (!r.required) return;
      if (r.key === 'actualTime') { set.actualTimeHour = true; set.actualTimeMinute = true; }
      else if (r.key === 'tappingTime') { set.tappingTimeHour = true; set.tappingTimeMinute = true; }
      else set[r.key] = true;
    });
    return set;
  })();
  const isFieldRequired = (field) => !!REQUIRED_FIELDS[field];

  // Human-readable hint for the input's title attribute
  const rangeHint = (field) => {
    const r = FIELD_RANGES[field];
    return r ? `Range: ${r.min}–${r.max}` : undefined;
  };

  // Validation function for individual field
  const validateField = (field, value) => {
    const isEmpty = value === '' || value === null || value === undefined || String(value).trim() === '';

    // Empty is allowed unless the field is marked required in validationRanges
    if (isEmpty) {
      return !isFieldRequired(field);
    }

    // Numeric fields: validate datatype + allowed min/max range
    const numericFields = ['cpc', 'mFeSl', 'feMn', 'sic', 'pureMg', 'cu', 'feCr', 'tappingTemp', 'metalKg', 'kw'];

    if (numericFields.includes(field)) {
      const num = parseFloat(value);
      if (isNaN(num) || !isFinite(num)) {
        return false;
      }
      const range = FIELD_RANGES[field];
      if (range) {
        if (range.min !== undefined && num < range.min) return false;
        if (range.max !== undefined && num > range.max) return false;
      }
    }

    return true;
  };

  const handleRowChange = (rowIndex, field, value) => {
    setInputRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });

    // Real-time validation
    const isValid = validateField(field, value);
    
    if (isValid) {
      // Clear error if field becomes valid
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[rowIndex]) {
          delete newErrors[rowIndex][field];
          if (Object.keys(newErrors[rowIndex]).length === 0) {
            delete newErrors[rowIndex];
          }
        }
        return newErrors;
      });
      // Clear error message if all fields are now valid
      if (Object.keys(validationErrors).length <= 1) {
        setErrorMessage('');
      }
    } else if (submitAttempted) {
      // Set error only if submit was already attempted
      setValidationErrors(prev => ({
        ...prev,
        [rowIndex]: {
          ...(prev[rowIndex] || {}),
          [field]: true
        }
      }));
    }
  };

  const addInputRow = () => {
    setInputRows(prev => [...prev, createEmptyRow()]);
    // Clear submit attempted when adding new row
    setSubmitAttempted(false);
    setErrorMessage('');
  };

  const removeInputRow = () => {
    if (inputRows.length > 1) {
      const lastIndex = inputRows.length - 1;
      setInputRows(prev => prev.slice(0, -1));
      // Clear validation errors for removed row
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[lastIndex];
        return newErrors;
      });
    }
  };

  // Fetch primary data when date + shift + holderNumber all have values
  useEffect(() => {
    if (primaryData.date && primaryData.shift && primaryData.holderNumber) {
      fetchPrimaryData(primaryData.date, primaryData.shift, primaryData.holderNumber);
    } else {
      // Reset when any key field is missing
      setPrimaryId(null);
      setIsPrimaryDataSaved(false);
      setSubmittedRows([]);
      setHeatNo(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryData.date, primaryData.shift, primaryData.holderNumber]);

  const fetchPrimaryData = async (date, shift, holderNumber) => {
    if (!date || !shift || !holderNumber) return;

    setFetchingPrimary(true);
    try {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const [res] = await Promise.all([
        fetch(
          `${API_ENDPOINTS.cupolaLogs}/primary/${dateStr}?shift=${encodeURIComponent(shift)}&holderNumber=${encodeURIComponent(holderNumber)}`,
          { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
        ),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      const response = await res.json();

      if (response.success && response.data) {
        const data = response.data;
        setPrimaryId(data._id);
        setIsPrimaryDataSaved(true);
        setShowCombinationFound(true);
        setClosingCombinationMsg(false);
        // At 2.6s begin the exit animation, at 3s fully remove the message
        setTimeout(() => setClosingCombinationMsg(true), 2600);
        setTimeout(() => { setShowCombinationFound(false); setClosingCombinationMsg(false); }, 3000);

        // Only update Heat No based on database count, don't display previous entries
        if (data.entries && data.entries.length > 0) {
          setHeatNo(data.entries.length + 1);
        } else {
          setHeatNo(1);
        }
        // Keep submittedRows empty - don't show previous data
        setSubmittedRows([]);
      } else {
        // No existing primary for this combo
        setPrimaryId(null);
        setIsPrimaryDataSaved(false);
        setSubmittedRows([]);
        setHeatNo(1);
      }
    } catch (error) {
      console.error('Error fetching primary data:', error);
      setPrimaryId(null);
      setIsPrimaryDataSaved(false);
      setSubmittedRows([]);
      setHeatNo(1);
    } finally {
      setFetchingPrimary(false);
      setDynamicCheckAlert(true);
    }
  };

  const handlePrimaryChange = (field, value) => {
    // Remove error highlight when filling the field
    if (field === 'date' && value) {
      setDateErrorHighlight(false);
    }
    if (field === 'shift' && value) {
      setShiftErrorHighlight(false);
    }
    if (field === 'holderNumber' && value) {
      setHolderNumberErrorHighlight(false);
    }

    // When date changes, reset everything
    if (field === 'date') {
      setPrimaryData({
        date: value,
        shift: '',
        holderNumber: ''
      });
      setPrimaryId(null);
      setIsPrimaryDataSaved(false);
      setSubmittedRows([]);
      setHeatNo(1);
      setPrimarySubmitted(false);
      // Reset error highlights
      setDateErrorHighlight(false);
      setShiftErrorHighlight(false);
      setHolderNumberErrorHighlight(false);
      return;
    }

    setPrimaryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for when holder field is focused - check if prerequisites are filled
  const handleHolderFieldFocus = (e) => {
    if (!primaryData.date) {
      setDateErrorHighlight(true);
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
    if (!primaryData.shift) {
      setShiftErrorHighlight(true);
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
  };

  const handlePrimarySubmit = async () => {
    setPrimarySubmitted(true);
    // Validate required key fields
    if (!primaryData.date || !primaryData.shift || !primaryData.holderNumber) {
      return;
    }

    setPrimaryLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.cupolaLogs}/primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          primaryData: primaryData
        })
      });
      const response = await res.json();
      
      if (response.success) {
        setPrimaryId(response.data._id);
        setIsPrimaryDataSaved(true);
        setShowCombinationSaved(true);
        setClosingCombinationMsg(false);
        // At 2.6s begin the exit animation, at 3s fully remove the message
        setTimeout(() => setClosingCombinationMsg(true), 2600);
        setTimeout(() => { setShowCombinationSaved(false); setClosingCombinationMsg(false); }, 3000);
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving primary data:', error);
    } finally {
      setPrimaryLoading(false);
    }
  };

  // Validate all rows before submit
  const validateAllRows = () => {
    const errors = {};
    let isValid = true;

    // Every editable field is checked; validateField enforces the required flag
    // (from validationRanges) and the min/max range per field.
    const allFields = [
      'cpc', 'mFeSl', 'feMn', 'sic', 'pureMg', 'cu', 'feCr',
      'actualTimeHour', 'actualTimeMinute', 'tappingTimeHour', 'tappingTimeMinute',
      'tappingTemp', 'metalKg', 'disaLine', 'indFur', 'bailNo', 'tap', 'kw', 'remarks'
    ];

    let hasRangeError = false;
    let hasRequiredError = false;

    inputRows.forEach((row, rowIndex) => {
      allFields.forEach(field => {
        const value = row[field];
        if (!validateField(field, value)) {
          if (!errors[rowIndex]) {
            errors[rowIndex] = {};
          }
          errors[rowIndex][field] = true;
          isValid = false;
          const filled = value !== '' && value !== null && value !== undefined && String(value).trim() !== '';
          if (filled && FIELD_RANGES[field]) hasRangeError = true;
          if (!filled) hasRequiredError = true;
        }
      });
    });

    setValidationErrors(errors);

    if (!isValid) {
      const msgs = [];
      if (hasRequiredError) msgs.push('Please fill all required fields.');
      if (hasRangeError) msgs.push('Some values are outside the allowed range.');
      setErrorMessage(msgs.join(' '));
    } else {
      setErrorMessage('');
    }

    return isValid;
  };

  const handleAllTablesSubmit = async () => {
    // Set submit attempted flag
    setSubmitAttempted(true);

    // Check primary fields
    if (!primaryData.date || !primaryData.shift || !primaryData.holderNumber) {
      return;
    }

    // Validate all rows
    if (!validateAllRows()) {
      return;
    }

    setSubmitLoading(true);
    try {
      // Build entries from all input rows
      const entries = inputRows.map((row, idx) => ({
        heatNo: `Heat No ${heatNo + idx}`,
        cpc: row.cpc ? parseFloat(row.cpc) : '-',
        FeSl: row.mFeSl ? parseFloat(row.mFeSl) : '-',
        feMn: row.feMn ? parseFloat(row.feMn) : '-',
        sic: row.sic ? parseFloat(row.sic) : '-',
        pureMg: row.pureMg ? parseFloat(row.pureMg) : '-',
        cu: row.cu ? parseFloat(row.cu) : '-',
        feCr: row.feCr ? parseFloat(row.feCr) : '-',
        actualTime: (row.actualTimeHour && row.actualTimeMinute) ? `${row.actualTimeHour}:${row.actualTimeMinute}` : '-',
        tappingTime: (row.tappingTimeHour && row.tappingTimeMinute) ? `${row.tappingTimeHour}:${row.tappingTimeMinute}` : '-',
        tappingTemp: row.tappingTemp ? parseFloat(row.tappingTemp) : '-',
        metalKg: row.metalKg ? parseFloat(row.metalKg) : '-',
        disaLine: row.disaLine || '-',
        indFur: row.indFur || '-',
        bailNo: row.bailNo || '-',
        tap: row.tap || '-',
        kw: row.kw ? parseFloat(row.kw) : '-',
        remarks: row.remarks || '-'
      }));

      const response = await fetch(`${API_ENDPOINTS.cupolaLogs}/table-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          primaryData: primaryData,
          data: entries
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update Heat No counter (don't add to submittedRows)
        setHeatNo(prev => prev + inputRows.length);
        setIsPrimaryDataSaved(true);
        // Reset input rows for next entry
        setInputRows([createEmptyRow()]);
        // Clear validation states
        setValidationErrors({});
        setSubmitAttempted(false);
        setErrorMessage('');
        setFocusedField(null);
        // Show branded loader after successful entry save
        alert('Entry saved successfully.');
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving cupola holder log:', error);
      alert('Failed to save entry: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAllTablesReset = () => {
    setInputRows([createEmptyRow()]);
  };

  // Get border color based on validation state and focus
  const getBorderColor = (rowIndex, fieldName) => {
    // Check if field has validation error
    const hasError = validationErrors[rowIndex]?.[fieldName];
    
    // Check if field is currently focused
    const isFocused = focusedField?.rowIndex === rowIndex && focusedField?.fieldName === fieldName;
    
    if (hasError) {
      return '#ef4444'; // Red for errors
    }
    
    if (isFocused) {
      return '#10b981'; // Green for focused
    }
    
    return '#cbd5e1'; // Default gray
  };

  // Whether a time field (hour or minute) has a validation error
  const hasTimeError = (rowIndex, hourField, minuteField) =>
    !!(validationErrors[rowIndex]?.[hourField] || validationErrors[rowIndex]?.[minuteField]);

  // Spatial arrow-key navigation across the whole form (matches Process page).
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const handleEnterFocusNext = (e) => {
    if (e.key !== 'Enter') return;
    const target = e.target;
    if (!(target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA'))) return;
    
    // Find all focusable inputs in the page
    const wrapper = document.querySelector('.page-wrapper');
    if (!wrapper) return;
    
    const elements = Array.from(wrapper.querySelectorAll('input, select, textarea')).filter(el => 
      !el.disabled && !el.readOnly && el.type !== 'hidden'
    );
    
    const currentIndex = elements.indexOf(target);
    if (currentIndex > -1 && currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
      e.preventDefault();
    }
  };

  // Common cell/input styles
  const thStyle = {
    padding: '0.5rem 0.4rem',
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#334155',
    borderBottom: '2px solid #cbd5e1',
    borderRight: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    background: '#f8fafc'
  };

  const groupThStyle = {
    ...thStyle,
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#1e293b',
    background: '#eef4f7',
    letterSpacing: '0.03em',
    borderBottom: '1px solid #cbd5e1'
  };

  const tdStyle = {
    padding: '0.25rem 0.2rem',
    textAlign: 'center',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    fontSize: '0.825rem',
    color: '#475569',
    verticalAlign: 'middle'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.4rem 0.3rem',
    border: '1.5px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '0.825rem',
    textAlign: 'center',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    minWidth: '50px',
    height: '34px'
  };

  const lockedCellStyle = {
    ...tdStyle,
    background: '#f1f5f9',
    color: '#64748b',
    fontWeight: 500
  };

  const fmtVal = (v) => (v !== undefined && v !== null && v !== '' && v !== 0) ? v : '-';

  return (
    <>
      {/* Entry save loader overlay */}
    <div
      className="page-wrapper melting-page-wrapper"
      ref={gridRef}
      onKeyDown={(e) => { handleEnterFocusNext(e); handleArrowKeyDown(e); }}
    >
      {/* Header */}
      <div className="cupola-holder-header">
        <div className="cupola-holder-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Cupola Holder Log Sheet - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {primaryData.date ? new Date(primaryData.date).toLocaleDateString('en-GB') : '-'}
        </div>
      </div>

      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="Cupola Holder Log Sheet - Validation Ranges"
        validationRanges={validationRanges}
      />

      {/* Primary Section */}
      <div>
        <h3 className="section-header" style={{ display: 'flex', alignItems: 'center' }}>
          Primary Data
        </h3>

        <div className="cupola-holder-form-grid">
          <div className={`cupola-holder-form-group ${classFor(primaryData.date, primarySubmitted, true)} ${dateErrorHighlight ? 'error-highlight' : ''}`}>
            <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
            <CustomDatePicker
              ref={dateRef}
              value={primaryData.date}
              onChange={(e) => handlePrimaryChange('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterDate(), 'date')}
            />
          </div>

          <div 
            className={`cupola-holder-form-group ${classFor(primaryData.shift, primarySubmitted, true)} ${shiftErrorHighlight ? 'error-highlight' : ''}`}
            onMouseDownCapture={(e) => {
              if (!primaryData.date && e.target.tagName !== 'SELECT') {
                setDateErrorHighlight(true);
              }
            }}
          >
            <label>Shift <span style={{ color: '#ef4444' }}>*</span></label>
            <ShiftDropdown
              ref={shiftRef}
              value={primaryData.shift}
              onChange={(e) => handlePrimaryChange('shift', e.target.value)}
              disabled={!primaryData.date || fetchingPrimary}
              onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterShift(), 'shift')}
              onMouseDown={(e) => {
                if (!primaryData.date) {
                  setDateErrorHighlight(true);
                }
              }}
            />
          </div>

          <div 
            className={`cupola-holder-form-group ${classFor(primaryData.holderNumber, primarySubmitted, true)} ${holderNumberErrorHighlight ? 'error-highlight' : ''}`}
            onMouseDownCapture={(e) => {
              if (e.target.tagName !== 'SELECT') {
                if (!primaryData.date) {
                  setDateErrorHighlight(true);
                } else if (!primaryData.shift) {
                  setShiftErrorHighlight(true);
                }
              }
            }}
          >
            <label>Holder No <span style={{ color: '#ef4444' }}>*</span></label>
            <HolderDropdown
              ref={holderRef}
              value={primaryData.holderNumber}
              onChange={(e) => handlePrimaryChange('holderNumber', e.target.value)}
              disabled={!primaryData.date || !primaryData.shift || fetchingPrimary}
              onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterHolder(), 'holderNumber')}
              onMouseDown={(e) => {
                if (!primaryData.date) {
                  setDateErrorHighlight(true);
                } else if (!primaryData.shift) {
                  setShiftErrorHighlight(true);
                }
              }}
            />
          </div>
        </div>

        {primaryData.date && primaryData.shift && primaryData.holderNumber && (fetchingPrimary || showCombinationFound || showCombinationSaved || !isPrimaryDataSaved) && (
          <div className="cupola-primary-btn-wrapper show">
            <div className="cupola-holder-submit-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: 'none', paddingTop: '0.5rem' }}>
              {fetchingPrimary ? (
                <InlineLoader message="Fetching Primary..." variant="primary" size="medium" />
              ) : showCombinationFound ? (
                <div className={`combination-msg-transition${closingCombinationMsg ? ' combination-msg-closing' : ''}`}>
                  <InlineLoader message="Combination found" variant="success" size="medium" />
                </div>
              ) : showCombinationSaved ? (
                <div className={`combination-msg-transition${closingCombinationMsg ? ' combination-msg-closing' : ''}`}>
                  <InlineLoader message="Combination saved" variant="success" size="medium" />
                </div>
              ) : (
                <button
                  ref={primarySaveButtonRef}
                  className="cupola-holder-submit-btn"
                  type="button"
                  onClick={handlePrimarySubmit}
                  disabled={primaryLoading}
                >
                  {primaryLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={18} /> Save Primary</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Main Log Table */}
      <div style={{ opacity: isPrimaryDataSaved ? 1 : 0.6, pointerEvents: isPrimaryDataSaved ? 'auto' : 'none', transition: 'opacity 0.35s ease' }}>
      {!isPrimaryDataSaved && <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#ef4444', marginBottom: '0.5rem' }}>Locked - Save Primary Data First</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <PlusButton onClick={addInputRow} disabled={!isPrimaryDataSaved} title="Add Row" />
        <MinusButton onClick={removeInputRow} disabled={!isPrimaryDataSaved || inputRows.length <= 1} title="Remove Row" />
      </div>
      <div style={{ overflowX: 'auto', border: '1.5px solid #cbd5e1', borderRadius: '10px', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          {/* Group Headers Row */}
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...groupThStyle, width: '70px', borderLeft: 'none' }}>Heat<br/>No</th>
              <th colSpan={7} style={{ ...groupThStyle }}>ADDITIONS</th>
              <th colSpan={4} style={{ ...groupThStyle }}>TAPPING</th>
              <th colSpan={3} style={{ ...groupThStyle }}>POURING</th>
              <th colSpan={2} style={{ ...groupThStyle }}>ELECTRICAL</th>
              <th rowSpan={2} style={{ ...groupThStyle, width: '120px', borderRight: 'none' }}>Remarks</th>
            </tr>
            {/* Sub Headers Row */}
            <tr>
              <th style={thStyle}>CPC</th>
              <th style={thStyle}>Fe Sl</th>
              <th style={thStyle}>Fe Mn</th>
              <th style={thStyle}>SIC</th>
              <th style={thStyle}>Pure Mg</th>
              <th style={thStyle}>Cu</th>
              <th style={thStyle}>Fe Cr</th>
              <th style={thStyle}>Actual<br/>Time</th>
              <th style={thStyle}>Tapping<br/>Time</th>
              <th style={thStyle}>Temp °C</th>
              <th style={thStyle}>Metal<br/>(KG)</th>
              <th style={{ ...thStyle, minWidth: '150px' }}>DISA<br/>LINE</th>
              <th style={thStyle}>IND<br/>FUR</th>
              <th style={thStyle}>BAIL<br/>NO</th>
              <th style={thStyle}>TAP</th>
              <th style={{ ...thStyle, borderRight: 'none' }}>KW</th>
            </tr>
          </thead>

          <tbody>
            {/* Submitted Rows (read-only) */}
            {submittedRows.map((row, idx) => (
              <tr key={`submitted-${idx}`} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={lockedCellStyle}>{fmtVal(row.heatNo)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.cpc)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.FeSl)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.feMn)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.sic)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.pureMg)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.cu)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.feCr)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.actualTime)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.tappingTime)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.tappingTemp)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.metalKg)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.disaLine)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.indFur)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.bailNo)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.tap)}</td>
                <td style={lockedCellStyle}>{fmtVal(row.kw)}</td>
                <td style={{ ...lockedCellStyle, borderRight: 'none' }}>{fmtVal(row.remarks)}</td>
              </tr>
            ))}

            {/* Active Input Rows */}
            {inputRows.map((row, rowIdx) => (
              <tr key={`input-${rowIdx}`} style={{ background: '#fff' }}>
                {/* Heat No */}
                <td style={{ ...tdStyle, fontWeight: 700, color: '#0ea5e9', fontSize: '0.95rem' }}>
                  {heatNo + rowIdx}
                </td>
                {/* ADDITIONS */}
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('cpc')}
                    value={row.cpc}
                    onChange={(e) => handleRowChange(rowIdx, 'cpc', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'cpc' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'cpc') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('mFeSl')}
                    value={row.mFeSl}
                    onChange={(e) => handleRowChange(rowIdx, 'mFeSl', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'mFeSl' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'mFeSl') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('feMn')}
                    value={row.feMn}
                    onChange={(e) => handleRowChange(rowIdx, 'feMn', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'feMn' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'feMn') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('sic')}
                    value={row.sic}
                    onChange={(e) => handleRowChange(rowIdx, 'sic', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'sic' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'sic') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('pureMg')}
                    value={row.pureMg}
                    onChange={(e) => handleRowChange(rowIdx, 'pureMg', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'pureMg' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'pureMg') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('cu')}
                    value={row.cu}
                    onChange={(e) => handleRowChange(rowIdx, 'cu', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'cu' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'cu') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="0" title={rangeHint('feCr')}
                    value={row.feCr}
                    onChange={(e) => handleRowChange(rowIdx, 'feCr', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'feCr' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'feCr') }} />
                </td>
                {/* TAPPING */}
                <td style={tdStyle}>
                  <CustomTimeInput
                    hasError={hasTimeError(rowIdx, 'actualTimeHour', 'actualTimeMinute')}
                    value={createTimeFromHourMinute(row.actualTimeHour, row.actualTimeMinute)}
                    onChange={(time) => handleTimeChange(rowIdx, 'actualTimeHour', 'actualTimeMinute', time)}
                  />
                </td>
                <td style={tdStyle}>
                  <CustomTimeInput
                    hasError={hasTimeError(rowIdx, 'tappingTimeHour', 'tappingTimeMinute')}
                    value={createTimeFromHourMinute(row.tappingTimeHour, row.tappingTimeMinute)}
                    onChange={(time) => handleTimeChange(rowIdx, 'tappingTimeHour', 'tappingTimeMinute', time)}
                  />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="1500" title={rangeHint('tappingTemp')}
                    value={row.tappingTemp}
                    onChange={(e) => handleRowChange(rowIdx, 'tappingTemp', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'tappingTemp' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'tappingTemp') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="2000" title={rangeHint('metalKg')}
                    value={row.metalKg}
                    onChange={(e) => handleRowChange(rowIdx, 'metalKg', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'metalKg' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'metalKg') }} />
                </td>
                {/* POURING */}
                <td style={tdStyle}>
                  <select
                    value={row.disaLine}
                    onChange={(e) => handleRowChange(rowIdx, 'disaLine', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'disaLine' })}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '14px',
                      border: `2px solid ${getBorderColor(rowIdx, 'disaLine')}`,
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <option value="">Select DISA</option>
                    <option value="DISA 1">DISA 1</option>
                    <option value="DISA 2">DISA 2</option>
                    <option value="DISA 3">DISA 3</option>
                    <option value="DISA 4">DISA 4</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <input type="text" placeholder="IND-1"
                    value={row.indFur} 
                    onChange={(e) => handleRowChange(rowIdx, 'indFur', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'indFur' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'indFur') }} />
                </td>
                <td style={tdStyle}>
                  <input type="text" placeholder="B-001"
                    value={row.bailNo} 
                    onChange={(e) => handleRowChange(rowIdx, 'bailNo', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'bailNo' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'bailNo') }} />
                </td>
                {/* ELECTRICAL */}
                <td style={tdStyle}>
                  <input type="text" placeholder="TAP"
                    value={row.tap} 
                    onChange={(e) => handleRowChange(rowIdx, 'tap', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'tap' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'tap') }} />
                </td>
                <td style={tdStyle}>
                  <input type="number" step="0.1" placeholder="2500" title={rangeHint('kw')}
                    value={row.kw}
                    onChange={(e) => handleRowChange(rowIdx, 'kw', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'kw' })}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, borderColor: getBorderColor(rowIdx, 'kw') }} />
                </td>
                {/* REMARKS */}
                <td style={{ ...tdStyle, borderRight: 'none' }}>
                  <input type="text" placeholder="Remarks"
                    value={row.remarks} 
                    onChange={(e) => handleRowChange(rowIdx, 'remarks', e.target.value)}
                    onFocus={() => setFocusedField({ rowIndex: rowIdx, fieldName: 'remarks' })}
                    onBlur={() => setFocusedField(null)}
                    maxLength={80} 
                    style={{ ...inputStyle, minWidth: '90px', borderColor: getBorderColor(rowIdx, 'remarks') }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="cupola-holder-submit-container" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        {errorMessage && (
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#ef4444', margin: 0 }}>
            {errorMessage}
          </p>
        )}
        <button
          className="cupola-holder-submit-btn"
          type="button"
          onClick={handleAllTablesSubmit}
          disabled={submitLoading || !isPrimaryDataSaved}
          title={!isPrimaryDataSaved ? 'Please save primary data first' : 'Save All Rows'}
        >
          {submitLoading ? (
            <><Loader2 size={20} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={18} /> Save Entry ({inputRows.length} {inputRows.length === 1 ? 'row' : 'rows'})</>
          )}
        </button>
      </div>
      </div>
    </div>
    </>
  );
};

export default CupolaHolderLogSheet;
