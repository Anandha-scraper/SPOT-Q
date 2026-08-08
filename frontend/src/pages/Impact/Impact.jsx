import { useState, useRef } from 'react';
import { Save } from 'lucide-react';
import { SubmitButton, PlusButton, MinusButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { InlineLoader } from '../../Components/InlineLoader';
import { useToast } from '../../Components/alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { runValidation, getRequiredFields, RequiredMark, checkNumber } from '../../utils/formValidation';
import { buildSubmitError } from '../../utils/submitError';
import { API_ENDPOINTS } from '../../config/api';
import { validationRanges, fieldMapping } from '../../deviations/Dimpact';
import '../../styles/PageStyles/Impact/Impact.css';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const Impact = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  const {
    formData,
    setFormData,
    validationStates,
    setValidation,
    submitErrorMessage,
    setSubmitErrorMessage,
    resetFormData
  } = useDepartmentForm('impact');

  const [submitLoading, setSubmitLoading] = useState(false);

  const submitButtonRef = useRef(null);
  const inputRefs = useRef({});
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const observedValueRule = validationRanges.find(r => r.field === 'Observed Value');
  const maxObservedRows = observedValueRule?.maxRows ?? Infinity;

  const validationSetters = {
    'date': (val) => setValidation('date', val),
    'partName': (val) => setValidation('partName', val),
    'dateCode': (val) => setValidation('dateCode', val),
    'specification': (val) => setValidation('specification', val),
    'observedValues': (val) => setValidation('observedValues', val),
    'remarks': (val) => setValidation('remarks', val)
  };

  const requiredFields = getRequiredFields(validationRanges, fieldMapping);
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);

  const getInputClassName = (validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  const isObservedValueInvalid = (val) => {
    if (!observedValueRule) return false;

    if (val === undefined || val === null || String(val).trim() === '') {
      return observedValueRule.required ? true : false;
    }

    // min/max are QC target ranges, not hard input limits — the real
    // measured value must be accepted (and not red-bordered) even outside spec.
    return !checkNumber({ type: 'Number' }, val, observedValueRule.field).isValid;
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

  const addObservedValue = () => {
    setFormData(prev => {
      if (prev.observedValues.length >= maxObservedRows) return prev;
      return { ...prev, observedValues: [...prev.observedValues, ''] };
    });
  };

  const removeObservedValue = (index) => {
    setFormData(prev => {
      const filtered = prev.observedValues.filter((_, i) => i !== index);
      return { ...prev, observedValues: filtered.length > 0 ? filtered : [''] };
    });
  };

  const handleObservedValueChange = (index, value) => {
    setValidation('observedValues', null);
    setFormData(prev => ({
      ...prev,
      observedValues: prev.observedValues.map((v, i) => (i === index ? value : v))
    }));
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
    const { ok, message, firstErrorField, fieldStates } = runValidation({
      validationRanges,
      fieldMapping,
      formData,
      inputRefs
    });

    Object.entries(fieldStates).forEach(([key, state]) => validationSetters[key]?.(state));

    if (!ok) {
      setSubmitErrorMessage(message);
      toast.error(message);

      // The observed-value inputs are keyed by row index, not by the field name.
      if (firstErrorField === 'observedValues') {
        inputRefs.current['observedValue_0']?.focus();
      } else {
        inputRefs.current[firstErrorField]?.focus();
      }
      return;
    }

    setSubmitErrorMessage('');

    try {
      setSubmitLoading(true);

      const payload = { ...formData };

      // Backend stores observedValue as a single comma-separated string (e.g. "12.5, 34.6").
      payload.observedValue = formData.observedValues
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
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        const message = buildSubmitError(data, fieldMapping);
        setSubmitErrorMessage(message);
        toast.error(message);
        return;
      }

      if (data.success) {
        toast.success('Entry saved successfully.');

        resetFormData();
        // Re-default the date to today after the reset (still changeable) —
        // initialFormData.date was computed once at app load, not "now".
        setFormData(prev => ({ ...prev, date: getCurrentDate() }));

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

      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="Impact Test - Validation Ranges & Guidelines"
        validationRanges={validationRanges}
      />

      <form className="impact-form-grid" ref={gridRef} onKeyDown={handleArrowKeyDown}>

        <div className="impact-form-group">
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

        <div className="impact-form-group">
          <label>Part Name{mark('partName')}</label>
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

        <div className="impact-form-group">
          <label>Date Code{mark('dateCode')}</label>
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

        <div className="impact-form-group">
          <label>Specification{mark('specification')}</label>
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

        <div className="impact-form-group" style={{ gridColumn: 'span 2' }}>
          <label>Observed Values{mark('observedValues')}</label>
          <div style={{
            display: 'flex',
            flexFlow: 'row wrap',
            gap: '1rem',
            alignItems: 'center',
            width: '100%'
          }}>
            {formData.observedValues.map((value, index) => (
              <div
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <input
                  ref={(el) => inputRefs.current[`observedValue_${index}`] = el}
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => handleObservedValueChange(index, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Value ${index + 1}`}
                  autoComplete="off"
                  style={{
                    width: '100px',
                    padding: '0.5rem 0.75rem',
                    border: (validationStates.observedValues === false && isObservedValueInvalid(value))
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
                  {formData.observedValues.length > 1 && (
                    <MinusButton
                      onClick={() => removeObservedValue(index)}
                      title={`Remove value ${index + 1}`}
                    />
                  )}
                  {index === formData.observedValues.length - 1 && (
                    <PlusButton
                      onClick={addObservedValue}
                      disabled={formData.observedValues.length >= maxObservedRows}
                      title="Add another value"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="impact-form-group" style={{ gridColumn: '1 / -1' }}>
          <label>Remarks{mark('remarks')}</label>
          <input
            ref={(el) => inputRefs.current.remarks = el}
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter any additional notes or observations..."
            maxLength={200}
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
    </>
  );
};

export default Impact;
