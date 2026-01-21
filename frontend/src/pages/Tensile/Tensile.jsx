import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import '../../styles/PageStyles/Tensile/Tensile.css';

const Tensile = () => {
  // Helper function to get today's date in YYYY-MM-DD format (fallback)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    dateOfInspection: getTodayDate(), // Temporary, will be updated with server date
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

  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // VALIDATION STATES
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

  const firstFieldRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Set current date on mount (client-side, like Process.jsx)
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      dateOfInspection: `${y}-${m}-${d}`
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent date changes
    if (name === 'dateOfInspection') {
      return;
    }

    // --- VALIDATE ITEM: text required ---
    if (name === 'item') {
      setItemValid(
        value.trim() === "" ? null : value.trim().length > 0
      );
    }

    // --- VALIDATE DATE CODE: specific format (e.g., 6F25) ---
    if (name === 'dateCode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      setDateCodeValid(
        value.trim() === "" ? null : pattern.test(value)
      );
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
      if (validationErrors[name]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }

    // --- VALIDATE HEAT CODE: text required ---
    if (name === 'heatCode') {
      setHeatCodeValid(
        value.trim() === "" ? null : value.trim().length > 0
      );
    }

    // --- VALIDATE DIA: number ---
    if (name === 'dia') {
      setDiaValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE LO: number ---
    if (name === 'lo') {
      setLoValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE LI: number ---
    if (name === 'li') {
      setLiValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE BREAKING LOAD: number ---
    if (name === 'breakingLoad') {
      setBreakingLoadValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE YIELD LOAD: number ---
    if (name === 'yieldLoad') {
      setYieldLoadValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE UTS: number ---
    if (name === 'uts') {
      setUtsValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE YS: number ---
    if (name === 'ys') {
      setYsValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE ELONGATION: number between 0-100 ---
    if (name === 'elongation') {
      const num = parseFloat(value);
      setElongationValid(
        value.trim() === "" ? null : !isNaN(num) && num >= 0 && num <= 100
      );
    }

    // --- VALIDATE TESTED BY: text required ---
    if (name === 'testedBy') {
      setTestedByValid(
        value.trim() === "" ? null : value.trim().length > 0
      );
    }

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
      
      // If on the last field (testedBy), focus submit button
      if (e.target.name === 'testedBy') {
        submitButtonRef.current?.focus();
        return;
      }
      
      // If on remarks textarea, move to testedBy
      if (e.target.name === 'remarks') {
        const form = e.target.form;
        const testedByInput = form.querySelector('input[name="testedBy"]');
        if (testedByInput) {
          testedByInput.focus();
        }
        return;
      }
      
      // For other fields, move to next input (excluding disabled/readonly fields)
      const form = e.target.form;
      const inputs = Array.from(form.querySelectorAll('input:not([readonly]):not([disabled]), textarea'));
      const currentIndex = inputs.indexOf(e.target);
      const nextInput = inputs[currentIndex + 1];
      
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleSubmitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Clear any previous error
    setSubmitError('');

    // Validate ONLY required fields based on backend model
    // Required: item, dateCode
    const requiredFields = [
      { name: 'item', value: formData.item, setState: setItemValid },
      { name: 'dateCode', value: formData.dateCode, setState: setDateCodeValid }
    ];

    const emptyFields = requiredFields.filter(field => !field.value || field.value.toString().trim() === '');

    if (emptyFields.length > 0) {
      // Highlight all empty required fields in red
      emptyFields.forEach(field => {
        field.setState(false);
      });

      // Set error message
      setSubmitError('Please fill in all required fields');

      // Clear error message after 3 seconds
      setTimeout(() => {
        setSubmitError('');
      }, 3000);

      return;
    }

    // Clear validation errors if all fields are valid
    setValidationErrors({});

    try {
      setSubmitLoading(true);

      // Send payload with date from dateOfInspection
      // Convert numeric fields from strings to numbers
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

      const response = await fetch('/v1/tensile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        alert('Tensile test entry created successfully!');

        // Get current date (client-side)
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const currentDate = `${y}-${m}-${d}`;

        setFormData({
          dateOfInspection: currentDate,
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
        setValidationErrors({});

        // Reset validation states
        setItemValid(null);
        setDateCodeValid(null);
        setHeatCodeValid(null);
        setDiaValid(null);
        setLoValid(null);
        setLiValid(null);
        setBreakingLoadValid(null);
        setYieldLoadValid(null);
        setUtsValid(null);
        setYsValid(null);
        setElongationValid(null);
        setTestedByValid(null);

        // Focus first editable field for next entry
        setTimeout(() => {
          firstFieldRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error creating tensile test:', error);
      alert('Failed to create entry: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      // Get current date (client-side)
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const currentDate = `${y}-${m}-${d}`;

      setFormData({
        dateOfInspection: currentDate,
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
      setValidationErrors({});
    } catch (error) {
      console.error('Error fetching current date:', error);
      // Reset with current date in formData if API fails
      setFormData({
        dateOfInspection: formData.dateOfInspection,
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
      setValidationErrors({});
    }

    // Reset validation states
    setItemValid(null);
    setDateCodeValid(null);
    setHeatCodeValid(null);
    setDiaValid(null);
    setLoValid(null);
    setLiValid(null);
    setBreakingLoadValid(null);
    setYieldLoadValid(null);
    setUtsValid(null);
    setYsValid(null);
    setElongationValid(null);
    setTestedByValid(null);

    // Focus first editable field after reset
    setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 100);
  };

  return (
    <>
      <div className="tensile-header">
        <div className="tensile-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Tensile Test - Entry Form
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.dateOfInspection ? new Date(formData.dateOfInspection).toLocaleDateString('en-GB') : '-'}
        </div>
      </div>

      {/* Entry Form */}
      <form className="tensile-form-grid">
            <div className="tensile-form-group">
              <label>Item *</label>
              <input
                ref={firstFieldRef}
                type="text"
                name="item"
                value={formData.item}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: Steel Rod"
                className={
                  itemValid === null
                    ? ""
                    : itemValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Date Code *</label>
              <input
                type="text"
                name="dateCode"
                value={formData.dateCode}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: 6F25"
                className={
                  dateCodeValid === null
                    ? ""
                    : dateCodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Heat Code</label>
              <input
                type="text"
                name="heatCode"
                value={formData.heatCode}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: HC-001"
                className={
                  heatCodeValid === null
                    ? ""
                    : heatCodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Dia (mm)</label>
              <input
                type="number"
                name="dia"
                value={formData.dia}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 10.5"
                className={
                  diaValid === null
                    ? ""
                    : diaValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Lo (mm)</label>
              <input
                type="number"
                name="lo"
                value={formData.lo}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 50.0"
                className={
                  loValid === null
                    ? ""
                    : loValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Li (mm)</label>
              <input
                type="number"
                name="li"
                value={formData.li}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 52.5"
                className={
                  liValid === null
                    ? ""
                    : liValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Breaking Load (kN)</label>
              <input
                type="number"
                name="breakingLoad"
                value={formData.breakingLoad}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 45.5"
                className={
                  breakingLoadValid === null
                    ? ""
                    : breakingLoadValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Yield Load</label>
              <input
                type="number"
                name="yieldLoad"
                value={formData.yieldLoad}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 38.2"
                className={
                  yieldLoadValid === null
                    ? ""
                    : yieldLoadValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>UTS (N/mm²)</label>
              <input
                type="number"
                name="uts"
                value={formData.uts}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 550"
                className={
                  utsValid === null
                    ? ""
                    : utsValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>YS (N/mm²)</label>
              <input
                type="number"
                name="ys"
                value={formData.ys}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 460"
                className={
                  ysValid === null
                    ? ""
                    : ysValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Elongation (%)</label>
              <input
                type="number"
                name="elongation"
                value={formData.elongation}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                step="0.01"
                placeholder="e.g: 18.5"
                className={
                  elongationValid === null
                    ? ""
                    : elongationValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="tensile-form-group">
              <label>Remarks</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter any additional notes or observations..."
                maxLength={80}
                style={{
                  width: '100%',
                  resize: 'none'
                }}
                className=""
              />
            </div>

            <div className="tensile-form-group">
              <label>Tested By</label>
              <input
                type="text"
                name="testedBy"
                value={formData.testedBy}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g: John Doe"
                className={
                  testedByValid === null
                    ? ""
                    : testedByValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
      </form>

      <div className="tensile-submit-container">
        <button
          className="tensile-reset-btn"
          onClick={handleReset}
          type="button"
        >
          <RefreshCw size={18} />
          Reset Form
        </button>

        <div className="tensile-submit-right">
          {submitError && (
            <span className="tensile-submit-error">{submitError}</span>
          )}
          <button
            ref={submitButtonRef}
            className="tensile-submit-btn"
            type="button"
            onClick={handleSubmit}
            onKeyDown={handleSubmitKeyDown}
            disabled={submitLoading}
          >
            {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
            {submitLoading ? 'Saving...' : 'Submit Entry'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Tensile;