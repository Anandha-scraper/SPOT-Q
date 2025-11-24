import React, { useState, useRef } from 'react';
import { Save, Loader2, RefreshCw, FileText } from 'lucide-react';

import api from '../../utils/api';
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

  const REQUIRED_FIELDS = ['partName', 'noOfMoulds', 'cPercent', 'siPercent', 'mnPercent',
    'pPercent', 'sPercent', 'mgPercent', 'cuPercent', 'crPercent',
    'nodularity',
    'graphiteTypeFrom', 'graphiteTypeTo',
    'pearliteFerriteFrom', 'pearliteFerriteTo',
    'hardnessFrom', 'hardnessTo',
    'tsFrom', 'tsTo', 'ysFrom', 'ysTo',  'elFrom', 'elTo'];

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
    graphiteTypeFrom: '',
    graphiteTypeTo: '',
    pearliteFerriteFrom: '',
    pearliteFerriteTo: '',
    hardnessFrom: '',
    hardnessTo: '',
    tsFrom: '',
    tsTo: '',
    ysFrom: '',
    ysTo: '',
    elFrom: '',
    elTo: ''
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

    // Microstructure-like numeric handling for nodularity: 0–100, up to 3 digits
    if (name === 'nodularity') {
      const singleNumberLoose = /^\d{0,3}$/; // up to 3 digits

      if (value === '') {
        // allow clearing but mark as invalid (required)
        setFormData(prev => ({
          ...prev,
          nodularity: ''
        }));
        setValidationErrors(prev => ({ ...prev, nodularity: true }));
        return;
      }

      // Only allow digits up to 3 characters
      if (!singleNumberLoose.test(value)) {
        setValidationErrors(prev => ({ ...prev, nodularity: true }));
        return;
      }

      const numVal = parseInt(value, 10);
      if (!Number.isNaN(numVal) && (numVal < 0 || numVal > 100)) {
        setValidationErrors(prev => ({ ...prev, nodularity: true }));
        return;
      }

      // Valid value: update and clear error
      setFormData(prev => ({
        ...prev,
        nodularity: value
      }));

      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.nodularity;
        return next;
      });
      return; // skip the generic logic below
    }

    // Numeric-only handling for Graphite Type From/To, Pearlite Ferrite From/To, and Hardness From/To
    if (
      name === 'graphiteTypeFrom' ||
      name === 'graphiteTypeTo' ||
      name === 'pearliteFerriteFrom' ||
      name === 'pearliteFerriteTo' ||
      name === 'hardnessFrom' ||
      name === 'hardnessTo'
    ) {
      const singleNumberLoose = /^\d{0,3}$/; // up to 3 digits

      if (value === '') {
        // allow clearing but mark as invalid (required)
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
        setValidationErrors(prev => ({ ...prev, [name]: true }));
        return;
      }

      // Only allow digits up to 3 characters
      if (!singleNumberLoose.test(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: true }));
        return;
      }

      const numVal = parseInt(value, 10);

      // Pearlite ferrite is a percent 0–99; others are 0–999
      const isPearliteField = name === 'pearliteFerriteFrom' || name === 'pearliteFerriteTo';
      const maxValue = isPearliteField ? 99 : 999;

      if (!Number.isNaN(numVal) && (numVal < 0 || numVal > maxValue)) {
        setValidationErrors(prev => ({ ...prev, [name]: true }));
        return;
      }

      // Valid value: update and clear error
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return; // skip the generic logic below
    }

    let nextValue = value;

    // Restrict No. of Moulds to digits only and max 5 digits (e.g. 12345)
    if (name === 'noOfMoulds') {
      const digitsOnly = (value || '').replace(/\D/g, '');

      // If user tried to type more than 5 digits, mark as invalid
      if (digitsOnly.length > 5) {
        setValidationErrors(prev => ({
          ...prev,
          noOfMoulds: true
        }));
      } else if (validationErrors.noOfMoulds) {
        // Length is back within limit (<= 5) -> clear the error
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.noOfMoulds;
          return newErrors;
        });
      }

      // Stored value is always at most 5 digits
      nextValue = digitsOnly.slice(0, 5);
    }

    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    // Clear validation error when user starts typing for other fields
    if (name !== 'noOfMoulds' && validationErrors[name]) {
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
    const { name } = e.target;

    // Block scientific-notation characters (e/E/+) and '-' for specific numeric fields, like MicroStructure
    if ((
          name === 'nodularity' ||
          name === 'graphiteTypeFrom' ||
          name === 'graphiteTypeTo' ||
          name === 'hardnessFrom' ||
          name === 'hardnessTo'
        ) && ['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const fieldName = e.target.name;

      if (REQUIRED_FIELDS.includes(fieldName) && !formData[fieldName]) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: true
        }));
        return;
      }

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
    const missing = REQUIRED_FIELDS.filter(field => !formData[field]);

    // Set validation errors for missing fields
    const errors = {};

    missing.forEach(field => {
      errors[field] = true;
    });

    // Range validation for nodularity: must be 0–100
    const nodVal = parseFloat(formData.nodularity);
    if (isNaN(nodVal) || nodVal < 0 || nodVal > 100) {
      errors.nodularity = true;
    }

    // Range validation for graphiteType and hardnessBHN: must be 0–999
    const graphVal = parseFloat(formData.graphiteType);
    if (isNaN(graphVal) || graphVal < 0 || graphVal > 999) {
      errors.graphiteType = true;
    }

    const hardnessVal = parseFloat(formData.hardnessBHN);
    if (isNaN(hardnessVal) || hardnessVal < 0 || hardnessVal > 999) {
      errors.hardnessBHN = true;
    }

    // If noOfMoulds currently has a length error, keep it marked
    if (validationErrors.noOfMoulds) {
      errors.noOfMoulds = true;
    }

    setValidationErrors(errors);
    // Block submit if any errors exist (missing or length rule)
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSubmitLoading(true);
      const data = await api.post('/v1/qc-reports', formData);

      if (data.success) {
        alert('QC Production report created successfully!');
        setFormData({
          date: getTodayDate(), partName: '', noOfMoulds: '', cPercent: '', siPercent: '', mnPercent: '',
          pPercent: '', sPercent: '', mgPercent: '', cuPercent: '', crPercent: '',
          nodularity: '', graphiteType: '', pearliteFerrite: '', hardnessBHN: '', ts: '', ys: '', el: ''
        });
        setValidationErrors({});
        // Focus first input after successful submission
        setTimeout(() => {
          if (firstInputRef.current && firstInputRef.current.focus) {
            firstInputRef.current.focus();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error creating QC report:', error);
      alert('Failed to create entry: ' + error.message);
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
              <label>Part Name <span className="required-asterisk">*</span></label>

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
              <label>No. of Moulds <span className="required-asterisk">*</span></label>

              <input
                type="number"
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
              <label>C % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="cPercent"
                value={formData.cPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 3.5"
                className={validationErrors.cPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Si % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="siPercent"
                value={formData.siPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 2.5"
                className={validationErrors.siPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Mn % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="mnPercent"
                value={formData.mnPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 0.5"
                className={validationErrors.mnPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>P % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="pPercent"
                value={formData.pPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 0.05"
                className={validationErrors.pPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>S % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="sPercent"
                value={formData.sPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 0.03"
                className={validationErrors.sPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Mg % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="mgPercent"
                value={formData.mgPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 0.04"
                className={validationErrors.mgPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Cu % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="cuPercent"
                value={formData.cuPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 0.5"
                className={validationErrors.cuPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Cr % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="crPercent"
                value={formData.crPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 0.2"
                className={validationErrors.crPercent ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Nodularity % <span className="required-asterisk">*</span></label>

              <input
                type="number"
                name="nodularity"
                value={formData.nodularity}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                min="0"
                max="100"
                step="1"
                placeholder="e.g: 85"
                className={validationErrors.nodularity ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Graphite Type % <span className="required-asterisk">*</span></label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
             <input
              type="number"
              name="graphiteTypeFrom"
              value={formData.graphiteTypeFrom}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              min="0"
              max="999"
              step="1"
              placeholder="From"
              className={validationErrors.graphiteTypeFrom ? 'invalid-input' : ''}
               />
             <input
              type="number"
              name="graphiteTypeTo"
              value={formData.graphiteTypeTo}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              min="0"
              max="999"
              step="1"
              placeholder="To"
              className={validationErrors.graphiteTypeTo ? 'invalid-input' : ''}
               />
              </div>
           </div>

            <div className="qcproduction-form-group">
  <label>Pearlite Ferrite % <span className="required-asterisk">*</span></label>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <input
      type="number"
      name="pearliteFerriteFrom"
      value={formData.pearliteFerriteFrom}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="999"
      step="1"
      placeholder="From"
      className={validationErrors.pearliteFerriteFrom ? 'invalid-input' : ''}
    />
    <input
      type="number"
      name="pearliteFerriteTo"
      value={formData.pearliteFerriteTo}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="999"
      step="1"
      placeholder="To"
      className={validationErrors.pearliteFerriteTo ? 'invalid-input' : ''}
    />
  </div>
</div>

            <div className="qcproduction-form-group">
  <label>Hardness BHN <span className="required-asterisk">*</span></label>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <input
      type="number"
      name="hardnessFrom"
      value={formData.hardnessFrom}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min="0"
      max="999"
      step="1"
      placeholder="From"
      className={validationErrors.hardnessFrom ? 'invalid-input' : ''}
    />
    <input
      type="number"
      name="hardnessTo"
      value={formData.hardnessTo}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min="0"
      max="999"
      step="1"
      placeholder="To"
      className={validationErrors.hardnessTo ? 'invalid-input' : ''}
    />
  </div>
</div>

            <div className="qcproduction-form-group">
  <label>TS (Tensile Strength) <span className="required-asterisk">*</span></label>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <input
      type="number"
      name="tsFrom"
      value={formData.tsFrom}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="9999"
      step="1"
      placeholder="From"
      className={validationErrors.tsFrom ? 'invalid-input' : ''}
    />
    <input
      type="number"
      name="tsTo"
      value={formData.tsTo}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="9999"
      step="1"
      placeholder="To"
      className={validationErrors.tsTo ? 'invalid-input' : ''}
    />
  </div>
</div>
           <div className="qcproduction-form-group">
  <label>YS (Yield Strength) <span className="required-asterisk">*</span></label>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <input
      type="number"
      name="ysFrom"
      value={formData.ysFrom}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="9999"
      step="1"
      placeholder="From"
      className={validationErrors.ysFrom ? 'invalid-input' : ''}
    />
    <input
      type="number"
      name="ysTo"
      value={formData.ysTo}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="9999"
      step="1"
      placeholder="To"
      className={validationErrors.ysTo ? 'invalid-input' : ''}
    />
  </div>
</div>

<div className="qcproduction-form-group">
  <label>EL (Elongation) <span className="required-asterisk">*</span></label>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <input
      type="number"
      name="elFrom"
      value={formData.elFrom}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="99"
      step="1"
      placeholder="From"
      className={validationErrors.elFrom ? 'invalid-input' : ''}
    />
    <input
      type="number"
      name="elTo"
      value={formData.elTo}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min="0"
      max="99"
      step="1"
      placeholder="To"
      className={validationErrors.elTo ? 'invalid-input' : ''}
    />
  </div>
</div>
            

      <div className="qcproduction-submit-container" style={{ justifyContent: 'flex-end' }}>
        <button 
          ref={submitButtonRef}
          className="qcproduction-submit-btn" 
          type="button"
          onClick={handleSubmit}
          onKeyDown={handleSubmitButtonKeyDown}
          disabled={submitLoading}
        >
          {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
          {submitLoading ? 'Saving...' : 'Submit All'}
        </button>
      </div>
      </form>
    </>
  );
};

export default QcProductionDetails;