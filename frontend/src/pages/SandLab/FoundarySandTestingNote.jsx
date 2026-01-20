import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, FileText, Loader2, RotateCcw } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Loader from '../../Components/Loader';
import '../../styles/PageStyles/Sandlab/FoundarySandTestingNote.css';
import '../../styles/PageStyles/Sandlab/SandTestingRecord.css';

const initialFormData = {
  date: new Date().toISOString().split('T')[0],
  shift: "",
  sandPlant: "",
  compactibilitySetting: "",
  shearStrengthSetting: "",
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
  },
  parameters: {
    test1: {
      compactability: "",
      permeability: "",
      gcs: "",
      wts: "",
      moisture: "",
      bentonite: "",
      coalDust: "",
      hopperLevel: "",
      shearStrength: "",
      dustCollectorSettings: "",
      returnSandMoisture: ""
    },
    test2: {
      compactability: "",
      permeability: "",
      gcs: "",
      wts: "",
      moisture: "",
      bentonite: "",
      coalDust: "",
      hopperLevel: "",
      shearStrength: "",
      dustCollectorSettings: "",
      returnSandMoisture: ""
    }
  },
  additionalData: {
    test1: { afsNo: "", fines: "", gd: "" },
    test2: { afsNo: "", fines: "", gd: "" }
  },
  remarks: ""
};

export default function FoundrySandTestingNote() {
  const navigate = useNavigate();
  
  // Primary data (must be saved first)
  const [primaryData, setPrimaryData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: "",
    sandPlant: "",
    compactibilitySetting: "",
    shearStrengthSetting: ""
  });
  const [checkingData, setCheckingData] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);

  // Check if there's data for the specific date+shift combination and lock shift dropdown
  const checkAndLockByDateAndShift = async (date, shift) => {
    if (!date || !shift) {
      // If date or shift is not set, unlock shift (unless primaryId exists)
      if (!primaryId) {
        setFieldLocks(prev => ({
          ...prev,
          primary: {
            ...prev.primary,
            shift: false
          }
        }));
      }
      return;
    }
    
    try {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const res = await fetch(`http://localhost:5000/api/v1/foundry-sand-testing-notes?startDate=${dateStr}&endDate=${dateStr}`, { credentials: 'include' });
      const response = await res.json();
      
      if (response.success && response.data && response.data.length > 0) {
        // Check if any entry has the same date AND shift
        const hasDataForShift = response.data.some(entry => {
          const entryShift = entry.shift;
          return entryShift === shift;
        });
        
        if (hasDataForShift) {
          // Data exists for this date+shift combination, lock shift dropdown
          setFieldLocks(prev => ({
            ...prev,
            primary: {
              ...prev.primary,
              shift: true
            }
          }));
        } else {
          // No data for this date+shift combination, unlock shift (unless primaryId exists)
          if (!primaryId) {
            setFieldLocks(prev => ({
              ...prev,
              primary: {
                ...prev.primary,
                shift: false
              }
            }));
          }
        }
      } else {
        // No data for this date, unlock shift (unless primaryId exists)
        if (!primaryId) {
          setFieldLocks(prev => ({
            ...prev,
            primary: {
              ...prev.primary,
              shift: false
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error checking existing data for date and shift:', error);
    }
  };

  // Check for existing data when date or shift changes
  useEffect(() => {
    if (primaryData.date && primaryData.shift) {
      checkAndLockByDateAndShift(primaryData.date, primaryData.shift);
    } else if (!primaryData.date || !primaryData.shift) {
      // Clear shift lock when date or shift is cleared (unless primaryId exists)
      if (!primaryId) {
        setFieldLocks(prev => ({
          ...prev,
          primary: {
            ...prev.primary,
            shift: false
          }
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryData.date, primaryData.shift]);

  // Field locks for all sections
  const [fieldLocks, setFieldLocks] = useState({
    primary: {
      date: false,
      shift: false,
      sandPlant: false,
      compactibilitySetting: false,
      shearStrengthSetting: false
    },
    clayTests: {},
    sieveTesting: {},
    parameters: {},
    additionalData: {},
    remarks: false
  });

  // Helper function to check if a field is locked
  const isFieldLocked = (section, fieldPath) => {
    if (section === 'primary') {
      return fieldLocks.primary[fieldPath] === true;
    }
    const locks = fieldLocks[section];
    if (!locks) return false;
    return locks[fieldPath] === true;
  };

  // Check if data exists for date - checks all sections
  const checkExistingData = async (date) => {
    if (!date) {
      setFieldLocks({
        primary: {
          date: false,
          shift: false,
          sandPlant: false,
          compactibilitySetting: false,
          shearStrengthSetting: false
        },
        clayTests: {},
        sieveTesting: {},
        parameters: {},
        additionalData: {},
        remarks: false
      });
      // Clear all data except date
      setPrimaryData(prev => ({
        ...prev,
        shift: "",
        sandPlant: "",
        compactibilitySetting: "",
        shearStrengthSetting: ""
      }));
      setSectionData({
        clayTests: initialFormData.clayTests,
        sieveTesting: initialFormData.sieveTesting,
        parameters: initialFormData.parameters,
        additionalData: initialFormData.additionalData,
        remarks: ""
      });
      return;
    }

    try {
      setCheckingData(true);
      // Get all entries for this date
      const res = await fetch(`http://localhost:5000/api/v1/foundry-sand-testing-notes?startDate=${encodeURIComponent(date)}&endDate=${encodeURIComponent(date)}`, { credentials: 'include' });
      const response = await res.json();
      
      let record = null;
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        record = response.data[0];
        setPrimaryId(record._id || null);
      } else {
        setPrimaryId(null);
      }
      
      if (record) {
        const locks = {
          primary: {
            date: false, // Date is always editable
            shift: false,
            sandPlant: false,
            compactibilitySetting: false,
            shearStrengthSetting: false
          },
          clayTests: {},
          sieveTesting: {},
          parameters: {},
          additionalData: {},
          remarks: false
        };
        
        // Lock and populate primary data - only lock fields that have actual data
        if (record.shift && record.shift.trim() !== '') {
          locks.primary.shift = true;
          setPrimaryData(prev => ({ ...prev, shift: String(record.shift) }));
        }
        if (record.sandPlant && record.sandPlant.trim() !== '') {
          locks.primary.sandPlant = true;
          setPrimaryData(prev => ({ ...prev, sandPlant: String(record.sandPlant) }));
        }
        if (record.compactibilitySetting && record.compactibilitySetting.trim() !== '') {
          locks.primary.compactibilitySetting = true;
          setPrimaryData(prev => ({ ...prev, compactibilitySetting: String(record.compactibilitySetting) }));
        }
        if (record.shearStrengthSetting && record.shearStrengthSetting.trim() !== '') {
          locks.primary.shearStrengthSetting = true;
          setPrimaryData(prev => ({ ...prev, shearStrengthSetting: String(record.shearStrengthSetting) }));
        }
        
        // Lock and populate section data - only lock fields that have actual data
        if (record.clayTests) {
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
          setSectionData(prev => ({ 
            ...prev, 
            clayTests: {
              test1: {
                ...prev.clayTests?.test1,
                ...record.clayTests.test1
              },
              test2: {
                ...prev.clayTests?.test2,
                ...record.clayTests.test2
              }
            }
          }));
        }
        
        if (record.sieveTesting) {
          if (record.sieveTesting.test1) {
            if (record.sieveTesting.test1.sieveSize) {
              Object.keys(record.sieveTesting.test1.sieveSize || {}).forEach(size => {
                const value = record.sieveTesting.test1.sieveSize[size];
                if (value && String(value).trim() !== '') {
                  locks.sieveTesting[`test1.sieveSize.${size}`] = true;
                }
              });
            }
            if (record.sieveTesting.test1.mf) {
              Object.keys(record.sieveTesting.test1.mf || {}).forEach(mf => {
                const value = record.sieveTesting.test1.mf[mf];
                if (value && String(value).trim() !== '') {
                  locks.sieveTesting[`test1.mf.${mf}`] = true;
                }
              });
            }
          }
          if (record.sieveTesting.test2) {
            if (record.sieveTesting.test2.sieveSize) {
              Object.keys(record.sieveTesting.test2.sieveSize || {}).forEach(size => {
                const value = record.sieveTesting.test2.sieveSize[size];
                if (value && String(value).trim() !== '') {
                  locks.sieveTesting[`test2.sieveSize.${size}`] = true;
                }
              });
            }
            if (record.sieveTesting.test2.mf) {
              Object.keys(record.sieveTesting.test2.mf || {}).forEach(mf => {
                const value = record.sieveTesting.test2.mf[mf];
                if (value && String(value).trim() !== '') {
                  locks.sieveTesting[`test2.mf.${mf}`] = true;
                }
              });
            }
          }
          setSectionData(prev => ({ 
            ...prev, 
            sieveTesting: {
              test1: {
                ...prev.sieveTesting?.test1,
                sieveSize: {
                  ...prev.sieveTesting?.test1?.sieveSize,
                  ...record.sieveTesting.test1?.sieveSize
                },
                mf: {
                  ...prev.sieveTesting?.test1?.mf,
                  ...record.sieveTesting.test1?.mf
                }
              },
              test2: {
                ...prev.sieveTesting?.test2,
                sieveSize: {
                  ...prev.sieveTesting?.test2?.sieveSize,
                  ...record.sieveTesting.test2?.sieveSize
                },
                mf: {
                  ...prev.sieveTesting?.test2?.mf,
                  ...record.sieveTesting.test2?.mf
                }
              }
            }
          }));
        }
        
        if (record.parameters) {
          Object.keys(record.parameters.test1 || {}).forEach(param => {
            const value = record.parameters.test1[param];
            if (value && String(value).trim() !== '') {
              locks.parameters[`test1.${param}`] = true;
            }
          });
          Object.keys(record.parameters.test2 || {}).forEach(param => {
            const value = record.parameters.test2[param];
            if (value && String(value).trim() !== '') {
              locks.parameters[`test2.${param}`] = true;
            }
          });
          setSectionData(prev => ({ 
            ...prev, 
            parameters: {
              ...prev.parameters,
              test1: {
                ...prev.parameters?.test1,
                ...record.parameters.test1
              },
              test2: {
                ...prev.parameters?.test2,
                ...record.parameters.test2
              }
            }
          }));
        }
        
        if (record.additionalData) {
          Object.keys(record.additionalData.test1 || {}).forEach(param => {
            const value = record.additionalData.test1[param];
            if (value && String(value).trim() !== '') {
              locks.additionalData[`test1.${param}`] = true;
            }
          });
          Object.keys(record.additionalData.test2 || {}).forEach(param => {
            const value = record.additionalData.test2[param];
            if (value && String(value).trim() !== '') {
              locks.additionalData[`test2.${param}`] = true;
            }
          });
          setSectionData(prev => ({ 
            ...prev, 
            additionalData: {
              ...prev.additionalData,
              test1: {
                ...prev.additionalData?.test1,
                ...record.additionalData.test1
              },
              test2: {
                ...prev.additionalData?.test2,
                ...record.additionalData.test2
              }
            }
          }));
        }
        
        if (record.remarks !== undefined && record.remarks && String(record.remarks).trim() !== '') {
          locks.remarks = true;
          setSectionData(prev => ({ ...prev, remarks: String(record.remarks || '') }));
        }
        
        setFieldLocks(locks);
      } else {
        // No data found, clear all locks
        setPrimaryId(null);
        setFieldLocks({
          primary: {
            date: false,
            shift: false,
            sandPlant: false,
            compactibilitySetting: false,
            shearStrengthSetting: false
          },
          clayTests: {},
          sieveTesting: {},
          parameters: {},
          additionalData: {},
          remarks: false
        });
        // Clear all data except date
        setPrimaryData(prev => ({
          ...prev,
          shift: "",
          sandPlant: "",
          compactibilitySetting: "",
          shearStrengthSetting: ""
        }));
        setSectionData({
          clayTests: initialFormData.clayTests,
          sieveTesting: initialFormData.sieveTesting,
          parameters: initialFormData.parameters,
          additionalData: initialFormData.additionalData,
          remarks: ""
        });
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
      setPrimaryId(null);
      setFieldLocks({
        primary: {
          date: false,
          shift: false,
          sandPlant: false,
          compactibilitySetting: false,
          shearStrengthSetting: false
        },
        clayTests: {},
        sieveTesting: {},
        parameters: {},
        additionalData: {},
        remarks: false
      });
    } finally {
      setCheckingData(false);
    }
  };

  // Check for data when date changes - checks all sections
  useEffect(() => {
    if (primaryData.date) {
      const timeoutId = setTimeout(() => {
        checkExistingData(primaryData.date);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFieldLocks({
        primary: {
          date: false,
          shift: false,
          sandPlant: false,
          compactibilitySetting: false,
          shearStrengthSetting: false
        },
        clayTests: {},
        sieveTesting: {},
        parameters: {},
        additionalData: {},
        remarks: false
      });
    }
  }, [primaryData.date]);
  
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
    },
    parameters: {
      test1: {
        compactability: "",
        permeability: "",
        gcs: "",
        wts: "",
        moisture: "",
        bentonite: "",
        coalDust: "",
        hopperLevel: "",
        shearStrength: "",
        dustCollectorSettings: "",
        returnSandMoisture: ""
      },
      test2: {
        compactability: "",
        permeability: "",
        gcs: "",
        wts: "",
        moisture: "",
        bentonite: "",
        coalDust: "",
        hopperLevel: "",
        shearStrength: "",
        dustCollectorSettings: "",
        returnSandMoisture: ""
      }
    },
    additionalData: {
      test1: { afsNo: "", fines: "", gd: "" },
      test2: { afsNo: "", fines: "", gd: "" }
    },
    remarks: ""
  });
  
  const [loadingStates, setLoadingStates] = useState({
    primary: false,
    clayParameters: false,
    sieveTesting: false,
    testParameters: false,
    additionalData: false,
    remarks: false
  });

  // Refs for submit buttons
  const primarySubmitRef = useRef(null);
  const clayParametersSubmitRef = useRef(null);
  const sieveTestingSubmitRef = useRef(null);
  const testParametersSubmitRef = useRef(null);
  const additionalDataSubmitRef = useRef(null);
  const remarksSubmitRef = useRef(null);

  // Refs for first inputs of each section
  const primaryFirstInputRef = useRef(null);
  const clayParametersFirstInputRef = useRef(null);
  const sieveTestingFirstInputRef = useRef(null);
  const testParametersFirstInputRef = useRef(null);
  const additionalDataFirstInputRef = useRef(null);
  const remarksFirstInputRef = useRef(null);

  // Handle Enter key navigation for inputs
  const handleKeyDown = (e, submitButtonRef, firstInputRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Get all inputs in the current form/section
      const form = e.target.closest('.foundry-section');
      if (!form) return;
      
      const inputs = Array.from(form.querySelectorAll('input:not([disabled]), textarea:not([disabled]), select:not([disabled])'));
      const currentInputIndex = inputs.indexOf(e.target);
      
      // If not the last input, move to next input
      if (currentInputIndex < inputs.length - 1) {
        inputs[currentInputIndex + 1].focus();
        return;
      }
      
      // If this is the last input, focus the submit button
      if (submitButtonRef && submitButtonRef.current) {
        submitButtonRef.current.focus();
      }
    }
  };

  // Handle Enter key on submit button
  const handleSubmitButtonKeyDown = (e, submitHandler) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitHandler();
    }
  };

  // Focus first input of a section
  const focusFirstInput = (firstInputRef) => {
    setTimeout(() => {
      if (firstInputRef && firstInputRef.current) {
        if (firstInputRef.current.focus) {
          firstInputRef.current.focus();
        } else if (firstInputRef.current.inputRef && firstInputRef.current.inputRef.current) {
          firstInputRef.current.inputRef.current.focus();
        }
      }
    }, 100);
  };

  // Handle primary data submission - only send fields that have data
  const handlePrimarySubmit = async () => {
    if (!primaryData.date || !primaryData.shift || !primaryData.sandPlant) {
      alert('Please fill in Date, Shift, and Sand Plant fields');
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, primary: true }));
      
      // Only include fields that have actual data (not empty strings)
      const payload = {
        date: primaryData.date,
        shift: primaryData.shift,
        sandPlant: primaryData.sandPlant,
        section: 'primary'
      };
      
      // Only add optional fields if they have data
      if (primaryData.compactibilitySetting && primaryData.compactibilitySetting.trim() !== '') {
        payload.compactibilitySetting = primaryData.compactibilitySetting;
      }
      if (primaryData.shearStrengthSetting && primaryData.shearStrengthSetting.trim() !== '') {
        payload.shearStrengthSetting = primaryData.shearStrengthSetting;
      }

      const res = await fetch('http://localhost:5000/api/v1/foundry-sand-testing-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const response = await res.json();
      
      if (response.success) {
        setPrimaryId(response.data?._id || null);
        // Check if there's existing data for this date+shift combination and lock shift accordingly
        await checkAndLockByDateAndShift(primaryData.date, primaryData.shift);
        alert('Primary data saved successfully!');
        // Refresh all locks from database
        if (primaryData.date) {
          await checkExistingData(primaryData.date);
        }
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving primary data:', error);
      alert('Failed to save: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingStates(prev => ({ ...prev, primary: false }));
    }
  };

  // Handle primary data changes
  const handlePrimaryChange = (field, value) => {
    setPrimaryData(prev => ({ ...prev, [field]: value }));
    
    // When date changes, automatically check for existing data
    if (field === 'date' && value) {
      // checkExistingData will be triggered by useEffect
    } else if (field === 'date' && !value) {
      // Clear all locks when date is cleared
      setFieldLocks({
        primary: {},
        clayTests: {},
        sieveTesting: {},
        parameters: {},
        additionalData: {},
        remarks: false
      });
    }
  };
  

  // Handle section data changes
  const handleInputChange = (section, field, value, subField = null, subSubField = null) => {
    if (subSubField) {
      // For nested structure like clayTests.test1.totalClay.input1
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

  const calculateClaySolution = (param, testNum) => {
    const testData = sectionData.clayTests[testNum][param];
    
    if (!testData) return "";
    
    if (param === "activeClay") {
      // activeClay: input1 x input2 = Solution %
      const input1 = parseFloat(testData.input1) || 0;
      const input2 = parseFloat(testData.input2) || 0;
      const solution = input1 * input2;
      return isNaN(solution) ? "" : solution.toFixed(2);
    } else if (param === "deadClay") {
      // deadClay: input1 - input2 = Solution %
      const input1 = parseFloat(testData.input1) || 0;
      const input2 = parseFloat(testData.input2) || 0;
      const solution = input1 - input2;
      return isNaN(solution) ? "" : solution.toFixed(2);
    } else {
      // totalClay, vcm, loi: (input1 - input2 / input3) x 100 = Solution %
      const input1 = parseFloat(testData.input1) || 0;
      const input2 = parseFloat(testData.input2) || 0;
      const input3 = parseFloat(testData.input3) || 0;
      if (input3 === 0) return "";
      const solution = ((input1 - input2) / input3) * 100;
      return isNaN(solution) ? "" : solution.toFixed(2);
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
      alert('Please enter a date first.');
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [sectionName]: true }));
      
      let sectionPayload = {};
      
      // Filter and include only fields with data
      if (sectionName === 'clayParameters') {
        sectionPayload.clayTests = filterEmptyValues(sectionData.clayTests);
      } else if (sectionName === 'sieveTesting') {
        sectionPayload.sieveTesting = filterEmptyValues(sectionData.sieveTesting);
      } else if (sectionName === 'testParameters') {
        sectionPayload.parameters = filterEmptyValues(sectionData.parameters);
      } else if (sectionName === 'additionalData') {
        sectionPayload.additionalData = filterEmptyValues(sectionData.additionalData);
      } else if (sectionName === 'remarks') {
        if (sectionData.remarks && sectionData.remarks.trim() !== '') {
          sectionPayload.remarks = sectionData.remarks;
        }
      }
      
      const payload = {
        ...primaryData, // Include all primary data
        section: sectionName,
        ...sectionPayload
      };

      const res = await fetch('http://localhost:5000/api/v1/foundry-sand-testing-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const response = await res.json();
      
      if (response.success) {
        alert(`${sectionName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} saved successfully!`);
        // Refresh all locks from database
        if (primaryData.date) {
          await checkExistingData(primaryData.date);
        }
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error(`Error saving ${sectionName}:`, error);
      alert('Failed to save: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingStates(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  // Reset primary data
  const resetPrimaryData = () => {
    if (!window.confirm('Are you sure you want to reset Primary data?')) return;
    setPrimaryData({
      date: new Date().toISOString().split('T')[0],
      shift: "",
      sandPlant: "",
      compactibilitySetting: "",
      shearStrengthSetting: ""
    });
    setFieldLocks({
      primary: {},
      clayTests: {},
      sieveTesting: {},
      parameters: {},
      additionalData: {},
      remarks: false
    });
  };

  // Handle section-wise resets
  const handleSectionReset = (sectionName) => {
    if (!window.confirm(`Are you sure you want to reset ${sectionName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}?`)) return;
    
    if (sectionName === 'clayParameters') {
      setSectionData(prev => ({
        ...prev,
        clayTests: initialFormData.clayTests
      }));
    } else if (sectionName === 'sieveTesting') {
      setSectionData(prev => ({
        ...prev,
        sieveTesting: initialFormData.sieveTesting
      }));
    } else if (sectionName === 'testParameters') {
      setSectionData(prev => ({
        ...prev,
        parameters: initialFormData.parameters
      }));
    } else if (sectionName === 'additionalData') {
      setSectionData(prev => ({
        ...prev,
        additionalData: initialFormData.additionalData
      }));
    } else if (sectionName === 'remarks') {
      setSectionData(prev => ({
        ...prev,
        remarks: ""
      }));
    }
  };


  const handleViewReport = () => {
    navigate('/sand-lab/foundry-sand-testing-note/report');
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

  return (
    <div className="page-wrapper">
      {checkingData && (
        <div className="foundry-loader-overlay">
          <Loader />
        </div>
      )}
      {/* Header */}
      <div className="foundry-header">
        <div className="foundry-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Foundry Sand Testing Note
          </h2>
        </div>
      </div>

      {/* Primary Section */}
      <div className="foundry-section">
        <h3 className="foundry-section-title primary-data-title">Primary Data :</h3>
        <div className="foundry-form-grid">
          <div className="foundry-form-group">
            <label>Date *</label>
            <CustomDatePicker
              value={primaryData.date}
              onChange={(e) => {
                const dateValue = e?.target?.value || e || '';
                handlePrimaryChange("date", dateValue);
              }}
              name="date"
              disabled={checkingData}
            />
          </div>
        <div className="foundry-form-group">
          <label>Shift *</label>
          <select
            ref={primaryFirstInputRef}
            value={primaryData.shift}
            onChange={(e) => handlePrimaryChange("shift", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, primarySubmitRef, primaryFirstInputRef)}
            onMouseDown={(e) => {
              if (isFieldLocked('primary', 'shift') || checkingData) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              if (isFieldLocked('primary', 'shift') || checkingData) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            disabled={isFieldLocked('primary', 'shift') || checkingData}
            readOnly={isFieldLocked('primary', 'shift')}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              backgroundColor: (isFieldLocked('primary', 'shift') || checkingData) ? '#f1f5f9' : '#ffffff',
              color: (isFieldLocked('primary', 'shift') || checkingData) ? '#64748b' : '#1e293b',
              cursor: (isFieldLocked('primary', 'shift') || checkingData) ? 'not-allowed' : 'pointer',
              opacity: (isFieldLocked('primary', 'shift') || checkingData) ? 0.8 : 1,
              pointerEvents: (isFieldLocked('primary', 'shift') || checkingData) ? 'none' : 'auto'
            }}
          >
            <option value="">Select Shift</option>
            <option value="Shift 1">Shift 1</option>
            <option value="Shift 2">Shift 2</option>
            <option value="Shift 3">Shift 3</option>
          </select>
        </div>
        <div className="foundry-form-group">
          <label>Sand Plant *</label>
          <input
            type="text"
            placeholder="e.g. DISA"
            value={primaryData.sandPlant}
            onChange={(e) => handlePrimaryChange("sandPlant", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, primarySubmitRef, primaryFirstInputRef)}
            disabled={isFieldLocked('primary', 'sandPlant') || checkingData}
            readOnly={isFieldLocked('primary', 'sandPlant')}
            style={{
              backgroundColor: (isFieldLocked('primary', 'sandPlant') || checkingData) ? '#f1f5f9' : '#ffffff',
              cursor: (isFieldLocked('primary', 'sandPlant') || checkingData) ? 'not-allowed' : 'text'
            }}
          />
        </div>
        <div className="foundry-form-group">
          <label>Compactability Setting</label>
          <input
            type="text"
            placeholder="e.g. J.C. mode"
            value={primaryData.compactibilitySetting}
            onChange={(e) => handlePrimaryChange("compactibilitySetting", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, primarySubmitRef, primaryFirstInputRef)}
            disabled={isFieldLocked('primary', 'compactibilitySetting') || checkingData}
            readOnly={isFieldLocked('primary', 'compactibilitySetting')}
            style={{
              backgroundColor: (isFieldLocked('primary', 'compactibilitySetting') || checkingData) ? '#f1f5f9' : '#ffffff',
              cursor: (isFieldLocked('primary', 'compactibilitySetting') || checkingData) ? 'not-allowed' : 'text'
            }}
          />
        </div>
        <div className="foundry-form-group">
          <label>Shear/Mould Strength Setting</label>
          <input
            type="text"
            placeholder="e.g. MP.VOX"
            value={primaryData.shearStrengthSetting}
            onChange={(e) => handlePrimaryChange("shearStrengthSetting", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, primarySubmitRef, primaryFirstInputRef)}
            disabled={isFieldLocked('primary', 'shearStrengthSetting') || checkingData}
            readOnly={isFieldLocked('primary', 'shearStrengthSetting')}
            style={{
              backgroundColor: (isFieldLocked('primary', 'shearStrengthSetting') || checkingData) ? '#f1f5f9' : '#ffffff',
              cursor: (isFieldLocked('primary', 'shearStrengthSetting') || checkingData) ? 'not-allowed' : 'text'
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button
          ref={primarySubmitRef}
          type="button"
          onClick={handlePrimarySubmit}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, handlePrimarySubmit)}
          disabled={loadingStates.primary || checkingData || !primaryData.date || !primaryData.shift || !primaryData.sandPlant}
          className="foundry-submit-btn"
          title="Save Primary Data"
        >
          {loadingStates.primary ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loadingStates.primary ? 'Saving...' : 'Save Primary'}
        </button>
      </div>
      </div>

      {/* Clay Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Clay Parameters</h3>
            <div className="foundry-table-wrapper">
              <table className="foundry-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>TEST-1</th>
                    <th>TEST-2</th>
                  </tr>
                </thead>
                <tbody>
                  {["totalClay", "activeClay", "deadClay", "vcm", "loi"].map((param) => (
                    <tr key={param}>
                      <td>{param.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {param === "activeClay" || param === "deadClay" ? (
                            <>
                              <input
                                ref={param === "activeClay" ? clayParametersFirstInputRef : null}
                                type="number"
                                step="0.01"
                                placeholder="Input 1"
                                value={sectionData.clayTests.test1[param]?.input1 || ''}
                                disabled={isFieldLocked('clayTests', `test1.${param}.input1`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test1", e.target.value, param, "input1");
                                  // Trigger recalculation
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test1");
                                    handleInputChange("clayTests", "test1", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '80px', padding: '0.375rem' }}
                              />
                              <span>{param === "activeClay" ? "x" : "-"}</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 2"
                                value={sectionData.clayTests.test1[param]?.input2 || ''}
                                disabled={isFieldLocked('clayTests', `test1.${param}.input2`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test1", e.target.value, param, "input2");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test1");
                                    handleInputChange("clayTests", "test1", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '80px', padding: '0.375rem' }}
                              />
                              <span>=</span>
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>
                                {sectionData.clayTests.test1[param]?.solution || '0'}%
                              </span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 1"
                                value={sectionData.clayTests.test1[param]?.input1 || ''}
                                disabled={isFieldLocked('clayTests', `test1.${param}.input1`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test1", e.target.value, param, "input1");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test1");
                                    handleInputChange("clayTests", "test1", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '70px', padding: '0.375rem' }}
                              />
                              <span>-</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 2"
                                value={sectionData.clayTests.test1[param]?.input2 || ''}
                                disabled={isFieldLocked('clayTests', `test1.${param}.input2`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test1", e.target.value, param, "input2");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test1");
                                    handleInputChange("clayTests", "test1", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '70px', padding: '0.375rem' }}
                              />
                              <span>/</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 3"
                                value={sectionData.clayTests.test1[param]?.input3 || ''}
                                disabled={isFieldLocked('clayTests', `test1.${param}.input3`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test1", e.target.value, param, "input3");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test1");
                                    handleInputChange("clayTests", "test1", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '70px', padding: '0.375rem' }}
                              />
                              <span>x 100 =</span>
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>
                                {sectionData.clayTests.test1[param]?.solution || '0'}%
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {param === "activeClay" || param === "deadClay" ? (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 1"
                                value={sectionData.clayTests.test2[param]?.input1 || ''}
                                disabled={isFieldLocked('clayTests', `test2.${param}.input1`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test2", e.target.value, param, "input1");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test2");
                                    handleInputChange("clayTests", "test2", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '80px', padding: '0.375rem' }}
                              />
                              <span>{param === "activeClay" ? "x" : "-"}</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 2"
                                value={sectionData.clayTests.test2[param]?.input2 || ''}
                                disabled={isFieldLocked('clayTests', `test2.${param}.input2`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test2", e.target.value, param, "input2");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test2");
                                    handleInputChange("clayTests", "test2", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '80px', padding: '0.375rem' }}
                              />
                              <span>=</span>
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>
                                {sectionData.clayTests.test2[param]?.solution || '0'}%
                              </span>
                            </>
                          ) : (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 1"
                                value={sectionData.clayTests.test2[param]?.input1 || ''}
                                disabled={isFieldLocked('clayTests', `test2.${param}.input1`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test2", e.target.value, param, "input1");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test2");
                                    handleInputChange("clayTests", "test2", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '70px', padding: '0.375rem' }}
                              />
                              <span>-</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 2"
                                value={sectionData.clayTests.test2[param]?.input2 || ''}
                                disabled={isFieldLocked('clayTests', `test2.${param}.input2`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test2", e.target.value, param, "input2");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test2");
                                    handleInputChange("clayTests", "test2", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '70px', padding: '0.375rem' }}
                              />
                              <span>/</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Input 3"
                                value={sectionData.clayTests.test2[param]?.input3 || ''}
                                disabled={isFieldLocked('clayTests', `test2.${param}.input3`)}
                                onKeyDown={(e) => handleKeyDown(e, clayParametersSubmitRef, clayParametersFirstInputRef)}
                                onChange={(e) => {
                                  handleInputChange("clayTests", "test2", e.target.value, param, "input3");
                                  setTimeout(() => {
                                    const solution = calculateClaySolution(param, "test2");
                                    handleInputChange("clayTests", "test2", solution, param, "solution");
                                  }, 0);
                                }}
                                style={{ width: '70px', padding: '0.375rem' }}
                              />
                              <span>x 100 =</span>
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>
                                {sectionData.clayTests.test2[param]?.solution || '0'}%
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleSectionReset('clayParameters')}
          disabled={loadingStates.clayParameters}
          className="foundry-reset-btn"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          ref={clayParametersSubmitRef}
          type="button"
          onClick={() => handleSectionSubmit('clayParameters')}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('clayParameters'))}
          disabled={loadingStates.clayParameters}
          className="foundry-submit-btn"
        >
          {loadingStates.clayParameters ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loadingStates.clayParameters ? 'Saving...' : 'Save Clay Parameters'}
        </button>
      </div>
      </div>

      {/* Sieve Testing */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sieve Testing</h3>
            <div className="foundry-table-wrapper">
              <table className="foundry-table">
                <thead>
                  <tr>
                    <th rowSpan="2">Sieve size (Mic)</th>
                    <th colSpan="2">% Wt retained sand</th>
                    <th rowSpan="2">MF</th>
                    <th colSpan="2">Product</th>
                  </tr>
                  <tr>
                    <th>TEST-1</th>
                    <th>TEST-2</th>
                    <th>TEST-1</th>
                    <th>TEST-2</th>
                  </tr>
                </thead>
                <tbody>
                  {sieveData.map((row) => (
                    <tr key={row.size}>
                      <td>{row.size}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter %"
                          value={sectionData.sieveTesting?.test1?.sieveSize?.[row.size] || ''}
                          onChange={(e) => handleInputChange("sieveTesting", "test1", e.target.value, "sieveSize", row.size)}
                          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                          disabled={isFieldLocked('sieveTesting', `test1.sieveSize.${row.size}`)}
                          readOnly={isFieldLocked('sieveTesting', `test1.sieveSize.${row.size}`)}
                          ref={row.size === 1700 ? sieveTestingFirstInputRef : null}
                          style={{
                            backgroundColor: isFieldLocked('sieveTesting', `test1.sieveSize.${row.size}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('sieveTesting', `test1.sieveSize.${row.size}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter %"
                          value={sectionData.sieveTesting?.test2?.sieveSize?.[row.size] || ''}
                          onChange={(e) => handleInputChange("sieveTesting", "test2", e.target.value, "sieveSize", row.size)}
                          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                          disabled={isFieldLocked('sieveTesting', `test2.sieveSize.${row.size}`)}
                          readOnly={isFieldLocked('sieveTesting', `test2.sieveSize.${row.size}`)}
                          style={{
                            backgroundColor: isFieldLocked('sieveTesting', `test2.sieveSize.${row.size}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('sieveTesting', `test2.sieveSize.${row.size}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td>{row.mf}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Product"
                          value={sectionData.sieveTesting?.test1?.mf?.[row.mf] || ''}
                          onChange={(e) => handleInputChange("sieveTesting", "test1", e.target.value, "mf", row.mf)}
                          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                          disabled={isFieldLocked('sieveTesting', `test1.mf.${row.mf}`)}
                          readOnly={isFieldLocked('sieveTesting', `test1.mf.${row.mf}`)}
                          style={{
                            backgroundColor: isFieldLocked('sieveTesting', `test1.mf.${row.mf}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('sieveTesting', `test1.mf.${row.mf}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Product"
                          value={sectionData.sieveTesting?.test2?.mf?.[row.mf] || ''}
                          onChange={(e) => handleInputChange("sieveTesting", "test2", e.target.value, "mf", row.mf)}
                          onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                          disabled={isFieldLocked('sieveTesting', `test2.mf.${row.mf}`)}
                          readOnly={isFieldLocked('sieveTesting', `test2.mf.${row.mf}`)}
                          style={{
                            backgroundColor: isFieldLocked('sieveTesting', `test2.mf.${row.mf}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('sieveTesting', `test2.mf.${row.mf}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="foundry-table-total">
                    <td><strong>Total</strong></td>
                    <td>
                      <input
                        type="text"
                        placeholder="Total"
                        value={sectionData.sieveTesting?.test1?.sieveSize?.total || ''}
                        onChange={(e) => handleInputChange("sieveTesting", "test1", e.target.value, "sieveSize", "total")}
                        onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                        disabled={isFieldLocked('sieveTesting', 'test1.sieveSize.total')}
                        readOnly={isFieldLocked('sieveTesting', 'test1.sieveSize.total')}
                        style={{
                          backgroundColor: isFieldLocked('sieveTesting', 'test1.sieveSize.total') ? '#f1f5f9' : '#ffffff',
                          cursor: isFieldLocked('sieveTesting', 'test1.sieveSize.total') ? 'not-allowed' : 'text'
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Total"
                        value={sectionData.sieveTesting?.test2?.sieveSize?.total || ''}
                        onChange={(e) => handleInputChange("sieveTesting", "test2", e.target.value, "sieveSize", "total")}
                        onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                        disabled={isFieldLocked('sieveTesting', 'test2.sieveSize.total')}
                        readOnly={isFieldLocked('sieveTesting', 'test2.sieveSize.total')}
                        style={{
                          backgroundColor: isFieldLocked('sieveTesting', 'test2.sieveSize.total') ? '#f1f5f9' : '#ffffff',
                          cursor: isFieldLocked('sieveTesting', 'test2.sieveSize.total') ? 'not-allowed' : 'text'
                        }}
                      />
                    </td>
                    <td><strong>Total</strong></td>
                    <td>
                      <input
                        type="text"
                        placeholder="Total"
                        value={sectionData.sieveTesting?.test1?.mf?.total || ''}
                        onChange={(e) => handleInputChange("sieveTesting", "test1", e.target.value, "mf", "total")}
                        onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                        disabled={isFieldLocked('sieveTesting', 'test1.mf.total')}
                        readOnly={isFieldLocked('sieveTesting', 'test1.mf.total')}
                        style={{
                          backgroundColor: isFieldLocked('sieveTesting', 'test1.mf.total') ? '#f1f5f9' : '#ffffff',
                          cursor: isFieldLocked('sieveTesting', 'test1.mf.total') ? 'not-allowed' : 'text'
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Total"
                        value={sectionData.sieveTesting?.test2?.mf?.total || ''}
                        onChange={(e) => handleInputChange("sieveTesting", "test2", e.target.value, "mf", "total")}
                        onKeyDown={(e) => handleKeyDown(e, sieveTestingSubmitRef, sieveTestingFirstInputRef)}
                        disabled={isFieldLocked('sieveTesting', 'test2.mf.total')}
                        readOnly={isFieldLocked('sieveTesting', 'test2.mf.total')}
                        style={{
                          backgroundColor: isFieldLocked('sieveTesting', 'test2.mf.total') ? '#f1f5f9' : '#ffffff',
                          cursor: isFieldLocked('sieveTesting', 'test2.mf.total') ? 'not-allowed' : 'text'
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleSectionReset('sieveTesting')}
          disabled={loadingStates.sieveTesting}
          className="foundry-reset-btn"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          ref={sieveTestingSubmitRef}
          type="button"
          onClick={() => handleSectionSubmit('sieveTesting')}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('sieveTesting'))}
          disabled={loadingStates.sieveTesting}
          className="foundry-submit-btn"
        >
          {loadingStates.sieveTesting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loadingStates.sieveTesting ? 'Saving...' : 'Save Sieve Testing'}
        </button>
      </div>
      </div>

      {/* Test Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Test Parameters</h3>
            <div className="foundry-table-wrapper">
              <table className="foundry-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>TEST-1</th>
                    <th>TEST-2</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "compactability", label: "Compactability" },
                    { key: "permeability", label: "Permeability" },
                    { key: "gcs", label: "GCS" },
                    { key: "wts", label: "WTS" },
                    { key: "moisture", label: "Moisture" },
                    { key: "bentonite", label: "Bentonite" },
                    { key: "coalDust", label: "CoalDust" },
                    { key: "hopperLevel", label: "Hopper Level" },
                    { key: "shearStrength", label: "Shear Strength" },
                    { key: "dustCollectorSettings", label: "Dust Collector Settings" },
                    { key: "returnSandMoisture", label: "Return Sand Moisture" }
                  ].map((param) => (
                    <tr key={param.key}>
                      <td>{param.label}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter value"
                          value={sectionData.parameters?.test1?.[param.key] || ''}
                          onChange={(e) => handleInputChange("parameters", "test1", e.target.value, param.key)}
                          onKeyDown={(e) => handleKeyDown(e, testParametersSubmitRef, testParametersFirstInputRef)}
                          disabled={isFieldLocked('parameters', `test1.${param.key}`)}
                          readOnly={isFieldLocked('parameters', `test1.${param.key}`)}
                          ref={param.key === "compactability" ? testParametersFirstInputRef : null}
                          style={{
                            backgroundColor: isFieldLocked('parameters', `test1.${param.key}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('parameters', `test1.${param.key}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter value"
                          value={sectionData.parameters?.test2?.[param.key] || ''}
                          onChange={(e) => handleInputChange("parameters", "test2", e.target.value, param.key)}
                          onKeyDown={(e) => handleKeyDown(e, testParametersSubmitRef, testParametersFirstInputRef)}
                          disabled={isFieldLocked('parameters', `test2.${param.key}`)}
                          readOnly={isFieldLocked('parameters', `test2.${param.key}`)}
                          style={{
                            backgroundColor: isFieldLocked('parameters', `test2.${param.key}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('parameters', `test2.${param.key}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleSectionReset('testParameters')}
          disabled={loadingStates.testParameters}
          className="foundry-reset-btn"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          ref={testParametersSubmitRef}
          type="button"
          onClick={() => handleSectionSubmit('testParameters')}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('testParameters'))}
          disabled={loadingStates.testParameters}
          className="foundry-submit-btn"
        >
          {loadingStates.testParameters ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loadingStates.testParameters ? 'Saving...' : 'Save Test Parameters'}
        </button>
      </div>
      </div>

      {/* Additional Data */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Additional Data</h3>
            <div className="foundry-table-wrapper">
              <table className="foundry-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>TEST-1</th>
                    <th>TEST-2</th>
                  </tr>
                </thead>
                <tbody>
                  {["afsNo", "fines", "gd"].map((param) => (
                    <tr key={param}>
                      <td>{param.toUpperCase()}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter value"
                          value={sectionData.additionalData?.test1?.[param] || ''}
                          onChange={(e) => handleInputChange("additionalData", "test1", e.target.value, param)}
                          onKeyDown={(e) => handleKeyDown(e, additionalDataSubmitRef, additionalDataFirstInputRef)}
                          disabled={isFieldLocked('additionalData', `test1.${param}`)}
                          readOnly={isFieldLocked('additionalData', `test1.${param}`)}
                          ref={param === "afsNo" ? additionalDataFirstInputRef : null}
                          style={{
                            backgroundColor: isFieldLocked('additionalData', `test1.${param}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('additionalData', `test1.${param}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Enter value"
                          value={sectionData.additionalData?.test2?.[param] || ''}
                          onChange={(e) => handleInputChange("additionalData", "test2", e.target.value, param)}
                          onKeyDown={(e) => handleKeyDown(e, additionalDataSubmitRef, additionalDataFirstInputRef)}
                          disabled={isFieldLocked('additionalData', `test2.${param}`)}
                          readOnly={isFieldLocked('additionalData', `test2.${param}`)}
                          style={{
                            backgroundColor: isFieldLocked('additionalData', `test2.${param}`) ? '#f1f5f9' : '#ffffff',
                            cursor: isFieldLocked('additionalData', `test2.${param}`) ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleSectionReset('additionalData')}
          disabled={loadingStates.additionalData}
          className="foundry-reset-btn"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          ref={additionalDataSubmitRef}
          type="button"
          onClick={() => handleSectionSubmit('additionalData')}
          onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('additionalData'))}
          disabled={loadingStates.additionalData}
          className="foundry-submit-btn"
        >
          {loadingStates.additionalData ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {loadingStates.additionalData ? 'Saving...' : 'Save Additional Data'}
        </button>
      </div>
      </div>

      {/* Remarks */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Remarks</h3>
        <div className="foundry-form-group">
          <label>Remarks</label>
          <input
            type="text"
            ref={remarksFirstInputRef}
            value={sectionData.remarks || ''}
            onChange={(e) => handleInputChange("remarks", null, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, remarksSubmitRef, remarksFirstInputRef)}
            placeholder="Enter any additional remarks..."
            maxLength={80}
            disabled={fieldLocks.remarks}
            readOnly={fieldLocks.remarks}
            style={{
              width: '100%',
              maxWidth: '500px',
              resize: 'none',
              backgroundColor: fieldLocks.remarks ? '#f1f5f9' : '#ffffff',
              cursor: fieldLocks.remarks ? 'not-allowed' : 'text'
            }}
          />
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleSectionReset('remarks')}
            disabled={loadingStates.remarks}
            className="foundry-reset-btn"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            ref={remarksSubmitRef}
            type="button"
            onClick={() => handleSectionSubmit('remarks')}
            onKeyDown={(e) => handleSubmitButtonKeyDown(e, () => handleSectionSubmit('remarks'))}
            disabled={loadingStates.remarks}
            className="foundry-submit-btn"
          >
            {loadingStates.remarks ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loadingStates.remarks ? 'Saving...' : 'Save Remarks'}
          </button>
        </div>
      </div>
    </div>
  );
}
