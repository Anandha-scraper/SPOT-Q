import React, { useState, useRef } from 'react';
import { Save, Loader2, FileText } from 'lucide-react';
import { SubmitButton, ResetButton } from '../../Components/Buttons';
import '../../styles/PageStyles/QcProduction/QcProductionDetails.css';

const QcProductionDetails = () => {
  // Helper: today's date in YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper: display DD/MM/YYYY
  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const [formData, setFormData] = useState({
    date: getTodayDate(),
    partName: '',
    noOfMoulds: '',
    cPercent: '',
    siPercent: '',
    mnPercent: '',
    pPercent: '',
    sPercent: '',
    mgPercent: '',
    cuPercent: '',
    crPercent: '',
    nodularity: '',
    graphiteType: '',
    pearliteFerrite: '',
    hardnessBHN: '',
    ts: '',
    ys: '',
    el: ''
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Refs for navigation
  const submitButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent programmatic/user changes to date
    if (name === 'date') return;

    // List of fields that require range format with decimals (e.g., 2.34-3.42)
    const rangeFieldsWithDecimals = ['cPercent', 'siPercent', 'mnPercent', 'pPercent', 'sPercent', 'mgPercent', 'cuPercent', 'crPercent'];
    
    // List of fields that require range format with integers only (e.g., 23-45)
    const rangeFieldsIntegersOnly = ['graphiteType', 'hardnessBHN'];
    
    // List of fields that require numbers only
    const numberOnlyFields = ['noOfMoulds', 'nodularity'];

    // List of fields that require a single decimal number (e.g., 254.23)
    const decimalNumberOnlyFields = ['ts', 'ys', 'el'];
    
    // For range fields with decimals, validate and only allow range format
    if (rangeFieldsWithDecimals.includes(name)) {
      // First, remove all non-numeric, non-dot, non-hyphen characters
      let filteredValue = value.replace(/[^0-9.\-]/g, '');
      
      // Remove multiple consecutive hyphens and keep only one
      filteredValue = filteredValue.replace(/\-+/g, '-');
      
      // Ensure only one hyphen - keep only first two parts
      let parts = filteredValue.split('-');
      if (parts.length > 2) {
        // More than 2 parts means more than 1 hyphen, reconstruct with only first two parts
        parts = [parts[0], parts[1]];
      }
      
      // For each part, ensure only one dot
      parts = parts.map(part => {
        const dotParts = part.split('.');
        if (dotParts.length > 2) {
          // Multiple dots found, keep only first two parts (number.decimal)
          return dotParts[0] + '.' + dotParts[1];
        }
        return part;
      });
      
      filteredValue = parts.join('-');
      
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
    } else if (name === 'pearliteFerrite') {
      // For pearliteFerrite, allow only NN-NNP format (digits, single hyphen, optional trailing P)
      let upper = value.toUpperCase();
      // Keep only digits, hyphen, and P
      upper = upper.replace(/[^0-9P\-]/g, '');

      // Extract and temporarily remove all P characters
      const hasP = upper.includes('P');
      let withoutP = upper.replace(/P/g, '');

      // Remove multiple consecutive hyphens and keep only one
      withoutP = withoutP.replace(/\-+/g, '-');

      // Ensure only one hyphen - keep only first two parts
      const partsPF = withoutP.split('-');
      if (partsPF.length > 2) {
        withoutP = partsPF[0] + '-' + partsPF[1];
      }

      // Reattach a single P at the end if user typed it anywhere
      let finalValue = withoutP;
      if (hasP && withoutP.length > 0) {
        finalValue = withoutP + 'P';
      }

      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    } else if (rangeFieldsIntegersOnly.includes(name)) {
      // For range fields with integers only (no decimals), remove non-numeric and non-hyphen characters
      let filteredValue = value.replace(/[^0-9\-]/g, '');
      
      // Remove multiple consecutive hyphens and keep only one
      filteredValue = filteredValue.replace(/\-+/g, '-');
      
      // Ensure only one hyphen - keep only first two parts
      const parts = filteredValue.split('-');
      if (parts.length > 2) {
        // More than 2 parts means more than 1 hyphen, reconstruct with only first two parts
        filteredValue = parts[0] + '-' + parts[1];
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
    } else if (numberOnlyFields.includes(name)) {
      // For number-only fields, remove all non-numeric characters
      const filteredValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
    } else if (decimalNumberOnlyFields.includes(name)) {
      // For decimal number-only fields, allow digits and a single dot
      let filteredValue = value.replace(/[^0-9.]/g, '');

      const parts = filteredValue.split('.');
      if (parts.length > 2) {
        // More than one dot: keep first dot and join the rest without dots
        filteredValue = parts[0] + '.' + parts.slice(1).join('');
      }

      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value, type } = e.target;

    // Auto-format single digit numbers with leading zero
    if (type === 'number' && value && !isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 9 && !value.includes('.') && value.length === 1) {
      const formattedValue = '0' + value;
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    }
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
        // Last input - focus submit button
        if (submitButtonRef.current) {
          submitButtonRef.current.focus();
        }
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
    const required = ['partName', 'noOfMoulds', 'cPercent', 'siPercent', 'mnPercent',
                     'pPercent', 'sPercent', 'mgPercent', 'cuPercent', 'crPercent',
                     'nodularity', 'graphiteType', 'pearliteFerrite', 'hardnessBHN', 'ts', 'ys', 'el'];
    const missing = required.filter(field => !formData[field]);

    // Set validation errors for missing fields
    const errors = {};
    missing.forEach(field => {
      errors[field] = true;
    });
    setValidationErrors(errors);

    if (missing.length > 0) {
      return;
    }

    // Clear validation errors if all fields are valid
    setValidationErrors({});

    // Helper: save entry locally if backend fails
    const saveLocalEntry = () => {
      try {
        const existingRaw = localStorage.getItem('qcProductionLocalEntries');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const localEntry = {
          ...formData,
          _id: `local-${Date.now()}`,
          local: true
        };
        const updated = [...existing, localEntry];
        localStorage.setItem('qcProductionLocalEntries', JSON.stringify(updated));
      } catch (storageError) {
        console.error('Error saving QC entry to localStorage:', storageError);
      }
    };

    try {
      setSubmitLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/qc-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(formData) });
      const data = await response.json();

      if (!data.success) {
        console.warn('QC backend did not return success, storing entry locally.');
        saveLocalEntry();
      }

      setFormData({
        date: getTodayDate(), partName: '', noOfMoulds: '', cPercent: '', siPercent: '', mnPercent: '',
        pPercent: '', sPercent: '', mgPercent: '', cuPercent: '', crPercent: '',
        nodularity: '', graphiteType: '', pearliteFerrite: '', hardnessBHN: '', ts: '', ys: '', el: ''
      });
      setValidationErrors({});
      // Focus first input after submission handling
      setTimeout(() => {
        if (firstInputRef.current && firstInputRef.current.focus) {
          firstInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error creating QC report:', error);
      saveLocalEntry();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      date: getTodayDate(), partName: '', noOfMoulds: '', cPercent: '', siPercent: '', mnPercent: '',
      pPercent: '', sPercent: '', mgPercent: '', cuPercent: '', crPercent: '',
      nodularity: '', graphiteType: '', pearliteFerrite: '', hardnessBHN: '', ts: '', ys: '', el: ''
    });
    setValidationErrors({});
  };

  return (
    <>
      <div className="qcproduction-header">
        <div className="qcproduction-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            QC Production Details - Entry Form
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {`DATE : ${formatDisplayDate(formData.date)}`}
        </div>
      </div>

      <form className="qcproduction-form-grid">

            <div className="qcproduction-form-group">
              <label>Part Name *</label>
              <input
                ref={firstInputRef}
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: Brake Disc"
                className={validationErrors.partName ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>No. of Moulds *</label>
              <input
                type="text"
                name="noOfMoulds"
                value={formData.noOfMoulds}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 5"
                className={validationErrors.noOfMoulds ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>C % *</label>
              <input
                type="text"
                name="cPercent"
                value={formData.cPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 3.54-3.75"
                className={validationErrors.cPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Si % *</label>
              <input
                type="text"
                name="siPercent"
                value={formData.siPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 2.40-2.80"
                className={validationErrors.siPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Mn % *</label>
              <input
                type="text"
                name="mnPercent"
                value={formData.mnPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 0.40-0.60"
                className={validationErrors.mnPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>P % *</label>
              <input
                type="text"
                name="pPercent"
                value={formData.pPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 0.02-0.05"
                className={validationErrors.pPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>S % *</label>
              <input
                type="text"
                name="sPercent"
                value={formData.sPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 0.01-0.05"
                className={validationErrors.sPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Mg % *</label>
              <input
                type="text"
                name="mgPercent"
                value={formData.mgPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 0.03-0.05"
                className={validationErrors.mgPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Cu % *</label>
              <input
                type="text"
                name="cuPercent"
                value={formData.cuPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 0.30-0.80"
                className={validationErrors.cuPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Cr % *</label>
              <input
                type="text"
                name="crPercent"
                value={formData.crPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 0.05-0.15"
                className={validationErrors.crPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Nodularity *</label>
              <input
                type="text"
                name="nodularity"
                value={formData.nodularity}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 85"
                className={validationErrors.nodularity ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Graphite Type *</label>
              <input
                type="text"
                name="graphiteType"
                value={formData.graphiteType}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 23-45"
                className={validationErrors.graphiteType ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Pearlite Ferrite *</label>
              <input
                type="text"
                name="pearliteFerrite"
                value={formData.pearliteFerrite}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 55-65P"
                className={validationErrors.pearliteFerrite ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Hardness BHN *</label>
              <input
                type="text"
                name="hardnessBHN"
                value={formData.hardnessBHN}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 25-48"
                className={validationErrors.hardnessBHN ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>TS (Tensile Strength) *</label>
              <input
                type="text"
                name="ts"
                value={formData.ts}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 550.23"
                className={validationErrors.ts ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>YS (Yield Strength) *</label>
              <input
                type="text"
                name="ys"
                value={formData.ys}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 460.23"
                className={validationErrors.ys ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>EL (Elongation) *</label>
              <input
                type="text"
                name="el"
                value={formData.el}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 18.5"
                className={validationErrors.el ? 'invalid-input' : ''}
              />
            </div>
      </form>

      <div className="qcproduction-submit-container">
        <ResetButton onClick={handleReset}>
          Reset Form
        </ResetButton>

        <div className="qcproduction-submit-right">
          <SubmitButton
            onClick={handleSubmit}
            disabled={submitLoading}
            type="button"
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
      </div>
    </>
  );
};

export default QcProductionDetails;

