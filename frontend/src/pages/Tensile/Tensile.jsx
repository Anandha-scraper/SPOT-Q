
import React, { useState, useRef, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SubmitButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Sakthi from '../../Components/Sakthi';
import { InlineLoader } from '../../Components/Alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import '../../styles/PageStyles/Tensile/Tensile.css';

const Tensile = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();

  const validationRanges = [
    {
      field: 'Date Of Inspection',
      required: true,
      type: 'Date',
      pattern: 'YYYY-MM-DD'
    },
    {
      field: 'Item',
      required: true,
      type: 'Text',
      pattern: 'e.g., Cast Iron Bar'
    },
    {
      field: 'Date Code',
      required: true,
      type: 'Text',
      pattern: '5E04 (1 digit, 1 letter, 2 digits)'
    },
    {
      field: 'Heat Code',
      required: true,
      type: 'Number',
      pattern: 'e.g., 12345'
    },
    {
      field: 'Dia',
      type: 'Number',
      min: 0,
      unit: 'mm',
      pattern: 'e.g., 12.5'
    },
    {
      field: 'Lo',
      type: 'Number',
      min: 0,
      unit: 'mm',
      pattern: 'e.g., 50.0'
    },
    {
      field: 'Li',
      type: 'Number',
      min: 0,
      unit: 'mm',
      pattern: 'e.g., 58.0'
    },
    {
      field: 'Breaking Load',
      type: 'Number',
      min: 0,
      unit: 'kN',
      pattern: 'e.g., 48.5'
    },
    {
      field: 'Yield Load',
      type: 'Number',
      min: 0,
      unit: 'kN',
      pattern: 'e.g., 38.0'
    },
    {
      field: 'UTS',
      type: 'Number',
      min: 0,
      unit: 'N/mm²',
      pattern: 'e.g., 680.0'
    },
    {
      field: 'YS',
      type: 'Number',
      min: 0,
      unit: 'N/mm²',
      pattern: 'e.g., 460.0'
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
      field: 'Tested By',
      type: 'Text',
      pattern: 'e.g., John Doe'
    },
    {
      field: 'Remarks',
      type: 'Text'
    }
  ];

  const fieldMapping = {
    'Date Of Inspection': 'dateOfInspection',
    'Item': 'item',
    'Date Code': 'dateCode',
    'Heat Code': 'heatCode',
    'Dia': 'dia',
    'Lo': 'lo',
    'Li': 'li',
    'Breaking Load': 'breakingLoad',
    'Yield Load': 'yieldLoad',
    'UTS': 'uts',
    'YS': 'ys',
    'Elongation': 'elongation',
    'Tested By': 'testedBy',
    'Remarks': 'remarks'
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Draft form state persists across Form <-> Report navigation (shared context).
  const { formData, setFormData } = useDepartmentForm('tensile');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const isDateSelected = formData.dateOfInspection && formData.dateOfInspection.trim() !== '';

  const [dateValid, setDateValid] = useState(null);
  const [itemValid, setItemValid] = useState(null);
  const [dateCodeValid, setDateCodeValid] = useState(null);
  const [heatCodeValid, setHeatCodeValid] = useState(null);
  const [diaValid, setDiaValid] = useState(null);
  const [loValid, setLoValid] = useState(null);
  const [liValid, setLiValid] = useState(null);
  const [breakingLoadValid, setBreakingLoadValid] = useState(null);
  const [yieldLoadValid, setYieldLoadValid] = useState(null);
  const [utsValid, setUtsValid] = useState(null);
  const [ysValid, setYsValid] = useState(null);
  const [elongationValid, setElongationValid] = useState(null);
  const [testedByValid, setTestedByValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);

  const validationSetters = {
    'dateOfInspection': setDateValid,
    'item': setItemValid,
    'dateCode': setDateCodeValid,
    'heatCode': setHeatCodeValid,
    'dia': setDiaValid,
    'lo': setLoValid,
    'li': setLiValid,
    'breakingLoad': setBreakingLoadValid,
    'yieldLoad': setYieldLoadValid,
    'uts': setUtsValid,
    'ys': setYsValid,
    'elongation': setElongationValid,
    'testedBy': setTestedByValid,
    'remarks': setRemarksValid
  };

  const inputRefs = useRef({});
  const submitButtonRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const fieldOrder = ['dateOfInspection', 'item', 'dateCode', 'heatCode', 'dia', 'lo', 'li',
    'breakingLoad', 'yieldLoad', 'uts', 'ys', 'elongation', 'testedBy', 'remarks'];

  const getInputClassName = (fieldName, validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  const validateField = (rule, mappedFields, formData) => {
    if (Array.isArray(mappedFields)) {
      const [minField, maxField] = mappedFields;
      const minValue = formData[minField];
      const maxValue = formData[maxField];

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

  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d} / ${m} / ${y}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const setter = validationSetters[name];
    if (setter) {
      setter(null);
    }

    setSubmitErrorMessage('');

    const finalValue = name === 'dateCode' ? value.toUpperCase() : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = fieldOrder.indexOf(fieldName);

      if (fieldName === 'remarks') {
        submitButtonRef.current?.focus();
      } else if (idx < fieldOrder.length - 1) {
        inputRefs.current[fieldOrder[idx + 1]]?.focus();
      }
    }
  };

  const handleNumericBlur = (e) => {
    const { name, value } = e.target;
    if (value && !isNaN(value)) {
      const numericValue = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue.toFixed(1)
      }));
    }
  };

  const handleSubmitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    let hasErrors = false;
    let firstErrorField = null;

    setSubmitErrorMessage('');

    for (const rule of validationRanges) {
      const mappedFields = fieldMapping[rule.field];

      if (!mappedFields) continue;

      const result = validateField(rule, mappedFields, formData);

      const setter = validationSetters[mappedFields];

      if (setter) {
        if (!result.isValid) {
          setter(false);
          hasErrors = true;
          if (!firstErrorField) firstErrorField = mappedFields;
        } else {
          setter(null);
        }
      }
    }

    if (hasErrors) {
      setSubmitErrorMessage('Fill required Field in Correct format');

      if (firstErrorField) {
        inputRefs.current[firstErrorField]?.focus();
      }

      return;
    }

    setSubmitErrorMessage('');

    try {
      setSubmitLoading(true);

      const payload = {
        date: formData.dateOfInspection,
        item: formData.item,
        dateCode: formData.dateCode,
        heatCode: formData.heatCode,
        dia: formData.dia ? parseFloat(formData.dia) : '',
        lo: formData.lo ? parseFloat(formData.lo) : '',
        li: formData.li ? parseFloat(formData.li) : '',
        breakingLoad: formData.breakingLoad ? parseFloat(formData.breakingLoad) : '',
        yieldLoad: formData.yieldLoad ? parseFloat(formData.yieldLoad) : '',
        uts: formData.uts ? parseFloat(formData.uts) : '',
        ys: formData.ys ? parseFloat(formData.ys) : '',
        elongation: formData.elongation ? parseFloat(formData.elongation) : '',
        remarks: formData.remarks,
        testedBy: formData.testedBy
      };

      for (const rule of validationRanges) {
        const mappedField = fieldMapping[rule.field];
        if (!mappedField || Array.isArray(mappedField)) continue;

        const isRequired = rule.required === true;
        const isEmpty = payload[mappedField] === undefined ||
          payload[mappedField] === null ||
          payload[mappedField].toString().trim() === '';

        if (!isRequired && isEmpty) {
          // Numeric fields can't hold a placeholder string ("-" fails Mongoose's
          // Number cast). Omit them so the field is simply left empty.
          if (rule.type === 'Number' || rule.type === 'Integer') {
            delete payload[mappedField];
          } else {
            payload[mappedField] = '-';
          }
        }
      }

      const response = await fetch(API_ENDPOINTS.tensile, {
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

      if (!response.ok) {

        if (response.status === 400) {
          const errorMessage = data?.message || `Bad Request (${response.status}): Please check your input data format`;
          throw new Error(errorMessage);
        } else {
          throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
        }
      }

      if (data.success) {
        setShowSuccessPopup(true);

        setFormData({
          dateOfInspection: getCurrentDate(),
          item: '',
          dateCode: '',
          heatCode: '',
          dia: '',
          lo: '',
          li: '',
          breakingLoad: '',
          yieldLoad: '',
          uts: '',
          ys: '',
          elongation: '',
          remarks: '',
          testedBy: ''
        });

        Object.values(validationSetters).forEach(setter => setter(null));
        setSubmitErrorMessage('');

        setTimeout(() => {
          inputRefs.current.dateOfInspection?.focus();
        }, 100);
      }
    } catch (error) {

      setSubmitErrorMessage(error.message || 'Failed to save data. Please check your input and try again.');

      if (inputRefs.current.dateOfInspection) {
        inputRefs.current.dateOfInspection.focus();
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="tensile-header">
        <div className="tensile-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Tensile Test - Entry Form
            <InfoIcon onClick={openModal} />
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.dateOfInspection ? formatDisplayDate(formData.dateOfInspection) : '-'}
        </div>
      </div>

      <form className="tensile-form-grid" ref={gridRef} onKeyDown={handleArrowKeyDown}>
        { }
        <div className="tensile-form-group">
          <label>Date Of Inspection</label>
          <CustomDatePicker
            ref={(el) => inputRefs.current.dateOfInspection = el}
            name="dateOfInspection"
            value={formData.dateOfInspection}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'dateOfInspection')}
            max={new Date().toISOString().split('T')[0]}
            style={{
              border: dateValid === false ? '2px solid #ef4444' : '2px solid #cbd5e1',
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              backgroundColor: '#fff'
            }}
          />
        </div>

        <div className="tensile-form-group">
          <label>Item</label>
          <input
            ref={(el) => inputRefs.current.item = el}
            type="text"
            name="item"
            value={formData.item}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'item')}
            placeholder="e.g: Steel Rod"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('item', itemValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Date Code</label>
          <input
            ref={(el) => inputRefs.current.dateCode = el}
            type="text"
            name="dateCode"
            value={formData.dateCode}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'dateCode')}
            placeholder="e.g: 6F25"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('dateCode', dateCodeValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Heat Code</label>
          <input
            ref={(el) => inputRefs.current.heatCode = el}
            type="number"
            name="heatCode"
            value={formData.heatCode}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'heatCode')}
            placeholder="Enter number only"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('heatCode', heatCodeValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Dia (mm)</label>
          <input
            ref={(el) => inputRefs.current.dia = el}
            type="number"
            name="dia"
            value={formData.dia}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'dia')} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 10.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('dia', diaValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Lo (mm)</label>
          <input
            ref={(el) => inputRefs.current.lo = el}
            type="number"
            name="lo"
            value={formData.lo}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'lo')} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 50.0"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('lo', loValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Li (mm)</label>
          <input
            ref={(el) => inputRefs.current.li = el}
            type="number"
            name="li"
            value={formData.li}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'li')} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 52.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('li', liValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Breaking Load (kN)</label>
          <input
            ref={(el) => inputRefs.current.breakingLoad = el}
            type="number"
            name="breakingLoad"
            value={formData.breakingLoad}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'breakingLoad')} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 45.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('breakingLoad', breakingLoadValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Yield Load</label>
          <input
            ref={(el) => inputRefs.current.yieldLoad = el}
            type="number"
            name="yieldLoad"
            value={formData.yieldLoad}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'yieldLoad')} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 38.2"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('yieldLoad', yieldLoadValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>UTS (N/mm²)</label>
          <input
            ref={(el) => inputRefs.current.uts = el}
            type="number"
            name="uts"
            value={formData.uts}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'uts')} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 550"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('uts', utsValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>YS (N/mm²)</label>
          <input
            ref={(el) => inputRefs.current.ys = el}
            type="number"
            name="ys"
            value={formData.ys}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'ys')}
            onBlur={handleNumericBlur}
            step="0.01"
            placeholder="e.g: 460"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('ys', ysValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Elongation (%)</label>
          <input
            ref={(el) => inputRefs.current.elongation = el}
            type="number"
            name="elongation"
            value={formData.elongation}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'elongation')}
            onBlur={handleNumericBlur}
            step="0.01"
            placeholder="e.g: 18.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('elongation', elongationValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Tested By</label>
          <input
            ref={(el) => inputRefs.current.testedBy = el}
            type="text"
            name="testedBy"
            value={formData.testedBy}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'testedBy')}
            placeholder="e.g: John Doe"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('testedBy', testedByValid)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Remarks</label>
          <input
            ref={(el) => inputRefs.current.remarks = el}
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'remarks')}
            placeholder="Enter any additional notes..."
            maxLength={200}
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName('remarks', remarksValid)}
          />
        </div>
      </form>

      <div className="tensile-submit-container">
        {submitErrorMessage && (
          <div style={{ flex: 1, marginRight: '0.5rem' }}>
            <InlineLoader
              message={submitErrorMessage}
              variant="danger"
              size="medium"
            />
          </div>
        )}
        <div className="tensile-submit-right">
          <SubmitButton
            ref={submitButtonRef}
            onClick={handleSubmit}
            disabled={submitLoading}
            onKeyDown={handleSubmitKeyDown}
          >
            {submitLoading ? 'Saving...' : 'Submit Entry'}
          </SubmitButton>
        </div>
      </div>

      { }
      {showSuccessPopup && (
        <div className="sakthi-overlay">
          <Sakthi onComplete={() => setShowSuccessPopup(false)} />
        </div>
      )}

      <InfoCard
        isOpen={isOpen}
        onClose={closeModal}
        title="Tensile Test Validation"
        validationRanges={validationRanges}
      />
    </>
  );
};

export default Tensile;