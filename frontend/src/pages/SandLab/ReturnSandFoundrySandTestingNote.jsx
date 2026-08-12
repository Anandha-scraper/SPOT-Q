import React, { useState, useEffect, useRef } from "react";
import { Save, Loader2 } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { PlantDropdown, ShiftDropdown, LockPrimaryButton } from '../../Components/Buttons';
import Table from '../../Components/Table';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { InlineLoader } from '../../Components/InlineLoader';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { buildSubmitError } from '../../utils/formValidation';
import { validationRanges as returnSandValidationRanges } from '../../deviations/DreturnSandFoundrySandTestingNote';
import '../../styles/PageStyles/Sandlab/FoundarySandTestingNote.css';

const SectionSubmitIcon = ({ loading }) => (loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />);

const initialFormData = {
  date: "",
  shift: "",
  plant: "",
  clayTests: {
    test1: {
      totalClay: { input1: "", input2: "", input3: "", solution: "" },
      activeClay: { input1: "", input2: "", solution: "" },
      deadClay: { input1: "", input2: "", solution: "" },
      vcm: { input1: "", input2: "", input3: "", solution: "" },
      loi: { input1: "", input2: "", input3: "", solution: "" }
    },
    test2: {
      totalClay: { input1: "", input2: "", input3: "", solution: "" },
      activeClay: { input1: "", input2: "", solution: "" },
      deadClay: { input1: "", input2: "", solution: "" },
      vcm: { input1: "", input2: "", input3: "", solution: "" },
      loi: { input1: "", input2: "", input3: "", solution: "" }
    }
  },
  sieveTesting: {
    test1: {
      sieveSize: {
        1700: "", 850: "", 600: "", 425: "", 300: "", 212: "",
        150: "", 106: "", 75: "", pan: "", total: ""
      },
      mf: {
        5: "", 10: "", 20: "", 30: "", 50: "", 70: "",
        100: "", 140: "", 200: "", pan: "", total: ""
      }
    },
    test2: {
      sieveSize: {
        1700: "", 850: "", 600: "", 425: "", 300: "", 212: "",
        150: "", 106: "", 75: "", pan: "", total: ""
      },
      mf: {
        5: "", 10: "", 20: "", 30: "", 50: "", 70: "",
        100: "", 140: "", 200: "", pan: "", total: ""
      }
    }
  }
};

export default function ReturnSandFoundrySandTestingNote() {
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();
  const { isOpen: isInfoOpen, openModal: openInfoModal, closeModal: closeInfoModal } = useInfoModal();

  // Primary data (must be saved first)
  const [primaryData, setPrimaryData] = useState({
    date: "",
    shift: "",
    plant: "Eirich"
  });
  const [checkingData, setCheckingData] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);
  const [isPrimaryDataSaved, setIsPrimaryDataSaved] = useState(false);

  // Combination-fetch feedback (mirrors FoundarySandTestingNote.jsx)
  const [savePrimaryLoading, setSavePrimaryLoading] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationAdded, setShowCombinationAdded] = useState(false);

  // "Save Primary first" interaction (mirrors FoundarySandTestingNote.jsx)
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [highlightPrimaryFields, setHighlightPrimaryFields] = useState(false);
  const primarySectionRef = useRef(null);

  // Default the date to today on mount (still user-changeable)
  useEffect(() => {
    if (!primaryData.date) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setPrimaryData(prev => ({ ...prev, date: `${y}-${m}-${d}` }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch primary data when date, shift, or plant changes
  useEffect(() => {
    if (!primaryData.date || !primaryData.shift || !primaryData.plant) {
      setIsPrimaryDataSaved(false);
      setSavePrimaryLoading(false);
      setShowCombinationFound(false);
      setShowCombinationAdded(false);
      return;
    }
    fetchPrimaryData(primaryData.date, primaryData.shift, primaryData.plant);
  }, [primaryData.date, primaryData.shift, primaryData.plant]);

  // Before primary data is saved, clicking anywhere in a locked section flashes a
  // "save primary first" warning, highlights the primary fields, and scrolls up to them.
  const handleDisabledFieldClick = () => {
    setShowPrimaryWarning(true);
    setHighlightPrimaryFields(true);
    if (primarySectionRef.current) {
      primarySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      setShowPrimaryWarning(false);
      setHighlightPrimaryFields(false);
    }, 3000);
  };

  useEffect(() => {
    const handleLockedSectionClick = (e) => {
      if (isPrimaryDataSaved) return;
      const section = e.target.closest && e.target.closest('.foundry-section');
      if (section) {
        e.preventDefault();
        e.stopPropagation();
        handleDisabledFieldClick();
      }
    };

    document.addEventListener('mousedown', handleLockedSectionClick, true);
    return () => document.removeEventListener('mousedown', handleLockedSectionClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrimaryDataSaved]);

  // Fetch primary data from backend
  const fetchPrimaryData = async (date, shift, plant) => {
    try {
      setCheckingData(true);
      setSavePrimaryLoading(true);
      setShowCombinationFound(false);
      setShowCombinationAdded(false);
      const startTime = Date.now();
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const res = await fetch(`${API_ENDPOINTS.returnSandFoundrySandTestingNotes}?startDate=${encodeURIComponent(dateStr)}&endDate=${encodeURIComponent(dateStr)}`, { credentials: 'include' });
      const response = await res.json();

      let record = null;
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        record = response.data.find(entry => entry.shift === shift && entry.plant === plant) || null;
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setSavePrimaryLoading(false);

      // Always rebuild sectionData from the blank shape and overlay only this
      // combination's own saved leaves — never merge on top of whatever the
      // previously-selected combination left in state, or its data leaks through.
      const locks = { clayTests: {}, sieveTesting: {} };

      if (record?.clayTests) {
        Object.keys(record.clayTests).forEach(test => {
          Object.keys(record.clayTests[test]).forEach(param => {
            Object.keys(record.clayTests[test][param] || {}).forEach(field => {
              const value = record.clayTests[test][param][field];
              if (value && String(value).trim() !== '') {
                locks.clayTests[`${test}.${param}.${field}`] = true;
              }
            });
          });
        });
      }

      if (record?.sieveTesting) {
        ['test1', 'test2'].forEach(test => {
          Object.keys(record.sieveTesting[test]?.sieveSize || {}).forEach(size => {
            const value = record.sieveTesting[test].sieveSize[size];
            if (value && String(value).trim() !== '') locks.sieveTesting[`${test}.sieveSize.${size}`] = true;
          });
          Object.keys(record.sieveTesting[test]?.mf || {}).forEach(mf => {
            const value = record.sieveTesting[test].mf[mf];
            if (value && String(value).trim() !== '') locks.sieveTesting[`${test}.mf.${mf}`] = true;
          });
        });
      }

      setSectionData({
        clayTests: {
          test1: { ...initialFormData.clayTests.test1, ...(record?.clayTests?.test1 || {}) },
          test2: { ...initialFormData.clayTests.test2, ...(record?.clayTests?.test2 || {}) }
        },
        sieveTesting: {
          test1: {
            sieveSize: { ...initialFormData.sieveTesting.test1.sieveSize, ...(record?.sieveTesting?.test1?.sieveSize || {}) },
            mf: { ...initialFormData.sieveTesting.test1.mf, ...(record?.sieveTesting?.test1?.mf || {}) }
          },
          test2: {
            sieveSize: { ...initialFormData.sieveTesting.test2.sieveSize, ...(record?.sieveTesting?.test2?.sieveSize || {}) },
            mf: { ...initialFormData.sieveTesting.test2.mf, ...(record?.sieveTesting?.test2?.mf || {}) }
          }
        }
      });
      setFieldLocks(locks);

      if (record) {
        setPrimaryId(record._id || null);
        setShowCombinationFound(true);
        setTimeout(() => setShowCombinationFound(false), 1500);
        setIsPrimaryDataSaved(true);
      } else {
        setPrimaryId(null);
        setIsPrimaryDataSaved(false);
      }
    } catch (error) {
      console.error('Error fetching primary data:', error);
      setPrimaryId(null);
      setIsPrimaryDataSaved(false);
      setSavePrimaryLoading(false);
    } finally {
      setCheckingData(false);
    }
  };

  // Field locks for section data (not primary)
  const [fieldLocks, setFieldLocks] = useState({
    clayTests: {},
    sieveTesting: {}
  });

  const isFieldLocked = (section, fieldPath) => {
    const locks = fieldLocks[section];
    if (!locks) return false;
    return locks[fieldPath] === true;
  };

  // Other sections data
  const [sectionData, setSectionData] = useState({
    clayTests: {
      test1: {
        totalClay: { input1: "", input2: "", input3: "", solution: "" },
        activeClay: { input1: "", input2: "", solution: "" },
        deadClay: { input1: "", input2: "", solution: "" },
        vcm: { input1: "", input2: "", input3: "", solution: "" },
        loi: { input1: "", input2: "", input3: "", solution: "" }
      },
      test2: {
        totalClay: { input1: "", input2: "", input3: "", solution: "" },
        activeClay: { input1: "", input2: "", solution: "" },
        deadClay: { input1: "", input2: "", solution: "" },
        vcm: { input1: "", input2: "", input3: "", solution: "" },
        loi: { input1: "", input2: "", input3: "", solution: "" }
      }
    },
    sieveTesting: {
      test1: {
        sieveSize: {
          1700: "", 850: "", 600: "", 425: "", 300: "", 212: "",
          150: "", 106: "", 75: "", pan: "", total: ""
        },
        mf: {
          5: "", 10: "", 20: "", 30: "", 50: "", 70: "",
          100: "", 140: "", 200: "", pan: "", total: ""
        }
      },
      test2: {
        sieveSize: {
          1700: "", 850: "", 600: "", 425: "", 300: "", 212: "",
          150: "", 106: "", 75: "", pan: "", total: ""
        },
        mf: {
          5: "", 10: "", 20: "", 30: "", 50: "", 70: "",
          100: "", 140: "", 200: "", pan: "", total: ""
        }
      }
    }
  });

  const [loadingStates, setLoadingStates] = useState({
    primary: false,
    clayParameters: false,
    sieveTesting: false
  });
  // Inline save outcome per section, shown via InlineLoader instead of alert().
  const [primaryMessage, setPrimaryMessage] = useState(null);
  const [sectionMessages, setSectionMessages] = useState({});

  // Refs for submit buttons
  const clayParametersSubmitRef = useRef(null);
  const sieveTestingSubmitRef = useRef(null);

  // Refs for first inputs of each section
  const clayParametersFirstInputRef = useRef(null);
  const sieveTestingFirstInputRef = useRef(null);

  // Handle Enter key navigation for inputs
  const handleKeyDown = (e, submitButtonRef, firstInputRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const form = e.target.closest('.foundry-section');
      if (!form) return;

      const inputs = Array.from(form.querySelectorAll('input:not([disabled]), textarea:not([disabled]), select:not([disabled])'));
      const currentInputIndex = inputs.indexOf(e.target);

      if (currentInputIndex < inputs.length - 1) {
        inputs[currentInputIndex + 1].focus();
        return;
      }

      if (submitButtonRef && submitButtonRef.current) {
        submitButtonRef.current.focus();
      }
    }
  };

  const handleSubmitButtonKeyDown = (e, submitHandler) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitHandler();
    }
  };

  // Handle primary data submission
  const handlePrimarySubmit = async () => {
    if (!primaryData.date || !primaryData.shift) {
      return;
    }

    setPrimaryMessage(null);

    try {
      setLoadingStates(prev => ({ ...prev, primary: true }));

      const payload = {
        date: primaryData.date,
        shift: primaryData.shift,
        plant: primaryData.plant,
        section: 'primary'
      };

      const res = await fetch(API_ENDPOINTS.returnSandFoundrySandTestingNotes, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const response = await res.json();

      if (response.success) {
        setPrimaryId(response.data?._id || null);
        setShowCombinationAdded(true);
        setTimeout(() => setShowCombinationAdded(false), 1500);
        setIsPrimaryDataSaved(true);
      } else {
        setPrimaryMessage({ text: response.message || 'Failed to save primary data.', variant: 'danger' });
      }
    } catch (error) {
      console.error('Error saving primary data:', error);
      setPrimaryMessage({ text: buildSubmitError(error.response?.data), variant: 'danger' });
    } finally {
      setLoadingStates(prev => ({ ...prev, primary: false }));
    }
  };

  const handlePrimaryChange = (field, value) => {
    setPrimaryData(prev => ({ ...prev, [field]: value }));
  };

  // Handle section data changes
  const handleInputChange = (section, field, value, subField = null, subSubField = null) => {
    if (subSubField) {
      setSectionData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: {
            ...prev[section][field],
            [subField]: {
              ...prev[section][field][subField],
              [subSubField]: value
            }
          }
        }
      }));
    } else if (subField) {
      setSectionData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: {
            ...prev[section][field],
            [subField]: value
          }
        }
      }));
    } else if (field) {
      setSectionData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setSectionData(prev => ({
        ...prev,
        [section]: value
      }));
    }
  };

  const calculateClaySolution = (param, testNum, changedField = null, changedValue = null) => {
    const testData = sectionData.clayTests[testNum]?.[param];
    if (!testData) return "";

    const data = { ...testData };
    if (changedField) data[changedField] = changedValue;

    if (param === "activeClay") {
      const input1 = parseFloat(data.input1);
      const input2 = parseFloat(data.input2);
      if (isNaN(input1) || isNaN(input2)) return "";
      return (input1 * input2).toFixed(2);
    } else if (param === "deadClay") {
      const input1 = parseFloat(data.input1);
      const input2 = parseFloat(data.input2);
      if (isNaN(input1) || isNaN(input2)) return "";
      return (input1 - input2).toFixed(2);
    } else {
      const input1 = parseFloat(data.input1);
      const input2 = parseFloat(data.input2);
      const input3 = parseFloat(data.input3);
      if (isNaN(input1) || isNaN(input2) || isNaN(input3) || input3 === 0) return "";
      return (((input1 - input2) / input3) * 100).toFixed(2);
    }
  };

  // Helper function to filter out empty values from nested objects
  const filterEmptyValues = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => filterEmptyValues(item));
    }

    const filtered = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.trim() !== '') {
          filtered[key] = value;
        } else if (typeof value === 'object') {
          const filteredNested = filterEmptyValues(value);
          if (Object.keys(filteredNested).length > 0) {
            filtered[key] = filteredNested;
          }
        } else if (value !== '' && value !== 0) {
          filtered[key] = value;
        }
      }
    });
    return filtered;
  };

  // Handle section-wise submissions - only send fields that have data
  const handleSectionSubmit = async (sectionName) => {
    if (!primaryData.date) {
      setSectionMessages(prev => ({ ...prev, [sectionName]: { text: 'Please enter a date first.', variant: 'danger' } }));
      return;
    }

    setSectionMessages(prev => ({ ...prev, [sectionName]: null }));

    try {
      setLoadingStates(prev => ({ ...prev, [sectionName]: true }));

      let sectionPayload = {};

      if (sectionName === 'clayParameters') {
        sectionPayload.clayTests = filterEmptyValues(sectionData.clayTests);
      } else if (sectionName === 'sieveTesting') {
        sectionPayload.sieveTesting = filterEmptyValues(sectionData.sieveTesting);
        // Persist the auto-computed column totals (filterEmptyValues drops the manual 'total' fields)
        [['test1', 'sieveSize'], ['test2', 'sieveSize'], ['test1', 'mf'], ['test2', 'mf']].forEach(([testNum, group]) => {
          const total = sumSieveColumn(testNum, group);
          if (total !== '') {
            sectionPayload.sieveTesting[testNum] = sectionPayload.sieveTesting[testNum] || {};
            sectionPayload.sieveTesting[testNum][group] = sectionPayload.sieveTesting[testNum][group] || {};
            sectionPayload.sieveTesting[testNum][group].total = total;
          }
        });
      }

      const payload = {
        ...primaryData, // Include all primary data
        section: sectionName,
        ...sectionPayload
      };

      const res = await fetch(API_ENDPOINTS.returnSandFoundrySandTestingNotes, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const response = await res.json();

      if (response.success) {
        setSectionMessages(prev => ({
          ...prev,
          [sectionName]: {
            text: `${sectionName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} saved successfully!`,
            variant: 'success'
          }
        }));
        setTimeout(() => {
          setSectionMessages(prev => ({ ...prev, [sectionName]: null }));
        }, 2000);
        // Refresh all locks from database
        if (primaryData.date && primaryData.shift && primaryData.plant) {
          await fetchPrimaryData(primaryData.date, primaryData.shift, primaryData.plant);
        }
      } else {
        setSectionMessages(prev => ({ ...prev, [sectionName]: { text: response.message || 'Failed to save.', variant: 'danger' } }));
        setTimeout(() => {
          setSectionMessages(prev => ({ ...prev, [sectionName]: null }));
        }, 2000);
      }
    } catch (error) {
      console.error(`Error saving ${sectionName}:`, error);
      setSectionMessages(prev => ({ ...prev, [sectionName]: { text: buildSubmitError(error.response?.data), variant: 'danger' } }));
      setTimeout(() => {
        setSectionMessages(prev => ({ ...prev, [sectionName]: null }));
      }, 2000);
    } finally {
      setLoadingStates(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const sieveData = [
    { size: 1700, mf: 5 },
    { size: 850, mf: 10 },
    { size: 600, mf: 20 },
    { size: 425, mf: 30 },
    { size: 300, mf: 40 },
    { size: 212, mf: 50 },
    { size: 150, mf: 70 },
    { size: 106, mf: 100 },
    { size: 75, mf: 140 },
    { size: 53, mf: 200 },
    { size: "Pan", mf: 300 },
  ];

  // === Column definitions for reusable Table component ===
  const clayColumns = [
    { key: 'parameter', label: 'Parameter', width: '180px', align: 'center' },
    { key: 'test1', label: 'TEST-1', align: 'center' },
    { key: 'test2', label: 'TEST-2', align: 'center' }
  ];

  const sieveColumns = [
    { key: 'sieveSize', label: 'Sieve Size (Mic)', width: '120px', align: 'center' },
    { key: 'wtTest1', label: '% Wt Retained - TEST-1', align: 'center' },
    { key: 'wtTest2', label: '% Wt Retained - TEST-2', align: 'center' },
    { key: 'mf', label: 'MF', width: '80px', align: 'center' },
    { key: 'prodTest1', label: 'Product - TEST-1', align: 'center' },
    { key: 'prodTest2', label: 'Product - TEST-2', align: 'center' }
  ];

  // === Clay Parameters config ===
  const clayParamKeys = ["totalClay", "activeClay", "deadClay", "vcm", "loi"];
  const clayParamLabels = ["Total Clay", "Active Clay", "Dead Clay", "VCM", "LOI"];

  const renderClayCell = (rowIndex, colIndex, colKey) => {
    const param = clayParamKeys[rowIndex];
    if (colKey === 'parameter') {
      return <strong style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#1e293b' }}>{clayParamLabels[rowIndex]}</strong>;
    }
    const testNum = colKey;
    const isSimple = param === "activeClay" || param === "deadClay";
    if (isSimple) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            ref={param === "activeClay" && testNum === "test1" ? clayParametersFirstInputRef : null}
            type="number"
            step="0.01"
            placeholder="Input 1"
            value={sectionData.clayTests[testNum][param]?.input1 || ''}
            disabled={!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input1`)}
            onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
            onChange={(e) => {
              const val = e.target.value;
              handleInputChange("clayTests", testNum, val, param, "input1");
              const solution = calculateClaySolution(param, testNum, "input1", val);
              handleInputChange("clayTests", testNum, solution, param, "solution");
            }}
            style={{
              width: '80px',
              padding: '0.375rem',
              backgroundColor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input1`)) ? '#f1f5f9' : '#ffffff',
              cursor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input1`)) ? 'not-allowed' : 'text'
            }}
          />
          <span>{param === "activeClay" ? "x" : "-"}</span>
          <input
            type="number"
            step="0.01"
            placeholder="Input 2"
            value={sectionData.clayTests[testNum][param]?.input2 || ''}
            disabled={!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input2`)}
            onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
            onChange={(e) => {
              const val = e.target.value;
              handleInputChange("clayTests", testNum, val, param, "input2");
              const solution = calculateClaySolution(param, testNum, "input2", val);
              handleInputChange("clayTests", testNum, solution, param, "solution");
            }}
            style={{
              width: '80px',
              padding: '0.375rem',
              backgroundColor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input2`)) ? '#f1f5f9' : '#ffffff',
              cursor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input2`)) ? 'not-allowed' : 'text'
            }}
          />
          <span>=</span>
          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>
            {sectionData.clayTests[testNum][param]?.solution || '0'}%
          </span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="number"
          step="0.01"
          placeholder="Input 1"
          value={sectionData.clayTests[testNum][param]?.input1 || ''}
          disabled={!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input1`)}
          onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
          onChange={(e) => {
            const val = e.target.value;
            handleInputChange("clayTests", testNum, val, param, "input1");
            const solution = calculateClaySolution(param, testNum, "input1", val);
            handleInputChange("clayTests", testNum, solution, param, "solution");
          }}
          style={{
            width: '70px',
            padding: '0.375rem',
            backgroundColor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input1`)) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input1`)) ? 'not-allowed' : 'text'
          }}
        />
        <span>-</span>
        <input
          type="number"
          step="0.01"
          placeholder="Input 2"
          value={sectionData.clayTests[testNum][param]?.input2 || ''}
          disabled={!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input2`)}
          onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
          onChange={(e) => {
            const val = e.target.value;
            handleInputChange("clayTests", testNum, val, param, "input2");
            const solution = calculateClaySolution(param, testNum, "input2", val);
            handleInputChange("clayTests", testNum, solution, param, "solution");
          }}
          style={{
            width: '70px',
            padding: '0.375rem',
            backgroundColor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input2`)) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input2`)) ? 'not-allowed' : 'text'
          }}
        />
        <span>/</span>
        <input
          type="number"
          step="0.01"
          placeholder="Input 3"
          value={sectionData.clayTests[testNum][param]?.input3 || ''}
          disabled={!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input3`)}
          onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
          onChange={(e) => {
            const val = e.target.value;
            handleInputChange("clayTests", testNum, val, param, "input3");
            const solution = calculateClaySolution(param, testNum, "input3", val);
            handleInputChange("clayTests", testNum, solution, param, "solution");
          }}
          style={{
            width: '70px',
            padding: '0.375rem',
            backgroundColor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input3`)) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || isFieldLocked('clayTests', `${testNum}.${param}.input3`)) ? 'not-allowed' : 'text'
          }}
        />
        <span>x 100 =</span>
        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>
          {sectionData.clayTests[testNum][param]?.solution || '0'}%
        </span>
      </div>
    );
  };

  // === Sieve Testing config ===
  // Total for a column is auto-computed as the numeric sum of that column's sieve rows.
  const sumSieveColumn = (testNum, group) => {
    const src = sectionData.sieveTesting?.[testNum]?.[group] || {};
    let sum = 0;
    let hasAny = false;
    sieveData.forEach((r) => {
      const key = group === 'mf' ? r.mf : r.size;
      const n = parseFloat(src[key]);
      if (!isNaN(n)) { sum += n; hasAny = true; }
    });
    if (!hasAny) return '';
    return Number.isInteger(sum) ? String(sum) : String(parseFloat(sum.toFixed(2)));
  };

  const renderSieveTotalCell = (testNum, group) => (
    <input
      type="text"
      readOnly
      disabled
      tabIndex={-1}
      value={sumSieveColumn(testNum, group)}
      placeholder="Total"
      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 700 }}
    />
  );

  const renderSieveCell = (rowIndex, colIndex, colKey) => {
    const isTotal = rowIndex === sieveData.length;
    const row = isTotal ? null : sieveData[rowIndex];
    const sizeKey = isTotal ? 'total' : row.size;
    const mfKey = isTotal ? 'total' : row.mf;

    if (colKey === 'sieveSize') {
      return <strong style={{ fontWeight: isTotal ? 700 : 600, color: '#1e293b' }}>{isTotal ? 'Total' : row.size}</strong>;
    }
    if (colKey === 'mf') {
      return <strong style={{ fontWeight: isTotal ? 700 : 600, color: '#1e293b' }}>{isTotal ? 'Total' : row.mf}</strong>;
    }
    if (colKey === 'wtTest1') {
      if (isTotal) return renderSieveTotalCell('test1', 'sieveSize');
      const locked = isFieldLocked('sieveTesting', `test1.sieveSize.${sizeKey}`);
      return (
        <input
          type="text"
          placeholder="Enter %"
          value={sectionData.sieveTesting?.test1?.sieveSize?.[sizeKey] || ''}
          onChange={(e) => handleInputChange("sieveTesting", "test1", e.target.value, "sieveSize", sizeKey)}
          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
          disabled={!isPrimaryDataSaved || locked}
          readOnly={locked}
          ref={rowIndex === 0 ? sieveTestingFirstInputRef : null}
          style={{
            backgroundColor: (!isPrimaryDataSaved || locked) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || locked) ? 'not-allowed' : 'text'
          }}
        />
      );
    }
    if (colKey === 'wtTest2') {
      if (isTotal) return renderSieveTotalCell('test2', 'sieveSize');
      const locked = isFieldLocked('sieveTesting', `test2.sieveSize.${sizeKey}`);
      return (
        <input
          type="text"
          placeholder="Enter %"
          value={sectionData.sieveTesting?.test2?.sieveSize?.[sizeKey] || ''}
          onChange={(e) => handleInputChange("sieveTesting", "test2", e.target.value, "sieveSize", sizeKey)}
          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
          disabled={!isPrimaryDataSaved || locked}
          readOnly={locked}
          style={{
            backgroundColor: (!isPrimaryDataSaved || locked) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || locked) ? 'not-allowed' : 'text'
          }}
        />
      );
    }
    if (colKey === 'prodTest1') {
      if (isTotal) return renderSieveTotalCell('test1', 'mf');
      const locked = isFieldLocked('sieveTesting', `test1.mf.${mfKey}`);
      return (
        <input
          type="text"
          placeholder="Product"
          value={sectionData.sieveTesting?.test1?.mf?.[mfKey] || ''}
          onChange={(e) => handleInputChange("sieveTesting", "test1", e.target.value, "mf", mfKey)}
          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
          disabled={!isPrimaryDataSaved || locked}
          readOnly={locked}
          style={{
            backgroundColor: (!isPrimaryDataSaved || locked) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || locked) ? 'not-allowed' : 'text'
          }}
        />
      );
    }
    if (colKey === 'prodTest2') {
      if (isTotal) return renderSieveTotalCell('test2', 'mf');
      const locked = isFieldLocked('sieveTesting', `test2.mf.${mfKey}`);
      return (
        <input
          type="text"
          placeholder="Product"
          value={sectionData.sieveTesting?.test2?.mf?.[mfKey] || ''}
          onChange={(e) => handleInputChange("sieveTesting", "test2", e.target.value, "mf", mfKey)}
          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
          disabled={!isPrimaryDataSaved || locked}
          readOnly={locked}
          style={{
            backgroundColor: (!isPrimaryDataSaved || locked) ? '#f1f5f9' : '#ffffff',
            cursor: (!isPrimaryDataSaved || locked) ? 'not-allowed' : 'text'
          }}
        />
      );
    }
    return null;
  };

  return (
    <div className="page-wrapper" ref={gridRef} onKeyDown={handleArrowKeyDown}>
      {/* Header */}
      <div className="foundry-header">
        <div className="foundry-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Return Sand Foundry Sand Testing Note
            <InfoIcon onClick={openInfoModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {primaryData.date ? (() => {
            const [y, m, d] = primaryData.date.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      <InfoCard
        isOpen={isInfoOpen}
        onClose={closeInfoModal}
        title="Return Sand Foundry Sand Testing Note — Validation Ranges & Field Guide"
        validationRanges={returnSandValidationRanges}
      />

      {/* Primary Section */}
      <h3 className="foundry-section-title">Primary</h3>
      <div className={`foundry-form-grid${highlightPrimaryFields ? ' primary-highlight' : ''}`} >
        <div className="foundry-form-group foundry-form-group--narrow">
          <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
          <CustomDatePicker
            value={primaryData.date}
            onChange={(e) => handlePrimaryChange("date", e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="foundry-form-group foundry-form-group--narrow">
          <label>Shift <span style={{ color: '#ef4444' }}>*</span></label>
          <ShiftDropdown
            value={primaryData.shift}
            onChange={(e) => handlePrimaryChange("shift", e.target.value)}
          />
        </div>
        <div className="foundry-form-group foundry-form-group--narrow" style={{ minHeight: 'auto' }}>
          <label>Plant <span style={{ color: '#ef4444' }}>*</span></label>
          <PlantDropdown
            value={primaryData.plant}
            onChange={(e) => handlePrimaryChange("plant", e.target.value)}
            name="plant"
            disabled={!primaryData.date || !primaryData.shift}
          />
        </div>
        <div className="foundry-form-group">
          <label>&nbsp;</label>
          <LockPrimaryButton
            onClick={handlePrimarySubmit}
            disabled={!primaryData.date || !primaryData.shift || !primaryData.plant || isPrimaryDataSaved}
            isLocked={isPrimaryDataSaved}
            statusMessage={
              (checkingData || savePrimaryLoading) ? 'Fetching Date, Shift, Plant'
                : showCombinationFound ? 'Combination found'
                : loadingStates.primary ? 'Saving...'
                : showCombinationAdded ? 'Combination Added'
                : null
            }
            statusVariant={(checkingData || savePrimaryLoading || loadingStates.primary) ? 'primary' : 'success'}
          />
          {(showPrimaryWarning || primaryMessage) && (
            <div style={{ marginTop: '0.5rem' }}>
              {showPrimaryWarning && (
                <InlineLoader message="Save Date, Shift, Plant first" size="medium" variant="danger" />
              )}
              {primaryMessage && (
                <InlineLoader message={primaryMessage.text} variant={primaryMessage.variant} size="medium" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clay Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Clay Parameters {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
        <Table
          template
          bordered
          rows={5}
          minWidth={800}
          columns={clayColumns}
          renderCell={renderClayCell}
        />
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {sectionMessages.clayParameters && (
          <InlineLoader message={sectionMessages.clayParameters.text} variant={sectionMessages.clayParameters.variant} size="medium" />
        )}
        <button
          ref={clayParametersSubmitRef}
          type="button"
          onClick={() => handleSectionSubmit('clayParameters')}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('clayParameters'))}
          disabled={!isPrimaryDataSaved || loadingStates.clayParameters}
          className="foundry-submit-btn"
        >
          <SectionSubmitIcon loading={loadingStates.clayParameters} />
          {loadingStates.clayParameters ? 'Saving...' : 'Save Clay Parameters'}
        </button>
      </div>
      </div>

      {/* Sieve Testing */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sieve Testing {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
        <Table
          template
          bordered
          rows={sieveData.length + 1}
          minWidth={900}
          columns={sieveColumns}
          renderCell={renderSieveCell}
        />
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {sectionMessages.sieveTesting && (
          <InlineLoader message={sectionMessages.sieveTesting.text} variant={sectionMessages.sieveTesting.variant} size="medium" />
        )}
        <button
          ref={sieveTestingSubmitRef}
          type="button"
          onClick={() => handleSectionSubmit('sieveTesting')}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('sieveTesting'))}
          disabled={!isPrimaryDataSaved || loadingStates.sieveTesting}
          className="foundry-submit-btn"
        >
          <SectionSubmitIcon loading={loadingStates.sieveTesting} />
          {loadingStates.sieveTesting ? 'Saving...' : 'Save Sieve Testing'}
        </button>
      </div>
      </div>
    </div>
  );
}
