import React, { useState, useRef } from 'react';
import { Save, Loader2, RefreshCw, FileText } from 'lucide-react';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

    try {
      setSubmitLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/qc-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(formData) });
      const data = await response.json();

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
              <label>C % *</label>
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
              <label>Si % *</label>
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
              <label>Mn % *</label>
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
              <label>P % *</label>
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
              <label>S % *</label>
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
              <label>Mg % *</label>
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
              <label>Cu % *</label>
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
              <label>Cr % *</label>
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
              <label>Nodularity *</label>
              <input
                type="text"
                name="nodularity"
                value={formData.nodularity}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 85%"
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
                placeholder="e.g: Type VI"
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
                placeholder="e.g: 80/20"
                className={validationErrors.pearliteFerrite ? 'invalid-input' : ''}
              />
            </div>

            <div className="qcproduction-form-group">
              <label>Hardness BHN *</label>
              <input
                type="number"
                name="hardnessBHN"
                value={formData.hardnessBHN}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 220"
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
                placeholder="e.g: 550"
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
                placeholder="e.g: 460"
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
                placeholder="e.g: 18"
                className={validationErrors.el ? 'invalid-input' : ''}
              />
            </div>
      </form>

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
    </>
  );
};

export default QcProductionDetails;