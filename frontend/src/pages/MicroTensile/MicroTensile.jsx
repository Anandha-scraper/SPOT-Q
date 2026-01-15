import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, RefreshCw, FileText } from 'lucide-react';
import { SuccessPopup } from '../../Components/PopUp';
import '../../styles/PageStyles/MicroTensile/MicroTensile.css';

const MicroTensile = () => {
  const inputRefs = useRef({});
  const [formData, setFormData] = useState({
    date: '',
    disa: [],
    item: '',
    itemSecond: '',
    dateCode: '',
    heatCode: '',
    barDia: '',
    gaugeLength: '',
    maxLoad: '',
    yieldLoad: '',
    tensileStrength: '',
    yieldStrength: '',
    elongation: '',
    remarks: '',
    testedBy: ''
  });

  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // VALIDATION STATES
  const [itemValid, setItemValid] = useState(null);
  const [itemSecondValid, setItemSecondValid] = useState(null);
  const [dateCodeValid, setDateCodeValid] = useState(null);
  const [heatCodeValid, setHeatCodeValid] = useState(null);
  const [barDiaValid, setBarDiaValid] = useState(null);
  const [gaugeLengthValid, setGaugeLengthValid] = useState(null);
  const [maxLoadValid, setMaxLoadValid] = useState(null);
  const [yieldLoadValid, setYieldLoadValid] = useState(null);
  const [tensileStrengthValid, setTensileStrengthValid] = useState(null);
  const [yieldStrengthValid, setYieldStrengthValid] = useState(null);
  const [elongationValid, setElongationValid] = useState(null);
  const [testedByValid, setTestedByValid] = useState(null);

  const disaOptions = ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'];

  // Field order for keyboard navigation
  const fieldOrder = ['disa', 'item', 'itemSecond', 'dateCode', 'heatCode', 'barDia', 'gaugeLength',
                     'maxLoad', 'yieldLoad', 'tensileStrength', 'yieldStrength', 'elongation', 'remarks', 'testedBy'];

  // Only these fields must be filled before moving on Enter
  const requiredFields = ['disa', 'item', 'dateCode', 'heatCode', 'barDia', 'gaugeLength',
                          'maxLoad', 'yieldLoad', 'tensileStrength', 'yieldStrength', 'elongation'];

  // Fetch current date from backend on mount
  useEffect(() => {
    const fetchCurrentDate = async () => {
      try {
        const data = await api.get('/v1/micro-tensile-tests/current-date');

        if (data.success && data.date) {
          setFormData(prev => ({
            ...prev,
            date: data.date
          }));
        }
      } catch (error) {
        console.error('Error fetching current date:', error);
        // Fallback to local date if backend fails
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setFormData(prev => ({
          ...prev,
          date: `${y}-${m}-${d}`
        }));
      }
    };

    fetchCurrentDate();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent programmatic/user changes to date
    if (name === 'date') return;

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
      setErrors(prev => ({ ...prev, [name]: false }));
      return;
    }

    // --- VALIDATE HEAT CODE: allow only digits in frontend ---
    if (name === 'heatCode') {
      // strip any non-digit characters so the field contains only numbers
      const cleaned = String(value).replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      setHeatCodeValid(cleaned === '' ? null : true);
      setErrors(prev => ({ ...prev, [name]: false }));
      return;
    }

    // --- VALIDATE BAR DIA: number ---
    if (name === 'barDia') {
      setBarDiaValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE GAUGE LENGTH: number ---
    if (name === 'gaugeLength') {
      setGaugeLengthValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE MAX LOAD: number ---
    if (name === 'maxLoad') {
      setMaxLoadValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE YIELD LOAD: number ---
    if (name === 'yieldLoad') {
      setYieldLoadValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE TENSILE STRENGTH: number ---
    if (name === 'tensileStrength') {
      setTensileStrengthValid(
        value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0
      );
    }

    // --- VALIDATE YIELD STRENGTH: number ---
    if (name === 'yieldStrength') {
      setYieldStrengthValid(
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

    // Handle itemSecond field
    if (name === 'itemSecond') {
      // Handle slash-separated input for itemSecond
      // Backend expects format: number/number/number (exactly 3 numbers, 2 slashes)
      const slashCount = (value.match(/\//g) || []).length;

      // Only allow numbers and slashes, max 2 slashes
      if (slashCount <= 2) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));

        // Validate format if value is not empty
        if (value.trim() !== '') {
          const parts = value.split('/');
          const isValid = parts.length === 3 && parts.every(p => p.trim() !== '' && !isNaN(p));
          setItemSecondValid(isValid);
        } else {
          setItemSecondValid(null); // Empty is okay (optional field)
        }
      }
      setErrors(prev => ({ ...prev, [name]: false }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleDisaChange = (disaValue) => {
    setFormData(prev => {
      const currentDisa = prev.disa || [];
      const isSelected = currentDisa.includes(disaValue);
      const newDisa = isSelected
        ? currentDisa.filter(d => d !== disaValue)
        : [...currentDisa, disaValue];

      return {
        ...prev,
        disa: newDisa
      };
    });
    setErrors(prev => ({ ...prev, disa: false }));
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Special handling for itemSecond field
      if (field === 'itemSecond') {
        const currentValue = formData.itemSecond;
        const slashCount = (currentValue.match(/\//g) || []).length;

        // If empty, move to next field
        if (!currentValue || currentValue.trim() === '') {
          const idx = fieldOrder.indexOf(field);
          if (idx < fieldOrder.length - 1) {
            inputRefs.current[fieldOrder[idx + 1]]?.focus();
          }
          return;
        }

        // Backend expects format: (number/number/number) - exactly 3 numbers, 2 slashes
        const parts = currentValue.split('/');
        const isValid = parts.length === 3 && parts.every(p => p.trim() !== '' && !isNaN(p));

        // If has content and less than 2 slashes, add slash
        if (slashCount < 2 && !currentValue.endsWith('/')) {
          setFormData(prev => ({
            ...prev,
            itemSecond: currentValue + '/'
          }));
          return;
        }

        // If has 2 slashes and valid format, or ends with slash after 2nd number, move to next field
        if (isValid || (slashCount === 2 && parts.length === 3)) {
          const idx = fieldOrder.indexOf(field);
          if (idx < fieldOrder.length - 1) {
            inputRefs.current[fieldOrder[idx + 1]]?.focus();
          }
          return;
        }
      }

      // If the current field is required, only proceed when it has a value
      if (requiredFields.includes(field)) {
        const isFilled = field === 'disa'
          ? (Array.isArray(formData.disa) && formData.disa.length > 0)
          : Boolean(formData[field]);

        if (!isFilled) {
          setErrors(prev => ({ ...prev, [field]: true }));
          return;
        }
      }

      const idx = fieldOrder.indexOf(field);
      if (idx < fieldOrder.length - 1) {
        inputRefs.current[fieldOrder[idx + 1]]?.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    // Clear any previous error
    setSubmitError('');

    // Validate required fields with validation states
    const requiredFields = [
      { name: 'item', value: formData.item, setState: setItemValid },
      { name: 'dateCode', value: formData.dateCode, setState: setDateCodeValid },
      { name: 'heatCode', value: formData.heatCode, setState: setHeatCodeValid },
      { name: 'barDia', value: formData.barDia, setState: setBarDiaValid },
      { name: 'gaugeLength', value: formData.gaugeLength, setState: setGaugeLengthValid },
      { name: 'maxLoad', value: formData.maxLoad, setState: setMaxLoadValid },
      { name: 'yieldLoad', value: formData.yieldLoad, setState: setYieldLoadValid },
      { name: 'tensileStrength', value: formData.tensileStrength, setState: setTensileStrengthValid },
      { name: 'yieldStrength', value: formData.yieldStrength, setState: setYieldStrengthValid },
      { name: 'elongation', value: formData.elongation, setState: setElongationValid },
      { name: 'testedBy', value: formData.testedBy, setState: setTestedByValid }
    ];

    const emptyFields = requiredFields.filter(field => !field.value || field.value.toString().trim() === '');
    const missing = emptyFields.map(f => f.name);

    if (!formData.disa || formData.disa.length === 0) {
      missing.push('disa');
    }

    if (missing.length > 0 || emptyFields.length > 0) {
      // Highlight all empty required fields in red
      emptyFields.forEach(field => {
        field.setState(false);
      });

      // Set old errors for compatibility
      const nextErrors = missing.reduce((acc, key) => { acc[key] = true; return acc; }, {});
      setErrors(nextErrors);

      // Set error message
      setSubmitError('Please fill in all required fields');

      // Clear error message after 3 seconds
      setTimeout(() => {
        setSubmitError('');
      }, 3000);

      const first = missing[0];
      if (first && first !== 'disa') {
        inputRefs.current[first]?.focus();
      }
      return;
    }

    // Validate itemSecond format if provided
    if (formData.itemSecond && formData.itemSecond.trim() !== '') {
      const parts = formData.itemSecond.split('/');
      const isValidFormat = parts.length === 3 && parts.every(p => p.trim() !== '' && !isNaN(p));

      if (!isValidFormat) {
        setItemSecondValid(false);
        setSubmitError('Item (Optional) must be in format: number/number/number (e.g., 343/34/56)');
        setTimeout(() => setSubmitError(''), 3000);
        inputRefs.current.itemSecond?.focus();
        return;
      }
    }

    try {
      setSubmitLoading(true);

      // Build item object expected by backend: { it1: string, it2?: '(234/345/456)' }
      const itemObj = {
        it1: formData.item
      };
      if (formData.itemSecond && formData.itemSecond.trim() !== '') {
        // Ensure itemSecond is wrapped in parentheses to match backend schema
        const cleaned = formData.itemSecond.trim();
        itemObj.it2 = cleaned.startsWith('(') && cleaned.endsWith(')') ? cleaned : `(${cleaned})`;
      }

      // Create payload with item object and remove itemSecond
      const payload = {
        ...formData,
        item: itemObj
      };
      delete payload.itemSecond;

      const data = await api.post('/v1/micro-tensile-tests', payload);

      if (data.success) {
        // Show success popup instead of alert
        setShowSuccessPopup(true);

        // Re-fetch current date from backend to ensure consistency
        const dateData = await api.get('/v1/micro-tensile-tests/current-date');
        const currentDate = dateData.success && dateData.date ? dateData.date : formData.date;

        // Reset all fields except DISA checklist and date
        setFormData({
          date: currentDate,
          disa: formData.disa,
          item: '',
          itemSecond: '',
          dateCode: '',
          heatCode: '',
          barDia: '',
          gaugeLength: '',
          maxLoad: '',
          yieldLoad: '',
          tensileStrength: '',
          yieldStrength: '',
          elongation: '',
          remarks: '',
          testedBy: ''
        });
        setErrors({});

        // Reset validation states
        setItemValid(null);
        setItemSecondValid(null);
        setDateCodeValid(null);
        setHeatCodeValid(null);
        setBarDiaValid(null);
        setGaugeLengthValid(null);
        setMaxLoadValid(null);
        setYieldLoadValid(null);
        setTensileStrengthValid(null);
        setYieldStrengthValid(null);
        setElongationValid(null);

        // Focus on Item for next entry
        setTimeout(() => {
          inputRefs.current.item?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error creating micro tensile test:', error);
      alert('Failed to create entry: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };


  const handleReset = async () => {
    try {
      // Re-fetch current date from backend to ensure consistency
      const dateData = await api.get('/v1/micro-tensile-tests/current-date');
      const currentDate = dateData.success && dateData.date ? dateData.date : formData.date;

      setFormData({
        date: currentDate,
        disa: formData.disa,
        item: '',
        itemSecond: '',
        dateCode: '',
        heatCode: '',
        barDia: '',
        gaugeLength: '',
        maxLoad: '',
        yieldLoad: '',
        tensileStrength: '',
        yieldStrength: '',
        elongation: '',
        remarks: '',
        testedBy: ''
      });
      setErrors({});

      // Reset validation states
      setItemValid(null);
      setItemSecondValid(null);
      setDateCodeValid(null);
      setHeatCodeValid(null);
      setBarDiaValid(null);
      setGaugeLengthValid(null);
      setMaxLoadValid(null);
      setYieldLoadValid(null);
      setTensileStrengthValid(null);
      setYieldStrengthValid(null);
      setElongationValid(null);
    } catch (error) {
      console.error('Error resetting form:', error);
      // On error, just reset fields but keep current date and DISA
      setFormData({
        date: formData.date,
        disa: formData.disa,
        item: '',
        itemSecond: '',
        dateCode: '',
        heatCode: '',
        barDia: '',
        gaugeLength: '',
        maxLoad: '',
        yieldLoad: '',
        tensileStrength: '',
        yieldStrength: '',
        elongation: '',
        remarks: '',
        testedBy: ''
      });
      setErrors({});

      // Reset validation states
      setItemValid(null);
      setItemSecondValid(null);
      setDateCodeValid(null);
      setHeatCodeValid(null);
      setBarDiaValid(null);
      setGaugeLengthValid(null);
      setMaxLoadValid(null);
      setYieldLoadValid(null);
      setTensileStrengthValid(null);
      setYieldStrengthValid(null);
      setElongationValid(null);
    }
  };

  return (
    <>
      <div className="microtensile-header">
        <div className="microtensile-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Micro Tensile Test - Entry Form
          </h2>
        </div>
      </div>

      <div className="microtensile-form-grid">
            <div className={`microtensile-form-group ${errors.disa ? 'microtensile-error-outline' : ''}`} style={{ gridColumn: 'span 2' }}>
              <label>DISA <span className="required-indicator">*</span></label>
              <div className="microtensile-disa-checklist">
                {disaOptions.map((option) => (
                  <label key={option} className="microtensile-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.disa?.includes(option) || false}
                      onChange={() => handleDisaChange(option)}
                      onKeyDown={(e) => handleKeyDown(e, 'disa')}
                      className="microtensile-checkbox"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Force next items to new line */}
            <div style={{ gridColumn: '1 / -1', height: 0 }}></div>

            <div className="microtensile-form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={`${errors.item ? 'microtensile-error-outline' : ''}`}>
                  <label>Item <span className="required-indicator">*</span></label>
                  <input
                    ref={el => inputRefs.current.item = el}
                    type="text"
                    name="item"
                    value={formData.item}
                    onChange={handleChange}
                    onKeyDown={e => handleKeyDown(e, 'item')}
                    placeholder="e.g: Volvo Bkt 234"
                    className={
                      itemValid === null
                        ? ""
                        : itemValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>
                <div>
                  <label>Item (Optional)</label>
                  <input
                    ref={el => inputRefs.current.itemSecond = el}
                    type="text"
                    name="itemSecond"
                    value={formData.itemSecond}
                    onChange={handleChange}
                    onKeyDown={e => handleKeyDown(e, 'itemSecond')}
                    placeholder="e.g: 234/4564/4334"
                    className={
                      itemSecondValid === null
                        ? ""
                        : itemSecondValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>
              </div>
            </div>

            <div className={`microtensile-form-group ${errors.dateCode ? 'microtensile-error-outline' : ''}`}>
              <label>Date Code <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.dateCode = el}
                type="text"
                name="dateCode"
                value={formData.dateCode}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'dateCode')}
                placeholder="e.g: 5E04"
                className={
                  dateCodeValid === null
                    ? ""
                    : dateCodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.heatCode ? 'microtensile-error-outline' : ''}`}>
              <label>Heat Code <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.heatCode = el}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                name="heatCode"
                value={formData.heatCode}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'heatCode')}
                placeholder="e.g: 1"
                className={
                  heatCodeValid === null
                    ? ""
                    : heatCodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.barDia ? 'microtensile-error-outline' : ''}`}>
              <label>Bar Dia (mm) <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.barDia = el}
                type="number"
                name="barDia"
                value={formData.barDia}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'barDia')}
                step="0.01"
                placeholder="e.g: 6.0"
                className={
                  barDiaValid === null
                    ? ""
                    : barDiaValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.gaugeLength ? 'microtensile-error-outline' : ''}`}>
              <label>Gauge Length (mm) <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.gaugeLength = el}
                type="number"
                name="gaugeLength"
                value={formData.gaugeLength}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'gaugeLength')}
                step="0.01"
                placeholder="e.g: 30.0"
                className={
                  gaugeLengthValid === null
                    ? ""
                    : gaugeLengthValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.maxLoad ? 'microtensile-error-outline' : ''}`}>
              <label>Max Load (Kgs) or KN <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.maxLoad = el}
                type="number"
                name="maxLoad"
                value={formData.maxLoad}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'maxLoad')}
                step="0.01"
                placeholder="e.g: 1560"
                className={
                  maxLoadValid === null
                    ? ""
                    : maxLoadValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.yieldLoad ? 'microtensile-error-outline' : ''}`}>
              <label>Yield Load (Kgs) or KN <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.yieldLoad = el}
                type="number"
                name="yieldLoad"
                value={formData.yieldLoad}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'yieldLoad')}
                step="0.01"
                placeholder="e.g: 1290"
                className={
                  yieldLoadValid === null
                    ? ""
                    : yieldLoadValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.tensileStrength ? 'microtensile-error-outline' : ''}`}>
              <label>Tensile Strength (Kg/mm² or Mpa) <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.tensileStrength = el}
                type="number"
                name="tensileStrength"
                value={formData.tensileStrength}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'tensileStrength')}
                step="0.01"
                placeholder="e.g: 550"
                className={
                  tensileStrengthValid === null
                    ? ""
                    : tensileStrengthValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.yieldStrength ? 'microtensile-error-outline' : ''}`}>
              <label>Yield Strength (Kg/mm² or Mpa) <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.yieldStrength = el}
                type="number"
                name="yieldStrength"
                value={formData.yieldStrength}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'yieldStrength')}
                step="0.01"
                placeholder="e.g: 455"
                className={
                  yieldStrengthValid === null
                    ? ""
                    : yieldStrengthValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className={`microtensile-form-group ${errors.elongation ? 'microtensile-error-outline' : ''}`}>
              <label>Elongation % <span className="required-indicator">*</span></label>
              <input
                ref={el => inputRefs.current.elongation = el}
                type="number"
                name="elongation"
                value={formData.elongation}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'elongation')}
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

            <div className="microtensile-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Remarks</label>
              <input
                type="text"
                ref={el => inputRefs.current.remarks = el}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'remarks')}
                placeholder="Enter any additional notes or observations..."
                maxLength={80}
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  resize: 'none'
                }}
              />
            </div>

            <div className="microtensile-form-group">
              <label>Tested By</label>
              <input
                ref={el => inputRefs.current.testedBy = el}
                type="text"
                name="testedBy"
                value={formData.testedBy}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'testedBy')}
                placeholder="e.g: John Smith"
              />
            </div>
          </div>

      <div className="microtensile-submit-container">
        <button
          className="microtensile-reset-btn"
          onClick={handleReset}
          type="button"
        >
          <RefreshCw size={18} />
          Reset Form
        </button>

        <div className="microtensile-submit-right">
          {submitError && (
            <span className="microtensile-submit-error">{submitError}</span>
          )}
          <button
            className="microtensile-submit-btn"
            type="button"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
            {submitLoading ? 'Saving...' : 'Submit Entry'}
          </button>
        </div>
      </div>

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        departmentName="Micro Tensile"
        message="Micro Tensile Entry saved"
        autoClose={true}
        autoCloseDelay={2000}
      />
    </>
  );
};

export default MicroTensile;
