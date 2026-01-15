import React, { useState, useRef, useEffect } from 'react';
import { Save, Loader2, RefreshCw, FileText } from 'lucide-react';
import '../../styles/PageStyles/Process/Process.css';

export default function ProcessControl() {
  // Helper: display DD/MM/YYYY
  const formatDisplayDate = (iso) => {
    if (!iso || typeof iso !== 'string' || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const [formData, setFormData] = useState({
    date: '', disa: '', partName: '', datecode: '', heatcode: '', quantityOfMoulds: '', metalCompositionC: '', metalCompositionSi: '',
    metalCompositionMn: '', metalCompositionP: '', metalCompositionS: '', metalCompositionMgFL: '',
    metalCompositionCr: '', metalCompositionCu: '', timeOfPouring: '', pouringTemperature: '',
    ppCode: '', treatmentNo: '', fcNo: '', heatNo: '', conNo: '', tappingTime: '', correctiveAdditionC: '',
    correctiveAdditionSi: '', correctiveAdditionMn: '', correctiveAdditionS: '', correctiveAdditionCr: '',
    correctiveAdditionCu: '', correctiveAdditionSn: '', tappingWt: '', mg: '', resMgConvertor: '',
    recOfMg: '', streamInoculant: '', pTime: '', remarks: ''
  });


  const inputRefs = useRef({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isPrimarySaved, setIsPrimarySaved] = useState(false);
  const [dateLoading, setDateLoading] = useState(true);

  // Fetch current date from backend on mount
  useEffect(() => {
    const fetchCurrentDate = async () => {
      try {
        setDateLoading(true);
        const data = await api.get('/v1/system/current-date');

        if (data.success && data.data?.date) {
          setFormData(prev => ({
            ...prev,
            date: data.data.date
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
      } finally {
        setDateLoading(false);
      }
    };

    fetchCurrentDate();
  }, []);

  const fieldOrder = ['disa', 'partName', 'datecode', 'heatcode', 'quantityOfMoulds', 'metalCompositionC', 'metalCompositionSi',
    'metalCompositionMn', 'metalCompositionP', 'metalCompositionS', 'metalCompositionMgFL', 'metalCompositionCu',
    'metalCompositionCr', 'timeOfPouring', 'pouringTemperature', 'ppCode', 'treatmentNo', 'fcNo', 'heatNo', 'conNo',
    'tappingTime', 'correctiveAdditionC', 'correctiveAdditionSi', 'correctiveAdditionMn', 'correctiveAdditionS',
    'correctiveAdditionCr', 'correctiveAdditionCu', 'correctiveAdditionSn', 'tappingWt', 'mg', 'resMgConvertor',
    'recOfMg', 'streamInoculant', 'pTime', 'remarks'];

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      alert('Primary data unlocked. You can now modify DISA.');
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
    alert('Primary data locked. You can now fill other fields.');
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

    try {
      setSubmitLoading(true);

      // Send all data (primary + other fields) combined to backend
      // Backend will find existing document by date+disa and update it, or create new one
      const data = await api.post('/v1/process-records', formData);

      if (data.success) {
        alert('Process control entry saved successfully!');

        // Re-fetch current date from backend to ensure consistency
        const dateData = await api.get('/v1/system/current-date');
        const currentDate = dateData.success && dateData.data?.date ? dateData.data.date : formData.date;

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

  const handleReset = async () => {
    try {
      // Re-fetch current date from backend to ensure consistency
      const dateData = await api.get('/v1/system/current-date');
      const currentDate = dateData.success && dateData.data?.date ? dateData.data.date : formData.date;

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
    } catch (error) {
      console.error('Error resetting form:', error);
      // On error, just reset fields but keep current date
      const resetData = { date: formData.date };
      Object.keys(formData).forEach(key => {
        if (key !== 'date' && key !== 'disa') {
          resetData[key] = '';
        } else if (key === 'disa') {
          resetData[key] = formData.disa;
        }
      });
      setFormData(resetData);
      setTimeout(() => {
        inputRefs.current.partName?.focus();
      }, 100);
    }
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
          {dateLoading ? 'Loading date...' : `DATE : ${formatDisplayDate(formData.date)}`}
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
                disabled={isPrimarySaved}
                style={{
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
              <label>Part Name</label>
              <input 
                ref={el => inputRefs.current.partName = el} 
                type="text" 
                name="partName" 
                value={formData.partName} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'partName')} 
                placeholder="e.g., ABC-123" 
              />
            </div>

            <div className="process-form-group">
              <label>Date Code</label>
              <input 
                ref={el => inputRefs.current.datecode = el} 
                type="text" 
                name="datecode" 
                value={formData.datecode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'datecode')} 
                placeholder="e.g., 29-10-2025" 
              />
            </div>

            <div className="process-form-group">
              <label>Heat Code</label>
              <input 
                ref={el => inputRefs.current.heatcode = el} 
                type="text" 
                name="heatcode" 
                value={formData.heatcode} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'heatcode')} 
                placeholder="e.g., HC-001" 
              />
            </div>

            <div className="process-form-group">
              <label>Qty. Of Moulds</label>
              <input ref={el => inputRefs.current.quantityOfMoulds = el} type="number" name="quantityOfMoulds" value={formData.quantityOfMoulds} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'quantityOfMoulds')} placeholder="Enter quantity" />
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

            <div className="process-form-group">
              <label>Time of Pouring</label>
              <input ref={el => inputRefs.current.timeOfPouring = el} type="time" name="timeOfPouring" value={formData.timeOfPouring} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'timeOfPouring')} />
            </div>

            <div className="process-form-group">
              <label>Pouring Temp (°C)</label>
              <input ref={el => inputRefs.current.pouringTemperature = el} type="number" name="pouringTemperature" step="0.01" value={formData.pouringTemperature} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'pouringTemperature')} placeholder="e.g., 1450" />
            </div>

            <div className="process-form-group">
              <label>PP Code</label>
              <input ref={el => inputRefs.current.ppCode = el} type="text" name="ppCode" value={formData.ppCode} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'ppCode')} placeholder="Enter PP code" />
            </div>

            <div className="process-form-group">
              <label>Treatment No</label>
              <input ref={el => inputRefs.current.treatmentNo = el} type="text" name="treatmentNo" value={formData.treatmentNo} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'treatmentNo')} placeholder="Enter treatment no" />
            </div>

            <div className="process-form-group">
              <label>F/C No.</label>
              <input 
                ref={el => inputRefs.current.fcNo = el} 
                type="text" 
                name="fcNo" 
                value={formData.fcNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'fcNo')} 
                placeholder="Enter F/C No." 
              />
            </div>

            <div className="process-form-group">
              <label>Heat No</label>
              <input 
                ref={el => inputRefs.current.heatNo = el} 
                type="text" 
                name="heatNo" 
                value={formData.heatNo} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'heatNo')} 
                placeholder="Enter Heat No" 
              />
            </div>

            <div className="process-form-group">
              <label>Con No</label>
              <input ref={el => inputRefs.current.conNo = el} type="text" name="conNo" value={formData.conNo} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'conNo')} placeholder="Enter con no" />
            </div>

            <div className="process-form-group">
              <label>Tapping Time</label>
              <input ref={el => inputRefs.current.tappingTime = el} type="time" name="tappingTime" value={formData.tappingTime} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'tappingTime')} />
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
              <label>Tapping Wt (Kgs)</label>
              <input ref={el => inputRefs.current.tappingWt = el} type="number" name="tappingWt" step="0.01" value={formData.tappingWt} onChange={handleChange} onKeyDown={e => handleKeyDown(e, 'tappingWt')} placeholder="Enter weight" />
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
              <label>Stream Inoculant (gm/Sec)</label>
              <input 
                ref={el => inputRefs.current.streamInoculant = el}
                type="number"
                name="streamInoculant"
                value={formData.streamInoculant}
                onChange={handleChange}
                onKeyDown={e => handleKeyDown(e, 'streamInoculant')}
                step="0.1"
                placeholder="e.g., 5.5"
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
              <label>Remarks</label>
              <input 
                type="text"
                ref={el => inputRefs.current.remarks = el} 
                name="remarks" 
                value={formData.remarks} 
                onChange={handleChange} 
                onKeyDown={e => handleKeyDown(e, 'remarks')}
                placeholder="Enter any additional notes..." 
                maxLength={80}
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
          disabled={submitLoading || !isPrimarySaved}
          title={!isPrimarySaved ? 'Please save Primary data first' : 'Submit Entry'}
        >
          {submitLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={18} />}
          {submitLoading ? 'Saving...' : 'Submit Entry'}
        </button>
      </div>
    </>
  );
}