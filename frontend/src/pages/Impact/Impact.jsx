import { useState, useRef, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SubmitButton, PlusButton, MinusButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Sakthi from '../../Components/Sakthi';
import { InlineLoader, toast } from '../../Components/Alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/Impact/Impact.css';

const Impact = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();

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
      pattern: 'Alphanumeric'
    },
    {
      field: 'Date Code',
      required: true,
      type: 'Text',
      pattern: 'e.g., 6F25'
    },
    {
      field: 'Specification',
      type: 'Text',
      pattern: 'e.g., 12.5 J, 30° unnotch'
    },
    {
      field: 'Observed Value',
      required: true,
      type: 'NumberArray',
      pattern: 'Individual number inputs (e.g., 12.5 each)',
      min: 0,
      max: 100
    },
    {
      field: 'Remarks',
      type: 'Text',
      maxLength: 200
    }
  ];

  const fieldMapping = {
    'Date': 'date',
    'Part Name': 'partName',
    'Date Code': 'dateCode',
    'Specification': 'specification',
    'Observed Value': 'observedValues',
    'Remarks': 'remarks'
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
  } = useDepartmentForm('impact');

  const isDateSelected = formData.date && formData.date.trim() !== '';

  const [submitLoading, setSubmitLoading] = useState(false);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const submitButtonRef = useRef(null);
  const inputRefs = useRef({});
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const [observedValues, setObservedValues] = useState([{ id: 1, value: '' }]);

  const addObservedValue = () => {
    const newId = observedValues.length > 0 ? Math.max(...observedValues.map(ov => ov.id)) + 1 : 1;
    const newValues = [...observedValues, { id: newId, value: '' }];
    setObservedValues(newValues);
    setFormData(prev => ({
      ...prev,
      observedValues: newValues.map(ov => ov.value)
    }));
  };

  const removeObservedValue = (id) => {
    const filtered = observedValues.filter(ov => ov.id !== id);
    const finalValues = filtered.length > 0 ? filtered : [{ id: 1, value: '' }];

    setObservedValues(finalValues);
    setFormData(prev => ({
      ...prev,
      observedValues: finalValues.map(ov => ov.value)
    }));
  };

  const updateObservedValue = (id, value) => {
    const updatedValues = observedValues.map(ov => ov.id === id ? { ...ov, value } : ov);

    setObservedValues(updatedValues);
    setFormData(prev => ({
      ...prev,
      observedValues: updatedValues.map(ov => ov.value)
    }));
  };

  useEffect(() => {
    if (formData.observedValues && Array.isArray(formData.observedValues)) {
      if (formData.observedValues.length === 0) {
        setObservedValues([{ id: 1, value: '' }]);
      } else {
        if (formData.observedValues.length !== observedValues.length) {
          const syncedValues = formData.observedValues.map((val, index) => ({
            id: index + 1,
            value: val || ''
          }));
          setObservedValues(syncedValues);
        }
      }
    }
  }, [formData.observedValues, observedValues.length]);

  const validationSetters = {
    'date': (val) => setValidation('date', val),
    'partName': (val) => setValidation('partName', val),
    'dateCode': (val) => setValidation('dateCode', val),
    'specification': (val) => setValidation('specification', val),
    'observedValues': (val) => setValidation('observedValues', val),
    'remarks': (val) => setValidation('remarks', val)
  };

  const validateField = (rule, mappedFields, formData) => {
    if (Array.isArray(mappedFields)) {
      const [minField, maxField] = mappedFields;
      const minValue = formData[minField];
      const maxValue = formData[maxField];
      const minInput = inputRefs?.current?.[minField];
      const maxInput = inputRefs?.current?.[maxField];

      if ((minInput && minInput.validity && minInput.validity.badInput) ||
          (maxInput && maxInput.validity && maxInput.validity.badInput)) {
        return { isValid: false, message: `${rule.field} must contain valid numbers` };
      }

      if (rule.required) {
        if (!minValue || !maxValue) {
          return { isValid: false, message: `${rule.field} is required` };
        }
      }

      if (minValue && maxValue) {
        const min = parseFloat(minValue);
        const max = parseFloat(maxValue);

        if (isNaN(min) || isNaN(max)) {
          return { isValid: false, message: `${rule.field} must contain valid numbers` };
        }

        if (min >= max) {
          return { isValid: false, message: `${rule.field} minimum must be less than maximum` };
        }
      }

      return { isValid: true };
    }

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
      case 'Integer':
        const stringValue = String(value).trim();

        const invalidNumberPattern = /[eE+]|\..*\.|--|\+\+/;
        if (invalidNumberPattern.test(stringValue)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        if (/[eE.+-]$/.test(stringValue)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) {
          return { isValid: false, message: `${rule.field} must be a valid number` };
        }

        if (rule.min !== undefined && num < rule.min) {
          return { isValid: false, message: `${rule.field} must be at least ${rule.min}` };
        }
        if (rule.max !== undefined && num > rule.max) {
          return { isValid: false, message: `${rule.field} must be no more than ${rule.max}` };
        }

        if (rule.type === 'Integer' && !Number.isInteger(num)) {
          return { isValid: false, message: `${rule.field} must be a whole number` };
        }
        break;

      case 'NumberArray':
        const arrayValue = formData[fieldName];

        if (!Array.isArray(arrayValue)) {
          return rule.required ? { isValid: false, message: `${rule.field} is required` } : { isValid: true };
        }

        const nonEmptyValues = arrayValue.filter(val => val !== null && val !== undefined && String(val).trim() !== '');

        if (rule.required && nonEmptyValues.length === 0) {
          return { isValid: false, message: `${rule.field} must have at least one value` };
        }

        for (let i = 0; i < nonEmptyValues.length; i++) {
          const val = nonEmptyValues[i];
          const num = parseFloat(val);

          if (isNaN(num) || !isFinite(num)) {
            return { isValid: false, message: `${rule.field} must contain only valid numbers` };
          }

          if (rule.min !== undefined && num < rule.min) {
            return { isValid: false, message: `${rule.field} values must be at least ${rule.min}` };
          }
          if (rule.max !== undefined && num > rule.max) {
            return { isValid: false, message: `${rule.field} values must be no more than ${rule.max}` };
          }
        }
        break;

      case 'Text':
        const textValue = String(value).trim();
        if (textValue === '') {
          return rule.required ? { isValid: false, message: `${rule.field} is required` } : { isValid: true };
        }

        if (rule.field === 'Date Code') {
          const dateCodePattern = /^[0-9][A-Z][0-9]{2}$/;
          if (!dateCodePattern.test(textValue)) {
            return { isValid: false, message: `${rule.field} must be in format: 1 digit, 1 letter, 2 digits (e.g., 6F25)` };
          }
        }

        if (rule.maxLength && textValue.length > rule.maxLength) {
          return { isValid: false, message: `${rule.field} must be no more than ${rule.maxLength} characters` };
        }
        break;

      case 'Select':
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
          return { isValid: false, message: `${rule.field} must be one of: ${rule.allowedValues.join(', ')}` };
        }
        break;

      case 'Date':
        if (value && typeof value === 'string' && value.trim() !== '') {
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            return { isValid: false, message: `${rule.field} must be a valid date` };
          }
        }
        break;

      default:
        break;
    }

    return { isValid: true };
  };

  const getInputClassName = (validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  const isObservedValueInvalid = (val) => {
    const rule = validationRanges.find(r => r.field === 'Observed Value');
    if (!rule) return false;

    if (val === undefined || val === null || String(val).trim() === '') {
      return rule.required ? true : false;
    }

    const num = parseFloat(val);
    if (isNaN(num) || !isFinite(num)) return true;
    if (rule.min !== undefined && num < rule.min) return true;
    if (rule.max !== undefined && num > rule.max) return true;

    return false;
  };

  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d} / ${m} / ${y}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValidation(name, null);

    const finalValue = name === 'dateCode' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleObservedValueChange = (id, value) => {
    setValidation('observedValues', null);

    updateObservedValue(id, value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.target.form;
      const inputs = Array.from(form.querySelectorAll('input, textarea'));
      const currentIndex = inputs.indexOf(e.target);
      const nextInput = inputs[currentIndex + 1];

      if (nextInput) {
        nextInput.focus();
      } else {
        if (submitButtonRef.current) submitButtonRef.current.focus();
      }
    }
  };

  const handleSubmitButtonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let hasErrors = false;
    let firstErrorField = null;
    const errorMessages = [];

    for (const rule of validationRanges) {
      const mappedField = fieldMapping[rule.field];
      const validationSetter = validationSetters[mappedField];

      if (!mappedField || !validationSetter) {
        continue;
      }

      const result = validateField(rule, mappedField, formData);

      if (!result.isValid) {
        validationSetter(false);
        hasErrors = true;
        errorMessages.push(result.message);

        if (!firstErrorField) {
          firstErrorField = mappedField;
        }
      } else {
        validationSetter(null);
      }
    }

    if (hasErrors) {
      setSubmitErrorMessage('Enter data in correct Format');

      if (firstErrorField) {
        if (firstErrorField === 'observedValues' && observedValues.length > 0) {
          inputRefs.current[`observedValue_${observedValues[0].id}`]?.focus();
        } else {
          inputRefs.current[firstErrorField]?.focus();
        }
      }

      return;
    }

    setSubmitErrorMessage('');

    try {
      setSubmitLoading(true);

      const payload = { ...formData };

      // Backend stores observedValue as a single comma-separated string (e.g. "12.5, 34.6").
      payload.observedValue = observedValues
        .map(ov => ov.value)
        .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
        .join(', ');
      delete payload.observedValues;

      for (const rule of validationRanges) {
        const mappedField = fieldMapping[rule.field];
        if (!mappedField || Array.isArray(mappedField)) continue;

        if (mappedField === 'observedValues') continue;

        const isRequired = rule.required === true;
        if (!isRequired && (!payload[mappedField] || payload[mappedField].toString().trim() === '')) {
          payload[mappedField] = '-';
        }
      }

      const response = await fetch(API_ENDPOINTS.impactTests, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        setShowSuccessPopup(true);

        resetFormData();

        setObservedValues([{ id: 1, value: '' }]);

        setTimeout(() => {
          inputRefs.current.date?.focus();
        }, 100);
      }
    } catch (error) {
      toast.error('Failed to create entry: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="impact-header">
        <div className="impact-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Impact Test - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? formatDisplayDate(formData.date) : '-'}
        </div>
      </div>

      {}
      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="Impact Test - Validation Ranges & Guidelines"
        validationRanges={validationRanges}
      />

      <form className="impact-form-grid" ref={gridRef} onKeyDown={handleArrowKeyDown}>

        {}
        <div className="impact-form-group">
          <label>Date</label>

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

        {}
        <div className="impact-form-group">
          <label>Part Name</label>
          <input
            ref={(el) => inputRefs.current.partName = el}
            type="text"
            name="partName"
            value={formData.partName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g: Crankshaft"
            autoComplete="off"
            className={getInputClassName(validationStates.partName)}
          />
        </div>

        {}
        <div className="impact-form-group">
          <label>Date Code</label>
          <input
            ref={(el) => inputRefs.current.dateCode = el}
            type="text"
            name="dateCode"
            value={formData.dateCode}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g: 6F25"
            autoComplete="off"
            className={getInputClassName(validationStates.dateCode)}
          />
        </div>

        {}
        <div className="impact-form-group">
          <label>Specification</label>
          <input
            ref={(el) => inputRefs.current.specification = el}
            type="text"
            name="specification"
            value={formData.specification}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g: 12.5 J, 30° unnotch"
            autoComplete="off"
            className={getInputClassName(validationStates.specification)}
          />
        </div>

        {}
        <div className="impact-form-group" style={{ gridColumn: 'span 2' }}>
          <label>Observed Values</label>
          <div style={{
            display: 'flex',
            flexFlow: 'row wrap',
            gap: '1rem',
            alignItems: 'center',
            width: '100%'
          }}>
            {observedValues.map((observedValue, index) => (
              <div
                key={observedValue.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <input
                  ref={(el) => inputRefs.current[`observedValue_${observedValue.id}`] = el}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={observedValue.value}
                  onChange={(e) => handleObservedValueChange(observedValue.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Value ${index + 1}`}
                  autoComplete="off"
                  style={{
                    width: '100px',
                    padding: '0.5rem 0.75rem',
                    border: (validationStates.observedValues === false && isObservedValueInvalid(observedValue.value))
                              ? '2px solid #ef4444'
                              : '2px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: '#fff',
                    display: 'inline-block'
                  }}
                />
                <div style={{
                  display: 'inline-flex',
                  gap: '0.2rem',
                  alignItems: 'center'
                }}>
                  {observedValues.length > 1 && (
                    <MinusButton
                      onClick={() => removeObservedValue(observedValue.id)}
                      title={`Remove value ${index + 1}`}
                    />
                  )}
                  {index === observedValues.length - 1 && (
                    <PlusButton
                      onClick={addObservedValue}
                      title="Add another value"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="impact-form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Remarks</label>
          <input
            ref={(el) => inputRefs.current.remarks = el}
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter any additional notes or observations..."
            maxLength={80}
            autoComplete="off"
            className={getInputClassName(validationStates.remarks)}
          />
        </div>

      </form>

      <div className="impact-submit-container">
        {submitErrorMessage && (
          <InlineLoader
            message={submitErrorMessage}
            variant="danger"
            size="medium"
          />
        )}
        <div className="impact-submit-right">
          <SubmitButton
            ref={submitButtonRef}
            onClick={handleSubmit}
            disabled={submitLoading}
            onKeyDown={handleSubmitButtonKeyDown}
          >
            {submitLoading ? 'Saving...' : 'Submit Entry'}
          </SubmitButton>
        </div>
      </div>

      {}
      {showSuccessPopup && (
        <div className="sakthi-overlay">
          <Sakthi onComplete={() => setShowSuccessPopup(false)} />
        </div>
      )}
    </>
  );
};

export default Impact;
