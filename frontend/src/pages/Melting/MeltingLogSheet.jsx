import React, { useState, useEffect } from 'react';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import '../../styles/PageStyles/Melting/MeltingLogSheet.css';

const MeltingLogSheet = () => {
  // Primary: Date, Shift, Furnace No., Panel, Cumulative Liquid metal, Final KWHr, Initial KWHr, Total Units, Cumulative Units
  const [primaryData, setPrimaryData] = useState({
    date: '',
    shift: '',
    furnaceNo: '',
    panel: '',
    cumulativeLiquidMetal: '',
    finalKWHr: '',
    initialKWHr: '',
    totalUnits: '',
    cumulativeUnits: ''
  });
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);
  const [fetchingPrimary, setFetchingPrimary] = useState(false);
  const [primaryLocks, setPrimaryLocks] = useState({});

  // Validation flag and helper for primary section
  const [primarySubmitted, setPrimarySubmitted] = useState(false);
  const classFor = (value, submitted, required = false) => {
    const has = value !== undefined && value !== null && String(value).trim() !== '';
    if (has) return 'melting-success-outline';
    if (submitted && required) return 'melting-error-outline';
    return '';
  };

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
      const res = await fetch(`http://localhost:5000/api/v1/melting-logs?startDate=${dateStr}&endDate=${dateStr}`, { credentials: 'include' });
      const response = await res.json();
      
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
  
  const [table1, setTable1] = useState({
    heatNo: '',
    grade: '',
    chargingTime: '',
    ifBath: '',
    liquidMetalPressPour: '',
    liquidMetalHolder: '',
    sgMsSteel: '',
    greyMsSteel: '',
    returnsSg: '',
    gl: '',
    pigIron: '',
    borings: '',
    finalBath: ''
  });
  const [table2, setTable2] = useState({
    charCoal: '',
    cpcFur: '',
    cpcLc: '',
    siliconCarbideFur: '',
    ferrosiliconFur: '',
    ferrosiliconLc: '',
    ferroManganeseFur: '',
    ferroManganeseLc: '',
    cu: '',
    cr: '',
    pureMg: '',
    ironPyrite: ''
  });
  const [table3, setTable3] = useState({
    labCoinTime: '',
    labCoinTempC: '',
    deslagingTimeFrom: '',
    deslagingTimeTo: '',
    metalReadyTime: '',
    waitingForTappingFrom: '',
    waitingForTappingTo: '',
    reason: ''
  });
  const [table4, setTable4] = useState({
    time: '',
    tempCSg: '',
    tempCGrey: '',
    directFurnace: '',
    holderToFurnace: '',
    furnaceToHolder: '',
    disaNo: '',
    item: ''
  });
  const [table5, setTable5] = useState({
    furnace1Kw: '',
    furnace1A: '',
    furnace1V: '',
    furnace2Kw: '',
    furnace2A: '',
    furnace2V: '',
    furnace3Kw: '',
    furnace3A: '',
    furnace3V: '',
    furnace4Hz: '',
    furnace4Gld: '',
    furnace4KwHr: ''
  });

  const [loadingStates, setLoadingStates] = useState({
    table1: false,
    table2: false,
    table3: false,
    table4: false,
    table5: false
  });

  const handleTableChange = (tableNum, field, value) => {
    const setters = {
      1: setTable1,
      2: setTable2,
      3: setTable3,
      4: setTable4,
      5: setTable5
    };
    
    setters[tableNum](prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTableSubmit = async (tableNum) => {
    // Ensure primary data exists first
    if (!primaryData.date) {
      alert('Please enter a date first.');
      return;
    }

    const tables = { 1: table1, 2: table2, 3: table3, 4: table4, 5: table5 };
    const tableData = tables[tableNum];
    
    setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: true }));
    
    try {
      // Send primary data + table data together
      const res = await fetch(`http://localhost:5000/api/v1/melting-logs/table${tableNum}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({
        tableNum,
        primaryData: primaryData,
        data: tableData
      }) });
      const response = await res.json();
      
      if (response.success) {
        alert(`Table ${tableNum} saved successfully!`);
      } else {
        alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error(`Error saving table ${tableNum}:`, error);
      alert(`Failed to save table ${tableNum}. Please try again.`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: false }));
    }
  };

  const handleAllTablesSubmit = async () => {
    // Ensure primary data exists first
    if (!primaryData.date) {
      alert('Please enter a date first.');
      return;
    }

    // Set all tables as loading
    setLoadingStates({
      table1: true,
      table2: true,
      table3: true,
      table4: true,
      table5: true
    });

    try {
      // Submit all tables in parallel
      const promises = [
        api.post('/v1/melting-logs/table1', {
          tableNum: 1,
          primaryData: primaryData,
          data: table1
        }),
        api.post('/v1/melting-logs/table2', {
          tableNum: 2,
          primaryData: primaryData,
          data: table2
        }),
        api.post('/v1/melting-logs/table3', {
          tableNum: 3,
          primaryData: primaryData,
          data: table3
        }),
        api.post('/v1/melting-logs/table4', {
          tableNum: 4,
          primaryData: primaryData,
          data: table4
        }),
        api.post('/v1/melting-logs/table5', {
          tableNum: 5,
          primaryData: primaryData,
          data: table5
        })
      ];

      const results = await Promise.all(promises);
      
      // Check if all succeeded
      const allSuccess = results.every(response => response.success);
      
      if (allSuccess) {
        alert('All tables saved successfully!');
      } else {
        const failedTables = results
          .map((response, index) => response.success ? null : index + 1)
          .filter(num => num !== null);
        alert(`Some tables failed to save: ${failedTables.join(', ')}`);
      }
    } catch (error) {
      console.error('Error saving tables:', error);
      alert('Failed to save tables. Please try again.');
    } finally {
      setLoadingStates({
        table1: false,
        table2: false,
        table3: false,
        table4: false,
        table5: false
      });
    }
  };

  const handleAllTablesReset = () => {
    if (!window.confirm('Are you sure you want to reset all table entries?')) return;
    resetTable1();
    resetTable2();
    resetTable3();
    resetTable4();
    resetTable5();
  };

  const fetchPrimaryData = async (date) => {
    if (!date) return;
    
    setFetchingPrimary(true);
    try {
      // Format date for API (YYYY-MM-DD)
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const response = await api.get(`/v1/melting-logs/primary/${dateStr}`);
      
      if (response.success && response.data) {
        // Populate form with fetched data
        setPrimaryData({
          date: response.data.date ? new Date(response.data.date).toISOString().split('T')[0] : date,
          shift: response.data.shift || '',
          furnaceNo: response.data.furnaceNo || '',
          panel: response.data.panel || '',
          cumulativeLiquidMetal: response.data.cumulativeLiquidMetal || '',
          finalKWHr: response.data.finalKWHr || '',
          initialKWHr: response.data.initialKWHr || '',
          totalUnits: response.data.totalUnits || '',
          cumulativeUnits: response.data.cumulativeUnits || ''
        });
        setPrimaryId(response.data._id);
        
        // Lock all primary fields except date (date should remain changeable)
        const locks = {};
        if (response.data.shift !== undefined && response.data.shift !== null && response.data.shift !== '') locks.shift = true;
        if (response.data.furnaceNo !== undefined && response.data.furnaceNo !== null && response.data.furnaceNo !== '') locks.furnaceNo = true;
        if (response.data.panel !== undefined && response.data.panel !== null && response.data.panel !== '') locks.panel = true;
        if (response.data.cumulativeLiquidMetal !== undefined && response.data.cumulativeLiquidMetal !== null && response.data.cumulativeLiquidMetal !== 0) locks.cumulativeLiquidMetal = true;
        if (response.data.finalKWHr !== undefined && response.data.finalKWHr !== null && response.data.finalKWHr !== 0) locks.finalKWHr = true;
        if (response.data.initialKWHr !== undefined && response.data.initialKWHr !== null && response.data.initialKWHr !== 0) locks.initialKWHr = true;
        if (response.data.totalUnits !== undefined && response.data.totalUnits !== null && response.data.totalUnits !== 0) locks.totalUnits = true;
        if (response.data.cumulativeUnits !== undefined && response.data.cumulativeUnits !== null && response.data.cumulativeUnits !== 0) locks.cumulativeUnits = true;
        setPrimaryLocks(locks);
      } else {
        // No data found for this date, reset
        setPrimaryId(null);
        setPrimaryLocks({});
      }
    } catch (error) {
      console.error('Error fetching primary data:', error);
      // If error, assume no data exists for this date
      setPrimaryId(null);
      setPrimaryLocks({});
    } finally {
      setFetchingPrimary(false);
    }
  };

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
      fetchPrimaryData(dateStr);
    } else if (field === 'date' && !value) {
      // Clear primary ID and locks when date is cleared
      setPrimaryId(null);
      setPrimaryLocks({});
    }
    // Shift changes are handled by useEffect
  };

  const handlePrimarySubmit = async () => {
    setPrimarySubmitted(true);
    // Validate required fields
    if (!primaryData.date) {
      alert('Please fill in Date');
      return;
    }

    // Save primary data to database (without locking)
    setPrimaryLoading(true);
    try {
      const response = await api.post('/v1/melting-logs/primary', {
        primaryData: primaryData,
        isLocked: false
      });
      
      if (response.success) {
        setPrimaryId(response.data._id);
        // Update primary data with response data to ensure consistency
        setPrimaryData(prev => ({
          ...prev,
          date: response.data.date ? new Date(response.data.date).toISOString().split('T')[0] : prev.date
        }));
        
        // Lock all primary fields except date after saving (only if they have values)
        const locks = {};
        if (primaryData.shift !== undefined && primaryData.shift !== null && primaryData.shift !== '') locks.shift = true;
        if (primaryData.furnaceNo !== undefined && primaryData.furnaceNo !== null && primaryData.furnaceNo !== '') locks.furnaceNo = true;
        if (primaryData.panel !== undefined && primaryData.panel !== null && primaryData.panel !== '') locks.panel = true;
        if (primaryData.cumulativeLiquidMetal !== undefined && primaryData.cumulativeLiquidMetal !== null && primaryData.cumulativeLiquidMetal !== 0 && primaryData.cumulativeLiquidMetal !== '') locks.cumulativeLiquidMetal = true;
        if (primaryData.finalKWHr !== undefined && primaryData.finalKWHr !== null && primaryData.finalKWHr !== 0 && primaryData.finalKWHr !== '') locks.finalKWHr = true;
        if (primaryData.initialKWHr !== undefined && primaryData.initialKWHr !== null && primaryData.initialKWHr !== 0 && primaryData.initialKWHr !== '') locks.initialKWHr = true;
        if (primaryData.totalUnits !== undefined && primaryData.totalUnits !== null && primaryData.totalUnits !== 0 && primaryData.totalUnits !== '') locks.totalUnits = true;
        if (primaryData.cumulativeUnits !== undefined && primaryData.cumulativeUnits !== null && primaryData.cumulativeUnits !== 0 && primaryData.cumulativeUnits !== '') locks.cumulativeUnits = true;
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

  // Reset functions for each section
  const resetPrimaryData = () => {
    if (!window.confirm('Are you sure you want to reset Primary data?')) return;
    setPrimaryData({
      date: '',
      shift: '',
      furnaceNo: '',
      panel: '',
      cumulativeLiquidMetal: '',
      finalKWHr: '',
      initialKWHr: '',
      totalUnits: '',
      cumulativeUnits: ''
    });
    setPrimaryId(null);
    setPrimaryLocks({});
  };

  // Helper function to check if a primary field is locked
  const isPrimaryFieldLocked = (field) => {
    return primaryLocks[field] === true;
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

  const resetTable1 = () => {
    setTable1({
      heatNo: '',
      grade: '',
      chargingTime: '',
      ifBath: '',
      liquidMetalPressPour: '',
      liquidMetalHolder: '',
      sgMsSteel: '',
      greyMsSteel: '',
      returnsSg: '',
      gl: '',
      pigIron: '',
      borings: '',
      finalBath: ''
    });
  };

  const resetTable2 = () => {
    setTable2({
      charCoal: '',
      cpcFur: '',
      cpcLc: '',
      siliconCarbideFur: '',
      ferrosiliconFur: '',
      ferrosiliconLc: '',
      ferroManganeseFur: '',
      ferroManganeseLc: '',
      cu: '',
      cr: '',
      pureMg: '',
      ironPyrite: ''
    });
  };

  const resetTable3 = () => {
    setTable3({
      labCoinTime: '',
      labCoinTempC: '',
      deslagingTimeFrom: '',
      deslagingTimeTo: '',
      metalReadyTime: '',
      waitingForTappingFrom: '',
      waitingForTappingTo: '',
      reason: ''
    });
  };

  const resetTable4 = () => {
    setTable4({
      time: '',
      tempCSg: '',
      tempCGrey: '',
      directFurnace: '',
      holderToFurnace: '',
      furnaceToHolder: '',
      disaNo: '',
      item: ''
    });
  };

  const resetTable5 = () => {
    setTable5({
      furnace1Kw: '',
      furnace1A: '',
      furnace1V: '',
      furnace2Kw: '',
      furnace2A: '',
      furnace2V: '',
      furnace3Kw: '',
      furnace3A: '',
      furnace3V: '',
      furnace4Hz: '',
      furnace4Gld: '',
      furnace4KwHr: ''
    });
  };

  return (
    <div className="page-wrapper" onKeyDown={handleEnterFocusNext}>
      {/* Header */}
      <div className="cupola-holder-header">
        <div className="cupola-holder-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Melting Log Sheet - Entry Form
          </h2>
        </div>
      </div>

      {/* Primary Section */}
      <div>
        <h3 className="section-header">Primary Data</h3>
        
        <div className="melting-log-form-grid">
          <div className={`melting-log-form-group ${classFor(primaryData.date, primarySubmitted, true)}`}>
            <label>Date *</label>
              <CustomDatePicker
                value={primaryData.date}
                onChange={(e) => handlePrimaryChange('date', e.target.value)}
                name="date"
                disabled={fetchingPrimary}
              />
              {fetchingPrimary && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>Loading...</span>}
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.shift, primarySubmitted, true)}`}>
            <label>Shift</label>
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
              readOnly={isPrimaryFieldLocked('shift')}
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

          <div className={`melting-log-form-group ${classFor(primaryData.furnaceNo, primarySubmitted, true)}`}>
            <label>Furnace No.</label>
          <input
                type="text"
                value={primaryData.furnaceNo}
                onChange={(e) => handlePrimaryChange('furnaceNo', e.target.value)}
                placeholder="Enter furnace no"
                disabled={isPrimaryFieldLocked('furnaceNo')}
                readOnly={isPrimaryFieldLocked('furnaceNo')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('furnaceNo') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('furnaceNo') ? 'not-allowed' : 'text'
                }}
            />
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.panel, primarySubmitted, true)}`}>
            <label>Panel</label>
          <input
                type="text"
                value={primaryData.panel}
                onChange={(e) => handlePrimaryChange('panel', e.target.value)}
                placeholder="Enter panel"
                disabled={isPrimaryFieldLocked('panel')}
                readOnly={isPrimaryFieldLocked('panel')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('panel') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('panel') ? 'not-allowed' : 'text'
                }}
            />
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.cumulativeLiquidMetal, primarySubmitted, true)}`}>
            <label>Cumulative Liquid Metal</label>
          <input
                type="number"
                value={primaryData.cumulativeLiquidMetal}
                onChange={(e) => handlePrimaryChange('cumulativeLiquidMetal', e.target.value)}
                placeholder="Enter value"
                step="0.01"
                disabled={isPrimaryFieldLocked('cumulativeLiquidMetal')}
                readOnly={isPrimaryFieldLocked('cumulativeLiquidMetal')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('cumulativeLiquidMetal') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('cumulativeLiquidMetal') ? 'not-allowed' : 'text'
                }}
            />
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.finalKWHr, primarySubmitted, true)}`}>
            <label>Final KWHr</label>
          <input
                type="number"
                value={primaryData.finalKWHr}
                onChange={(e) => handlePrimaryChange('finalKWHr', e.target.value)}
                placeholder="Enter value"
                step="0.01"
                disabled={isPrimaryFieldLocked('finalKWHr')}
                readOnly={isPrimaryFieldLocked('finalKWHr')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('finalKWHr') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('finalKWHr') ? 'not-allowed' : 'text'
                }}
            />
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.initialKWHr, primarySubmitted, true)}`}>
            <label>Initial KWHr</label>
          <input
                type="number"
                value={primaryData.initialKWHr}
                onChange={(e) => handlePrimaryChange('initialKWHr', e.target.value)}
                placeholder="Enter value"
                step="0.01"
                disabled={isPrimaryFieldLocked('initialKWHr')}
                readOnly={isPrimaryFieldLocked('initialKWHr')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('initialKWHr') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('initialKWHr') ? 'not-allowed' : 'text'
                }}
            />
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.totalUnits, primarySubmitted, true)}`}>
            <label>Total Units</label>
          <input
                type="number"
                value={primaryData.totalUnits}
                onChange={(e) => handlePrimaryChange('totalUnits', e.target.value)}
                placeholder="Enter value"
                step="0.01"
                disabled={isPrimaryFieldLocked('totalUnits')}
                readOnly={isPrimaryFieldLocked('totalUnits')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('totalUnits') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('totalUnits') ? 'not-allowed' : 'text'
                }}
            />
          </div>

          <div className={`melting-log-form-group ${classFor(primaryData.cumulativeUnits, primarySubmitted, true)}`}>
            <label>Cumulative Units</label>
          <input
                type="number"
                value={primaryData.cumulativeUnits}
                onChange={(e) => handlePrimaryChange('cumulativeUnits', e.target.value)}
                placeholder="Enter value"
                step="0.01"
                disabled={isPrimaryFieldLocked('cumulativeUnits')}
                readOnly={isPrimaryFieldLocked('cumulativeUnits')}
                style={{
                  backgroundColor: isPrimaryFieldLocked('cumulativeUnits') ? '#f1f5f9' : '#ffffff',
                  cursor: isPrimaryFieldLocked('cumulativeUnits') ? 'not-allowed' : 'text'
                }}
            />
          </div>
        </div>

        <div className="melting-log-submit-container">
          <button
            type="button"
            className="melting-log-reset-btn"
            onClick={resetPrimaryData}
            disabled={primaryLoading || fetchingPrimary}
          >
            <RotateCcw size={18} />
            Reset Primary
          </button>

          <button
            className="cupola-holder-submit-btn"
            onClick={handlePrimarySubmit}
            disabled={primaryLoading || fetchingPrimary || !primaryData.date}
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

        <div className="melting-log-form-grid melting-log-table5-grid">
          <div className="melting-log-form-group">
            <label>Heat No</label>
            <input
              type="text"
              value={table1.heatNo || ''}
              onChange={(e) => handleTableChange(1, 'heatNo', e.target.value)}
              placeholder="Enter heat no"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Grade</label>
            <input
              type="text"
              value={table1.grade || ''}
              onChange={(e) => handleTableChange(1, 'grade', e.target.value)}
              placeholder="Enter grade"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Charging Time</label>
            <input
              type="time"
              value={table1.chargingTime || ''}
              onChange={(e) => handleTableChange(1, 'chargingTime', e.target.value)}
            />
          </div>

          <div className="melting-log-form-group">
            <label>If Bath</label>
            <input
              type="text"
              value={table1.ifBath || ''}
              onChange={(e) => handleTableChange(1, 'ifBath', e.target.value)}
              placeholder="Enter if bath"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Liquid Metal - Press Pour (kgs)</label>
            <input
              type="number"
              value={table1.liquidMetalPressPour || ''}
              onChange={(e) => handleTableChange(1, 'liquidMetalPressPour', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Liquid Metal - Holder (kgs)</label>
            <input
              type="number"
              value={table1.liquidMetalHolder || ''}
              onChange={(e) => handleTableChange(1, 'liquidMetalHolder', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>SG-MS Steel (400 - 2500 kgs)</label>
            <input
              type="number"
              value={table1.sgMsSteel || ''}
              onChange={(e) => handleTableChange(1, 'sgMsSteel', e.target.value)}
              placeholder="Enter value"
              min="400"
              max="2500"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Grey MS Steel (400 - 2500 kgs)</label>
            <input
              type="number"
              value={table1.greyMsSteel || ''}
              onChange={(e) => handleTableChange(1, 'greyMsSteel', e.target.value)}
              placeholder="Enter value"
              min="400"
              max="2500"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Returns SG (500 - 2500 kgs)</label>
            <input
              type="number"
              value={table1.returnsSg || ''}
              onChange={(e) => handleTableChange(1, 'returnsSg', e.target.value)}
              placeholder="Enter value"
              min="500"
              max="2500"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>GL (900 - 2250 kgs)</label>
            <input
              type="number"
              value={table1.gl || ''}
              onChange={(e) => handleTableChange(1, 'gl', e.target.value)}
              placeholder="Enter value"
              min="900"
              max="2250"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Pig Iron (0 - 350 kgs)</label>
            <input
              type="number"
              value={table1.pigIron || ''}
              onChange={(e) => handleTableChange(1, 'pigIron', e.target.value)}
              placeholder="Enter value"
              min="0"
              max="350"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Borings (0 - 1900 kgs)</label>
            <input
              type="number"
              value={table1.borings || ''}
              onChange={(e) => handleTableChange(1, 'borings', e.target.value)}
              placeholder="Enter value"
              min="0"
              max="1900"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Final Bath (kgs)</label>
            <input
              type="number"
              value={table1.finalBath || ''}
              onChange={(e) => handleTableChange(1, 'finalBath', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 2 */}
      <div>
        <h3 className="section-header">Table 2</h3>

        <div className="melting-log-form-grid melting-log-table5-grid">
          <div className="melting-log-form-group">
            <label>CharCoal (kgs)</label>
            <input
              type="number"
              value={table2.charCoal || ''}
              onChange={(e) => handleTableChange(2, 'charCoal', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>CPC - Fur (kgs)</label>
            <input
              type="number"
              value={table2.cpcFur || ''}
              onChange={(e) => handleTableChange(2, 'cpcFur', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>CPC - LC (kgs)</label>
            <input
              type="number"
              value={table2.cpcLc || ''}
              onChange={(e) => handleTableChange(2, 'cpcLc', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Silicon Carbide - Fur (kgs)</label>
            <input
              type="number"
              value={table2.siliconCarbideFur || ''}
              onChange={(e) => handleTableChange(2, 'siliconCarbideFur', e.target.value)}
              placeholder="Enter value (0.03 to 0.09)"
              min="0.03"
              max="0.09"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Ferrosilicon - Fur (kgs)</label>
            <input
              type="number"
              value={table2.ferrosiliconFur || ''}
              onChange={(e) => handleTableChange(2, 'ferrosiliconFur', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Ferrosilicon - LC (kgs)</label>
            <input
              type="number"
              value={table2.ferrosiliconLc || ''}
              onChange={(e) => handleTableChange(2, 'ferrosiliconLc', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>FerroManganese - Fur (kgs)</label>
            <input
              type="number"
              value={table2.ferroManganeseFur || ''}
              onChange={(e) => handleTableChange(2, 'ferroManganeseFur', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>FerroManganese - LC (kgs)</label>
            <input
              type="number"
              value={table2.ferroManganeseLc || ''}
              onChange={(e) => handleTableChange(2, 'ferroManganeseLc', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Cu (kgs)</label>
            <input
              type="number"
              value={table2.cu || ''}
              onChange={(e) => handleTableChange(2, 'cu', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Cr (kgs)</label>
            <input
              type="number"
              value={table2.cr || ''}
              onChange={(e) => handleTableChange(2, 'cr', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Pure Mg (kgs)</label>
            <input
              type="number"
              value={table2.pureMg || ''}
              onChange={(e) => handleTableChange(2, 'pureMg', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Iron Pyrite (kgs)</label>
            <input
              type="number"
              value={table2.ironPyrite || ''}
              onChange={(e) => handleTableChange(2, 'ironPyrite', e.target.value)}
              placeholder="Enter value"
              step="0.01"
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 3 */}
      <div>
        <h3 className="section-header">Table 3</h3>

        <div className="melting-log-form-grid melting-log-table5-grid">
          <div className="melting-log-form-group">
            <label>Lab Coin - Time</label>
            <input
              type="time"
              value={table3.labCoinTime || ''}
              onChange={(e) => handleTableChange(3, 'labCoinTime', e.target.value)}
            />
          </div>

          <div className="melting-log-form-group">
            <label>Lab Coin - Temp (°C)</label>
            <input
              type="number"
              value={table3.labCoinTempC || ''}
              onChange={(e) => handleTableChange(3, 'labCoinTempC', e.target.value)}
              placeholder="Enter temperature in °C"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Deslaging Time - From</label>
            <input
              type="time"
              value={table3.deslagingTimeFrom || ''}
              onChange={(e) => handleTableChange(3, 'deslagingTimeFrom', e.target.value)}
            />
          </div>

          <div className="melting-log-form-group">
            <label>Deslaging Time -To</label>
            <input
              type="time"
              value={table3.deslagingTimeTo || ''}
              onChange={(e) => handleTableChange(3, 'deslagingTimeTo', e.target.value)}
            />
          </div>

          <div className="melting-log-form-group">
            <label>Metal Ready Time</label>
            <input
              type="time"
              value={table3.metalReadyTime || ''}
              onChange={(e) => handleTableChange(3, 'metalReadyTime', e.target.value)}
            />
          </div>
        </div>

        <div className="melting-log-form-grid melting-log-table5-grid">
          <div className="melting-log-form-group">
            <label>Waiting for Tapping- From</label>
            <input
              type="time"
              value={table3.waitingForTappingFrom || ''}
              onChange={(e) => handleTableChange(3, 'waitingForTappingFrom', e.target.value)}
            />
          </div>

          <div className="melting-log-form-group">
            <label>Waiting for Tapping -To</label>
            <input
              type="time"
              value={table3.waitingForTappingTo || ''}
              onChange={(e) => handleTableChange(3, 'waitingForTappingTo', e.target.value)}
            />
          </div>

          <div className="melting-log-form-group" />
          <div className="melting-log-form-group" />
          <div className="melting-log-form-group" />
        </div>

        <div className="melting-log-form-grid">
          <div className="melting-log-form-group" style={{ maxWidth: '40%' }}>
            <label>Reason</label>
            <input
              type="text"
              value={table3.reason || ''}
              onChange={(e) => handleTableChange(3, 'reason', e.target.value)}
              placeholder="Enter reason"
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 4 - Metal Tapping in Kgs */}
      <div>
        <h3 className="section-header">Table 4</h3>
        
        <div className="melting-log-form-grid">
        <div className="melting-log-form-group">
          <label>Time</label>
          <input
            type="time"
            value={table4.time || ''}
            onChange={(e) => handleTableChange(4, 'time', e.target.value)}
          />
        </div>

        <div className="melting-log-form-group">
          <label>Temp C - SG (1460 - 1550 °C)</label>
          <input
                type="number"
                value={table4.tempCSg || ''}
                onChange={(e) => handleTableChange(4, 'tempCSg', e.target.value)}
                placeholder="Enter temperature (1460 - 1550)"
                min="1460"
                max="1550"
                step="0.01"
          />
        </div>

        <div className="melting-log-form-group">
          <label>Temp C - Grey (1440 - 1550 °C)</label>
          <input
                type="number"
                value={table4.tempCGrey || ''}
                onChange={(e) => handleTableChange(4, 'tempCGrey', e.target.value)}
                placeholder="Enter temperature (1440 - 1550)"
                min="1440"
                max="1550"
                step="0.01"
          />
        </div>

        <div className="melting-log-form-group">
          <label>Direct Furnace (kgs)</label>
          <input
                type="number"
                value={table4.directFurnace || ''}
                onChange={(e) => handleTableChange(4, 'directFurnace', e.target.value)}
                placeholder="Enter value"
                step="0.01"
          />
        </div>

        <div className="melting-log-form-group">
          <label>Holder To Furnace (kgs)</label>
          <input
                type="number"
                value={table4.holderToFurnace || ''}
                onChange={(e) => handleTableChange(4, 'holderToFurnace', e.target.value)}
                placeholder="Enter value"
                step="0.01"
          />
        </div>

        <div className="melting-log-form-group">
          <label>Furnace To Holder (kgs)</label>
          <input
                type="number"
                value={table4.furnaceToHolder || ''}
                onChange={(e) => handleTableChange(4, 'furnaceToHolder', e.target.value)}
                placeholder="Enter value"
                step="0.01"
          />
        </div>

        <div className="melting-log-form-group">
          <label>Disa No.</label>
          <input
                type="text"
                value={table4.disaNo || ''}
                onChange={(e) => handleTableChange(4, 'disaNo', e.target.value)}
                placeholder="Enter Disa No."
          />
        </div>

        <div className="melting-log-form-group">
          <label>Item</label>
          <input
                type="text"
                value={table4.item || ''}
                onChange={(e) => handleTableChange(4, 'item', e.target.value)}
                placeholder="Enter item"
          />
        </div>
      </div>

        <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1.5rem 0' }}></div>
      </div>

      {/* Table 5 - Electrical Readings */}
      <div>
        <h3 className="section-header">Table 5</h3>

        {/* Furnace 1,2,3 combined section */}
        <h4 className="melting-log-sub-section-title">Furnace 1,2,3</h4>
        <div className="melting-log-form-grid melting-log-table5-grid">
          <div className="melting-log-form-group">
            <label>Kw</label>
            <input
              type="number"
              value={table5.furnace1Kw || ''}
              onChange={(e) => handleTableChange(5, 'furnace1Kw', e.target.value)}
              placeholder="Enter Kw"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>A</label>
            <input
              type="number"
              value={table5.furnace1A || ''}
              onChange={(e) => handleTableChange(5, 'furnace1A', e.target.value)}
              placeholder="Enter A"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>V</label>
            <input
              type="number"
              value={table5.furnace1V || ''}
              onChange={(e) => handleTableChange(5, 'furnace1V', e.target.value)}
              placeholder="Enter V"
              step="0.01"
            />
          </div>
        </div>

        {/* Furnace 4 section */}
        <h4 className="melting-log-sub-section-title">Furnace 4</h4>
        <div className="melting-log-form-grid melting-log-table5-grid">
          <div className="melting-log-form-group">
            <label>Hz</label>
            <input
              type="number"
              value={table5.furnace4Hz || ''}
              onChange={(e) => handleTableChange(5, 'furnace4Hz', e.target.value)}
              placeholder="Enter Hz"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>GLD</label>
            <input
              type="number"
              value={table5.furnace4Gld || ''}
              onChange={(e) => handleTableChange(5, 'furnace4Gld', e.target.value)}
              placeholder="Enter GLD"
              step="0.01"
            />
          </div>

          <div className="melting-log-form-group">
            <label>Kw/Hr</label>
            <input
              type="number"
              value={table5.furnace4KwHr || ''}
              onChange={(e) => handleTableChange(5, 'furnace4KwHr', e.target.value)}
              placeholder="Enter Kw/Hr"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* All Tables Submit and Reset Buttons */}
      <div className="melting-log-submit-container" style={{ marginTop: '2rem' }}>
        <button
          className="melting-log-reset-btn"
          onClick={handleAllTablesReset}
          type="button"
        >
          <RotateCcw size={16} />
          Reset All Tables
        </button>
        <button
          className="cupola-holder-submit-btn"
          onClick={handleAllTablesSubmit}
          disabled={loadingStates.table1 || loadingStates.table2 || loadingStates.table3 || loadingStates.table4 || loadingStates.table5 || !primaryData.date}
          title={!primaryData.date ? 'Please enter a date first' : 'Save All Tables'}
        >
          {(loadingStates.table1 || loadingStates.table2 || loadingStates.table3 || loadingStates.table4 || loadingStates.table5) ? (
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

export default MeltingLogSheet;
