import React, { useState, useEffect } from 'react';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import '../../styles/PageStyles/Melting/CupolaHolderLogSheet.css';

const CupolaHolderLogSheet = () => {
  // Primary Data
  const [primaryData, setPrimaryData] = useState({
    date: '',
    shift: '',
    holderNumber: '',
    heatNo: ''
  });

  // Table Data
  const [table1, setTable1] = useState({
    cpc: '',
    mFeSl: '',
    feMn: '',
    sic: '',
    pureMg: '',
    cu: '',
    feCr: ''
  });

  const [table2, setTable2] = useState({
    actualTime: '',
    tappingTime: '',
    tappingTemp: '',
    metalKg: ''
  });

  const [table3, setTable3] = useState({
    disaLine: '',
    indFur: '',
    bailNo: '',
    tap: '',
    kw: ''
  });

  const [table4, setTable4] = useState({
    remarks: ''
  });

  // Combined formData for backward compatibility with existing logic
  const formData = {
    ...primaryData,
    ...table1,
    ...table2,
    ...table3,
    ...table4
  };

  const [submitLoading, setSubmitLoading] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);
  const [fetchingPrimary, setFetchingPrimary] = useState(false);
  const [primaryLocks, setPrimaryLocks] = useState({});

  // Check if there's data for the specific date+shift combination and lock shift dropdown
  const checkAndLockByDateAndShift = async (date, shift) => {
    if (!date || !shift) {
      // If date or shift is not set, unlock shift (unless primaryId exists)
      if (!primaryId) {
        setPrimaryLocks(prev => {
          const newLocks = { ...prev };
          delete newLocks.shift;
          return newLocks;
        });
      }
      return;
    }
    
    try {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const response = await api.get(`/v1/cupola-holder-logs?startDate=${dateStr}&endDate=${dateStr}`);
      
      if (response.success && response.data && response.data.length > 0) {
        // Check if any entry has the same date AND shift
        const hasDataForShift = response.data.some(entry => {
          const entryShift = entry.shift;
          return entryShift === shift;
        });
        
        if (hasDataForShift) {
          // Data exists for this date+shift combination, lock shift dropdown
          setPrimaryLocks(prev => ({
            ...prev,
            shift: true
          }));
        } else {
          // No data for this date+shift combination, unlock shift (unless primaryId exists)
          if (!primaryId) {
            setPrimaryLocks(prev => {
              const newLocks = { ...prev };
              delete newLocks.shift;
              return newLocks;
            });
          }
        }
      } else {
        // No data for this date, unlock shift (unless primaryId exists)
        if (!primaryId) {
          setPrimaryLocks(prev => {
            const newLocks = { ...prev };
            delete newLocks.shift;
            return newLocks;
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing data for date and shift:', error);
    }
  };

  // Check for existing data when date or shift changes
  useEffect(() => {
    if (primaryData.date && primaryData.shift) {
      checkAndLockByDateAndShift(primaryData.date, primaryData.shift);
    } else if (!primaryData.date || !primaryData.shift) {
      // Clear shift lock when date or shift is cleared (unless primaryId exists)
      if (!primaryId) {
        setPrimaryLocks(prev => {
          const newLocks = { ...prev };
          delete newLocks.shift;
          return newLocks;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryData.date, primaryData.shift]);

  // Fetch primary data when date, shift, or holderNumber changes
  useEffect(() => {
    if (primaryData.date && primaryData.shift && primaryData.holderNumber) {
      const dateStr = primaryData.date instanceof Date 
        ? primaryData.date.toISOString().split('T')[0] 
        : primaryData.date;
      fetchPrimaryData(dateStr, primaryData.shift, primaryData.holderNumber);
    } else if (!primaryData.date || !primaryData.shift || !primaryData.holderNumber) {
      // Clear primary ID and locks when primary fields are cleared
      setPrimaryId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryData.date, primaryData.shift, primaryData.holderNumber]);

  const handlePrimaryChange = (field, value) => {
    // Prevent changes to locked fields (except date)
    if (field !== 'date' && isPrimaryFieldLocked(field)) {
      return;
    }
    
    setPrimaryData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // When date changes, automatically fetch existing data
    if (field === 'date' && value) {
      const dateStr = value instanceof Date ? value.toISOString().split('T')[0] : value;
      // Fetch will be triggered by useEffect
    } else if (field === 'date' && !value) {
      // Clear primary ID and locks when date is cleared
      setPrimaryId(null);
      setPrimaryLocks({});
    }
  };

  const handleTableChange = (tableNum, field, value) => {
    const setters = {
      1: setTable1,
      2: setTable2,
      3: setTable3,
      4: setTable4
    };
    
    setters[tableNum](prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchPrimaryData = async (date, shift, holderNumber) => {
    if (!date || !shift || !holderNumber) return;
    
    setFetchingPrimary(true);
    try {
      // Format date for API (YYYY-MM-DD)
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const encodedShift = encodeURIComponent(shift);
      const encodedHolder = encodeURIComponent(holderNumber);
      const response = await api.get(`/v1/cupola-holder-logs/primary/${dateStr}/${encodedShift}/${encodedHolder}`);
      
      if (response.success && response.data) {
        // Populate primary data with fetched data
        setPrimaryData({
          date: response.data.date ? new Date(response.data.date).toISOString().split('T')[0] : date,
          shift: response.data.shift || shift,
          holderNumber: response.data.holderNumber || holderNumber,
          heatNo: response.data.heatNo || ''
        });
        setPrimaryId(response.data._id);
        
        // Lock all primary fields except date when data exists (date should remain changeable)
        // Since entry exists, lock shift and holderNumber (they are required fields)
        const locks = {};
        locks.shift = true; // Always lock shift when data exists
        locks.holderNumber = true; // Always lock holderNumber when data exists
        // Lock heatNo if it has a value
        if (response.data.heatNo !== undefined && response.data.heatNo !== null && response.data.heatNo !== '') {
          locks.heatNo = true;
        }
        setPrimaryLocks(locks);
      } else {
        // No data found, reset
        setPrimaryId(null);
        setPrimaryLocks({});
      }
    } catch (error) {
      console.error('Error fetching primary data:', error);
      // If error, assume no data exists
      setPrimaryId(null);
      setPrimaryLocks({});
    } finally {
      setFetchingPrimary(false);
    }
  };

  // Helper function to check if a primary field is locked
  const isPrimaryFieldLocked = (field) => {
    return primaryLocks[field] === true;
  };

  const resetPrimaryData = () => {
    if (!window.confirm('Are you sure you want to reset Primary data?')) return;
    setPrimaryData({
      date: '',
      shift: '',
      holderNumber: '',
      heatNo: ''
    });
    setPrimaryId(null);
    setPrimaryLocks({});
  };

  const handleEnterFocusNext = (e) => {
    if (e.key !== 'Enter') return;

    const target = e.target;
    if (!(target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA'))) return;

    const value = target.value != null ? String(target.value).trim() : '';
    if (value === '') return; // Only move when current field has a value

    e.preventDefault();
    const focusables = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(el => !el.disabled && el.type !== 'hidden' && el.offsetParent !== null);
    const idx = focusables.indexOf(document.activeElement);
    if (idx > -1 && idx < focusables.length - 1) {
      focusables[idx + 1].focus();
    }
  };

  const handlePrimarySubmit = async () => {
    // Validate required fields
    if (!primaryData.date || !primaryData.shift || !primaryData.holderNumber) {
      alert('Please fill in Date, Shift, and Holder Number');
      return;
    }

    // Save primary data to database
    setPrimaryLoading(true);
    try {
      const response = await api.post('/v1/cupola-holder-logs/primary', {
        primaryData: {
          date: primaryData.date,
          shift: primaryData.shift,
          holderNumber: primaryData.holderNumber,
          heatNo: primaryData.heatNo
        }
      });
      
      if (response.success) {
        setPrimaryId(response.data._id);
        // Update primary data with response data to ensure consistency
        setPrimaryData(prev => ({
          ...prev,
          date: response.data.date ? new Date(response.data.date).toISOString().split('T')[0] : prev.date,
          shift: response.data.shift || prev.shift,
          holderNumber: response.data.holderNumber || prev.holderNumber,
          heatNo: response.data.heatNo || prev.heatNo
        }));
        
        // After saving, check if data exists for this date+shift combination and lock shift accordingly
        // This will lock shift only if data exists for that specific date+shift combination
        await checkAndLockByDateAndShift(primaryData.date, primaryData.shift);
        
        // Lock all primary fields except date after saving
        // Shift lock is determined by checkAndLockByDateAndShift based on whether data exists for date+shift
        // Always lock holderNumber since it's a required field
        const locks = {};
        locks.shift = true; // Lock shift after saving
        locks.holderNumber = true; // Always lock holderNumber after saving
        // Lock heatNo if it has a value
        if (primaryData.heatNo !== undefined && primaryData.heatNo !== null && primaryData.heatNo !== '') {
          locks.heatNo = true;
        }
        setPrimaryLocks(locks);
        
        alert('Primary data saved successfully.');
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving primary data:', error);
      alert('Failed to save primary data. Please try again.');
    } finally {
      setPrimaryLoading(false);
    }
  };

  const handleAllTablesSubmit = async () => {
    // Ensure primary data exists (date is required)
    if (!primaryData.date) {
      alert('Please enter a date first.');
      return;
    }

    try {
      setSubmitLoading(true);
      
      // Combine all data (primary + tables)
      const allData = {
        ...primaryData,
        ...table1,
        ...table2,
        ...table3,
        ...table4
      };
      
      // Send all data (primary + other fields) combined to backend
      // Backend will find existing document by date+shift+holderNumber and update it, or create new one
      const data = await api.post('/v1/cupola-holder-logs', allData);
      if (data.success) {
        alert('All tables saved successfully!');
      }
    } catch (error) {
      console.error('Error saving cupola holder log:', error);
      alert('Failed to save entry: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAllTablesReset = () => {
    if (!window.confirm('Are you sure you want to reset all table entries?')) return;
    setTable1({
      cpc: '',
      mFeSl: '',
      feMn: '',
      sic: '',
      pureMg: '',
      cu: '',
      feCr: ''
    });
    setTable2({
      actualTime: '',
      tappingTime: '',
      tappingTemp: '',
      metalKg: ''
    });
    setTable3({
      disaLine: '',
      indFur: '',
      bailNo: '',
      tap: '',
      kw: ''
    });
    setTable4({
      remarks: ''
    });
  };

  return (
    <div className="page-wrapper" onKeyDown={handleEnterFocusNext}>

      <div className="cupola-holder-header">
        <div className="cupola-holder-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Cupola Holder Log Sheet - Entry Form
          </h2>
        </div>
      </div>

      {/* Primary Section */}
      <div>
        <h3 className="section-header">Primary Data</h3>
        
        <div className="cupola-holder-form-grid cupola-holder-table2-grid">
          <div className="cupola-holder-form-group">
            <label>Date *</label>
            <CustomDatePicker
              value={primaryData.date}
              onChange={(e) => handlePrimaryChange('date', e.target.value)}
              name="date"
              disabled={fetchingPrimary}
            />
            {fetchingPrimary && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>Loading...</span>}
          </div>

          <div className="cupola-holder-form-group">
            <label>Shift *</label>
            <select
              name="shift"
              value={primaryData.shift}
              onChange={(e) => handlePrimaryChange('shift', e.target.value)}
              onMouseDown={(e) => {
                if (isPrimaryFieldLocked('shift') || fetchingPrimary) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                if (isPrimaryFieldLocked('shift') || fetchingPrimary) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              disabled={isPrimaryFieldLocked('shift') || fetchingPrimary}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '2px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: isPrimaryFieldLocked('shift') ? '#f1f5f9' : '#ffffff',
                color: isPrimaryFieldLocked('shift') ? '#64748b' : '#1e293b',
                cursor: isPrimaryFieldLocked('shift') ? 'not-allowed' : 'pointer',
                opacity: isPrimaryFieldLocked('shift') ? 0.8 : 1,
                pointerEvents: isPrimaryFieldLocked('shift') ? 'none' : 'auto'
              }}
            >
              <option value="">Select Shift</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
            </select>
          </div>

          <div className="cupola-holder-form-group">
            <label>Holder Number *</label>
            <input
              type="text"
              name="holderNumber"
              value={primaryData.holderNumber}
              onChange={(e) => handlePrimaryChange('holderNumber', e.target.value)}
              placeholder="e.g: H001"
              disabled={isPrimaryFieldLocked('holderNumber') || fetchingPrimary}
              readOnly={isPrimaryFieldLocked('holderNumber')}
              style={{
                backgroundColor: isPrimaryFieldLocked('holderNumber') ? '#f1f5f9' : '#ffffff',
                cursor: isPrimaryFieldLocked('holderNumber') ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Heat No</label>
            <input
              type="text"
              name="heatNo"
              value={primaryData.heatNo}
              onChange={(e) => handlePrimaryChange('heatNo', e.target.value)}
              placeholder="e.g: H2024-001"
              disabled={isPrimaryFieldLocked('heatNo')}
              readOnly={isPrimaryFieldLocked('heatNo')}
              style={{
                backgroundColor: isPrimaryFieldLocked('heatNo') ? '#f1f5f9' : '#ffffff',
                cursor: isPrimaryFieldLocked('heatNo') ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {/* Empty placeholder to make 5 fields in the row */}
          <div className="cupola-holder-form-group" />
        </div>

        <div className="cupola-holder-submit-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="cupola-holder-reset-btn"
            type="button"
            onClick={resetPrimaryData}
            disabled={primaryLoading || fetchingPrimary}
          >
            <RotateCcw size={16} />
            Reset Primary
          </button>

          <button
            className="cupola-holder-submit-btn"
            type="button"
            onClick={handlePrimarySubmit}
            disabled={primaryLoading || fetchingPrimary || (!primaryData.date || !primaryData.shift || !primaryData.holderNumber)}
          >
            {primaryLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 1 */}
      <div>
        <h3 className="section-header">Table 1</h3>
        
        <div className="cupola-holder-form-grid">
          <div className="cupola-holder-form-group">
            <label>CPC</label>
            <input
              type="number"
              value={table1.cpc || ''}
              onChange={(e) => handleTableChange(1, 'cpc', e.target.value)}
              step="0.1"
              placeholder="0"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Fe Sl</label>
            <input
              type="number"
              value={table1.mFeSl || ''}
              onChange={(e) => handleTableChange(1, 'mFeSl', e.target.value)}
              step="0.1"
              placeholder="0"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Fe Mn</label>
            <input
              type="number"
              value={table1.feMn || ''}
              onChange={(e) => handleTableChange(1, 'feMn', e.target.value)}
              step="0.1"
              placeholder="0"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Sic</label>
            <input
              type="number"
              value={table1.sic || ''}
              onChange={(e) => handleTableChange(1, 'sic', e.target.value)}
              step="0.1"
              placeholder="0"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Pure Mg</label>
            <input
              type="number"
              value={table1.pureMg || ''}
              onChange={(e) => handleTableChange(1, 'pureMg', e.target.value)}
              step="0.01"
              placeholder="0"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Cu</label>
            <input
              type="number"
              value={table1.cu || ''}
              onChange={(e) => handleTableChange(1, 'cu', e.target.value)}
              step="0.01"
              placeholder="0"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Fe Cr</label>
            <input
              type="number"
              value={table1.feCr || ''}
              onChange={(e) => handleTableChange(1, 'feCr', e.target.value)}
              step="0.1"
              placeholder="0"
            />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 2 */}
      <div>
        <h3 className="section-header">Table 2</h3>
        
        <div className="cupola-holder-form-grid cupola-holder-table2-grid">
          <div className="cupola-holder-form-group">
            <label>Actual Time</label>
            <input
              type="time"
              value={table2.actualTime || ''}
              onChange={(e) => handleTableChange(2, 'actualTime', e.target.value)}
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Tapping Time</label>
            <input
              type="time"
              value={table2.tappingTime || ''}
              onChange={(e) => handleTableChange(2, 'tappingTime', e.target.value)}
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Temp (°C)</label>
            <input
              type="number"
              value={table2.tappingTemp || ''}
              onChange={(e) => handleTableChange(2, 'tappingTemp', e.target.value)}
              placeholder="e.g: 1500"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>Metal (KG)</label>
            <input
              type="number"
              value={table2.metalKg || ''}
              onChange={(e) => handleTableChange(2, 'metalKg', e.target.value)}
              step="0.1"
              placeholder="e.g: 2000"
            />
          </div>

          {/* Empty placeholder to make 5 fields in the row */}
          <div className="cupola-holder-form-group" />
        </div>
        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 3 */}
      <div>
        <h3 className="section-header">Table 3</h3>
        
        <div className="cupola-holder-form-grid">
          <div className="cupola-holder-form-group">
            <label>DISA LINE</label>
            <input
              type="text"
              value={table3.disaLine || ''}
              onChange={(e) => handleTableChange(3, 'disaLine', e.target.value)}
              placeholder="e.g: DISA-1"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>IND FUR</label>
            <input
              type="text"
              value={table3.indFur || ''}
              onChange={(e) => handleTableChange(3, 'indFur', e.target.value)}
              placeholder="e.g: IND-FUR-1"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>BAIL NO</label>
            <input
              type="text"
              value={table3.bailNo || ''}
              onChange={(e) => handleTableChange(3, 'bailNo', e.target.value)}
              placeholder="e.g: BAIL-001"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>TAP</label>
            <input
              type="text"
              value={table3.tap || ''}
              onChange={(e) => handleTableChange(3, 'tap', e.target.value)}
              placeholder="Enter TAP value"
            />
          </div>

          <div className="cupola-holder-form-group">
            <label>KW</label>
            <input
              type="number"
              value={table3.kw || ''}
              onChange={(e) => handleTableChange(3, 'kw', e.target.value)}
              step="0.1"
              placeholder="e.g: 2500"
            />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 4 */}
      <div>
        <h3 className="section-header">Table 4</h3>
        
        <div className="cupola-holder-form-grid">
          <div className="cupola-holder-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Remarks</label>
            <input
              type="text"
              value={table4.remarks || ''}
              onChange={(e) => handleTableChange(4, 'remarks', e.target.value)}
              placeholder="Enter any additional notes or observations..."
              maxLength={80}
              style={{
                width: '100%',
                maxWidth: '500px',
                resize: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* All Tables Submit and Reset Buttons */}
      <div className="cupola-holder-submit-container" style={{ marginTop: '2rem' }}>
        <button
          className="cupola-holder-reset-btn"
          type="button"
          onClick={handleAllTablesReset}
        >
          <RotateCcw size={16} />
          Reset All Tables
        </button>
        <button
          className="cupola-holder-submit-btn"
          type="button"
          onClick={handleAllTablesSubmit}
          disabled={submitLoading || !primaryData.date}
          title={!primaryData.date ? 'Please enter a date first' : 'Save All Tables'}
        >
          {submitLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving All Tables...
            </>
          ) : (
            <>
              <Save size={18} />
              Save All Tables
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CupolaHolderLogSheet;


