import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SubmitButton, PlusButton, MinusButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { InlineLoader } from '../../Components/InlineLoader';
import { useToast } from '../../Components/alert';
import { useInfoModal, InfoIcon, InfoCard } from '../../Components/Info';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { API_ENDPOINTS } from '../../config/api';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { runValidation, getRequiredFields, RequiredMark, MESSAGE_REQUIRED, MESSAGE_FORMAT } from '../../utils/formValidation';
import { buildSubmitError, FALLBACK_SUBMIT_ERROR } from '../../utils/submitError';
import '../../styles/PageStyles/QcProduction/QcProductionDetails.css';

const QcProductionDetails = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  const validationRanges = [
    {
      field: 'Date',
      required: true,
      type: 'Date',
      pattern: 'DD/MM/YYYY'
    },
    {
      field: 'Part Name',
      required: true,
      type: 'Text',
      pattern: 'e.g., Brake Disc'
    },
    {
      field: 'No. of Moulds',
      type: 'Number',
      min: 1
    },
    {
      field: 'C % (Carbon)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'Si % (Silicon)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'Mn % (Manganese)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'P % (Phosphorus)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'S % (Sulfur)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'Mg % (Magnesium)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'Cu % (Copper)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'Cr % (Chromium)',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: '%'
    },
    {
      field: 'Nodularity',
      type: 'Number',
      min: 0
    },
    {
      field: 'Nodule count',
      type: 'Number',
      min: 0
    },
    {
      field: 'Graphite Type',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0
    },
    {
      field: 'Pearlite',
      type: 'Number',
      min: 0
    },
    {
      field: 'Ferrite',
      type: 'Number',
      min: 0
    },
    {
      field: 'Hardness BHN',
      type: 'Number Range',
      requireMinForMax: true,
      min: 0,
      unit: 'BHN'
    },
    {
      field: 'TS (Tensile Strength)',
      type: 'Dynamic Array',
      min: 0,
      required:false,
      unit: 'MPa',
    },
    {
      field: 'YS (Yield Strength)',
      type: 'Dynamic Range Array',
      min: 0, 
      unit: 'MPa',
    },
    {
      field: 'EL (Elongation)',
      type: 'Dynamic Range Array',
      min: 0,
      unit: '%',
      required: false
    }
  ];

  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d} / ${m} / ${y}`;
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const {
    formData,
    setFormData,
    validationStates,
    setValidation,
    resetValidation,
    submitErrorMessage,
    setSubmitErrorMessage,
    resetFormData
  } = useDepartmentForm('qc-production');

  const [submitLoading, setSubmitLoading] = useState(false);

  const [partNames, setPartNames] = useState([]);
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [filteredPartNames, setFilteredPartNames] = useState([]);

  const fieldMapping = {
    'Date': 'date',
    'Part Name': 'partName',
    'No. of Moulds': 'noOfMoulds',
    'C % (Carbon)': ['cPercentMin', 'cPercentMax'],
    'Si % (Silicon)': ['siPercentMin', 'siPercentMax'],
    'Mn % (Manganese)': ['mnPercentMin', 'mnPercentMax'],
    'P % (Phosphorus)': ['pPercentMin', 'pPercentMax'],
    'S % (Sulfur)': ['sPercentMin', 'sPercentMax'],
    'Mg % (Magnesium)': ['mgPercentMin', 'mgPercentMax'],
    'Cu % (Copper)': ['cuPercentMin', 'cuPercentMax'],
    'Cr % (Chromium)': ['crPercentMin', 'crPercentMax'],
    'Nodularity': 'nodularity',
    'Nodule count': 'noduleCount',
    'Graphite Type': ['graphiteTypeMin', 'graphiteTypeMax'],
    'Pearlite': 'pearlite',
    'Ferrite': 'ferrite',
    'Hardness BHN': ['hardnessBHNMin', 'hardnessBHNMax'],
    'TS (Tensile Strength)': 'tsValues',
    'YS (Yield Strength)': 'ysValues',
    'EL (Elongation)': 'elValues'
  };

  const validationSetters = {
    'date': (val) => setValidation('date', val),
    'partName': (val) => setValidation('partName', val),
    'noOfMoulds': (val) => setValidation('noOfMoulds', val),
    'cPercentMin': (val) => setValidation('cPercentMin', val),
    'cPercentMax': (val) => setValidation('cPercentMax', val),
    'siPercentMin': (val) => setValidation('siPercentMin', val),
    'siPercentMax': (val) => setValidation('siPercentMax', val),
    'mnPercentMin': (val) => setValidation('mnPercentMin', val),
    'mnPercentMax': (val) => setValidation('mnPercentMax', val),
    'pPercentMin': (val) => setValidation('pPercentMin', val),
    'pPercentMax': (val) => setValidation('pPercentMax', val),
    'sPercentMin': (val) => setValidation('sPercentMin', val),
    'sPercentMax': (val) => setValidation('sPercentMax', val),
    'mgPercentMin': (val) => setValidation('mgPercentMin', val),
    'mgPercentMax': (val) => setValidation('mgPercentMax', val),
    'cuPercentMin': (val) => setValidation('cuPercentMin', val),
    'cuPercentMax': (val) => setValidation('cuPercentMax', val),
    'crPercentMin': (val) => setValidation('crPercentMin', val),
    'crPercentMax': (val) => setValidation('crPercentMax', val),
    'nodularity': (val) => setValidation('nodularity', val),
    'noduleCount': (val) => setValidation('noduleCount', val),
    'graphiteTypeMin': (val) => setValidation('graphiteTypeMin', val),
    'graphiteTypeMax': (val) => setValidation('graphiteTypeMax', val),
    'pearlite': (val) => setValidation('pearlite', val),
    'ferrite': (val) => setValidation('ferrite', val),
    'hardnessBHNMin': (val) => setValidation('hardnessBHNMin', val),
    'hardnessBHNMax': (val) => setValidation('hardnessBHNMax', val),
    'tsValues': (val) => setValidation('tsValues', val),
    'ysValues': (val) => setValidation('ysValues', val),
    'elValues': (val) => setValidation('elValues', val)
  };

  const addTsValue = () => {
    if (formData.tsValues.length >= 4) return;
    setFormData(prev => ({
      ...prev,
      tsValues: [...prev.tsValues, { value: '' }]
    }));
    setValidation('tsValues', null);
  };

  const removeTsValue = (index) => {
    if (formData.tsValues.length > 1) {
      setFormData(prev => ({
        ...prev,
        tsValues: prev.tsValues.filter((_, i) => i !== index)
      }));
      setValidation('tsValues', null);
    }
  };

  const handleTsChange = (index, value) => {
    const filteredValue = value.replace(/[^0-9.]/g, '');
    const parts = filteredValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filteredValue;

    if (submitErrorMessage) {
      setSubmitErrorMessage('');
    }
    setValidation(`ts_${index}`, null);

    setFormData(prev => ({
      ...prev,
      tsValues: prev.tsValues.map((item, i) =>
        i === index ? { value: finalValue } : item
      )
    }));
  };

  const addYsValue = () => {
    if (formData.ysValues.length >= 4) return;
    setFormData(prev => ({
      ...prev,
      ysValues: [...prev.ysValues, { min: '', max: '' }]
    }));
    setValidation('ysValues', null);
  };

  const removeYsValue = (index) => {
    if (formData.ysValues.length > 1) {
      setFormData(prev => ({
        ...prev,
        ysValues: prev.ysValues.filter((_, i) => i !== index)
      }));
      setValidation('ysValues', null);
    }
  };

  const handleYsChange = (index, field, value) => {
    const filteredValue = value.replace(/[^0-9.]/g, '');
    const parts = filteredValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filteredValue;

    if (submitErrorMessage) {
      setSubmitErrorMessage('');
    }
    setValidation(`ysMin_${index}`, null);
    setValidation(`ysMax_${index}`, null);

    setFormData(prev => {
      const newYsValues = prev.ysValues.map((item, i) =>
        i === index ? { ...item, [field]: finalValue } : item
      );
      return { ...prev, ysValues: newYsValues };
    });
  };

  const addElValue = () => {
    if (formData.elValues.length >= 4) return;
    setFormData(prev => ({
      ...prev,
      elValues: [...prev.elValues, { min: '', max: '' }]
    }));
    setValidation('elValues', null);
  };

  const removeElValue = (index) => {
    if (formData.elValues.length > 1) {
      setFormData(prev => ({
        ...prev,
        elValues: prev.elValues.filter((_, i) => i !== index)
      }));
      setValidation('elValues', null);
    }
  };

  const handleElChange = (index, field, value) => {
    const filteredValue = value.replace(/[^0-9.]/g, '');
    const parts = filteredValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filteredValue;

    if (submitErrorMessage) {
      setSubmitErrorMessage('');
    }
    setValidation(`elMin_${index}`, null);
    setValidation(`elMax_${index}`, null);

    setFormData(prev => {
      const newElValues = prev.elValues.map((item, i) =>
        i === index ? { ...item, [field]: finalValue } : item
      );
      return { ...prev, elValues: newElValues };
    });
  };

  const submitButtonRef = useRef(null);
  const inputRefs = useRef({});
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const requiredFields = getRequiredFields(validationRanges, fieldMapping);
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);

  const getInputClassName = (validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  const isValidNumber = (value) => {
    if (!value || value.trim() === '') return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
  };


  useEffect(() => {
    const fetchPartNames = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.qcReports}/part-names`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.partNames) {
          setPartNames(data.partNames);
        }
      } catch (error) {
      }
    };

    fetchPartNames();
  }, []);

  // Default the date to today on mount (still changeable by the user).
  useEffect(() => {
    if (!formData.date) {
      setFormData(prev => ({ ...prev, date: getCurrentDate() }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (submitErrorMessage) {
      setSubmitErrorMessage('');
    }

    const numericFields = [
      'noOfMoulds',
      'cPercentMin', 'cPercentMax',
      'siPercentMin', 'siPercentMax',
      'mnPercentMin', 'mnPercentMax',
      'pPercentMin', 'pPercentMax',
      'sPercentMin', 'sPercentMax',
      'mgPercentMin', 'mgPercentMax',
      'cuPercentMin', 'cuPercentMax',
      'crPercentMin', 'crPercentMax',
      'nodularity',
      'noduleCount',
      'graphiteTypeMin', 'graphiteTypeMax',
      'pearlite',
      'ferrite',
      'hardnessBHNMin', 'hardnessBHNMax',
      'ts',
      'ysMin', 'ysMax',
      'elMin', 'elMax'
    ];

    let filteredValue = value;
    if (numericFields.includes(name)) {
      filteredValue = value.replace(/[^0-9.]/g, '');
      const parts = filteredValue.split('.');
      if (parts.length > 2) {
        filteredValue = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    if (name === 'partName') {
      filteredValue = value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();

      if (filteredValue.trim() === '') {
        setFilteredPartNames([]);
        setShowPartDropdown(false);
      } else {
        const filtered = partNames.filter(part =>
          part.toUpperCase().includes(filteredValue.toUpperCase())
        );
        setFilteredPartNames(filtered);
        setShowPartDropdown(filtered.length > 0);
      }
    }

    const minMaxPairs = {
      'cPercentMin': 'cPercentMax', 'cPercentMax': 'cPercentMin',
      'siPercentMin': 'siPercentMax', 'siPercentMax': 'siPercentMin',
      'mnPercentMin': 'mnPercentMax', 'mnPercentMax': 'mnPercentMin',
      'pPercentMin': 'pPercentMax', 'pPercentMax': 'pPercentMin',
      'sPercentMin': 'sPercentMax', 'sPercentMax': 'sPercentMin',
      'mgPercentMin': 'mgPercentMax', 'mgPercentMax': 'mgPercentMin',
      'cuPercentMin': 'cuPercentMax', 'cuPercentMax': 'cuPercentMin',
      'crPercentMin': 'crPercentMax', 'crPercentMax': 'crPercentMin',
      'graphiteTypeMin': 'graphiteTypeMax', 'graphiteTypeMax': 'graphiteTypeMin',
      'hardnessBHNMin': 'hardnessBHNMax', 'hardnessBHNMax': 'hardnessBHNMin',
      'ysMin': 'ysMax', 'ysMax': 'ysMin',
      'elMin': 'elMax', 'elMax': 'elMin'
    };

    setValidation(name, null);
    if (minMaxPairs[name]) {
      setValidation(minMaxPairs[name], null);
    }

    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));
  };

  const handlePartNameSelect = (selectedPart) => {
    setFormData(prev => ({
      ...prev,
      partName: selectedPart
    }));
    setShowPartDropdown(false);
    setFilteredPartNames([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPartDropdown && !event.target.closest('.part-name-autocomplete')) {
        setShowPartDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPartDropdown]);

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (value && value.trim() !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (!value.includes('.')) {
          setFormData(prev => ({
            ...prev,
            [name]: numValue.toFixed(1)
          }));
        }
      }
    }
  };

  // Enter advances in DOM order; arrows are delegated to the shared spatial hook.
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const inputs = Array.from(e.target.form.querySelectorAll('input, textarea'));
    const next = inputs[inputs.indexOf(e.target) + 1];
    if (next) next.focus();
    else submitButtonRef.current?.focus();
  };

  // Wraps useArrowNavigation to keep this form's date-picker open/close behaviour
  // and its "ArrowDown at the last field focuses Submit" fallback.
  const handleFormArrowKeyDown = (e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    if (e.target.classList.contains('date-input')) inputRefs.current.date?.close();

    const before = document.activeElement;
    handleArrowKeyDown(e);
    const after = document.activeElement;

    if (after !== before) {
      if (after?.classList.contains('date-input')) inputRefs.current.date?.open();
    } else if (e.key === 'ArrowDown') {
      submitButtonRef.current?.focus();
    }
  };


  const handleSubmitButtonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const form = document.querySelector('.qcproduction-form-grid');
      if (form) {
        const inputs = Array.from(form.querySelectorAll('input, textarea'));
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitErrorMessage('');

    // The three Dynamic Array rules (TS/YS/EL) are row-indexed and validated by
    // the bespoke loops below, so they are skipped here.
    const { ok, message, firstErrorField: firstMappedError, fieldStates } = runValidation({
      validationRanges,
      fieldMapping,
      formData,
      inputRefs,
      skip: ['TS (Tensile Strength)', 'YS (Yield Strength)', 'EL (Elongation)']
    });

    Object.entries(fieldStates).forEach(([key, state]) => validationSetters[key]?.(state));

    let hasErrors = !ok;
    let firstErrorField = firstMappedError;
    let missingRequired = !ok && message === MESSAGE_REQUIRED;


    const tsRule = validationRanges.find(r => r.field === 'TS (Tensile Strength)');
    if (tsRule && formData.tsValues && Array.isArray(formData.tsValues)) {
      for (let i = 0; i < formData.tsValues.length; i++) {
        const item = formData.tsValues[i];
        const fieldKey = `ts_${i}`;

        if (tsRule.required === false && (!item.value || item.value.trim() === '')) {
          setValidation(fieldKey, null);
          continue;
        }

        if (!item.value || item.value.trim() === '') {
          setValidation(fieldKey, false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = fieldKey;
          continue;
        }

        const numVal = parseFloat(item.value);
        if (isNaN(numVal) || !isFinite(numVal)) {
          setValidation(fieldKey, false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = fieldKey;
          continue;
        }

        if (tsRule.min !== undefined && numVal < tsRule.min) {
          setValidation(fieldKey, false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = fieldKey;
        } else {
          setValidation(fieldKey, null);
        }
      }
    }

    const ysRule = validationRanges.find(r => r.field === 'YS (Yield Strength)');
    if (ysRule && formData.ysValues && Array.isArray(formData.ysValues)) {
      for (let i = 0; i < formData.ysValues.length; i++) {
        const item = formData.ysValues[i];
        const minKey = `ysMin_${i}`;
        const maxKey = `ysMax_${i}`;

        if (ysRule.required === false && (!item.min || item.min.trim() === '') && (!item.max || item.max.trim() === '')) {
          setValidation(minKey, null);
          setValidation(maxKey, null);
          continue;
        }

        let minIsInvalid = false;
        let maxIsInvalid = false;

        if (item.min && item.min.trim() !== '') {
          const minVal = parseFloat(item.min);
          if (isNaN(minVal) || !isFinite(minVal) || (ysRule.min !== undefined && minVal < ysRule.min)) {
            minIsInvalid = true;
            setValidation(minKey, false);
            hasErrors = true;
            if (!firstErrorField) firstErrorField = minKey;
          } else {
            setValidation(minKey, null);
          }
        } else if (item.max && item.max.trim() !== '') {
          // Max entered without min — min is required.
          minIsInvalid = true;
          setValidation(minKey, false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = minKey;
        } else {
          setValidation(minKey, null);
        }

        if (item.max && item.max.trim() !== '') {
          const maxVal = parseFloat(item.max);
          if (isNaN(maxVal) || !isFinite(maxVal) || (ysRule.min !== undefined && maxVal < ysRule.min)) {
            maxIsInvalid = true;
            setValidation(maxKey, false);
            hasErrors = true;
            if (!firstErrorField) firstErrorField = maxKey;
          } else {
            setValidation(maxKey, null);
          }
        } else {
          setValidation(maxKey, null);
        }

        if (item.min && item.min.trim() !== '' && item.max && item.max.trim() !== '') {
          const minVal = parseFloat(item.min);
          const maxVal = parseFloat(item.max);
          if (!isNaN(minVal) && !isNaN(maxVal) && isFinite(minVal) && isFinite(maxVal)) {
            if (maxVal !== 0 && minVal >= maxVal) {
              minIsInvalid = true;
              maxIsInvalid = true;
              setValidation(minKey, false);
              setValidation(maxKey, false);
              hasErrors = true;
              if (!firstErrorField) firstErrorField = minKey;
            }
          }
        }
      }
    }

    const elRule = validationRanges.find(r => r.field === 'EL (Elongation)');
    if (elRule && formData.elValues && Array.isArray(formData.elValues)) {
      for (let i = 0; i < formData.elValues.length; i++) {
        const item = formData.elValues[i];
        const minKey = `elMin_${i}`;
        const maxKey = `elMax_${i}`;

        if (elRule.required === false && (!item.min || item.min.trim() === '') && (!item.max || item.max.trim() === '')) {
          setValidation(minKey, null);
          setValidation(maxKey, null);
          continue;
        }

        let minIsInvalid = false;
        let maxIsInvalid = false;

        if (item.min && item.min.trim() !== '') {
          const minVal = parseFloat(item.min);
          if (isNaN(minVal) || !isFinite(minVal) || (elRule.min !== undefined && minVal < elRule.min)) {
            minIsInvalid = true;
            setValidation(minKey, false);
            hasErrors = true;
            if (!firstErrorField) firstErrorField = minKey;
          } else {
            setValidation(minKey, null);
          }
        } else if (item.max && item.max.trim() !== '') {
          // Max entered without min — min is required.
          minIsInvalid = true;
          setValidation(minKey, false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = minKey;
        } else {
          setValidation(minKey, null);
        }

        if (item.max && item.max.trim() !== '') {
          const maxVal = parseFloat(item.max);
          if (isNaN(maxVal) || !isFinite(maxVal) || (elRule.min !== undefined && maxVal < elRule.min)) {
            maxIsInvalid = true;
            setValidation(maxKey, false);
            hasErrors = true;
            if (!firstErrorField) firstErrorField = maxKey;
          } else {
            setValidation(maxKey, null);
          }
        } else {
          setValidation(maxKey, null);
        }

        if (item.min && item.min.trim() !== '' && item.max && item.max.trim() !== '') {
          const minVal = parseFloat(item.min);
          const maxVal = parseFloat(item.max);
          if (!isNaN(minVal) && !isNaN(maxVal) && isFinite(minVal) && isFinite(maxVal)) {
            if (maxVal !== 0 && minVal >= maxVal) {
              minIsInvalid = true;
              maxIsInvalid = true;
              setValidation(minKey, false);
              setValidation(maxKey, false);
              hasErrors = true;
              if (!firstErrorField) firstErrorField = minKey;
            }
          }
        }
      }
    }

    if (hasErrors) {
      // Required-wins: an empty required field is reported before any bad format.
      const finalMessage = missingRequired ? MESSAGE_REQUIRED : MESSAGE_FORMAT;
      setSubmitErrorMessage(finalMessage);
      toast.error(finalMessage);

      if (firstErrorField) {
        inputRefs.current[firstErrorField]?.focus();
      }

      return;
    }

    setSubmitErrorMessage('');

    try {
      setSubmitLoading(true);

      const formatRange = (min, max) => {
        const minStr = (min ?? '').toString().trim();
        const maxStr = (max ?? '').toString().trim();
        // No max (blank or zero) → store the min as a single value.
        if (maxStr === '' || parseFloat(maxStr) === 0) {
          return minStr;
        }
        return `${minStr} - ${maxStr}`;
      };

      const payload = {
        date: formData.date,
        partName: formData.partName,
        noOfMoulds: formData.noOfMoulds,
        cPercent: formatRange(formData.cPercentMin, formData.cPercentMax),
        siPercent: formatRange(formData.siPercentMin, formData.siPercentMax),
        mnPercent: formatRange(formData.mnPercentMin, formData.mnPercentMax),
        pPercent: formatRange(formData.pPercentMin, formData.pPercentMax),
        sPercent: formatRange(formData.sPercentMin, formData.sPercentMax),
        mgPercent: formatRange(formData.mgPercentMin, formData.mgPercentMax),
        cuPercent: formatRange(formData.cuPercentMin, formData.cuPercentMax),
        crPercent: formatRange(formData.crPercentMin, formData.crPercentMax),
        nodularity: formData.nodularity,
        noduleCount: formData.noduleCount,
        graphiteType: formatRange(formData.graphiteTypeMin, formData.graphiteTypeMax),
        pearlite: formData.pearlite,
        ferrite: formData.ferrite,
        hardnessBHN: formatRange(formData.hardnessBHNMin, formData.hardnessBHNMax),
        ts: formData.tsValues
          .filter(item => item.value && item.value.trim() !== '')
          .map(item => parseFloat(item.value)),
        ys: formData.ysValues
          .filter(item => (item.min && item.min.trim() !== '') || (item.max && item.max.trim() !== ''))
          .map(item => formatRange(item.min, item.max)),
        el: formData.elValues
          .filter(item => (item.min && item.min.trim() !== '') || (item.max && item.max.trim() !== ''))
          .map(item => formatRange(item.min, item.max))
      };

      const response = await fetch(API_ENDPOINTS.qcReports, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setSubmitLoading(false);

      if (data.success) {
        toast.success('Entry saved successfully.');

        resetFormData();
        // Re-default the date to today after the reset (still changeable).
        setFormData(prev => ({ ...prev, date: getCurrentDate() }));

        setTimeout(() => {
          inputRefs.current.date?.focus();
        }, 1600);
      } else {
        const message = buildSubmitError(data, fieldMapping);
        setSubmitErrorMessage(message);
        toast.error(message);
      }
    } catch (error) {
      setSubmitLoading(false);
      setSubmitErrorMessage(FALLBACK_SUBMIT_ERROR);
      toast.error(FALLBACK_SUBMIT_ERROR);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSakthiComplete = () => {
  };

  return (
    <>
      <div className="qcproduction-header">
        <div className="qcproduction-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            QC Production Details - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? formatDisplayDate(formData.date) : '-'}
        </div>
      </div>

      <form className="qcproduction-form-grid" ref={gridRef} onKeyDown={handleFormArrowKeyDown}>

            <div className="qcproduction-form-group">
              <label>Date{mark('date')}</label>
              <CustomDatePicker
                ref={(el) => inputRefs.current.date = el}
                name="date"
                value={formData.date}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  border: validationStates.date === false ? '2px solid #ef4444' : '2px solid #cbd5e1',
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff'
                }}
              />
            </div>

            <div className="qcproduction-form-group part-name-autocomplete" style={{ position: 'relative' }}>
              <label>Part Name{mark('partName')}</label>
              <input
                ref={(el) => inputRefs.current.partName = el}
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: BRAKE DISC 123"
                className={getInputClassName(validationStates.partName)}
                autoComplete="off"
              />
              {showPartDropdown && filteredPartNames.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  marginTop: '2px'
                }}>
                  {filteredPartNames.map((part, index) => (
                    <div
                      key={index}
                      onClick={() => handlePartNameSelect(part)}
                      style={{
                        padding: '0.625rem 0.875rem',
                        cursor: 'pointer',
                        borderBottom: index < filteredPartNames.length - 1 ? '1px solid #e2e8f0' : 'none',
                        fontSize: '0.875rem',
                        color: '#334155',
                        backgroundColor: '#fff',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                    >
                      {part}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="qcproduction-form-group">
              <label>No. of Moulds{mark('noOfMoulds')}</label>
              <input
                ref={(el) => inputRefs.current.noOfMoulds = el}
                type="text"
                name="noOfMoulds"
                value={formData.noOfMoulds}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 5"
                className={getInputClassName(validationStates.noOfMoulds)}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>C %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.cPercentMin = el}
                  type="text"
                  name="cPercentMin"
                  value={formData.cPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.cPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.cPercentMax = el}
                  type="text"
                  name="cPercentMax"
                  value={formData.cPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.cPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Si %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.siPercentMin = el}
                  type="text"
                  name="siPercentMin"
                  value={formData.siPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.siPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.siPercentMax = el}
                  type="text"
                  name="siPercentMax"
                  value={formData.siPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.siPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Mn %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.mnPercentMin = el}
                  type="text"
                  name="mnPercentMin"
                  value={formData.mnPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.mnPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.mnPercentMax = el}
                  type="text"
                  name="mnPercentMax"
                  value={formData.mnPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.mnPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>P %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.pPercentMin = el}
                  type="text"
                  name="pPercentMin"
                  value={formData.pPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.pPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.pPercentMax = el}
                  type="text"
                  name="pPercentMax"
                  value={formData.pPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.pPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>S %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.sPercentMin = el}
                  type="text"
                  name="sPercentMin"
                  value={formData.sPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.sPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.sPercentMax = el}
                  type="text"
                  name="sPercentMax"
                  value={formData.sPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.sPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Mg %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.mgPercentMin = el}
                  type="text"
                  name="mgPercentMin"
                  value={formData.mgPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.mgPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.mgPercentMax = el}
                  type="text"
                  name="mgPercentMax"
                  value={formData.mgPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.mgPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Cu %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.cuPercentMin = el}
                  type="text"
                  name="cuPercentMin"
                  value={formData.cuPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.cuPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.cuPercentMax = el}
                  type="text"
                  name="cuPercentMax"
                  value={formData.cuPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.cuPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Cr %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.crPercentMin = el}
                  type="text"
                  name="crPercentMin"
                  value={formData.crPercentMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.crPercentMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.crPercentMax = el}
                  type="text"
                  name="crPercentMax"
                  value={formData.crPercentMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.crPercentMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Nodularity</label>
              <input
                ref={(el) => inputRefs.current.nodularity = el}
                type="text"
                name="nodularity"
                value={formData.nodularity}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Enter nodularity value"
                className={getInputClassName(validationStates.nodularity)}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Nodule count</label>
              <input
                ref={(el) => inputRefs.current.noduleCount = el}
                type="text"
                name="noduleCount"
                value={formData.noduleCount}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Enter nodule count"
                className={getInputClassName(validationStates.noduleCount)}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Graphite Type</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.graphiteTypeMin = el}
                  type="text"
                  name="graphiteTypeMin"
                  value={formData.graphiteTypeMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.graphiteTypeMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.graphiteTypeMax = el}
                  type="text"
                  name="graphiteTypeMax"
                  value={formData.graphiteTypeMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.graphiteTypeMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            <div className="qcproduction-form-group">
              <label>Pearlite</label>
              <input
                ref={(el) => inputRefs.current.pearlite = el}
                type="text"
                name="pearlite"
                value={formData.pearlite}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Enter pearlite value"
                className={getInputClassName(validationStates.pearlite)}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Ferrite</label>
              <input
                ref={(el) => inputRefs.current.ferrite = el}
                type="text"
                name="ferrite"
                value={formData.ferrite}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Enter ferrite value"
                className={getInputClassName(validationStates.ferrite)}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Hardness BHN</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  ref={(el) => inputRefs.current.hardnessBHNMin = el}
                  type="text"
                  name="hardnessBHNMin"
                  value={formData.hardnessBHNMin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Min"
                  className={getInputClassName(validationStates.hardnessBHNMin)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
                <span style={{ color: '#64748b', fontWeight: '500' }}>-</span>
                <input
                  ref={(el) => inputRefs.current.hardnessBHNMax = el}
                  type="text"
                  name="hardnessBHNMax"
                  value={formData.hardnessBHNMax}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
                  className={getInputClassName(validationStates.hardnessBHNMax)}
                  style={{ flex: 1, maxWidth: '100px' }}
                />
              </div>
            </div>

            {}
            <div className="qcproduction-form-group qcproduction-dynamic-group">
              <div className="qcproduction-dynamic-label">
                <label>TS (Tensile Strength)</label>
                <PlusButton onClick={addTsValue} title="Add TS value" disabled={formData.tsValues?.length >= 4} />
              </div>
              <div className="qcproduction-dynamic-inputs">
                {formData.tsValues && formData.tsValues.map((item, index) => (
                  <div key={index} className="qcproduction-dynamic-input-item">
                    <input
                      ref={(el) => inputRefs.current[`ts_${index}`] = el}
                      type="text"
                      value={item.value}
                      onChange={(e) => handleTsChange(index, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`TS ${index + 1}`}
                      className={getInputClassName(validationStates[`ts_${index}`])}
                    />
                    {formData.tsValues.length > 1 && (
                      <MinusButton onClick={() => removeTsValue(index)} title="Remove TS value" small />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="qcproduction-form-group qcproduction-dynamic-group">
              <div className="qcproduction-dynamic-label">
                <label>YS (Yield Strength)</label>
                <PlusButton onClick={addYsValue} title="Add YS value" disabled={formData.ysValues?.length >= 4} />
              </div>
              <div className="qcproduction-dynamic-inputs">
                {formData.ysValues && formData.ysValues.map((item, index) => (
                  <div key={index} className="qcproduction-dynamic-input-item">
                    <input
                      ref={(el) => inputRefs.current[`ysMin_${index}`] = el}
                      type="text"
                      value={item.min}
                      onChange={(e) => handleYsChange(index, 'min', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Min"
                      className={getInputClassName(validationStates[`ysMin_${index}`])}
                    />
                    <span className="qcproduction-range-separator">-</span>
                    <input
                      ref={(el) => inputRefs.current[`ysMax_${index}`] = el}
                      type="text"
                      value={item.max}
                      onChange={(e) => handleYsChange(index, 'max', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Max"
                      className={getInputClassName(validationStates[`ysMax_${index}`])}
                    />
                    {formData.ysValues.length > 1 && (
                      <MinusButton onClick={() => removeYsValue(index)} title="Remove YS value" small />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="qcproduction-form-group qcproduction-dynamic-group">
              <div className="qcproduction-dynamic-label">
                <label>EL (Elongation)</label>
                <PlusButton onClick={addElValue} title="Add EL value" disabled={formData.elValues?.length >= 4} />
              </div>
              <div className="qcproduction-dynamic-inputs">
                {formData.elValues && formData.elValues.map((item, index) => (
                  <div key={index} className="qcproduction-dynamic-input-item">
                    <input
                      ref={(el) => inputRefs.current[`elMin_${index}`] = el}
                      type="text"
                      value={item.min}
                      onChange={(e) => handleElChange(index, 'min', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Min"
                      className={getInputClassName(validationStates[`elMin_${index}`])}
                    />
                    <span className="qcproduction-range-separator">-</span>
                    <input
                      ref={(el) => inputRefs.current[`elMax_${index}`] = el}
                      type="text"
                      value={item.max}
                      onChange={(e) => handleElChange(index, 'max', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Max"
                      className={getInputClassName(validationStates[`elMax_${index}`])}
                    />
                    {formData.elValues.length > 1 && (
                      <MinusButton onClick={() => removeElValue(index)} title="Remove EL value" small />
                    )}
                  </div>
                ))}
              </div>
            </div>
      </form>

      <div className="qcproduction-submit-container" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {}
        {submitErrorMessage && (
          <InlineLoader
            message={submitErrorMessage}
            variant="danger"
            size="medium"
          />
        )}
        <SubmitButton
            ref={submitButtonRef}
            onClick={handleSubmit}
            disabled={submitLoading}
            type="button"
            onKeyDown={handleSubmitButtonKeyDown}
          >
            {submitLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Submit Entry'
            )}
          </SubmitButton>
      </div>

      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="QC Production Details Validation"
        validationRanges={validationRanges}
      />
    </>
  );
};

export default QcProductionDetails;

