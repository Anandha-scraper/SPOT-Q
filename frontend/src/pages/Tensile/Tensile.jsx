import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SubmitButton, ResetButton } from '../../Components/Buttons';
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
  const [submitAttempted, setSubmitAttempted] = useState(false);

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
      if (value.trim() === "") {
        // Only show red if submit was attempted, otherwise neutral
        setItemValid(submitAttempted ? false : null);
      } else {
        setItemValid(value.trim().length > 0);
      }
    }

    // --- VALIDATE DATE CODE: specific format (e.g., 6F25) ---
    if (name === 'dateCode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (value.trim() === "") {
        // Only show red if submit was attempted, otherwise neutral
        setDateCodeValid(submitAttempted ? false : null);
      } else {
        setDateCodeValid(pattern.test(value));
      }
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

    // --- VALIDATE HEAT CODE: only numbers ---
    if (name === 'heatCode') {
      const numericPattern = /^\d+$/;
      if (value.trim() === "") {
        setHeatCodeValid(null); // Optional field, always neutral when empty
      } else {
        setHeatCodeValid(numericPattern.test(value));
      }
    }

    // --- VALIDATE DIA: number ---
    if (name === 'dia') {
      if (value.trim() === "") {
        setDiaValid(null); // Optional field, always neutral when empty
      } else {
        setDiaValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE LO: number ---
    if (name === 'lo') {
      if (value.trim() === "") {
        setLoValid(null); // Optional field, always neutral when empty
      } else {
        setLoValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE LI: number ---
    if (name === 'li') {
      if (value.trim() === "") {
        setLiValid(null); // Optional field, always neutral when empty
      } else {
        setLiValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE BREAKING LOAD: number ---
    if (name === 'breakingLoad') {
      if (value.trim() === "") {
        setBreakingLoadValid(null); // Optional field, always neutral when empty
      } else {
        setBreakingLoadValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE YIELD LOAD: number ---
    if (name === 'yieldLoad') {
      if (value.trim() === "") {
        setYieldLoadValid(null); // Optional field, always neutral when empty
      } else {
        setYieldLoadValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE UTS: number ---
    if (name === 'uts') {
      if (value.trim() === "") {
        setUtsValid(null); // Optional field, always neutral when empty
      } else {
        setUtsValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE YS: number ---
    if (name === 'ys') {
      if (value.trim() === "") {
        setYsValid(null); // Optional field, always neutral when empty
      } else {
        setYsValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE ELONGATION: number between 0-100 ---
    if (name === 'elongation') {
      if (value.trim() === "") {
        setElongationValid(null); // Optional field, always neutral when empty
      } else {
        const num = parseFloat(value);
        setElongationValid(!isNaN(num) && num >= 0 && num <= 100);
      }
    }

    // --- VALIDATE TESTED BY: optional text field ---
    if (name === 'testedBy') {
      if (value.trim() === "") {
        setTestedByValid(null); // Optional field, always neutral when empty
      } else {
        setTestedByValid(value.trim().length > 0);
      }
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
    setSubmitAttempted(true);

    // Validate ALL fields - turn empty fields red on submit
    let hasErrors = false;
    const errors = {};

    // Required fields validation
    if (!formData.item || formData.item.trim() === '') {
      setItemValid(false);
      errors.item = 'Item is required';
      hasErrors = true;
    } else if (formData.item.trim().length > 0) {
      setItemValid(true);
    }

    if (!formData.dateCode || formData.dateCode.trim() === '') {
      setDateCodeValid(false);
      errors.dateCode = 'Date Code is required';
      hasErrors = true;
    } else {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (!pattern.test(formData.dateCode)) {
        setDateCodeValid(false);
        errors.dateCode = 'Invalid format (e.g., 6F25)';
        hasErrors = true;
      } else {
        setDateCodeValid(true);
      }
    }

    // All other fields - mark as invalid if empty OR if they have invalid data
    if (!formData.heatCode || formData.heatCode.trim() === '') {
      setHeatCodeValid(false);
      hasErrors = true;
    } else {
      const numericPattern = /^\d+$/;
      if (!numericPattern.test(formData.heatCode)) {
        setHeatCodeValid(false);
        hasErrors = true;
      } else {
        setHeatCodeValid(true);
      }
    }

    if (!formData.dia || formData.dia.toString().trim() === '') {
      setDiaValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.dia) || parseFloat(formData.dia) <= 0) {
        setDiaValid(false);
        hasErrors = true;
      } else {
        setDiaValid(true);
      }
    }

    if (!formData.lo || formData.lo.toString().trim() === '') {
      setLoValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.lo) || parseFloat(formData.lo) <= 0) {
        setLoValid(false);
        hasErrors = true;
      } else {
        setLoValid(true);
      }
    }

    if (!formData.li || formData.li.toString().trim() === '') {
      setLiValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.li) || parseFloat(formData.li) <= 0) {
        setLiValid(false);
        hasErrors = true;
      } else {
        setLiValid(true);
      }
    }

    if (!formData.breakingLoad || formData.breakingLoad.toString().trim() === '') {
      setBreakingLoadValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.breakingLoad) || parseFloat(formData.breakingLoad) <= 0) {
        setBreakingLoadValid(false);
        hasErrors = true;
      } else {
        setBreakingLoadValid(true);
      }
    }

    if (!formData.yieldLoad || formData.yieldLoad.toString().trim() === '') {
      setYieldLoadValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.yieldLoad) || parseFloat(formData.yieldLoad) <= 0) {
        setYieldLoadValid(false);
        hasErrors = true;
      } else {
        setYieldLoadValid(true);
      }
    }

    if (!formData.uts || formData.uts.toString().trim() === '') {
      setUtsValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.uts) || parseFloat(formData.uts) <= 0) {
        setUtsValid(false);
        hasErrors = true;
      } else {
        setUtsValid(true);
      }
    }

    if (!formData.ys || formData.ys.toString().trim() === '') {
      setYsValid(false);
      hasErrors = true;
    } else {
      if (isNaN(formData.ys) || parseFloat(formData.ys) <= 0) {
        setYsValid(false);
        hasErrors = true;
      } else {
        setYsValid(true);
      }
    }

    if (!formData.elongation || formData.elongation.toString().trim() === '') {
      setElongationValid(false);
      hasErrors = true;
    } else {
      const num = parseFloat(formData.elongation);
      if (isNaN(num) || num < 0 || num > 100) {
        setElongationValid(false);
        hasErrors = true;
      } else {
        setElongationValid(true);
      }
    }

    // Tested By is optional - only validate if it has a value
    if (formData.testedBy && formData.testedBy.trim() !== '') {
      if (formData.testedBy.trim().length === 0) {
        setTestedByValid(false);
        hasErrors = true;
      } else {
        setTestedByValid(true);
      }
    }

    if (hasErrors) {
      setValidationErrors(errors);
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
        setSubmitAttempted(false);

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
      setSubmitAttempted(false);
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
      setSubmitAttempted(false);
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
                type="number"
                name="heatCode"
                value={formData.heatCode}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter number only"
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

            <div className="tensile-form-group">
              <label>Remarks</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter any additional notes..."
                maxLength={200}
              />
            </div>
      </form>

      <div className="tensile-submit-container">
        <ResetButton onClick={handleReset}>
          Reset Form
        </ResetButton>

        <div className="tensile-submit-right">
          {submitError && (
            <span className="tensile-submit-error">{submitError}</span>
          )}
          <SubmitButton
            onClick={handleSubmit}
            disabled={submitLoading}
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

export default Tensile;