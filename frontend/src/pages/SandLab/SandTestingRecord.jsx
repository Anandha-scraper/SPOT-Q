import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen} from 'lucide-react';
import Table from '../../Components/Table';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { PlantDropdown, PlusButton, MinusButton, SubmitButton, LockPrimaryButton, CustomTimeInput, Time } from '../../Components/Buttons';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { InlineLoader } from '../../Components/InlineLoader';

import { useArrowNavigation } from '../../utils/arrowNavigation';
import { validationRanges as sandTestingValidationRanges } from '../../deviations/DsandTestingRecord';
import '../../styles/PageStyles/Sandlab/SandTestingRecord.css';

// Get today's date in YYYY-MM-DD format
const getTodaysDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const SandTestingRecord = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getTodaysDate());
  const [plant, setPlant] = useState('Disa');
  const [isLoading, setIsLoading] = useState(false);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [isFetchingCombination, setIsFetchingCombination] = useState(false);
  const isInitialMount = useRef(true);

  // Primary lock — Date+Plant must be saved before the 5 sections unlock,
  // same pattern as ReturnSandFoundrySandTestingNote.jsx.
  const [isPrimaryDataSaved, setIsPrimaryDataSaved] = useState(false);
  const [savingPrimary, setSavingPrimary] = useState(false);
  const [showCombinationAdded, setShowCombinationAdded] = useState(false);
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [highlightPrimaryFields, setHighlightPrimaryFields] = useState(false);
  const [primaryMessage, setPrimaryMessage] = useState(null);
  const primarySectionRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();
  const { isOpen: isInfoOpen, openModal: openInfoModal, closeModal: closeInfoModal } = useInfoModal();

  // Compactability/Mould Strength Setting suggestion lists — the last 3 distinct
  // values actually entered, ordered by most recently used first (derived from
  // the last ~90 days of records). Empty until history is fetched.
  const [compactabilitySuggestions, setCompactabilitySuggestions] = useState([]);
  const [mouldStrengthSuggestions, setMouldStrengthSuggestions] = useState([]);
  const [filteredCompactabilitySuggestions, setFilteredCompactabilitySuggestions] = useState([]);
  const [showCompactabilityDropdown, setShowCompactabilityDropdown] = useState(false);
  const [filteredMouldStrengthSuggestions, setFilteredMouldStrengthSuggestions] = useState([]);
  const [showMouldStrengthDropdown, setShowMouldStrengthDropdown] = useState(false);
  const compactabilityDropdownRef = useRef(null);
  const mouldStrengthDropdownRef = useRef(null);

  // Lock state for each table
  // Inline save outcome per table, shown via InlineLoader instead of alert().
  const [tableMessages, setTableMessages] = useState({});
  const showTableMessage = (tableNum, text, variant) => {
    setTableMessages(prev => ({ ...prev, [tableNum]: { text, variant } }));
  };
  const [table1Locked, setTable1Locked] = useState(false);
  const [table2Locked, setTable2Locked] = useState(false);
  const [table3Locked, setTable3Locked] = useState(false);
  const [table4Locked, setTable4Locked] = useState(false);
  const [table5Locked, setTable5Locked] = useState(false);
  
  // S.No count from database (will be fetched and incremented automatically)
  const [currentSNo, setCurrentSNo] = useState(0); // This will come from database and auto-increment

  // State for Table 5 data rows (array of submitted records)
  const [table5Data, setTable5Data] = useState([]);
  const [nextTable5SNo, setNextTable5SNo] = useState(1);
  
  // State for current Table 5 entry form
  const [table5FormData, setTable5FormData] = useState({
    time: null,
    mixNo: '',
    permeability: '',
    gcsCheckpoint: '',
    gcsValue: '',
    wts: '',
    moisture: '',
    compactability: '',
    compressability: '',
    waterLitreKgMix: '',
    sandTempBC: '',
    sandTempWU: '',
    sandTempSSU: '',
    newSandKgsMould: '',
    bentoniteCheckpoint: '',
    bentoniteKgs: '',
    bentonitePercent: '',
    premixCoalCheckpoint: '',
    premixCoalKgs: '',
    premixCoalPercent: '',
    compactabilityValue: '',
    mouldStrengthValue: '',
    preparedSandLumpsKg: '',
    itemName: '',
    remarks: ''
  });

  // Validation states for Table 5 (null = neutral, true = valid/green, false = invalid/red)
  const [timeValid, setTimeValid] = useState(null);
  const [mixNoValid, setMixNoValid] = useState(null);
  const [permeabilityValid, setPermeabilityValid] = useState(null);
  const [gcsCheckpointValid, setGcsCheckpointValid] = useState(null);
  const [gcsValid, setGcsValid] = useState(null);
  const [wtsValid, setWtsValid] = useState(null);
  const [moistureValid, setMoistureValid] = useState(null);
  const [compactabilityValid, setCompactabilityValid] = useState(null);
  const [compressabilityValid, setCompressabilityValid] = useState(null);
  const [waterLitreValid, setWaterLitreValid] = useState(null);
  const [sandTempBCValid, setSandTempBCValid] = useState(null);
  const [sandTempWUValid, setSandTempWUValid] = useState(null);
  const [sandTempSSUValid, setSandTempSSUValid] = useState(null);
  const [newSandValid, setNewSandValid] = useState(null);
  const [bentoniteCheckpointValid, setBentoniteCheckpointValid] = useState(null);
  const [bentoniteKgsValid, setBentoniteKgsValid] = useState(null);
  const [bentonitePercentValid, setBentonitePercentValid] = useState(null);
  const [premixCoalCheckpointValid, setPremixCoalCheckpointValid] = useState(null);
  const [premixCoalKgsValid, setPremixCoalKgsValid] = useState(null);
  const [premixCoalPercentValid, setPremixCoalPercentValid] = useState(null);
  const [compactabilityValueValid, setCompactabilityValueValid] = useState(null);
  const [mouldStrengthValueValid, setMouldStrengthValueValid] = useState(null);
  const [preparedSandLumpsKgValid, setPreparedSandLumpsKgValid] = useState(null);
  const [itemNameValid, setItemNameValid] = useState(null);

  // Refs for Table 5 form fields (for Enter key navigation)
  const timeRef = useRef(null);
  const mixNoRef = useRef(null);
  const permeabilityRef = useRef(null);
  const gcsValueRef = useRef(null);
  const wtsRef = useRef(null);
  const moistureRef = useRef(null);
  const compactabilityRef = useRef(null);
  const compressabilityRef = useRef(null);
  const waterLitreRef = useRef(null);
  const sandTempBCRef = useRef(null);
  const sandTempWURef = useRef(null);
  const sandTempSSURef = useRef(null);
  const newSandRef = useRef(null);
  const bentoniteKgsRef = useRef(null);
  const bentonitePercentRef = useRef(null);
  const premixCoalKgsRef = useRef(null);
  const premixCoalPercentRef = useRef(null);
  const compactabilityValueRef = useRef(null);
  const mouldStrengthValueRef = useRef(null);
  const preparedSandLumpsRef = useRef(null);
  const itemNameRef = useRef(null);
  const remarksRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Handle Enter key navigation
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  // Map each Table 5 form field to its "valid" state setter
  const table5ValidSetters = {
    time: setTimeValid,
    mixNo: setMixNoValid,
    permeability: setPermeabilityValid,
    gcsCheckpoint: setGcsCheckpointValid,
    gcsValue: setGcsValid,
    wts: setWtsValid,
    moisture: setMoistureValid,
    compactability: setCompactabilityValid,
    compressability: setCompressabilityValid,
    waterLitreKgMix: setWaterLitreValid,
    sandTempBC: setSandTempBCValid,
    sandTempWU: setSandTempWUValid,
    sandTempSSU: setSandTempSSUValid,
    newSandKgsMould: setNewSandValid,
    bentoniteCheckpoint: setBentoniteCheckpointValid,
    bentoniteKgs: setBentoniteKgsValid,
    bentonitePercent: setBentonitePercentValid,
    premixCoalCheckpoint: setPremixCoalCheckpointValid,
    premixCoalKgs: setPremixCoalKgsValid,
    premixCoalPercent: setPremixCoalPercentValid,
    compactabilityValue: setCompactabilityValueValid,
    mouldStrengthValue: setMouldStrengthValueValid,
    preparedSandLumpsKg: setPreparedSandLumpsKgValid,
    itemName: setItemNameValid
  };

  // Update form field. Like Process.jsx: typing only clears the field's error (no live
  // green/red). Validation is evaluated on submit and shows red only where it fails.
  const updateFormField = (field, value) => {
    setTable5FormData({
      ...table5FormData,
      [field]: value
    });

    // Clear this field's error on change
    if (table5ValidSetters[field]) table5ValidSetters[field](null);

    // Changing a checkpoint/setting also clears its dependent value field(s)
    if (field === 'gcsCheckpoint') setGcsValid(null);
    if (field === 'bentoniteCheckpoint') { setBentoniteKgsValid(null); setBentonitePercentValid(null); }
    if (field === 'premixCoalCheckpoint') { setPremixCoalKgsValid(null); setPremixCoalPercentValid(null); }
  };

  // Fetch the last ~90 days once on mount and reorder the Compactability/Mould
  // Strength suggestion lists by most-recently-used-first. The backend never
  // stores the setting name itself — only which of 4 fixed numeric columns
  // got the value — so the setting name is inferred from which column is
  // nonzero on each historical Table 5 row.
  useEffect(() => {
    const fetchSettingSuggestions = async () => {
      try {
        const to = getTodaysDate();
        const fromDateObj = new Date();
        fromDateObj.setDate(fromDateObj.getDate() - 90);
        const from = fromDateObj.toISOString().split('T')[0];
        const res = await fetch(`${API_ENDPOINTS.sandTestingRecords}?startDate=${from}&endDate=${to}&limit=500`, { credentials: 'include' });
        const result = await res.json();
        const records = (result.success && Array.isArray(result.data)) ? result.data : [];
        records.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

        // Each field now writes to one fixed column (CompactabilitySettings /
        // mouldStrength) going forward, but older rows may still carry a value
        // in the other legacy column (lc / shearStrengthSetting) — read both so
        // the suggestion list stays continuous across the change.
        const compactList = [];
        const mouldList = [];
        records.forEach((r) => {
          const rows = Array.isArray(r.testParameter) ? [...r.testParameter].reverse() : [];
          rows.forEach((row) => {
            const compactVal = row.CompactabilitySettings || row.lc;
            const mouldVal = row.mouldStrength || row.shearStrengthSetting;
            if (compactVal && !compactList.includes(String(compactVal))) compactList.push(String(compactVal));
            if (mouldVal && !mouldList.includes(String(mouldVal))) mouldList.push(String(mouldVal));
          });
        });
        setCompactabilitySuggestions(compactList.slice(0, 3));
        setMouldStrengthSuggestions(mouldList.slice(0, 3));
      } catch (error) {
        // Suggestion list is a nice-to-have — an empty list just shows no suggestions.
      }
    };
    fetchSettingSuggestions();
  }, []);

  useEffect(() => {
    const handleSettingClickOutside = (event) => {
      if (compactabilityDropdownRef.current && !compactabilityDropdownRef.current.contains(event.target)) {
        setShowCompactabilityDropdown(false);
      }
      if (mouldStrengthDropdownRef.current && !mouldStrengthDropdownRef.current.contains(event.target)) {
        setShowMouldStrengthDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleSettingClickOutside);
    return () => document.removeEventListener('mousedown', handleSettingClickOutside);
  }, []);

  const filterSettingSuggestions = (list, typed) => {
    const t = (typed || '').toString();
    return (t ? list.filter((s) => s.includes(t)) : list).slice(0, 3);
  };

  const handleCompactabilityValueFocus = () => {
    setFilteredCompactabilitySuggestions(filterSettingSuggestions(compactabilitySuggestions, table5FormData.compactabilityValue));
    setShowCompactabilityDropdown(true);
  };
  const handleCompactabilityValueChange = (value) => {
    updateFormField('compactabilityValue', value);
    setFilteredCompactabilitySuggestions(filterSettingSuggestions(compactabilitySuggestions, value));
    setShowCompactabilityDropdown(true);
  };
  const handleCompactabilityValueSelect = (value) => {
    updateFormField('compactabilityValue', value);
    setShowCompactabilityDropdown(false);
    mouldStrengthValueRef.current?.focus();
  };

  const handleMouldStrengthValueFocus = () => {
    setFilteredMouldStrengthSuggestions(filterSettingSuggestions(mouldStrengthSuggestions, table5FormData.mouldStrengthValue));
    setShowMouldStrengthDropdown(true);
  };
  const handleMouldStrengthValueChange = (value) => {
    updateFormField('mouldStrengthValue', value);
    setFilteredMouldStrengthSuggestions(filterSettingSuggestions(mouldStrengthSuggestions, value));
    setShowMouldStrengthDropdown(true);
  };
  const handleMouldStrengthValueSelect = (value) => {
    updateFormField('mouldStrengthValue', value);
    setShowMouldStrengthDropdown(false);
    preparedSandLumpsRef.current?.focus();
  };

  // Handle time change
  const handleTimeChange = (timeValue) => {
    updateFormField('time', timeValue);
  };

  // Handle form submission
  const handleTable5Submit = async () => {
    setTableMessages(prev => ({ ...prev, 5: null }));
    // Validate date before proceeding
    if (!selectedDate || selectedDate.trim() === '' || !/\d{4}-\d{2}-\d{2}/.test(selectedDate)) {
      showTableMessage(5, 'Please select a valid date before submitting.', 'danger');
      return;
    }
    
    let hasErrors = false;

    // "required" is sourced from sandTestingValidationRanges (edit `required` there to toggle it).
    // Fields absent from that list default to required. Validation runs on submit only and
    // marks failing fields red (invalid-input); there is no green/valid state.
    const isFieldRequired = (formKey) => {
      const rule = sandTestingValidationRanges.find(r => r.formKey === formKey);
      return rule ? rule.required !== false : true;
    };
    const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

    // Straightforward field: fails if required-and-empty, or (when filled) not a valid number.
    // min/max are QC target ranges, not hard input limits — the real measured
    // value must be accepted even outside spec, so they're no longer checked here.
    // requiredKey lets several inputs (e.g. Sand Temp BC/WU/SSU) share one rule's "required" flag.
    const checkField = (formKey, value, _range = {}, requiredKey = formKey) => {
      const setValid = table5ValidSetters[formKey];
      if (isEmpty(value)) {
        if (isFieldRequired(requiredKey)) { if (setValid) setValid(false); hasErrors = true; }
        return;
      }
      const num = parseFloat(value);
      if (isNaN(num) || !isFinite(num)) {
        if (setValid) setValid(false);
        hasErrors = true;
      }
    };

    // Required-presence only (text/time)
    const checkPresence = (formKey, value) => {
      if (isEmpty(value) && isFieldRequired(formKey)) {
        const setValid = table5ValidSetters[formKey];
        if (setValid) setValid(false);
        hasErrors = true;
      }
    };

    checkPresence('time', table5FormData.time);
    checkPresence('mixNo', table5FormData.mixNo);
    checkField('permeability', table5FormData.permeability, { min: 90, max: 160 });
    checkField('wts', table5FormData.wts, { min: 0.15 });
    checkField('moisture', table5FormData.moisture, { min: 3.0, max: 4.0 });
    checkField('compactability', table5FormData.compactability, { min: 33, max: 40 });
    checkField('compressability', table5FormData.compressability, { min: 20, max: 28 });
    checkField('waterLitreKgMix', table5FormData.waterLitreKgMix, { min: 0 });
    checkField('sandTempBC', table5FormData.sandTempBC, { min: 0, max: 45 });
    checkField('sandTempWU', table5FormData.sandTempWU, { min: 0, max: 45 }, 'sandTempBC');
    checkField('sandTempSSU', table5FormData.sandTempSSU, { min: 0, max: 45 }, 'sandTempBC');
    checkField('newSandKgsMould', table5FormData.newSandKgsMould, { min: 0.0, max: 5.0 });
    checkField('preparedSandLumpsKg', table5FormData.preparedSandLumpsKg, { min: 0 });
    checkPresence('itemName', table5FormData.itemName);

    // Radio-driven "checkpoint decides destination" groups (G.C.S., Bentonite,
    // Premix/Coal Dust): a value typed without its checkpoint chosen has
    // nowhere unambiguous to be saved, so it's a hard block regardless of the
    // formKey's own `required` flag — that flag only ever meant "not
    // mandatory to fill at all," which stays true when neither is touched.
    // Checkpoint chosen + value(s) left blank is fine — the submit payload
    // below stores '-' for the untouched value(s).
    const checkCheckpointGroup = (checkpoint, values, setCheckpointValid, valueSetters) => {
      const anyEntered = values.some((v) => !isEmpty(v));
      if (anyEntered && !checkpoint) {
        setCheckpointValid(false);
        valueSetters.forEach((setValid) => setValid && setValid(false));
        hasErrors = true;
        return;
      }
      values.forEach((v, i) => {
        if (isEmpty(v)) return;
        const num = parseFloat(v);
        if (isNaN(num) || !isFinite(num)) {
          if (valueSetters[i]) valueSetters[i](false);
          hasErrors = true;
        }
      });
    };

    checkCheckpointGroup(table5FormData.gcsCheckpoint, [table5FormData.gcsValue], setGcsCheckpointValid, [setGcsValid]);
    checkCheckpointGroup(
      table5FormData.bentoniteCheckpoint,
      [table5FormData.bentoniteKgs, table5FormData.bentonitePercent],
      setBentoniteCheckpointValid,
      [setBentoniteKgsValid, setBentonitePercentValid]
    );
    checkCheckpointGroup(
      table5FormData.premixCoalCheckpoint,
      [table5FormData.premixCoalKgs, table5FormData.premixCoalPercent],
      setPremixCoalCheckpointValid,
      [setPremixCoalKgsValid, setPremixCoalPercentValid]
    );

    // Compactability Setting
    if (!table5FormData.compactabilityValue) {
      if (isFieldRequired('compactabilityValue')) { setCompactabilityValueValid(false); hasErrors = true; }
    } else if (isNaN(parseFloat(table5FormData.compactabilityValue)) || !isFinite(parseFloat(table5FormData.compactabilityValue))) {
      setCompactabilityValueValid(false);
      hasErrors = true;
    }

    // Mould Strength Setting
    if (!table5FormData.mouldStrengthValue) {
      if (isFieldRequired('mouldStrengthValue')) { setMouldStrengthValueValid(false); hasErrors = true; }
    } else if (isNaN(parseFloat(table5FormData.mouldStrengthValue)) || !isFinite(parseFloat(table5FormData.mouldStrengthValue))) {
      setMouldStrengthValueValid(false);
      hasErrors = true;
    }

    // Remarks is optional, no validation needed

    if (hasErrors) {
      showTableMessage(5, 'Please fill in all required fields correctly with valid values.', 'danger');
      return;
    }

    try {
      // Transform data to match backend model structure
      const dataToSave = {
        date: selectedDate,
        plant,
        sno: currentSNo === 0 ? 1 : currentSNo + 1,
        // '-' (not 0) when untouched — 0 is indistinguishable from a genuine
        // 12:00 AM reading once packed into this format.
        time: table5FormData.time ? table5FormData.time.hour * 100 + table5FormData.time.minute : '-',
        mixno: parseFloat(table5FormData.mixNo) || 0,
        permeability: parseFloat(table5FormData.permeability) || 0,
        gcsFdyA: table5FormData.gcsCheckpoint === 'FDY-A' ? (table5FormData.gcsValue.trim() || '-') : '-',
        gcsFdyB: table5FormData.gcsCheckpoint === 'FDY-B' ? (table5FormData.gcsValue.trim() || '-') : '-',
        wts: parseFloat(table5FormData.wts) || 0,
        moisture: parseFloat(table5FormData.moisture) || 0,
        compactability: parseFloat(table5FormData.compactability) || 0,
        compressibility: parseFloat(table5FormData.compressability) || 0,
        waterLitre: parseFloat(table5FormData.waterLitreKgMix) || 0,
        sandTemp: {
          BC: parseFloat(table5FormData.sandTempBC) || 0,
          WU: parseFloat(table5FormData.sandTempWU) || 0,
          SSUmax: parseFloat(table5FormData.sandTempSSU) || 0
        },
        newSandKgs: parseFloat(table5FormData.newSandKgsMould) || 0,
        mould: 0, // Not in form
        bentonite: {
          Kgs: table5FormData.bentoniteCheckpoint ? (table5FormData.bentoniteKgs.trim() || '-') : '-',
          Percent: table5FormData.bentoniteCheckpoint ? (table5FormData.bentonitePercent.trim() || '-') : '-',
          Checkpoint: table5FormData.bentoniteCheckpoint || '-'
        },
        premix: table5FormData.premixCoalCheckpoint === 'Premix' ? {
          Kgs: table5FormData.premixCoalKgs.trim() || '-',
          Percent: table5FormData.premixCoalPercent.trim() || '-'
        } : { Kgs: '-', Percent: '-' },
        coalDust: table5FormData.premixCoalCheckpoint === 'CoalDust' ? {
          Kgs: table5FormData.premixCoalKgs.trim() || '-',
          Percent: table5FormData.premixCoalPercent.trim() || '-'
        } : { Kgs: '-', Percent: '-' },
        // Single free-text-with-suggestions field now (previously a 2-box name+value
        // pair) — always writes to one fixed column per field. `lc`/`shearStrengthSetting`
        // are the old alternate columns; no longer written to, but still read by the
        // report for historical rows saved before this change.
        lc: 0,
        CompactabilitySettings: parseFloat(table5FormData.compactabilityValue) || 0,
        mouldStrength: parseFloat(table5FormData.mouldStrengthValue) || 0,
        shearStrengthSetting: 0,
        preparedSandlumps: parseFloat(table5FormData.preparedSandLumpsKg) || 0,
        itemName: table5FormData.itemName || '',
        remarks: table5FormData.remarks || ''
      };

      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/table/5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSave)
      });
      const result = await response.json();
      
      if (result.success) {
        showTableMessage(5, 'Table 5 data submitted successfully!', 'success');

        // Track the submitted entry for S.No auto-increment (display lives on the report page)
        setTable5Data(prev => [...prev, dataToSave]);

        // Increment S.No
        const newSNo = currentSNo === 0 ? 1 : currentSNo + 1;
        setCurrentSNo(newSNo);
        setNextTable5SNo(newSNo + 1);
        
        // Reset form and validation states
        handleTable5Reset();
        
        // Focus on first input (time)
        setTimeout(() => {
          if (timeRef && timeRef.current) {
            timeRef.current.focus();
          }
        }, 100);
      } else {
        showTableMessage(5, result.message || 'Failed to submit Table 5 data.', 'danger');
      }
    } catch (error) {
      console.error('Error saving Table 5 data:', error);
      showTableMessage(5, 'Error submitting Table 5 data. Please try again.', 'danger');
    }
  };

  // Handle form reset
  const handleTable5Reset = () => {
    setTable5FormData({
      time: null,
      mixNo: '',
      permeability: '',
      gcsCheckpoint: '',
      gcsValue: '',
      wts: '',
      moisture: '',
      compactability: '',
      compressability: '',
      waterLitreKgMix: '',
      sandTempBC: '',
      sandTempWU: '',
      sandTempSSU: '',
      newSandKgsMould: '',
      bentoniteCheckpoint: '',
      bentoniteKgs: '',
      bentonitePercent: '',
      premixCoalCheckpoint: '',
      premixCoalKgs: '',
      premixCoalPercent: '',
      compactabilityValue: '',
      mouldStrengthValue: '',
      preparedSandLumpsKg: '',
      itemName: '',
      remarks: ''
    });

    // Reset all validation states — each entry is independent, nothing carries over
    setTimeValid(null);
    setMixNoValid(null);
    setPermeabilityValid(null);
    setGcsCheckpointValid(null);
    setGcsValid(null);
    setWtsValid(null);
    setMoistureValid(null);
    setCompactabilityValid(null);
    setCompressabilityValid(null);
    setWaterLitreValid(null);
    setSandTempBCValid(null);
    setSandTempWUValid(null);
    setSandTempSSUValid(null);
    setNewSandValid(null);
    setBentoniteCheckpointValid(null);
    setBentoniteKgsValid(null);
    setBentonitePercentValid(null);
    setPremixCoalCheckpointValid(null);
    setPremixCoalKgsValid(null);
    setPremixCoalPercentValid(null);
    setCompactabilityValueValid(null);
    setMouldStrengthValueValid(null);
    setPreparedSandLumpsKgValid(null);
    setItemNameValid(null);
  };

  // State for Table 1a - array of inputs per cell with locked status
  const [table1aInputs, setTable1aInputs] = useState({
    '0_1': [{ value: '', locked: false }], 
    '0_2': [{ value: '', locked: false }], 
    '0_3': [{ value: '', locked: false }], // R. Sand row
    '1_1': [{ value: '', locked: false }], 
    '1_2': [{ value: '', locked: false }], 
    '1_3': [{ value: '', locked: false }], // N. Sand row
    '2_1': [{ value: '', locked: false }], 
    '2_2': [{ value: '', locked: false }], 
    '2_3': [{ value: '', locked: false }], // Mixing Mode row
    '3_1': [{ value: '', locked: false }], 
    '3_2': [{ value: '', locked: false }], 
    '3_3': [{ value: '', locked: false }], // Bentonite row
    '4_1': [{ value: '', locked: false }], 
    '4_2': [{ value: '', locked: false }], 
    '4_3': [{ value: '', locked: false }]  // Coal Dust/Premix row
  });

  // State for Table 1b - Batch No. inputs with independent locked states
  const [table1bInputs, setTable1bInputs] = useState({
    batchType: '', // 'coalDust' or 'premix'
    bentonite: '',
    value: '', // either coalDust or premix value based on radio selection
    bentoniteLocked: false,
    valueLocked: false
  });

  const addTable1aInput = (rowIndex, colIndex) => {
    const key = `${rowIndex}_${colIndex}`;
    const currentInputs = table1aInputs[key] || [];
    
    // Maximum limit of 4 inputs
    if (currentInputs.length >= 4) {
      return;
    }
    
    setTable1aInputs({
      ...table1aInputs,
      [key]: [...currentInputs, { value: '', locked: false }]
    });
  };

  const removeTable1aInput = (rowIndex, colIndex, inputIndex) => {
    const key = `${rowIndex}_${colIndex}`;
    const currentValues = table1aInputs[key];
    // Only allow removing if not locked and more than 1 entry
    if (currentValues.length > 1 && !currentValues[inputIndex].locked) {
      setTable1aInputs({
        ...table1aInputs,
        [key]: currentValues.filter((_, i) => i !== inputIndex)
      });
    }
  };

  // State for Table 2 - clayShifts with locked status
  const [table2Inputs, setTable2Inputs] = useState({
    // Row index_Column index: { value, locked }
    // Rows: 0=Total Clay, 1=Active Clay, 2=Dead Clay, 3=V.C.M., 4=L.O.I., 5=AFS No., 6=Fines
    // Columns: 0=Shift I, 1=Shift II, 2=Shift III
    '0_0': { value: '', locked: false }, '0_1': { value: '', locked: false }, '0_2': { value: '', locked: false },
    '1_0': { value: '', locked: false }, '1_1': { value: '', locked: false }, '1_2': { value: '', locked: false },
    '2_0': { value: '', locked: false }, '2_1': { value: '', locked: false }, '2_2': { value: '', locked: false },
    '3_0': { value: '', locked: false }, '3_1': { value: '', locked: false }, '3_2': { value: '', locked: false },
    '4_0': { value: '', locked: false }, '4_1': { value: '', locked: false }, '4_2': { value: '', locked: false },
    '5_0': { value: '', locked: false }, '5_1': { value: '', locked: false }, '5_2': { value: '', locked: false },
    '6_0': { value: '', locked: false }, '6_1': { value: '', locked: false }, '6_2': { value: '', locked: false }
  });

  // State for Table 3 - array of inputs per cell with locked status
  const [table3Inputs, setTable3Inputs] = useState({
    '0_0': [{ value: '', locked: false }], '0_1': [{ value: '', locked: false }], '0_2': [{ value: '', locked: false }], '0_3': [{ value: '', locked: false }], '0_4': [{ value: '', locked: false }], // Shift I
    '1_0': [{ value: '', locked: false }], '1_1': [{ value: '', locked: false }], '1_2': [{ value: '', locked: false }], '1_3': [{ value: '', locked: false }], '1_4': [{ value: '', locked: false }], // Shift II
    '2_0': [{ value: '', locked: false }], '2_1': [{ value: '', locked: false }], '2_2': [{ value: '', locked: false }], '2_3': [{ value: '', locked: false }], '2_4': [{ value: '', locked: false }]  // Shift III
  });

  // State for Table 4 - sandLump, newSandWt, and sandFriability with locked status
  const [table4Inputs, setTable4Inputs] = useState({
    sandLump: { value: '', locked: false },
    newSandWt: { value: '', locked: false },
    friabilityShiftI: { value: '', locked: false },
    friabilityShiftII: { value: '', locked: false },
    friabilityShiftIII: { value: '', locked: false }
  });

  const addTable3Input = (rowIndex, colIndex) => {
    // Start (col 0) and End (col 1) are paired — the Total is derived from them by
    // index, so adding a row to one must add the matching row to the other.
    if (colIndex === 0 || colIndex === 1) {
      const startKey = `${rowIndex}_0`;
      const endKey = `${rowIndex}_1`;
      const startInputs = table3Inputs[startKey] || [];
      const endInputs = table3Inputs[endKey] || [];
      // Respect the max-4 limit on both columns
      if (startInputs.length >= 4 || endInputs.length >= 4) {
        return;
      }
      setTable3Inputs({
        ...table3Inputs,
        [startKey]: [...startInputs, { value: '', locked: false }],
        [endKey]: [...endInputs, { value: '', locked: false }]
      });
      return;
    }

    const key = `${rowIndex}_${colIndex}`;
    const currentInputs = table3Inputs[key] || [];

    // Maximum limit of 4 inputs
    if (currentInputs.length >= 4) {
      return;
    }

    setTable3Inputs({
      ...table3Inputs,
      [key]: [...currentInputs, { value: '', locked: false }]
    });
  };

  const removeTable3Input = (rowIndex, colIndex, inputIndex) => {
    // Start (col 0) and End (col 1) are paired — remove the matching row from both.
    if (colIndex === 0 || colIndex === 1) {
      const startKey = `${rowIndex}_0`;
      const endKey = `${rowIndex}_1`;
      const startValues = table3Inputs[startKey] || [];
      const endValues = table3Inputs[endKey] || [];
      // Only remove when both columns have an unlocked entry at this index and >1 entry
      if (
        startValues.length > 1 && endValues.length > 1 &&
        !startValues[inputIndex]?.locked && !endValues[inputIndex]?.locked
      ) {
        setTable3Inputs({
          ...table3Inputs,
          [startKey]: startValues.filter((_, i) => i !== inputIndex),
          [endKey]: endValues.filter((_, i) => i !== inputIndex)
        });
      }
      return;
    }

    const key = `${rowIndex}_${colIndex}`;
    const currentValues = table3Inputs[key];
    // Only allow removing if not locked and more than 1 entry
    if (currentValues.length > 1 && !currentValues[inputIndex].locked) {
      setTable3Inputs({
        ...table3Inputs,
        [key]: currentValues.filter((_, i) => i !== inputIndex)
      });
    }
  };

  // Mix Testing Total is always derived from Start/End - never typed by the user
  const computeTable3Totals = (rowIndex) => {
    const startArr = table3Inputs[`${rowIndex}_0`] || [];
    const endArr = table3Inputs[`${rowIndex}_1`] || [];
    const len = Math.max(startArr.length, endArr.length);
    const totals = [];
    for (let i = 0; i < len; i++) {
      const s = parseFloat(startArr[i]?.value);
      const e = parseFloat(endArr[i]?.value);
      totals.push({
        value: (!isNaN(s) && !isNaN(e)) ? String(e - s) : '',
        locked: !!(startArr[i]?.locked || endArr[i]?.locked)
      });
    }
    return totals.length > 0 ? totals : [{ value: '', locked: false }];
  };

  // Start/End/Total are validated and resolved together per position (they're
  // already index-paired — addTable3Input/removeTable3Input grow/shrink Start
  // and End in lockstep): both blank skips the position; both filled requires
  // End >= Start; Start-only defaults End to 0 and stores it; End-only has no
  // Start to measure from and is rejected outright.
  const ROMAN_SHIFT = ['I', 'II', 'III'];
  const resolveTable3Row = (rowIndex) => {
    const startEntries = (table3Inputs[`${rowIndex}_0`] || []).filter(v => !v.locked);
    const endEntries = (table3Inputs[`${rowIndex}_1`] || []).filter(v => !v.locked);
    const len = Math.max(startEntries.length, endEntries.length);

    const start = [];
    const end = [];
    const total = [];

    for (let i = 0; i < len; i++) {
      const sRaw = (startEntries[i]?.value || '').trim();
      const eRaw = (endEntries[i]?.value || '').trim();
      if (!sRaw && !eRaw) continue;

      if (!sRaw && eRaw) {
        return { error: `Shift ${ROMAN_SHIFT[rowIndex]}: an End value needs a Start value first — enter Start or clear End.` };
      }

      if (sRaw && !eRaw) {
        // Start-only: End defaults to 0 and is stored as such.
        const s = parseFloat(sRaw);
        start.push(sRaw);
        end.push('0');
        total.push(!isNaN(s) ? String(0 - s) : '');
        continue;
      }

      const s = parseFloat(sRaw);
      const e = parseFloat(eRaw);
      if (!isNaN(s) && !isNaN(e) && e < s) {
        return { error: `Shift ${ROMAN_SHIFT[rowIndex]}: End (${eRaw}) must be greater than or equal to Start (${sRaw}).` };
      }
      start.push(sRaw);
      end.push(eRaw);
      total.push((!isNaN(s) && !isNaN(e)) ? String(e - s) : '');
    }

    return { start, end, total };
  };
  const checkExistingData = async (date, plantType) => {
    const MINIMUM_LOADING_TIME = 1500; // 1.5 seconds minimum for full animation
    const startTime = Date.now();

    try {
      setIsLoading(true);
      setIsFetchingCombination(true);
      setShowCombinationFound(false);

      // Validate date format before making API call
      if (!date || date.trim() === '' || !/\d{4}-\d{2}-\d{2}/.test(date)) {
        console.error('Invalid date format:', date);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/date/${date}?plant=${plantType}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setIsFetchingCombination(false);
        if (result.success && result.data && result.data.length > 0) {
          setShowCombinationFound(true);
          setTimeout(() => setShowCombinationFound(false), 1500);
          setIsPrimaryDataSaved(true);
          const existingData = result.data[0];
          
          // Load Table 1 data - mark existing entries as locked
          if (existingData.sandShifts) {
            const newTable1aInputs = {};
            
            // Map shift data to table cells
            const shifts = ['shiftI', 'shiftII', 'shiftIII'];
            const fields = ['rSand', 'nSand', 'mixingMode', 'bentonite', 'coalDustPremix'];
            
            shifts.forEach((shift, shiftIndex) => {
              fields.forEach((field, fieldIndex) => {
                const key = `${fieldIndex}_${shiftIndex + 1}`;
                let existingValues = existingData.sandShifts[shift]?.[field];
                // Ensure existingValues is an array
                existingValues = Array.isArray(existingValues) ? existingValues : [];
                
                if (existingValues.length > 0) {
                  // Existing values are locked
                  const lockedEntries = existingValues.map(val => ({ value: val, locked: true }));
                  // Add one empty unlocked entry for new data only if less than 4 entries
                  if (lockedEntries.length < 4) {
                    newTable1aInputs[key] = [...lockedEntries, { value: '', locked: false }];
                  } else {
                    newTable1aInputs[key] = lockedEntries;
                  }
                } else {
                  newTable1aInputs[key] = [{ value: '', locked: false }];
                }
              });
            });
            
            setTable1aInputs(newTable1aInputs);
            
            // Load Table 1b data
            if (existingData.sandShifts.batchNo) {
              const batchNo = existingData.sandShifts.batchNo;
              const hasCoalDust = batchNo.coalDust && batchNo.coalDust.trim() !== '';
              const hasPremix = batchNo.premix && batchNo.premix.trim() !== '';
              const hasBentonite = batchNo.bentonite && batchNo.bentonite.trim() !== '';
              
              setTable1bInputs({
                batchType: hasCoalDust ? 'coalDust' : (hasPremix ? 'premix' : ''),
                bentonite: batchNo.bentonite || '',
                value: batchNo.coalDust || batchNo.premix || '',
                bentoniteLocked: hasBentonite,
                valueLocked: hasCoalDust || hasPremix
              });
              setTable1Locked(hasBentonite || hasCoalDust || hasPremix);
            }
          } else {
            // Reset to default unlocked state
            setTable1Locked(false);
          }

          // Check other tables...
          const hasTable2Data = existingData.clayShifts && (
            existingData.clayShifts.shiftI?.totalClay ||
            existingData.clayShifts.ShiftII?.totalClay ||
            existingData.clayShifts.ShiftIII?.totalClay
          );
          setTable2Locked(hasTable2Data);
          
          // Load Table 2 data - mark existing entries as locked
          if (existingData.clayShifts) {
            const newTable2Inputs = {};
            
            const shifts = ['shiftI', 'ShiftII', 'ShiftIII'];
            const fields = ['totalClay', 'activeClay', 'deadClay', 'vcm', 'loi', 'afsNo', 'fines'];
            
            shifts.forEach((shift, shiftIndex) => {
              fields.forEach((field, fieldIndex) => {
                const key = `${fieldIndex}_${shiftIndex}`;
                const existingValue = existingData.clayShifts[shift]?.[field] || '';
                const hasValue = existingValue && existingValue.trim() !== '';
                
                newTable2Inputs[key] = {
                  value: existingValue,
                  locked: hasValue
                };
              });
            });
            
            setTable2Inputs(newTable2Inputs);
          }

          const hasTable3Data = existingData.mixshifts && (
            existingData.mixshifts.ShiftI?.mixno?.start ||
            existingData.mixshifts.ShiftII?.mixno?.start ||
            existingData.mixshifts.ShiftIII?.mixno?.start
          );
          setTable3Locked(hasTable3Data);
          
          // Load Table 3 data - mark existing entries as locked
          if (existingData.mixshifts) {
            const newTable3Inputs = {};
            
            const shifts = ['ShiftI', 'ShiftII', 'ShiftIII'];
            // Total is derived from Start/End at render time, so it isn't loaded as an editable field
            const fieldMappings = [
              { key: 0, path: 'mixno.start' },
              { key: 1, path: 'mixno.end' },
              { key: 3, path: 'numberOfMixRejected' },
              { key: 4, path: 'returnSandHopperLevel' }
            ];
            
            shifts.forEach((shift, shiftIndex) => {
              fieldMappings.forEach(({ key, path }) => {
                const cellKey = `${shiftIndex}_${key}`;
                const pathParts = path.split('.');
                let existingValues = existingData.mixshifts[shift];
                
                for (const part of pathParts) {
                  existingValues = existingValues?.[part];
                }
                
                // Ensure existingValues is an array
                existingValues = Array.isArray(existingValues) ? existingValues : [];
                
                if (existingValues.length > 0) {
                  const lockedEntries = existingValues.map(val => ({ value: val, locked: true }));
                  // Add one empty unlocked entry for new data only if less than 4 entries
                  if (lockedEntries.length < 4) {
                    newTable3Inputs[cellKey] = [...lockedEntries, { value: '', locked: false }];
                  } else {
                    newTable3Inputs[cellKey] = lockedEntries;
                  }
                } else {
                  newTable3Inputs[cellKey] = [{ value: '', locked: false }];
                }
              });
            });
            
            setTable3Inputs(newTable3Inputs);
          }

          const hasTable4Data = existingData.sandLump || existingData.newSandWt;
          setTable4Locked(hasTable4Data);
          
          // Load Table 4 data - mark existing entries as locked
          const newTable4Inputs = {
            sandLump: {
              value: existingData.sandLump || '',
              locked: !!(existingData.sandLump && existingData.sandLump.trim() !== '')
            },
            newSandWt: {
              value: existingData.newSandWt || '',
              locked: !!(existingData.newSandWt && existingData.newSandWt.trim() !== '')
            },
            friabilityShiftI: {
              value: existingData.sandFriability?.shiftI || '',
              locked: !!(existingData.sandFriability?.shiftI && existingData.sandFriability.shiftI.trim() !== '')
            },
            friabilityShiftII: {
              value: existingData.sandFriability?.shiftII || '',
              locked: !!(existingData.sandFriability?.shiftII && existingData.sandFriability.shiftII.trim() !== '')
            },
            friabilityShiftIII: {
              value: existingData.sandFriability?.shiftIII || '',
              locked: !!(existingData.sandFriability?.shiftIII && existingData.sandFriability.shiftIII.trim() !== '')
            }
          };
          setTable4Inputs(newTable4Inputs);

          const hasTable5Data = existingData.testParameter && existingData.testParameter.length > 0;
          setTable5Locked(hasTable5Data);

          // Load Table 5 data - continue S.No from the highest stored entry. Each new entry
          // chooses its own options independently, so nothing is pre-populated or locked.
          if (hasTable5Data && existingData.testParameter.length > 0) {
            setTable5Data(existingData.testParameter);

            const maxSNo = Math.max(...existingData.testParameter.map(entry => entry.sno || 0));
            setCurrentSNo(maxSNo);
            setNextTable5SNo(maxSNo + 1);
          } else {
            // Reset if no Table 5 data
            setTable5Data([]);
            setCurrentSNo(0);
            setNextTable5SNo(1);
          }

        } else {
          // No data exists, reset to unlocked default state
          setIsPrimaryDataSaved(false);
          setTable1Locked(false);
          setTable2Locked(false);
          setTable3Locked(false);
          setTable4Locked(false);
          setTable5Locked(false);
          
          // Reset Table 1 to default empty state
          setTable1aInputs({
            '0_1': [{ value: '', locked: false }], '0_2': [{ value: '', locked: false }], '0_3': [{ value: '', locked: false }],
            '1_1': [{ value: '', locked: false }], '1_2': [{ value: '', locked: false }], '1_3': [{ value: '', locked: false }],
            '2_1': [{ value: '', locked: false }], '2_2': [{ value: '', locked: false }], '2_3': [{ value: '', locked: false }],
            '3_1': [{ value: '', locked: false }], '3_2': [{ value: '', locked: false }], '3_3': [{ value: '', locked: false }],
            '4_1': [{ value: '', locked: false }], '4_2': [{ value: '', locked: false }], '4_3': [{ value: '', locked: false }]
          });
          
          setTable1bInputs({
            batchType: '',
            bentonite: '',
            value: '',
            bentoniteLocked: false,
            valueLocked: false
          });
          
          // Reset Table 3 to default empty state
          setTable3Inputs({
            '0_0': [{ value: '', locked: false }], '0_1': [{ value: '', locked: false }], '0_2': [{ value: '', locked: false }], '0_3': [{ value: '', locked: false }], '0_4': [{ value: '', locked: false }],
            '1_0': [{ value: '', locked: false }], '1_1': [{ value: '', locked: false }], '1_2': [{ value: '', locked: false }], '1_3': [{ value: '', locked: false }], '1_4': [{ value: '', locked: false }],
            '2_0': [{ value: '', locked: false }], '2_1': [{ value: '', locked: false }], '2_2': [{ value: '', locked: false }], '2_3': [{ value: '', locked: false }], '2_4': [{ value: '', locked: false }]
          });
          
          // Reset Table 2 to default empty state
          setTable2Inputs({
            '0_0': { value: '', locked: false }, '0_1': { value: '', locked: false }, '0_2': { value: '', locked: false },
            '1_0': { value: '', locked: false }, '1_1': { value: '', locked: false }, '1_2': { value: '', locked: false },
            '2_0': { value: '', locked: false }, '2_1': { value: '', locked: false }, '2_2': { value: '', locked: false },
            '3_0': { value: '', locked: false }, '3_1': { value: '', locked: false }, '3_2': { value: '', locked: false },
            '4_0': { value: '', locked: false }, '4_1': { value: '', locked: false }, '4_2': { value: '', locked: false },
            '5_0': { value: '', locked: false }, '5_1': { value: '', locked: false }, '5_2': { value: '', locked: false },
            '6_0': { value: '', locked: false }, '6_1': { value: '', locked: false }, '6_2': { value: '', locked: false }
          });
          
          // Reset Table 4 to default empty state
          setTable4Inputs({
            sandLump: { value: '', locked: false },
            newSandWt: { value: '', locked: false },
            friabilityShiftI: { value: '', locked: false },
            friabilityShiftII: { value: '', locked: false },
            friabilityShiftIII: { value: '', locked: false }
          });
          
          // Reset Table 5 (Sand Properties & Test Parameters)
          setTable5Data([]);
          setCurrentSNo(0);
          setNextTable5SNo(1);
          handleTable5Reset();
        }
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
      setIsFetchingCombination(false);
      setIsPrimaryDataSaved(false);
    } finally {
      // Ensure minimum loading time has passed before hiding loader
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    }
  };

  // Check for existing data when date or plant changes
  useEffect(() => {
    if (selectedDate && selectedDate.trim() !== '' && /\d{4}-\d{2}-\d{2}/.test(selectedDate)) {
      checkExistingData(selectedDate, plant);

      // Track initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    } else if (selectedDate === '') {
      // Reset all tables when no date selected
      resetAllTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, plant]);

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

  // Reset all tables to default state
  const resetAllTables = () => {
    setIsPrimaryDataSaved(false);
    // Reset Table 1a
    setTable1aInputs({
      '0_1': [{ value: '', locked: false }], '0_2': [{ value: '', locked: false }], '0_3': [{ value: '', locked: false }],
      '1_1': [{ value: '', locked: false }], '1_2': [{ value: '', locked: false }], '1_3': [{ value: '', locked: false }],
      '2_1': [{ value: '', locked: false }], '2_2': [{ value: '', locked: false }], '2_3': [{ value: '', locked: false }],
      '3_1': [{ value: '', locked: false }], '3_2': [{ value: '', locked: false }], '3_3': [{ value: '', locked: false }],
      '4_1': [{ value: '', locked: false }], '4_2': [{ value: '', locked: false }], '4_3': [{ value: '', locked: false }]
    });
    
    // Reset Table 1b
    setTable1bInputs({
      batchType: '',
      bentonite: '',
      value: '',
      bentoniteLocked: false,
      valueLocked: false
    });
    
    // Reset Table 2
    const resetTable2 = {};
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 3; col++) {
        resetTable2[`${row}_${col}`] = { value: '', locked: false };
      }
    }
    setTable2Inputs(resetTable2);
    
    // Reset Table 3
    const resetTable3 = {};
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        resetTable3[`${row}_${col}`] = [{ value: '', locked: false }];
      }
    }
    setTable3Inputs(resetTable3);
    
    // Reset Table 4
    setTable4Inputs({
      sandLump: { value: '', locked: false },
      newSandWt: { value: '', locked: false },
      friabilityShiftI: { value: '', locked: false },
      friabilityShiftII: { value: '', locked: false },
      friabilityShiftIII: { value: '', locked: false }
    });
    
    // Reset Table 5
    setTable5Data([]);
    setNextTable5SNo(1);
    handleTable5Reset();
  };

  // Persist just the Date+Plant combination — unlocks the 5 sections below
  // without needing any table data yet. Mirrors ReturnSandFoundrySandTestingNote.jsx's
  // handlePrimarySubmit; there's no "update primary" here since Date+Plant is a
  // pure combination key with nothing else to change once saved.
  const handleSavePrimary = async () => {
    if (!selectedDate || !plant) return;

    setPrimaryMessage(null);

    try {
      setSavingPrimary(true);

      const res = await fetch(`${API_ENDPOINTS.sandTestingRecords}/primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date: selectedDate, plant })
      });
      const response = await res.json();

      if (response.success) {
        setShowCombinationAdded(true);
        setTimeout(() => setShowCombinationAdded(false), 1500);
        setIsPrimaryDataSaved(true);
      } else {
        setPrimaryMessage({ text: response.message || 'Failed to save primary data.', variant: 'danger' });
      }
    } catch (error) {
      console.error('Error saving primary data:', error);
      setPrimaryMessage({ text: 'Failed to save primary data. Please try again.', variant: 'danger' });
    } finally {
      setSavingPrimary(false);
    }
  };

  // Handlers for Table 1
  const handleTable1Submit = async () => {
    setTableMessages(prev => ({ ...prev, 1: null }));
    try {
      // Validate date before making API call
      if (!selectedDate || selectedDate.trim() === '' || !/\d{4}-\d{2}-\d{2}/.test(selectedDate)) {
        showTableMessage(1, 'Please select a valid date before submitting.', 'danger');
        return;
      }

      // Transform table1aInputs to match backend structure - only submit unlocked (new) entries
      const sandShifts = {
        shiftI: {
          rSand: (table1aInputs['0_1'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          nSand: (table1aInputs['1_1'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          mixingMode: (table1aInputs['2_1'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          bentonite: (table1aInputs['3_1'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          coalDustPremix: (table1aInputs['4_1'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value)
        },
        shiftII: {
          rSand: (table1aInputs['0_2'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          nSand: (table1aInputs['1_2'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          mixingMode: (table1aInputs['2_2'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          bentonite: (table1aInputs['3_2'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          coalDustPremix: (table1aInputs['4_2'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value)
        },
        shiftIII: {
          rSand: (table1aInputs['0_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          nSand: (table1aInputs['1_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          mixingMode: (table1aInputs['2_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          bentonite: (table1aInputs['3_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          coalDustPremix: (table1aInputs['4_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value)
        },
        batchNo: {
          bentonite: (!table1bInputs.bentoniteLocked && table1bInputs.bentonite && table1bInputs.bentonite.trim() !== '') ? table1bInputs.bentonite : '',
          coalDust: (!table1bInputs.valueLocked && table1bInputs.batchType === 'coalDust' && table1bInputs.value && table1bInputs.value.trim() !== '') ? table1bInputs.value : '',
          premix: (!table1bInputs.valueLocked && table1bInputs.batchType === 'premix' && table1bInputs.value && table1bInputs.value.trim() !== '') ? table1bInputs.value : ''
        }
      };

      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/table/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: sends authentication cookie
        body: JSON.stringify({
          date: selectedDate,
          plant,
          ...sandShifts
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showTableMessage(1, 'Table 1 data submitted successfully!', 'success');
        // Reload data to lock newly submitted entries
        await checkExistingData(selectedDate, plant);
      } else {
        showTableMessage(1, result.message || 'Failed to submit Table 1 data.', 'danger');
      }
    } catch (error) {
      console.error('Error submitting Table 1:', error);
      showTableMessage(1, 'Error submitting Table 1 data. Please try again.', 'danger');
    }
  };

  // Handlers for Table 2
  const handleTable2Submit = async () => {
    setTableMessages(prev => ({ ...prev, 2: null }));
    try {
      // Validate date before making API call
      if (!selectedDate || selectedDate.trim() === '' || !/\d{4}-\d{2}-\d{2}/.test(selectedDate)) {
        showTableMessage(2, 'Please select a valid date before submitting.', 'danger');
        return;
      }

      // Transform table2Inputs to match backend structure - only submit unlocked (new) entries
      const clayShifts = {
        shiftI: {
          totalClay: !table2Inputs['0_0'].locked && table2Inputs['0_0'].value.trim() !== '' ? table2Inputs['0_0'].value : '',
          activeClay: !table2Inputs['1_0'].locked && table2Inputs['1_0'].value.trim() !== '' ? table2Inputs['1_0'].value : '',
          deadClay: !table2Inputs['2_0'].locked && table2Inputs['2_0'].value.trim() !== '' ? table2Inputs['2_0'].value : '',
          vcm: !table2Inputs['3_0'].locked && table2Inputs['3_0'].value.trim() !== '' ? table2Inputs['3_0'].value : '',
          loi: !table2Inputs['4_0'].locked && table2Inputs['4_0'].value.trim() !== '' ? table2Inputs['4_0'].value : '',
          afsNo: !table2Inputs['5_0'].locked && table2Inputs['5_0'].value.trim() !== '' ? table2Inputs['5_0'].value : '',
          fines: !table2Inputs['6_0'].locked && table2Inputs['6_0'].value.trim() !== '' ? table2Inputs['6_0'].value : ''
        },
        ShiftII: {
          totalClay: !table2Inputs['0_1'].locked && table2Inputs['0_1'].value.trim() !== '' ? table2Inputs['0_1'].value : '',
          activeClay: !table2Inputs['1_1'].locked && table2Inputs['1_1'].value.trim() !== '' ? table2Inputs['1_1'].value : '',
          deadClay: !table2Inputs['2_1'].locked && table2Inputs['2_1'].value.trim() !== '' ? table2Inputs['2_1'].value : '',
          vcm: !table2Inputs['3_1'].locked && table2Inputs['3_1'].value.trim() !== '' ? table2Inputs['3_1'].value : '',
          loi: !table2Inputs['4_1'].locked && table2Inputs['4_1'].value.trim() !== '' ? table2Inputs['4_1'].value : '',
          afsNo: !table2Inputs['5_1'].locked && table2Inputs['5_1'].value.trim() !== '' ? table2Inputs['5_1'].value : '',
          fines: !table2Inputs['6_1'].locked && table2Inputs['6_1'].value.trim() !== '' ? table2Inputs['6_1'].value : ''
        },
        ShiftIII: {
          totalClay: !table2Inputs['0_2'].locked && table2Inputs['0_2'].value.trim() !== '' ? table2Inputs['0_2'].value : '',
          activeClay: !table2Inputs['1_2'].locked && table2Inputs['1_2'].value.trim() !== '' ? table2Inputs['1_2'].value : '',
          deadClay: !table2Inputs['2_2'].locked && table2Inputs['2_2'].value.trim() !== '' ? table2Inputs['2_2'].value : '',
          vcm: !table2Inputs['3_2'].locked && table2Inputs['3_2'].value.trim() !== '' ? table2Inputs['3_2'].value : '',
          loi: !table2Inputs['4_2'].locked && table2Inputs['4_2'].value.trim() !== '' ? table2Inputs['4_2'].value : '',
          afsNo: !table2Inputs['5_2'].locked && table2Inputs['5_2'].value.trim() !== '' ? table2Inputs['5_2'].value : '',
          fines: !table2Inputs['6_2'].locked && table2Inputs['6_2'].value.trim() !== '' ? table2Inputs['6_2'].value : ''
        }
      };

      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/table/2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: selectedDate,
          plant,
          ...clayShifts
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showTableMessage(2, 'Table 2 data submitted successfully!', 'success');
        // Reload data to lock newly submitted entries
        await checkExistingData(selectedDate, plant);
      } else {
        showTableMessage(2, result.message || 'Failed to submit Table 2 data.', 'danger');
      }
    } catch (error) {
      console.error('Error submitting Table 2:', error);
      showTableMessage(2, 'Error submitting Table 2 data. Please try again.', 'danger');
    }
  };

  // Handlers for Table 3
  const handleTable3Submit = async () => {
    setTableMessages(prev => ({ ...prev, 3: null }));
    try {
      // Validate date before making API call
      if (!selectedDate || selectedDate.trim() === '' || !/\d{4}-\d{2}-\d{2}/.test(selectedDate)) {
        showTableMessage(3, 'Please select a valid date before submitting.', 'danger');
        return;
      }

      // Resolve Start/End/Total together (validates End >= Start, defaults a
      // Start-only entry's End to 0, rejects an End-only entry) before
      // building anything else — a validation failure on any shift aborts
      // the whole submit, nothing is sent.
      const table3Rows = [0, 1, 2].map(resolveTable3Row);
      const invalidRow = table3Rows.find(r => r.error);
      if (invalidRow) {
        showTableMessage(3, invalidRow.error, 'danger');
        return;
      }

      // Transform table3Inputs to match backend structure - only submit unlocked (new) entries
      const mixshifts = {
        ShiftI: {
          mixno: table3Rows[0],
          numberOfMixRejected: (table3Inputs['0_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          returnSandHopperLevel: (table3Inputs['0_4'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value)
        },
        ShiftII: {
          mixno: table3Rows[1],
          numberOfMixRejected: (table3Inputs['1_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          returnSandHopperLevel: (table3Inputs['1_4'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value)
        },
        ShiftIII: {
          mixno: table3Rows[2],
          numberOfMixRejected: (table3Inputs['2_3'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value),
          returnSandHopperLevel: (table3Inputs['2_4'] || []).filter(v => !v.locked && v.value.trim() !== '').map(v => v.value)
        }
      };

      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/table/3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: selectedDate,
          plant,
          ...mixshifts
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showTableMessage(3, 'Table 3 data submitted successfully!', 'success');
        // Reload data to lock newly submitted entries
        await checkExistingData(selectedDate, plant);
      } else {
        showTableMessage(3, result.message || 'Failed to submit Table 3 data.', 'danger');
      }
    } catch (error) {
      console.error('Error submitting Table 3:', error);
      showTableMessage(3, 'Error submitting Table 3 data. Please try again.', 'danger');
    }
  };

  // Handlers for Table 4
  const handleTable4Submit = async () => {
    setTableMessages(prev => ({ ...prev, 4: null }));
    try {
      // Validate date before making API call
      if (!selectedDate || selectedDate.trim() === '' || !/\d{4}-\d{2}-\d{2}/.test(selectedDate)) {
        showTableMessage(4, 'Please select a valid date before submitting.', 'danger');
        return;
      }

      // Build table4Data object with only non-empty unlocked values
      const table4Data = {};
      
      // Only include sandLump if it's unlocked and has a value
      if (!table4Inputs.sandLump.locked && table4Inputs.sandLump.value.trim() !== '') {
        table4Data.sandLump = table4Inputs.sandLump.value;
      }
      
      // Only include newSandWt if it's unlocked and has a value
      if (!table4Inputs.newSandWt.locked && table4Inputs.newSandWt.value.trim() !== '') {
        table4Data.newSandWt = table4Inputs.newSandWt.value;
      }
      
      // Build sandFriability object only with non-empty unlocked shift values
      const friabilityData = {};
      if (!table4Inputs.friabilityShiftI.locked && table4Inputs.friabilityShiftI.value.trim() !== '') {
        friabilityData.shiftI = table4Inputs.friabilityShiftI.value;
      }
      if (!table4Inputs.friabilityShiftII.locked && table4Inputs.friabilityShiftII.value.trim() !== '') {
        friabilityData.shiftII = table4Inputs.friabilityShiftII.value;
      }
      if (!table4Inputs.friabilityShiftIII.locked && table4Inputs.friabilityShiftIII.value.trim() !== '') {
        friabilityData.shiftIII = table4Inputs.friabilityShiftIII.value;
      }
      
      // Only include sandFriability if at least one shift has data
      if (Object.keys(friabilityData).length > 0) {
        table4Data.sandFriability = friabilityData;
      }

      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/table/4`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: selectedDate,
          plant,
          ...table4Data
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showTableMessage(4, 'Table 4 data submitted successfully!', 'success');
        // Reload data to lock newly submitted entries
        await checkExistingData(selectedDate, plant);
      } else {
        showTableMessage(4, result.message || 'Failed to submit Table 4 data.', 'danger');
      }
    } catch (error) {
      console.error('Error submitting Table 4:', error);
      showTableMessage(4, 'Error submitting Table 4 data. Please try again.', 'danger');
    }
  };

  return (
    <>


      {/* Header */}
      <div className="sand-header">
        <div className="sand-header-text">
          <h2>
            <BookOpen size={28} style={{ color: '#5B9AA9' }} />
            Sand Testing Record
            <InfoIcon onClick={openInfoModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {selectedDate ? (() => {
            const [y, m, d] = selectedDate.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      <InfoCard
        isOpen={isInfoOpen}
        onClose={closeInfoModal}
        title="Sand Testing Record - Validation Ranges & Data Entry Flow"
        validationRanges={sandTestingValidationRanges}
      />
      <h3 className="foundry-section-title">Primary</h3>
      <div className={`foundry-form-grid${highlightPrimaryFields ? ' primary-highlight' : ''}`}>
        <div className="foundry-form-group">
          <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
          <CustomDatePicker
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="foundry-form-group">
          <label>Plant <span style={{ color: '#ef4444' }}>*</span></label>
          <PlantDropdown
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
            name="plant"
          />
        </div>
        <div className="foundry-form-group">
          <label>&nbsp;</label>
          <LockPrimaryButton
            onClick={handleSavePrimary}
            disabled={!selectedDate || !plant || isPrimaryDataSaved}
            isLocked={isPrimaryDataSaved}
            statusMessage={
              isFetchingCombination ? 'Fetching Date, Plant'
                : showCombinationFound ? 'Combination found'
                : savingPrimary ? 'Saving...'
                : showCombinationAdded ? 'Combination Added'
                : null
            }
            statusVariant={isFetchingCombination || savingPrimary ? 'primary' : 'success'}
          />
          {(showPrimaryWarning || primaryMessage) && (
            <div style={{ marginTop: '0.5rem' }}>
              {showPrimaryWarning && (
                <InlineLoader message="Save Date, Plant first" size="medium" variant="danger" />
              )}
              {primaryMessage && (
                <InlineLoader message={primaryMessage.text} variant={primaryMessage.variant} size="medium" />
              )}
            </div>
          )}
        </div>
      </div>

      <div ref={gridRef} onKeyDown={handleArrowKeyDown}>
      {/* Table 1 */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand & Mix Testing {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
        {/* Table 1a - with Shift headers and input fields */}
        <div className="foundry-table-wrapper" style={{ marginBottom: '1rem' }}>
        <Table
          template
          showHeader={true}
          rows={5}
          columns={[
            { key: 'col1', label: 'Shift', bold: true, align: 'center' },
            { key: 'col2', label: 'I', align: 'center' },
            { key: 'col3', label: 'II', align: 'center' },
            { key: 'col4', label: 'III', align: 'center' }
          ]}
          renderCell={(rowIndex, colIndex) => {
            // First column: row labels
            if (colIndex === 0) {
              const labels = [
                'R. Sand ( Kgs. / Mix )',
                'N. Sand ( Kgs. / Mould )',
                'Mixing Mode',
                'Bentonite ( Kgs. / Mix )',
                'Coal Dust / Premix ( Kgs. / Mix )'
              ];
              return <strong style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#1e293b' }}>{labels[rowIndex]}</strong>;
            }

            // Other columns: input fields
            const key = `${rowIndex}_${colIndex}`;
            const values = table1aInputs[key] || [{ value: '', locked: false }];

            return (
              <div style={{ padding: '8px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: values.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {values.map((item, inputIndex) => (
                    <div key={inputIndex} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="text"
                        value={item.value}
                        placeholder={item.locked ? "Locked" : "Enter value"}
                        disabled={!isPrimaryDataSaved || item.locked}
                        onChange={(e) => {
                          const newValues = [...values];
                          newValues[inputIndex].value = e.target.value;
                          setTable1aInputs({
                            ...table1aInputs,
                            [key]: newValues
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          outline: 'none',
                          backgroundColor: (!isPrimaryDataSaved || item.locked) ? '#f1f5f9' : 'white',
                          cursor: (!isPrimaryDataSaved || item.locked) ? 'not-allowed' : 'text'
                        }}
                      />
                      {!item.locked && inputIndex === values.length - 1 && values.length > 1 && (
                        <MinusButton
                          onClick={() => removeTable1aInput(rowIndex, colIndex, inputIndex)}
                          title="Remove entry" 
                        />
                      )}
                      {!item.locked && inputIndex === values.length - 1 && values.length < 4 && (
                        <PlusButton 
                          onClick={() => addTable1aInput(rowIndex, colIndex)} 
                          title="Add entry" 
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
          minWidth="800px"
        />
      </div>

      {/* Table 1b - BATCH No. with Bentonite and radio buttons */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '600px' }}>
            <tbody>
              <tr style={{ height: '50px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>BATCH No.</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Bentonite</td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: (!isPrimaryDataSaved || table1bInputs.valueLocked) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: (!isPrimaryDataSaved || table1bInputs.valueLocked) ? 0.6 : 1, fontSize: '1rem', fontWeight: '500' }}>
                      <input
                        type="radio"
                        name="table1b_type"
                        value="coalDust"
                        checked={table1bInputs.batchType === 'coalDust'}
                        onChange={(e) => setTable1bInputs({...table1bInputs, batchType: e.target.value})}
                        disabled={!isPrimaryDataSaved || table1bInputs.valueLocked}
                        style={{ cursor: (!isPrimaryDataSaved || table1bInputs.valueLocked) ? 'not-allowed' : 'pointer', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '1rem' }}>Coal Dust</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: (!isPrimaryDataSaved || table1bInputs.valueLocked) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: (!isPrimaryDataSaved || table1bInputs.valueLocked) ? 0.6 : 1, fontSize: '1rem', fontWeight: '500' }}>
                      <input
                        type="radio"
                        name="table1b_type"
                        value="premix"
                        checked={table1bInputs.batchType === 'premix'}
                        onChange={(e) => setTable1bInputs({...table1bInputs, batchType: e.target.value})}
                        disabled={!isPrimaryDataSaved || table1bInputs.valueLocked}
                        style={{ cursor: (!isPrimaryDataSaved || table1bInputs.valueLocked) ? 'not-allowed' : 'pointer', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '1rem' }}>Premix</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr style={{ height: '50px' }}>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <input 
                    type="text" 
                    value={table1bInputs.bentonite}
                    onChange={(e) => setTable1bInputs({...table1bInputs, bentonite: e.target.value})}
                    placeholder={table1bInputs.bentoniteLocked ? "Locked" : "Enter bentonite value"}
                    disabled={!isPrimaryDataSaved || table1bInputs.bentoniteLocked}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      fontSize: '1rem', 
                      textAlign: 'center',
                      backgroundColor: (!isPrimaryDataSaved || table1bInputs.bentoniteLocked) ? '#f1f5f9' : 'white',
                      cursor: (!isPrimaryDataSaved || table1bInputs.bentoniteLocked) ? 'not-allowed' : 'text'
                    }} 
                  />
                </td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <input 
                    type="text" 
                    value={table1bInputs.value}
                    onChange={(e) => setTable1bInputs({...table1bInputs, value: e.target.value})}
                    placeholder={table1bInputs.valueLocked ? "Locked" : (table1bInputs.batchType === 'coalDust' ? 'Enter coal dust value' : 'Enter premix value')}
                    disabled={!isPrimaryDataSaved || table1bInputs.valueLocked || !table1bInputs.batchType}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '4px', 
                      fontSize: '1rem', 
                      textAlign: 'center',
                      backgroundColor: (!isPrimaryDataSaved || table1bInputs.valueLocked || !table1bInputs.batchType) ? '#f1f5f9' : 'white',
                      cursor: (!isPrimaryDataSaved || table1bInputs.valueLocked || !table1bInputs.batchType) ? 'not-allowed' : 'text'
                    }} 
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Table 1 Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          {tableMessages[1] && (
            <InlineLoader message={tableMessages[1].text} variant={tableMessages[1].variant} size="medium" />
          )}
          <SubmitButton onClick={handleTable1Submit} disabled={!isPrimaryDataSaved} />
        </div>
      </div>
      </div>

      {/* Table 2 */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Clay Testing {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
        {/* Table 2 - 8x4 with header */}
        <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px' }}>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
              </tr>
              {/* Data Rows */}
              {[
                'Total Clay (11.0-14.5%)',
                'Active Clay (8.5-11.0%)',
                'Dead Clay (2.0-4.0%)',
                'V.C.M. (2.0-3.2%)',
                'L.O.I. (4.5-6.0%)',
                'AFS No. (Min. 48)',
                'Fines (10% Max)'
              ].map((label, rowIndex) => (
                <tr key={rowIndex} style={{ height: '50px' }}>
                  <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{label}</td>
                  {[0, 1, 2].map((colIndex) => {
                    const key = `${rowIndex}_${colIndex}`;
                    const cellData = table2Inputs[key] || { value: '', locked: false };
                    
                    return (
                      <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                        <input 
                          type="text" 
                          value={cellData.value}
                          placeholder={cellData.locked ? "Locked" : "Enter value"}
                          disabled={!isPrimaryDataSaved || cellData.locked}
                          onChange={(e) => {
                            setTable2Inputs({
                              ...table2Inputs,
                              [key]: { value: e.target.value, locked: cellData.locked }
                            });
                          }}
                          style={{ 
                            width: '100%', 
                            border: '1px solid #cbd5e1', 
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            outline: 'none',
                            textAlign: 'center',
                            backgroundColor: (!isPrimaryDataSaved || cellData.locked) ? '#f1f5f9' : 'white',
                            cursor: (!isPrimaryDataSaved || cellData.locked) ? 'not-allowed' : 'text'
                          }} 
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table 2 Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          {tableMessages[2] && (
            <InlineLoader message={tableMessages[2].text} variant={tableMessages[2].variant} size="medium" />
          )}
          <SubmitButton onClick={handleTable2Submit} disabled={!isPrimaryDataSaved} />
        </div>
      </div>
      </div>

      {/* Table 3 */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Mix Testing & Hopper Level {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
        {/* Table 3 - 4x4 empty table with custom column widths */}
        <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px', width: '100%' }}>
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col />
              <col />
            </colgroup>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shift</td>
                <td colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>
                  Mix No.
                </td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>No. Of Rejected</td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Return Sand Hopper level</td>
              </tr>
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Start</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>End</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Total</td>
              </tr>
              {/* Data Rows */}
              {['I', 'II', 'III'].map((shift, rowIndex) => {
                const columns = [0, 1, 2, 3, 4]; // Start, End, Total, No. Of Rejected, Return Sand Hopper level
                return (
                  <tr key={rowIndex} style={{ height: '50px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{shift}</td>
                    {columns.map((colIndex) => {
                      const key = `${rowIndex}_${colIndex}`;

                      // Total column is always derived from Start/End - never typed by the user
                      if (colIndex === 2) {
                        const totals = computeTable3Totals(rowIndex);
                        return (
                          <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: totals.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                              gap: '8px'
                            }}>
                              {totals.map((item, inputIndex) => (
                                <input
                                  key={inputIndex}
                                  type="text"
                                  value={item.value}
                                  placeholder="Auto"
                                  disabled
                                  readOnly
                                  style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    textAlign: 'center',
                                    backgroundColor: '#f1f5f9',
                                    cursor: 'not-allowed'
                                  }}
                                />
                              ))}
                            </div>
                          </td>
                        );
                      }

                      const values = table3Inputs[key] || [{ value: '', locked: false }];
                      
                      return (
                        <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: values.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                            gap: '8px'
                          }}>
                            {values.map((item, inputIndex) => (
                              <div key={inputIndex} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="text"
                                  value={item.value}
                                  placeholder={item.locked ? "Locked" : "Enter value"}
                                  disabled={!isPrimaryDataSaved || item.locked}
                                  onChange={(e) => {
                                    const newValues = [...values];
                                    newValues[inputIndex].value = e.target.value;
                                    setTable3Inputs({
                                      ...table3Inputs,
                                      [key]: newValues
                                    });
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    textAlign: 'center',
                                    backgroundColor: (!isPrimaryDataSaved || item.locked) ? '#f1f5f9' : 'white',
                                    cursor: (!isPrimaryDataSaved || item.locked) ? 'not-allowed' : 'text'
                                  }}
                                />
                                {!item.locked && inputIndex === values.length - 1 && values.length > 1 && (
                                  <MinusButton 
                                    onClick={() => removeTable3Input(rowIndex, colIndex, inputIndex)} 
                                    title="Remove entry" 
                                  />
                                )}
                                {!item.locked && inputIndex === values.length - 1 && values.length < 4 && (
                                  <PlusButton 
                                    onClick={() => addTable3Input(rowIndex, colIndex)} 
                                    title="Add entry" 
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table 3 Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          {tableMessages[3] && (
            <InlineLoader message={tableMessages[3].text} variant={tableMessages[3].variant} size="medium" />
          )}
          <SubmitButton onClick={handleTable3Submit} disabled={!isPrimaryDataSaved} />
        </div>
      </div>
      </div>

      {/* Table 4 */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Weight & Friability {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>
        {/* Table 4a and 4b - Side by Side (plain container; no bordered wrapper so the
            two narrow tables don't leave a stray border line running to the Submit button) */}
        <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Table 4a - 2x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SAND LUMPS</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <input 
                        type="text"
                        value={table4Inputs.sandLump.value}
                        placeholder={table4Inputs.sandLump.locked ? "Locked" : "Enter value"}
                        disabled={!isPrimaryDataSaved || table4Inputs.sandLump.locked}
                        onChange={(e) => setTable4Inputs({...table4Inputs, sandLump: { value: e.target.value, locked: table4Inputs.sandLump.locked }})}
                        style={{ 
                          width: '100%', 
                          border: '1px solid #cbd5e1', 
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          outline: 'none',
                          textAlign: 'center',
                          backgroundColor: (!isPrimaryDataSaved || table4Inputs.sandLump.locked) ? '#f1f5f9' : 'white',
                          cursor: (!isPrimaryDataSaved || table4Inputs.sandLump.locked) ? 'not-allowed' : 'text'
                        }} 
                      />
                    </td>
                  </tr>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>NEW SAND WT</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <input 
                        type="text"
                        value={table4Inputs.newSandWt.value}
                        placeholder={table4Inputs.newSandWt.locked ? "Locked" : "Enter value"}
                        disabled={!isPrimaryDataSaved || table4Inputs.newSandWt.locked}
                        onChange={(e) => setTable4Inputs({...table4Inputs, newSandWt: { value: e.target.value, locked: table4Inputs.newSandWt.locked }})}
                        style={{ 
                          width: '100%', 
                          border: '1px solid #cbd5e1', 
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          outline: 'none',
                          textAlign: 'center',
                          backgroundColor: (!isPrimaryDataSaved || table4Inputs.newSandWt.locked) ? '#f1f5f9' : 'white',
                          cursor: (!isPrimaryDataSaved || table4Inputs.newSandWt.locked) ? 'not-allowed' : 'text'
                        }} 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4b - 4x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Prepared Sand Friability ( 8.0 % - 13.0 % )</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <input 
                        type="text"
                        value={table4Inputs.friabilityShiftI.value}
                        placeholder={table4Inputs.friabilityShiftI.locked ? "Locked" : "Enter value"}
                        disabled={!isPrimaryDataSaved || table4Inputs.friabilityShiftI.locked}
                        onChange={(e) => setTable4Inputs({...table4Inputs, friabilityShiftI: { value: e.target.value, locked: table4Inputs.friabilityShiftI.locked }})}
                        style={{ 
                          width: '100%', 
                          border: '1px solid #cbd5e1', 
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          outline: 'none',
                          textAlign: 'center',
                          backgroundColor: (!isPrimaryDataSaved || table4Inputs.friabilityShiftI.locked) ? '#f1f5f9' : 'white',
                          cursor: (!isPrimaryDataSaved || table4Inputs.friabilityShiftI.locked) ? 'not-allowed' : 'text'
                        }} 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <input 
                        type="text"
                        value={table4Inputs.friabilityShiftII.value}
                        placeholder={table4Inputs.friabilityShiftII.locked ? "Locked" : "Enter value"}
                        disabled={!isPrimaryDataSaved || table4Inputs.friabilityShiftII.locked}
                        onChange={(e) => setTable4Inputs({...table4Inputs, friabilityShiftII: { value: e.target.value, locked: table4Inputs.friabilityShiftII.locked }})}
                        style={{ 
                          width: '100%', 
                          border: '1px solid #cbd5e1', 
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          outline: 'none',
                          textAlign: 'center',
                          backgroundColor: (!isPrimaryDataSaved || table4Inputs.friabilityShiftII.locked) ? '#f1f5f9' : 'white',
                          cursor: (!isPrimaryDataSaved || table4Inputs.friabilityShiftII.locked) ? 'not-allowed' : 'text'
                        }} 
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <input 
                        type="text"
                        value={table4Inputs.friabilityShiftIII.value}
                        placeholder={table4Inputs.friabilityShiftIII.locked ? "Locked" : "Enter value"}
                        disabled={!isPrimaryDataSaved || table4Inputs.friabilityShiftIII.locked}
                        onChange={(e) => setTable4Inputs({...table4Inputs, friabilityShiftIII: { value: e.target.value, locked: table4Inputs.friabilityShiftIII.locked }})}
                        style={{ 
                          width: '100%', 
                          border: '1px solid #cbd5e1', 
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          outline: 'none',
                          textAlign: 'center',
                          backgroundColor: (!isPrimaryDataSaved || table4Inputs.friabilityShiftIII.locked) ? '#f1f5f9' : 'white',
                          cursor: (!isPrimaryDataSaved || table4Inputs.friabilityShiftIII.locked) ? 'not-allowed' : 'text'
                        }} 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Table 4 Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          {tableMessages[4] && (
            <InlineLoader message={tableMessages[4].text} variant={tableMessages[4].variant} size="medium" />
          )}
          <SubmitButton onClick={handleTable4Submit} disabled={!isPrimaryDataSaved} />
        </div>
      </div>
      </div>
      {/* Table 5: Sand Properties & Test Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Properties & Test Parameters {!isPrimaryDataSaved && <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#ef4444' }}>(Locked - Save Primary Data First)</span>}</h3>

        {/* New entry form (S.No {nextTable5SNo}). Submitted rows are shown on the report page only. */}
        <div className="sand-table5-form-grid">
          <div className="sand-form-field full-row" style={{ minHeight: 'auto' }}>
            <label style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{`New Entry - S.No ${nextTable5SNo}`}</label>
          </div>

          <div className="sand-form-field">
            <label>Time</label>
            <CustomTimeInput
              ref={timeRef}
              value={table5FormData.time}
              onChange={handleTimeChange}
              hasError={timeValid === false}
              onEnterPress={(e) => handleKeyDown(e, mixNoRef)}
            />
          </div>

          <div className="sand-form-field">
            <label>Mix No</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={mixNoRef}
              type="number"
              placeholder="Mix No"
              value={table5FormData.mixNo}
              onChange={(e) => updateFormField('mixNo', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, permeabilityRef)}
              className={mixNoValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Permeability (90-160)</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={permeabilityRef}
              type="number"
              placeholder="90-160"
              value={table5FormData.permeability}
              onChange={(e) => updateFormField('permeability', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, gcsValueRef)}
              className={permeabilityValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field sand-selector-field">
            <div className="sand-field-header">
              <label>G.C.S Gm/cm²</label>
              <div className={`sand-radio-group ${gcsCheckpointValid === false ? 'invalid-input' : ''}`}>
                <label>
                  <input
                    disabled={!isPrimaryDataSaved}
                    type="radio"
                    name="gcsCheckpoint"
                    value="FDY-A"
                    checked={table5FormData.gcsCheckpoint === 'FDY-A'}
                    onChange={(e) => updateFormField('gcsCheckpoint', e.target.value)}
                  />
                  <span>FDY-A (Min 1800)</span>
                </label>
                <label>
                  <input
                    disabled={!isPrimaryDataSaved}
                    type="radio"
                    name="gcsCheckpoint"
                    value="FDY-B"
                    checked={table5FormData.gcsCheckpoint === 'FDY-B'}
                    onChange={(e) => updateFormField('gcsCheckpoint', e.target.value)}
                  />
                  <span>FDY-B (Min 1900)</span>
                </label>
              </div>
            </div>
            <input
              disabled={!isPrimaryDataSaved}
              ref={gcsValueRef}
              type="number"
              placeholder="Value"
              value={table5FormData.gcsValue}
              onChange={(e) => updateFormField('gcsValue', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, wtsRef)}
              onFocus={() => { if (!table5FormData.gcsCheckpoint) setGcsCheckpointValid(false); }}
              className={gcsValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>WTS N/cm² (Min 0.15)</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={wtsRef}
              type="number"
              placeholder="Min 0.15"
              value={table5FormData.wts}
              onChange={(e) => updateFormField('wts', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, moistureRef)}
              className={wtsValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Moisture (3.0-4.0%)</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={moistureRef}
              type="number"
              placeholder="3.0-4.0"
              value={table5FormData.moisture}
              onChange={(e) => updateFormField('moisture', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, compactabilityRef)}
              className={moistureValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Compactability At Dmm (33-40%)</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={compactabilityRef}
              type="number"
              placeholder="33-40"
              value={table5FormData.compactability}
              onChange={(e) => updateFormField('compactability', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, compressabilityRef)}
              className={compactabilityValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Compressability At Dmm (20-28%)</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={compressabilityRef}
              type="number"
              placeholder="20-28"
              value={table5FormData.compressability}
              onChange={(e) => updateFormField('compressability', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, waterLitreRef)}
              className={compressabilityValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Water Litre/Kg Mix</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={waterLitreRef}
              type="number"
              placeholder="Value"
              value={table5FormData.waterLitreKgMix}
              onChange={(e) => updateFormField('waterLitreKgMix', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, sandTempBCRef)}
              className={waterLitreValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Sand Temp °C (BC/WU/SSU Max 45)</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                disabled={!isPrimaryDataSaved}
                ref={sandTempBCRef}
                type="number"
                placeholder="BC"
                value={table5FormData.sandTempBC}
                onChange={(e) => updateFormField('sandTempBC', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, sandTempWURef)}
                className={sandTempBCValid === false ? "invalid-input" : ""}
              />
              <input
                disabled={!isPrimaryDataSaved}
                ref={sandTempWURef}
                type="number"
                placeholder="WU"
                value={table5FormData.sandTempWU}
                onChange={(e) => updateFormField('sandTempWU', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, sandTempSSURef)}
                className={sandTempWUValid === false ? "invalid-input" : ""}
              />
              <input
                disabled={!isPrimaryDataSaved}
                ref={sandTempSSURef}
                type="number"
                placeholder="SSU"
                value={table5FormData.sandTempSSU}
                onChange={(e) => updateFormField('sandTempSSU', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, newSandRef)}
                className={sandTempSSUValid === false ? "invalid-input" : ""}
              />
            </div>
          </div>

          <div className="sand-form-field">
            <label>New Sand Kgs/Mould (0.0-5.0)</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={newSandRef}
              type="number"
              placeholder="0.0-5.0"
              value={table5FormData.newSandKgsMould}
              onChange={(e) => updateFormField('newSandKgsMould', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, bentoniteKgsRef)}
              className={newSandValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field sand-selector-field">
            <div className="sand-field-header">
              <label>Bentonite (Kgs / Mix)</label>
              <div className={`sand-radio-group ${bentoniteCheckpointValid === false ? 'invalid-input' : ''}`}>
                <label>
                  <input
                    disabled={!isPrimaryDataSaved}
                    type="radio"
                    name="bentoniteCheckpoint"
                    value="0.60-1.20"
                    checked={table5FormData.bentoniteCheckpoint === '0.60-1.20'}
                    onChange={(e) => updateFormField('bentoniteCheckpoint', e.target.value)}
                  />
                  <span>0.60-1.20%</span>
                </label>
                <label>
                  <input
                    disabled={!isPrimaryDataSaved}
                    type="radio"
                    name="bentoniteCheckpoint"
                    value="0.80-2.20"
                    checked={table5FormData.bentoniteCheckpoint === '0.80-2.20'}
                    onChange={(e) => updateFormField('bentoniteCheckpoint', e.target.value)}
                  />
                  <span>0.80-2.20%</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                disabled={!isPrimaryDataSaved}
                ref={bentoniteKgsRef}
                type="number"
                placeholder="Kgs"
                value={table5FormData.bentoniteKgs}
                onChange={(e) => updateFormField('bentoniteKgs', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, bentonitePercentRef)}
                onFocus={() => { if (!table5FormData.bentoniteCheckpoint) setBentoniteCheckpointValid(false); }}
                className={bentoniteKgsValid === false ? "invalid-input" : ""}
              />
              <input
                disabled={!isPrimaryDataSaved}
                ref={bentonitePercentRef}
                type="number"
                placeholder="%"
                value={table5FormData.bentonitePercent}
                onChange={(e) => updateFormField('bentonitePercent', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, premixCoalKgsRef)}
                onFocus={() => { if (!table5FormData.bentoniteCheckpoint) setBentoniteCheckpointValid(false); }}
                className={bentonitePercentValid === false ? "invalid-input" : ""}
              />
            </div>
          </div>

          <div className="sand-form-field sand-selector-field">
            <div className="sand-field-header">
              <label>Premix/Coal Dust (Kgs / Mix)</label>
              <div className={`sand-radio-group ${premixCoalCheckpointValid === false ? 'invalid-input' : ''}`}>
                <label>
                  <input
                    disabled={!isPrimaryDataSaved}
                    type="radio"
                    name="premixCoalCheckpoint"
                    value="Premix"
                    checked={table5FormData.premixCoalCheckpoint === 'Premix'}
                    onChange={(e) => updateFormField('premixCoalCheckpoint', e.target.value)}
                  />
                  <span>Premix (0.60-1.20%)</span>
                </label>
                <label>
                  <input
                    disabled={!isPrimaryDataSaved}
                    type="radio"
                    name="premixCoalCheckpoint"
                    value="CoalDust"
                    checked={table5FormData.premixCoalCheckpoint === 'CoalDust'}
                    onChange={(e) => updateFormField('premixCoalCheckpoint', e.target.value)}
                  />
                  <span>Coal Dust (0.28-0.70%)</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                disabled={!isPrimaryDataSaved}
                ref={premixCoalKgsRef}
                type="number"
                placeholder="Kgs"
                value={table5FormData.premixCoalKgs}
                onChange={(e) => updateFormField('premixCoalKgs', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, premixCoalPercentRef)}
                onFocus={() => { if (!table5FormData.premixCoalCheckpoint) setPremixCoalCheckpointValid(false); }}
                className={premixCoalKgsValid === false ? "invalid-input" : ""}
              />
              <input
                disabled={!isPrimaryDataSaved}
                ref={premixCoalPercentRef}
                type="number"
                placeholder="%"
                value={table5FormData.premixCoalPercent}
                onChange={(e) => updateFormField('premixCoalPercent', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, compactabilityValueRef)}
                onFocus={() => { if (!table5FormData.premixCoalCheckpoint) setPremixCoalCheckpointValid(false); }}
                className={premixCoalPercentValid === false ? "invalid-input" : ""}
              />
            </div>
          </div>

          <div className="sand-form-field">
            <label>Compactability Setting</label>
            <div ref={compactabilityDropdownRef} style={{ position: 'relative' }}>
              <input
                disabled={!isPrimaryDataSaved}
                ref={compactabilityValueRef}
                type="number"
                value={table5FormData.compactabilityValue}
                onChange={(e) => handleCompactabilityValueChange(e.target.value)}
                onFocus={handleCompactabilityValueFocus}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowCompactabilityDropdown(false);
                  } else if (e.key === 'Enter' && showCompactabilityDropdown && filteredCompactabilitySuggestions.length > 0) {
                    e.preventDefault();
                    handleCompactabilityValueSelect(filteredCompactabilitySuggestions[0]);
                  } else {
                    handleKeyDown(e, mouldStrengthValueRef);
                  }
                }}
                placeholder="Value"
                autoComplete="off"
                className={compactabilityValueValid === false ? "invalid-input" : ""}
              />
              {showCompactabilityDropdown && filteredCompactabilitySuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px',
                  maxHeight: '150px', overflowY: 'auto', zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {filteredCompactabilitySuggestions.map((s, idx) => (
                    <div
                      key={s}
                      onClick={() => handleCompactabilityValueSelect(s)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer',
                        borderBottom: idx < filteredCompactabilitySuggestions.length - 1 ? '1px solid #eee' : 'none',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sand-form-field">
            <label>Mould Strength Setting</label>
            <div ref={mouldStrengthDropdownRef} style={{ position: 'relative' }}>
              <input
                disabled={!isPrimaryDataSaved}
                ref={mouldStrengthValueRef}
                type="number"
                value={table5FormData.mouldStrengthValue}
                onChange={(e) => handleMouldStrengthValueChange(e.target.value)}
                onFocus={handleMouldStrengthValueFocus}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowMouldStrengthDropdown(false);
                  } else if (e.key === 'Enter' && showMouldStrengthDropdown && filteredMouldStrengthSuggestions.length > 0) {
                    e.preventDefault();
                    handleMouldStrengthValueSelect(filteredMouldStrengthSuggestions[0]);
                  } else {
                    handleKeyDown(e, preparedSandLumpsRef);
                  }
                }}
                placeholder="Value"
                autoComplete="off"
                className={mouldStrengthValueValid === false ? "invalid-input" : ""}
              />
              {showMouldStrengthDropdown && filteredMouldStrengthSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px',
                  maxHeight: '150px', overflowY: 'auto', zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {filteredMouldStrengthSuggestions.map((s, idx) => (
                    <div
                      key={s}
                      onClick={() => handleMouldStrengthValueSelect(s)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer',
                        borderBottom: idx < filteredMouldStrengthSuggestions.length - 1 ? '1px solid #eee' : 'none',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sand-form-field">
            <label>Prepared Sand Lumps/Kg</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={preparedSandLumpsRef}
              type="number"
              placeholder="Value"
              value={table5FormData.preparedSandLumpsKg}
              onChange={(e) => updateFormField('preparedSandLumpsKg', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, itemNameRef)}
              className={preparedSandLumpsKgValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field">
            <label>Item Name</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={itemNameRef}
              type="text"
              placeholder="Item Name"
              value={table5FormData.itemName}
              onChange={(e) => updateFormField('itemName', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, remarksRef)}
              className={itemNameValid === false ? "invalid-input" : ""}
            />
          </div>

          <div className="sand-form-field remarks-field">
            <label>Remarks</label>
            <input
              disabled={!isPrimaryDataSaved}
              ref={remarksRef}
              type="text"
              placeholder="Remarks"
              value={table5FormData.remarks}
              onChange={(e) => updateFormField('remarks', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (submitButtonRef && submitButtonRef.current) {
                    submitButtonRef.current.focus();
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
          {tableMessages[5] && (
            <InlineLoader message={tableMessages[5].text} variant={tableMessages[5].variant} size="medium" />
          )}
          <SubmitButton ref={submitButtonRef} onClick={handleTable5Submit} disabled={!isPrimaryDataSaved} />
        </div>
      </div>
      </div>
    </>
  );
};
export default SandTestingRecord;
