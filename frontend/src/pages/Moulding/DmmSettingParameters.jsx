import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader2, Lock } from "lucide-react";
import CustomDatePicker from '../../Components/CustomDatePicker';
import { CustomTimeInput, Time, MachineDropdown } from '../../Components/Buttons';
import { API_ENDPOINTS } from '../../config/api';
import { InlineLoader } from '../../Components/InlineLoader';
import { buildSubmitError } from '../../utils/submitError';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import '../../styles/PageStyles/Moulding/DmmSettingParameters.css';

const initialRow = {
  customer: "",
  itemDescription: "",
  time: "",
  ppThickness: "",
  ppHeight: "",
  spThickness: "",
  spHeight: "",
  coreMaskThickness: "",
  coreMaskHeightOutside: "",
  coreMaskHeightInside: "",
  sandShotPressureBar: "",
  correctionShotTime: "",
  squeezePressure: "",
  ppStrippingAcceleration: "",
  ppStrippingDistance: "",
  spStrippingAcceleration: "",
  spStrippingDistance: "",
  mouldThicknessPlus10: "",
  closeUpForceMouldCloseUpPressure: "",
  remarks: "",
};


// Get today's date in YYYY-MM-DD format
const getTodaysDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to create Time object from time string (e.g., "08:30 AM")
const createTimeFromString = (timeStr) => {
  if (!timeStr) return null;
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return new Time(hour, minute);
  } catch {
    return null;
  }
};

// Helper function to convert Time object to string format (e.g., "08:30 AM")
const formatTimeToString = (timeObj) => {
  if (!timeObj) return '';
  let hour = timeObj.hour;
  const minute = timeObj.minute;
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
};

const DmmSettingParameters = () => {
  const navigate = useNavigate();
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();
  const [primaryData, setPrimaryData] = useState({
    date: getTodaysDate(),
    machine: '',
    shift: '',
    operatorName: '',
    operatedBy: ''
  });
  const [currentRow, setCurrentRow] = useState({ ...initialRow });
  const [allSubmitting, setAllSubmitting] = useState(false);

  // Fetch-by-combination states
  const [fetchingPrimary, setFetchingPrimary] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationSaved, setShowCombinationSaved] = useState(false);
  const [closingCombinationMsg, setClosingCombinationMsg] = useState(false);
  const [isPrimaryDataSaved, setIsPrimaryDataSaved] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [lockedFields, setLockedFields] = useState({ operatorName: false });
  const [existingParametersCount, setExistingParametersCount] = useState(0);

  // Form unlocks once primary data is saved or an existing combination is loaded
  const isFormUnlocked = isPrimaryDataSaved || lockedFields.operatorName;

  // Submit feedback message (replaces alert())
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitMessageVariant, setSubmitMessageVariant] = useState('success');
  const submitMessageTimer = useRef(null);


  // ── PART 1: Error highlight states (one per required field) ──
  const [dateErrorHighlight, setDateErrorHighlight] = useState(false);
  const [machineErrorHighlight, setMachineErrorHighlight] = useState(false);
  const [shiftErrorHighlight, setShiftErrorHighlight] = useState(false);

  // Alert message for missing prerequisite
  const [primaryFieldMessage, setPrimaryFieldMessage] = useState('');
  const fieldMessageTimer = useRef(null);

  // Track active dismiss timers so repeated clicks restart the 3s countdown
  const highlightTimers = useRef(new Map());

  // ── PART 3a: triggerHighlight — activates red shake on field(s) ──
  const triggerHighlight = (...setters) => {
    setters.forEach(setter => {
      setter(false);
      requestAnimationFrame(() => setter(true));
      if (highlightTimers.current.has(setter)) {
        clearTimeout(highlightTimers.current.get(setter));
      }
      highlightTimers.current.set(setter, setTimeout(() => {
        setter(false);
        highlightTimers.current.delete(setter);
      }, 3000));
    });
  };

  // ── PART 3c: getMissingFieldMessage — returns user-friendly message for the missing field ──
  const getMissingFieldMessage = () => {
    if (!primaryData.date) return 'Select Date first';
    if (!primaryData.machine) return 'Select Machine first';
    if (!primaryData.shift) return 'Select Shift first';
    return '';
  };

  // ── PART 3d: showFieldMessage — displays the warning message for 3s ──
  const showFieldMessage = () => {
    const msg = getMissingFieldMessage();
    if (!msg) return;
    setPrimaryFieldMessage(msg);
    if (fieldMessageTimer.current) clearTimeout(fieldMessageTimer.current);
    fieldMessageTimer.current = setTimeout(() => {
      setPrimaryFieldMessage('');
      fieldMessageTimer.current = null;
    }, 3000);
  };


  // -- Process-style single lock warning: when the shift-parameter form is
  //    locked, clicking any field shows one message + scrolls to the primary. --
  const showFormLockWarning = useCallback(() => {
    setPrimaryFieldMessage('Save primary data first');
    if (fieldMessageTimer.current) clearTimeout(fieldMessageTimer.current);
    fieldMessageTimer.current = setTimeout(() => { setPrimaryFieldMessage(''); fieldMessageTimer.current = null; }, 3000);
    const wrapper = document.querySelector('.dmm-primary-status-wrapper') || document.querySelector('.primary-section');
    if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Document-level capture listener (Process pattern): catch clicks on the
  // locked shift-parameter form / submit button and show the lock warning.
  useEffect(() => {
    const handleLockedInteraction = (e) => {
      if (isFormUnlocked) return;
      const target = e.target;
      if (!target || !target.closest) return;
      if (target.closest('.dmm-shift-form-grid') || target.closest('.dmm-submit-btn-wrapper')) {
        e.preventDefault();
        e.stopPropagation();
        showFormLockWarning();
      }
    };
    document.addEventListener('mousedown', handleLockedInteraction, true);
    return () => document.removeEventListener('mousedown', handleLockedInteraction, true);
  }, [isFormUnlocked, showFormLockWarning]);


  // ── Helper: show submit feedback message using InlineLoader ──
  const showSubmitMessage = (message, variant = 'success', duration = 3000) => {
    setSubmitMessage(message);
    setSubmitMessageVariant(variant);
    if (submitMessageTimer.current) clearTimeout(submitMessageTimer.current);
    submitMessageTimer.current = setTimeout(() => {
      setSubmitMessage('');
      submitMessageTimer.current = null;
    }, duration);
  };

  // FETCH BY COMBINATION — auto-fetch when date + machine + shift are filled
 
  useEffect(() => {
    if (primaryData.date && primaryData.machine && primaryData.shift) {
      fetchPrimaryData(primaryData.date, primaryData.machine, primaryData.shift);
    } else {
      // Reset when any key field is cleared
      setFetchingPrimary(false);
      setShowCombinationFound(false);
      setShowCombinationSaved(false);
      setClosingCombinationMsg(false);
      setIsPrimaryDataSaved(false);
      setLockedFields({ operatorName: false });
      setExistingParametersCount(0);
    }
  }, [primaryData.date, primaryData.machine, primaryData.shift]);

  // Fetch existing entry for the date+machine+shift combination
  const fetchPrimaryData = async (date, machine, shift) => {
    try {
      setFetchingPrimary(true);
      setShowCombinationFound(false);
      setShowCombinationSaved(false);
      setClosingCombinationMsg(false);
      setSubmitMessage('');

      const startTime = Date.now();

      const response = await fetch(
        `${API_ENDPOINTS.mouldingDmm}/search/primary?date=${date}&machine=${encodeURIComponent(machine)}&shift=${shift}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication required');
          setFetchingPrimary(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const doc = result.data[0];
        const entry = doc.entries && doc.entries[0];

        if (entry) {
          const fetchedOperatorName = entry.operatorName || '';
          const fetchedCheckedBy = entry.checkedBy || '';
          const parametersCount = (entry.parameters && entry.parameters.length) || 0;

          setPrimaryData(prev => ({
            ...prev,
            operatorName: fetchedOperatorName,
            operatedBy: fetchedCheckedBy
          }));

          setLockedFields({
            operatorName: !!fetchedOperatorName
          });

          setExistingParametersCount(parametersCount);

          // Ensure minimum 1s loader time
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise(resolve => setTimeout(resolve, remainingTime));

          setFetchingPrimary(false);

          // Show "Combination found" when entry exists for this date+machine+shift
          setShowCombinationFound(true);
          setClosingCombinationMsg(false);
          setTimeout(() => setClosingCombinationMsg(true), 1600);
          setTimeout(() => { setShowCombinationFound(false); setClosingCombinationMsg(false); }, 2000);
        } else {
          // Entry not found — reset
          resetCombinationState(startTime);
        }
      } else {
        // No data at all — reset
        resetCombinationState(startTime);
      }
    } catch (error) {
      console.error('Error fetching combination:', error);
      setFetchingPrimary(false);
    }
  };

  // Helper to reset combination state when no data found
  const resetCombinationState = async (startTime) => {
    setPrimaryData(prev => ({
      ...prev,
      operatorName: '',
      operatedBy: ''
    }));
    setLockedFields({ operatorName: false });
    setExistingParametersCount(0);
    setIsPrimaryDataSaved(false);

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 1000 - elapsedTime);
    await new Promise(resolve => setTimeout(resolve, remainingTime));

    setFetchingPrimary(false);
  };

  // Save Primary: saves operation info (operatorName + operatedBy) for the combination
  const handlePrimarySubmit = async () => {
    if (!primaryData.date || !primaryData.machine || !primaryData.shift) return;

    setPrimaryLoading(true);
    try {
      const shiftKey = `shift${primaryData.shift}`;
      const opPayload = {
        date: primaryData.date,
        machine: primaryData.machine,
        section: 'operation',
        shifts: {
          [shiftKey]: {
            operatorName: primaryData.operatorName || '',
            checkedBy: primaryData.operatedBy || ''
          }
        }
      };
      const opResp = await fetch(API_ENDPOINTS.mouldingDmm, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(opPayload)
      });
      const opRes = await opResp.json();

      if (opRes.success) {
        setIsPrimaryDataSaved(true);
        setLockedFields({ operatorName: !!primaryData.operatorName });
        setShowCombinationSaved(true);
        setClosingCombinationMsg(false);
        setTimeout(() => setClosingCombinationMsg(true), 1600);
        setTimeout(() => { setShowCombinationSaved(false); setClosingCombinationMsg(false); }, 2000);
      } else {
        showSubmitMessage('Failed to save primary: ' + (opRes.message || 'Unknown error'), 'danger', 5000);
      }
    } catch (err) {
      console.error('Save Primary error:', err);
      showSubmitMessage('Failed to save primary: ' + (err.message || 'Unknown error'), 'danger', 5000);
    } finally {
      setPrimaryLoading(false);
    }
  };
  const [shiftValidationErrors, setShiftValidationErrors] = useState({});
  
  // Refs for submit button and first input
  const shiftSubmitRef = useRef(null);
  const shiftFirstInputRef = useRef(null);
  const ppThicknessRef = useRef(null);

  const getInputClassName = (fieldName) => {
    if (shiftValidationErrors[fieldName] === false) return 'invalid-input';
    return '';
  };

  const handlePrimaryChange = (field, value) => {
    // Clear error highlight + message when field gets a value
    if (field === 'date' && value && value.trim() !== '') {
      setDateErrorHighlight(false);
      setPrimaryFieldMessage('');
    }
    if (field === 'machine' && value && value.trim() !== '') {
      setMachineErrorHighlight(false);
      setPrimaryFieldMessage('');
    }
    if (field === 'shift' && value && value.trim() !== '') {
      setShiftErrorHighlight(false);
      setPrimaryFieldMessage('');
    }

    // If date, machine, or shift is cleared, also clear operator fields + reset combination state
    if (['date', 'machine', 'shift'].includes(field) && (!value || value.trim() === '')) {
      setPrimaryData((prev) => ({
        ...prev,
        [field]: value,
        operatorName: '',
        operatedBy: ''
      }));
      setLockedFields({ operatorName: false });
      setShowCombinationFound(false);
      setShowCombinationSaved(false);
      setClosingCombinationMsg(false);
      setExistingParametersCount(0);
      setSubmitMessage('');
    } else if (['date', 'machine', 'shift'].includes(field)) {
      // Key field changed to a new value — reset combination states (useEffect will re-fetch)
      setPrimaryData((prev) => ({
        ...prev,
        [field]: value,
        operatorName: '',
        operatedBy: ''
      }));
      setLockedFields({ operatorName: false });
      setShowCombinationFound(false);
      setShowCombinationSaved(false);
      setClosingCombinationMsg(false);
      setExistingParametersCount(0);
      setSubmitMessage('');
    } else {
      setPrimaryData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Real-time validation for shift parameter fields
  const validateShiftField = (fieldName, value) => {
    const requiredFields = [
      'customer', 'itemDescription', 'time', 'ppThickness', 'ppHeight',
      'spThickness', 'spHeight', 'coreMaskThickness', 'coreMaskHeightOutside',
      'coreMaskHeightInside', 'sandShotPressureBar', 'correctionShotTime',
      'squeezePressure', 'ppStrippingAcceleration', 'ppStrippingDistance',
      'spStrippingAcceleration', 'spStrippingDistance', 'mouldThicknessPlus10',
      'closeUpForceMouldCloseUpPressure', 'remarks'
    ];
    
    if (!requiredFields.includes(fieldName)) return true;
    
    const isEmpty = value === undefined || value === null || String(value).trim() === '';
    if (isEmpty) return false;
    
    const numericFields = [
      'ppThickness', 'ppHeight', 'spThickness', 'spHeight',
      'coreMaskThickness', 'coreMaskHeightOutside', 'coreMaskHeightInside',
      'sandShotPressureBar', 'correctionShotTime', 'squeezePressure',
      'ppStrippingAcceleration', 'ppStrippingDistance',
      'spStrippingAcceleration', 'spStrippingDistance', 'mouldThicknessPlus10'
    ];
    
    if (numericFields.includes(fieldName)) {
      const num = parseFloat(value);
      if (isNaN(num) || !isFinite(num)) return false;
    }
    
    return true;
  };

  const handleInputChange = (field, value) => {
    setCurrentRow((prev) => ({ ...prev, [field]: value }));
    
    // On typing, always reset to null (neutral)
    setShiftValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Helper function to check if Shift parameters have at least one field with data
  const hasShiftParameterData = () => {
    return (currentRow.customer && currentRow.customer.trim() !== '') ||
           (currentRow.itemDescription && currentRow.itemDescription.trim() !== '') ||
           (currentRow.time && currentRow.time.trim() !== '') ||
           (currentRow.ppThickness && currentRow.ppThickness.toString().trim() !== '') ||
           (currentRow.ppHeight && currentRow.ppHeight.toString().trim() !== '') ||
           (currentRow.spThickness && currentRow.spThickness.toString().trim() !== '') ||
           (currentRow.spHeight && currentRow.spHeight.toString().trim() !== '');
  };

  // Handle Enter key navigation for shift parameter inputs
  const handleShiftKeyDown = (e, fieldName = '') => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const shiftSection = e.target.closest('.dmm-section');
      if (!shiftSection) return;
      
      const allInputs = Array.from(shiftSection.querySelectorAll('input:not([type="button"]):not([disabled]), select:not([disabled])'));
      const inputs = allInputs.filter(el => !el.closest('.custom-time-input-container'));
      const currentIndex = inputs.indexOf(e.target);
      
      if (currentIndex < inputs.length - 1) {
        const currentFormGroup = e.target.closest('.dmm-form-group');
        const nextFormGroup = currentFormGroup?.nextElementSibling;
        if (nextFormGroup) {
          const timeContainer = nextFormGroup.querySelector('.custom-time-input-container');
          if (timeContainer) {
            const hourInput = timeContainer.querySelector('input');
            if (hourInput) {
              hourInput.focus();
              hourInput.select();
            }
            return;
          }
        }
        inputs[currentIndex + 1].focus();
      } else {
        if (shiftSubmitRef.current) {
          shiftSubmitRef.current.focus();
        }
      }
    }
  };

  // Validate entire shift parameter row before saving
  const validateShiftRowBeforeSave = () => {
    const errors = {};
    let hasErrors = false;
    let firstErrorField = null;
    
    const requiredFields = [
      'customer', 'itemDescription', 'time', 'ppThickness', 'ppHeight', 
      'spThickness', 'spHeight', 'coreMaskThickness', 'coreMaskHeightOutside',
      'coreMaskHeightInside', 'sandShotPressureBar', 'correctionShotTime',
      'squeezePressure', 'ppStrippingAcceleration', 'ppStrippingDistance',
      'spStrippingAcceleration', 'spStrippingDistance', 'mouldThicknessPlus10',
      'closeUpForceMouldCloseUpPressure', 'remarks'
    ];
    
    requiredFields.forEach(field => {
      if (!validateShiftField(field, currentRow[field])) {
        errors[field] = false;
        hasErrors = true;
        if (!firstErrorField) firstErrorField = field;
      }
    });
    
    setShiftValidationErrors(errors);
    
    if (hasErrors) {
        if (firstErrorField) {
        const shiftSection = document.querySelector('.dmm-shift-form-grid');
        if (shiftSection) {
          setTimeout(() => {
            const errorInput = shiftSection.querySelector('.invalid-input');
            if (errorInput) errorInput.focus();
          }, 50);
        }
      }
    } else {
      }
    
    return !hasErrors;
  };

  // Handle Enter key on submit button
  const handleSubmitButtonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAll();
    }
  };

  // Submit All: saves operation info + shift parameters in one go
  const handleSubmitAll = async () => {
    // Validate primary fields with shake animation
    if (!primaryData.date || !primaryData.machine || !primaryData.shift) {
      const missingSetters = [];
      if (!primaryData.date) missingSetters.push(setDateErrorHighlight);
      if (!primaryData.machine) missingSetters.push(setMachineErrorHighlight);
      if (!primaryData.shift) missingSetters.push(setShiftErrorHighlight);
      triggerHighlight(...missingSetters);
      showFieldMessage();
      return;
    }

    // Validate shift parameters
    if (!validateShiftRowBeforeSave()) return;

    const startTime = Date.now();
    const MIN_LOADER_DURATION = 1500;
    setAllSubmitting(true);
    try {
      const shiftKey = `shift${primaryData.shift}`;

      // 1) Save operation info for selected shift
      const opPayload = {
        date: primaryData.date,
        machine: primaryData.machine,
        section: 'operation',
        shifts: {
          [shiftKey]: {
            operatorName: primaryData.operatorName || '',
            checkedBy: primaryData.operatedBy || ''
          }
        }
      };
      const opResp = await fetch(API_ENDPOINTS.mouldingDmm, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(opPayload)
      });
      const opRes = await opResp.json();
      
      if (!opRes.success) throw new Error(opRes.message || 'Failed to save operation');

      // 2) Save parameters row
      if (hasShiftParameterData()) {
        const rowForSave = { ...currentRow };

        const paramsPayload = {
          date: primaryData.date,
          machine: primaryData.machine,
          section: shiftKey,
          parameters: {
            [shiftKey]: rowForSave
          }
        };
        const paramsResp = await fetch(API_ENDPOINTS.mouldingDmm, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(paramsPayload)
        });
        const paramsRes = await paramsResp.json();
        
        if (!paramsRes.success) throw new Error(paramsRes.message || 'Failed to save parameters');
      }
      
      // Ensure minimum loader display time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADER_DURATION - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      setCurrentRow({ ...initialRow });
      setShiftValidationErrors({});

      // Show success message via InlineLoader
      showSubmitMessage('Entry saved successfully', 'success', 3000);

      // Re-fetch combination to update locked fields & parameters count
      await fetchPrimaryData(primaryData.date, primaryData.machine, primaryData.shift);

      setTimeout(() => {
        if (shiftFirstInputRef.current) {
          shiftFirstInputRef.current.focus();
        }
      }, 100);
    } catch (err) {
      console.error('Save All error:', err);
      showSubmitMessage(
        buildSubmitError(err.response?.data),
        'danger',
        5000
      );
    } finally {
      setAllSubmitting(false);
    }
  };

  const renderRow = () => {
    // Per-input lock (Process pattern): every field is natively disabled until
    // the primary data is saved / an existing combination is loaded.
    const fieldsDisabled = !primaryData.date || !primaryData.machine || !primaryData.shift || fetchingPrimary || !isFormUnlocked;

    return (
    <div className="dmm-form-grid dmm-shift-form-grid">
      <div className="dmm-form-group full-width">
        <label>Customer</label>
        <input
          type="text"
          ref={shiftFirstInputRef}
          value={currentRow.customer}
          onChange={(e) => handleInputChange("customer", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., ABC Industries"
          disabled={fieldsDisabled}
          className={getInputClassName('customer')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Item Description</label>
        <input
          type="text"
          value={currentRow.itemDescription}
          onChange={(e) => handleInputChange("itemDescription", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., Engine Block Casting"
          disabled={fieldsDisabled}
          className={getInputClassName('itemDescription')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Time</label>
        <CustomTimeInput
          value={createTimeFromString(currentRow.time)}
          onChange={(timeObj) => handleInputChange("time", formatTimeToString(timeObj))}
          disabled={fieldsDisabled}
          hasError={shiftValidationErrors['time'] === false}
          onEnterPress={() => {
            if (ppThicknessRef.current) {
              ppThicknessRef.current.focus();
            }
          }}
          style={{
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
      </div>
      <div className="dmm-form-group">
        <label>PP Thickness (mm)</label>
        <input
          type="number"
          ref={ppThicknessRef}
          value={currentRow.ppThickness}
          onChange={(e) => handleInputChange("ppThickness", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 25.5"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('ppThickness')}
        />
      </div>
      <div className="dmm-form-group">
        <label>PP Height (mm)</label>
        <input
          type="number"
          value={currentRow.ppHeight}
          onChange={(e) => handleInputChange("ppHeight", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 150.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('ppHeight')}
        />
      </div>
      <div className="dmm-form-group">
        <label>SP Thickness (mm)</label>
        <input
          type="number"
          value={currentRow.spThickness}
          onChange={(e) => handleInputChange("spThickness", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 30.2"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('spThickness')}
        />
      </div>
      <div className="dmm-form-group">
        <label>SP Height (mm)</label>
        <input
          type="number"
          value={currentRow.spHeight}
          onChange={(e) => handleInputChange("spHeight", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 180.5"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('spHeight')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Core Mask Thickness (mm)</label>
        <input
          type="number"
          value={currentRow.coreMaskThickness}
          onChange={(e) => handleInputChange("coreMaskThickness", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 12.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('coreMaskThickness')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Core Mask Height Outside (mm)</label>
        <input
          type="number"
          value={currentRow.coreMaskHeightOutside}
          onChange={(e) => handleInputChange("coreMaskHeightOutside", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 95.5"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('coreMaskHeightOutside')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Core Mask Height Inside (mm)</label>
        <input
          type="number"
          value={currentRow.coreMaskHeightInside}
          onChange={(e) => handleInputChange("coreMaskHeightInside", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 85.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('coreMaskHeightInside')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Sand Shot Pressure (Bar)</label>
        <input
          type="number"
          value={currentRow.sandShotPressureBar}
          onChange={(e) => handleInputChange("sandShotPressureBar", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 6.5"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('sandShotPressureBar')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Correction Shot Time (s)</label>
        <input
          type="number"
          value={currentRow.correctionShotTime}
          onChange={(e) => handleInputChange("correctionShotTime", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 2.5"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('correctionShotTime')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Squeeze Pressure (Kg/cm²)</label>
        <input
          type="number"
          value={currentRow.squeezePressure}
          onChange={(e) => handleInputChange("squeezePressure", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 45.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('squeezePressure')}
        />
      </div>
      <div className="dmm-form-group">
        <label>PP Stripping Acceleration</label>
        <input
          type="number"
          value={currentRow.ppStrippingAcceleration}
          onChange={(e) => handleInputChange("ppStrippingAcceleration", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 3.2"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('ppStrippingAcceleration')}
        />
      </div>
      <div className="dmm-form-group">
        <label>PP Stripping Distance</label>
        <input
          type="number"
          value={currentRow.ppStrippingDistance}
          onChange={(e) => handleInputChange("ppStrippingDistance", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 120.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('ppStrippingDistance')}
        />
      </div>
      <div className="dmm-form-group">
        <label>SP Stripping Acceleration</label>
        <input
          type="number"
          value={currentRow.spStrippingAcceleration}
          onChange={(e) => handleInputChange("spStrippingAcceleration", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 2.8"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('spStrippingAcceleration')}
        />
      </div>
      <div className="dmm-form-group">
        <label>SP Stripping Distance</label>
        <input
          type="number"
          value={currentRow.spStrippingDistance}
          onChange={(e) => handleInputChange("spStrippingDistance", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 140.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('spStrippingDistance')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Mould Thickness ±10mm</label>
        <input
          type="number"
          value={currentRow.mouldThicknessPlus10}
          onChange={(e) => handleInputChange("mouldThicknessPlus10", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 250.0"
          step="any"
          disabled={fieldsDisabled}
          className={getInputClassName('mouldThicknessPlus10')}
        />
      </div>
      <div className="dmm-form-group">
        <label>
          <span>Close-Up Force / Pressure</span>
        </label>
        <input
          type="text"
          value={currentRow.closeUpForceMouldCloseUpPressure}
          onChange={(e) => handleInputChange("closeUpForceMouldCloseUpPressure", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., 800 kN / 55 bar"
          disabled={fieldsDisabled}
          className={getInputClassName('closeUpForceMouldCloseUpPressure')}
        />
      </div>
      <div className="dmm-form-group">
        <label>Remarks</label>
        <input
          type="text"
          value={currentRow.remarks}
          onChange={(e) => handleInputChange("remarks", e.target.value)}
          onKeyDown={handleShiftKeyDown}
          placeholder="e.g., All parameters OK"
          maxLength={60}
          disabled={fieldsDisabled}
          className={getInputClassName('remarks')}
          style={{ resize: 'none' }}
        />
      </div>
    </div>
    );
  };

  return (
    <div className="page-wrapper moulding-page-wrapper" ref={gridRef} onKeyDown={handleArrowKeyDown}>
      {/* Header */}
      <div className="dmm-header">
        <div className="dmm-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            DMM Setting Parameters Check Sheet
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {primaryData.date ? (() => {
            const [y, m, d] = primaryData.date.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      <form>
        {/* Primary Information Section */}
        <div className="dmm-section primary-section">
          <div className="primary-header-container">
            <h3 className="primary-section-title">PRIMARY</h3>
          </div>
          {/* Primary Data Fields */}
          <div className="primary-fields-row">
            <div className={`dmm-form-group ${dateErrorHighlight ? 'dmm-error-highlight' : ''}`}>
              <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
              <CustomDatePicker
                id="date-field"
                name="date"
                value={primaryData.date}
                onChange={(e) => handlePrimaryChange('date', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (primaryData.date && primaryData.date.trim() !== '') {
                      document.getElementById('machine-field')?.focus();
                    }
                  }
                }}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div 
              className={`dmm-form-group ${machineErrorHighlight ? 'dmm-error-highlight' : ''}`}
              onMouseDownCapture={(e) => {
                if (!primaryData.date) {
                  triggerHighlight(setDateErrorHighlight);
                  showFieldMessage();
                }
              }}
            >
              <label>Machine <span style={{ color: '#ef4444' }}>*</span></label>
              <MachineDropdown
                id="machine-field"
                value={primaryData.machine}
                onChange={(e) => handlePrimaryChange("machine", e.target.value)}
                disabled={!primaryData.date}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (primaryData.machine && primaryData.machine.trim() !== '') {
                      document.getElementById('shift-field')?.focus();
                    }
                  }
                }}
                className=""
              />
            </div>
              <div
                className={`dmm-form-group ${shiftErrorHighlight ? 'dmm-error-highlight' : ''}`}
              >
                <label>Shift <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  id="shift-field"
                  value={primaryData.shift}
                  onChange={(e) => {
                    handlePrimaryChange("shift", e.target.value);
                  }}
                  disabled={!primaryData.date || !primaryData.machine}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (primaryData.shift && primaryData.shift.trim() !== '') {
                        document.getElementById('operatorName-field')?.focus();
                      }
                    }
                  }}
                  required
                >
                  <option value="">Select Shift</option>
                  <option value="1">Shift 1</option>
                  <option value="2">Shift 2</option>
                  <option value="3">Shift 3</option>
                </select>
              </div>
          </div>

          {/* Operator Fields Row */}
          <div className="primary-fields-row" style={{ marginTop: '1rem' }}>
              <div className="dmm-form-group">
                <label>Operator Name</label>
                <input
                  id="operatorName-field"
                  type="text"
                  value={primaryData.operatorName}
                  onChange={(e) => handlePrimaryChange("operatorName", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (primaryData.operatorName && primaryData.operatorName.trim() !== '') {
                        document.getElementById('operatedBy-field')?.focus();
                      }
                    }
                  }}
                  disabled={!primaryData.date || !primaryData.machine || !primaryData.shift || lockedFields.operatorName || fetchingPrimary}
                  placeholder="Enter operator name"
                  style={lockedFields.operatorName ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                />
              </div>
              <div className="dmm-form-group">
                <label>Operated By</label>
                <input
                  id="operatedBy-field"
                  type="text"
                  value={primaryData.operatedBy}
                  onChange={(e) => handlePrimaryChange("operatedBy", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (shiftFirstInputRef.current) {
                        shiftFirstInputRef.current.focus();
                      }
                    }
                  }}
                  disabled={!primaryData.date || !primaryData.machine || !primaryData.shift || fetchingPrimary}
                  placeholder="Enter name"
                />
              </div>
          </div>

          {/* Primary status area: fetching ? combination found/saved ? Save Primary button */}
          {primaryData.date && primaryData.machine && primaryData.shift && (
            <div className={`dmm-primary-status-wrapper${fetchingPrimary || showCombinationFound || showCombinationSaved ? ' show' : ''}`}>
              {fetchingPrimary ? (
                <InlineLoader message="Fetching combination..." variant="primary" size="medium" />
              ) : showCombinationFound ? (
                <div className={`dmm-combination-msg-transition${closingCombinationMsg ? ' dmm-combination-msg-closing' : ''}`}>
                  <InlineLoader message="Combination found" variant="success" size="medium" />
                </div>
              ) : showCombinationSaved ? (
                <div className={`dmm-combination-msg-transition${closingCombinationMsg ? ' dmm-combination-msg-closing' : ''}`}>
                  <InlineLoader message="Combination saved" variant="success" size="medium" />
                </div>
              ) : null}
            </div>
          )}

          {/* Save Primary button — appears when user types in operator name or operated by */}
          {primaryData.date && primaryData.machine && primaryData.shift && !isPrimaryDataSaved && !fetchingPrimary && !showCombinationFound && !showCombinationSaved && (
            <div className={`dmm-save-primary-btn-wrapper${(primaryData.operatorName || primaryData.operatedBy) ? ' show' : ''}`}>
              <button
                className="dmm-submit-btn"
                type="button"
                onClick={handlePrimarySubmit}
                disabled={primaryLoading}
                style={{ opacity: primaryLoading ? 0.6 : 1, cursor: primaryLoading ? 'not-allowed' : 'pointer' }}
              >
                {primaryLoading ? (
                  <><Loader2 size={16} className="spinner" /> Saving...</>
                ) : (
                  <><Save size={18} /> Save Primary</>
                )}
              </button>
            </div>
          )}

          {/* Warning / submit feedback messages */}
          {primaryFieldMessage && !fetchingPrimary && !showCombinationFound && (
            <div style={{ marginTop: '0.75rem' }}>
              <InlineLoader 
                message={primaryFieldMessage} 
                size="medium" 
                variant="warning" 
              />
            </div>
          )}
          {submitMessage && !fetchingPrimary && !showCombinationFound && !primaryFieldMessage && (
            <div style={{ marginTop: '0.75rem' }}>
              <InlineLoader 
                message={submitMessage} 
                size="medium" 
                variant={submitMessageVariant} 
              />
            </div>
          )}
        </div>
        {/* Divider line to separate primary data from other inputs */}
        <div style={{ width: '100%', marginTop: '0.25rem', marginBottom: '2px', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}></div>
        {/* Shift Parameters Section */}
        <div className="dmm-section">
            <h3 className="dmm-section-title">
              DMM Shift Parameters Information 
              {primaryData.machine && primaryData.shift && (
                <span style={{ fontWeight: 400, color: '#64748b' }}>
                  {`- Machine: ${primaryData.machine}, Shift: ${primaryData.shift}`}
                </span>
              )}
            </h3>
            {renderRow()}
            <div className="dmm-section-submit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            </div>
          </div>
        </form>

        {/* Submit Entry button � visible only after combination check completes */}
        <div className={`dmm-submit-btn-wrapper${!fetchingPrimary && !showCombinationFound && !showCombinationSaved ? ' show' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              ref={shiftSubmitRef}
              onClick={handleSubmitAll}
              onKeyDown={handleSubmitButtonKeyDown}
              disabled={!isFormUnlocked || allSubmitting || fetchingPrimary}
              className="dmm-submit-btn"
            >
              {allSubmitting ? <Loader2 size={18} className="spinner" /> : (!isFormUnlocked ? <Lock size={18} /> : <Save size={18} />)}
              {allSubmitting ? 'Saving...' : 'Submit Entry'}
            </button>
          </div>
        </div>
    </div>
  );
};

export default DmmSettingParameters;
