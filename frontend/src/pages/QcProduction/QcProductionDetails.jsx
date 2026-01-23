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

  // VALIDATION STATES (null = neutral/default, true = green/valid, false = red/invalid)
  const [partNameValid, setPartNameValid] = useState(null);
  const [noOfMouldsValid, setNoOfMouldsValid] = useState(null);
  const [cPercentValid, setCPercentValid] = useState(null);
  const [siPercentValid, setSiPercentValid] = useState(null);
  const [mnPercentValid, setMnPercentValid] = useState(null);
  const [pPercentValid, setPPercentValid] = useState(null);
  const [sPercentValid, setSPercentValid] = useState(null);
  const [mgPercentValid, setMgPercentValid] = useState(null);
  const [cuPercentValid, setCuPercentValid] = useState(null);
  const [crPercentValid, setCrPercentValid] = useState(null);
  const [nodularityValid, setNodularityValid] = useState(null);
  const [graphiteTypeValid, setGraphiteTypeValid] = useState(null);
  const [pearliteFertiteValid, setPearliteFertiteValid] = useState(null);
  const [hardnessBHNValid, setHardnessBHNValid] = useState(null);
  const [tsValid, setTsValid] = useState(null);
  const [ysValid, setYsValid] = useState(null);
  const [elValid, setElValid] = useState(null);

  // Refs for navigation
  const submitButtonRef = useRef(null);
  const firstInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent programmatic/user changes to date
    if (name === 'date') return;

    // Validate Part Name
    if (name === 'partName') {
      if (value.trim() === '') {
        setPartNameValid(null);
      } else {
        setPartNameValid(value.trim().length > 0);
      }
    }

    // Validate No. of Moulds (number >= 1)
    if (name === 'noOfMoulds') {
      if (value.trim() === '') {
        setNoOfMouldsValid(null);
      } else {
        setNoOfMouldsValid(!isNaN(value) && parseFloat(value) >= 1);
      }
    }

    // Validate percentage fields (numbers >= 0)
    if (name === 'cPercent') {
      if (value.trim() === '') {
        setCPercentValid(null);
      } else {
        setCPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'siPercent') {
      if (value.trim() === '') {
        setSiPercentValid(null);
      } else {
        setSiPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'mnPercent') {
      if (value.trim() === '') {
        setMnPercentValid(null);
      } else {
        setMnPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'pPercent') {
      if (value.trim() === '') {
        setPPercentValid(null);
      } else {
        setPPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'sPercent') {
      if (value.trim() === '') {
        setSPercentValid(null);
      } else {
        setSPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'mgPercent') {
      if (value.trim() === '') {
        setMgPercentValid(null);
      } else {
        setMgPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'cuPercent') {
      if (value.trim() === '') {
        setCuPercentValid(null);
      } else {
        setCuPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (name === 'crPercent') {
      if (value.trim() === '') {
        setCrPercentValid(null);
      } else {
        setCrPercentValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }

    // Validate text fields
    if (name === 'nodularity') {
      if (value.trim() === '') {
        setNodularityValid(null);
      } else {
        setNodularityValid(value.trim().length > 0);
      }
    }
    if (name === 'graphiteType') {
      if (value.trim() === '') {
        setGraphiteTypeValid(null);
      } else {
        setGraphiteTypeValid(value.trim().length > 0);
      }
    }
    if (name === 'pearliteFerrite') {
      if (value.trim() === '') {
        setPearliteFertiteValid(null);
      } else {
        setPearliteFertiteValid(value.trim().length > 0);
      }
    }

    // Validate Hardness BHN (number > 0)
    if (name === 'hardnessBHN') {
      if (value.trim() === '') {
        setHardnessBHNValid(null);
      } else {
        setHardnessBHNValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // Validate TS, YS, EL (text fields)
    if (name === 'ts') {
      if (value.trim() === '') {
        setTsValid(null);
      } else {
        setTsValid(value.trim().length > 0);
      }
    }
    if (name === 'ys') {
      if (value.trim() === '') {
        setYsValid(null);
      } else {
        setYsValid(value.trim().length > 0);
      }
    }
    if (name === 'el') {
      if (value.trim() === '') {
        setElValid(null);
      } else {
        setElValid(value.trim().length > 0);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    // Check all required fields and set validation states
    let hasErrors = false;

    if (!formData.partName || formData.partName.trim() === '') {
      setPartNameValid(false);
      hasErrors = true;
    }
    if (!formData.noOfMoulds || isNaN(formData.noOfMoulds) || parseFloat(formData.noOfMoulds) < 1) {
      setNoOfMouldsValid(false);
      hasErrors = true;
    }
    if (!formData.cPercent || isNaN(formData.cPercent) || parseFloat(formData.cPercent) < 0) {
      setCPercentValid(false);
      hasErrors = true;
    }
    if (!formData.siPercent || isNaN(formData.siPercent) || parseFloat(formData.siPercent) < 0) {
      setSiPercentValid(false);
      hasErrors = true;
    }
    if (!formData.mnPercent || isNaN(formData.mnPercent) || parseFloat(formData.mnPercent) < 0) {
      setMnPercentValid(false);
      hasErrors = true;
    }
    if (!formData.pPercent || isNaN(formData.pPercent) || parseFloat(formData.pPercent) < 0) {
      setPPercentValid(false);
      hasErrors = true;
    }
    if (!formData.sPercent || isNaN(formData.sPercent) || parseFloat(formData.sPercent) < 0) {
      setSPercentValid(false);
      hasErrors = true;
    }
    if (!formData.mgPercent || isNaN(formData.mgPercent) || parseFloat(formData.mgPercent) < 0) {
      setMgPercentValid(false);
      hasErrors = true;
    }
    if (!formData.cuPercent || isNaN(formData.cuPercent) || parseFloat(formData.cuPercent) < 0) {
      setCuPercentValid(false);
      hasErrors = true;
    }
    if (!formData.crPercent || isNaN(formData.crPercent) || parseFloat(formData.crPercent) < 0) {
      setCrPercentValid(false);
      hasErrors = true;
    }
    if (!formData.nodularity || formData.nodularity.trim() === '') {
      setNodularityValid(false);
      hasErrors = true;
    }
    if (!formData.graphiteType || formData.graphiteType.trim() === '') {
      setGraphiteTypeValid(false);
      hasErrors = true;
    }
    if (!formData.pearliteFerrite || formData.pearliteFerrite.trim() === '') {
      setPearliteFertiteValid(false);
      hasErrors = true;
    }
    if (!formData.hardnessBHN || isNaN(formData.hardnessBHN) || parseFloat(formData.hardnessBHN) <= 0) {
      setHardnessBHNValid(false);
      hasErrors = true;
    }
    if (!formData.ts || formData.ts.trim() === '') {
      setTsValid(false);
      hasErrors = true;
    }
    if (!formData.ys || formData.ys.trim() === '') {
      setYsValid(false);
      hasErrors = true;
    }
    if (!formData.el || formData.el.trim() === '') {
      setElValid(false);
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

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

      if (data.success) {
        alert('QC Production report created successfully!');
        // Reset form and validation states
        setFormData({
          date: getTodayDate(), partName: '', noOfMoulds: '', cPercent: '', siPercent: '', mnPercent: '',
          pPercent: '', sPercent: '', mgPercent: '', cuPercent: '', crPercent: '',
          nodularity: '', graphiteType: '', pearliteFerrite: '', hardnessBHN: '', ts: '', ys: '', el: ''
        });
        setPartNameValid(null);
        setNoOfMouldsValid(null);
        setCPercentValid(null);
        setSiPercentValid(null);
        setMnPercentValid(null);
        setPPercentValid(null);
        setSPercentValid(null);
        setMgPercentValid(null);
        setCuPercentValid(null);
        setCrPercentValid(null);
        setNodularityValid(null);
        setGraphiteTypeValid(null);
        setPearliteFertiteValid(null);
        setHardnessBHNValid(null);
        setTsValid(null);
        setYsValid(null);
        setElValid(null);
        
        // Focus first input after successful submission
        setTimeout(() => {
          if (firstInputRef.current && firstInputRef.current.focus) {
            firstInputRef.current.focus();
          }
        }, 100);
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
    // Reset all validation states
    setPartNameValid(null);
    setNoOfMouldsValid(null);
    setCPercentValid(null);
    setSiPercentValid(null);
    setMnPercentValid(null);
    setPPercentValid(null);
    setSPercentValid(null);
    setMgPercentValid(null);
    setCuPercentValid(null);
    setCrPercentValid(null);
    setNodularityValid(null);
    setGraphiteTypeValid(null);
    setPearliteFertiteValid(null);
    setHardnessBHNValid(null);
    setTsValid(null);
    setYsValid(null);
    setElValid(null);
  };

  // Helper to get input style class based on validation state
  const getInputStyle = (validState) => {
    if (validState === true) return 'valid-input';
    if (validState === false) return 'invalid-input';
    return '';
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
                className={getInputStyle(partNameValid)}
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
                className={getInputStyle(noOfMouldsValid)}
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

