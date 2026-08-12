
import React, { useState, useRef } from 'react';
import { Save } from 'lucide-react';
import { SubmitButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { InlineLoader } from '../../Components/InlineLoader';
import { useToast } from '../../Components/alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { runValidation, getRequiredFields, RequiredMark, buildNumericGuardMap } from '../../utils/formValidation';
import { buildSubmitError, FALLBACK_SUBMIT_ERROR } from '../../utils/formValidation';
import { validationRanges, fieldMapping } from '../../deviations/Dtensile';
import '../../styles/PageStyles/Tensile/Tensile.css';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Matches validationRanges' declared order, so Enter-key navigation always
// follows the same field sequence as Dtensile.js and the JSX below.
const fieldOrder = Object.values(fieldMapping);

const Tensile = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  const requiredFields = getRequiredFields(validationRanges, fieldMapping);
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);
  const numericGuards = buildNumericGuardMap(validationRanges, fieldMapping);

  // Draft form/validation state persists across Form <-> Report navigation (shared context).
  const {
    formData,
    setFormData,
    validationStates,
    setValidation,
    resetFormData
  } = useDepartmentForm('tensile');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');

  const isDateSelected = formData.dateOfInspection && formData.dateOfInspection.trim() !== '';

  const inputRefs = useRef({});
  const submitButtonRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const getInputClassName = (validationState) => {
    if (validationState === false) return 'invalid-input';
    return '';
  };

  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d} / ${m} / ${y}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValidation(name, null);
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
    setSubmitErrorMessage('');

    const { ok, message, firstErrorField, fieldStates } = runValidation({
      validationRanges,
      fieldMapping,
      formData,
      inputRefs
    });

    Object.entries(fieldStates).forEach(([key, state]) => setValidation(key, state));

    if (!ok) {
      setSubmitErrorMessage(message);
      toast.error(message);
      inputRefs.current[firstErrorField]?.focus();
      return;
    }

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
          throw new Error(FALLBACK_SUBMIT_ERROR);
        }
      } else {
        data = { success: false };
      }

      if (!response.ok || !data?.success) {
        const message = buildSubmitError(data, fieldMapping);
        setSubmitErrorMessage(message);
        toast.error(message);
        return;
      }

      if (data.success) {
        toast.success('Entry saved successfully.');

        resetFormData();
        // Re-default the date to today after the reset (still changeable).
        setFormData(prev => ({ ...prev, dateOfInspection: getCurrentDate() }));

        setSubmitErrorMessage('');

        setTimeout(() => {
          inputRefs.current.dateOfInspection?.focus();
        }, 100);
      }
    } catch (error) {

      const message = error.message || 'Failed to save data. Please check your input and try again.';
      setSubmitErrorMessage(message);
      toast.error(message);

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
        <div className="tensile-form-group">
          <label>Date Of Inspection{mark('dateOfInspection')}</label>
          <CustomDatePicker
            ref={(el) => inputRefs.current.dateOfInspection = el}
            name="dateOfInspection"
            value={formData.dateOfInspection}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'dateOfInspection')}
            max={new Date().toISOString().split('T')[0]}
            style={{
              border: validationStates.dateOfInspection === false ? '2px solid #ef4444' : '2px solid #cbd5e1',
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              backgroundColor: '#fff'
            }}
          />
        </div>

        <div className="tensile-form-group">
          <label>Item{mark('item')}</label>
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
            className={getInputClassName(validationStates.item)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Date Code{mark('dateCode')}</label>
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
            className={getInputClassName(validationStates.dateCode)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Heat Code{mark('heatCode')}</label>
          <input
            ref={(el) => inputRefs.current.heatCode = el}
            type="number"
            name="heatCode"
            value={formData.heatCode}
            onChange={handleChange}
            onPaste={numericGuards.heatCode?.onPaste}
            onKeyDown={e => { numericGuards.heatCode?.onKeyDown(e); handleKeyDown(e, 'heatCode'); }}
            placeholder="Enter number only"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.heatCode)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Dia (mm){mark('dia')}</label>
          <input
            ref={(el) => inputRefs.current.dia = el}
            type="number"
            name="dia"
            value={formData.dia}
            onChange={handleChange}
            onPaste={numericGuards.dia?.onPaste}
            onKeyDown={e => { numericGuards.dia?.onKeyDown(e); handleKeyDown(e, 'dia'); }} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 10.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.dia)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Lo (mm){mark('lo')}</label>
          <input
            ref={(el) => inputRefs.current.lo = el}
            type="number"
            name="lo"
            value={formData.lo}
            onChange={handleChange}
            onPaste={numericGuards.lo?.onPaste}
            onKeyDown={e => { numericGuards.lo?.onKeyDown(e); handleKeyDown(e, 'lo'); }} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 50.0"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.lo)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Li (mm){mark('li')}</label>
          <input
            ref={(el) => inputRefs.current.li = el}
            type="number"
            name="li"
            value={formData.li}
            onChange={handleChange}
            onPaste={numericGuards.li?.onPaste}
            onKeyDown={e => { numericGuards.li?.onKeyDown(e); handleKeyDown(e, 'li'); }} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 52.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.li)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Breaking Load (kN){mark('breakingLoad')}</label>
          <input
            ref={(el) => inputRefs.current.breakingLoad = el}
            type="number"
            name="breakingLoad"
            value={formData.breakingLoad}
            onChange={handleChange}
            onPaste={numericGuards.breakingLoad?.onPaste}
            onKeyDown={e => { numericGuards.breakingLoad?.onKeyDown(e); handleKeyDown(e, 'breakingLoad'); }} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 45.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.breakingLoad)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Yield Load{mark('yieldLoad')}</label>
          <input
            ref={(el) => inputRefs.current.yieldLoad = el}
            type="number"
            name="yieldLoad"
            value={formData.yieldLoad}
            onChange={handleChange}
            onPaste={numericGuards.yieldLoad?.onPaste}
            onKeyDown={e => { numericGuards.yieldLoad?.onKeyDown(e); handleKeyDown(e, 'yieldLoad'); }} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 38.2"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.yieldLoad)}
          />
        </div>

        <div className="tensile-form-group">
          <label>UTS (N/mm²){mark('uts')}</label>
          <input
            ref={(el) => inputRefs.current.uts = el}
            type="number"
            name="uts"
            value={formData.uts}
            onChange={handleChange}
            onPaste={numericGuards.uts?.onPaste}
            onKeyDown={e => { numericGuards.uts?.onKeyDown(e); handleKeyDown(e, 'uts'); }} onBlur={handleNumericBlur} step="0.01"
            placeholder="e.g: 550"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.uts)}
          />
        </div>

        <div className="tensile-form-group">
          <label>YS (N/mm²){mark('ys')}</label>
          <input
            ref={(el) => inputRefs.current.ys = el}
            type="number"
            name="ys"
            value={formData.ys}
            onChange={handleChange}
            onPaste={numericGuards.ys?.onPaste}
            onKeyDown={e => { numericGuards.ys?.onKeyDown(e); handleKeyDown(e, 'ys'); }}
            onBlur={handleNumericBlur}
            step="0.01"
            placeholder="e.g: 460"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.ys)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Elongation (%){mark('elongation')}</label>
          <input
            ref={(el) => inputRefs.current.elongation = el}
            type="number"
            name="elongation"
            value={formData.elongation}
            onChange={handleChange}
            onPaste={numericGuards.elongation?.onPaste}
            onKeyDown={e => { numericGuards.elongation?.onKeyDown(e); handleKeyDown(e, 'elongation'); }}
            onBlur={handleNumericBlur}
            step="0.01"
            placeholder="e.g: 18.5"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.elongation)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Tested By{mark('testedBy')}</label>
          <input
            ref={(el) => inputRefs.current.testedBy = el}
            type="text"
            name="testedBy"
            value={formData.testedBy}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'testedBy')}
            placeholder="e.g: Kumaran"
            autoComplete="off"
            disabled={!isDateSelected}
            className={getInputClassName(validationStates.testedBy)}
          />
        </div>

        <div className="tensile-form-group">
          <label>Remarks{mark('remarks')}</label>
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
            className={getInputClassName(validationStates.remarks)}
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
