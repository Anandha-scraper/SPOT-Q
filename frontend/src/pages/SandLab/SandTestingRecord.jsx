import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, FileText, Loader2, RotateCcw } from 'lucide-react';
import { PlusButton, MinusButton } from '../../Components/Buttons';
import '../../styles/PageStyles/Sandlab/SandTestingRecord.css';

const SandTestingRecord = () => {
  const navigate = useNavigate();
  
  // Primary: Date
  const [primaryData, setPrimaryData] = useState({ date: '' });
  
  // Table 1: Shift Data (arrays for multiple entries)
  const [table1, setTable1] = useState({
    shiftI: {
      rSand: [''],
      nSand: [''],
      mixingMode: [''],
      bentonite: [''],
      coalDustPremix: ['']
    },
    shiftII: {
      rSand: [''],
      nSand: [''],
      mixingMode: [''],
      bentonite: [''],
      coalDustPremix: ['']
    },
    shiftIII: {
      rSand: [''],
      nSand: [''],
      mixingMode: [''],
      bentonite: [''],
      coalDustPremix: ['']
    },
    checkpointCoalDustPremix: '',
    batchNoBentonite: '',
    batchNoCoalDustPremix: ''
  });
  
  // Table 2: Clay Parameters
  const [table2, setTable2] = useState({
    shiftI: {
      totalClay: '',
      activeClay: '',
      deadClay: '',
      vcm: '',
      loi: '',
      afsNo: '',
      fines: ''
    },
    shiftII: {
      totalClay: '',
      activeClay: '',
      deadClay: '',
      vcm: '',
      loi: '',
      afsNo: '',
      fines: ''
    },
    shiftIII: {
      totalClay: '',
      activeClay: '',
      deadClay: '',
      vcm: '',
      loi: '',
      afsNo: '',
      fines: ''
    }
  });
  
  // Table 3: Mix Data (arrays for multiple entries)
  const [table3, setTable3] = useState({
    shiftI: {
      mixNoStart: [''],
      mixNoEnd: [''],
      mixNoTotal: [''],
      noOfMixRejected: [''],
      returnSandHopperLevel: ['']
    },
    shiftII: {
      mixNoStart: [''],
      mixNoEnd: [''],
      mixNoTotal: [''],
      noOfMixRejected: [''],
      returnSandHopperLevel: ['']
    },
    shiftIII: {
      mixNoStart: [''],
      mixNoEnd: [''],
      mixNoTotal: [''],
      noOfMixRejected: [''],
      returnSandHopperLevel: ['']
    },
    total: {
      mixNoEnd: '',
      mixNoTotal: '',
      noOfMixRejected: ''
    }
  });
  
  // Table 4: Sand Properties
  const [table4, setTable4] = useState({
    sandLump: '',
    newSandWt: '',
    friability: {
      shiftI: '',
      shiftII: '',
      shiftIII: ''
    }
  });
  
  // Table 5: Sand Properties & Test Parameters (single form)
  const [table5, setTable5] = useState({
    timeHour: '',
    timeMinute: '',
    mixNo: '',
    permeability: '',
    gcsCheckpoint: '',
    gcsValue: '',
    wts: '',
    moisture: '',
    compactability: '',
    compressability: '',
    waterLitrePerKgMix: '',
    sandTempBC: '',
    sandTempWU: '',
    sandTempSSU: '',
    newSandKgsPerMould: '',
    bentoniteCheckpoint: '',
    bentoniteWithPremix: '',
    bentoniteOnly: '',
    premixCoalDustCheckpoint: '',
    premixKgsMix: '',
    coalDustKgsMix: '',
    lcScmCompactabilityCheckpoint: '',
    lcScmCompactabilityValue: '',
    mouldStrengthShearCheckpoint: '',
    mouldStrengthShearValue: '',
    preparedSandLumpsPerKg: '',
    itemName: '',
    remarks: ''
  });

  // Track current S.No for Table 5 based on existing database entries
  const [currentSNo, setCurrentSNo] = useState(1);

  const [loadingStates, setLoadingStates] = useState({
    table1: false,
    table2: false,
    table3: false,
    table4: false,
    table5: false
  });

  // Field locks for each table
  const [tableLocks, setTableLocks] = useState({
    table1: {},
    table2: {},
    table3: {},
    table4: {},
    table5: {}
  });

  // Set current date on mount and fetch existing data
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const currentDate = `${y}-${m}-${d}`;
    setPrimaryData(prev => ({
      ...prev,
      date: currentDate
    }));
    // Fetch existing data for today's date
    checkExistingData(currentDate);
  }, []);

  // Helper functions for array-based Table 1 fields
  const handleTable1ArrayChange = (shift, field, index, value) => {
    setTable1(prev => {
      const updated = {
        ...prev,
        [shift]: {
          ...prev[shift],
          [field]: prev[shift][field].map((item, i) => i === index ? value : item)
        }
      };

      
      return updated;
    });
  };

  const addTable1ArrayEntry = (shift, field) => {
    setTable1(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [field]: [...prev[shift][field], '']
      }
    }));
  };

  const removeTable1ArrayEntry = (shift, field, index) => {
    setTable1(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [field]: prev[shift][field].filter((_, i) => i !== index)
      }
    }));
  };

  // Table 3 Array Helper Functions
  const handleTable3ArrayChange = (shift, field, index, value) => {
    setTable3(prev => {
      const newArray = [...prev[shift][field]];
      newArray[index] = value;
 
      return {
        ...prev,
        [shift]: {
          ...prev[shift],
          [field]: newArray
        }
      };
    });
  };

  const addTable3ArrayEntry = (shift, field) => {
    setTable3(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [field]: [...prev[shift][field], '']
      }
    }));
  };

  const removeTable3ArrayEntry = (shift, field, index) => {
    setTable3(prev => ({
      ...prev,
      [shift]: {
        ...prev[shift],
        [field]: prev[shift][field].filter((_, i) => i !== index)
      }
    }));
  };

  // Handler for Table 5 single form
  const handleTable5Change = (field, value) => {
    setTable5(prev => ({
      ...prev,
      [field]: ['permeability', 'gcsValue', 'wts', 'moisture', 'compactability', 'compressability', 'waterLitrePerKgMix', 'sandTempBC', 'sandTempWU', 'sandTempSSU', 'newSandKgsPerMould', 'bentoniteWithPremix', 'bentoniteOnly', 'premixKgsMix', 'coalDustKgsMix', 'lcScmCompactabilityValue', 'mouldStrengthShearValue', 'preparedSandLumpsPerKg'].includes(field) ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleTableChange = (tableNum, field, value, nestedField = null) => {
    const setters = {
      1: setTable1,
      2: setTable2,
      3: setTable3,
      4: setTable4,
      5: setTable5
    };
    
    if (tableNum === 1 && !nestedField) {
      // For table 1 top-level fields (batchNo, checkpointCoalDustPremix)
      setters[tableNum](prev => ({
        ...prev,
        [field]: value
      }));
    } else if ((tableNum === 1 || tableNum === 2 || tableNum === 3) && nestedField) {
      // For table 1, 2, and 3, handle nested shift structure
      setters[tableNum](prev => ({
          ...prev,
            [field]: {
          ...prev[field],
              [nestedField]: value
            }
      }));
    } else if (tableNum === 4 && field === 'friability' && nestedField) {
      // For table 4 friability, handle nested shift structure
      setters[tableNum](prev => ({
        ...prev,
        friability: {
          ...prev.friability,
          [nestedField]: value
        }
      }));
    } else {
      setters[tableNum](prev => ({
          ...prev,
            [field]: tableNum === 5 && ['permeability', 'gcsValue', 'wts', 'moisture', 'compactability', 'compressability', 'waterLitrePerKgMix', 'sandTempBC', 'sandTempWU', 'sandTempSSU', 'newSandKgsPerMould', 'bentoniteWithPremix', 'bentoniteOnly', 'premixKgsMix', 'coalDustKgsMix', 'CompactabilitySettings', 'lcScmCompactabilityValue', 'shearStrengthSetting', 'mouldStrength', 'mouldStrengthShearValue', 'preparedSandLumpsPerKg'].includes(field) ? (value === '' ? '' : Number(value)) : value
      }));
    }
  };

  const handleTableSubmit = async (tableNum, silent = false) => {
    if (!primaryData.date) {
      alert('Please enter a date first.');
      return;
    }

    const tables = { 1: table1, 2: table2, 3: table3, 4: table4, 5: table5 };
    const tableData = tables[tableNum];
    
    // For tables 1-5, only send unlocked/empty fields
    let dataToSend = tableData;
    if (tableNum <= 5) {
      const locks = tableLocks[`table${tableNum}`] || {};
      if (tableNum === 1) {
        // Filter out locked fields for table 1 and transform batchNo structure
        const filtered = {
          shiftI: {},
          shiftII: {},
          shiftIII: {},
          batchNo: {}
        };
        ['shiftI', 'shiftII', 'shiftIII'].forEach(shift => {
          const shiftData = tableData[shift] || {};
          Object.keys(shiftData).forEach(field => {
            // For array fields (rSand, nSand, mixingMode, bentonite, coalDustPremix), filter out locked indices
            const arrayFields = ['rSand', 'nSand', 'mixingMode', 'bentonite', 'coalDustPremix'];
            if (arrayFields.includes(field) && Array.isArray(shiftData[field])) {
              const unlockedValues = shiftData[field].filter((val, idx) => {
                const indexLockKey = `${shift}.${field}.${idx}`;
                return !locks[indexLockKey] && val && String(val).trim() !== '';
              });
              if (unlockedValues.length > 0) {
                filtered[shift][field] = unlockedValues;
              }
            }
          });
        });
        
        // Handle batchNo fields at table level
        if (!locks['batchNo.bentonite'] && tableData.batchNoBentonite) {
          filtered.batchNo.bentonite = tableData.batchNoBentonite;
        }
        // Store based on checkpoint selection (coalDust or premix)
        if (tableData.checkpointCoalDustPremix === 'coalDust' && !locks['batchNo.coalDust'] && tableData.batchNoCoalDustPremix) {
          filtered.batchNo.coalDust = tableData.batchNoCoalDustPremix;
        } else if (tableData.checkpointCoalDustPremix === 'premix' && !locks['batchNo.premix'] && tableData.batchNoCoalDustPremix) {
          filtered.batchNo.premix = tableData.batchNoCoalDustPremix;
        }
        
        dataToSend = filtered;
      } else if (tableNum === 5) {
        // Table 5 is now an array of entries - submit each entry
        setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: true }));
        
        try {
          const entry = tableData;
          // Build backend testParameter structure
          const tp = {};
          tp.sno = currentSNo; // Use current S.No from state
          if (table5.timeHour && table5.timeMinute) {
            const hh = String(table5.timeHour).padStart(2, '0');
            const mm = String(table5.timeMinute).padStart(2, '0');
            const tnum = Number(hh + mm);
            if (!Number.isNaN(tnum)) {
              tp.time = tnum;
            }
          }
          tp.mixno = table5.mixNo;
          tp.permeability = table5.permeability;
          // GCS: send numeric value to the selected checkpoint field only
          if (table5.gcsCheckpoint === 'fdyA' && table5.gcsValue !== '' && !Number.isNaN(Number(table5.gcsValue))) {
            tp.gcsFdyA = Number(table5.gcsValue);
          } else if (table5.gcsCheckpoint === 'fdyB' && table5.gcsValue !== '' && !Number.isNaN(Number(table5.gcsValue))) {
            tp.gcsFdyB = Number(table5.gcsValue);
          }
          tp.wts = table5.wts;
          tp.moisture = table5.moisture;
          tp.compactability = table5.compactability;
          tp.compressibility = table5.compressability;
          tp.waterLitre = table5.waterLitrePerKgMix;
          // sand temp nested
          tp.sandTemp = {
            BC: table5.sandTempBC,
            WU: table5.sandTempWU,
            SSUmax: table5.sandTempSSU
          };
          tp.newSandKgs = table5.newSandKgsPerMould;
          // nested materials
          tp.bentoniteWithPremix = { Kgs: table5.bentoniteWithPremix };
          tp.bentonite = { Kgs: table5.bentoniteOnly };
          tp.premix = { Kgs: table5.premixKgsMix };
          tp.coalDust = { Kgs: table5.coalDustKgsMix };
          // numeric settings and values only
          if (table5.lcScmCompactabilityValue !== '' && !Number.isNaN(Number(table5.lcScmCompactabilityValue))) {
            tp.CompactabilitySettings = Number(table5.lcScmCompactabilityValue);
          }
          if (table5.mouldStrengthShearValue !== '' && !Number.isNaN(Number(table5.mouldStrengthShearValue))) {
            tp.mouldStrength = Number(table5.mouldStrengthShearValue);
          }
          tp.lc = table5.lcScmCompactabilityValue;
          tp.preparedSandlumps = table5.preparedSandLumpsPerKg;
          tp.itemName = table5.itemName;
          tp.remarks = table5.remarks;

          // Submit the entry
          const res = await fetch(`http://localhost:5000/api/v1/sand-testing-records/table${tableNum}`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            credentials: 'include', 
            body: JSON.stringify({
              tableNum,
              data: {
                ...tp,
                date: primaryData.date
              }
            }) 
          });
          const response = await res.json();
          
          setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: false }));
          
          if (response.success) {
            if (!silent) alert(`Table ${tableNum} entry S.No ${currentSNo} saved successfully!`);
            // Increment S.No for next entry and clear form
            setCurrentSNo(prev => prev + 1);
            resetTable5();
          } else {
            if (!silent) alert('Error: ' + response.message);
          }
          return;
        } catch (error) {
          console.error(`Error saving table ${tableNum}:`, error);
          setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: false }));
          if (!silent) alert(`Failed to save table ${tableNum}: ${error.message || 'Please try again.'}`);
          return;
        }
      } else if (tableNum === 2) {
        const filtered = {
          shiftI: {},
          ShiftII: {},
          ShiftIII: {}
        };
        ['shiftI', 'shiftII', 'shiftIII'].forEach((shift, idx) => {
          const backendShiftKey = idx === 0 ? 'shiftI' : idx === 1 ? 'ShiftII' : 'ShiftIII';
          const shiftData = tableData[shift] || {};
          Object.keys(shiftData).forEach(field => {
            const lockKey = `${shift}.${field}`;
            if (!locks[lockKey] && shiftData[field]) {
              filtered[backendShiftKey][field] = shiftData[field];
            }
          });
        });
        dataToSend = filtered;
      } else if (tableNum === 3) {
        // Transform mixNo fields to nested structure for backend with array support
        const filtered = {
          ShiftI: {},
          ShiftII: {},
          ShiftIII: {}
        };
        ['shiftI', 'shiftII', 'shiftIII'].forEach((shift, idx) => {
          const backendShiftKey = idx === 0 ? 'ShiftI' : idx === 1 ? 'ShiftII' : 'ShiftIII';
          const shiftData = tableData[shift] || {};
          Object.keys(shiftData).forEach(field => {
            // Handle array fields
            const arrayFields = ['mixNoStart', 'mixNoEnd', 'noOfMixRejected', 'returnSandHopperLevel'];
            if (arrayFields.includes(field) && Array.isArray(shiftData[field])) {
              // Filter out locked indices
              const unlockedValues = shiftData[field].filter((val, idx) => {
                const indexLockKey = `${shift}.${field}.${idx}`;
                return !locks[indexLockKey] && val && String(val).trim() !== '';
              });
              
              if (unlockedValues.length > 0) {
                if (field === 'mixNoStart') {
                  if (!filtered[backendShiftKey].mixno) {
                    filtered[backendShiftKey].mixno = {};
                  }
                  filtered[backendShiftKey].mixno.start = unlockedValues;
                } else if (field === 'mixNoEnd') {
                  if (!filtered[backendShiftKey].mixno) {
                    filtered[backendShiftKey].mixno = {};
                  }
                  filtered[backendShiftKey].mixno.end = unlockedValues;
                } else if (field === 'noOfMixRejected') {
                  filtered[backendShiftKey].numberOfMixRejected = unlockedValues;
                } else if (field === 'returnSandHopperLevel') {
                  filtered[backendShiftKey].returnSandHopperLevel = unlockedValues;
                }
              }
            } else if (field === 'mixNoTotal') {
              // Handle single value field (mixNoTotal)
              const lockKey = `${shift}.${field}`;
              if (!locks[lockKey] && shiftData[field]) {
                if (!filtered[backendShiftKey].mixno) {
                  filtered[backendShiftKey].mixno = {};
                }
                filtered[backendShiftKey].mixno.total = shiftData[field];
              }
            } else if (!arrayFields.includes(field)) {
              // Handle other non-array fields
              const lockKey = `${shift}.${field}`;
              if (!locks[lockKey] && shiftData[field]) {
                filtered[backendShiftKey][field] = shiftData[field];
              }
            }
          });
        });
        // Handle total row if it has data
        if (tableData.total) {
          const totalData = {};
          Object.keys(tableData.total).forEach(field => {
            const lockKey = `total.${field}`;
            if (!locks[lockKey] && tableData.total[field]) {
              if (field === 'mixNoEnd' || field === 'mixNoTotal') {
                if (!totalData.mixno) {
                  totalData.mixno = {};
                }
                if (field === 'mixNoEnd') {
                  totalData.mixno.end = tableData.total[field];
                } else if (field === 'mixNoTotal') {
                  totalData.mixno.total = tableData.total[field];
                }
              } else if (field === 'noOfMixRejected') {
                totalData.numberOfMixRejected = tableData.total[field];
              } else {
                totalData[field] = tableData.total[field];
              }
            }
          });
          if (Object.keys(totalData).length > 0) {
            filtered.total = totalData;
          }
        }
        dataToSend = filtered;
      } else if (tableNum === 4) {
        const filtered = {};
        Object.keys(tableData).forEach(field => {
          if (field === 'friability') {
            filtered.sandFriability = {};
            Object.keys(tableData.friability || {}).forEach(shift => {
              const lockKey = `friability.${shift}`;
              if (!locks[lockKey] && tableData.friability[shift]) {
                filtered.sandFriability[shift] = tableData.friability[shift];
              }
            });
          } else {
            const lockKey = field;
            if (!locks[lockKey] && tableData[field]) {
              filtered[field] = tableData[field];
            }
          }
        });
        dataToSend = filtered;
      }
    }
    
    setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: true }));
    
    try {
      // Send primary data + table data together
      const res = await fetch(`http://localhost:5000/api/v1/sand-testing-records/table${tableNum}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({
        tableNum,
        data: {
          ...dataToSend,
          date: primaryData.date
        }
      }) });
      const response = await res.json();
      
      if (response.success) {
        if (!silent) alert(`Table ${tableNum} saved successfully!`);
        // Refresh locks after save
        if (primaryData.date) {
          await checkExistingData(primaryData.date);
        }
      } else {
        if (!silent) alert('Error: ' + response.message);
      }
    } catch (error) {
      console.error(`Error saving table ${tableNum}:`, error);
      if (!silent) alert(`Failed to save table ${tableNum}: ${error.message || 'Please try again.'}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`table${tableNum}`]: false }));
    }
  };





  // Check for existing data when date is entered
  const   checkExistingData = async (date) => {
    if (!date) return;
    
    try {
      // Format date as YYYY-MM-DD for API
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const res = await fetch(`http://localhost:5000/api/v1/sand-testing-records/date/${dateStr}`, { credentials: 'include' });
      const response = await res.json();
      
      if (response.success && response.data && response.data.length > 0) {
        const record = response.data[0];
        
        // Load and lock Table 1 data (sandShifts)
        if (record.sandShifts) {
          const table1Locks = {};
          const table1Data = {
            shiftI: { rSand: [''], nSand: [''], mixingMode: [''], bentonite: [''], coalDustPremix: [''] },
            shiftII: { rSand: [''], nSand: [''], mixingMode: [''], bentonite: [''], coalDustPremix: [''] },
            shiftIII: { rSand: [''], nSand: [''], mixingMode: [''], bentonite: [''], coalDustPremix: [''] },
            checkpointCoalDustPremix: '',
            batchNoBentonite: '',
            batchNoCoalDustPremix: ''
          };
          
          const arrayFields = ['rSand', 'nSand', 'mixingMode', 'bentonite', 'coalDustPremix'];
          
          // Handle batchNo fields at table level
          if (record.sandShifts.batchNo) {
            if (record.sandShifts.batchNo.bentonite) {
              table1Locks['batchNo.bentonite'] = true;
              table1Data.batchNoBentonite = record.sandShifts.batchNo.bentonite;
            }
            if (record.sandShifts.batchNo.coalDust) {
              table1Locks['batchNo.coalDust'] = true;
              table1Data.batchNoCoalDustPremix = record.sandShifts.batchNo.coalDust;
              table1Data.checkpointCoalDustPremix = 'coalDust';
            }
            if (record.sandShifts.batchNo.premix) {
              table1Locks['batchNo.premix'] = true;
              table1Data.batchNoCoalDustPremix = record.sandShifts.batchNo.premix;
              table1Data.checkpointCoalDustPremix = 'premix';
            }
          }
          
          ['shiftI', 'shiftII', 'shiftIII'].forEach(shift => {
            const shiftData = record.sandShifts[shift] || {};
            
            // Handle array fields with index-based locking
            arrayFields.forEach(field => {
              if (shiftData[field]) {
                const values = Array.isArray(shiftData[field]) ? shiftData[field] : [shiftData[field]];
                const nonEmptyValues = values.filter(v => v && String(v).trim() !== '');
                
                if (nonEmptyValues.length > 0) {
                  // Add locked values plus one empty entry for new input
                  table1Data[shift][field] = [...nonEmptyValues, ''];
                  // Lock each saved value index
                  nonEmptyValues.forEach((_, idx) => {
                    table1Locks[`${shift}.${field}.${idx}`] = true;
                  });
                  // Don't lock the last empty entry
                }
              }
            });
          });
          
          setTable1(table1Data);
          setTableLocks(prev => ({
            ...prev,
            table1: table1Locks
          }));
        }
        
        // Load and lock Table 2 data (clayShifts)
        if (record.clayShifts) {
          const table2Locks = {};
          const table2Data = {
            shiftI: {},
            shiftII: {},
            shiftIII: {}
          };
          
          ['shiftI', 'ShiftII', 'ShiftIII'].forEach((shift, idx) => {
            const shiftKey = idx === 0 ? 'shiftI' : idx === 1 ? 'shiftII' : 'shiftIII';
            const shiftData = record.clayShifts[shift] || {};
            Object.keys(shiftData).forEach(field => {
              if (shiftData[field]) {
                table2Locks[`${shiftKey}.${field}`] = true;
                table2Data[shiftKey][field] = shiftData[field];
              }
            });
          });
          
          setTable2(prev => {
            const updated = { ...prev };
            Object.keys(table2Data).forEach(shift => {
              updated[shift] = { ...prev[shift], ...table2Data[shift] };
            });
            return updated;
          });
          setTableLocks(prev => ({
            ...prev,
            table2: table2Locks
          }));
        }
        
        // Load and lock Table 3 data (mixshifts)
        if (record.mixshifts) {
          const table3Locks = {};
          const table3Data = {
            shiftI: {
              mixNoStart: [''],
              mixNoEnd: [''],
              mixNoTotal: [''],
              noOfMixRejected: [''],
              returnSandHopperLevel: ['']
            },
            shiftII: {
              mixNoStart: [''],
              mixNoEnd: [''],
              mixNoTotal: [''],
              noOfMixRejected: [''],
              returnSandHopperLevel: ['']
            },
            shiftIII: {
              mixNoStart: [''],
              mixNoEnd: [''],
              mixNoTotal: [''],
              noOfMixRejected: [''],
              returnSandHopperLevel: ['']
            },
            total: {}
          };
          
          ['ShiftI', 'ShiftII', 'ShiftIII'].forEach((shift, idx) => {
            const shiftKey = idx === 0 ? 'shiftI' : idx === 1 ? 'shiftII' : 'shiftIII';
            const shiftData = record.mixshifts[shift] || {};
            
            // Handle array fields (mixNoStart, mixNoEnd, mixNoTotal, noOfMixRejected, returnSandHopperLevel)
            const arrayFields = [
              { frontend: 'mixNoStart', backend: 'mixno.start' },
              { frontend: 'mixNoEnd', backend: 'mixno.end' },
              { frontend: 'mixNoTotal', backend: 'mixno.total' },
              { frontend: 'noOfMixRejected', backend: 'numberOfMixRejected' },
              { frontend: 'returnSandHopperLevel', backend: 'returnSandHopperLevel' }
            ];
            
            arrayFields.forEach(({ frontend, backend }) => {
              let backendValue;
              if (backend.includes('.')) {
                const parts = backend.split('.');
                backendValue = shiftData[parts[0]]?.[parts[1]];
              } else {
                backendValue = shiftData[backend];
              }
              
              if (Array.isArray(backendValue) && backendValue.length > 0) {
                const nonEmptyValues = backendValue.filter(v => v !== null && v !== undefined && v !== '');
                if (nonEmptyValues.length > 0) {
                  nonEmptyValues.forEach((val, index) => {
                    table3Locks[`${shiftKey}.${frontend}.${index}`] = true;
                  });
                  table3Data[shiftKey][frontend] = [...nonEmptyValues, ''];
                }
              }
            });
          });
          
          setTable3(prev => ({
            ...prev,
            ...table3Data
          }));
          setTableLocks(prev => ({
            ...prev,
            table3: table3Locks
          }));
        }
        
        // Load and lock Table 4 data
        if (record.sandLump || record.newSandWt || record.sandFriability) {
          const table4Locks = {};
          const table4Data = {};
          
          if (record.sandLump) {
            table4Locks.sandLump = true;
            table4Data.sandLump = record.sandLump;
          }
          if (record.newSandWt) {
            table4Locks.newSandWt = true;
            table4Data.newSandWt = record.newSandWt;
          }
          if (record.sandFriability) {
            ['shiftI', 'shiftII', 'shiftIII'].forEach(shift => {
              if (record.sandFriability[shift]) {
                table4Locks[`friability.${shift}`] = true;
                table4Data.friability = table4Data.friability || {};
                table4Data.friability[shift] = record.sandFriability[shift];
              }
            });
          }
          
          setTable4(prev => ({
            ...prev,
            ...table4Data
          }));
          setTableLocks(prev => ({
            ...prev,
            table4: table4Locks
          }));
        }
        
        // Set current S.No for Table 5 based on existing testParameter entries
        if (record.testParameter && Array.isArray(record.testParameter)) {
          setCurrentSNo(record.testParameter.length + 1);
        } else {
          setCurrentSNo(1);
        }
      } else {
        // No data found, clear all locks and reset S.No
        resetAllTables();
        setCurrentSNo(1);
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
      resetAllTables();
      setCurrentSNo(1);
    }
  };

  // Separate reset functions for each table
  const resetTable1 = () => {
    if (!window.confirm('Are you sure you want to reset Table 1?')) return;
    setTable1({
      shiftI: { rSand: [''], nSand: [''], mixingMode: [''], bentonite: [''], coalDustPremix: [''] },
      shiftII: { rSand: [''], nSand: [''], mixingMode: [''], bentonite: [''], coalDustPremix: [''] },
      shiftIII: { rSand: [''], nSand: [''], mixingMode: [''], bentonite: [''], coalDustPremix: [''] },
      checkpointCoalDustPremix: '',
      batchNoBentonite: '',
      batchNoCoalDustPremix: ''
    });
    setTableLocks(prev => ({ ...prev, table1: {} }));
  };

  const resetTable2 = () => {
    if (!window.confirm('Are you sure you want to reset Table 2?')) return;
    setTable2({
      shiftI: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
      shiftII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
      shiftIII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' }
    });
    setTableLocks(prev => ({ ...prev, table2: {} }));
  };

  const resetTable3 = () => {
    if (!window.confirm('Are you sure you want to reset Table 3?')) return;
    setTable3({
      shiftI: { 
        mixNoStart: [''], 
        mixNoEnd: [''], 
        mixNoTotal: [''], 
        noOfMixRejected: [''], 
        returnSandHopperLevel: [''] 
      },
      shiftII: { 
        mixNoStart: [''], 
        mixNoEnd: [''], 
        mixNoTotal: [''], 
        noOfMixRejected: [''], 
        returnSandHopperLevel: [''] 
      },
      shiftIII: { 
        mixNoStart: [''], 
        mixNoEnd: [''], 
        mixNoTotal: [''], 
        noOfMixRejected: [''], 
        returnSandHopperLevel: [''] 
      },
      total: { mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '' }
    });
    setTableLocks(prev => ({ ...prev, table3: {} }));
  };

  const resetTable4 = () => {
    if (!window.confirm('Are you sure you want to reset Table 4?')) return;
    setTable4({
      sandLump: '',
      newSandWt: '',
      friability: {
        shiftI: '',
        shiftII: '',
        shiftIII: ''
      }
    });
    setTableLocks(prev => ({ ...prev, table4: {} }));
  };

  const resetTable5 = () => {
    setTable5({
      timeHour: '',
      timeMinute: '',
      mixNo: '',
      permeability: '',
      gcsCheckpoint: '',
      gcsValue: '',
      wts: '',
      moisture: '',
      compactability: '',
      compressability: '',
      waterLitrePerKgMix: '',
      sandTempBC: '',
      sandTempWU: '',
      sandTempSSU: '',
      newSandKgsPerMould: '',
      bentoniteCheckpoint: '',
      bentoniteWithPremix: '',
      bentoniteOnly: '',
      premixCoalDustCheckpoint: '',
      premixKgsMix: '',
      coalDustKgsMix: '',
      lcScmCompactabilityCheckpoint: '',
      lcScmCompactabilityValue: '',
      mouldStrengthShearCheckpoint: '',
      mouldStrengthShearValue: '',
      preparedSandLumpsPerKg: '',
      itemName: '',
      remarks: ''
    });
  };

  const handleViewReport = () => {
    navigate('/sand-lab/sand-testing-record/report');
  };

  // Helper function to check if a field is locked
  const isFieldLocked = (tableNum, fieldPath) => {
    if (tableNum > 4) return false; // Table 5 doesn't have locks
    const locks = tableLocks[`table${tableNum}`];
    return locks && locks[fieldPath] === true;
  };

  const handleEnterToNext = (e) => {
    if (e.key !== 'Enter') return;
    const container = e.target.closest('.sand-shift-table, .sand-table5-form-grid, .sand-primary-container');
    if (!container) return;
    e.preventDefault();
    const inputs = Array.from(container.querySelectorAll('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]):not([readonly])'));
    const idx = inputs.indexOf(e.target);
    if (idx > -1 && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="sand-header">     
        <div className="sand-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Sand Testing Record
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {primaryData.date ? new Date(primaryData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Loading...'}
        </div>
      </div>

      {/* Table 1 */}
      <div className="sand-section-header">
        <h3>Table 1</h3>
            </div>
      <table className="sand-shift-table table-1" onKeyDown={handleEnterToNext}>
        <thead>
          <tr>
            <th>Shift</th>
            <th>I</th>
            <th>II</th>
            <th>III</th>
          </tr>
        </thead>
        <tbody>
          <tr key="r-sand">
            <td>R. Sand ( Kgs/Mix )</td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftI.rSand.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftI', 'rSand', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftI.rSand.${index}`)}
                      readOnly={isFieldLocked(1, `shiftI.rSand.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftI.rSand.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftI.rSand.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftI.rSand.length - 1 && !isFieldLocked(1, `shiftI.rSand.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftI', 'rSand')} />
                    )}
                    {index === table1.shiftI.rSand.length - 1 && table1.shiftI.rSand.length > 1 && !isFieldLocked(1, `shiftI.rSand.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftI', 'rSand', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftII.rSand.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftII', 'rSand', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftII.rSand.${index}`)}
                      readOnly={isFieldLocked(1, `shiftII.rSand.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(1, `shiftII.rSand.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(1, `shiftII.rSand.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftII.rSand.length - 1 && !isFieldLocked(1, `shiftII.rSand.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftII', 'rSand')} />
                    )}
                    {index === table1.shiftII.rSand.length - 1 && table1.shiftII.rSand.length > 1 && !isFieldLocked(1, `shiftII.rSand.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftII', 'rSand', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftIII.rSand.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftIII', 'rSand', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftIII.rSand.${index}`)}
                      readOnly={isFieldLocked(1, `shiftIII.rSand.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(1, `shiftIII.rSand.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(1, `shiftIII.rSand.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftIII.rSand.length - 1 && !isFieldLocked(1, `shiftIII.rSand.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftIII', 'rSand')} />
                    )}
                    {index === table1.shiftIII.rSand.length - 1 && table1.shiftIII.rSand.length > 1 && !isFieldLocked(1, `shiftIII.rSand.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftIII', 'rSand', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr key="n-sand">
            <td>N. Sand ( Kgs/Mix )</td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftI.nSand.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftI', 'nSand', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftI.nSand.${index}`)}
                      readOnly={isFieldLocked(1, `shiftI.nSand.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftI.nSand.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftI.nSand.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftI.nSand.length - 1 && !isFieldLocked(1, `shiftI.nSand.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftI', 'nSand')} />
                    )}
                    {index === table1.shiftI.nSand.length - 1 && table1.shiftI.nSand.length > 1 && !isFieldLocked(1, `shiftI.nSand.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftI', 'nSand', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftII.nSand.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftII', 'nSand', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftII.nSand.${index}`)}
                      readOnly={isFieldLocked(1, `shiftII.nSand.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftII.nSand.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftII.nSand.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftII.nSand.length - 1 && !isFieldLocked(1, `shiftII.nSand.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftII', 'nSand')} />
                    )}
                    {index === table1.shiftII.nSand.length - 1 && table1.shiftII.nSand.length > 1 && !isFieldLocked(1, `shiftII.nSand.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftII', 'nSand', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftIII.nSand.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftIII', 'nSand', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftIII.nSand.${index}`)}
                      readOnly={isFieldLocked(1, `shiftIII.nSand.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftIII.nSand.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftIII.nSand.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftIII.nSand.length - 1 && !isFieldLocked(1, `shiftIII.nSand.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftIII', 'nSand')} />
                    )}
                    {index === table1.shiftIII.nSand.length - 1 && table1.shiftIII.nSand.length > 1 && !isFieldLocked(1, `shiftIII.nSand.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftIII', 'nSand', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr key="mixing-mode">
            <td>Mixing Mode</td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftI.mixingMode.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftI', 'mixingMode', index, e.target.value)}
                      placeholder="Enter mode"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftI.mixingMode.${index}`)}
                      readOnly={isFieldLocked(1, `shiftI.mixingMode.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftI.mixingMode.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftI.mixingMode.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftI.mixingMode.length - 1 && !isFieldLocked(1, `shiftI.mixingMode.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftI', 'mixingMode')} />
                    )}
                    {index === table1.shiftI.mixingMode.length - 1 && table1.shiftI.mixingMode.length > 1 && !isFieldLocked(1, `shiftI.mixingMode.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftI', 'mixingMode', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftII.mixingMode.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftII', 'mixingMode', index, e.target.value)}
                      placeholder="Enter mode"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftII.mixingMode.${index}`)}
                      readOnly={isFieldLocked(1, `shiftII.mixingMode.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftII.mixingMode.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftII.mixingMode.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftII.mixingMode.length - 1 && !isFieldLocked(1, `shiftII.mixingMode.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftII', 'mixingMode')} />
                    )}
                    {index === table1.shiftII.mixingMode.length - 1 && table1.shiftII.mixingMode.length > 1 && !isFieldLocked(1, `shiftII.mixingMode.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftII', 'mixingMode', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftIII.mixingMode.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftIII', 'mixingMode', index, e.target.value)}
                      placeholder="Enter mode"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftIII.mixingMode.${index}`)}
                      readOnly={isFieldLocked(1, `shiftIII.mixingMode.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftIII.mixingMode.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftIII.mixingMode.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftIII.mixingMode.length - 1 && !isFieldLocked(1, `shiftIII.mixingMode.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftIII', 'mixingMode')} />
                    )}
                    {index === table1.shiftIII.mixingMode.length - 1 && table1.shiftIII.mixingMode.length > 1 && !isFieldLocked(1, `shiftIII.mixingMode.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftIII', 'mixingMode', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr key="bentonite">
            <td>Bentonite ( Kgs/Mix )</td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftI.bentonite.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftI', 'bentonite', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftI.bentonite.${index}`)}
                      readOnly={isFieldLocked(1, `shiftI.bentonite.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftI.bentonite.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftI.bentonite.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftI.bentonite.length - 1 && !isFieldLocked(1, `shiftI.bentonite.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftI', 'bentonite')} />
                    )}
                    {index === table1.shiftI.bentonite.length - 1 && table1.shiftI.bentonite.length > 1 && !isFieldLocked(1, `shiftI.bentonite.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftI', 'bentonite', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftII.bentonite.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftII', 'bentonite', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftII.bentonite.${index}`)}
                      readOnly={isFieldLocked(1, `shiftII.bentonite.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftII.bentonite.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftII.bentonite.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftII.bentonite.length - 1 && !isFieldLocked(1, `shiftII.bentonite.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftII', 'bentonite')} />
                    )}
                    {index === table1.shiftII.bentonite.length - 1 && table1.shiftII.bentonite.length > 1 && !isFieldLocked(1, `shiftII.bentonite.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftII', 'bentonite', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftIII.bentonite.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftIII', 'bentonite', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftIII.bentonite.${index}`)}
                      readOnly={isFieldLocked(1, `shiftIII.bentonite.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftIII.bentonite.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftIII.bentonite.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftIII.bentonite.length - 1 && !isFieldLocked(1, `shiftIII.bentonite.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftIII', 'bentonite')} />
                    )}
                    {index === table1.shiftIII.bentonite.length - 1 && table1.shiftIII.bentonite.length > 1 && !isFieldLocked(1, `shiftIII.bentonite.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftIII', 'bentonite', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr key="coal-dust-premix">
            <td>Coal Dust / Premix ( Kgs / Mix )</td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftI.coalDustPremix.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftI', 'coalDustPremix', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftI.coalDustPremix.${index}`)}
                      readOnly={isFieldLocked(1, `shiftI.coalDustPremix.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftI.coalDustPremix.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftI.coalDustPremix.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftI.coalDustPremix.length - 1 && !isFieldLocked(1, `shiftI.coalDustPremix.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftI', 'coalDustPremix')} />
                    )}
                    {index === table1.shiftI.coalDustPremix.length - 1 && table1.shiftI.coalDustPremix.length > 1 && !isFieldLocked(1, `shiftI.coalDustPremix.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftI', 'coalDustPremix', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftII.coalDustPremix.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftII', 'coalDustPremix', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftII.coalDustPremix.${index}`)}
                      readOnly={isFieldLocked(1, `shiftII.coalDustPremix.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftII.coalDustPremix.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftII.coalDustPremix.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftII.coalDustPremix.length - 1 && !isFieldLocked(1, `shiftII.coalDustPremix.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftII', 'coalDustPremix')} />
                    )}
                    {index === table1.shiftII.coalDustPremix.length - 1 && table1.shiftII.coalDustPremix.length > 1 && !isFieldLocked(1, `shiftII.coalDustPremix.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftII', 'coalDustPremix', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table1.shiftIII.coalDustPremix.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable1ArrayChange('shiftIII', 'coalDustPremix', index, e.target.value)}
                      placeholder="Enter value"
                      className="sand-table-input"
                      disabled={isFieldLocked(1, `shiftIII.coalDustPremix.${index}`)}
                      readOnly={isFieldLocked(1, `shiftIII.coalDustPremix.${index}`)}
                      style={{
                        backgroundColor: isFieldLocked(1, `shiftIII.coalDustPremix.${index}`) ? '#f1f5f9' : '#ffffff',
                        cursor: isFieldLocked(1, `shiftIII.coalDustPremix.${index}`) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table1.shiftIII.coalDustPremix.length - 1 && !isFieldLocked(1, `shiftIII.coalDustPremix.${index}`) && (
                      <PlusButton onClick={() => addTable1ArrayEntry('shiftIII', 'coalDustPremix')} />
                    )}
                    {index === table1.shiftIII.coalDustPremix.length - 1 && table1.shiftIII.coalDustPremix.length > 1 && !isFieldLocked(1, `shiftIII.coalDustPremix.${index}`) && (
                      <MinusButton onClick={() => removeTable1ArrayEntry('shiftIII', 'coalDustPremix', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr key="batch-no">
            <td>Batch NO...</td>
            <td colSpan={3}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Bentonite</label>
                  <input
                    type="text"
                    value={table1.batchNoBentonite || ''}
                    onChange={(e) => handleTableChange(1, 'batchNoBentonite', e.target.value)}
                    placeholder="Enter batch no"
                    className="sand-table-input"
                    disabled={isFieldLocked(1, 'batchNo.bentonite')}
                    readOnly={isFieldLocked(1, 'batchNo.bentonite')}
                    style={{
                      backgroundColor: (isFieldLocked(1, 'batchNo.bentonite')) ? '#f1f5f9' : '#ffffff',
                      cursor: (isFieldLocked(1, 'batchNo.bentonite')) ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: (isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')) ? 0.6 : 1 }}>
                      <input
                        type="radio"
                        name="checkpoint-coalDustPremix"
                        value="coalDust"
                        checked={table1.checkpointCoalDustPremix === 'coalDust'}
                        onChange={(e) => handleTableChange(1, 'checkpointCoalDustPremix', e.target.value)}
                        disabled={isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')}
                        style={{ cursor: (isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')) ? 'not-allowed' : 'pointer' }}
                      />
                      <span>Coal dust</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: (isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')) ? 0.6 : 1 }}>
                      <input
                        type="radio"
                        name="checkpoint-coalDustPremix"
                        value="premix"
                        checked={table1.checkpointCoalDustPremix === 'premix'}
                        onChange={(e) => handleTableChange(1, 'checkpointCoalDustPremix', e.target.value)}
                        disabled={isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')}
                        style={{ cursor: (isFieldLocked(1, 'batchNo.coalDust') || isFieldLocked(1, 'batchNo.premix')) ? 'not-allowed' : 'pointer' }}
                      />
                      <span>Premix</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={table1.batchNoCoalDustPremix || ''}
                    onChange={(e) => handleTableChange(1, 'batchNoCoalDustPremix', e.target.value)}
                    placeholder="Enter batch no"
                    className="sand-table-input"
                    disabled={(table1.checkpointCoalDustPremix === 'coalDust' && isFieldLocked(1, 'batchNo.coalDust')) || (table1.checkpointCoalDustPremix === 'premix' && isFieldLocked(1, 'batchNo.premix')) || !table1.checkpointCoalDustPremix}
                    readOnly={(table1.checkpointCoalDustPremix === 'coalDust' && isFieldLocked(1, 'batchNo.coalDust')) || (table1.checkpointCoalDustPremix === 'premix' && isFieldLocked(1, 'batchNo.premix'))}
                    style={{
                      backgroundColor: ((table1.checkpointCoalDustPremix === 'coalDust' && isFieldLocked(1, 'batchNo.coalDust')) || (table1.checkpointCoalDustPremix === 'premix' && isFieldLocked(1, 'batchNo.premix')) || !table1.checkpointCoalDustPremix) ? '#f1f5f9' : '#ffffff',
                      cursor: ((table1.checkpointCoalDustPremix === 'coalDust' && isFieldLocked(1, 'batchNo.coalDust')) || (table1.checkpointCoalDustPremix === 'premix' && isFieldLocked(1, 'batchNo.premix')) || !table1.checkpointCoalDustPremix) ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="sand-table-submit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="sand-reset-btn"
          onClick={resetTable1}
          type="button"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          className="sand-submit-btn"
          onClick={() => handleTableSubmit(1)}
          disabled={loadingStates.table1}
          type="button"
        >
          {loadingStates.table1 ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
          {loadingStates.table1 ? 'Saving...' : 'Save Table 1'}
        </button>
      </div>

      {/* Table 2 */}
      <div className="sand-section-header">
        <h3>Table 2</h3>
            </div>
      <table className="sand-shift-table table-2" onKeyDown={handleEnterToNext}>
        <thead>
          <tr>
            <th>Shift</th>
            <th>I</th>
            <th>II</th>
            <th>III</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Clay ( 11.0 - 14.5%)</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.totalClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'totalClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.totalClay')}
                readOnly={isFieldLocked(2, 'shiftI.totalClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.totalClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.totalClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.totalClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'totalClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.totalClay')}
                readOnly={isFieldLocked(2, 'shiftII.totalClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.totalClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.totalClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.totalClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'totalClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.totalClay')}
                readOnly={isFieldLocked(2, 'shiftIII.totalClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.totalClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.totalClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Active Clay ( 8.5 - 11.0 % )</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.activeClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'activeClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.activeClay')}
                readOnly={isFieldLocked(2, 'shiftI.activeClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.activeClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.activeClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.activeClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'activeClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.activeClay')}
                readOnly={isFieldLocked(2, 'shiftII.activeClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.activeClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.activeClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.activeClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'activeClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.activeClay')}
                readOnly={isFieldLocked(2, 'shiftIII.activeClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.activeClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.activeClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Dead Clay ( 2.0 - 4.0% )</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.deadClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'deadClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.deadClay')}
                readOnly={isFieldLocked(2, 'shiftI.deadClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.deadClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.deadClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.deadClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'deadClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.deadClay')}
                readOnly={isFieldLocked(2, 'shiftII.deadClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.deadClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.deadClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.deadClay || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'deadClay')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.deadClay')}
                readOnly={isFieldLocked(2, 'shiftIII.deadClay')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.deadClay')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.deadClay')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td>V.C.M (2.0 - 3.2%)</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.vcm || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'vcm')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.vcm')}
                readOnly={isFieldLocked(2, 'shiftI.vcm')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.vcm')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.vcm')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.vcm || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'vcm')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.vcm')}
                readOnly={isFieldLocked(2, 'shiftII.vcm')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.vcm')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.vcm')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.vcm || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'vcm')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.vcm')}
                readOnly={isFieldLocked(2, 'shiftIII.vcm')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.vcm')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.vcm')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td>L.O.I ( 4.5 - 6.0 % )</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.loi || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'loi')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.loi')}
                readOnly={isFieldLocked(2, 'shiftI.loi')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.loi')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.loi')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.loi || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'loi')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.loi')}
                readOnly={isFieldLocked(2, 'shiftII.loi')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.loi')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.loi')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.loi || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'loi')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.loi')}
                readOnly={isFieldLocked(2, 'shiftIII.loi')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.loi')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.loi')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td>AFS No. ( min 48 )</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.afsNo || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'afsNo')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.afsNo')}
                readOnly={isFieldLocked(2, 'shiftI.afsNo')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.afsNo')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.afsNo')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.afsNo || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'afsNo')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.afsNo')}
                readOnly={isFieldLocked(2, 'shiftII.afsNo')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.afsNo')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.afsNo')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.afsNo || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'afsNo')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.afsNo')}
                readOnly={isFieldLocked(2, 'shiftIII.afsNo')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.afsNo')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.afsNo')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Fines (10% Max )</td>
            <td>
              <input
                type="number"
                value={table2.shiftI.fines || ''}
                onChange={(e) => handleTableChange(2, 'shiftI', e.target.value, 'fines')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftI.fines')}
                readOnly={isFieldLocked(2, 'shiftI.fines')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftI.fines')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftI.fines')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftII.fines || ''}
                onChange={(e) => handleTableChange(2, 'shiftII', e.target.value, 'fines')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftII.fines')}
                readOnly={isFieldLocked(2, 'shiftII.fines')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftII.fines')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftII.fines')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table2.shiftIII.fines || ''}
                onChange={(e) => handleTableChange(2, 'shiftIII', e.target.value, 'fines')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(2, 'shiftIII.fines')}
                readOnly={isFieldLocked(2, 'shiftIII.fines')}
                style={{
                  backgroundColor: (isFieldLocked(2, 'shiftIII.fines')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(2, 'shiftIII.fines')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="sand-table-submit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="sand-reset-btn"
          onClick={resetTable2}
          type="button"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          className="sand-submit-btn"
          onClick={() => handleTableSubmit(2)}
          disabled={loadingStates.table2}
          type="button"
        >
          {loadingStates.table2 ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
          {loadingStates.table2 ? 'Saving...' : 'Save Table 2'}
        </button>
      </div>

      {/* Table 3 */}
      <div className="sand-section-header">
        <h3>Table 3</h3>
      </div>
      <table className="sand-shift-table table-3">
        <thead>
          <tr>
            <th rowSpan="2">Shift</th>
            <th colSpan="3">Mix No.</th>
            <th rowSpan="2">No. Of Mix Rejected</th>
            <th rowSpan="2">Return Sand Hopper Level</th>
          </tr>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th style={{ borderRight: '2px solid #cbd5e1' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center' }}>I</td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftI.mixNoStart.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftI', 'mixNoStart', index, e.target.value)}
                      placeholder="Start"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftI.mixNoStart.${index}`)}
                      readOnly={isFieldLocked(3, `shiftI.mixNoStart.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftI.mixNoStart.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftI.mixNoStart.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftI.mixNoStart.length - 1 && !isFieldLocked(3, `shiftI.mixNoStart.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftI', 'mixNoStart')} />
                    )}
                    {index === table3.shiftI.mixNoStart.length - 1 && table3.shiftI.mixNoStart.length > 1 && !isFieldLocked(3, `shiftI.mixNoStart.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftI', 'mixNoStart', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftI.mixNoEnd.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftI', 'mixNoEnd', index, e.target.value)}
                      placeholder="End"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftI.mixNoEnd.${index}`)}
                      readOnly={isFieldLocked(3, `shiftI.mixNoEnd.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftI.mixNoEnd.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftI.mixNoEnd.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftI.mixNoEnd.length - 1 && !isFieldLocked(3, `shiftI.mixNoEnd.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftI', 'mixNoEnd')} />
                    )}
                    {index === table3.shiftI.mixNoEnd.length - 1 && table3.shiftI.mixNoEnd.length > 1 && !isFieldLocked(3, `shiftI.mixNoEnd.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftI', 'mixNoEnd', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ borderRight: '2px solid #cbd5e1' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftI.mixNoTotal.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftI', 'mixNoTotal', index, e.target.value)}
                      placeholder="Total"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftI.mixNoTotal.${index}`)}
                      readOnly={isFieldLocked(3, `shiftI.mixNoTotal.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftI.mixNoTotal.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftI.mixNoTotal.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftI.mixNoTotal.length - 1 && !isFieldLocked(3, `shiftI.mixNoTotal.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftI', 'mixNoTotal')} />
                    )}
                    {index === table3.shiftI.mixNoTotal.length - 1 && table3.shiftI.mixNoTotal.length > 1 && !isFieldLocked(3, `shiftI.mixNoTotal.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftI', 'mixNoTotal', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table3.shiftI.noOfMixRejected.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftI', 'noOfMixRejected', index, e.target.value)}
                      placeholder="Rejected"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftI.noOfMixRejected.${index}`)}
                      readOnly={isFieldLocked(3, `shiftI.noOfMixRejected.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftI.noOfMixRejected.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftI.noOfMixRejected.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftI.noOfMixRejected.length - 1 && !isFieldLocked(3, `shiftI.noOfMixRejected.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftI', 'noOfMixRejected')} />
                    )}
                    {index === table3.shiftI.noOfMixRejected.length - 1 && table3.shiftI.noOfMixRejected.length > 1 && !isFieldLocked(3, `shiftI.noOfMixRejected.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftI', 'noOfMixRejected', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table3.shiftI.returnSandHopperLevel.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftI', 'returnSandHopperLevel', index, e.target.value)}
                      placeholder="Level"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftI.returnSandHopperLevel.${index}`)}
                      readOnly={isFieldLocked(3, `shiftI.returnSandHopperLevel.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftI.returnSandHopperLevel.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftI.returnSandHopperLevel.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftI.returnSandHopperLevel.length - 1 && !isFieldLocked(3, `shiftI.returnSandHopperLevel.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftI', 'returnSandHopperLevel')} />
                    )}
                    {index === table3.shiftI.returnSandHopperLevel.length - 1 && table3.shiftI.returnSandHopperLevel.length > 1 && !isFieldLocked(3, `shiftI.returnSandHopperLevel.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftI', 'returnSandHopperLevel', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>II</td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftII.mixNoStart.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftII', 'mixNoStart', index, e.target.value)}
                      placeholder="Start"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftII.mixNoStart.${index}`)}
                      readOnly={isFieldLocked(3, `shiftII.mixNoStart.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftII.mixNoStart.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftII.mixNoStart.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftII.mixNoStart.length - 1 && !isFieldLocked(3, `shiftII.mixNoStart.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftII', 'mixNoStart')} />
                    )}
                    {index === table3.shiftII.mixNoStart.length - 1 && table3.shiftII.mixNoStart.length > 1 && !isFieldLocked(3, `shiftII.mixNoStart.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftII', 'mixNoStart', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftII.mixNoEnd.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftII', 'mixNoEnd', index, e.target.value)}
                      placeholder="End"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftII.mixNoEnd.${index}`)}
                      readOnly={isFieldLocked(3, `shiftII.mixNoEnd.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftII.mixNoEnd.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftII.mixNoEnd.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftII.mixNoEnd.length - 1 && !isFieldLocked(3, `shiftII.mixNoEnd.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftII', 'mixNoEnd')} />
                    )}
                    {index === table3.shiftII.mixNoEnd.length - 1 && table3.shiftII.mixNoEnd.length > 1 && !isFieldLocked(3, `shiftII.mixNoEnd.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftII', 'mixNoEnd', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ borderRight: '2px solid #cbd5e1' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftII.mixNoTotal.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftII', 'mixNoTotal', index, e.target.value)}
                      placeholder="Total"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftII.mixNoTotal.${index}`)}
                      readOnly={isFieldLocked(3, `shiftII.mixNoTotal.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftII.mixNoTotal.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftII.mixNoTotal.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftII.mixNoTotal.length - 1 && !isFieldLocked(3, `shiftII.mixNoTotal.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftII', 'mixNoTotal')} />
                    )}
                    {index === table3.shiftII.mixNoTotal.length - 1 && table3.shiftII.mixNoTotal.length > 1 && !isFieldLocked(3, `shiftII.mixNoTotal.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftII', 'mixNoTotal', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table3.shiftII.noOfMixRejected.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftII', 'noOfMixRejected', index, e.target.value)}
                      placeholder="Rejected"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftII.noOfMixRejected.${index}`)}
                      readOnly={isFieldLocked(3, `shiftII.noOfMixRejected.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftII.noOfMixRejected.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftII.noOfMixRejected.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftII.noOfMixRejected.length - 1 && !isFieldLocked(3, `shiftII.noOfMixRejected.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftII', 'noOfMixRejected')} />
                    )}
                    {index === table3.shiftII.noOfMixRejected.length - 1 && table3.shiftII.noOfMixRejected.length > 1 && !isFieldLocked(3, `shiftII.noOfMixRejected.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftII', 'noOfMixRejected', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table3.shiftII.returnSandHopperLevel.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftII', 'returnSandHopperLevel', index, e.target.value)}
                      placeholder="Level"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftII.returnSandHopperLevel.${index}`)}
                      readOnly={isFieldLocked(3, `shiftII.returnSandHopperLevel.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftII.returnSandHopperLevel.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftII.returnSandHopperLevel.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftII.returnSandHopperLevel.length - 1 && !isFieldLocked(3, `shiftII.returnSandHopperLevel.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftII', 'returnSandHopperLevel')} />
                    )}
                    {index === table3.shiftII.returnSandHopperLevel.length - 1 && table3.shiftII.returnSandHopperLevel.length > 1 && !isFieldLocked(3, `shiftII.returnSandHopperLevel.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftII', 'returnSandHopperLevel', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>III</td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftIII.mixNoStart.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftIII', 'mixNoStart', index, e.target.value)}
                      placeholder="Start"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftIII.mixNoStart.${index}`)}
                      readOnly={isFieldLocked(3, `shiftIII.mixNoStart.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftIII.mixNoStart.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftIII.mixNoStart.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftIII.mixNoStart.length - 1 && !isFieldLocked(3, `shiftIII.mixNoStart.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftIII', 'mixNoStart')} />
                    )}
                    {index === table3.shiftIII.mixNoStart.length - 1 && table3.shiftIII.mixNoStart.length > 1 && !isFieldLocked(3, `shiftIII.mixNoStart.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftIII', 'mixNoStart', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftIII.mixNoEnd.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftIII', 'mixNoEnd', index, e.target.value)}
                      placeholder="End"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftIII.mixNoEnd.${index}`)}
                      readOnly={isFieldLocked(3, `shiftIII.mixNoEnd.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftIII.mixNoEnd.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftIII.mixNoEnd.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftIII.mixNoEnd.length - 1 && !isFieldLocked(3, `shiftIII.mixNoEnd.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftIII', 'mixNoEnd')} />
                    )}
                    {index === table3.shiftIII.mixNoEnd.length - 1 && table3.shiftIII.mixNoEnd.length > 1 && !isFieldLocked(3, `shiftIII.mixNoEnd.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftIII', 'mixNoEnd', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td style={{ borderRight: '2px solid #cbd5e1' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {table3.shiftIII.mixNoTotal.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftIII', 'mixNoTotal', index, e.target.value)}
                      placeholder="Total"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftIII.mixNoTotal.${index}`)}
                      readOnly={isFieldLocked(3, `shiftIII.mixNoTotal.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftIII.mixNoTotal.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftIII.mixNoTotal.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftIII.mixNoTotal.length - 1 && !isFieldLocked(3, `shiftIII.mixNoTotal.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftIII', 'mixNoTotal')} />
                    )}
                    {index === table3.shiftIII.mixNoTotal.length - 1 && table3.shiftIII.mixNoTotal.length > 1 && !isFieldLocked(3, `shiftIII.mixNoTotal.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftIII', 'mixNoTotal', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table3.shiftIII.noOfMixRejected.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftIII', 'noOfMixRejected', index, e.target.value)}
                      placeholder="Rejected"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftIII.noOfMixRejected.${index}`)}
                      readOnly={isFieldLocked(3, `shiftIII.noOfMixRejected.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftIII.noOfMixRejected.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftIII.noOfMixRejected.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftIII.noOfMixRejected.length - 1 && !isFieldLocked(3, `shiftIII.noOfMixRejected.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftIII', 'noOfMixRejected')} />
                    )}
                    {index === table3.shiftIII.noOfMixRejected.length - 1 && table3.shiftIII.noOfMixRejected.length > 1 && !isFieldLocked(3, `shiftIII.noOfMixRejected.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftIII', 'noOfMixRejected', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
            <td>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {table3.shiftIII.returnSandHopperLevel.map((value, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleTable3ArrayChange('shiftIII', 'returnSandHopperLevel', index, e.target.value)}
                      placeholder="Level"
                      className="sand-table-input"
                      disabled={isFieldLocked(3, `shiftIII.returnSandHopperLevel.${index}`)}
                      readOnly={isFieldLocked(3, `shiftIII.returnSandHopperLevel.${index}`)}
                      style={{
                        backgroundColor: (isFieldLocked(3, `shiftIII.returnSandHopperLevel.${index}`)) ? '#f1f5f9' : '#ffffff',
                        cursor: (isFieldLocked(3, `shiftIII.returnSandHopperLevel.${index}`)) ? 'not-allowed' : 'text',
                        flex: 1,
                        minWidth: '80px'
                      }}
                    />
                    {index === table3.shiftIII.returnSandHopperLevel.length - 1 && !isFieldLocked(3, `shiftIII.returnSandHopperLevel.${index}`) && (
                      <PlusButton onClick={() => addTable3ArrayEntry('shiftIII', 'returnSandHopperLevel')} />
                    )}
                    {index === table3.shiftIII.returnSandHopperLevel.length - 1 && table3.shiftIII.returnSandHopperLevel.length > 1 && !isFieldLocked(3, `shiftIII.returnSandHopperLevel.${index}`) && (
                      <MinusButton onClick={() => removeTable3ArrayEntry('shiftIII', 'returnSandHopperLevel', index)} />
                    )}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="sand-table-submit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="sand-reset-btn"
          onClick={resetTable3}
          type="button"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          className="sand-submit-btn"
          onClick={() => handleTableSubmit(3)}
          disabled={loadingStates.table3}
          type="button"
        >
          {loadingStates.table3 ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
          {loadingStates.table3 ? 'Saving...' : 'Save Table 3'}
        </button>
      </div>

      {/* Table 4 */}
      <div className="sand-section-header">
        <h3>Table 4</h3>
            </div>
      <div className="sand-table-container-wrapper">
        <table className="sand-table sand-table-boxed">
          <tbody>
            <tr>
              <td>Sand Lump</td>
              <td>
              <input
                type="text"
                  value={table4.sandLump || ''}
                  onChange={(e) => handleTableChange(4, 'sandLump', e.target.value)}
                  placeholder="Enter value"
                  className="sand-table-input-small"
                  disabled={isFieldLocked(4, 'sandLump')}
                  readOnly={isFieldLocked(4, 'sandLump')}
                  style={{
                    backgroundColor: isFieldLocked(4, 'sandLump') ? '#f1f5f9' : '#ffffff',
                    cursor: isFieldLocked(4, 'sandLump') ? 'not-allowed' : 'text'
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>New Sand Wt</td>
              <td>
                <input
                  type="number"
                  value={table4.newSandWt || ''}
                  onChange={(e) => handleTableChange(4, 'newSandWt', e.target.value)}
                  placeholder="Enter value"
                  className="sand-table-input-small"
                  disabled={isFieldLocked(4, 'newSandWt')}
                  readOnly={isFieldLocked(4, 'newSandWt')}
                  style={{
                    backgroundColor: (isFieldLocked(4, 'newSandWt')) ? '#f1f5f9' : '#ffffff',
                    cursor: (isFieldLocked(4, 'newSandWt')) ? 'not-allowed' : 'text'
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <table className="sand-shift-table table-4" onKeyDown={handleEnterToNext}>
          <thead>
            <tr>
              <th>Shift</th>
              <th>I</th>
              <th>II</th>
              <th>III</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Prepared Sand Friability ( 8.0 - 13.0 % )</td>
              <td>
                <input
                  type="number"
                  value={table4.friability.shiftI || ''}
                  onChange={(e) => handleTableChange(4, 'friability', e.target.value, 'shiftI')}
                  placeholder="Enter value"
                  className="sand-table-input"
                  disabled={isFieldLocked(4, 'friability.shiftI')}
                  readOnly={isFieldLocked(4, 'friability.shiftI')}
                  style={{
                    backgroundColor: (isFieldLocked(4, 'friability.shiftI')) ? '#f1f5f9' : '#ffffff',
                    cursor: (isFieldLocked(4, 'friability.shiftI')) ? 'not-allowed' : 'text'
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={table4.friability.shiftII || ''}
                  onChange={(e) => handleTableChange(4, 'friability', e.target.value, 'shiftII')}
                  placeholder="Enter value"
                  className="sand-table-input"
                  disabled={isFieldLocked(4, 'friability.shiftII')}
                  readOnly={isFieldLocked(4, 'friability.shiftII')}
                  style={{
                    backgroundColor: (isFieldLocked(4, 'friability.shiftII')) ? '#f1f5f9' : '#ffffff',
                    cursor: (isFieldLocked(4, 'friability.shiftII')) ? 'not-allowed' : 'text'
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={table4.friability.shiftIII || ''}
                  onChange={(e) => handleTableChange(4, 'friability', e.target.value, 'shiftIII')}
                  placeholder="Enter value"
                  className="sand-table-input"
                  disabled={isFieldLocked(4, 'friability.shiftIII')}
                  readOnly={isFieldLocked(4, 'friability.shiftIII')}
                  style={{
                    backgroundColor: (isFieldLocked(4, 'friability.shiftIII')) ? '#f1f5f9' : '#ffffff',
                    cursor: (isFieldLocked(4, 'friability.shiftIII')) ? 'not-allowed' : 'text'
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="sand-table-submit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="sand-reset-btn"
          onClick={resetTable4}
          type="button"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          className="sand-submit-btn"
          onClick={() => handleTableSubmit(4)}
          disabled={loadingStates.table4}
          type="button"
        >
          {loadingStates.table4 ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
          {loadingStates.table4 ? 'Saving...' : 'Save Table 4'}
        </button>
      </div>

      {/* Table 5 */}
      <div className="sand-table5-main-card">
        <h4 className="sand-table5-main-card-title">Sand Properties & Test Parameters</h4>

        <div style={{ padding: '1rem' }}>
          <h5 style={{ marginBottom: '1rem', color: '#374151', fontWeight: '600' }}>S.No: {currentSNo}</h5>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} onKeyDown={handleEnterToNext}>
            <div className="sand-table5-form-group">
              <label>Time</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  name="timeHour" 
                  value={table5.timeHour || ''} 
                  onChange={(e) => handleTable5Change('timeHour', e.target.value)} 
                      placeholder="HH"
                      min="0"
                      max="23"
                      className="sand-table5-input"
                      style={{ width: '70px' }}
                    />
                  <span>:</span>
                  <input 
                    type="number" 
                    name="timeMinute" 
                    value={table5.timeMinute || ''} 
                    onChange={(e) => handleTable5Change('timeMinute', e.target.value)} 
                    placeholder="MM"
                    min="0"
                    max="59"
                    className="sand-table5-input"
                    style={{ width: '70px' }}
                  />
                </div>
              </div>
              <div className="sand-table5-form-group">
                <label>Mix No</label>
                <input 
                  type="text" 
                  name="mixNo" 
                  value={table5.mixNo || ''} 
                  onChange={(e) => handleTable5Change('mixNo', e.target.value)} 
              placeholder="Enter Mix No"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Permeability (90-160)</label>
            <input 
              type="number" 
              name="permeability" 
              value={table5.permeability || ''} 
              onChange={(e) => handleTable5Change('permeability', e.target.value)} 
              placeholder="Enter value"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>G.C.S (Gm/cm²)</label>
            <div className="sand-input-combo">
              <select
                name="gcs-checkpoint"
                value={table5.gcsCheckpoint || ''}
                onChange={(e) => handleTable5Change('gcsCheckpoint', e.target.value)}
                className="sand-table5-input"
              >
                <option value="" disabled>Select checkpoint</option>
                <option value="fdyA">FDY-A (Min 1800)</option>
                <option value="fdyB">FDY-B (Min 1900)</option>
              </select>
              <input 
                type="number" 
                name="gcsValue" 
                value={table5.gcsValue || ''} 
                onChange={(e) => handleTable5Change('gcsValue', e.target.value)} 
                placeholder={table5.gcsCheckpoint === 'fdyA' ? 'FDY-A value' : table5.gcsCheckpoint === 'fdyB' ? 'FDY-B value' : 'Enter value'}
                step="0.01"
                className="sand-table5-input"
              />
            </div>
          </div>
          <div className="sand-table5-form-group">
            <label>W.T.S (N/cm² Min 0.15)</label>
            <input 
              type="number" 
              name="wts" 
              value={table5.wts || ''} 
              onChange={(e) => handleTable5Change('wts', e.target.value)} 
              placeholder="Enter value"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Moisture% (3.0-4.0%)</label>
            <input 
              type="number" 
              name="moisture" 
              value={table5.moisture || ''} 
              onChange={(e) => handleTable5Change('moisture', e.target.value)} 
              placeholder="Enter %"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Compactability% (At DMM 33-40%)</label>
            <input 
              type="number" 
              name="compactability" 
              value={table5.compactability || ''} 
              onChange={(e) => handleTable5Change('compactability', e.target.value)} 
              placeholder="Enter %"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Compressability% (At DMM 20-28%)</label>
            <input 
              type="number" 
              name="compressability" 
              value={table5.compressability || ''} 
              onChange={(e) => handleTable5Change('compressability', e.target.value)} 
              placeholder="Enter %"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Water (Litre /Kg Mix)</label>
            <input 
              type="number" 
              name="waterLitrePerKgMix" 
              value={table5.waterLitrePerKgMix || ''} 
              onChange={(e) => handleTable5Change('waterLitrePerKgMix', e.target.value)} 
              placeholder="Enter value"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Sand Temp C (°C)</label>
            <div className="sand-input-combo-3">
              <input 
                type="number" 
                name="sandTempBC" 
                value={table5.sandTempBC || ''} 
                onChange={(e) => handleTable5Change('sandTempBC', e.target.value)} 
                placeholder="BC"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="sandTempWU" 
                value={table5.sandTempWU || ''} 
                onChange={(e) => handleTable5Change('sandTempWU', e.target.value)} 
                placeholder="WU"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="sandTempSSU" 
                value={table5.sandTempSSU || ''} 
                onChange={(e) => handleTable5Change('sandTempSSU', e.target.value)} 
                placeholder="SSU"
                step="0.01"
                className="sand-table5-input"
              />
            </div>
          </div>
          <div className="sand-table5-form-group">
            <label>New Sand (kgs/Mould 0.0-5.0)</label>
            <input 
              type="number" 
              name="newSandKgsPerMould" 
              value={table5.newSandKgsPerMould || ''} 
              onChange={(e) => handleTable5Change('newSandKgsPerMould', e.target.value)} 
              placeholder="Enter value"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Bentonite</label>
            <div className="sand-input-combo-3">
              <select
                name="bentonite-checkpoint"
                value={table5.bentoniteCheckpoint || ''}
                onChange={(e) => handleTable5Change('bentoniteCheckpoint', e.target.value)}
                className="sand-table5-input"
              >
                <option value="" disabled>Select type</option>
                <option value="withPremix">With premix (0.60-1.20%)</option>
                <option value="only">Only (0.80-2.20%)</option>
              </select>
              <input 
                type="number" 
                name="bentoniteWithPremix" 
                value={table5.bentoniteWithPremix || ''} 
                onChange={(e) => handleTable5Change('bentoniteWithPremix', e.target.value)} 
                placeholder="Kgs"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="bentoniteOnly" 
                value={table5.bentoniteOnly || ''} 
                onChange={(e) => handleTable5Change('bentoniteOnly', e.target.value)} 
                placeholder="%"
                step="0.01"
                className="sand-table5-input"
              />
            </div>
          </div>
          <div className="sand-table5-form-group">
            <label>Premix / Coal Dust</label>
            <div className="sand-input-combo-3">
              <select
                name="premix-coaldust-checkpoint"
                value={table5.premixCoalDustCheckpoint || ''}
                onChange={(e) => handleTable5Change('premixCoalDustCheckpoint', e.target.value)}
                className="sand-table5-input"
              >
                <option value="" disabled>Select material</option>
                <option value="premix">Premix (0.60-1.20%)</option>
                <option value="coalDust">Coal Dust (0.20-0.70%)</option>
              </select>
              <input 
                type="number" 
                name="premixKgsMix" 
                value={table5.premixKgsMix || ''} 
                onChange={(e) => handleTable5Change('premixKgsMix', e.target.value)} 
                placeholder="Kgs"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="coalDustKgsMix" 
                value={table5.coalDustKgsMix || ''} 
                onChange={(e) => handleTable5Change('coalDustKgsMix', e.target.value)} 
                placeholder="%"
                step="0.01"
                className="sand-table5-input"
              />
            </div>
          </div>
          <div className="sand-table5-form-group">
            <label>LC SCM / Compactability Setting</label>
            <div className="sand-input-combo">
              <select
                name="lcscm-compactability-checkpoint"
                value={table5.lcScmCompactabilityCheckpoint || ''}
                onChange={(e) => handleTable5Change('lcScmCompactabilityCheckpoint', e.target.value)}
                className="sand-table5-input"
              >
                <option value="" disabled>Select option</option>
                <option value="lcScm">LC SCM (42 ± 3)</option>
                <option value="compactabilitySetting">Compactability At1 (40±3)</option>
              </select>
              <input 
                type="number" 
                name="lcScmCompactabilityValue" 
                value={table5.lcScmCompactabilityValue || ''} 
                onChange={(e) => handleTable5Change('lcScmCompactabilityValue', e.target.value)} 
                placeholder={table5.lcScmCompactabilityCheckpoint === 'lcScm' ? 'LC SCM value' : table5.lcScmCompactabilityCheckpoint === 'compactabilitySetting' ? 'Compactability value' : 'Enter value'}
                step="0.01"
                className="sand-table5-input"
              />
            </div>
          </div>
          <div className="sand-table5-form-group">
            <label>Mould Strength / Shear Strength</label>
            <div className="sand-input-combo">
              <select
                name="mouldstrength-shear-checkpoint"
                value={table5.mouldStrengthShearCheckpoint || ''}
                onChange={(e) => handleTable5Change('mouldStrengthShearCheckpoint', e.target.value)}
                className="sand-table5-input"
              >
                <option value="" disabled>Select option</option>
                <option value="mouldStrength">Mould strength (23±3)</option>
                <option value="shearStrength">Shear Strength (5.0±1%)</option>
              </select>
              <input 
                type="number" 
                name="mouldStrengthShearValue" 
                value={table5.mouldStrengthShearValue || ''} 
                onChange={(e) => handleTable5Change('mouldStrengthShearValue', e.target.value)} 
                placeholder={table5.mouldStrengthShearCheckpoint === 'mouldStrength' ? 'Mould strength value' : table5.mouldStrengthShearCheckpoint === 'shearStrength' ? 'Shear strength value' : 'Enter value'}
                step="0.01"
                className="sand-table5-input"
              />
            </div>
          </div>
          <div className="sand-table5-form-group">
            <label>Prepared Sand Lumps/kg</label>
            <input 
              type="number" 
              name="preparedSandLumpsPerKg" 
              value={table5.preparedSandLumpsPerKg || ''} 
              onChange={(e) => handleTable5Change('preparedSandLumpsPerKg', e.target.value)} 
              placeholder="Enter value"
              step="0.01"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Item Name</label>
            <input 
              type="text" 
              name="itemName" 
              value={table5.itemName || ''} 
              onChange={(e) => handleTable5Change('itemName', e.target.value)} 
              placeholder="Enter item name"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group sand-table5-form-group-full">
            <label>Remarks</label>
            <input 
              type="text"
              name="remarks" 
              value={table5.remarks || ''} 
              onChange={(e) => handleTable5Change('remarks', e.target.value)} 
              placeholder="Enter any additional notes..."
              maxLength={80}
              style={{
                width: '100%',
                maxWidth: '500px',
                resize: 'none'
              }}
              className="sand-table5-input"
            />
          </div>
        </div>
        </div>

        <div className="sand-table-submit" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="sand-reset-btn"
            onClick={resetTable5}
            type="button"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            className="sand-submit-btn"
            onClick={() => handleTableSubmit(5)}
            disabled={loadingStates.table5}
            type="button"
          >
            {loadingStates.table5 ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {loadingStates.table5 ? 'Saving...' : 'Save Table 5'}
          </button>
        </div>
      </div>

    </>
  );
};

export default SandTestingRecord;


