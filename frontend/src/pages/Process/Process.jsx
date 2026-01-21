import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, RefreshCw, FileText } from 'lucide-react';
import '../../styles/PageStyles/Process/Process.css';

export default function ProcessControl() {

  const [formData, setFormData] = useState({
    date: '', disa: '', partName: '', datecode: '', heatcode: '', quantityOfMoulds: '', metalCompositionC: '', metalCompositionSi: '',
    metalCompositionMn: '', metalCompositionP: '', metalCompositionS: '', metalCompositionMgFL: '',
    metalCompositionCr: '', metalCompositionCu: '', 
    pouringStartHour: '', pouringStartMinute: '',
    pouringEndHour: '', pouringEndMinute: '',
    pouringTemperature: '',
    ppCode: '', treatmentNo: '', fcNo: '', heatNo: '', conNo: '', 
    tappingHour: '', tappingMinute: '',
    correctiveAdditionC: '',
    correctiveAdditionSi: '', correctiveAdditionMn: '', correctiveAdditionS: '', correctiveAdditionCr: '',
    correctiveAdditionCu: '', correctiveAdditionSn: '', tappingWt: '', mg: '', resMgConvertor: '',
    recOfMg: '', streamInoculant: '', pTime: '', remarks: ''
  });


  const inputRefs = useRef({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isPrimarySaved, setIsPrimarySaved] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // VALIDATION STATES
  const [disaValid, setDisaValid] = useState(null);
  const [partNameValid, setPartNameValid] = useState(null);
  const [datecodeValid, setDatecodeValid] = useState(null);
  const [heatcodeValid, setHeatcodeValid] = useState(null);
  const [quantityOfMouldsValid, setQuantityOfMouldsValid] = useState(null);
  const [ppCodeValid, setPpCodeValid] = useState(null);
  const [treatmentNoValid, setTreatmentNoValid] = useState(null);
  const [fcNoValid, setFcNoValid] = useState(null);
  const [heatNoValid, setHeatNoValid] = useState(null);
  const [pouringTempValid, setPouringTempValid] = useState(null);
  const [pouringTimeValid, setPouringTimeValid] = useState(null);
  const [tappingWtValid, setTappingWtValid] = useState(null);
  const [streamInoculantValid, setStreamInoculantValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);

  // Set current date on mount
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      date: `${y}-${m}-${d}`
    }));
  }, []);

  // Check if all required fields are filled
  useEffect(() => {
    const allFieldsFilled = 
      formData.disa &&
      formData.partName?.trim() &&
      formData.datecode?.trim() &&
      formData.heatcode?.trim() &&
      formData.ppCode?.trim() &&
      formData.treatmentNo?.trim() &&
      formData.fcNo?.trim() &&
      formData.heatNo?.trim() &&
      formData.pouringTemperature &&
      formData.pouringStartHour &&
      formData.pouringStartMinute &&
      formData.pouringEndHour &&
      formData.pouringEndMinute &&
      formData.tappingWt &&
      formData.streamInoculant &&
      formData.remarks?.trim();
    
    setIsFormValid(!!allFieldsFilled);
  }, [formData]);

  const fieldOrder = ['disa', 'partName', 'datecode', 'heatcode', 'quantityOfMoulds', 'metalCompositionC', 'metalCompositionSi',
    'metalCompositionMn', 'metalCompositionP', 'metalCompositionS', 'metalCompositionMgFL', 'metalCompositionCu',
    'metalCompositionCr', 'pouringStartHour', 'pouringStartMinute', 'pouringEndHour', 'pouringEndMinute',
    'pouringTemperature', 'ppCode', 'treatmentNo', 'fcNo', 'heatNo', 'conNo',
    'tappingHour', 'tappingMinute', 'correctiveAdditionC', 'correctiveAdditionSi', 'correctiveAdditionMn', 'correctiveAdditionS',
    'correctiveAdditionCr', 'correctiveAdditionCu', 'correctiveAdditionSn', 'tappingWt', 'mg', 'resMgConvertor',
    'recOfMg', 'streamInoculant', 'pTime', 'remarks'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate DISA
    if (name === 'disa') {
      setDisaValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate Part Name
    if (name === 'partName') {
      setPartNameValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate Date Code - specific format (e.g., 6F25)
    if (name === 'datecode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      setDatecodeValid(
        value.trim() === "" ? null : pattern.test(value)
      );
      setFormData({...formData, [name]: value.toUpperCase()});
      return;
    }

    // Validate Heat Code
    if (name === 'heatcode') {
      setHeatcodeValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate Quantity of Moulds (number)
    if (name === 'quantityOfMoulds') {
      setQuantityOfMouldsValid(value.trim() === "" ? null : !isNaN(value) && parseFloat(value) >= 0);
    }

    // Validate PP Code
    if (name === 'ppCode') {
      setPpCodeValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate Treatment No
    if (name === 'treatmentNo') {
      setTreatmentNoValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate FC No
    if (name === 'fcNo') {
      setFcNoValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate Heat No
    if (name === 'heatNo') {
      setHeatNoValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    // Validate Pouring Temperature
    if (name === 'pouringTemperature') {
      setPouringTempValid(value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0);
    }

    // Validate Pouring Time (check when any time field changes)
    if (name.includes('pouring')) {
      const updatedData = {...formData, [name]: value};
      const hasStartTime = updatedData.pouringStartHour && updatedData.pouringStartMinute;
      const hasEndTime = updatedData.pouringEndHour && updatedData.pouringEndMinute;
      setPouringTimeValid((hasStartTime && hasEndTime) ? true : (value.trim() === "" && !hasStartTime && !hasEndTime) ? null : false);
    }

    // Validate Tapping Wt
    if (name === 'tappingWt') {
      setTappingWtValid(value.trim() === "" ? null : !isNaN(value) && parseFloat(value) > 0);
    }

    // Validate Stream Inoculant
    if (name === 'streamInoculant') {
      setStreamInoculantValid(value.trim() === "" ? null : !isNaN(value) && parseFloat(value) >= 0);
    }

    // Validate Remarks
    if (name === 'remarks') {
      setRemarksValid(value.trim() === "" ? null : value.trim().length > 0);
    }

    setFormData({...formData, [name]: value});
  };
  
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = fieldOrder.indexOf(field);
      
      // If on remarks field (last field), move to submit button
      if (field === 'remarks') {
        inputRefs.current.submitBtn?.focus();
      } else if (idx < fieldOrder.length - 1) {
        inputRefs.current[fieldOrder[idx + 1]]?.focus();
      }
    }
  };

  const handlePrimarySubmit = () => {
    // If already locked, unlock it
    if (isPrimarySaved) {
      setIsPrimarySaved(false);
      return;
    }

    // Validate required fields
    if (!formData.disa) {
      alert('Please fill in DISA');
      return;
    }

    // Lock primary field (disa) without saving to database
    // The actual save will happen when user clicks "Submit Entry"
    setIsPrimarySaved(true);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.disa) {
      alert('Please fill in DISA');
      return;
    }

    // Ensure primary data is locked first
    if (!isPrimarySaved) {
      alert('Please lock Primary data first before submitting.');
      return;
    }

    // Validate all required fields
    const requiredFields = [
      { value: formData.partName, name: 'Part Name' },
      { value: formData.datecode, name: 'Date Code' },
      { value: formData.heatcode, name: 'Heat Code' },
      { value: formData.ppCode, name: 'PP Code' },
      { value: formData.treatmentNo, name: 'Treatment No' },
      { value: formData.fcNo, name: 'F/C No' },
      { value: formData.heatNo, name: 'Heat No' },
      { value: formData.pouringTemperature, name: 'Pouring Temperature' },
      { value: formData.tappingWt, name: 'Tapping Wt' },
      { value: formData.streamInoculant, name: 'Stream Inoculant' },
      { value: formData.remarks, name: 'Remarks' }
    ];

    for (const field of requiredFields) {
      if (!field.value || field.value.toString().trim() === '') {
        alert(`Please fill in ${field.name}`);
        return;
      }
    }

    // Validate time of pouring
    if (!formData.pouringStartHour || !formData.pouringStartMinute || !formData.pouringEndHour || !formData.pouringEndMinute) {
      alert('Please fill in complete Time of Pouring (start and end time)');
      return;
    }

    try {
      setSubmitLoading(true);

      // Combine time fields into format: "HH:MM - HH:MM"
      let timeOfPouring = '';
      if (formData.pouringStartHour && formData.pouringStartMinute) {
        const startHour = String(formData.pouringStartHour).padStart(2, '0');
        const startMin = String(formData.pouringStartMinute).padStart(2, '0');
        timeOfPouring = `${startHour}:${startMin}`;
        
        if (formData.pouringEndHour && formData.pouringEndMinute) {
          const endHour = String(formData.pouringEndHour).padStart(2, '0');
          const endMin = String(formData.pouringEndMinute).padStart(2, '0');
          timeOfPouring += ` - ${endHour}:${endMin}`;
        }
      }

      // Combine tapping time fields into format: "HH:MM"
      let tappingTime = '';
      if (formData.tappingHour && formData.tappingMinute) {
        const hour = String(formData.tappingHour).padStart(2, '0');
        const min = String(formData.tappingMinute).padStart(2, '0');
        tappingTime = `${hour}:${min}`;
      }

      // Prepare payload without the separate time fields
      const { pouringStartHour, pouringStartMinute,
              pouringEndHour, pouringEndMinute,
              tappingHour, tappingMinute, ...payload } = formData;
      
      payload.timeOfPouring = timeOfPouring;
      payload.tappingTime = tappingTime;

      // Send all data (primary + other fields) combined to backend
      // Backend will find existing document by date+disa and update it, or create new one
      const response = await fetch('/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        alert('Process control entry saved successfully!');

        // Get current date
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const currentDate = `${y}-${m}-${d}`;

        // Reset all fields except primary data (date and disa)
        const resetData = { 
          date: currentDate
        };
        Object.keys(formData).forEach(key => {
          if (key !== 'date' && key !== 'disa') {
            resetData[key] = '';
          } else if (key === 'disa') {
            resetData[key] = formData.disa; // Keep disa
          }
        });
        setFormData(resetData);
        
        // Keep primary locked, focus on Part Name for next entry
        setTimeout(() => {
          inputRefs.current.partName?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error saving process control entry:', error);
      alert('Failed to save entry: ' + error.message);
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

const handleReset = () => {
    // Get current date
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const currentDate = `${y}-${m}-${d}`;

    // Reset all fields except primary data (date and disa)
    const resetData = { date: currentDate };
    Object.keys(formData).forEach(key => {
      if (key !== 'date' && key !== 'disa') {
        resetData[key] = '';
      } else if (key === 'disa') {
        resetData[key] = formData.disa; // Keep disa
      }
    });
    setFormData(resetData);
    // Keep primary locked if it was locked
    // Focus on Part Name for next entry
    setTimeout(() => {
      inputRefs.current.partName?.focus();
    }, 100);
  };

  return (
    <>

      <div className="process-header">
        <div className="process-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Entry Form
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '-'}
        </div>
      </div>

      <div className="process-form-grid">
            {/* Primary Data Section */}
            <div className="section-header primary-data-header">
              <h3>Primary Data</h3>
            </div>

            <div className="process-form-group">
              <label>DISA *</label>
              <select
                ref={el => inputRefs.current.disa = el}
                name="disa"
                value={formData.disa}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'disa')}
                disabled={isPrimarySaved}                className={
                  disaValid === null
                    ? ""
                    : disaValid
                    ? "valid-input"
                    : "invalid-input"
                }                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '2px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: isPrimarySaved ? '#f1f5f9' : '#ffffff',
                  color: '#1e293b',
                  cursor: isPrimarySaved ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Select DISA</option>
                <option value="DISA I">DISA I</option>
                <option value="DISA II">DISA II</option>
                <option value="DISA III">DISA III</option>
                <option value="DISA IV">DISA IV</option>
              </select>
            </div>

            <div className="process-form-group">
              <label>&nbsp;</label>
              <button
                className="process-lock-primary-btn"
                type="button"
                onClick={handlePrimarySubmit}
                disabled={!isPrimarySaved && !formData.disa}
              >
                {isPrimarySaved ? 'Unlock Primary' : 'Lock Primary'}
              </button>
            </div>

            {/* Divider line to separate primary data from other inputs */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group">
              <label>Part Name *</label>
              <input 
                ref={el => inputRefs.current.partName = el} 
                type="text" 
                name="partName" 
                value={formData.partName} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'partName')} 
                placeholder="e.g., ABC-123"
                className={
                  partNameValid === null
                    ? ""
                    : partNameValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Date Code *</label>
              <input 
                ref={el => inputRefs.current.datecode = el} 
                type="text" 
                name="datecode" 
                value={formData.datecode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'datecode')} 
                placeholder="e.g., 6F25"
                className={
                  datecodeValid === null
                    ? ""
                    : datecodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Heat Code *</label>
              <input 
                ref={el => inputRefs.current.heatcode = el} 
                type="text" 
                name="heatcode" 
                value={formData.heatcode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'heatcode')} 
                placeholder="e.g., HC-001"
                className={
                  heatcodeValid === null
                    ? ""
                    : heatcodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Qty. Of Moulds</label>
              <input 
                ref={el => inputRefs.current.quantityOfMoulds = el} 
                type="number" 
                name="quantityOfMoulds" 
                value={formData.quantityOfMoulds} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'quantityOfMoulds')} 
                placeholder="Enter quantity"
                className={
                  quantityOfMouldsValid === null
                    ? ""
                    : quantityOfMouldsValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="section-header metal-composition-header">
              <h3>Metal Composition (%)</h3>
            </div>
            {['C', 'Si', 'Mn', 'P', 'S', 'MgFL', 'Cu', 'Cr'].map(el => (
              <div className="process-form-group" key={el}>
                <label>{el === 'MgFL' ? 'Mg F/L' : el}</label>
                <input ref={r => inputRefs.current[`metalComposition${el}`] = r} type="number" name={`metalComposition${el}`} step="0.001" value={formData[`metalComposition${el}`]} onChange={handleChange} onKeyDown={e => handleKeyDown(e, `metalComposition${el}`)} placeholder="%" />
              </div>
            ))}

            {/* Divider line */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group time-range-group" style={{ gridColumn: '1 / -1' }}>
              <label>Time of Pouring (Range) *</label>
              <div className="time-range-container">
                <div className="time-inputs-group">
                  <input 
                    ref={el => inputRefs.current.pouringStartHour = el} 
                    type="number" 
                    name="pouringStartHour" 
                    value={formData.pouringStartHour} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringStartHour')} 
                    placeholder="HH" 
                    min="0" 
                    max="23"
                    style={{ width: '60px' }}
                  />
                  <span>:</span>
                  <input 
                    ref={el => inputRefs.current.pouringStartMinute = el} 
                    type="number" 
                    name="pouringStartMinute" 
                    value={formData.pouringStartMinute} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringStartMinute')} 
                    placeholder="MM" 
                    min="0" 
                    max="59"
                    style={{ width: '60px' }}
                  />
                </div>
                <span className="time-separator">-</span>
                <div className="time-inputs-group">
                  <input 
                    ref={el => inputRefs.current.pouringEndHour = el} 
                    type="number" 
                    name="pouringEndHour" 
                    value={formData.pouringEndHour} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringEndHour')} 
                    placeholder="HH" 
                    min="0" 
                    max="23"
                    style={{ width: '60px' }}
                  />
                  <span>:</span>
                  <input 
                    ref={el => inputRefs.current.pouringEndMinute = el} 
                    type="number" 
                    name="pouringEndMinute" 
                    value={formData.pouringEndMinute} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'pouringEndMinute')} 
                    placeholder="MM" 
                    min="0" 
                    max="59"
                    style={{ width: '60px' }}
                  />
                </div>
              </div>
            </div>

            <div className="process-form-group">
              <label>Pouring Temp (°C) *</label>
              <input 
                ref={el => inputRefs.current.pouringTemperature = el} 
                type="number" 
                name="pouringTemperature" 
                step="0.01" 
                value={formData.pouringTemperature} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'pouringTemperature')} 
                placeholder="e.g., 1450"
                className={
                  pouringTempValid === null
                    ? ""
                    : pouringTempValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>PP Code *</label>
              <input 
                ref={el => inputRefs.current.ppCode = el} 
                type="text" 
                name="ppCode" 
                value={formData.ppCode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'ppCode')} 
                placeholder="Enter PP code"
                className={
                  ppCodeValid === null
                    ? ""
                    : ppCodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Treatment No *</label>
              <input 
                ref={el => inputRefs.current.treatmentNo = el} 
                type="text" 
                name="treatmentNo" 
                value={formData.treatmentNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'treatmentNo')} 
                placeholder="Enter treatment no"
                className={
                  treatmentNoValid === null
                    ? ""
                    : treatmentNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>F/C No. *</label>
              <input 
                ref={el => inputRefs.current.fcNo = el} 
                type="text" 
                name="fcNo" 
                value={formData.fcNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'fcNo')} 
                placeholder="Enter F/C No."
                className={
                  fcNoValid === null
                    ? ""
                    : fcNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Heat No *</label>
              <input 
                ref={el => inputRefs.current.heatNo = el} 
                type="text" 
                name="heatNo" 
                value={formData.heatNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'heatNo')} 
                placeholder="Enter Heat No"
                className={
                  heatNoValid === null
                    ? ""
                    : heatNoValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Con No</label>
              <input ref={el => inputRefs.current.conNo = el} type="text" name="conNo" value={formData.conNo} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'conNo')} placeholder="Enter con no" />
            </div>

            <div className="process-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tapping Time</label>
              <div className="time-range-container">
                <div className="time-inputs-group">
                  <input 
                    ref={el => inputRefs.current.tappingHour = el} 
                    type="number" 
                    name="tappingHour" 
                    value={formData.tappingHour} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'tappingHour')} 
                    placeholder="HH" 
                    min="0" 
                    max="23"
                    style={{ width: '60px' }}
                  />
                  <span>:</span>
                  <input 
                    ref={el => inputRefs.current.tappingMinute = el} 
                    type="number" 
                    name="tappingMinute" 
                    value={formData.tappingMinute} 
                    onChange={handleChange} 
                    onKeyDown={e => handleKeyDown(e, 'tappingMinute')} 
                    placeholder="MM" 
                    min="0" 
                    max="59"
                    style={{ width: '60px' }}
                  />
                </div>
              </div>
            </div>

            <div className="section-header corrective-addition-header">
              <h3>Corrective Addition (Kgs)</h3>
            </div>
            {['C', 'Si', 'Mn', 'S', 'Cr', 'Cu', 'Sn'].map(el => (
              <div className="process-form-group" key={`add-${el}`}>
                <label>{el}</label>
                <input ref={r => inputRefs.current[`correctiveAddition${el}`] = r} type="number" name={`correctiveAddition${el}`} step="0.01" value={formData[`correctiveAddition${el}`]} onChange={handleChange} onKeyDown={e => handleKeyDown(e, `correctiveAddition${el}`)} placeholder="Kgs" />
              </div>
            ))}

            {/* Divider line */}
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '0.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

            <div className="process-form-group">
              <label>Tapping Wt (Kgs) *</label>
              <input 
                ref={el => inputRefs.current.tappingWt = el} 
                type="number" 
                name="tappingWt" 
                step="0.01" 
                value={formData.tappingWt} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'tappingWt')} 
                placeholder="Enter weight"
                className={
                  tappingWtValid === null
                    ? ""
                    : tappingWtValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>Mg (Kgs)</label>
              <input ref={el => inputRefs.current.mg = el} type="number" name="mg" step="0.01" value={formData.mg} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'mg')} placeholder="Enter Mg" />
            </div>

            <div className="process-form-group">
              <label>Res. Mg. Convertor (%)</label>
              <input ref={el => inputRefs.current.resMgConvertor = el} type="number" name="resMgConvertor" step="0.01" value={formData.resMgConvertor} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'resMgConvertor')} placeholder="Enter %" />
            </div>

            <div className="process-form-group">
              <label>Rec. Of Mg (%)</label>
              <input ref={el => inputRefs.current.recOfMg = el} type="number" name="recOfMg" step="0.01" value={formData.recOfMg} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'recOfMg')} placeholder="Enter %" />
            </div>

            <div className="process-form-group">
              <label>Stream Inoculant (gm/Sec) *</label>
              <input 
                ref={el => inputRefs.current.streamInoculant = el}
                type="number"
                name="streamInoculant"
                value={formData.streamInoculant}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'streamInoculant')}
                step="0.1"
                placeholder="e.g., 5.5"
                className={
                  streamInoculantValid === null
                    ? ""
                    : streamInoculantValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>

            <div className="process-form-group">
              <label>P.Time (sec)</label>
              <input 
                ref={el => inputRefs.current.pTime = el}
                type="number"
                name="pTime"
                value={formData.pTime}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'pTime')}
                step="0.1"
                placeholder="e.g., 120"
              />
            </div>

            <div className="process-form-group">
              <label>Remarks *</label>
              <input 
                type="text"
                ref={el => inputRefs.current.remarks = el} 
                name="remarks" 
                value={formData.remarks} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'remarks')}
                placeholder="Enter any additional notes..." 
                maxLength={80}
                className={
                  remarksValid === null
                    ? ""
                    : remarksValid
                    ? "valid-input"
                    : "invalid-input"
                }
                style={{
                  width: '100%',
                  resize: 'none'
                }}
              />
            </div>
      </div>

      <div className="process-submit-container">
        <button 
          className="process-reset-btn"
          onClick={handleReset}
          type="button"
        >
          <RefreshCw size={18} />
          Reset Form
        </button>
        <button 
          ref={el => inputRefs.current.submitBtn = el}
          className="process-submit-btn" 
          type="button"
          onClick={handleSubmit}
          onKeyDown={handleSubmitKeyDown}
          disabled={submitLoading || !isPrimarySaved || !isFormValid}
          title={
            !isPrimarySaved 
              ? 'Please lock Primary data first' 
              : !isFormValid 
              ? 'Please fill all required fields' 
              : 'Submit Entry'
          }
        >
          {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
          {submitLoading ? 'Saving...' : 'Submit Entry'}
        </button>
      </div>
    </>
  );
}