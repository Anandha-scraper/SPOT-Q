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
import { runValidation, getRequiredFields, RequiredMark } from '../../utils/formValidation';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/MicroStructure/MicroStructure.css';

const MicroStructure = () => {
  // Info modal hook
  const { isOpen, openModal, closeModal } = useInfoModal();
  const { toast } = useToast();

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // ====================== Validation Ranges ======================
  // Single source of truth for validation. Each rule carries the state `key` it
  // validates (a string for single fields, a [min, max] pair for range fields),
  // so `handleSubmit` can verify the whole form by iterating this array alone.
  const validationRanges = [
    {
      field: 'Date',
      key: 'date',
      required: true,
      type: 'Date',
      pattern: 'DD/MM/YYYY'
    },
    {
      field: 'DISA',
      key: 'disa',
      required: true,
      type: 'Select',
      allowedValues: ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4']
    },
    {
      field: 'Part Name',
      key: 'partName',
      required: true,
      type: 'Text',
      pattern: 'e.g., Brake Disc'
    },
    {
      field: 'Date Code',
      key: 'dateCode',
      required: true,
      type: 'Text',
      pattern: 'e.g., 3A15'
    },
    {
      field: 'Heat Code',
      key: 'heatCode',
      type: 'Number',
      pattern: 'e.g., 20'
    },
    {
      field: 'Nodularity %',
      key: 'nodularity',
      type: 'Number',
      min: 0,
      unit: '%'
    },
    {
      field: 'Graphite Type',
      key: 'graphiteType',
      type: 'Text'
    },
    // Range fields - combined min/max pairs
    {
      field: 'Count Range',
      key: ['countMin', 'countMax'],
      type: 'NumberRange',
      min: 0,
      unit: 'count'
    },
    {
      field: 'Size Range',
      key: ['sizeMin', 'sizeMax'],
      type: 'NumberRange',
      min: 0,
      unit: 'μm'
    },
    {
      field: 'Ferrite Range %',
      key: ['ferriteMin', 'ferriteMax'],
      type: 'NumberRange',
      min: 0,
      unit: '%'
    },
    {
      field: 'Pearlite Range %',
      key: ['pearliteMin', 'pearliteMax'],
      type: 'NumberRange',
      min: 0,
      unit: '%'
    },
    {
      field: 'Carbide Range %',
      key: ['carbideMin', 'carbideMax'],
      type: 'NumberRange',
      min: 0,
      unit: '%'
    },
    {
      field: 'Remarks',
      key: 'remarks',
      type: 'Text'
    }
  ];

  // ====================== State from Context ======================
  // Get form data and validation states from context to persist across Entry/Report navigation
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

  // Local UI states that don't need to persist
  const [submitLoading, setSubmitLoading] = useState(false);

  // Extract form field values from context for easier access
  const date = formData.date;
  const disa = formData.disa;
  const partName = formData.partName;
  const dateCode = formData.dateCode;
  const heatCode = formData.heatCode;
  const nodularity = formData.nodularity;
  const graphiteType = formData.graphiteType;
  const countMin = formData.countMin;
  const countMax = formData.countMax;
  const sizeMin = formData.sizeMin;
  const sizeMax = formData.sizeMax;
  const ferriteMin = formData.ferriteMin;
  const ferriteMax = formData.ferriteMax;
  const pearliteMin = formData.pearliteMin;
  const pearliteMax = formData.pearliteMax;
  const carbideMin = formData.carbideMin;
  const carbideMax = formData.carbideMax;
  const remarks = formData.remarks;

  // Setters for form fields using context
  const setDate = (value) => setFormData(prev => ({ ...prev, date: value }));
  const setDisa = (value) => setFormData(prev => ({ ...prev, disa: value }));
  const setPartName = (value) => setFormData(prev => ({ ...prev, partName: value }));
  const setDateCode = (value) => setFormData(prev => ({ ...prev, dateCode: value }));
  const setHeatCode = (value) => setFormData(prev => ({ ...prev, heatCode: value }));
  const setNodularity = (value) => setFormData(prev => ({ ...prev, nodularity: value }));
  const setGraphiteType = (value) => setFormData(prev => ({ ...prev, graphiteType: value }));
  const setCountMin = (value) => setFormData(prev => ({ ...prev, countMin: value }));
  const setCountMax = (value) => setFormData(prev => ({ ...prev, countMax: value }));
  const setSizeMin = (value) => setFormData(prev => ({ ...prev, sizeMin: value }));
  const setSizeMax = (value) => setFormData(prev => ({ ...prev, sizeMax: value }));
  const setFerriteMin = (value) => setFormData(prev => ({ ...prev, ferriteMin: value }));
  const setFerriteMax = (value) => setFormData(prev => ({ ...prev, ferriteMax: value }));
  const setPearliteMin = (value) => setFormData(prev => ({ ...prev, pearliteMin: value }));
  const setPearliteMax = (value) => setFormData(prev => ({ ...prev, pearliteMax: value }));
  const setCarbideMin = (value) => setFormData(prev => ({ ...prev, carbideMin: value }));
  const setCarbideMax = (value) => setFormData(prev => ({ ...prev, carbideMax: value }));
  const setRemarks = (value) => setFormData(prev => ({ ...prev, remarks: value }));

  // Extract validation states from context
  const dateValid = validationStates.date;
  const disaValid = validationStates.disa;
  const partNameValid = validationStates.partName;
  const dateCodeValid = validationStates.dateCode;
  const heatCodeValid = validationStates.heatCode;
  const nodularityValid = validationStates.nodularity;
  const graphiteTypeValid = validationStates.graphiteType;
  const countMinValid = validationStates.countMin;
  const countMaxValid = validationStates.countMax;
  const sizeMinValid = validationStates.sizeMin;
  const sizeMaxValid = validationStates.sizeMax;
  const ferriteMinValid = validationStates.ferriteMin;
  const ferriteMaxValid = validationStates.ferriteMax;
  const pearliteMinValid = validationStates.pearliteMin;
  const pearliteMaxValid = validationStates.pearliteMax;
  const carbideMinValid = validationStates.carbideMin;
  const carbideMaxValid = validationStates.carbideMax;
  const remarksValid = validationStates.remarks;

  // Refs for navigation
  const inputRefs = useRef({});
  const primarySectionRef = useRef(null);

  // Spatial arrow-key navigation across the form grid (↑/↓/←/→ move focus)
  const { containerRef: gridRef, handleArrowKeyDown } = useArrowNavigation();

  // Rule `key` doubles as the formData key, so the mapping falls out of the rules.
  const fieldMapping = Object.fromEntries(validationRanges.map(r => [r.field, r.key]));
  const requiredFields = getRequiredFields(validationRanges, fieldMapping);
  const mark = (field) => (requiredFields.has(field) ? <RequiredMark /> : null);

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

  // Field order for Enter key navigation
  const fieldOrder = [
    'date', 'disa', 'partName', 'dateCode', 'heatCode', 'nodularity', 'graphiteType',
    'countMin', 'countMax', 'sizeMin', 'sizeMax', 'ferriteMin', 'ferriteMax',
    'pearliteMin', 'pearliteMax', 'carbideMin', 'carbideMax', 'remarks'
  ];

  // ====================== Effects ======================

  // Set current date and load previous DISA from database on mount (only if not already set)
  useEffect(() => {
    // Only set date if not already set in context (preserves data when navigating back)
    if (!date) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
    }

    // Fetch last used DISA from database only if not already set
    if (!disa) {
      const fetchLastDisa = async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.microStructure}/last-disa`, {
            method: 'GET',
            credentials: 'include'
          });
          const data = await response.json();
          if (data.success && data.lastDisa) {
            setDisa(data.lastDisa);
          }
        } catch (error) {
          console.error('Error fetching last DISA:', error);
        }
      };
      fetchLastDisa();
    }
  }, []);
  
  // ====================== Helpers ======================
  
  const getInputClassName = (baseClass, validationState) => {
    let classes = baseClass;
    if (validationState === false) classes += ' invalid-input';
    return classes;
  };

  // ====================== Handlers ======================
  
  const handleDateChange = (e) => {
    setDate(e.target.value);
    setIsPrimarySaved(false);

    // Reset all form fields except date and disa
    setFormData(prev => ({
      ...prev,
      date: e.target.value,
      partName: '',
      dateCode: '',
      heatCode: '',
      nodularity: '',
      graphiteType: '',
      countMin: '',
      countMax: '',
      sizeMin: '',
      sizeMax: '',
      ferriteMin: '',
      ferriteMax: '',
      pearliteMin: '',
      pearliteMax: '',
      carbideMin: '',
      carbideMax: '',
      remarks: ''
    }));

    // Reset all validation states using context
    resetValidation();
    setSubmitErrorMessage('');
  };

  const handleDisaChange = (e) => {
    setDisa(e.target.value);
    setIsPrimarySaved(false);

    // Reset all form fields except date and disa
    setFormData(prev => ({
      ...prev,
      disa: e.target.value,
      partName: '',
      dateCode: '',
      heatCode: '',
      nodularity: '',
      graphiteType: '',
      countMin: '',
      countMax: '',
      sizeMin: '',
      sizeMax: '',
      ferriteMin: '',
      ferriteMax: '',
      pearliteMin: '',
      pearliteMax: '',
      carbideMin: '',
      carbideMax: '',
      remarks: ''
    }));

    // Reset all validation states using context
    resetValidation();
    setSubmitErrorMessage('');
  };

  const handleInputChange = (setter, fieldKey) => (e) => {
    setter(e.target.value);
    if (fieldKey) setValidation(fieldKey, null);
  };

  const handleDateCodeChange = (e) => {
    setDateCode(e.target.value.toUpperCase());
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
        date,
        disa,
        partName,
        dateCode,
        heatCode,
        nodularity: parseFloat(nodularity),
        graphiteType,
        countMin: parseFloat(countMin),
        countMax: countMax === '' ? 0 : parseFloat(countMax),
        sizeMin: parseFloat(sizeMin),
        sizeMax: sizeMax === '' ? 0 : parseFloat(sizeMax),
        ferriteMin: parseFloat(ferriteMin),
        ferriteMax: ferriteMax === '' ? 0 : parseFloat(ferriteMax),
        pearliteMin: parseFloat(pearliteMin),
        pearliteMax: pearliteMax === '' ? 0 : parseFloat(pearliteMax),
        carbideMin: parseFloat(carbideMin),
        carbideMax: carbideMax === '' ? 0 : parseFloat(carbideMax),
        remarks
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

        // Reset all fields except primary data
        setPartName('');
        setDateCode('');
        setHeatCode('');
        setNodularity('');
        setGraphiteType('');
        setCountMin('');
        setCountMax('');
        setSizeMin('');
        setSizeMax('');
        setFerriteMin('');
        setFerriteMax('');
        setPearliteMin('');
        setPearliteMax('');
        setCarbideMin('');
        setCarbideMax('');
        setRemarks('');

        // Reset validation states
        resetValidation();

        setSubmitErrorMessage('');
        setEntryCount(prev => prev + 1);

        setTimeout(() => {
          inputRefs.current.partName?.focus();
        }, 100);
      } else {
        setSubmitErrorMessage('Technical error');
        toast.error('Technical error');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setSubmitErrorMessage('Technical error');
      toast.error('Technical error');
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

  // ====================== Format date ======================
  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // ====================== JSX ======================
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
          DATE : {date ? formatDisplayDate(date) : '-'}
        </div>
      </div>

      {/* Info Modal */}
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
              value={date}
              onChange={handleDateChange}
              onKeyDown={e => handleKeyDown(e, 'date')}
              max={getCurrentDate()}
              name="date"
              style={{
                border: (highlightPrimaryFields || dateValid === false) ? '2px solid #ef4444' : '2px solid #cbd5e1',
                width: '100%',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: (highlightPrimaryFields || dateValid === false) ? '#fee2e2' : '#fff',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          <div className="microstructure-field" style={{ maxWidth: '5%' }}>
            <label>DISA{mark('disa')}</label>
            <DisaDropdown
              ref={el => inputRefs.current.disa = el}
              value={disa}
              onChange={handleDisaChange}
              onKeyDown={e => handleKeyDown(e, 'disa')}
              name="disa"
              style={{
                border: (highlightPrimaryFields || disaValid === false) ? '2px solid #ef4444' : undefined,
                backgroundColor: (highlightPrimaryFields || disaValid === false) ? '#fee2e2' : undefined,
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
              disabled={primaryBusy || !date || !disa || isPrimarySaved}
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
            value={partName}
            onChange={handleInputChange(setPartName, 'partName')}
            onKeyDown={e => handleKeyDown(e, 'partName')}
            name="partName"
            placeholder="Enter part name"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', partNameValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Date Code{mark('dateCode')}</label>
          <input
            ref={el => inputRefs.current.dateCode = el}
            type="text"
            value={dateCode}
            onChange={handleDateCodeChange}
            onKeyDown={e => handleKeyDown(e, 'dateCode')}
            name="dateCode"
            placeholder="Enter date code"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', dateCodeValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Heat Code{mark('heatCode')}</label>
          <input
            ref={el => inputRefs.current.heatCode = el}
            type="text"
            value={heatCode}
            onChange={handleInputChange(setHeatCode, 'heatCode')}
            onKeyDown={e => handleKeyDown(e, 'heatCode')}
            name="heatCode"
            placeholder="Enter heat code"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', heatCodeValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Nodularity %{mark('nodularity')}</label>
          <input
            ref={el => inputRefs.current.nodularity = el}
            type="number"
            value={nodularity}
            onChange={handleInputChange(setNodularity, 'nodularity')}
            onKeyDown={e => handleKeyDown(e, 'nodularity')}
            name="nodularity"
            placeholder="0-100"
            min="0"
            max="100"
            step="0.01"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', nodularityValid)}
          />
        </div>
        <div className="microstructure-field">
          <label>Graphite Type{mark('graphiteType')}</label>
          <input
            ref={el => inputRefs.current.graphiteType = el}
            type="text"
            value={graphiteType}
            onChange={handleInputChange(setGraphiteType, 'graphiteType')}
            onKeyDown={e => handleKeyDown(e, 'graphiteType')}
            name="graphiteType"
            placeholder="Enter graphite type"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', graphiteTypeValid)}
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
              value={countMin}
              onChange={handleInputChange(setCountMin, 'countMin')}
              onKeyDown={e => handleKeyDown(e, 'countMin')}
              name="countMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', countMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.countMax = el}
              type="number"
              value={countMax}
              onChange={handleInputChange(setCountMax, 'countMax')}
              onKeyDown={e => handleKeyDown(e, 'countMax')}
              name="countMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', countMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Size{mark('sizeMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.sizeMin = el}
              type="number"
              value={sizeMin}
              onChange={handleInputChange(setSizeMin, 'sizeMin')}
              onKeyDown={e => handleKeyDown(e, 'sizeMin')}
              name="sizeMin"
              placeholder="Min"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', sizeMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.sizeMax = el}
              type="number"
              value={sizeMax}
              onChange={handleInputChange(setSizeMax, 'sizeMax')}
              onKeyDown={e => handleKeyDown(e, 'sizeMax')}
              name="sizeMax"
              placeholder="Max"
              min="0"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', sizeMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Ferrite %{mark('ferriteMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.ferriteMin = el}
              type="number"
              value={ferriteMin}
              onChange={handleInputChange(setFerriteMin, 'ferriteMin')}
              onKeyDown={e => handleKeyDown(e, 'ferriteMin')}
              name="ferriteMin"
              placeholder="Min"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', ferriteMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.ferriteMax = el}
              type="number"
              value={ferriteMax}
              onChange={handleInputChange(setFerriteMax, 'ferriteMax')}
              onKeyDown={e => handleKeyDown(e, 'ferriteMax')}
              name="ferriteMax"
              placeholder="Max"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', ferriteMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Pearlite %{mark('pearliteMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.pearliteMin = el}
              type="number"
              value={pearliteMin}
              onChange={handleInputChange(setPearliteMin, 'pearliteMin')}
              onKeyDown={e => handleKeyDown(e, 'pearliteMin')}
              name="pearliteMin"
              placeholder="Min"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', pearliteMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.pearliteMax = el}
              type="number"
              value={pearliteMax}
              onChange={handleInputChange(setPearliteMax, 'pearliteMax')}
              onKeyDown={e => handleKeyDown(e, 'pearliteMax')}
              name="pearliteMax"
              placeholder="Max"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', pearliteMaxValid)}
            />
          </div>
        </div>
        <div className="microstructure-field">
          <label>Carbide %{mark('carbideMin')}</label>
          <div className="microstructure-range-input">
            <input
              ref={el => inputRefs.current.carbideMin = el}
              type="number"
              value={carbideMin}
              onChange={handleInputChange(setCarbideMin, 'carbideMin')}
              onKeyDown={e => handleKeyDown(e, 'carbideMin')}
              name="carbideMin"
              placeholder="Min"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', carbideMinValid)}
            />
            <span className="range-separator">-</span>
            <input
              ref={el => inputRefs.current.carbideMax = el}
              type="number"
              value={carbideMax}
              onChange={handleInputChange(setCarbideMax, 'carbideMax')}
              onKeyDown={e => handleKeyDown(e, 'carbideMax')}
              name="carbideMax"
              placeholder="Max"
              min="0"
              max="100"
              step="0.01"
              disabled={!isPrimarySaved}
              className={getInputClassName('microstructure-input', carbideMaxValid)}
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
            value={remarks}
            onChange={handleInputChange(setRemarks, 'remarks')}
            onKeyDown={e => handleKeyDown(e, 'remarks')}
            name="remarks"
            placeholder="Enter remarks"
            disabled={!isPrimarySaved}
            className={getInputClassName('microstructure-input', remarksValid)}
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
