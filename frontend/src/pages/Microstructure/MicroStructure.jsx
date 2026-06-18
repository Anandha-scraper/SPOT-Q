import { useState, useRef, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { DisaDropdown, SubmitButton, LockPrimaryButton } from '../../Components/Buttons';
import Sakthi from '../../Components/Sakthi';
import { InlineLoader } from '../../Components/Alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { useMicroStructureContext } from '../../../app.jsx';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/MicroStructure/MicroStructure.css';

const MicroStructure = () => {
  // Info modal hook
  const { isOpen, openModal, closeModal } = useInfoModal();

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // ====================== Validation Ranges ======================
  // Single source of truth for validation. Each rule carries the state `key` it
  // validates (a string for single fields, a [min, max] pair for range fields),
  // so `handleSubmit` can verify the whole form by iterating this array alone.
  const validationRanges = [
    {
      field: 'Date',
      key: 'date',
      required: true,
      type: 'Date',
      pattern: 'DD/MM/YYYY'
    },
    {
      field: 'DISA',
      key: 'disa',
      required: true,
      type: 'Select',
      allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
    },
    {
      field: 'Part Name',
      key: 'partName',
      required: true,
      type: 'Text',
      pattern: 'e.g., Brake Disc'
    },
    {
      field: 'Date Code',
      key: 'dateCode',
      required: true,
      type: 'Text',
      pattern: 'e.g., 3A15'
    },
    {
      field: 'Heat Code',
      key: 'heatCode',
      required: true,
      type: 'Number',
      pattern: 'e.g., 20'
    },
    {
      field: 'Nodularity %',
      key: 'nodularity',
      type: 'Number',
      min: 0,
      unit: '%'
    },
    {
      field: 'Graphite Type',
      key: 'graphiteType',
      type: 'Text'
    },
    // Range fields - combined min/max pairs
    {
      field: 'Count Range',
      key: ['countMin', 'countMax'],
      type: 'NumberRange',
      min: 0,
      unit: 'count'
    },
    {
      field: 'Size Range',
      key: ['sizeMin', 'sizeMax'],
      type: 'NumberRange',
      min: 0,
      unit: 'μm'
    },
    {
      field: 'Ferrite Range %',
      key: ['ferriteMin', 'ferriteMax'],
      type: 'NumberRange',
      min: 0,
      unit: '%'
    },
    {
      field: 'Pearlite Range %',
      key: ['pearliteMin', 'pearliteMax'],
      type: 'NumberRange',
      min: 0,
      unit: '%'
    },
    {
      field: 'Carbide Range %',
      key: ['carbideMin', 'carbideMax'],
      type: 'NumberRange',
      min: 0,
      unit: '%'
    },
    {
      field: 'Remarks',
      key: 'remarks',
      type: 'Text'
    }
  ];

  // ====================== State from Context ======================
  // Get form data and validation states from context to persist across Entry/Report navigation
  const {
    formData,
    setFormData,
    validationStates,
    setValidation,
    resetValidation,
    submitErrorMessage,
    setSubmitErrorMessage,
    isPrimarySaved,
    setIsPrimarySaved,
    entryCount,
    setEntryCount
  } = useMicroStructureContext();

  // Local UI states that don't need to persist
  const [savePrimaryLoading, setSavePrimaryLoading] = useState(false);
  const [checkingPrimary, setCheckingPrimary] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showSakthiLoader, setShowSakthiLoader] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationAdded, setShowCombinationAdded] = useState(false);
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [highlightPrimaryFields, setHighlightPrimaryFields] = useState(false);
  const [primaryErrorMessage, setPrimaryErrorMessage] = useState('');

  // Extract form field values from context for easier access
  const date = formData.date;
  const disa = formData.disa;
  const partName = formData.partName;
  const dateCode = formData.dateCode;
  const heatCode = formData.heatCode;
  const nodularity = formData.nodularity;
  const graphiteType = formData.graphiteType;
  const countMin = formData.countMin;
  const countMax = formData.countMax;
  const sizeMin = formData.sizeMin;
  const sizeMax = formData.sizeMax;
  const ferriteMin = formData.ferriteMin;
  const ferriteMax = formData.ferriteMax;
  const pearliteMin = formData.pearliteMin;
  const pearliteMax = formData.pearliteMax;
  const carbideMin = formData.carbideMin;
  const carbideMax = formData.carbideMax;
  const remarks = formData.remarks;

  // Setters for form fields using context
  const setDate = (value) => setFormData(prev => ({ ...prev, date: value }));
  const setDisa = (value) => setFormData(prev => ({ ...prev, disa: value }));
  const setPartName = (value) => setFormData(prev => ({ ...prev, partName: value }));
  const setDateCode = (value) => setFormData(prev => ({ ...prev, dateCode: value }));
  const setHeatCode = (value) => setFormData(prev => ({ ...prev, heatCode: value }));
  const setNodularity = (value) => setFormData(prev => ({ ...prev, nodularity: value }));
  const setGraphiteType = (value) => setFormData(prev => ({ ...prev, graphiteType: value }));
  const setCountMin = (value) => setFormData(prev => ({ ...prev, countMin: value }));
  const setCountMax = (value) => setFormData(prev => ({ ...prev, countMax: value }));
  const setSizeMin = (value) => setFormData(prev => ({ ...prev, sizeMin: value }));
  const setSizeMax = (value) => setFormData(prev => ({ ...prev, sizeMax: value }));
  const setFerriteMin = (value) => setFormData(prev => ({ ...prev, ferriteMin: value }));
  const setFerriteMax = (value) => setFormData(prev => ({ ...prev, ferriteMax: value }));
  const setPearliteMin = (value) => setFormData(prev => ({ ...prev, pearliteMin: value }));
  const setPearliteMax = (value) => setFormData(prev => ({ ...prev, pearliteMax: value }));
  const setCarbideMin = (value) => setFormData(prev => ({ ...prev, carbideMin: value }));
  const setCarbideMax = (value) => setFormData(prev => ({ ...prev, carbideMax: value }));
  const setRemarks = (value) => setFormData(prev => ({ ...prev, remarks: value }));

  // Extract validation states from context
  const dateValid = validationStates.date;
  const disaValid = validationStates.disa;
  const partNameValid = validationStates.partName;
  const dateCodeValid = validationStates.dateCode;
  const heatCodeValid = validationStates.heatCode;
  const nodularityValid = validationStates.nodularity;
  const graphiteTypeValid = validationStates.graphiteType;
  const countMinValid = validationStates.countMin;
  const countMaxValid = validationStates.countMax;
  const sizeMinValid = validationStates.sizeMin;
  const sizeMaxValid = validationStates.sizeMax;
  const ferriteMinValid = validationStates.ferriteMin;
  const ferriteMaxValid = validationStates.ferriteMax;
  const pearliteMinValid = validationStates.pearliteMin;
  const pearliteMaxValid = validationStates.pearliteMax;
  const carbideMinValid = validationStates.carbideMin;
  const carbideMaxValid = validationStates.carbideMax;
  const remarksValid = validationStates.remarks;

  // ====================== Validation Functions ======================
  /**
   * Validates a single field based on validation rules
   * Handles both single fields and range fields (min/max pairs)
   */
  const validateField = (rule, mappedFields, stateData) => {
    // Handle range fields (arrays)
    if (Array.isArray(mappedFields)) {
      const [minField, maxField] = mappedFields;
      const minValue = stateData[minField];
      const maxValue = stateData[maxField];
      const minInput = inputRefs?.current?.[minField];
      const maxInput = inputRefs?.current?.[maxField];

      // Check if browser considers input intuitively invalid (e.g. typing 'e' in type "number")
      if ((minInput && minInput.validity && minInput.validity.badInput) ||
          (maxInput && maxInput.validity && maxInput.validity.badInput)) {
        return { isValid: false, message: `${rule.field} must contain valid numbers` };
      }

      // For range fields, check if both values exist when required
      if (rule.required) {
        if (!minValue || !maxValue) {
          return { isValid: false, message: `${rule.field} is required` };
        }
      }

      // Validate range values if they exist
      if (minValue && maxValue) {
        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);

        if (isNaN(min) || isNaN(max)) {
          return { isValid: false, message: `${rule.field} must contain valid numbers` };
        }

        if (min >= max) {
          return { isValid: false, message: `${rule.field} minimum must be less than maximum` };
        }

        // Check min/max constraints for range fields
        if (rule.min !== undefined && (min < rule.min || max < rule.min)) {
          return { isValid: false, message: `${rule.field} values must be at least ${rule.min}` };
        }
        if (rule.max !== undefined && (min > rule.max || max > rule.max)) {
          return { isValid: false, message: `${rule.field} values must be no more than ${rule.max}` };
        }
      }

      return { isValid: true };
    }

    // Handle single fields
    const fieldName = mappedFields;
    const value = stateData[fieldName];
    const inputElement = inputRefs?.current?.[fieldName];

    // Check if the browser considers the input intuitively invalid (e.g. 'e' pushed to type "number")
    // This catches invalid strings that are reflected as empty in 'value'
    if (inputElement && inputElement.validity && inputElement.validity.badInput) {
      return { isValid: false, message: `${rule.field} must be a valid ${rule.type.toLowerCase()}` };
    }

    // Check required fields
    if (rule.required) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { isValid: false, message: `${rule.field} is required` };
      }
    }

    // If field is empty and not required, it's valid
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: true };
    }

    // Type-specific validation
    switch (rule.type) {
      case 'Number':
      case 'Integer':
        // Enhanced number validation to catch edge cases that type="number" allows
        const stringValue = String(value).trim();

        // Check for invalid characters that browsers allow in number inputs
        // but aren't valid for our use case
        const invalidNumberPattern = /[eE+]|\..*\.|--|\+\+/; // e, E, +, multiple dots, multiple signs
        if (invalidNumberPattern.test(stringValue)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        // Additional check for values ending with invalid characters
        if (/[eE.+-]$/.test(stringValue)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        // Check min/max constraints
        if (rule.min !== undefined && num < rule.min) {
          return { isValid: false, message: `${rule.field} must be at least ${rule.min}` };
        }
        if (rule.max !== undefined && num > rule.max) {
          return { isValid: false, message: `${rule.field} must be no more than ${rule.max}` };
        }

        // For Integer type, check if it's actually an integer
        if (rule.type === 'Integer' && !Number.isInteger(num)) {
          return { isValid: false, message: `${rule.field} must be a whole number` };
        }
        break;

      case 'Text':
        const textValue = String(value).trim();
        if (textValue === '') {
          return rule.required ? { isValid: false, message: `${rule.field} is required` } : { isValid: true };
        }
        break;

      case 'Select':
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          return { isValid: false, message: `${rule.field} must be one of: ${rule.allowedValues.join(', ')}` };
        }
        break;

      case 'Date':
        // Date validation - assuming value is in YYYY-MM-DD format
        if (rule.required && (!value || value.trim() === '')) {
          return { isValid: false, message: `${rule.field} is required` };
        }
        break;

      default:
        break;
    }

    return { isValid: true };
  };

  // Refs for navigation
  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);

  // Spatial arrow-key navigation across the form grid (↑/↓/←/→ move focus)
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  // Field order for Enter key navigation
  const fieldOrder = [
    'date', 'disa', 'partName', 'dateCode', 'heatCode', 'nodularity', 'graphiteType',
    'countMin', 'countMax', 'sizeMin', 'sizeMax', 'ferriteMin', 'ferriteMax',
    'pearliteMin', 'pearliteMax', 'carbideMin', 'carbideMax', 'remarks'
  ];

  // ====================== Effects ======================

  // Set current date and load previous DISA from database on mount (only if not already set)
  useEffect(() => {
    // Only set date if not already set in context (preserves data when navigating back)
    if (!date) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
    }

    // Fetch last used DISA from database only if not already set
    if (!disa) {
      const fetchLastDisa = async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.microStructure}/last-disa`, {
            method: 'GET',
            credentials: 'include'
          });
          const data = await response.json();
          if (data.success && data.lastDisa) {
            setDisa(data.lastDisa);
          }
        } catch (error) {
          console.error('Error fetching last DISA:', error);
        }
      };
      fetchLastDisa();
    }
  }, []);
  
  // Check if date+disa combination exists in database
  useEffect(() => {
    const checkDateDisaExists = async () => {
      if (!date || !disa) {
        setIsPrimarySaved(false);
        setEntryCount(0);
        setSavePrimaryLoading(false);
        setShowCombinationFound(false);
        setShowCombinationAdded(false);
        return;
      }
      setCheckingPrimary(true);
      try {
        setSavePrimaryLoading(true);
        setShowCombinationFound(false);
        
        const startTime = Date.now();
        
        const response = await fetch(`${API_ENDPOINTS.microStructure}/check?date=${date}&disa=${encodeURIComponent(disa)}`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        
        // Ensure minimum 1 second loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        setSavePrimaryLoading(false);
        
        if (data.success && data.exists) {
          setShowCombinationFound(true);
          
          // Hide "Combination found" message after 1.5 seconds
          setTimeout(() => {
            setShowCombinationFound(false);
            setIsPrimarySaved(true);
            setEntryCount(data.count || 0);
          }, 1500);
        } else {
          // Combination not found, just update states
          setIsPrimarySaved(false);
          setEntryCount(0);
        }
      } catch (error) {
        console.error('Error checking date+disa:', error);
        setSavePrimaryLoading(false);
      }
    };
    checkDateDisaExists();
  }, [date, disa]);
  
  // Add click listeners to all disabled fields to show warning
  useEffect(() => {
    const handleDisabledClick = (e) => {
      const target = e.target;

      // Check if clicked element is a disabled input or select
      if ((target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') && target.disabled) {
        handleDisabledFieldClick(e);
        return;
      }

      // Check if clicked on a label that's associated with a disabled field
      if (target.tagName === 'LABEL') {
        let fieldDiv = target.closest('.microstructure-field');
        if (fieldDiv) {
          const input = fieldDiv.querySelector('input, select, textarea');
          if (input && input.disabled) {
            handleDisabledFieldClick(e);
            return;
          }
        }
      }

      // Check if clicked on microstructure-form-row (the main row container)
      if (target.classList && target.classList.contains('microstructure-form-row') && !isPrimarySaved) {
        handleDisabledFieldClick(e);
        return;
      }

      // Check if clicked on a field div that contains a disabled field
      let fieldDiv = null;
      if (target.classList && target.classList.contains('microstructure-field')) {
        fieldDiv = target;
      } else {
        fieldDiv = target.closest('.microstructure-field');
      }

      if (fieldDiv) {
        const input = fieldDiv.querySelector('input, select, textarea');
        if (input && input.disabled) {
          handleDisabledFieldClick(e);
          return;
        }
      }

      // Handle clicks on any child elements of a field div with disabled fields
      if (!isPrimarySaved) {
        const closestFieldDiv = target.closest('.microstructure-field');
        if (closestFieldDiv) {
          const input = closestFieldDiv.querySelector('input, select, textarea');
          if (input && input.disabled) {
            handleDisabledFieldClick(e);
            return;
          }
        }
      }
    };

    // Add event listener to document to catch all clicks
    document.addEventListener('mousedown', handleDisabledClick, true);

    return () => {
      document.removeEventListener('mousedown', handleDisabledClick, true);
    };
  }, [isPrimarySaved]);

  // ====================== Helpers ======================
  
  const getInputClassName = (baseClass, validationState) => {
    let classes = baseClass;
    if (validationState === false) classes += ' invalid-input';
    return classes;
  };

  // ====================== Handlers ======================
  
  const handleDateChange = (e) => {
    setDate(e.target.value);
    setIsPrimarySaved(false);

    // Reset all form fields except date and disa
    setFormData(prev => ({
      ...prev,
      date: e.target.value,
      partName: '',
      dateCode: '',
      heatCode: '',
      nodularity: '',
      graphiteType: '',
      countMin: '',
      countMax: '',
      sizeMin: '',
      sizeMax: '',
      ferriteMin: '',
      ferriteMax: '',
      pearliteMin: '',
      pearliteMax: '',
      carbideMin: '',
      carbideMax: '',
      remarks: ''
    }));

    // Reset all validation states using context
    resetValidation();
    setSubmitErrorMessage('');
    setPrimaryErrorMessage('');
  };

  const handleDisaChange = (e) => {
    setDisa(e.target.value);
    setIsPrimarySaved(false);

    // Reset all form fields except date and disa
    setFormData(prev => ({
      ...prev,
      disa: e.target.value,
      partName: '',
      dateCode: '',
      heatCode: '',
      nodularity: '',
      graphiteType: '',
      countMin: '',
      countMax: '',
      sizeMin: '',
      sizeMax: '',
      ferriteMin: '',
      ferriteMax: '',
      pearliteMin: '',
      pearliteMax: '',
      carbideMin: '',
      carbideMax: '',
      remarks: ''
    }));

    // Reset all validation states using context
    resetValidation();
    setSubmitErrorMessage('');
    setPrimaryErrorMessage('');
  };

  const handleDisabledFieldClick = (e) => {
    if (!isPrimarySaved) {
      e.preventDefault();
      e.stopPropagation();
      
      // Show warning
      setShowPrimaryWarning(true);
      setHighlightPrimaryFields(true);
      
      // Scroll to primary section
      if (primarySectionRef.current) {
        primarySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Hide warning and remove highlight after 3 seconds
      setTimeout(() => {
        setShowPrimaryWarning(false);
        setHighlightPrimaryFields(false);
      }, 3000);
    }
  };

  const handleInputChange = (setter, fieldKey) => (e) => {
    setter(e.target.value);
    if (fieldKey) setValidation(fieldKey, null);
  };

  const handleDateCodeChange = (e) => {
    setDateCode(e.target.value.toUpperCase());
    setValidation('dateCode', null);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = fieldOrder.indexOf(field);
      
      if (field === 'remarks') {
        inputRefs.current.submitBtn?.focus();
      } else if (idx < fieldOrder.length - 1) {
        const nextField = fieldOrder[idx + 1];
        inputRefs.current[nextField]?.focus();
      }
    }
  };

  const handlePrimarySubmit = async () => {
    // Clear any previous inline error
    setPrimaryErrorMessage('');

    // Validate required fields
    if (!date || !disa) {
      setPrimaryErrorMessage('Enter Date and DISA');
      return;
    }

    // If already processing, don't submit again
    if (savePrimaryLoading || showCombinationFound || showCombinationAdded) {
      return;
    }

    try {
      setSavePrimaryLoading(true);
      
      const startTime = Date.now();
      
      // Call save-primary API to save date+disa and get entry count
      const response = await fetch(`${API_ENDPOINTS.microStructure}/save-primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, disa })
      });

      const rawResponse = await response.text();
      let data = null;
      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch (parseError) {
          throw new Error('Invalid server response');
        }
      } else {
        data = { success: false, message: 'Empty response from server' };
      }
      
      // Ensure minimum 1 second for consistent UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      setSavePrimaryLoading(false);
      
      if (data.success) {
        setShowCombinationAdded(true);
        
        // Hide "Combination Added" message after 1 second
        setTimeout(() => {
          setShowCombinationAdded(false);
          setIsPrimarySaved(true);
          setEntryCount(data.count || 0);
          // Focus on Part Name field after primary is saved
          setTimeout(() => {
            inputRefs.current.partName?.focus();
          }, 100);
        }, 1000);
      } else {
        setPrimaryErrorMessage('Technical error');
      }
    } catch (error) {
      console.error('Error saving primary:', error);
      setSavePrimaryLoading(false);
      setPrimaryErrorMessage('Technical error');
    }
  };

  /*
   * Handle form submission with validation
   * 
   * Validation Flow:
   * 1. Check each required field for empty/invalid values
   * 2. If invalid, set validation state to false (shows red border)
   * 3. If valid, set validation state to null (neutral, no color)
   * 4. If any errors exist, show error message and stop submission
   * 5. On successful submission, reset all validation states to null
   * 
   * ============================================================
   * AUTO-NAVIGATION TO FIRST ERROR PATTERN:
   * ============================================================
   * This pattern ensures the cursor automatically focuses on the 
   * FIRST error field immediately when the user clicks Submit.
   * 
   * HOW IT WORKS:
   * 1. Initialize a tracking variable BEFORE validation loop:
   *    let firstErrorField = null;
   * 
   * 2. In EACH validation check, set firstErrorField ONLY if it's 
   *    still null (this captures only the first error):
   *    if (!formData.fieldName || validation_fails) {
   *      setFieldValid(false);
   *      hasErrors = true;
   *      if (!firstErrorField) firstErrorField = 'fieldName'; // Capture first error
   *    }
   * 
   * 3. AFTER all validations, focus immediately using the tracking variable:
   *    if (hasErrors) {
   *      if (firstErrorField) {
   *        inputRefs.current[firstErrorField]?.focus();
   *      }
   *      return;
   *    }
   * 
   * WHY THIS WORKS ON FIRST CLICK:
   * - Uses a plain variable (not state) to track synchronously
   * - Doesn't depend on state updates (which are async)
   * - Focus happens immediately in the same execution cycle
   * 
   * TO IMPLEMENT IN ANOTHER PAGE:
   * - Add: let firstErrorField = null; at start of submit handler
   * - Add: if (!firstErrorField) firstErrorField = 'refName'; in each validation
   * - Add: if (firstErrorField) inputRefs.current[firstErrorField]?.focus(); before return
   * ============================================================
   */
  const handleSubmit = async () => {
    let hasErrors = false;
    let firstErrorField = null;
    let firstErrorMessage = null;

    // Clear any previous error messages
    setSubmitErrorMessage('');

    // Create state data object for validation
    const stateData = {
      date,
      disa,
      partName,
      dateCode,
      heatCode,
      nodularity,
      graphiteType,
      countMin,
      countMax,
      sizeMin,
      sizeMax,
      ferriteMin,
      ferriteMax,
      pearliteMin,
      pearliteMax,
      carbideMin,
      carbideMax,
      remarks
    };

    // Verify the whole form purely from validationRanges. Each rule's `key` is the
    // state field (string) or [min, max] pair (range) it governs; mark every governed
    // field invalid/neutral via the context setValidation.
    for (const rule of validationRanges) {
      const key = rule.key;
      if (!key) continue;

      const result = validateField(rule, key, stateData);
      const keys = Array.isArray(key) ? key : [key];

      if (!result.isValid) {
        keys.forEach(k => setValidation(k, false));
        hasErrors = true;
        if (!firstErrorField) {
          firstErrorField = keys[0];
          firstErrorMessage = result.message;
        }
      } else {
        keys.forEach(k => setValidation(k, null));
      }
    }

    if (hasErrors) {
      setSubmitErrorMessage(firstErrorMessage || 'Enter data in correct format');

      // AUTO-NAVIGATION: Focus on the first field that failed validation
      if (firstErrorField) {
        inputRefs.current[firstErrorField]?.focus();
      }

      return;
    }

    setSubmitErrorMessage('');

    try {
      setSubmitLoading(true);

      const payload = {
        date,
        disa,
        partName,
        dateCode,
        heatCode,
        nodularity: parseFloat(nodularity),
        graphiteType,
        countMin: parseFloat(countMin),
        countMax: countMax === '' ? 0 : parseFloat(countMax),
        sizeMin: parseFloat(sizeMin),
        sizeMax: sizeMax === '' ? 0 : parseFloat(sizeMax),
        ferriteMin: parseFloat(ferriteMin),
        ferriteMax: ferriteMax === '' ? 0 : parseFloat(ferriteMax),
        pearliteMin: parseFloat(pearliteMin),
        pearliteMax: pearliteMax === '' ? 0 : parseFloat(pearliteMax),
        carbideMin: parseFloat(carbideMin),
        carbideMax: carbideMax === '' ? 0 : parseFloat(carbideMax),
        remarks
      };

      const response = await fetch(`${API_ENDPOINTS.microStructure}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const rawResponse = await response.text();
      let data = null;
      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse);
        } catch (parseError) {
          throw new Error('Invalid server response');
        }
      } else {
        data = { success: false, message: 'Empty response from server' };
      }

      if (data.success) {
        // Show Sakthi loader
        setShowSakthiLoader(true);

        // Reset all fields except primary data
        setPartName('');
        setDateCode('');
        setHeatCode('');
        setNodularity('');
        setGraphiteType('');
        setCountMin('');
        setCountMax('');
        setSizeMin('');
        setSizeMax('');
        setFerriteMin('');
        setFerriteMax('');
        setPearliteMin('');
        setPearliteMax('');
        setCarbideMin('');
        setCarbideMax('');
        setRemarks('');

        // Reset validation states
        resetValidation();

        setSubmitErrorMessage('');
        setEntryCount(prev => prev + 1);

        setTimeout(() => {
          inputRefs.current.partName?.focus();
        }, 100);
      } else {
        setSubmitErrorMessage('Technical error');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setSubmitErrorMessage('Technical error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ====================== Format date ======================
  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // ====================== JSX ======================
  return (
    <>
      {showSakthiLoader && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        }}>
          <Sakthi onComplete={() => setShowSakthiLoader(false)} />
        </div>
      )}
      
      <div className="microstructure-header">
        <div className="microstructure-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Micro Structure - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {date ? formatDisplayDate(date) : '-'}
        </div>
      </div>

      {/* Info Modal */}
      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="Micro Structure - Validation Ranges & Data Entry Flow"
        validationRanges={validationRanges}
      />

      <div ref={gridRef} onKeyDown={handleArrowKeyDown}>
      <div ref={primarySectionRef}>
        <h3 className="microstructure-section-heading">
          Primary Data {isPrimarySaved && <span style={{ fontWeight: 400, fontSize: '0.875rem', color: '#5B9AA9' }}>(Entries: {entryCount})</span>}
        </h3>

        <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
          <div className="microstructure-field" style={{ maxWidth: '10%', position: 'relative', zIndex: 100 }}>
            <label>Ins. Date</label>
            <CustomDatePicker
              ref={el => inputRefs.current.date = el}
              value={date}
              onChange={handleDateChange}
              onKeyDown={e => handleKeyDown(e, 'date')}
              max={getCurrentDate()}
              name="date"
              style={{
                border: (highlightPrimaryFields || dateValid === false) ? '2px solid #ef4444' : '2px solid #cbd5e1',
                width: '100%',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: (highlightPrimaryFields || dateValid === false) ? '#fee2e2' : '#fff',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          <div className="microstructure-field" style={{ maxWidth: '5%' }}>
            <label>DISA</label>
            <DisaDropdown
              ref={el => inputRefs.current.disa = el}
              value={disa}
              onChange={handleDisaChange}
              onKeyDown={e => handleKeyDown(e, 'disa')}
              name="disa"
              style={{
                border: (highlightPrimaryFields || disaValid === false) ? '2px solid #ef4444' : undefined,
                backgroundColor: (highlightPrimaryFields || disaValid === false) ? '#fee2e2' : undefined,
                transition: 'all 0.3s ease'
              }}
            />
            {(savePrimaryLoading || showCombinationFound || showCombinationAdded || showPrimaryWarning || primaryErrorMessage) && (
              <div style={{
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                {savePrimaryLoading && (
                  <InlineLoader 
                    message="Fetching Date, Disa" 
                    size="medium" 
                    variant="primary" 
                  />
                )}
                {showCombinationFound && (
                  <InlineLoader 
                    message="Combination found" 
                    size="medium" 
                    variant="success" 
                  />
                )}
                {showCombinationAdded && (
                  <InlineLoader 
                    message="Combination Added" 
                    size="medium" 
                    variant="success" 
                  />
                )}
                {showPrimaryWarning && (
                  <InlineLoader
                    message="Save Date, Disa"
                    size="medium"
                    variant="danger"
                  />
                )}
                {primaryErrorMessage && (
                  <InlineLoader
                    message={primaryErrorMessage}
                    size="medium"
                    variant="danger"
                  />
                )}
              </div>
            )}
          </div>
          <div className="microstructure-field" style={{ maxWidth: '15%' }}>
            <label>&nbsp;</label>
            <LockPrimaryButton
              onClick={handlePrimarySubmit}
              disabled={savePrimaryLoading || showCombinationFound || showCombinationAdded || !date || !disa || isPrimarySaved}
              isLocked={isPrimarySaved}
            />
          </div>
        </div>
      </div>

      {/* Row 1 — identity + nodularity + graphite type */}
      <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
        <div className="microstructure-field">
          <label>Part Name</label>
          <input
            ref={el => inputRefs.current.partName = el}
            type="text"
            value={partName}
            onChange={handleInputChange(setPartName, 'partName')}
            onKeyDown={e => handleKeyDown(e, 'partName')}
            name="partName"
            placeholder="Enter part name"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', partNameValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Date Code</label>
          <input
            ref={el => inputRefs.current.dateCode = el}
            type="text"
            value={dateCode}
            onChange={handleDateCodeChange}
            onKeyDown={e => handleKeyDown(e, 'dateCode')}
            name="dateCode"
            placeholder="Enter date code"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', dateCodeValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Heat Code</label>
          <input
            ref={el => inputRefs.current.heatCode = el}
            type="text"
            value={heatCode}
            onChange={handleInputChange(setHeatCode, 'heatCode')}
            onKeyDown={e => handleKeyDown(e, 'heatCode')}
            name="heatCode"
            placeholder="Enter heat code"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', heatCodeValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Nodularity %</label>
          <input
            ref={el => inputRefs.current.nodularity = el}
            type="number"
            value={nodularity}
            onChange={handleInputChange(setNodularity, 'nodularity')}
            onKeyDown={e => handleKeyDown(e, 'nodularity')}
            name="nodularity"
            placeholder="0-100"
            min="0"
            max="100"
            step="0.01"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', nodularityValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Graphite Type</label>
          <input
            ref={el => inputRefs.current.graphiteType = el}
            type="text"
            value={graphiteType}
            onChange={handleInputChange(setGraphiteType, 'graphiteType')}
            onKeyDown={e => handleKeyDown(e, 'graphiteType')}
            name="graphiteType"
            placeholder="Enter graphite type"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', graphiteTypeValid)}
          />
        </div>
      </div>

      {/* Row 2 — count, size, ferrite, pearlite, carbide ranges */}
      <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
        <div className="microstructure-field">
          <label>Count (Nos / mm²)</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.countMin = el}
              type="number"
              value={countMin}
              onChange={handleInputChange(setCountMin, 'countMin')}
              onKeyDown={e => handleKeyDown(e, 'countMin')}
              name="countMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', countMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.countMax = el}
              type="number"
              value={countMax}
              onChange={handleInputChange(setCountMax, 'countMax')}
              onKeyDown={e => handleKeyDown(e, 'countMax')}
              name="countMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', countMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Size</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.sizeMin = el}
              type="number"
              value={sizeMin}
              onChange={handleInputChange(setSizeMin, 'sizeMin')}
              onKeyDown={e => handleKeyDown(e, 'sizeMin')}
              name="sizeMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', sizeMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.sizeMax = el}
              type="number"
              value={sizeMax}
              onChange={handleInputChange(setSizeMax, 'sizeMax')}
              onKeyDown={e => handleKeyDown(e, 'sizeMax')}
              name="sizeMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', sizeMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Ferrite %</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.ferriteMin = el}
              type="number"
              value={ferriteMin}
              onChange={handleInputChange(setFerriteMin, 'ferriteMin')}
              onKeyDown={e => handleKeyDown(e, 'ferriteMin')}
              name="ferriteMin"
              placeholder="Min"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', ferriteMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.ferriteMax = el}
              type="number"
              value={ferriteMax}
              onChange={handleInputChange(setFerriteMax, 'ferriteMax')}
              onKeyDown={e => handleKeyDown(e, 'ferriteMax')}
              name="ferriteMax"
              placeholder="Max"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', ferriteMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Pearlite %</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.pearliteMin = el}
              type="number"
              value={pearliteMin}
              onChange={handleInputChange(setPearliteMin, 'pearliteMin')}
              onKeyDown={e => handleKeyDown(e, 'pearliteMin')}
              name="pearliteMin"
              placeholder="Min"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', pearliteMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.pearliteMax = el}
              type="number"
              value={pearliteMax}
              onChange={handleInputChange(setPearliteMax, 'pearliteMax')}
              onKeyDown={e => handleKeyDown(e, 'pearliteMax')}
              name="pearliteMax"
              placeholder="Max"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', pearliteMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Carbide %</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.carbideMin = el}
              type="number"
              value={carbideMin}
              onChange={handleInputChange(setCarbideMin, 'carbideMin')}
              onKeyDown={e => handleKeyDown(e, 'carbideMin')}
              name="carbideMin"
              placeholder="Min"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', carbideMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.carbideMax = el}
              type="number"
              value={carbideMax}
              onChange={handleInputChange(setCarbideMax, 'carbideMax')}
              onKeyDown={e => handleKeyDown(e, 'carbideMax')}
              name="carbideMax"
              placeholder="Max"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', carbideMaxValid)}
            />
          </div>
        </div>
      </div>

      {/* Row 3 — remarks */}
      <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
        <div className="microstructure-field" style={{ flex: '0 0 50%', maxWidth: '50%' }}>
          <label>Remarks *</label>
          <input
            ref={el => inputRefs.current.remarks = el}
            type="text"
            value={remarks}
            onChange={handleInputChange(setRemarks, 'remarks')}
            onKeyDown={e => handleKeyDown(e, 'remarks')}
            name="remarks"
            placeholder="Enter remarks"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', remarksValid)}
          />
        </div>
      </div>
      </div>

      {/* Submit Button Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingRight: '1rem' }}>
        {submitErrorMessage && (
          <div>
            <InlineLoader
              message={submitErrorMessage}
              size="medium"
              variant="danger"
            />
          </div>
        )}
        <div>
          <SubmitButton
            ref={el => inputRefs.current.submitBtn = el}
            onClick={handleSubmit}
            onKeyDown={handleSubmitKeyDown}
            disabled={!isPrimarySaved || submitLoading}
          >
            {submitLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Submit'
          )}
        </SubmitButton>
        </div>
      </div>

    </>
  );
};

export default MicroStructure;
