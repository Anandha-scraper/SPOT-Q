import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, FileText } from 'lucide-react';
import { SubmitButton, DisaDropdown, LockPrimaryButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Sakthi from '../../Components/Sakthi';
import { InlineLoader, toast } from '../../Components/Alert';
import { useInfoModal, InfoIcon, InfoCard } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/MicroTensile/MicroTensile.css';

const MicroTensile = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();

  const validationRanges = [
    {
      field: 'Date',
      required: true,
      type: 'Date',
      pattern: 'DD/MM/YYYY'
    },
    {
      field: 'DISA',
      required: true,
      type: 'Select',
      allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
    },
    {
      field: 'Item',
      required: true,
      type: 'Text',
      pattern: 'e.g., Volvo Bkt 234'
    },
    {
      field: 'Item (Optional)',
      type: 'Text',
      pattern: 'e.g., 343/34/56'
    },
    {
      field: 'Date Code',
      required: true,
      type: 'Text',
      pattern: 'e.g., 5E04'
    },
    {
      field: 'Heat Code',
      required: true,
      type: 'Number',
      pattern: 'e.g., 1'
    },
    {
      field: 'Bar Dia',
      type: 'Number',
      unit: 'mm',
      pattern: 'e.g., 6.0'
    },
    {
      field: 'Gauge Length',
      type: 'Number',
      unit: 'mm',
      pattern: 'e.g., 30.0'
    },
    {
      field: 'Max Load',
      type: 'Number',
      min: 0,
      unit: 'Kgs or KN',
      pattern: 'e.g., 1560'
    },
    {
      field: 'Yield Load',
      type: 'Number',
      min: 0,
      unit: 'Kgs or KN',
      pattern: 'e.g., 1290'
    },
    {
      field: 'Tensile Strength',
      type: 'Number',
      min: 0,
      unit: 'Kg/mm² or MPa',
      pattern: 'e.g., 550'
    },
    {
      field: 'Yield Strength',
      type: 'Number',
      min: 0,
      unit: 'Kg/mm² or MPa',
      pattern: 'e.g., 455'
    },
    {
      field: 'Elongation',
      type: 'Number',
      min: 0,
      max: 100,
      unit: '%',
      pattern: 'e.g., 18.5'
    },
    {
      field: 'Remarks',
      type: 'Text'
    },
    {
      field: 'Tested By',
      type: 'Text',
      pattern: 'e.g., John Smith'
    }
  ];

  const fieldMapping = {
    'Date': 'date',
    'DISA': 'disa',
    'Item': 'item',
    'Item (Optional)': 'itemSecond',
    'Date Code': 'dateCode',
    'Heat Code': 'heatCode',
    'Bar Dia': 'barDia',
    'Gauge Length': 'gaugeLength',
    'Max Load': 'maxLoad',
    'Yield Load': 'yieldLoad',
    'Tensile Strength': 'tensileStrength',
    'Yield Strength': 'yieldStrength',
    'Elongation': 'elongation',
    'Remarks': 'remarks',
    'Tested By': 'testedBy'
  };

  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);
  const [formData, setFormData] = useState({
    date: '',
    disa: '',
    item: '',
    itemSecond: '',
    dateCode: '',
    heatCode: '',
    barDia: '',
    gaugeLength: '',
    maxLoad: '',
    yieldLoad: '',
    tensileStrength: '',
    yieldStrength: '',
    elongation: '',
    remarks: '',
    testedBy: ''
  });

  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const [isPrimarySaved, setIsPrimarySaved] = useState(false);
  const [savePrimaryLoading, setSavePrimaryLoading] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [showCombinationFound, setShowCombinationFound] = useState(false);
  const [showCombinationAdded, setShowCombinationAdded] = useState(false);
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);
  const [highlightPrimaryFields, setHighlightPrimaryFields] = useState(false);

  const [itemValid, setItemValid] = useState(null);
  const [itemSecondValid, setItemSecondValid] = useState(null);
  const [dateCodeValid, setDateCodeValid] = useState(null);
  const [heatCodeValid, setHeatCodeValid] = useState(null);
  const [barDiaValid, setBarDiaValid] = useState(null);
  const [gaugeLengthValid, setGaugeLengthValid] = useState(null);
  const [maxLoadValid, setMaxLoadValid] = useState(null);
  const [yieldLoadValid, setYieldLoadValid] = useState(null);
  const [tensileStrengthValid, setTensileStrengthValid] = useState(null);
  const [yieldStrengthValid, setYieldStrengthValid] = useState(null);
  const [elongationValid, setElongationValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);
  const [testedByValid, setTestedByValid] = useState(null);

  const validationSetters = {
    'item': setItemValid,
    'itemSecond': setItemSecondValid,
    'dateCode': setDateCodeValid,
    'heatCode': setHeatCodeValid,
    'barDia': setBarDiaValid,
    'gaugeLength': setGaugeLengthValid,
    'maxLoad': setMaxLoadValid,
    'yieldLoad': setYieldLoadValid,
    'tensileStrength': setTensileStrengthValid,
    'yieldStrength': setYieldStrengthValid,
    'elongation': setElongationValid,
    'remarks': setRemarksValid,
    'testedBy': setTestedByValid
  };

  const validateField = (rule, mappedFields, formData) => {
    if (Array.isArray(mappedFields)) return { isValid: true };
    const fieldName = mappedFields;
    const value = formData[fieldName];
    const inputElement = inputRefs?.current?.[fieldName];

    if (inputElement && inputElement.validity && inputElement.validity.badInput) {
      return { isValid: false, message: `${rule.field} must be a valid ${rule.type.toLowerCase()}` };
    }

    if (rule.required) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { isValid: false, message: `${rule.field} is required` };
      }
    }

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: true };
    }

    switch (rule.type) {
      case 'Number':
        const stringValue = String(value).trim();
        const invalidNumberPattern = /[eE+]|\..*\.|--|\+\+/;
        if (invalidNumberPattern.test(stringValue)) return { isValid: false };
        if (/[eE.+-]$/.test(stringValue)) return { isValid: false };
        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) return { isValid: false };
        if (rule.min !== undefined && num <= rule.min && rule.field !== 'Elongation') {
          if (rule.min === 0 && num === 0) return { isValid: false };
          if (num < rule.min) return { isValid: false };
        } else if (rule.min !== undefined && num < rule.min) {
           return { isValid: false };
        }
        if (rule.max !== undefined && num > rule.max) return { isValid: false };
        break;

      case 'Text':
        const textValue = String(value).trim();
        if (rule.field === 'Date Code') {
          const dateCodePattern = /^[0-9][A-Z][0-9]{2}$/;
          if (!dateCodePattern.test(textValue)) return { isValid: false };
        }
        break;
      default:
        break;
    }
    return { isValid: true };
  };

  const fieldOrder = ['date', 'disa', 'item', 'itemSecond', 'dateCode', 'heatCode', 'barDia', 'gaugeLength',
                     'maxLoad', 'yieldLoad', 'tensileStrength', 'yieldStrength', 'elongation', 'remarks', 'testedBy'];

  const requiredFields = ['date', 'disa', 'item', 'dateCode', 'heatCode', 'barDia', 'gaugeLength',
                          'maxLoad', 'yieldLoad', 'tensileStrength', 'yieldStrength', 'elongation'];

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      date: `${y}-${m}-${d}`
    }));
  }, []);

  useEffect(() => {
    const checkDateDisaExists = async () => {
      if (!formData.date || !formData.disa) {
        setIsPrimarySaved(false);
        setEntryCount(0);
        setSavePrimaryLoading(false);
        setShowCombinationFound(false);
        setShowCombinationAdded(false);
        return;
      }

      try {
        setSavePrimaryLoading(true);
        setShowCombinationFound(false);

        const startTime = Date.now();

        const response = await fetch(`${API_ENDPOINTS.microTensile}/check?date=${formData.date}&disa=${encodeURIComponent(formData.disa)}`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        setSavePrimaryLoading(false);

        if (data.success && data.exists) {
          setShowCombinationFound(true);

          setTimeout(() => {
            setShowCombinationFound(false);
            setIsPrimarySaved(true);
            setEntryCount(data.count || 0);
          }, 1500);
        } else {
          setIsPrimarySaved(false);
          setEntryCount(0);
        }
      } catch (error) {
        setSavePrimaryLoading(false);
      }
    };

    checkDateDisaExists();
  }, [formData.date, formData.disa]);

  useEffect(() => {
    const handleDisabledClick = (e) => {
      const target = e.target;

      if ((target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') && target.disabled) {
        handleDisabledFieldClick(e);
        return;
      }

      if (target.tagName === 'LABEL') {
        let formGroup = target.closest('.microtensile-form-group');
        if (formGroup) {
          const input = formGroup.querySelector('input, select, textarea');
          if (input && input.disabled) {
            handleDisabledFieldClick(e);
            return;
          }
        }
      }

      if (target.classList && target.classList.contains('microtensile-form-grid') && !isPrimarySaved) {
        handleDisabledFieldClick(e);
        return;
      }

      let formGroup = null;
      if (target.classList && target.classList.contains('microtensile-form-group')) {
        formGroup = target;
      } else {
        formGroup = target.closest('.microtensile-form-group');
      }

      if (formGroup) {
        const input = formGroup.querySelector('input, select, textarea');
        if (input && input.disabled) {
          handleDisabledFieldClick(e);
          return;
        }
      }

      if (!isPrimarySaved) {
        const closestFormGroup = target.closest('.microtensile-form-group');
        if (closestFormGroup) {
          const input = closestFormGroup.querySelector('input, select, textarea');
          if (input && input.disabled) {
            handleDisabledFieldClick(e);
            return;
          }
        }
      }
    };

    document.addEventListener('mousedown', handleDisabledClick, true);

    return () => {
      document.removeEventListener('mousedown', handleDisabledClick, true);
    };
  }, [isPrimarySaved]);

  const handleDisabledFieldClick = (e) => {
    if (!isPrimarySaved) {
      e.preventDefault();
      e.stopPropagation();

      setShowPrimaryWarning(true);
      setHighlightPrimaryFields(true);

      if (primarySectionRef.current) {
        primarySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      setTimeout(() => {
        setShowPrimaryWarning(false);
        setHighlightPrimaryFields(false);
      }, 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'date' || name === 'disa') {
      setIsPrimarySaved(false);

      setFormData(prev => ({
        date: name === 'date' ? value : prev.date,
        disa: name === 'disa' ? value : prev.disa,
        item: '',
        itemSecond: '',
        dateCode: '',
        heatCode: '',
        barDia: '',
        gaugeLength: '',
        maxLoad: '',
        yieldLoad: '',
        tensileStrength: '',
        yieldStrength: '',
        elongation: '',
        remarks: '',
        testedBy: ''
      }));

      setItemValid(null);
      setItemSecondValid(null);
      setDateCodeValid(null);
      setHeatCodeValid(null);
      setBarDiaValid(null);
      setGaugeLengthValid(null);
      setMaxLoadValid(null);
      setYieldLoadValid(null);
      setTensileStrengthValid(null);
      setYieldStrengthValid(null);
      setElongationValid(null);
      setRemarksValid(null);
      setTestedByValid(null);
      setErrors({});
      setSubmitError('');
      return;
    }

    if (name === 'item') {
      setItemValid(null);
    }

    if (name === 'dateCode') {
      setDateCodeValid(null);
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
      setErrors(prev => ({ ...prev, [name]: false }));
      return;
    }

    if (name === 'heatCode') {
      const cleaned = String(value).replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      setHeatCodeValid(null);
      setErrors(prev => ({ ...prev, [name]: false }));
      return;
    }

    if (name === 'barDia') {
      setBarDiaValid(null);
    }

    if (name === 'gaugeLength') {
      setGaugeLengthValid(null);
    }

    if (name === 'maxLoad') {
      setMaxLoadValid(null);
    }

    if (name === 'yieldLoad') {
      setYieldLoadValid(null);
    }

    if (name === 'tensileStrength') {
      setTensileStrengthValid(null);
    }

    if (name === 'yieldStrength') {
      setYieldStrengthValid(null);
    }

    if (name === 'elongation') {
      setElongationValid(null);
    }

    if (name === 'remarks') {
      setRemarksValid(null);
    }

    if (name === 'testedBy') {
      setTestedByValid(null);
    }

    if (name === 'itemSecond') {
      const slashCount = (value.match(/\//g) || []).length;

      if (slashCount <= 2) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));

        if (value.trim() !== '') {
          const parts = value.split('/');
          const isValid = parts.length === 3 && parts.every(p => p.trim() !== '' && !isNaN(p));
          setItemSecondValid(isValid);
        } else {
          setItemSecondValid(null);
        }
      }
      setErrors(prev => ({ ...prev, [name]: false }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const formatDecimalValue = (fieldName) => {
    const value = formData[fieldName];
    if (value && !isNaN(value) && value.trim() !== '') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: num.toFixed(1)
        }));
      }
    }
  };

  const handleNumericBlur = (fieldName) => {
    formatDecimalValue(fieldName);
  };

  const handlePrimarySubmit = async () => {
    if (!formData.date || !formData.disa) {
      toast.warning('Please fill in Date and DISA');
      return;
    }

    if (savePrimaryLoading || showCombinationFound || showCombinationAdded) {
      return;
    }

    try {
      setSavePrimaryLoading(true);

      const startTime = Date.now();

      const response = await fetch(`${API_ENDPOINTS.microTensile}/save-primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date: formData.date, disa: formData.disa })
      });

      const data = await response.json();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      setSavePrimaryLoading(false);

      if (data.success) {
        setShowCombinationAdded(true);

        setTimeout(() => {
          setShowCombinationAdded(false);
          setIsPrimarySaved(true);
          setEntryCount(data.count || 0);

          setTimeout(() => {
            inputRefs.current.item?.focus();
          }, 100);
        }, 1500);
      } else {
        toast.error('Failed to save primary: ' + data.message);
      }
    } catch (error) {
      setSavePrimaryLoading(false);
      toast.error('Failed to save primary: ' + error.message);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (field === 'itemSecond') {
        const currentValue = formData.itemSecond;
        const slashCount = (currentValue.match(/\//g) || []).length;

        if (!currentValue || currentValue.trim() === '') {
          const idx = fieldOrder.indexOf(field);
          if (idx < fieldOrder.length - 1) {
            inputRefs.current[fieldOrder[idx + 1]]?.focus();
          }
          return;
        }

        const parts = currentValue.split('/');
        const isValid = parts.length === 3 && parts.every(p => p.trim() !== '' && !isNaN(p));

        if (slashCount < 2 && !currentValue.endsWith('/')) {
          setFormData(prev => ({
            ...prev,
            itemSecond: currentValue + '/'
          }));
          return;
        }

        if (isValid || (slashCount === 2 && parts.length === 3)) {
          const idx = fieldOrder.indexOf(field);
          if (idx < fieldOrder.length - 1) {
            inputRefs.current[fieldOrder[idx + 1]]?.focus();
          }
          return;
        }
      }

      const decimalFields = ['barDia', 'gaugeLength', 'maxLoad', 'yieldLoad', 'tensileStrength', 'yieldStrength', 'elongation'];
      if (decimalFields.includes(field)) {
        formatDecimalValue(field);
      }

      if (requiredFields.includes(field)) {
        const isFilled = field === 'disa'
          ? (Array.isArray(formData.disa) && formData.disa.length > 0)
          : Boolean(formData[field]);

        if (!isFilled) {
          setErrors(prev => ({ ...prev, [field]: true }));
          return;
        }
      }

      const idx = fieldOrder.indexOf(field);
      if (idx < fieldOrder.length - 1) {
        inputRefs.current[fieldOrder[idx + 1]]?.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');

    let hasErrors = false;
    let firstErrorField = null;

    for (const rule of validationRanges) {
      if (rule.field === 'Date' || rule.field === 'DISA') continue;

      const mappedField = fieldMapping[rule.field];
      const validationSetter = validationSetters[mappedField];

      if (!mappedField || !validationSetter) continue;

      const result = validateField(rule, mappedField, formData);

      if (!result.isValid) {
        validationSetter(false);
        hasErrors = true;
        if (!firstErrorField) firstErrorField = mappedField;
      } else {
        validationSetter(null);
      }
    }

    if (hasErrors) {
      setSubmitError('Enter data in correct Format');

      if (firstErrorField) {
        inputRefs.current[firstErrorField]?.focus();
      }
      return;
    }

    setSubmitError('');

    if (formData.itemSecond && formData.itemSecond.trim() !== '') {
      const parts = formData.itemSecond.split('/');
      const isValidFormat = parts.length === 3 && parts.every(p => p.trim() !== '' && !isNaN(p));

      if (!isValidFormat) {
        setItemSecondValid(false);
        setSubmitError('Item (Optional) must be in format: number/number/number (e.g., 343/34/56)');
        setTimeout(() => setSubmitError(''), 3000);
        inputRefs.current.itemSecond?.focus();
        return;
      }
    }

    try {
      setSubmitLoading(true);

      const itemObj = {
        it1: formData.item
      };
      if (formData.itemSecond && formData.itemSecond.trim() !== '') {
        const cleaned = formData.itemSecond.trim();
        itemObj.it2 = cleaned.startsWith('(') && cleaned.endsWith(')') ? cleaned : `(${cleaned})`;
      }

      const payload = {
        ...formData,
        item: itemObj
      };
      delete payload.itemSecond;

      const resp = await fetch(API_ENDPOINTS.microTensile, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success) {
        setShowSuccessAnimation(true);

        setFormData({
          date: formData.date,
          disa: formData.disa,
          item: '',
          itemSecond: '',
          dateCode: '',
          heatCode: '',
          barDia: '',
          gaugeLength: '',
          maxLoad: '',
          yieldLoad: '',
          tensileStrength: '',
          yieldStrength: '',
          elongation: '',
          remarks: '',
          testedBy: ''
        });
        setErrors({});

        setItemValid(null);
        setItemSecondValid(null);
        setDateCodeValid(null);
        setHeatCodeValid(null);
        setBarDiaValid(null);
        setGaugeLengthValid(null);
        setMaxLoadValid(null);
        setYieldLoadValid(null);
        setTensileStrengthValid(null);
        setYieldStrengthValid(null);
        setElongationValid(null);
        setRemarksValid(null);
        setTestedByValid(null);

        setEntryCount(prev => prev + 1);

        setTimeout(() => {
          inputRefs.current.item?.focus();
        }, 100);
      }
    } catch (error) {
      toast.error('Failed to create entry: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getInputClassName = (fieldName, validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  return (
    <>
      {showSuccessAnimation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Sakthi onComplete={() => setShowSuccessAnimation(false)} />
        </div>
      )}
      <div className="microtensile-header">
        <div className="microtensile-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Micro Tensile Test - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? (() => {
            const [y, m, d] = formData.date.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      {}
      <div ref={primarySectionRef}>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: 600, color: '#25424c' }}>
          Primary Data {isPrimarySaved && <span style={{ fontWeight: 400, fontSize: '0.875rem', color: '#5B9AA9' }}>(Entries: {entryCount})</span>}
        </h3>
      </div>

      <div className="microtensile-form-grid">
            <div className="microtensile-form-group">
              <label>Date</label>
              <CustomDatePicker
                ref={el => inputRefs.current.date = el}
                name="date"
                value={formData.date}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'date')}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  border: highlightPrimaryFields ? '2px solid #ef4444' : undefined,
                  backgroundColor: highlightPrimaryFields ? '#fee2e2' : undefined,
                  transition: 'all 0.3s ease'
                }}
              />
            </div>

            <div className="microtensile-form-group">
              <label>DISA</label>
              <DisaDropdown
                ref={el => inputRefs.current.disa = el}
                name="disa"
                value={formData.disa}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'disa')}
                style={{
                  border: highlightPrimaryFields ? '2px solid #ef4444' : undefined,
                  backgroundColor: highlightPrimaryFields ? '#fee2e2' : undefined,
                  transition: 'all 0.3s ease'
                }}
              />
              {(savePrimaryLoading || showCombinationFound || showCombinationAdded || showPrimaryWarning) && (
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
                </div>
              )}
            </div>

            <div className="microtensile-form-group">
              <label>&nbsp;</label>
              <LockPrimaryButton
                onClick={handlePrimarySubmit}
                disabled={savePrimaryLoading || showCombinationFound || showCombinationAdded || !formData.date || !formData.disa || isPrimarySaved}
                isLocked={isPrimarySaved}
              />
            </div>

            {}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className={`microtensile-form-group ${errors.item ? 'microtensile-error-outline' : ''}`}>
              <label>Item</label>
              <input
                ref={el => inputRefs.current.item = el}
                type="text"
                name="item"
                value={formData.item}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'item')}
                placeholder="e.g: Volvo Bkt 234"
                disabled={!isPrimarySaved}
                className={getInputClassName('item', itemValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.itemSecond ? 'microtensile-error-outline' : ''}`}>
              <label>Item (Optional)</label>
              <input
                ref={el => inputRefs.current.itemSecond = el}
                type="text"
                name="itemSecond"
                value={formData.itemSecond}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'itemSecond')}
                placeholder="(Optional) e.g: 343/34/56"
                disabled={!isPrimarySaved}
                className={getInputClassName('itemSecond', itemSecondValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.dateCode ? 'microtensile-error-outline' : ''}`}>
              <label>Date Code</label>
              <input
                ref={el => inputRefs.current.dateCode = el}
                type="text"
                name="dateCode"
                value={formData.dateCode}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'dateCode')}
                placeholder="e.g: 5E04"
                disabled={!isPrimarySaved}
                className={getInputClassName('dateCode', dateCodeValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.heatCode ? 'microtensile-error-outline' : ''}`}>
              <label>Heat Code</label>
              <input
                ref={el => inputRefs.current.heatCode = el}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                name="heatCode"
                value={formData.heatCode}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'heatCode')}
                placeholder="e.g: 1"
                disabled={!isPrimarySaved}
                className={getInputClassName('heatCode', heatCodeValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.barDia ? 'microtensile-error-outline' : ''}`}>
              <label>Bar Dia (mm)</label>
              <input
                ref={el => inputRefs.current.barDia = el}
                type="number"
                name="barDia"
                value={formData.barDia}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'barDia')}
                onBlur={() => handleNumericBlur('barDia')}
                step="0.01"
                placeholder="e.g: 6.0"
                disabled={!isPrimarySaved}
                className={getInputClassName('barDia', barDiaValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.gaugeLength ? 'microtensile-error-outline' : ''}`}>
              <label>Gauge Length (mm)</label>
              <input
                ref={el => inputRefs.current.gaugeLength = el}
                type="number"
                name="gaugeLength"
                value={formData.gaugeLength}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'gaugeLength')}
                onBlur={() => handleNumericBlur('gaugeLength')}
                step="0.01"
                placeholder="e.g: 30.0"
                disabled={!isPrimarySaved}
                className={getInputClassName('gaugeLength', gaugeLengthValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.maxLoad ? 'microtensile-error-outline' : ''}`}>
              <label>Max Load (Kgs) or KN</label>
              <input
                ref={el => inputRefs.current.maxLoad = el}
                type="number"
                name="maxLoad"
                value={formData.maxLoad}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'maxLoad')}
                onBlur={() => handleNumericBlur('maxLoad')}
                step="0.01"
                placeholder="e.g: 1560"
                disabled={!isPrimarySaved}
                className={getInputClassName('maxLoad', maxLoadValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.yieldLoad ? 'microtensile-error-outline' : ''}`}>
              <label>Yield Load (Kgs) or KN</label>
              <input
                ref={el => inputRefs.current.yieldLoad = el}
                type="number"
                name="yieldLoad"
                value={formData.yieldLoad}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'yieldLoad')}
                onBlur={() => handleNumericBlur('yieldLoad')}
                step="0.01"
                placeholder="e.g: 1290"
                disabled={!isPrimarySaved}
                className={getInputClassName('yieldLoad', yieldLoadValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.tensileStrength ? 'microtensile-error-outline' : ''}`}>
              <label>Tensile Strength (Kg/mm² or Mpa)</label>
              <input
                ref={el => inputRefs.current.tensileStrength = el}
                type="number"
                name="tensileStrength"
                value={formData.tensileStrength}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'tensileStrength')}
                onBlur={() => handleNumericBlur('tensileStrength')}
                step="0.01"
                placeholder="e.g: 550"
                disabled={!isPrimarySaved}
                className={getInputClassName('tensileStrength', tensileStrengthValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.yieldStrength ? 'microtensile-error-outline' : ''}`}>
              <label>Yield Strength (Kg/mm² or Mpa)</label>
              <input
                ref={el => inputRefs.current.yieldStrength = el}
                type="number"
                name="yieldStrength"
                value={formData.yieldStrength}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'yieldStrength')}
                onBlur={() => handleNumericBlur('yieldStrength')}
                step="0.01"
                placeholder="e.g: 455"
                disabled={!isPrimarySaved}
                className={getInputClassName('yieldStrength', yieldStrengthValid)}
              />
            </div>

            <div className={`microtensile-form-group ${errors.elongation ? 'microtensile-error-outline' : ''}`}>
              <label>Elongation %</label>
              <input
                ref={el => inputRefs.current.elongation = el}
                type="number"
                name="elongation"
                value={formData.elongation}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'elongation')}
                onBlur={() => handleNumericBlur('elongation')}
                step="0.01"
                placeholder="e.g: 18.5"
                disabled={!isPrimarySaved}
                className={getInputClassName('elongation', elongationValid)}
              />
            </div>

            <div className="microtensile-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Remarks</label>
              <input
                type="text"
                ref={el => inputRefs.current.remarks = el}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'remarks')}
                placeholder="Enter any additional notes or observations..."
                maxLength={80}
                disabled={!isPrimarySaved}
                className={getInputClassName('remarks', remarksValid)}
              />
            </div>

            <div className="microtensile-form-group">
              <label>Tested By</label>
              <input
                ref={el => inputRefs.current.testedBy = el}
                type="text"
                name="testedBy"
                value={formData.testedBy}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'testedBy')}
                placeholder="e.g: John Smith"
                disabled={!isPrimarySaved}
                className={getInputClassName('testedBy', testedByValid)}
              />
            </div>
          </div>

      <div className="microtensile-submit-container" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {submitError && (
          <InlineLoader
            message={submitError}
            size="medium"
            variant="danger"
          />
        )}
        <SubmitButton
            onClick={handleSubmit}
            disabled={!isPrimarySaved || submitLoading}
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
        title="Micro Tensile Test Validation"
        validationRanges={validationRanges}
      />
    </>
  );
};

export default MicroTensile;
