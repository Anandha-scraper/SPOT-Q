import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Save, Plus, X } from "lucide-react";
import CustomDatePicker from "../../Components/CustomDatePicker";
import { CustomTimeInput, Time, PlusButton, MinusButton, SubmitButton, ShiftDropdown, LockPrimaryButton } from "../../Components/Buttons";
import { InlineLoader } from '../../Components/InlineLoader';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from "../../config/api";
import { useArrowNavigation } from "../../utils/arrowNavigation";
import "../../styles/PageStyles/Moulding/DisamaticProduct.css";

// Local Date components, not toISOString() — that converts to UTC first and
// returns yesterday's date for any local time before 5:30 AM IST.
const getTodaysDateLocal = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const initialFormData = {
  date: getTodaysDateLocal(),
  shift: "",
  incharge: "",
  ppOperator: "",
  members: [""],
  productionTable: [{ counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }],
  nextShiftPlanTable: [{ componentName: "", plannedMoulds: "", remarks: "" }],
  delaysTable: [{ delays: "", durationMinutes: [""], fromTime: [""], toTime: [""] }],
  mouldHardnessTable: [{ componentName: "", mpPP: [""], mpSP: [""], bsPP: [""], bsSP: [""], remarks: "" }],
  patternTempTable: [{ item: "", pp: "", sp: "" }],
  significantEvent: "",
  maintenance: "",
  supervisorName: "",
};

// Helper function to create Time object from time string (e.g., "08:30 AM" or "08:30")
const createTimeFromString = (timeStr) => {
  if (!timeStr) return null;
  try {
    // Check if it has AM/PM
    const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
      let hour = parseInt(ampmMatch[1], 10);
      const minute = parseInt(ampmMatch[2], 10);
      const period = ampmMatch[3].toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return new Time(hour, minute);
    }
    // 24-hour format
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1], 10);
      const minute = parseInt(timeMatch[2], 10);
      return new Time(hour, minute);
    }
    return null;
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

// Rules live in src/deviations/ with every other department's; re-exported here
// so existing importers of this module keep resolving.
import {
  validationRanges,
  productionFieldMapping,
  nextShiftPlanFieldMapping,
  delaysFieldMapping,
  mouldHardnessFieldMapping,
  patternTempFieldMapping,
} from '../../deviations/DdisamaticProduct';
import { runValidation, MESSAGE_REQUIRED } from '../../utils/formValidation';

export { validationRanges };

// Shown instead of "Fill required fields" when a table's Save is clicked with
// every row completely untouched — flagging every field on a row the user
// never started as "required" reads as a validation error when it's really
// just nothing to submit yet.
const MESSAGE_NOTHING_TO_SAVE = 'Nothing to save';

// One row at a time (DdisamaticProduct.js's fieldMapping is split per table
// section, not one flat map — see its header comment), following the same
// runValidation engine Process.jsx drives from Dprocess.js. Returns per-row
// field errors in the same { [rowIndex]: { [fieldKey]: true } } shape the
// existing *Errors state/rendering already expects. `fieldPrefix` matches
// each section's own `data-field="${index}-<prefix>-<field>"` naming (blank
// for Production, which has no prefix) so focus-on-error still resolves.
const validateSectionRows = (fieldMapping, rows, hasRowData, fieldPrefix = '') => {
  const dataField = (index, key) => `${index}-${fieldPrefix ? `${fieldPrefix}-` : ''}${key}`;
  const errors = {};
  let hasAnyData = false;
  let firstErrorField = null;
  let message = '';

  rows.forEach((row, index) => {
    if (!hasRowData(row)) return;
    hasAnyData = true;
    const result = runValidation({ validationRanges, fieldMapping, formData: row, inputRefs: null });
    if (!result.ok) {
      const rowErrors = {};
      Object.entries(result.fieldStates).forEach(([key, state]) => { if (state === false) rowErrors[key] = true; });
      errors[index] = rowErrors;
      if (!firstErrorField) { firstErrorField = dataField(index, result.firstErrorField); message = result.message; }
    }
  });

  if (!hasAnyData) {
    return { errors: {}, hasErrors: false, firstErrorField: null, message: '', nothingToSave: true };
  }

  return { errors, hasErrors: Object.keys(errors).length > 0, firstErrorField, message, nothingToSave: false };
};

const DisamaticProduct = () => {
  const { isOpen: isInfoOpen, openModal: openInfoModal, closeModal: closeInfoModal } = useInfoModal();
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const [formData, setFormData] = useState(initialFormData);
  const [isPrimaryDataSaved, setIsPrimaryDataSaved] = useState(false);
  // Snapshot of incharge/ppOperator/members as of the last successful fetch/save,
  // so the Update Primary button can tell "saved before" from "actually changed
  // since then" instead of staying permanently clickable once anything is saved.
  const [savedPrimarySnapshot, setSavedPrimarySnapshot] = useState({ incharge: '', ppOperator: '', members: [] });
  const [lockedFields, setLockedFields] = useState({
    incharge: false,
    ppOperator: false
  });
  const [lockedMembersCount, setLockedMembersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [savePrimaryLoading, setSavePrimaryLoading] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationAdded, setShowCombinationAdded] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [productionErrors, setProductionErrors] = useState({});
  const [nextShiftPlanErrors, setNextShiftPlanErrors] = useState({});
  const [delaysErrors, setDelaysErrors] = useState({});
  const [mouldHardnessErrors, setMouldHardnessErrors] = useState({});
  const [patternTempErrors, setPatternTempErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  // Component Name autocomplete (last 90 days) — Process.jsx's Part Name
  // pattern, adapted for multi-row tables: one fetched-once-on-mount list per
  // table, with the "open dropdown" tracked per row instead of one global flag.
  // Rendered via a portal (dropdownAnchor) rather than position:absolute,
  // since every table sits inside an overflowX:auto wrapper that would
  // otherwise clip it — same reasoning as EntryActions.jsx's tooltip.
  const [componentSuggestions, setComponentSuggestions] = useState({ production: [], nextShiftPlan: [], mouldHardness: [], patternTemp: [] });
  const [openComponentDropdown, setOpenComponentDropdown] = useState(null); // { table, index } | null
  const [filteredComponentSuggestions, setFilteredComponentSuggestions] = useState([]);
  const [dropdownAnchor, setDropdownAnchor] = useState(null); // { left, top, width } in viewport coordinates
  const [nextSNo, setNextSNo] = useState(1);
  const [nextShiftPlanSNo, setNextShiftPlanSNo] = useState(1);
  const [delaysSNo, setDelaysSNo] = useState(1);
  const [mouldHardnessSNo, setMouldHardnessSNo] = useState(1);
  const [patternTempSNo, setPatternTempSNo] = useState(1);
  const [isEventsSaved, setIsEventsSaved] = useState(false);
  const [lockedEventsFields, setLockedEventsFields] = useState({
    significantEvent: false,
    maintenance: false,
    supervisorName: false
  });
  const [primarySubmitError, setPrimarySubmitError] = useState('');
  const [delaysSubmitError, setDelaysSubmitError] = useState('');
  const [mouldHardnessSubmitError, setMouldHardnessSubmitError] = useState('');
  const [productionSubmitError, setProductionSubmitError] = useState('');
  const [nextShiftPlanSubmitError, setNextShiftPlanSubmitError] = useState('');
  const [patternTempSubmitError, setPatternTempSubmitError] = useState('');
  const [eventsSubmitError, setEventsSubmitError] = useState('');
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);

  // Success alert states
  const [productionSuccess, setProductionSuccess] = useState(false);
  const [nextShiftPlanSuccess, setNextShiftPlanSuccess] = useState(false);
  const [delaysSuccess, setDelaysSuccess] = useState(false);
  const [mouldHardnessSuccess, setMouldHardnessSuccess] = useState(false);
  const [patternTempSuccess, setPatternTempSuccess] = useState(false);
  const [eventsSuccess, setEventsSuccess] = useState(false);

  // Sequential validation highlighting
  const [dateErrorHighlight, setDateErrorHighlight] = useState(false);
  const [shiftErrorHighlight, setShiftErrorHighlight] = useState(false);
  const [inchargeErrorHighlight, setInchargeErrorHighlight] = useState(false);
  const [ppOperatorErrorHighlight, setPpOperatorErrorHighlight] = useState(false);
  const [membersErrorHighlight, setMembersErrorHighlight] = useState(false);

  // Null-based validation states (null = neutral, false = invalid)
  const [dateValid, setDateValid] = useState(null);
  const [shiftValid, setShiftValid] = useState(null);

  // Refs for navigation
  const dateRef = useRef(null);
  const shiftRef = useRef(null);
  const inchargeRef = useRef(null);
  const ppOperatorRef = useRef(null);
  const primarySaveButtonRef = useRef(null);
  const primarySectionRef = useRef(null);
  const lockedWarningTimerRef = useRef(null);

  // Document-level capture listener (Process pattern): while primary data is
  // not saved, a click anywhere in a locked section (disabled inputs have
  // pointer-events:none so the click passes through) shows one warning +
  // scrolls to the primary section. Replaces the per-section onMouseDownCapture.
  useEffect(() => {
    const handleLockedInteraction = (e) => {
      if (isPrimaryDataSaved) return;
      const target = e.target;
      if (target && target.closest && target.closest('.disamatic-section')) {
        e.preventDefault();
        e.stopPropagation();
        setShowPrimaryWarning(true);
        if (primarySectionRef.current) {
          primarySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (lockedWarningTimerRef.current) clearTimeout(lockedWarningTimerRef.current);
        lockedWarningTimerRef.current = setTimeout(() => setShowPrimaryWarning(false), 3000);
      }
    };
    document.addEventListener('mousedown', handleLockedInteraction, true);
    return () => document.removeEventListener('mousedown', handleLockedInteraction, true);
  }, [isPrimaryDataSaved]);

  // Helper function for null-based validation classes (null = neutral, false = error)
  const getValidationClass = (validationState) => {
    if (validationState === false) return 'disa-error-outline';
    return '';
  };

  // Handle Enter/Tab key navigation for primary section — date/shift/incharge/ppOperator
  // are all non-numeric (date picker, dropdown, free-text names), so no numeric
  // keystroke guard belongs here.
  const handlePrimaryKeyDown = (e, nextRef) => {
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
    if (formData.date) return shiftRef;
    return dateRef; // Stay on date if not filled
  };

  // Get next available field after shift
  const getNextAfterShift = () => {
    if (formData.date && formData.shift) {
      if (!lockedFields.incharge) return inchargeRef;
      if (!lockedFields.ppOperator) return ppOperatorRef;
      return primarySaveButtonRef;
    }
    if (!formData.date) return dateRef;
    return shiftRef; // Stay on shift if not filled
  };

  // Get next available field after incharge
  const getNextAfterIncharge = () => {
    if (!lockedFields.ppOperator) return ppOperatorRef;
    return primarySaveButtonRef;
  };

  // Get next available field after ppOperator — the first enabled member
  // input, so the user can start typing a member name right away; falls back
  // to Save if no member input is currently enabled.
  const getNextAfterPpOperator = () => {
    const firstMemberInput = document.querySelector('.disamatic-members-container .disamatic-member-input:not(:disabled)');
    return { current: firstMemberInput || primarySaveButtonRef.current };
  };

  // On mount, fetch today's entries and auto-select the last entered shift
  useEffect(() => {
    const fetchLastShift = async () => {
      try {
        const today = formData.date;
        const response = await fetch(`${API_ENDPOINTS.mouldingDisa}/by-date?date=${today}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const lastShift = data.data[data.data.length - 1].shift;
            if (lastShift) {
              setFormData(prev => ({ ...prev, shift: lastShift }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching last shift:', err);
      }
    };
    fetchLastShift();
  }, []);

  // Component Name suggestions — fetched on mount per table (not
  // per-keystroke), matching Process.jsx's Part Name pattern, and re-fetched
  // after each successful save so a value entered this session shows up as a
  // suggestion immediately instead of only after a page reload.
  const fetchComponentNames = (table) => {
    // Pattern Temp's suggestion source is a different column ('item', not
    // componentName), so it has its own single-field endpoint.
    const url = table === 'patternTemp'
      ? `${API_ENDPOINTS.mouldingDisa}/pattern-temp-items`
      : `${API_ENDPOINTS.mouldingDisa}/component-names/${table}`;
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setComponentSuggestions(prev => ({ ...prev, [table]: data.data })); })
      .catch(() => {});
  };

  useEffect(() => {
    ['production', 'nextShiftPlan', 'mouldHardness', 'patternTemp'].forEach(fetchComponentNames);
  }, []);

  // Click-outside closes whichever row's dropdown is open — same intent as
  // Process.jsx's partNameDropdownRef effect, but class-based since the
  // dropdown is now portaled to <body> (outside any row's own wrapper) and
  // shared across many rows/tables rather than anchored to one field.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.disamatic-component-suggestions') || event.target.closest('.disamatic-component-input')) return;
      setOpenComponentDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The dropdown is portaled and position:fixed, computed once when it opens
  // — without this, scrolling the page (or the table's own overflowX
  // container) leaves it visually detached from the input it belongs to.
  // Re-locate the open row's input via the same data-field lookup used
  // elsewhere in this file and recompute the anchor on every scroll/resize.
  useEffect(() => {
    if (!openComponentDropdown) return undefined;
    const fieldSelector = {
      production: (i) => `${i}-componentName`,
      nextShiftPlan: (i) => `${i}-nextShiftPlan-componentName`,
      mouldHardness: (i) => `${i}-mouldHardness-componentName`,
      patternTemp: (i) => `${i}-patternTemp-item`,
    }[openComponentDropdown.table]?.(openComponentDropdown.index);

    const updatePosition = () => {
      const el = fieldSelector && document.querySelector(`[data-field="${fieldSelector}"]`);
      if (!el) { setOpenComponentDropdown(null); return; }
      const rect = el.getBoundingClientRect();
      setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openComponentDropdown]);

  const filterComponentSuggestions = (table, value) =>
    componentSuggestions[table].filter(n => n.toUpperCase().includes(value.toUpperCase())).slice(0, 5);

  // Fetch primary data when date or shift changes
  useEffect(() => {
    if (formData.date && formData.shift) {
      fetchPrimaryData(formData.date, formData.shift);
    } else {
      // Reset loading states if date or shift is cleared
      setSavePrimaryLoading(false);
      setShowCombinationFound(false);
    }
  }, [formData.date, formData.shift]);

  // Fetch primary data from backend
  const fetchPrimaryData = async (date, shift) => {
    try {
      setIsLoading(true);
      setSavePrimaryLoading(true);
      setShowCombinationFound(false);
      
      const startTime = Date.now();
      
      const response = await fetch(`${API_ENDPOINTS.mouldingDisa}/primary?date=${date}&shift=${shift}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication required');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (result.success && result.data) {
        const { incharge, ppOperator, memberspresent, productionCount, nextShiftPlanCount, delaysCount, mouldHardnessCount, patternTempCount, significantEvent, maintenance, supervisorName } = result.data;
        
        // Set next S.No based on existing production data count
        const newNextSNo = (productionCount || 0) + 1;
        setNextSNo(newNextSNo);
        
        // Set next shift plan S.No
        const newNextShiftPlanSNo = (nextShiftPlanCount || 0) + 1;
        setNextShiftPlanSNo(newNextShiftPlanSNo);
        
        // Set delays S.No
        const newDelaysSNo = (delaysCount || 0) + 1;
        setDelaysSNo(newDelaysSNo);
        
        // Set mould hardness S.No
        const newMouldHardnessSNo = (mouldHardnessCount || 0) + 1;
        setMouldHardnessSNo(newMouldHardnessSNo);
        
        // Set pattern temperature S.No
        const newPatternTempSNo = (patternTempCount || 0) + 1;
        setPatternTempSNo(newPatternTempSNo);
        
        // Determine saved members count
        const savedMembersCount = (memberspresent && memberspresent.length > 0) ? memberspresent.length : 0;
        
        // Update form data with fetched values - start with one empty field if no saved members
        const currentMembers = memberspresent && memberspresent.length > 0 ? [...memberspresent] : [''];
        
        setFormData(prev => ({
          ...prev,
          incharge: incharge || '',
          ppOperator: ppOperator || '',
          members: currentMembers,
          productionTable: [{ counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }],
          nextShiftPlanTable: [{ componentName: "", plannedMoulds: "", remarks: "" }],
          delaysTable: [{ delays: "", durationMinutes: [""], fromTime: [""], toTime: [""] }],
          significantEvent: significantEvent || '',
          maintenance: maintenance || '',
          supervisorName: supervisorName || ''
        }));

        // Lock fields that have values
        setLockedFields({
          incharge: !!incharge,
          ppOperator: !!ppOperator
        });
        
        // Set count of locked members
        setLockedMembersCount(savedMembersCount);

        // Check if any primary data exists
        const hasAnyData = incharge || ppOperator || savedMembersCount > 0;
        setIsPrimaryDataSaved(hasAnyData);
        setSavedPrimarySnapshot({ incharge: incharge || '', ppOperator: ppOperator || '', members: currentMembers.filter(m => m && m.trim() !== '') });

        // Lock individual events fields based on what has data
        setLockedEventsFields({
          significantEvent: !!(significantEvent && significantEvent.trim()),
          maintenance: !!(maintenance && maintenance.trim()),
          supervisorName: !!(supervisorName && supervisorName.trim())
        });
        
        // Check if all events fields are locked
        const allEventsLocked = !!(significantEvent && significantEvent.trim()) && 
                               !!(maintenance && maintenance.trim()) && 
                               !!(supervisorName && supervisorName.trim());
        setIsEventsSaved(allEventsLocked);
        
        // Ensure minimum 1 second loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        setSavePrimaryLoading(false);
        
        // Show "Combination found" message if data exists
        if (hasAnyData) {
          setShowCombinationFound(true);
          setTimeout(() => {
            setShowCombinationFound(false);
          }, 1500);
        }
      } else {
        // No data found - reset to defaults
        setFormData(prev => ({
          ...prev,
          incharge: '',
          ppOperator: '',
          members: [''],
          productionTable: [{ counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }],
          nextShiftPlanTable: [{ componentName: "", plannedMoulds: "", remarks: "" }],
          delaysTable: [{ delays: "", durationMinutes: [""], fromTime: [""], toTime: [""] }],
          significantEvent: '',
          maintenance: '',
          supervisorName: ''
        }));
        setLockedFields({
          incharge: false,
          ppOperator: false
        });
        setLockedMembersCount(0);
        setIsPrimaryDataSaved(false);
        setSavedPrimarySnapshot({ incharge: '', ppOperator: '', members: [] });
        setIsEventsSaved(false);
        setLockedEventsFields({
          significantEvent: false,
          maintenance: false,
          supervisorName: false
        });
        setNextSNo(1);
        setNextShiftPlanSNo(1);
        setDelaysSNo(1);
        setMouldHardnessSNo(1);
        setPatternTempSNo(1);
        
        // Ensure minimum 1 second loading time for no data case
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        setSavePrimaryLoading(false);
      }
    } catch (error) {
      console.error('Error fetching primary data:', error);
      setSavePrimaryLoading(false);
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  // Handle basic field changes
  const handleChange = (field, value) => {
    // Reset validation to null when user changes value
    if (field === 'date') {
      setDateValid(null);
      setDateErrorHighlight(false);
    }
    if (field === 'shift') {
      setShiftValid(null);
      setShiftErrorHighlight(false);
    }

    // When date changes, reset everything
    if (field === 'date') {
      setFormData({
        ...initialFormData,
        date: value
      });
      setIsPrimaryDataSaved(false);
      setSavedPrimarySnapshot({ incharge: '', ppOperator: '', members: [] });
      setLockedFields({
        incharge: false,
        ppOperator: false
      });
      setLockedMembersCount(0);
      // Reset validation states to null
      setDateValid(null);
      setShiftValid(null);
      // Reset error highlights
      setDateErrorHighlight(false);
      setShiftErrorHighlight(false);
      // Reset all S.No counters
      setNextSNo(1);
      setNextShiftPlanSNo(1);
      setDelaysSNo(1);
      setMouldHardnessSNo(1);
      setPatternTempSNo(1);
      // Reset events
      setIsEventsSaved(false);
      setLockedEventsFields({
        significantEvent: false,
        maintenance: false,
        supervisorName: false
      });
      return;
    }

    // Clear events submit error when user types in events fields
    if (['significantEvent', 'maintenance', 'supervisorName'].includes(field)) {
      setEventsSubmitError('');
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handler for when value fields are focused - check if prerequisites are filled
  const handleValueFieldFocus = (e) => {
    if (!formData.date) {
      setDateErrorHighlight(true);
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
    if (!formData.shift) {
      setShiftErrorHighlight(true);
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
  };

  // Members management
  const handleMemberChange = (index, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMemberField = () => {
    if (formData.members.length < 4) {
      setFormData(prev => ({ ...prev, members: [...prev.members, ""] }));
    }
  };

  const removeMemberField = (index) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  // Production Table
  const addProductionRow = () => {
    setFormData(prev => ({
      ...prev,
      productionTable: [...prev.productionTable, { counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }]
    }));
  };

  const deleteProductionRow = (index) => {
    setFormData(prev => ({
      ...prev,
      productionTable: prev.productionTable.filter((_, i) => i !== index)
    }));
  };

  const handleProductionChange = (index, field, value) => {
    const newTable = [...formData.productionTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, productionTable: newTable }));
    
    // Clear submit error
    setProductionSubmitError('');
    
    // Clear error for this field when user enters data
    if (productionErrors[index]?.[field]) {
      setProductionErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const getBorderColor = (rowIndex, fieldName) => {
    const hasError = productionErrors[rowIndex]?.[fieldName];
    if (hasError) {
      return '#ef4444'; // red when error
    }
    return '#e2e8f0'; // default gray
  };

  // Handle Enter key to move to next input
  const handleProductionKeyDown = (e, currentRowIndex, currentField) => {
    if (currentField === 'componentName') {
      if (e.key === 'Escape') {
        setOpenComponentDropdown(null);
        return;
      }
      if (e.key === 'Enter' && openComponentDropdown?.table === 'production' && openComponentDropdown?.index === currentRowIndex && filteredComponentSuggestions.length > 0) {
        e.preventDefault();
        handleProductionChange(currentRowIndex, 'componentName', filteredComponentSuggestions[0]);
        setOpenComponentDropdown(null);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();

      // Navigation fields
      const fields = ['counterNo', 'componentName', 'produced', 'poured', 'cycleTime', 'mouldsPerHour', 'remarks'];
      const currentFieldIndex = fields.indexOf(currentField);
      
      // Move to next field in same row
      if (currentFieldIndex < fields.length - 1) {
        const nextField = fields[currentFieldIndex + 1];
        setFocusedField(`${currentRowIndex}-${nextField}`);
        // Focus the next input using setTimeout to ensure state update
        setTimeout(() => {
          // Special handling for cycleTime field (CustomTimeInput component)
          if (nextField === 'cycleTime') {
            const timeContainer = document.querySelector(`div[data-field="${currentRowIndex}-cycleTime"]`);
            if (timeContainer) {
              const hourInput = timeContainer.querySelector('input.time-input-field');
              if (hourInput) {
                hourInput.focus();
                hourInput.select();
                return;
              }
            }
          }
          
          // Regular input handling
          const nextInput = document.querySelector(`input[data-field="${currentRowIndex}-${nextField}"]`);
          if (nextInput) {
            nextInput.focus();
          }
        }, 0);
      } 
      // Move to first field of next row
      else if (currentRowIndex < formData.productionTable.length - 1) {
        const nextRowIndex = currentRowIndex + 1;
        setFocusedField(`${nextRowIndex}-counterNo`);
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-field="${nextRowIndex}-counterNo"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
      // Last field of last row → trigger submit
      else if (currentRowIndex === formData.productionTable.length - 1 && currentFieldIndex === fields.length - 1) {
        handleSubmitProduction();
      }
    }
  };

  // Submit Production Data
  const handleSubmitProduction = async () => {
    const hasRowData = (row) => row.counterNo || row.componentName || row.produced || row.poured || row.cycleTime || row.mouldsPerHour || row.remarks;
    const { errors, hasErrors, firstErrorField, message, nothingToSave } = validateSectionRows(productionFieldMapping, formData.productionTable, hasRowData);

    if (nothingToSave) {
      setProductionErrors({});
      setProductionSubmitError(MESSAGE_NOTHING_TO_SAVE);
      setTimeout(() => setProductionSubmitError(''), 3000);
      return;
    }

    if (hasErrors) {
      setProductionErrors(errors);
      setProductionSubmitError(message);
      if (firstErrorField) {
        const el = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (el) el.focus();
      }
      return;
    }

    setProductionSubmitError('');

    try {
      setIsLoading(true);
      setSavingSection('production');
      
      // Filter out empty rows before sending
      const validRows = formData.productionTable.filter(row => 
        row.counterNo || row.componentName || row.produced || row.poured || row.cycleTime || row.mouldsPerHour || row.remarks
      );
      
      // Save production data to backend
      const response = await fetch(API_ENDPOINTS.mouldingDisa, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          section: 'production',
          productionTable: validRows
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save production data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        
        // Calculate new nextSNo based on saved rows
        const newNextSNo = nextSNo + validRows.length;
        setNextSNo(newNextSNo);
        
        // Clear production table and add one row
        setFormData(prev => ({
          ...prev,
          productionTable: [{ counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }]
        }));
        
        // Clear errors
        setProductionErrors({});
        setProductionSubmitError('');

        // Show success alert
        setProductionSuccess(true);
        setTimeout(() => setProductionSuccess(false), 3000);
        fetchComponentNames('production');
      } else {
        setProductionSubmitError(result.message || 'Failed to save production data.');
      }
      setProductionErrors({});
    } catch (error) {
      console.error('Error saving production data:', error);
      setProductionSubmitError(error.message || 'Failed to save production data. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  // Next Shift Plan Table
  const addNextShiftPlanRow = () => {
    setFormData(prev => ({
      ...prev,
      nextShiftPlanTable: [...prev.nextShiftPlanTable, { componentName: "", plannedMoulds: "", remarks: "" }]
    }));
  };

  const deleteNextShiftPlanRow = (index) => {
    setFormData(prev => ({
      ...prev,
      nextShiftPlanTable: prev.nextShiftPlanTable.filter((_, i) => i !== index)
    }));
  };

  const handleNextShiftPlanChange = (index, field, value) => {
    const newTable = [...formData.nextShiftPlanTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, nextShiftPlanTable: newTable }));
    
    // Clear submit error
    setNextShiftPlanSubmitError('');
    
    // Clear error for this field when user enters data
    if (nextShiftPlanErrors[index]?.[field]) {
      setNextShiftPlanErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const getBorderColorNextShiftPlan = (rowIndex, fieldName) => {
    const hasError = nextShiftPlanErrors[rowIndex]?.[fieldName];
    if (hasError) {
      return '#ef4444'; // red when error
    }
    return '#e2e8f0'; // default gray
  };

  // Handle Enter key navigation for Next Shift Plan
  const handleNextShiftPlanKeyDown = (e, currentRowIndex, currentField) => {
    if (currentField === 'componentName') {
      if (e.key === 'Escape') {
        setOpenComponentDropdown(null);
        return;
      }
      if (e.key === 'Enter' && openComponentDropdown?.table === 'nextShiftPlan' && openComponentDropdown?.index === currentRowIndex && filteredComponentSuggestions.length > 0) {
        e.preventDefault();
        handleNextShiftPlanChange(currentRowIndex, 'componentName', filteredComponentSuggestions[0]);
        setOpenComponentDropdown(null);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();

      const fields = ['componentName', 'plannedMoulds', 'remarks'];
      const currentFieldIndex = fields.indexOf(currentField);
      
      // Move to next field in same row
      if (currentFieldIndex < fields.length - 1) {
        const nextField = fields[currentFieldIndex + 1];
        setFocusedField(`${currentRowIndex}-nextShiftPlan-${nextField}`);
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-field="${currentRowIndex}-nextShiftPlan-${nextField}"]`);
          if (nextInput) {
            nextInput.focus();
          }
        }, 0);
      } 
      // Move to first field of next row
      else if (currentRowIndex < formData.nextShiftPlanTable.length - 1) {
        const nextRowIndex = currentRowIndex + 1;
        setFocusedField(`${nextRowIndex}-nextShiftPlan-componentName`);
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-field="${nextRowIndex}-nextShiftPlan-componentName"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
      // Last field of last row → trigger submit
      else if (currentRowIndex === formData.nextShiftPlanTable.length - 1 && currentFieldIndex === fields.length - 1) {
        handleSubmitNextShiftPlan();
      }
    }
  };

  // Submit Next Shift Plan Data
  const handleSubmitNextShiftPlan = async () => {
    const hasRowData = (row) => row.componentName || row.plannedMoulds || row.remarks;
    const { errors, hasErrors, firstErrorField, message, nothingToSave } = validateSectionRows(nextShiftPlanFieldMapping, formData.nextShiftPlanTable, hasRowData, 'nextShiftPlan');

    if (nothingToSave) {
      setNextShiftPlanErrors({});
      setNextShiftPlanSubmitError(MESSAGE_NOTHING_TO_SAVE);
      setTimeout(() => setNextShiftPlanSubmitError(''), 3000);
      return;
    }

    if (hasErrors) {
      setNextShiftPlanErrors(errors);
      setNextShiftPlanSubmitError(message);
      if (firstErrorField) {
        const el = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (el) el.focus();
      }
      return;
    }

    setNextShiftPlanSubmitError('');

    try {
      setIsLoading(true);
      setSavingSection('nextShiftPlan');
      
      // Filter out empty rows
      const validRows = formData.nextShiftPlanTable.filter(row => 
        row.componentName || row.plannedMoulds || row.remarks
      );
      
      // Save to backend
      const response = await fetch(API_ENDPOINTS.mouldingDisa, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          section: 'nextShiftPlan',
          nextShiftPlanTable: validRows
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save next shift plan: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        
        // Update next S.No
        const newNextShiftPlanSNo = nextShiftPlanSNo + validRows.length;
        setNextShiftPlanSNo(newNextShiftPlanSNo);
        
        // Clear table
        setFormData(prev => ({
          ...prev,
          nextShiftPlanTable: [{ componentName: "", plannedMoulds: "", remarks: "" }]
        }));
        
        // Clear errors
        setNextShiftPlanErrors({});
        setNextShiftPlanSubmitError('');

        // Show success alert
        setNextShiftPlanSuccess(true);
        setTimeout(() => setNextShiftPlanSuccess(false), 3000);
        fetchComponentNames('nextShiftPlan');
      } else {
        setNextShiftPlanSubmitError(result.message || 'Failed to save next shift plan.');
      }
      setNextShiftPlanErrors({});
    } catch (error) {
      console.error('Error saving next shift plan:', error);
      setNextShiftPlanSubmitError(error.message || 'Failed to save next shift plan. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  // Delays Table
  
  // Helper: Calculate time difference in minutes
  const calculateMinutesDifference = (fromTimeStr, toTimeStr) => {
    if (!fromTimeStr || !toTimeStr) return 0;
    
    try {
      const fromTime = createTimeFromString(fromTimeStr);
      const toTime = createTimeFromString(toTimeStr);
      
      if (!fromTime || !toTime) return 0;
      
      let fromMinutes = fromTime.hour * 60 + fromTime.minute;
      let toMinutes = toTime.hour * 60 + toTime.minute;
      
      // Handle overnight times
      if (toMinutes < fromMinutes) {
        toMinutes += 24 * 60;
      }
      
      return toMinutes - fromMinutes;
    } catch {
      return 0;
    }
  };
  
  // Helper: Add minutes to time
  const addMinutesToTime = (timeStr, minutes) => {
    if (!timeStr || !minutes) return '';
    
    try {
      const time = createTimeFromString(timeStr);
      if (!time) return '';
      
      const totalMinutes = time.hour * 60 + time.minute + parseInt(minutes);
      const newHour = Math.floor(totalMinutes / 60) % 24;
      const newMinute = totalMinutes % 60;
      
      return formatTimeToString(new Time(newHour, newMinute));
    } catch {
      return '';
    }
  };
  
  const addDelaysRow = () => {
    setDelaysSubmitError('');
    setFormData(prev => ({
      ...prev,
      delaysTable: [...prev.delaysTable, { delays: "", durationMinutes: [""], fromTime: [""], toTime: [""] }]
    }));
  };

  const deleteDelaysRow = (index) => {
    setDelaysSubmitError('');
    setFormData(prev => ({
      ...prev,
      delaysTable: prev.delaysTable.filter((_, i) => i !== index)
    }));
  };

  const handleDelaysChange = (index, field, value) => {
    const newTable = [...formData.delaysTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, delaysTable: newTable }));
    
    // Clear submit error
    setDelaysSubmitError('');
    
    // Clear error for this field
    if (delaysErrors[index]?.[field]) {
      setDelaysErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  // Add/Remove duration minute inputs
  const addDurationInput = (rowIndex) => {
    setDelaysSubmitError('');
    const newTable = [...formData.delaysTable];
    if (newTable[rowIndex].durationMinutes.length < 10) {
      newTable[rowIndex].durationMinutes = [...newTable[rowIndex].durationMinutes, ""];
      newTable[rowIndex].fromTime = [...newTable[rowIndex].fromTime, ""];
      newTable[rowIndex].toTime = [...newTable[rowIndex].toTime, ""];
      setFormData(prev => ({ ...prev, delaysTable: newTable }));
    }
  };

  const removeDurationInput = (rowIndex, inputIndex) => {
    setDelaysSubmitError('');
    const newTable = [...formData.delaysTable];
    if (newTable[rowIndex].durationMinutes.length > 1) {
      newTable[rowIndex].durationMinutes = newTable[rowIndex].durationMinutes.filter((_, i) => i !== inputIndex);
      newTable[rowIndex].fromTime = newTable[rowIndex].fromTime.filter((_, i) => i !== inputIndex);
      newTable[rowIndex].toTime = newTable[rowIndex].toTime.filter((_, i) => i !== inputIndex);
      setFormData(prev => ({ ...prev, delaysTable: newTable }));
    }
  };

  const handleDurationInputChange = (rowIndex, inputIndex, value) => {
    const newTable = [...formData.delaysTable];
    newTable[rowIndex].durationMinutes[inputIndex] = value;
    
    // Clear submit error
    setDelaysSubmitError('');
    
    // Auto-calculate toTime if fromTime exists and duration is entered
    if (value && newTable[rowIndex].fromTime[inputIndex]) {
      const calculatedToTime = addMinutesToTime(newTable[rowIndex].fromTime[inputIndex], value);
      if (calculatedToTime) {
        newTable[rowIndex].toTime[inputIndex] = calculatedToTime;
      }
    }
    
    setFormData(prev => ({ ...prev, delaysTable: newTable }));
    
    // Validate duration <= 30 minutes
    if (value && parseInt(value) > 30) {
      setDelaysErrors(prev => ({
        ...prev,
        [rowIndex]: {
          ...prev[rowIndex],
          durationMinutes: {
            ...prev[rowIndex]?.durationMinutes,
            [inputIndex]: 'Duration cannot exceed 30 minutes'
          }
        }
      }));
    } else {
      // Clear errors
      if (delaysErrors[rowIndex]?.durationMinutes?.[inputIndex]) {
        setDelaysErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors[rowIndex]?.durationMinutes) {
            delete newErrors[rowIndex].durationMinutes[inputIndex];
            if (Object.keys(newErrors[rowIndex].durationMinutes).length === 0) {
              delete newErrors[rowIndex].durationMinutes;
            }
          }
          return newErrors;
        });
      }
    }
  };

  const handleTimeInputChange = (rowIndex, inputIndex, field, value) => {
    const newTable = [...formData.delaysTable];
    newTable[rowIndex][field][inputIndex] = value;
    
    // Clear submit error
    setDelaysSubmitError('');
    
    let calculatedDuration = 0;
    
    // Auto-calculate based on what was changed
    if (field === 'fromTime') {
      // fromTime changed
      if (value && newTable[rowIndex].durationMinutes[inputIndex]) {
        // If duration exists, calculate toTime
        const calculatedToTime = addMinutesToTime(value, newTable[rowIndex].durationMinutes[inputIndex]);
        if (calculatedToTime) {
          newTable[rowIndex].toTime[inputIndex] = calculatedToTime;
        }
      } else if (value && newTable[rowIndex].toTime[inputIndex]) {
        // If toTime exists, calculate duration
        calculatedDuration = calculateMinutesDifference(value, newTable[rowIndex].toTime[inputIndex]);
        if (calculatedDuration > 0) {
          newTable[rowIndex].durationMinutes[inputIndex] = String(calculatedDuration);
        }
      }
    } else if (field === 'toTime') {
      // toTime changed
      if (value && newTable[rowIndex].fromTime[inputIndex]) {
        // Calculate duration from fromTime to toTime
        calculatedDuration = calculateMinutesDifference(newTable[rowIndex].fromTime[inputIndex], value);
        if (calculatedDuration > 0) {
          newTable[rowIndex].durationMinutes[inputIndex] = String(calculatedDuration);
        }
      }
    }
    
    setFormData(prev => ({ ...prev, delaysTable: newTable }));
    
    // Validate calculated duration
    if (calculatedDuration > 30) {
      setDelaysErrors(prev => ({
        ...prev,
        [rowIndex]: {
          ...prev[rowIndex],
          durationMinutes: {
            ...prev[rowIndex]?.durationMinutes,
            [inputIndex]: 'Duration cannot exceed 30 minutes'
          }
        }
      }));
    } else {
      // Clear errors
      if (delaysErrors[rowIndex]?.fromTime?.[inputIndex] || delaysErrors[rowIndex]?.toTime?.[inputIndex] || delaysErrors[rowIndex]?.durationMinutes?.[inputIndex]) {
        setDelaysErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors[rowIndex]?.fromTime) {
            delete newErrors[rowIndex].fromTime[inputIndex];
          }
          if (newErrors[rowIndex]?.toTime) {
            delete newErrors[rowIndex].toTime[inputIndex];
          }
          if (newErrors[rowIndex]?.durationMinutes) {
            delete newErrors[rowIndex].durationMinutes[inputIndex];
          }
          return newErrors;
        });
      }
    }
  };
  
  // Submit Delays Data
  const handleSubmitDelays = async () => {
    const errors = {};
    let hasAnyData = false;
    let firstErrorField = null;
    let submitMessage = '';

    formData.delaysTable.forEach((row, index) => {
      const hasRowData = row.delays || row.durationMinutes.some(m => m) || row.fromTime.some(t => t) || row.toTime.some(t => t);
      if (!hasRowData) return;
      hasAnyData = true;

      const rowErrors = {};

      // Delay Reason required-ness, driven by DdisamaticProduct.js via the shared engine.
      const result = runValidation({ validationRanges, fieldMapping: delaysFieldMapping, formData: row, inputRefs: null });
      if (result.fieldStates.delays === false) {
        rowErrors.delays = true;
        if (!firstErrorField) { firstErrorField = `${index}-delays-delays`; submitMessage = result.message; }
      }

      // From/To Time pairing is per-index across parallel arrays, not
      // expressible via a fieldMapping key — stays bespoke (Process keeps its
      // Time fields bespoke for the same reason). Duration (Minutes)'s 30-min
      // cap is now an admin-only QC hint (see DisamaticProductReport.jsx's
      // deviation flag), not a submit-blocker, so this only checks blankness.
      const durationErrors = {};
      const fromTimeErrors = {};
      const toTimeErrors = {};
      row.durationMinutes.forEach((minutes, idx) => {
        const hasEntryData = minutes || row.fromTime[idx] || row.toTime[idx];
        if (!hasEntryData) return;
        if (!minutes) {
          durationErrors[idx] = true;
          if (!firstErrorField) firstErrorField = `${index}-delays-durationMinutes-${idx}`;
        }
        if (!row.fromTime[idx]) {
          fromTimeErrors[idx] = true;
          if (!firstErrorField) firstErrorField = `${index}-delays-fromTime-${idx}`;
        }
        if (!row.toTime[idx]) {
          toTimeErrors[idx] = true;
          if (!firstErrorField) firstErrorField = `${index}-delays-toTime-${idx}`;
        }
      });
      if (Object.keys(durationErrors).length) rowErrors.durationMinutes = durationErrors;
      if (Object.keys(fromTimeErrors).length) rowErrors.fromTime = fromTimeErrors;
      if (Object.keys(toTimeErrors).length) rowErrors.toTime = toTimeErrors;

      if (Object.keys(rowErrors).length) errors[index] = rowErrors;
    });

    // Nothing entered at all — a friendly nudge, not a wall of required-field
    // errors on rows the user never touched.
    if (!hasAnyData) {
      setDelaysErrors({});
      setDelaysSubmitError(MESSAGE_NOTHING_TO_SAVE);
      setTimeout(() => setDelaysSubmitError(''), 3000);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setDelaysErrors(errors);
      setDelaysSubmitError(submitMessage || MESSAGE_REQUIRED);
      if (firstErrorField) {
        const el = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (el) el.focus();
      }
      return;
    }

    // Clear submit error if validation passes
    setDelaysSubmitError('');
    
    try {
      setIsLoading(true);
      setSavingSection('delays');
      
      // Filter out empty rows
      const validRows = formData.delaysTable.filter(row => 
        row.delays || row.durationMinutes.some(m => m) || row.fromTime.some(t => t) || row.toTime.some(t => t)
      );
      
      // Save to backend
      const response = await fetch(API_ENDPOINTS.mouldingDisa, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          section: 'delays',
          delaysTable: validRows
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save delays: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update next S.No
        const newDelaysSNo = delaysSNo + validRows.length;
        setDelaysSNo(newDelaysSNo);
        
        // Clear table
        setFormData(prev => ({
          ...prev,
          delaysTable: [{ delays: "", durationMinutes: [""], fromTime: [""], toTime: [""] }]
        }));
        
        setDelaysErrors({});
        setDelaysSubmitError('');

        // Show success alert
        setDelaysSuccess(true);
        setTimeout(() => setDelaysSuccess(false), 3000);
      } else {
        setDelaysSubmitError(result.message || 'Failed to save delays.');
      }
    } catch (error) {
      console.error('Error saving delays:', error);
      setDelaysSubmitError(error.message || 'Failed to save delays. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };
  
  const getBorderColorDelays = (rowIndex, fieldName) => {
    const hasError = delaysErrors[rowIndex]?.[fieldName];
    if (hasError) {
      return '#ef4444'; // red when error
    }
    return '#e2e8f0'; // default gray
  };
  
  const getDurationInputBorderColor = (rowIndex, inputIndex) => {
    const hasError = delaysErrors[rowIndex]?.durationMinutes?.[inputIndex];
    return hasError ? '#ef4444' : '#e2e8f0';
  };
  
  // Handle Enter key navigation for Delays table
  const handleDelaysKeyDown = (e, currentRowIndex, currentField, currentInputIndex = null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const row = formData.delaysTable[currentRowIndex];
      const totalDurationInputs = row.durationMinutes.length;
      
      // Determine next field
      let nextField = null;
      let nextInputIndex = null;
      
      if (currentField === 'delays') {
        // Move to first duration minutes input
        nextField = 'durationMinutes';
        nextInputIndex = 0;
      } else if (currentField === 'durationMinutes') {
        // Move to corresponding fromTime
        nextField = 'fromTime';
        nextInputIndex = currentInputIndex;
      } else if (currentField === 'fromTime') {
        // Move to corresponding toTime
        nextField = 'toTime';
        nextInputIndex = currentInputIndex;
      } else if (currentField === 'toTime') {
        // Check if there's another duration entry
        if (currentInputIndex < totalDurationInputs - 1) {
          // Move to next duration entry
          nextField = 'durationMinutes';
          nextInputIndex = currentInputIndex + 1;
        } else {
          // Move to next row's delays field
          if (currentRowIndex < formData.delaysTable.length - 1) {
            const nextRowIndex = currentRowIndex + 1;
            setFocusedField(`${nextRowIndex}-delays-delays`);
            setTimeout(() => {
              const nextInput = document.querySelector(`input[data-field="${nextRowIndex}-delays-delays"]`);
              if (nextInput) nextInput.focus();
            }, 0);
            return;
          }
          // Last field of last row → trigger submit
          handleSubmitDelays();
          return;
        }
      }
      
      // Focus next field
      if (nextField) {
        setFocusedField(`${currentRowIndex}-delays-${nextField}-${nextInputIndex}`);
        setTimeout(() => {
          if (nextField === 'durationMinutes') {
            const nextInput = document.querySelector(`input[data-field="${currentRowIndex}-delays-durationMinutes-${nextInputIndex}"]`);
            if (nextInput) nextInput.focus();
          } else if (nextField === 'fromTime' || nextField === 'toTime') {
            // Handle CustomTimeInput
            const timeContainer = document.querySelector(`div[data-field="${currentRowIndex}-delays-${nextField}-${nextInputIndex}"]`);
            if (timeContainer) {
              const hourInput = timeContainer.querySelector('input.time-input-field');
              if (hourInput) {
                hourInput.focus();
                hourInput.select();
              }
            }
          }
        }, 0);
      }
    }
  };

  // Mould Hardness Table
  const addMouldHardnessRow = () => {
    setMouldHardnessSubmitError('');
    setFormData(prev => ({
      ...prev,
      mouldHardnessTable: [...prev.mouldHardnessTable, { componentName: "", mpPP: [""], mpSP: [""], bsPP: [""], bsSP: [""], remarks: "" }]
    }));
  };

  const deleteMouldHardnessRow = (index) => {
    setMouldHardnessSubmitError('');
    setFormData(prev => ({
      ...prev,
      mouldHardnessTable: prev.mouldHardnessTable.filter((_, i) => i !== index)
    }));
  };

  const handleMouldHardnessChange = (index, field, value, pairIndex = null) => {
    const newTable = [...formData.mouldHardnessTable];
    if (pairIndex !== null && Array.isArray(newTable[index][field])) {
      newTable[index][field][pairIndex] = value;
    } else {
      newTable[index][field] = value;
    }
    setFormData(prev => ({ ...prev, mouldHardnessTable: newTable }));
    
    // Clear submit error
    setMouldHardnessSubmitError('');
    
    // First, clear existing errors for this field
    if (mouldHardnessErrors[index]) {
      setMouldHardnessErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          if (pairIndex !== null) {
            if (newErrors[index][field]?.[pairIndex]) {
              delete newErrors[index][field][pairIndex];
              // If no more pair errors, remove the field error
              if (Object.keys(newErrors[index][field]).length === 0) {
                delete newErrors[index][field];
              }
            }
          } else {
            // For simple fields (componentName, remarks)
            delete newErrors[index][field];
          }
          // If no more errors for this row, remove the row error
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
    
  };

  // Format PP/SP values to one decimal place
  const formatDecimal = (value) => {
    if (!value || value === '') return value;
    // Remove any trailing dots
    let cleaned = value.replace(/\.+$/, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return value;
    return num.toFixed(1);
  };

  // Validate decimal input (allow digits and single decimal point)
  const cleanDecimalInput = (value) => {
    // Remove non-numeric characters except first decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Handle Enter key navigation for Mould Hardness table
  const handleMouldHardnessKeyDown = (e, currentRowIndex, currentField, pairIdx = null) => {
    if (currentField === 'componentName') {
      if (e.key === 'Escape') {
        setOpenComponentDropdown(null);
        return;
      }
      if (e.key === 'Enter' && openComponentDropdown?.table === 'mouldHardness' && openComponentDropdown?.index === currentRowIndex && filteredComponentSuggestions.length > 0) {
        e.preventDefault();
        handleMouldHardnessChange(currentRowIndex, 'componentName', filteredComponentSuggestions[0]);
        setOpenComponentDropdown(null);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();

      if (pairIdx !== null && ['mpPP', 'mpSP', 'bsPP', 'bsSP'].includes(currentField)) {
        const currentValue = formData.mouldHardnessTable[currentRowIndex][currentField][pairIdx];
        if (currentValue) {
          const formatted = formatDecimal(currentValue);
          handleMouldHardnessChange(currentRowIndex, currentField, formatted, pairIdx);
        }
      }

      const row = formData.mouldHardnessTable[currentRowIndex];
      const totalReadings = row.mpPP.length;

      const fields = ['componentName'];
      ['mpPP', 'mpSP', 'bsPP', 'bsSP'].forEach((kind) => {
        for (let i = 0; i < totalReadings; i++) fields.push(`${kind}-${i}`);
      });
      fields.push('remarks');

      const currentFieldKey = pairIdx !== null ? `${currentField}-${pairIdx}` : currentField;
      
      const currentFieldIndex = fields.indexOf(currentFieldKey);
      
      // Move to next field in same row
      if (currentFieldIndex >= 0 && currentFieldIndex < fields.length - 1) {
        const nextFieldKey = fields[currentFieldIndex + 1];
        const target = `${currentRowIndex}-mouldHardness-${nextFieldKey}`;
        setFocusedField(target);
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-field="${target}"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
      // Move to first field of next row
      else if (currentRowIndex < formData.mouldHardnessTable.length - 1) {
        const nextRowIndex = currentRowIndex + 1;
        setFocusedField(`${nextRowIndex}-mouldHardness-componentName`);
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-field="${nextRowIndex}-mouldHardness-componentName"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
      // Last field of last row → trigger submit
      else if (currentRowIndex === formData.mouldHardnessTable.length - 1 && currentFieldIndex === fields.length - 1) {
        handleSubmitMouldHardness();
      }
    }
  };

  // Add a new pair to a specific row in mould hardness table
  const addMouldHardnessPair = (rowIndex) => {
    setMouldHardnessSubmitError('');
    const newTable = [...formData.mouldHardnessTable];
    newTable[rowIndex].mpPP.push("");
    newTable[rowIndex].mpSP.push("");
    newTable[rowIndex].bsPP.push("");
    newTable[rowIndex].bsSP.push("");
    setFormData(prev => ({ ...prev, mouldHardnessTable: newTable }));
  };

  // Remove the last pair from a specific row in mould hardness table
  const removeMouldHardnessPair = (rowIndex) => {
    setMouldHardnessSubmitError('');
    const newTable = [...formData.mouldHardnessTable];
    if (newTable[rowIndex].mpPP.length > 1) {
      newTable[rowIndex].mpPP.pop();
      newTable[rowIndex].mpSP.pop();
      newTable[rowIndex].bsPP.pop();
      newTable[rowIndex].bsSP.pop();
      setFormData(prev => ({ ...prev, mouldHardnessTable: newTable }));
    }
  };

  // Submit Mould Hardness Data
  const handleSubmitMouldHardness = async () => {
    // Validate all fields in mould hardness table
    const errors = {};
    let hasCompleteRow = false;
    let hasAnyData = false;
    let firstErrorField = null;

    formData.mouldHardnessTable.forEach((row, index) => {
      const rowErrors = {};
      
      // Check if row has any data
      const hasRowData = row.componentName || row.remarks || 
        row.mpPP.some(v => v) ||
        row.mpSP.some(v => v) ||
        row.bsPP.some(v => v) ||
        row.bsSP.some(v => v);
      
      if (hasRowData) {
        hasAnyData = true;
        // Component Name / Remarks required-ness, driven by DdisamaticProduct.js
        // via the shared engine (Remarks is required: false there — this also
        // fixes the previous hand-rolled check, which wrongly required it).
        const result = runValidation({ validationRanges, fieldMapping: mouldHardnessFieldMapping, formData: row, inputRefs: null });
        if (result.fieldStates.componentName === false) { rowErrors.componentName = true; if (!firstErrorField) firstErrorField = `${index}-mouldHardness-componentName`; }
        if (result.fieldStates.remarks === false) { rowErrors.remarks = true; if (!firstErrorField) firstErrorField = `${index}-mouldHardness-remarks`; }

        ['mpPP', 'mpSP', 'bsPP', 'bsSP'].forEach((kind) => {
          const kindErrors = {};
          row[kind].forEach((value, pairIdx) => {
            if (!value) {
              kindErrors[pairIdx] = true;
              if (!firstErrorField) firstErrorField = `${index}-mouldHardness-${kind}-${pairIdx}`;
            }
          });
          if (Object.keys(kindErrors).length > 0) rowErrors[kind] = kindErrors;
        });

        
        // Check if all required fields are filled
        if (Object.keys(rowErrors).length === 0) {
          hasCompleteRow = true;
        } else {
          errors[index] = rowErrors;
        }
      }
    });

    // Nothing entered at all — a friendly nudge, not a wall of required-field
    // errors on rows the user never touched.
    if (!hasAnyData) {
      setMouldHardnessErrors({});
      setMouldHardnessSubmitError(MESSAGE_NOTHING_TO_SAVE);
      setTimeout(() => setMouldHardnessSubmitError(''), 3000);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setMouldHardnessErrors(errors);
      setMouldHardnessSubmitError('Enter data in correct format');
      if (firstErrorField) {
        const el = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (el) el.focus();
      }
      return;
    }

    if (!hasCompleteRow) {
      return;
    }
    
    // Clear submit error if validation passes
    setMouldHardnessSubmitError('');

    // Proceed with save
    try {
      setIsLoading(true);
      setSavingSection('mouldHardness');
      
      // Filter out empty rows
      const validRows = formData.mouldHardnessTable.filter(row => 
        row.componentName || row.remarks ||
        row.mpPP.some(v => v) ||
        row.mpSP.some(v => v) ||
        row.bsPP.some(v => v) ||
        row.bsSP.some(v => v)
      );
      
      // Save to backend
      const response = await fetch(API_ENDPOINTS.mouldingDisa, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          section: 'mouldHardness',
          mouldHardnessTable: validRows
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save mould hardness: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        
        // Update next S.No
        const newMouldHardnessSNo = mouldHardnessSNo + validRows.length;
        setMouldHardnessSNo(newMouldHardnessSNo);
        
        // Clear table
        setFormData(prev => ({
          ...prev,
          mouldHardnessTable: [{ componentName: "", mpPP: [""], mpSP: [""], bsPP: [""], bsSP: [""], remarks: "" }]
        }));
        
        setMouldHardnessErrors({});
        setMouldHardnessSubmitError('');

        // Show success alert
        setMouldHardnessSuccess(true);
        setTimeout(() => setMouldHardnessSuccess(false), 3000);
        fetchComponentNames('mouldHardness');
      } else {
        setMouldHardnessSubmitError(result.message || 'Failed to save mould hardness.');
      }
    } catch (error) {
      console.error('Error saving mould hardness:', error);
      setMouldHardnessSubmitError(error.message || 'Failed to save mould hardness. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  const getBorderColorMouldHardness = (rowIndex, fieldName) => {
    const hasError = mouldHardnessErrors[rowIndex]?.[fieldName];
    if (hasError) {
      return '#ef4444'; // red when error
    }
    return '#e2e8f0'; // default gray
  };

  const getReadingInputBorderColor = (rowIndex, fieldName, pairIdx) => {
    const hasError = mouldHardnessErrors[rowIndex]?.[fieldName]?.[pairIdx];
    if (hasError) {
      return '#ef4444'; // red when error
    }
    return '#e2e8f0'; // default gray
  };

  // Pattern Temp Table
  const addPatternTempRow = () => {
    setFormData(prev => ({
      ...prev,
      patternTempTable: [...prev.patternTempTable, { item: "", pp: "", sp: "" }]
    }));
  };

  const deletePatternTempRow = (index) => {
    setFormData(prev => ({
      ...prev,
      patternTempTable: prev.patternTempTable.filter((_, i) => i !== index)
    }));
  };

  const handlePatternTempChange = (index, field, value) => {
    const newTable = [...formData.patternTempTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, patternTempTable: newTable }));
    
    // Clear submit error
    setPatternTempSubmitError('');
    
    // Clear error for this field when user enters data
    if (patternTempErrors[index]) {
      setPatternTempErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const getBorderColorPatternTemp = (rowIndex, fieldName) => {
    const hasError = patternTempErrors[rowIndex]?.[fieldName];
    if (hasError) {
      return '#ef4444'; // red when error
    }
    return '#e2e8f0'; // default gray
  };

  // Handle Enter key navigation for Pattern Temperature table
  const handlePatternTempKeyDown = (e, currentRowIndex, currentField) => {
    if (currentField === 'item') {
      if (e.key === 'Escape') {
        setOpenComponentDropdown(null);
        return;
      }
      if (e.key === 'Enter' && openComponentDropdown?.table === 'patternTemp' && openComponentDropdown?.index === currentRowIndex && filteredComponentSuggestions.length > 0) {
        e.preventDefault();
        handlePatternTempChange(currentRowIndex, 'item', filteredComponentSuggestions[0]);
        setOpenComponentDropdown(null);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();

      // Auto-format to decimal if it's a PP/SP field
      if (['pp', 'sp'].includes(currentField)) {
        const currentValue = formData.patternTempTable[currentRowIndex][currentField];
        if (currentValue) {
          const formatted = formatDecimal(currentValue);
          handlePatternTempChange(currentRowIndex, currentField, formatted);
        }
      }
      
      const fields = ['item', 'pp', 'sp'];
      const currentFieldIndex = fields.indexOf(currentField);
      
      // Move to next field in same row
      if (currentFieldIndex >= 0 && currentFieldIndex < fields.length - 1) {
        const nextField = fields[currentFieldIndex + 1];
        setFocusedField(`${currentRowIndex}-patternTemp-${nextField}`);
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-field="${currentRowIndex}-patternTemp-${nextField}"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
      // Move to first field of next row
      else if (currentRowIndex < formData.patternTempTable.length - 1) {
        const nextRowIndex = currentRowIndex + 1;
        setFocusedField(`${nextRowIndex}-patternTemp-item`);
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-field="${nextRowIndex}-patternTemp-item"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
      // Last field of last row → trigger submit
      else if (currentRowIndex === formData.patternTempTable.length - 1 && currentFieldIndex === fields.length - 1) {
        handleSubmitPatternTemp();
      }
    }
  };

  // Submit Pattern Temperature Data
  const handleSubmitPatternTemp = async () => {
    const errors = {};
    let hasCompleteRow = false;
    let hasAnyData = false;
    let firstErrorField = null;

    formData.patternTempTable.forEach((row, index) => {
      const rowErrors = {};
      
      // Check if row has any data
      const hasRowData = row.item || row.pp || row.sp;
      
      if (hasRowData) {
        hasAnyData = true;
        // All three required, driven by DdisamaticProduct.js via the shared engine.
        const result = runValidation({ validationRanges, fieldMapping: patternTempFieldMapping, formData: row, inputRefs: null });
        if (result.fieldStates.item === false) { rowErrors.item = true; if (!firstErrorField) firstErrorField = `${index}-patternTemp-item`; }
        if (result.fieldStates.pp === false) { rowErrors.pp = true; if (!firstErrorField) firstErrorField = `${index}-patternTemp-pp`; }
        if (result.fieldStates.sp === false) { rowErrors.sp = true; if (!firstErrorField) firstErrorField = `${index}-patternTemp-sp`; }

        if (Object.keys(rowErrors).length === 0) {
          hasCompleteRow = true;
        } else {
          errors[index] = rowErrors;
        }
      }
    });

    // Nothing entered at all — a friendly nudge, not a wall of required-field
    // errors on rows the user never touched.
    if (!hasAnyData) {
      setPatternTempErrors({});
      setPatternTempSubmitError(MESSAGE_NOTHING_TO_SAVE);
      setTimeout(() => setPatternTempSubmitError(''), 3000);
      return;
    }

    if (Object.keys(errors).length > 0) {
      setPatternTempErrors(errors);
      setPatternTempSubmitError('Enter data in correct format');
      if (firstErrorField) {
        const el = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (el) el.focus();
      }
      return;
    }

    if (!hasCompleteRow) {
      return;
    }

    setPatternTempSubmitError('');

    // Proceed with save
    try {
      setIsLoading(true);
      setSavingSection('patternTemp');
      
      // Filter out empty rows
      const validRows = formData.patternTempTable.filter(row => 
        row.item || row.pp || row.sp
      );
      
      // Save to backend
      const response = await fetch(API_ENDPOINTS.mouldingDisa, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          section: 'patternTemp',
          patternTempTable: validRows
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save pattern temperature data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {

        
        // Calculate new patternTempSNo based on saved rows
        const newPatternTempSNo = patternTempSNo + validRows.length;
        setPatternTempSNo(newPatternTempSNo);
        
        // Reset pattern temp table
        setFormData(prev => ({
          ...prev,
          patternTempTable: [{ item: "", pp: "", sp: "" }]
        }));
        
        // Clear errors
        setPatternTempErrors({});
        setPatternTempSubmitError('');

        // Show success alert
        setPatternTempSuccess(true);
        setTimeout(() => setPatternTempSuccess(false), 3000);
        fetchComponentNames('patternTemp');
      } else {
        throw new Error(result.message || 'Failed to save pattern temperature data');
      }
    } catch (error) {
      console.error('Error saving pattern temperature data:', error);
      setPatternTempSubmitError(error.message || 'Failed to save pattern temperature data. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  // Save Primary Data Handler
  const handleSavePrimary = async () => {
    let hasErrors = false;
    let firstErrorField = null;

    // Validate date (null = neutral, false = invalid)
    if (!formData.date) {
      setDateValid(false);
      hasErrors = true;
      if (!firstErrorField) firstErrorField = 'date';
    } else {
      setDateValid(null);
    }

    // Validate shift
    if (!formData.shift) {
      setShiftValid(false);
      hasErrors = true;
      if (!firstErrorField) firstErrorField = 'shift';
    } else {
      setShiftValid(null);
    }

    if (hasErrors) {
      if (firstErrorField === 'date') dateRef.current?.focus();
      else if (firstErrorField === 'shift') shiftRef.current?.focus();
      return;
    }

    setPrimarySubmitError('');

    try {
      setIsLoading(true);
      setSavingSection('primary');

      // Prepare data to send - filter out empty members
      const filteredMembers = formData.members.filter(m => m && m.trim() !== '');

      const dataToSend = {
        date: formData.date,
        shift: formData.shift,
        incharge: formData.incharge,
        ppOperator: formData.ppOperator,
        members: filteredMembers.length > 0 ? filteredMembers : null
      };

      const response = await fetch(`${API_ENDPOINTS.mouldingDisa}/primary`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok && (response.status === 401 || response.status === 403)) {
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        // Lock fields that now have values
        setLockedFields({
          incharge: !!(formData.incharge && formData.incharge.trim()),
          ppOperator: !!(formData.ppOperator && formData.ppOperator.trim())
        });
        
        // Update locked members count
        setLockedMembersCount(filteredMembers.length);
        
        // Add empty field if less than 4 to allow adding more
        if (filteredMembers.length < 4) {
          setFormData(prev => ({
            ...prev,
            members: [...filteredMembers, '']
          }));
        }

        setIsPrimaryDataSaved(true);
        setSavedPrimarySnapshot({ incharge: formData.incharge, ppOperator: formData.ppOperator, members: filteredMembers });

        setShowCombinationAdded(true);
        setTimeout(() => setShowCombinationAdded(false), 1500);
      } else {
        setPrimarySubmitError(result.message || 'Failed to save primary data.');
      }
    } catch (error) {
      console.error('Error saving primary data:', error);
      setPrimarySubmitError(error.message || 'Failed to save primary data. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  // Submit Events Handler
  const handleSubmitEvents = async () => {
    // Check if there's any unlocked field with data to save
    const hasNewData = (!lockedEventsFields.significantEvent && formData.significantEvent?.trim()) ||
                       (!lockedEventsFields.maintenance && formData.maintenance?.trim()) ||
                       (!lockedEventsFields.supervisorName && formData.supervisorName?.trim());
    
    if (!hasNewData) {
      setEventsSubmitError("Please fill in at least one unlocked field to save");
      return;
    }
    setEventsSubmitError('');

    try {
      setIsLoading(true);
      setSavingSection('events');
      
      // Save events data to backend
      const response = await fetch(API_ENDPOINTS.mouldingDisa, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formData.date,
          shift: formData.shift,
          section: 'events',
          significantEvent: formData.significantEvent,
          maintenance: formData.maintenance,
          supervisorName: formData.supervisorName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save events data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Lock individual fields that now have data
        const newLockedFields = {
          significantEvent: !!(formData.significantEvent?.trim()),
          maintenance: !!(formData.maintenance?.trim()),
          supervisorName: !!(formData.supervisorName?.trim())
        };
        setLockedEventsFields(newLockedFields);
        
        // Check if all fields are now locked
        const allLocked = newLockedFields.significantEvent && 
                         newLockedFields.maintenance && 
                         newLockedFields.supervisorName;
        setIsEventsSaved(allLocked);

        // Show success alert
        setEventsSuccess(true);
        setTimeout(() => setEventsSuccess(false), 3000);
      } else {
        throw new Error(result.message || 'Failed to save events data');
      }
    } catch (error) {
      console.error('Error saving events data:', error);
      setEventsSubmitError(error.message || 'Failed to save events data. Please try again.');
    } finally {
      setIsLoading(false);
      setSavingSection(null);
    }
  };

  // Has incharge/ppOperator/members actually changed since the last save?
  // Drives whether the primary save button is clickable once something has
  // already been saved (see savedPrimarySnapshot).
  const currentFilteredMembers = formData.members.filter(m => m && m.trim() !== '');
  const isPrimaryDirty =
    formData.incharge !== savedPrimarySnapshot.incharge ||
    formData.ppOperator !== savedPrimarySnapshot.ppOperator ||
    currentFilteredMembers.length !== savedPrimarySnapshot.members.length ||
    currentFilteredMembers.some((m, i) => m !== savedPrimarySnapshot.members[i]);

  return (
    <div className="page-wrapper moulding-page-wrapper" ref={gridRef} onKeyDown={handleArrowKeyDown}>
      {/* Header */}
      <div className="disamatic-header">
        <div className="disamatic-header-text">
          <h2>
            <Save size={27} style={{ color: '#5B9AA9' }} />
            Disamatic Product - Entry Form
            <InfoIcon onClick={openInfoModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? (() => {
            const [y, m, d] = formData.date.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      {/* Info Modal */}
      <InfoCard
        isOpen={isInfoOpen}
        onClose={closeInfoModal}
        title="Disamatic Product - Validation Ranges & Field Guide"
        validationRanges={validationRanges}
      />

      {/* Primary Section */}
      <div ref={primarySectionRef} className="primary-header-container">
        <h3 className="primary-section-title">PRIMARY</h3>
      </div>
      
      {/* First Row: Date, Shift, Incharge, PP Operator */}
      <div className="primary-fields-row">
        <div className={`disamatic-form-group ${getValidationClass(dateValid)} ${dateErrorHighlight ? 'error-highlight' : ''}`}>
          <label>Date <span style={{ color: '#ef4444',width: '2px' }}>*</span></label>
          <CustomDatePicker
            ref={dateRef}
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            max={getTodaysDateLocal()}
            onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterDate())}
          />
        </div>
        <div 
          className={`disamatic-form-group ${getValidationClass(shiftValid)} ${shiftErrorHighlight ? 'error-highlight' : ''}`}
          onMouseDownCapture={(e) => {
            if (!formData.date && e.target.tagName !== 'SELECT') {
              setDateErrorHighlight(true);
              setTimeout(() => setDateErrorHighlight(false), 600);
            }
          }}
        >
          <label>Shift <span style={{ color: '#ef4444' }}>*</span></label>
          <ShiftDropdown
            ref={shiftRef}
            value={formData.shift}
            onChange={e => handleChange("shift", e.target.value)}
            disabled={!formData.date}
            onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterShift())}
            onMouseDown={(e) => {
              if (!formData.date) {
                setDateErrorHighlight(true);
                setTimeout(() => setDateErrorHighlight(false), 600);
              }
            }}
          />
        </div>
        {/* onMouseDownCapture on div + pointerEvents:'none' on disabled input = click-through error highlight */}
        <div 
          className={`disamatic-form-group ${inchargeErrorHighlight ? 'error-highlight' : ''}`}
          onMouseDownCapture={(e) => {
            if (e.target.tagName === 'INPUT' && !e.target.disabled) return;
            
            if (!formData.date) {
              setDateErrorHighlight(true);
              setInchargeErrorHighlight(true);
              setTimeout(() => {
                setDateErrorHighlight(false);
                setInchargeErrorHighlight(false);
              }, 600);
            } else if (!formData.shift) {
              setShiftErrorHighlight(true);
              setInchargeErrorHighlight(true);
              setTimeout(() => {
                setShiftErrorHighlight(false);
                setInchargeErrorHighlight(false);
              }, 600);
            }
          }}
        >
          <label>
            Incharge 
            {lockedFields.incharge && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>✓ Locked</span>}
          </label>
          <input 
            ref={inchargeRef}
            type="text" 
            value={formData.incharge} 
            onChange={e => handleChange("incharge", e.target.value)}
            placeholder="Enter incharge name"
            disabled={!formData.date || !formData.shift || lockedFields.incharge}
            style={{ 
              opacity: lockedFields.incharge ? 0.6 : 1,
              pointerEvents: (!formData.date || !formData.shift || lockedFields.incharge) ? 'none' : 'auto' // disabled input swallows clicks; pointerEvents:'none' lets them pass to parent onMouseDownCapture
            }}
            onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterIncharge())}
          />
        </div>
        {/* Same click-through error highlight pattern as Incharge */}
        <div 
          className={`disamatic-form-group ${ppOperatorErrorHighlight ? 'error-highlight' : ''}`}
          onMouseDownCapture={(e) => {
            if (e.target.tagName === 'INPUT' && !e.target.disabled) return;
            
            if (!formData.date) {
              setDateErrorHighlight(true);
              setPpOperatorErrorHighlight(true);
              setTimeout(() => {
                setDateErrorHighlight(false);
                setPpOperatorErrorHighlight(false);
              }, 600);
            } else if (!formData.shift) {
              setShiftErrorHighlight(true);
              setPpOperatorErrorHighlight(true);
              setTimeout(() => {
                setShiftErrorHighlight(false);
                setPpOperatorErrorHighlight(false);
              }, 600);
            }
          }}
        >
          <label>
            PP Operator
            {lockedFields.ppOperator && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>✓ Locked</span>}
          </label>
          <input 
            ref={ppOperatorRef}
            type="text" 
            value={formData.ppOperator} 
            onChange={e => handleChange("ppOperator", e.target.value)}
            placeholder="Enter PP Operator name"
            disabled={!formData.date || !formData.shift || lockedFields.ppOperator}
            style={{ 
              opacity: lockedFields.ppOperator ? 0.6 : 1,
              pointerEvents: (!formData.date || !formData.shift || lockedFields.ppOperator) ? 'none' : 'auto' // disabled input swallows clicks; pointerEvents:'none' lets them pass to parent onMouseDownCapture
            }}
            onKeyDown={(e) => handlePrimaryKeyDown(e, getNextAfterPpOperator())}
          />
        </div>
        <div 
          className={`disamatic-form-group ${membersErrorHighlight ? 'error-highlight' : ''}`}
          style={{ gridColumn: 'span 2' }}
          onMouseDownCapture={(e) => {
            if (e.target.tagName === 'INPUT' && !e.target.disabled) return;
            if (e.target.tagName === 'BUTTON') return;
            
            if (!formData.date) {
              setDateErrorHighlight(true);
              setMembersErrorHighlight(true);
              setTimeout(() => {
                setDateErrorHighlight(false);
                setMembersErrorHighlight(false);
              }, 600);
            } else if (!formData.shift) {
              setShiftErrorHighlight(true);
              setMembersErrorHighlight(true);
              setTimeout(() => {
                setShiftErrorHighlight(false);
                setMembersErrorHighlight(false);
              }, 600);
            }
          }}
        >
          <label>
            Members Present
            {lockedMembersCount > 0 && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>✓ {lockedMembersCount} Locked</span>}
          </label>
          <div className="disamatic-members-container">
            {formData.members.map((member, index) => (
              <div key={index} className="disamatic-member-input-wrapper">
                <input
                  type="text"
                  value={member}
                  onChange={e => handleMemberChange(index, e.target.value)}
                  placeholder={`Enter member name ${index + 1}`}
                  className="disamatic-member-input"
                  disabled={!formData.date || !formData.shift || index < lockedMembersCount}
                  style={{ 
                    opacity: index < lockedMembersCount ? 0.6 : 1,
                    pointerEvents: (!formData.date || !formData.shift || index < lockedMembersCount) ? 'none' : 'auto' // disabled input swallows clicks; pointerEvents:'none' lets them pass to parent onMouseDownCapture
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      // Navigate to next member input or Save Primary button
                      const nextIndex = index + 1;
                      const memberInputs = e.target.closest('.disamatic-members-container')?.querySelectorAll('.disamatic-member-input:not(:disabled)');
                      if (memberInputs && nextIndex < memberInputs.length) {
                        memberInputs[nextIndex].focus();
                      } else {
                        primarySaveButtonRef.current?.focus();
                      }
                    }
                  }}
                />
                {formData.members.length > 1 && index >= lockedMembersCount && (
                  <button
                    type="button"
                    onClick={() => removeMemberField(index)}
                    className="disamatic-remove-member-btn"
                    title="Remove member"
                    tabIndex={-1}
                    disabled={!formData.date || !formData.shift}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {formData.members.length < 4 && (
              <button
                type="button"
                onClick={addMemberField}
                className="disamatic-add-member-btn"
                title="Add another member"
                tabIndex={-1}
                disabled={!formData.date || !formData.shift}
              >
                <Plus size={16} />
                Add Member
              </button>
            )}
          </div>
        </div>
        <div className="disamatic-form-group">
          <label>&nbsp;</label>
          <LockPrimaryButton
            ref={primarySaveButtonRef}
            onClick={handleSavePrimary}
            disabled={!formData.date || !formData.shift || (isPrimaryDataSaved && !isPrimaryDirty)}
            label={isPrimaryDataSaved ? 'Update Primary Data' : 'Save Primary'}
            statusMessage={
              savePrimaryLoading ? 'Fetching Date, Shift'
                : showCombinationFound ? 'Combination found'
                : savingSection === 'primary' ? 'Saving...'
                : showCombinationAdded ? 'Combination Added'
                : null
            }
            statusVariant={savePrimaryLoading || savingSection === 'primary' ? 'primary' : 'success'}
          />
        </div>
      </div>

      {(showPrimaryWarning || primarySubmitError) && (
        <div className="disamatic-primary-messages">
          {showPrimaryWarning && (
            <InlineLoader message="Save Primary Data First" size="medium" variant="danger" />
          )}
          {primarySubmitError && (
            <InlineLoader message={primarySubmitError} variant="danger" size="medium" />
          )}
        </div>
      )}

      {/* Production Table — onMouseDownCapture intercepts clicks when primary not saved */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Production Table {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
          <div className="disamatic-section-actions">
            {formData.productionTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteProductionRow(formData.productionTable.length - 1)}
                disabled={!isPrimaryDataSaved}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
            <button type="button" onClick={addProductionRow} disabled={!isPrimaryDataSaved} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Mould Counter No.</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Component Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Produced </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Poured </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Cycle Time</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Moulds/Hour</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.productionTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 500, color: '#475569' }}>{nextSNo + index}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.counterNo}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleProductionChange(index, 'counterNo', value);
                      }}
                      onKeyDown={e => handleProductionKeyDown(e, index, 'counterNo')}
                      data-field={`${index}-counterNo`}
                      placeholder="Counter No"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColor(index, 'counterNo')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-counterNo`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      className="disamatic-component-input"
                      value={row.componentName}
                      onChange={e => {
                        handleProductionChange(index, 'componentName', e.target.value);
                        const filtered = filterComponentSuggestions('production', e.target.value);
                        const rect = e.target.getBoundingClientRect();
                        setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                        setFilteredComponentSuggestions(filtered);
                        setOpenComponentDropdown(filtered.length && e.target.value ? { table: 'production', index } : null);
                      }}
                      onKeyDown={e => handleProductionKeyDown(e, index, 'componentName')}
                      data-field={`${index}-componentName`}
                      placeholder="Component Name"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColor(index, 'componentName')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => {
                        setFocusedField(`${index}-componentName`);
                        if (row.componentName) {
                          const filtered = filterComponentSuggestions('production', row.componentName);
                          const rect = e.target.getBoundingClientRect();
                          setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                          setFilteredComponentSuggestions(filtered);
                          setOpenComponentDropdown(filtered.length ? { table: 'production', index } : null);
                        }
                      }}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                    {openComponentDropdown?.table === 'production' && openComponentDropdown?.index === index && filteredComponentSuggestions.length > 0 && dropdownAnchor && createPortal(
                      <div
                        className="disamatic-component-suggestions"
                        style={{
                          position: 'fixed', left: dropdownAnchor.left, top: dropdownAnchor.top, width: dropdownAnchor.width,
                          backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px',
                          maxHeight: '150px', overflowY: 'auto', zIndex: 10000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {filteredComponentSuggestions.map((name, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleProductionChange(index, 'componentName', name);
                              setOpenComponentDropdown(null);
                            }}
                            style={{
                              padding: '8px 12px', cursor: 'pointer',
                              borderBottom: idx < filteredComponentSuggestions.length - 1 ? '1px solid #eee' : 'none',
                              backgroundColor: 'white'
                            }}
                            onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                          >
                            {name}
                          </div>
                        ))}
                      </div>,
                      document.body
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.produced}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleProductionChange(index, 'produced', value);
                      }}
                      onKeyDown={e => handleProductionKeyDown(e, index, 'produced')}
                      data-field={`${index}-produced`}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColor(index, 'produced')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-produced`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.poured}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleProductionChange(index, 'poured', value);
                      }}
                      onKeyDown={e => handleProductionKeyDown(e, index, 'poured')}
                      data-field={`${index}-poured`}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColor(index, 'poured')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-poured`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div data-field={`${index}-cycleTime`}>
                      <CustomTimeInput
                        value={createTimeFromString(row.cycleTime)}
                        onChange={(timeObj) => handleProductionChange(index, 'cycleTime', formatTimeToString(timeObj))}
                        hasError={productionErrors[index]?.cycleTime && focusedField !== `${index}-cycleTime`}
                        onFocus={() => setFocusedField(`${index}-cycleTime`)}
                        onBlur={() => setFocusedField(null)}
                        onEnterPress={(e) => handleProductionKeyDown(e, index, 'cycleTime')}
                        aria-label="Cycle Time"
                      />
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.mouldsPerHour}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleProductionChange(index, 'mouldsPerHour', value);
                      }}
                      onKeyDown={e => handleProductionKeyDown(e, index, 'mouldsPerHour')}
                      data-field={`${index}-mouldsPerHour`}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColor(index, 'mouldsPerHour')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-mouldsPerHour`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleProductionChange(index, 'remarks', e.target.value)}
                      onKeyDown={e => handleProductionKeyDown(e, index, 'remarks')}
                      data-field={`${index}-remarks`}
                      placeholder="Remarks"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColor(index, 'remarks')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-remarks`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', borderTop: '1px solid #e2e8f0' }}>
          {productionSubmitError && (
            <InlineLoader
              message={productionSubmitError}
              variant={productionSubmitError === MESSAGE_NOTHING_TO_SAVE ? 'primary' : 'danger'}
              size="medium"
            />
          )}
          {productionSuccess && (
            <InlineLoader 
              message="Data added successfully!"
              variant="success"
              size="medium"
            />
          )}
          <SubmitButton onClick={handleSubmitProduction} disabled={!isPrimaryDataSaved} loading={savingSection === 'production'}>
            Save Production Data
          </SubmitButton>
        </div>
      </div>

      {/* Next Shift Plan Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Next Shift Plan {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
          <div className="disamatic-section-actions">
            {formData.nextShiftPlanTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteNextShiftPlanRow(formData.nextShiftPlanTable.length - 1)}
                disabled={!isPrimaryDataSaved}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
            <button type="button" onClick={addNextShiftPlanRow} disabled={!isPrimaryDataSaved} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Component Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Planned Moulds</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.nextShiftPlanTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 500, color: '#475569' }}>{nextShiftPlanSNo + index}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      className="disamatic-component-input"
                      value={row.componentName}
                      onChange={e => {
                        handleNextShiftPlanChange(index, 'componentName', e.target.value);
                        const filtered = filterComponentSuggestions('nextShiftPlan', e.target.value);
                        const rect = e.target.getBoundingClientRect();
                        setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                        setFilteredComponentSuggestions(filtered);
                        setOpenComponentDropdown(filtered.length && e.target.value ? { table: 'nextShiftPlan', index } : null);
                      }}
                      onKeyDown={e => handleNextShiftPlanKeyDown(e, index, 'componentName')}
                      data-field={`${index}-nextShiftPlan-componentName`}
                      placeholder="Component Name"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorNextShiftPlan(index, 'componentName')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => {
                        setFocusedField(`${index}-nextShiftPlan-componentName`);
                        if (row.componentName) {
                          const filtered = filterComponentSuggestions('nextShiftPlan', row.componentName);
                          const rect = e.target.getBoundingClientRect();
                          setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                          setFilteredComponentSuggestions(filtered);
                          setOpenComponentDropdown(filtered.length ? { table: 'nextShiftPlan', index } : null);
                        }
                      }}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                    {openComponentDropdown?.table === 'nextShiftPlan' && openComponentDropdown?.index === index && filteredComponentSuggestions.length > 0 && dropdownAnchor && createPortal(
                      <div
                        className="disamatic-component-suggestions"
                        style={{
                          position: 'fixed', left: dropdownAnchor.left, top: dropdownAnchor.top, width: dropdownAnchor.width,
                          backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px',
                          maxHeight: '150px', overflowY: 'auto', zIndex: 10000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {filteredComponentSuggestions.map((name, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleNextShiftPlanChange(index, 'componentName', name);
                              setOpenComponentDropdown(null);
                            }}
                            style={{
                              padding: '8px 12px', cursor: 'pointer',
                              borderBottom: idx < filteredComponentSuggestions.length - 1 ? '1px solid #eee' : 'none',
                              backgroundColor: 'white'
                            }}
                            onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                          >
                            {name}
                          </div>
                        ))}
                      </div>,
                      document.body
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.plannedMoulds}
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        handleNextShiftPlanChange(index, 'plannedMoulds', value);
                      }}
                      onKeyDown={e => handleNextShiftPlanKeyDown(e, index, 'plannedMoulds')}
                      data-field={`${index}-nextShiftPlan-plannedMoulds`}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorNextShiftPlan(index, 'plannedMoulds')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-nextShiftPlan-plannedMoulds`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleNextShiftPlanChange(index, 'remarks', e.target.value)}
                      onKeyDown={e => handleNextShiftPlanKeyDown(e, index, 'remarks')}
                      data-field={`${index}-nextShiftPlan-remarks`}
                      placeholder="Remarks"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorNextShiftPlan(index, 'remarks')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-nextShiftPlan-remarks`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          {nextShiftPlanSubmitError && (
            <InlineLoader
              message={nextShiftPlanSubmitError}
              variant={nextShiftPlanSubmitError === MESSAGE_NOTHING_TO_SAVE ? 'primary' : 'danger'}
              size="medium"
            />
          )}
          {nextShiftPlanSuccess && (
            <InlineLoader 
              message="Data added successfully!"
              variant="success"
              size="medium"
            />
          )}
          <SubmitButton onClick={handleSubmitNextShiftPlan} disabled={!isPrimaryDataSaved} loading={savingSection === 'nextShiftPlan'}>
            Save Next Shift Plan
          </SubmitButton>
        </div>
      </div>

      {/* Delays Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Delays {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
          <div className="disamatic-section-actions">
            {formData.delaysTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteDelaysRow(formData.delaysTable.length - 1)}
                disabled={!isPrimaryDataSaved}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
            <button type="button" onClick={addDelaysRow} disabled={!isPrimaryDataSaved} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Delays</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Duration (Minutes)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Duration (From - To)</th>
              </tr>
            </thead>
            <tbody>
              {formData.delaysTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 500, color: '#475569' }}>{delaysSNo + index}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.delays}
                      onChange={e => handleDelaysChange(index, 'delays', e.target.value)}
                      onKeyDown={e => handleDelaysKeyDown(e, index, 'delays')}
                      data-field={`${index}-delays-delays`}
                      placeholder="Delay reason"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorDelays(index, 'delays')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-delays-delays`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.25rem' }}>
                        <PlusButton
                          onClick={() => addDurationInput(index)}
                          title="Add entry"
                          disabled={row.durationMinutes.length >= 10}
                        />
                        {row.durationMinutes.length > 1 && (
                          <MinusButton
                            onClick={() => removeDurationInput(index, row.durationMinutes.length - 1)}
                            title="Remove entry"
                          />
                        )}
                      </div>
                      <div style={{ 
                        flex: 1,
                        display: 'grid', 
                        gridTemplateColumns: row.durationMinutes.length === 1 ? '1fr' : 'repeat(2, 1fr)', 
                        gap: '0.5rem' 
                      }}>
                        {row.durationMinutes.map((value, inputIndex) => (
                          <input
                            key={inputIndex}
                            type="text"
                            value={value}
                            onChange={e => {
                              const numValue = e.target.value.replace(/[^0-9]/g, '');
                              const limitedValue = numValue && parseInt(numValue) > 30 ? '30' : numValue;
                              handleDurationInputChange(index, inputIndex, limitedValue);
                            }}
                            onKeyDown={e => handleDelaysKeyDown(e, index, 'durationMinutes', inputIndex)}
                            data-field={`${index}-delays-durationMinutes-${inputIndex}`}
                            placeholder="0"
                            maxLength="2"
                            style={{ 
                              width: '100%', 
                              padding: '0.5rem', 
                              borderRadius: '4px', 
                              textAlign: 'center',
                              border: `2px solid ${getDurationInputBorderColor(index, inputIndex)}`,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={() => setFocusedField(`${index}-delays-durationMinutes-${inputIndex}`)}
                            onBlur={() => setFocusedField(null)}
                            disabled={!isPrimaryDataSaved}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: row.fromTime.length === 1 ? '1fr' : 'repeat(2, 1fr)', 
                      gap: '0.5rem',
                      alignItems: 'start'
                    }}>
                      {row.fromTime.map((fromValue, inputIndex) => (
                        <div key={inputIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <div data-field={`${index}-delays-fromTime-${inputIndex}`} style={{ flex: 1 }}>
                            <CustomTimeInput
                              value={createTimeFromString(fromValue)}
                              onChange={(timeObj) => handleTimeInputChange(index, inputIndex, 'fromTime', formatTimeToString(timeObj))}
                              hasError={delaysErrors[index]?.fromTime?.[inputIndex]}
                              onFocus={() => setFocusedField(`${index}-delays-fromTime-${inputIndex}`)}
                              onBlur={() => setFocusedField(null)}
                              onEnterPress={(e) => handleDelaysKeyDown(e, index, 'fromTime', inputIndex)}
                              aria-label="From Time"
                            />
                          </div>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>-</span>
                          <div data-field={`${index}-delays-toTime-${inputIndex}`} style={{ flex: 1 }}>
                            <CustomTimeInput
                              value={createTimeFromString(row.toTime[inputIndex])}
                              onChange={(timeObj) => handleTimeInputChange(index, inputIndex, 'toTime', formatTimeToString(timeObj))}
                              hasError={delaysErrors[index]?.toTime?.[inputIndex]}
                              onFocus={() => setFocusedField(`${index}-delays-toTime-${inputIndex}`)}
                              onBlur={() => setFocusedField(null)}
                              onEnterPress={(e) => handleDelaysKeyDown(e, index, 'toTime', inputIndex)}
                              aria-label="To Time"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          {delaysSubmitError && (
            <InlineLoader
              message={delaysSubmitError}
              variant={delaysSubmitError === MESSAGE_NOTHING_TO_SAVE ? 'primary' : 'danger'}
              size="medium"
            />
          )}
          {delaysSuccess && (
            <InlineLoader 
              message="Data added successfully!"
              variant="success"
              size="medium"
            />
          )}
          <SubmitButton onClick={handleSubmitDelays} disabled={!isPrimaryDataSaved} loading={savingSection === 'delays'}>
            Save Delays
          </SubmitButton>
        </div>
      </div>

      {/* Mould Hardness Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Mould Hardness {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
          <div className="disamatic-section-actions">
            {formData.mouldHardnessTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteMouldHardnessRow(formData.mouldHardnessTable.length - 1)}
                disabled={!isPrimaryDataSaved}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
            <button type="button" onClick={addMouldHardnessRow} disabled={!isPrimaryDataSaved} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle' }}>S.No</th>
                <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle' }}>Component Name</th>
                <th colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>Mould Penetrant tester (N/cm²)</th>
                <th colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>B - Scale</th>
                <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle' }}>Remarks</th>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>PP</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>SP</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>PP</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>SP</th>
              </tr>
            </thead>
            <tbody>
              {formData.mouldHardnessTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{mouldHardnessSNo + index}</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <PlusButton
                          onClick={() => addMouldHardnessPair(index)}
                          title="Add pair"
                        />
                        {row.mpPP.length > 1 && (
                          <MinusButton
                            onClick={() => removeMouldHardnessPair(index)}
                            title="Remove pair"
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <input
                      type="text"
                      className="disamatic-component-input"
                      value={row.componentName}
                      onChange={e => {
                        handleMouldHardnessChange(index, 'componentName', e.target.value);
                        const filtered = filterComponentSuggestions('mouldHardness', e.target.value);
                        const rect = e.target.getBoundingClientRect();
                        setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                        setFilteredComponentSuggestions(filtered);
                        setOpenComponentDropdown(filtered.length && e.target.value ? { table: 'mouldHardness', index } : null);
                      }}
                      onKeyDown={e => handleMouldHardnessKeyDown(e, index, 'componentName')}
                      data-field={`${index}-mouldHardness-componentName`}
                      placeholder="Component Name"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorMouldHardness(index, 'componentName')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => {
                        setFocusedField(`${index}-mouldHardness-componentName`);
                        if (row.componentName) {
                          const filtered = filterComponentSuggestions('mouldHardness', row.componentName);
                          const rect = e.target.getBoundingClientRect();
                          setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                          setFilteredComponentSuggestions(filtered);
                          setOpenComponentDropdown(filtered.length ? { table: 'mouldHardness', index } : null);
                        }
                      }}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                    {openComponentDropdown?.table === 'mouldHardness' && openComponentDropdown?.index === index && filteredComponentSuggestions.length > 0 && dropdownAnchor && createPortal(
                      <div
                        className="disamatic-component-suggestions"
                        style={{
                          position: 'fixed', left: dropdownAnchor.left, top: dropdownAnchor.top, width: dropdownAnchor.width,
                          backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px',
                          maxHeight: '150px', overflowY: 'auto', zIndex: 10000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {filteredComponentSuggestions.map((name, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleMouldHardnessChange(index, 'componentName', name);
                              setOpenComponentDropdown(null);
                            }}
                            style={{
                              padding: '8px 12px', cursor: 'pointer',
                              borderBottom: idx < filteredComponentSuggestions.length - 1 ? '1px solid #eee' : 'none',
                              backgroundColor: 'white'
                            }}
                            onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                          >
                            {name}
                          </div>
                        ))}
                      </div>,
                      document.body
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {row.mpPP.map((value, pairIdx) => (
                        <div key={pairIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleMouldHardnessChange(index, 'mpPP', cleanDecimalInput(e.target.value), pairIdx)}
                            onKeyDown={e => handleMouldHardnessKeyDown(e, index, 'mpPP', pairIdx)}
                            onBlur={e => {
                              const formatted = formatDecimal(e.target.value);
                              if (formatted !== e.target.value) {
                                handleMouldHardnessChange(index, 'mpPP', formatted, pairIdx);
                              }
                              setFocusedField(null);
                            }}
                            data-field={`${index}-mouldHardness-mpPP-${pairIdx}`}
                            placeholder="Value"
                            style={{
                              width: '90px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              textAlign: 'center',
                              border: `2px solid ${getReadingInputBorderColor(index, 'mpPP', pairIdx)}`,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={() => setFocusedField(`${index}-mouldHardness-mpPP-${pairIdx}`)}
                            disabled={!isPrimaryDataSaved}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {row.mpSP.map((value, pairIdx) => (
                        <div key={pairIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleMouldHardnessChange(index, 'mpSP', cleanDecimalInput(e.target.value), pairIdx)}
                            onKeyDown={e => handleMouldHardnessKeyDown(e, index, 'mpSP', pairIdx)}
                            onBlur={e => {
                              const formatted = formatDecimal(e.target.value);
                              if (formatted !== e.target.value) {
                                handleMouldHardnessChange(index, 'mpSP', formatted, pairIdx);
                              }
                              setFocusedField(null);
                            }}
                            data-field={`${index}-mouldHardness-mpSP-${pairIdx}`}
                            placeholder="Value"
                            style={{
                              width: '90px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              textAlign: 'center',
                              border: `2px solid ${getReadingInputBorderColor(index, 'mpSP', pairIdx)}`,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={() => setFocusedField(`${index}-mouldHardness-mpSP-${pairIdx}`)}
                            disabled={!isPrimaryDataSaved}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {row.bsPP.map((value, pairIdx) => (
                        <div key={pairIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleMouldHardnessChange(index, 'bsPP', cleanDecimalInput(e.target.value), pairIdx)}
                            onKeyDown={e => handleMouldHardnessKeyDown(e, index, 'bsPP', pairIdx)}
                            onBlur={e => {
                              const formatted = formatDecimal(e.target.value);
                              if (formatted !== e.target.value) {
                                handleMouldHardnessChange(index, 'bsPP', formatted, pairIdx);
                              }
                              setFocusedField(null);
                            }}
                            data-field={`${index}-mouldHardness-bsPP-${pairIdx}`}
                            placeholder="Value"
                            style={{
                              width: '90px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              textAlign: 'center',
                              border: `2px solid ${getReadingInputBorderColor(index, 'bsPP', pairIdx)}`,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={() => setFocusedField(`${index}-mouldHardness-bsPP-${pairIdx}`)}
                            disabled={!isPrimaryDataSaved}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {row.bsSP.map((value, pairIdx) => (
                        <div key={pairIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleMouldHardnessChange(index, 'bsSP', cleanDecimalInput(e.target.value), pairIdx)}
                            onKeyDown={e => handleMouldHardnessKeyDown(e, index, 'bsSP', pairIdx)}
                            onBlur={e => {
                              const formatted = formatDecimal(e.target.value);
                              if (formatted !== e.target.value) {
                                handleMouldHardnessChange(index, 'bsSP', formatted, pairIdx);
                              }
                              setFocusedField(null);
                            }}
                            data-field={`${index}-mouldHardness-bsSP-${pairIdx}`}
                            placeholder="Value"
                            style={{
                              width: '90px',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              textAlign: 'center',
                              border: `2px solid ${getReadingInputBorderColor(index, 'bsSP', pairIdx)}`,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={() => setFocusedField(`${index}-mouldHardness-bsSP-${pairIdx}`)}
                            disabled={!isPrimaryDataSaved}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleMouldHardnessChange(index, 'remarks', e.target.value)}
                      onKeyDown={e => handleMouldHardnessKeyDown(e, index, 'remarks')}
                      data-field={`${index}-mouldHardness-remarks`}
                      placeholder="Remarks"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorMouldHardness(index, 'remarks')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-mouldHardness-remarks`)}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          {mouldHardnessSubmitError && (
            <InlineLoader
              message={mouldHardnessSubmitError}
              variant={mouldHardnessSubmitError === MESSAGE_NOTHING_TO_SAVE ? 'primary' : 'danger'}
              size="medium"
            />
          )}
          {mouldHardnessSuccess && (
            <InlineLoader 
              message="Data added successfully!"
              variant="success"
              size="medium"
            />
          )}
          <SubmitButton onClick={handleSubmitMouldHardness} disabled={!isPrimaryDataSaved} loading={savingSection === 'mouldHardness'}>
            Save Mould Hardness
          </SubmitButton>
        </div>
      </div>

      {/* Pattern Temp Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Pattern Temperature {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
          <div className="disamatic-section-actions">
            {formData.patternTempTable.length > 1 && (
              <button
                type="button"
                onClick={() => deletePatternTempRow(formData.patternTempTable.length - 1)}
                disabled={!isPrimaryDataSaved}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
            <button type="button" onClick={addPatternTempRow} disabled={!isPrimaryDataSaved} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>PP</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>SP</th>
              </tr>
            </thead>
            <tbody>
              {formData.patternTempTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>{patternTempSNo + index}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      className="disamatic-component-input"
                      value={row.item}
                      onChange={e => {
                        handlePatternTempChange(index, 'item', e.target.value);
                        const filtered = filterComponentSuggestions('patternTemp', e.target.value);
                        const rect = e.target.getBoundingClientRect();
                        setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                        setFilteredComponentSuggestions(filtered);
                        setOpenComponentDropdown(filtered.length && e.target.value ? { table: 'patternTemp', index } : null);
                      }}
                      onKeyDown={e => handlePatternTempKeyDown(e, index, 'item')}
                      data-field={`${index}-patternTemp-item`}
                      placeholder="Item"
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorPatternTemp(index, 'item')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={e => {
                        setFocusedField(`${index}-patternTemp-item`);
                        if (row.item) {
                          const filtered = filterComponentSuggestions('patternTemp', row.item);
                          const rect = e.target.getBoundingClientRect();
                          setDropdownAnchor({ left: rect.left, top: rect.bottom, width: rect.width });
                          setFilteredComponentSuggestions(filtered);
                          setOpenComponentDropdown(filtered.length ? { table: 'patternTemp', index } : null);
                        }
                      }}
                      onBlur={() => setFocusedField(null)}
                      disabled={!isPrimaryDataSaved}
                    />
                    {openComponentDropdown?.table === 'patternTemp' && openComponentDropdown?.index === index && filteredComponentSuggestions.length > 0 && dropdownAnchor && createPortal(
                      <div
                        className="disamatic-component-suggestions"
                        style={{
                          position: 'fixed', left: dropdownAnchor.left, top: dropdownAnchor.top, width: dropdownAnchor.width,
                          backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px',
                          maxHeight: '150px', overflowY: 'auto', zIndex: 10000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {filteredComponentSuggestions.map((name, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handlePatternTempChange(index, 'item', name);
                              setOpenComponentDropdown(null);
                            }}
                            style={{
                              padding: '8px 12px', cursor: 'pointer',
                              borderBottom: idx < filteredComponentSuggestions.length - 1 ? '1px solid #eee' : 'none',
                              backgroundColor: 'white'
                            }}
                            onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                          >
                            {name}
                          </div>
                        ))}
                      </div>,
                      document.body
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.pp}
                      onChange={e => {
                        const value = cleanDecimalInput(e.target.value);
                        handlePatternTempChange(index, 'pp', value);
                      }}
                      onKeyDown={e => handlePatternTempKeyDown(e, index, 'pp')}
                      onBlur={e => {
                        const formatted = formatDecimal(e.target.value);
                        if (formatted !== e.target.value) {
                          handlePatternTempChange(index, 'pp', formatted);
                        }
                        setFocusedField(null);
                      }}
                      data-field={`${index}-patternTemp-pp`}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorPatternTemp(index, 'pp')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-patternTemp-pp`)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.sp}
                      onChange={e => {
                        const value = cleanDecimalInput(e.target.value);
                        handlePatternTempChange(index, 'sp', value);
                      }}
                      onKeyDown={e => handlePatternTempKeyDown(e, index, 'sp')}
                      onBlur={e => {
                        const formatted = formatDecimal(e.target.value);
                        if (formatted !== e.target.value) {
                          handlePatternTempChange(index, 'sp', formatted);
                        }
                        setFocusedField(null);
                      }}
                      data-field={`${index}-patternTemp-sp`}
                      placeholder="0"
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        border: `2px solid ${getBorderColorPatternTemp(index, 'sp')}`,
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={() => setFocusedField(`${index}-patternTemp-sp`)}
                      disabled={!isPrimaryDataSaved}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          {patternTempSubmitError && (
            <InlineLoader
              message={patternTempSubmitError}
              variant={patternTempSubmitError === MESSAGE_NOTHING_TO_SAVE ? 'primary' : 'danger'}
              size="medium"
            />
          )}
          {patternTempSuccess && (
            <InlineLoader 
              message="Data added successfully!"
              variant="success"
              size="medium"
            />
          )}
          <SubmitButton onClick={handleSubmitPatternTemp} disabled={!isPrimaryDataSaved} loading={savingSection === 'patternTemp'}>
            Save Pattern Temperature
          </SubmitButton>
        </div>
      </div>

      {/* Event Section */}
      <div className="disamatic-section">
        <h3 className="disamatic-section-title">
          Significant Events & Maintenance 
          {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}
          {isPrimaryDataSaved && isEventsSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#10b981' }}>(Saved)</span>}
        </h3>
        
        <div className="disamatic-form-grid" style={{ marginTop: '1rem' }}>
          <div className="disamatic-form-group full-width">
            <label>
              Significant Event :
              {lockedEventsFields.significantEvent && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>✓ Locked</span>}
            </label>
            <textarea
              value={formData.significantEvent}
              onChange={e => handleChange("significantEvent", e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const maintenanceTextarea = document.querySelector('textarea[placeholder="Enter maintenance details"]');
                  if (maintenanceTextarea && !maintenanceTextarea.disabled) maintenanceTextarea.focus();
                }
              }}
              placeholder="Enter any significant events"
              className="disamatic-textarea"
              rows={3}
              disabled={!isPrimaryDataSaved || lockedEventsFields.significantEvent}
            />
          </div>
          
          <div className="disamatic-form-group full-width">
            <label>
              Maintenance :
              {lockedEventsFields.maintenance && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>✓ Locked</span>}
            </label>
            <textarea
              value={formData.maintenance}
              onChange={e => handleChange("maintenance", e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const supervisorInput = document.querySelector('input[placeholder="Enter supervisor name"]');
                  if (supervisorInput && !supervisorInput.disabled) supervisorInput.focus();
                }
              }}
              placeholder="Enter maintenance details"
              className="disamatic-textarea"
              rows={3}
              disabled={!isPrimaryDataSaved || lockedEventsFields.maintenance}
            />
          </div>
          
          <div className="disamatic-form-group">
            <label>
              Supervisor Name :
              {lockedEventsFields.supervisorName && <span style={{ fontSize: '0.75rem', color: '#10b981', marginLeft: '0.5rem' }}>✓ Locked</span>}
            </label>
            <input
              type="text"
              value={formData.supervisorName}
              onChange={e => handleChange("supervisorName", e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitEvents();
                }
              }}
              placeholder="Enter supervisor name"
              disabled={!isPrimaryDataSaved || lockedEventsFields.supervisorName}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem', alignItems: 'center' }}>
          {eventsSubmitError && (
            <InlineLoader 
              message={eventsSubmitError}
              variant="danger"
              size="medium"
            />
          )}
          {eventsSuccess && (
            <InlineLoader 
              message="Data added successfully!"
              variant="success"
              size="medium"
            />
          )}
          <SubmitButton onClick={handleSubmitEvents} disabled={!isPrimaryDataSaved || isEventsSaved} loading={savingSection === 'events'}>
            Save Events
          </SubmitButton>
        </div>
      </div>
    </div>
  );
};

export default DisamaticProduct;
