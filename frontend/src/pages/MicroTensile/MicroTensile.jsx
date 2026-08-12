import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SubmitButton, DisaDropdown, LockPrimaryButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { InlineLoader } from '../../Components/InlineLoader';
import { useToast } from '../../Components/alert';
import { useInfoModal, InfoIcon, InfoCard } from '../../Components/Info';
import { API_ENDPOINTS } from '../../config/api';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { usePrimaryLock, PRIMARY_STATUS } from '../../utils/primaryLock';
import { runValidation, getRequiredFields, RequiredMark, FORMATS, buildNumericGuardMap } from '../../utils/formValidation';
import { buildSubmitError, FALLBACK_SUBMIT_ERROR } from '../../utils/formValidation';
import { validationRanges, fieldMapping } from '../../deviations/DmicroTensile';
import '../../styles/PageStyles/MicroTensile/MicroTensile.css';

// Every entry field except the primary pair (Date/DISA), reset to blank.
const EMPTY_ENTRY = Object.fromEntries(
  validationRanges
    .filter(r => r.field !== 'Date' && r.field !== 'DISA')
    .map(r => [fieldMapping[r.field], ''])
);

// Matches validationRanges' declared order, so Enter-key navigation always
// follows the same field sequence as Dmicrotensile.js and the JSX below.
const fieldOrder = Object.values(fieldMapping);

// Every Number-typed field gets rounded to 1 decimal on blur; Heat Code is
// Integer-typed so it's naturally excluded.
const DECIMAL_FIELDS = validationRanges
  .filter(r => r.type === 'Number')
  .map(r => fieldMapping[r.field]);

const requiredFields = getRequiredFields(validationRanges, fieldMapping);
const numericGuards = buildNumericGuardMap(validationRanges, fieldMapping);

// "343/34/56" — exactly three numeric segments; live-typing UX only, never blocks submit.
const isItemSecondValid = (value) => FORMATS.itemSecond.re.test(value.trim());

const MicroTensile = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  // Draft form state + primary-lock flags persist across Form <-> Report navigation.
  const {
    formData,
    setFormData,
    isPrimarySaved,
    setIsPrimarySaved,
    entryCount,
    setEntryCount
  } = useDepartmentForm('micro-tensile');

  const [errors, setErrors] = useState({});
  const [fieldStates, setFieldStates] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { status, highlightPrimaryFields, savePrimary } = usePrimaryLock({
    endpoint: API_ENDPOINTS.microTensile,
    date: formData.date,
    disa: formData.disa,
    isPrimarySaved,
    setIsPrimarySaved,
    setEntryCount,
    primarySectionRef,
    formGroupClass: 'microtensile-form-group',
    onSaved: () => {
      toast.success('Primary saved');
      setTimeout(() => inputRefs.current.item?.focus(), 100);
    }
  });

  const primaryBusy = status === 'checking' || status === 'saving' || status === 'found' || status === 'added';

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, date: `${y}-${m}-${d}` }));
  }, []);

  const resetEntryFields = () => {
    setErrors({});
    setFieldStates({});
    setSubmitError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Changing the primary pair re-locks the form and clears the draft entry.
    if (name === 'date' || name === 'disa') {
      setIsPrimarySaved(false);
      setFormData(prev => ({
        ...EMPTY_ENTRY,
        date: name === 'date' ? value : prev.date,
        disa: name === 'disa' ? value : prev.disa
      }));
      resetEntryFields();
      return;
    }

    let next = value;
    if (name === 'dateCode') next = value.toUpperCase();

    if (name === 'itemSecond') {
      // Cap at two slashes so the value can never exceed three segments.
      if ((value.match(/\//g) || []).length > 2) return;
      setFormData(prev => ({ ...prev, itemSecond: value }));
      setFieldStates(prev => ({
        ...prev,
        itemSecond: value.trim() === '' || isItemSecondValid(value) ? null : false
      }));
      setErrors(prev => ({ ...prev, itemSecond: false }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: next }));
    setFieldStates(prev => ({ ...prev, [name]: null }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const formatDecimalValue = (fieldName) => {
    const value = formData[fieldName];
    if (value && !isNaN(value) && String(value).trim() !== '') {
      const num = parseFloat(value);
      if (!isNaN(num)) setFormData(prev => ({ ...prev, [fieldName]: num.toFixed(1) }));
    }
  };

  const focusNext = (field) => {
    const idx = fieldOrder.indexOf(field);
    if (idx < fieldOrder.length - 1) {
      inputRefs.current[fieldOrder[idx + 1]]?.focus();
    } else {
      handleSubmit();
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    // Enter inside Item (Optional) types the next '/' separator until complete.
    if (field === 'itemSecond') {
      const current = formData.itemSecond;
      if (!current || current.trim() === '') return focusNext(field);

      const slashCount = (current.match(/\//g) || []).length;
      if (slashCount < 2 && !current.endsWith('/')) {
        setFormData(prev => ({ ...prev, itemSecond: current + '/' }));
        return;
      }
      if (isItemSecondValid(current)) return focusNext(field);
      return;
    }

    if (DECIMAL_FIELDS.includes(field)) formatDecimalValue(field);

    if (requiredFields.has(field) && !formData[field]) {
      setErrors(prev => ({ ...prev, [field]: true }));
      return;
    }

    focusNext(field);
  };

  const handleSubmit = async () => {
    setSubmitError('');

    // Date + DISA are owned by the primary-lock flow, not the entry validation.
    const { ok, message, firstErrorField, fieldStates: states } = runValidation({
      validationRanges,
      fieldMapping,
      formData,
      inputRefs,
      skip: ['Date', 'DISA']
    });

    setFieldStates(states);

    if (!ok) {
      setSubmitError(message);
      toast.error(message);
      inputRefs.current[firstErrorField]?.focus();
      return;
    }

    try {
      setSubmitLoading(true);

      const item = { it1: formData.item };
      if (formData.itemSecond?.trim()) {
        const cleaned = formData.itemSecond.trim();
        item.it2 = cleaned.startsWith('(') && cleaned.endsWith(')') ? cleaned : `(${cleaned})`;
      }

      const payload = { ...formData, item };
      delete payload.itemSecond;

      const resp = await fetch(API_ENDPOINTS.microTensile, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.success) {
        const message = buildSubmitError(data, fieldMapping);
        setSubmitError(message);
        toast.error(message);
        return;
      }

      toast.success('Entry saved successfully.');
      setFormData(prev => ({ ...EMPTY_ENTRY, date: prev.date, disa: prev.disa }));
      resetEntryFields();
      setEntryCount(prev => prev + 1);
      setTimeout(() => inputRefs.current.item?.focus(), 100);
    } catch (error) {
      setSubmitError(FALLBACK_SUBMIT_ERROR);
      toast.error(FALLBACK_SUBMIT_ERROR);
    } finally {
      setSubmitLoading(false);
    }
  };

  const invalidClass = (field) => (fieldStates[field] === false ? 'invalid-input' : '');
  const groupClass = (field) => `microtensile-form-group ${errors[field] ? 'microtensile-error-outline' : ''}`;
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);

  const primaryHighlight = {
    border: highlightPrimaryFields ? '2px solid #ef4444' : undefined,
    backgroundColor: highlightPrimaryFields ? '#fee2e2' : undefined,
    transition: 'all 0.3s ease'
  };

  const statusInfo = PRIMARY_STATUS[status];

  return (
    <>
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

      <div ref={primarySectionRef}>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: 600, color: '#25424c' }}>
          Primary Data {isPrimarySaved && <span style={{ fontWeight: 400, fontSize: '0.875rem', color: '#5B9AA9' }}>(Entries: {entryCount})</span>}
        </h3>
      </div>

      <div className="microtensile-form-grid" ref={gridRef} onKeyDown={handleArrowKeyDown}>
        <div className="microtensile-form-group">
          <label>Date{mark('date')}</label>
          <CustomDatePicker
            ref={el => inputRefs.current.date = el}
            name="date"
            value={formData.date}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'date')}
            max={new Date().toISOString().split('T')[0]}
            style={primaryHighlight}
          />
        </div>

        <div className="microtensile-form-group">
          <label>DISA{mark('disa')}</label>
          <DisaDropdown
            ref={el => inputRefs.current.disa = el}
            name="disa"
            value={formData.disa}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'disa')}
            style={primaryHighlight}
          />
          {statusInfo && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
              <InlineLoader message={statusInfo.message} size="medium" variant={statusInfo.variant} />
            </div>
          )}
        </div>

        <div className="microtensile-form-group">
          <label>&nbsp;</label>
          <LockPrimaryButton
            onClick={savePrimary}
            disabled={primaryBusy || !formData.date || !formData.disa || isPrimarySaved}
            isLocked={isPrimarySaved}
          />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

        <div className={groupClass('item')}>
          <label>Item{mark('item')}</label>
          <input
            ref={el => inputRefs.current.item = el}
            type="text"
            name="item"
            value={formData.item}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'item')}
            placeholder="e.g: Volvo Bkt 234"
            disabled={!isPrimarySaved}
            className={invalidClass('item')}
          />
        </div>

        <div className={groupClass('itemSecond')}>
          <label>Item (Optional){mark('itemSecond')}</label>
          <input
            ref={el => inputRefs.current.itemSecond = el}
            type="text"
            name="itemSecond"
            value={formData.itemSecond}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'itemSecond')}
            placeholder="(Optional) e.g: 343/34/56"
            disabled={!isPrimarySaved}
            className={invalidClass('itemSecond')}
          />
        </div>

        <div className={groupClass('dateCode')}>
          <label>Date Code{mark('dateCode')}</label>
          <input
            ref={el => inputRefs.current.dateCode = el}
            type="text"
            name="dateCode"
            value={formData.dateCode}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'dateCode')}
            placeholder="e.g: 5E04"
            disabled={!isPrimarySaved}
            className={invalidClass('dateCode')}
          />
        </div>

        <div className={groupClass('heatCode')}>
          <label>Heat Code{mark('heatCode')}</label>
          <input
            ref={el => inputRefs.current.heatCode = el}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            name="heatCode"
            value={formData.heatCode}
            onChange={handleChange}
            onPaste={numericGuards.heatCode?.onPaste}
            onKeyDown={e => { numericGuards.heatCode?.onKeyDown(e); handleKeyDown(e, 'heatCode'); }}
            placeholder="e.g: 1"
            disabled={!isPrimarySaved}
            className={invalidClass('heatCode')}
          />
        </div>

        <div className={groupClass('barDia')}>
          <label>Bar Dia (mm){mark('barDia')}</label>
          <input
            ref={el => inputRefs.current.barDia = el}
            type="number"
            name="barDia"
            value={formData.barDia}
            onChange={handleChange}
            onPaste={numericGuards.barDia?.onPaste}
            onKeyDown={e => { numericGuards.barDia?.onKeyDown(e); handleKeyDown(e, 'barDia'); }}
            onBlur={() => formatDecimalValue('barDia')}
            step="0.01"
            placeholder="e.g: 6.0"
            disabled={!isPrimarySaved}
            className={invalidClass('barDia')}
          />
        </div>

        <div className={groupClass('gaugeLength')}>
          <label>Gauge Length (mm){mark('gaugeLength')}</label>
          <input
            ref={el => inputRefs.current.gaugeLength = el}
            type="number"
            name="gaugeLength"
            value={formData.gaugeLength}
            onChange={handleChange}
            onPaste={numericGuards.gaugeLength?.onPaste}
            onKeyDown={e => { numericGuards.gaugeLength?.onKeyDown(e); handleKeyDown(e, 'gaugeLength'); }}
            onBlur={() => formatDecimalValue('gaugeLength')}
            step="0.01"
            placeholder="e.g: 30.0"
            disabled={!isPrimarySaved}
            className={invalidClass('gaugeLength')}
          />
        </div>

        <div className={groupClass('maxLoad')}>
          <label>Max Load (Kgs) or KN{mark('maxLoad')}</label>
          <input
            ref={el => inputRefs.current.maxLoad = el}
            type="number"
            name="maxLoad"
            value={formData.maxLoad}
            onChange={handleChange}
            onPaste={numericGuards.maxLoad?.onPaste}
            onKeyDown={e => { numericGuards.maxLoad?.onKeyDown(e); handleKeyDown(e, 'maxLoad'); }}
            onBlur={() => formatDecimalValue('maxLoad')}
            step="0.01"
            placeholder="e.g: 1560"
            disabled={!isPrimarySaved}
            className={invalidClass('maxLoad')}
          />
        </div>

        <div className={groupClass('yieldLoad')}>
          <label>Yield Load (Kgs) or KN{mark('yieldLoad')}</label>
          <input
            ref={el => inputRefs.current.yieldLoad = el}
            type="number"
            name="yieldLoad"
            value={formData.yieldLoad}
            onChange={handleChange}
            onPaste={numericGuards.yieldLoad?.onPaste}
            onKeyDown={e => { numericGuards.yieldLoad?.onKeyDown(e); handleKeyDown(e, 'yieldLoad'); }}
            onBlur={() => formatDecimalValue('yieldLoad')}
            step="0.01"
            placeholder="e.g: 1290"
            disabled={!isPrimarySaved}
            className={invalidClass('yieldLoad')}
          />
        </div>

        <div className={groupClass('tensileStrength')}>
          <label>Tensile Strength (Kg/mm² or Mpa){mark('tensileStrength')}</label>
          <input
            ref={el => inputRefs.current.tensileStrength = el}
            type="number"
            name="tensileStrength"
            value={formData.tensileStrength}
            onChange={handleChange}
            onPaste={numericGuards.tensileStrength?.onPaste}
            onKeyDown={e => { numericGuards.tensileStrength?.onKeyDown(e); handleKeyDown(e, 'tensileStrength'); }}
            onBlur={() => formatDecimalValue('tensileStrength')}
            step="0.01"
            placeholder="e.g: 550"
            disabled={!isPrimarySaved}
            className={invalidClass('tensileStrength')}
          />
        </div>

        <div className={groupClass('yieldStrength')}>
          <label>Yield Strength (Kg/mm² or Mpa){mark('yieldStrength')}</label>
          <input
            ref={el => inputRefs.current.yieldStrength = el}
            type="number"
            name="yieldStrength"
            value={formData.yieldStrength}
            onChange={handleChange}
            onPaste={numericGuards.yieldStrength?.onPaste}
            onKeyDown={e => { numericGuards.yieldStrength?.onKeyDown(e); handleKeyDown(e, 'yieldStrength'); }}
            onBlur={() => formatDecimalValue('yieldStrength')}
            step="0.01"
            placeholder="e.g: 455"
            disabled={!isPrimarySaved}
            className={invalidClass('yieldStrength')}
          />
        </div>

        <div className={groupClass('elongation')}>
          <label>Elongation %{mark('elongation')}</label>
          <input
            ref={el => inputRefs.current.elongation = el}
            type="number"
            name="elongation"
            value={formData.elongation}
            onChange={handleChange}
            onPaste={numericGuards.elongation?.onPaste}
            onKeyDown={e => { numericGuards.elongation?.onKeyDown(e); handleKeyDown(e, 'elongation'); }}
            onBlur={() => formatDecimalValue('elongation')}
            step="0.01"
            placeholder="e.g: 18.5"
            disabled={!isPrimarySaved}
            className={invalidClass('elongation')}
          />
        </div>

        <div className="microtensile-form-group" style={{ gridColumn: 'span 2' }}>
          <label>Remarks{mark('remarks')}</label>
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
            className={invalidClass('remarks')}
          />
        </div>

        <div className="microtensile-form-group">
          <label>Tested By{mark('testedBy')}</label>
          <input
            ref={el => inputRefs.current.testedBy = el}
            type="text"
            name="testedBy"
            value={formData.testedBy}
            onChange={handleChange}
            onKeyDown={e => handleKeyDown(e, 'testedBy')}
            placeholder="e.g: John Smith"
            disabled={!isPrimarySaved}
            className={invalidClass('testedBy')}
          />
        </div>
      </div>

      <div className="microtensile-submit-container" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
        {submitError && <InlineLoader message={submitError} size="medium" variant="danger" />}
        <SubmitButton onClick={handleSubmit} disabled={!isPrimarySaved || submitLoading}>
          {submitLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : 'Submit Entry'}
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
