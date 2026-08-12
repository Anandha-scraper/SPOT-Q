import { useState, useRef, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { DisaDropdown, SubmitButton, LockPrimaryButton } from '../../Components/Buttons';
import { InlineLoader } from '../../Components/InlineLoader';
import { useToast } from '../../Components/alert';
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
import { useDepartmentForm } from '../../context/DepartmentContext';
import { useArrowNavigation } from '../../utils/arrowNavigation';
import { usePrimaryLock, PRIMARY_STATUS } from '../../utils/primaryLock';
import { runValidation, getRequiredFields, RequiredMark, buildNumericGuardMap } from '../../utils/formValidation';
import { buildSubmitError, FALLBACK_SUBMIT_ERROR } from '../../utils/formValidation';
import { API_ENDPOINTS } from '../../config/api';
import { validationRanges, fieldMapping } from '../../deviations/DmicroStructure';
import '../../styles/PageStyles/MicroStructure/MicroStructure.css';

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Every entry field except the primary pair (Date/DISA), reset to blank.
const EMPTY_ENTRY_FIELDS = Object.fromEntries(
  validationRanges
    .filter(r => r.field !== 'Date' && r.field !== 'DISA')
    .flatMap(r => (Array.isArray(r.key) ? r.key : [r.key]))
    .map(key => [key, ''])
);

// Matches validationRanges' declared order, so Enter-key navigation always
// follows the same field sequence as DmicroStructure.js and the JSX below.
const fieldOrder = validationRanges.flatMap(r => (Array.isArray(r.key) ? r.key : [r.key]));

const MicroStructure = () => {
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  // Draft form/validation state + primary-lock flags persist across Form <-> Report navigation.
  const {
    formData,
    setFormData,
    validationStates,
    setValidation,
    resetValidation,
    submitErrorMessage,
    setSubmitErrorMessage,
    isPrimarySaved,
    setIsPrimarySaved,
    entryCount,
    setEntryCount
  } = useDepartmentForm('micro-structure');

  const [submitLoading, setSubmitLoading] = useState(false);

  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  const requiredFields = getRequiredFields(validationRanges, fieldMapping);
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);
  const numericGuards = buildNumericGuardMap(validationRanges, fieldMapping);

  // Date + DISA must be saved before the entry fields unlock.
  const { status, highlightPrimaryFields, savePrimary } = usePrimaryLock({
    endpoint: API_ENDPOINTS.microStructure,
    date: formData.date,
    disa: formData.disa,
    isPrimarySaved,
    setIsPrimarySaved,
    setEntryCount,
    primarySectionRef,
    formGroupClass: 'microstructure-field',
    onSaved: () => {
      toast.success('Primary saved');
      setTimeout(() => inputRefs.current.partName?.focus(), 100);
    }
  });

  const primaryBusy = status === 'checking' || status === 'saving' || status === 'found' || status === 'added';
  const statusInfo = PRIMARY_STATUS[status];

  // Set current date and load previous DISA from database on mount (only if not already set)
  useEffect(() => {
    if (!formData.date) {
      setFormData(prev => ({ ...prev, date: getCurrentDate() }));
    }

    if (!formData.disa) {
      const fetchLastDisa = async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.microStructure}/last-disa`, {
            method: 'GET',
            credentials: 'include'
          });
          const data = await response.json();
          if (data.success && data.lastDisa) {
            setFormData(prev => ({ ...prev, disa: data.lastDisa }));
          }
        } catch (error) {
          console.error('Error fetching last DISA:', error);
        }
      };
      fetchLastDisa();
    }
  }, []);

  const getInputClassName = (baseClass, validationState) => {
    let classes = baseClass;
    if (validationState === false) classes += ' invalid-input';
    return classes;
  };

  const handleDateChange = (e) => {
    setIsPrimarySaved(false);

    setFormData(prev => ({
      ...prev,
      ...EMPTY_ENTRY_FIELDS,
      date: e.target.value
    }));

    resetValidation();
    setSubmitErrorMessage('');
  };

  const handleDisaChange = (e) => {
    setIsPrimarySaved(false);

    setFormData(prev => ({
      ...prev,
      ...EMPTY_ENTRY_FIELDS,
      disa: e.target.value
    }));

    resetValidation();
    setSubmitErrorMessage('');
  };

  const handleInputChange = (fieldKey) => (e) => {
    setFormData(prev => ({ ...prev, [fieldKey]: e.target.value }));
    setValidation(fieldKey, null);
  };

  const handleDateCodeChange = (e) => {
    setFormData(prev => ({ ...prev, dateCode: e.target.value.toUpperCase() }));
    setValidation('dateCode', null);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = fieldOrder.indexOf(field);

      if (field === 'remarks') {
        inputRefs.current.submitBtn?.focus();
      } else if (idx < fieldOrder.length - 1) {
        const nextField = fieldOrder[idx + 1];
        inputRefs.current[nextField]?.focus();
      }
    }
  };

  // Verify the whole form from validationRanges via the shared validator. It
  // surfaces one message, required-wins, and returns the per-field validity map
  // that feeds the context's setValidation.
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
        date: formData.date,
        disa: formData.disa,
        partName: formData.partName,
        dateCode: formData.dateCode,
        heatCode: formData.heatCode,
        nodularity: parseFloat(formData.nodularity),
        graphiteType: formData.graphiteType,
        countMin: parseFloat(formData.countMin),
        countMax: formData.countMax === '' ? 0 : parseFloat(formData.countMax),
        sizeMin: parseFloat(formData.sizeMin),
        sizeMax: formData.sizeMax === '' ? 0 : parseFloat(formData.sizeMax),
        ferriteMin: parseFloat(formData.ferriteMin),
        ferriteMax: formData.ferriteMax === '' ? 0 : parseFloat(formData.ferriteMax),
        pearliteMin: parseFloat(formData.pearliteMin),
        pearliteMax: formData.pearliteMax === '' ? 0 : parseFloat(formData.pearliteMax),
        carbideMin: parseFloat(formData.carbideMin),
        carbideMax: formData.carbideMax === '' ? 0 : parseFloat(formData.carbideMax),
        remarks: formData.remarks
      };

      const response = await fetch(`${API_ENDPOINTS.microStructure}`, {
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

      if (data.success) {
        toast.success('Entry saved successfully.');

        setFormData(prev => ({ ...prev, ...EMPTY_ENTRY_FIELDS }));
        resetValidation();

        setSubmitErrorMessage('');
        setEntryCount(prev => prev + 1);

        setTimeout(() => {
          inputRefs.current.partName?.focus();
        }, 100);
      } else {
        const message = buildSubmitError(data, fieldMapping);
        setSubmitErrorMessage(message);
        toast.error(message);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setSubmitErrorMessage(FALLBACK_SUBMIT_ERROR);
      toast.error(FALLBACK_SUBMIT_ERROR);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <>
      <div className="microstructure-header">
        <div className="microstructure-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Micro Structure - Entry Form
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
        title="Micro Structure - Validation Ranges & Data Entry Flow"
        validationRanges={validationRanges}
      />

      <div ref={gridRef} onKeyDown={handleArrowKeyDown}>
      <div ref={primarySectionRef}>
        <h3 className="microstructure-section-heading">
          Primary Data {isPrimarySaved && <span style={{ fontWeight: 400, fontSize: '0.875rem', color: '#5B9AA9' }}>(Entries: {entryCount})</span>}
        </h3>

        <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
          <div className="microstructure-field" style={{ maxWidth: '10%', position: 'relative', zIndex: 100 }}>
            <label>Ins. Date{mark('date')}</label>
            <CustomDatePicker
              ref={el => inputRefs.current.date = el}
              value={formData.date}
              onChange={handleDateChange}
              onKeyDown={e => handleKeyDown(e, 'date')}
              max={getCurrentDate()}
              name="date"
              style={{
                border: (highlightPrimaryFields || validationStates.date === false) ? '2px solid #ef4444' : '2px solid #cbd5e1',
                width: '100%',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: (highlightPrimaryFields || validationStates.date === false) ? '#fee2e2' : '#fff',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          <div className="microstructure-field" style={{ maxWidth: '5%' }}>
            <label>DISA{mark('disa')}</label>
            <DisaDropdown
              ref={el => inputRefs.current.disa = el}
              value={formData.disa}
              onChange={handleDisaChange}
              onKeyDown={e => handleKeyDown(e, 'disa')}
              name="disa"
              style={{
                border: (highlightPrimaryFields || validationStates.disa === false) ? '2px solid #ef4444' : undefined,
                backgroundColor: (highlightPrimaryFields || validationStates.disa === false) ? '#fee2e2' : undefined,
                transition: 'all 0.3s ease'
              }}
            />
            {statusInfo && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
                <InlineLoader message={statusInfo.message} size="medium" variant={statusInfo.variant} />
              </div>
            )}
          </div>
          <div className="microstructure-field" style={{ maxWidth: '15%' }}>
            <label>&nbsp;</label>
            <LockPrimaryButton
              onClick={savePrimary}
              disabled={primaryBusy || !formData.date || !formData.disa || isPrimarySaved}
              isLocked={isPrimarySaved}
            />
          </div>
        </div>
      </div>

      {/* Row 1 — identity + nodularity + graphite type */}
      <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
        <div className="microstructure-field">
          <label>Part Name{mark('partName')}</label>
          <input
            ref={el => inputRefs.current.partName = el}
            type="text"
            value={formData.partName}
            onChange={handleInputChange('partName')}
            onKeyDown={e => handleKeyDown(e, 'partName')}
            name="partName"
            placeholder="Enter part name"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', validationStates.partName)}
          />
        </div>
        <div className="microstructure-field">
          <label>Date Code{mark('dateCode')}</label>
          <input
            ref={el => inputRefs.current.dateCode = el}
            type="text"
            value={formData.dateCode}
            onChange={handleDateCodeChange}
            onKeyDown={e => handleKeyDown(e, 'dateCode')}
            name="dateCode"
            placeholder="Enter date code"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', validationStates.dateCode)}
          />
        </div>
        <div className="microstructure-field">
          <label>Heat Code{mark('heatCode')}</label>
          <input
            ref={el => inputRefs.current.heatCode = el}
            type="text"
            value={formData.heatCode}
            onChange={handleInputChange('heatCode')}
            onPaste={numericGuards.heatCode?.onPaste}
            onKeyDown={e => { numericGuards.heatCode?.onKeyDown(e); handleKeyDown(e, 'heatCode'); }}
            name="heatCode"
            placeholder="Enter heat code"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', validationStates.heatCode)}
          />
        </div>
        <div className="microstructure-field">
          <label>Nodularity %{mark('nodularity')}</label>
          <input
            ref={el => inputRefs.current.nodularity = el}
            type="number"
            value={formData.nodularity}
            onChange={handleInputChange('nodularity')}
            onPaste={numericGuards.nodularity?.onPaste}
            onKeyDown={e => { numericGuards.nodularity?.onKeyDown(e); handleKeyDown(e, 'nodularity'); }}
            name="nodularity"
            placeholder="0-100"
            min="0"
            step="0.01"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', validationStates.nodularity)}
          />
        </div>
        <div className="microstructure-field">
          <label>Graphite Type{mark('graphiteType')}</label>
          <input
            ref={el => inputRefs.current.graphiteType = el}
            type="text"
            value={formData.graphiteType}
            onChange={handleInputChange('graphiteType')}
            onKeyDown={e => handleKeyDown(e, 'graphiteType')}
            name="graphiteType"
            placeholder="Enter graphite type"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', validationStates.graphiteType)}
          />
        </div>
      </div>

      {/* Row 2 — count, size, ferrite, pearlite, carbide ranges */}
      <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
        <div className="microstructure-field">
          <label>Count (Nos / mm²){mark('countMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.countMin = el}
              type="number"
              value={formData.countMin}
              onChange={handleInputChange('countMin')}
              onPaste={numericGuards.countMin?.onPaste}
              onKeyDown={e => { numericGuards.countMin?.onKeyDown(e); handleKeyDown(e, 'countMin'); }}
              name="countMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.countMin)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.countMax = el}
              type="number"
              value={formData.countMax}
              onChange={handleInputChange('countMax')}
              onPaste={numericGuards.countMax?.onPaste}
              onKeyDown={e => { numericGuards.countMax?.onKeyDown(e); handleKeyDown(e, 'countMax'); }}
              name="countMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.countMax)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Size{mark('sizeMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.sizeMin = el}
              type="number"
              value={formData.sizeMin}
              onChange={handleInputChange('sizeMin')}
              onPaste={numericGuards.sizeMin?.onPaste}
              onKeyDown={e => { numericGuards.sizeMin?.onKeyDown(e); handleKeyDown(e, 'sizeMin'); }}
              name="sizeMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.sizeMin)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.sizeMax = el}
              type="number"
              value={formData.sizeMax}
              onChange={handleInputChange('sizeMax')}
              onPaste={numericGuards.sizeMax?.onPaste}
              onKeyDown={e => { numericGuards.sizeMax?.onKeyDown(e); handleKeyDown(e, 'sizeMax'); }}
              name="sizeMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.sizeMax)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Ferrite %{mark('ferriteMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.ferriteMin = el}
              type="number"
              value={formData.ferriteMin}
              onChange={handleInputChange('ferriteMin')}
              onPaste={numericGuards.ferriteMin?.onPaste}
              onKeyDown={e => { numericGuards.ferriteMin?.onKeyDown(e); handleKeyDown(e, 'ferriteMin'); }}
              name="ferriteMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.ferriteMin)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.ferriteMax = el}
              type="number"
              value={formData.ferriteMax}
              onChange={handleInputChange('ferriteMax')}
              onPaste={numericGuards.ferriteMax?.onPaste}
              onKeyDown={e => { numericGuards.ferriteMax?.onKeyDown(e); handleKeyDown(e, 'ferriteMax'); }}
              name="ferriteMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.ferriteMax)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Pearlite %{mark('pearliteMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.pearliteMin = el}
              type="number"
              value={formData.pearliteMin}
              onChange={handleInputChange('pearliteMin')}
              onPaste={numericGuards.pearliteMin?.onPaste}
              onKeyDown={e => { numericGuards.pearliteMin?.onKeyDown(e); handleKeyDown(e, 'pearliteMin'); }}
              name="pearliteMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.pearliteMin)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.pearliteMax = el}
              type="number"
              value={formData.pearliteMax}
              onChange={handleInputChange('pearliteMax')}
              onPaste={numericGuards.pearliteMax?.onPaste}
              onKeyDown={e => { numericGuards.pearliteMax?.onKeyDown(e); handleKeyDown(e, 'pearliteMax'); }}
              name="pearliteMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.pearliteMax)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Carbide %{mark('carbideMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.carbideMin = el}
              type="number"
              value={formData.carbideMin}
              onChange={handleInputChange('carbideMin')}
              onPaste={numericGuards.carbideMin?.onPaste}
              onKeyDown={e => { numericGuards.carbideMin?.onKeyDown(e); handleKeyDown(e, 'carbideMin'); }}
              name="carbideMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.carbideMin)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.carbideMax = el}
              type="number"
              value={formData.carbideMax}
              onChange={handleInputChange('carbideMax')}
              onPaste={numericGuards.carbideMax?.onPaste}
              onKeyDown={e => { numericGuards.carbideMax?.onKeyDown(e); handleKeyDown(e, 'carbideMax'); }}
              name="carbideMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', validationStates.carbideMax)}
            />
          </div>
        </div>
      </div>

      {/* Row 3 — remarks */}
      <div className="microstructure-form-row" style={{ flexWrap: 'wrap' }}>
        <div className="microstructure-field" style={{ flex: '0 0 50%', maxWidth: '50%' }}>
          <label>Remarks{mark('remarks')}</label>
          <input
            ref={el => inputRefs.current.remarks = el}
            type="text"
            value={formData.remarks}
            onChange={handleInputChange('remarks')}
            onKeyDown={e => handleKeyDown(e, 'remarks')}
            name="remarks"
            placeholder="Enter remarks"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', validationStates.remarks)}
          />
        </div>
      </div>
      </div>

      {/* Submit Button Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingRight: '1rem' }}>
        {submitErrorMessage && (
          <div>
            <InlineLoader
              message={submitErrorMessage}
              size="medium"
              variant="danger"
            />
          </div>
        )}
        <div>
          <SubmitButton
            ref={el => inputRefs.current.submitBtn = el}
            onClick={handleSubmit}
            onKeyDown={handleSubmitKeyDown}
            disabled={!isPrimarySaved || submitLoading}
          >
            {submitLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Submit'
          )}
        </SubmitButton>
        </div>
      </div>

    </>
  );
};

export default MicroStructure;
