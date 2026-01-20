import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, FileText, Loader2, RotateCcw } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import '../../styles/PageStyles/Sandlab/SandTestingRecord.css';

const SandTestingRecord = () => {
  const navigate = useNavigate();
  
  // Primary: Date
  const [primaryData, setPrimaryData] = useState({ date: '' });
  const [primaryLoading, setPrimaryLoading] = useState(false);
  
  // Table 1: Shift Data
  const [table1, setTable1] = useState({
    shiftI: {
      rSand: '',
      nSand: '',
      mixingMode: '',
      bentonite: '',
      coalDustPremix: '',
      checkpointBentonite: '',
      checkpointCoalDustPremix: '',
      batchNoBentonite: '',
      batchNoCoalDustPremix: ''
    },
    shiftII: {
      rSand: '',
      nSand: '',
      mixingMode: '',
      bentonite: '',
      coalDustPremix: '',
      checkpointBentonite: '',
      checkpointCoalDustPremix: '',
      batchNoBentonite: '',
      batchNoCoalDustPremix: ''
    },
    shiftIII: {
      rSand: '',
      nSand: '',
      mixingMode: '',
      bentonite: '',
      coalDustPremix: '',
      checkpointBentonite: '',
      checkpointCoalDustPremix: '',
      batchNoBentonite: '',
      batchNoCoalDustPremix: ''
    }
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
  
  // Table 3: Mix Data
  const [table3, setTable3] = useState({
    shiftI: {
      mixNoStart: '',
      mixNoEnd: '',
      mixNoTotal: '',
      noOfMixRejected: '',
      returnSandHopperLevel: ''
    },
    shiftII: {
      mixNoStart: '',
      mixNoEnd: '',
      mixNoTotal: '',
      noOfMixRejected: '',
      returnSandHopperLevel: ''
    },
    shiftIII: {
      mixNoStart: '',
      mixNoEnd: '',
      mixNoTotal: '',
      noOfMixRejected: '',
      returnSandHopperLevel: ''
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
  
  // Table 5: Sand Properties & Test Parameters
  const [table5, setTable5] = useState({
    sno: '',
    time: '',
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

  const [loadingStates, setLoadingStates] = useState({
    table1: false,
    table2: false,
    table3: false,
    table4: false,
    table5: false
  });
  const [savingAll, setSavingAll] = useState(false);

  // Field locks for each table
  const [tableLocks, setTableLocks] = useState({
    table1: {},
    table2: {},
    table3: {},
    table4: {},
    table5: {}
  });

  const handleTableChange = (tableNum, field, value, nestedField = null) => {
    const setters = {
      1: setTable1,
      2: setTable2,
      3: setTable3,
      4: setTable4,
      5: setTable5
    };
    
    if ((tableNum === 1 || tableNum === 2 || tableNum === 3) && nestedField) {
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
          shiftIII: {}
        };
        ['shiftI', 'shiftII', 'shiftIII'].forEach(shift => {
          const shiftData = tableData[shift] || {};
          Object.keys(shiftData).forEach(field => {
            if (field === 'batchNoBentonite' || field === 'batchNoCoalDustPremix') {
              // Handle batchNo fields - transform to nested structure
              if (!filtered[shift].batchNo) {
                filtered[shift].batchNo = {};
              }
              const lockKey = field === 'batchNoBentonite' 
                ? `${shift}.batchNo.bentonite` 
                : `${shift}.batchNo.coalDustPremix`;
              if (!locks[lockKey] && shiftData[field]) {
                if (field === 'batchNoBentonite') {
                  filtered[shift].batchNo.bentonite = shiftData[field];
                } else {
                  filtered[shift].batchNo.coalDustPremix = shiftData[field];
                }
              }
            } else if (field !== 'checkpointBentonite' && field !== 'checkpointCoalDustPremix') {
              // Skip checkpoint fields (they're just UI state, not stored)
              const lockKey = `${shift}.${field}`;
              if (!locks[lockKey] && shiftData[field]) {
                filtered[shift][field] = shiftData[field];
              }
            }
          });
        });
        dataToSend = filtered;
      } else if (tableNum === 5) {
        // Build backend testParameter structure from flat table5 data
        const tp = {};
        tp.sno = tableData.sno;
        if (tableData.time) {
          const tstr = String(tableData.time).trim();
          const hhmm = tstr.includes(':') ? tstr.replace(':', '') : tstr;
          const tnum = Number(hhmm);
          if (!Number.isNaN(tnum)) {
            tp.time = tnum;
          }
        }
        tp.mixno = tableData.mixNo;
        tp.permeability = tableData.permeability;
        // GCS: send numeric value to the selected checkpoint field only
        if (tableData.gcsCheckpoint === 'fdyA' && tableData.gcsValue !== '' && !Number.isNaN(Number(tableData.gcsValue))) {
          tp.gcsFdyA = Number(tableData.gcsValue);
        } else if (tableData.gcsCheckpoint === 'fdyB' && tableData.gcsValue !== '' && !Number.isNaN(Number(tableData.gcsValue))) {
          tp.gcsFdyB = Number(tableData.gcsValue);
        }
        tp.wts = tableData.wts;
        tp.moisture = tableData.moisture;
        tp.compactability = tableData.compactability;
        tp.compressibility = tableData.compressability;
        tp.waterLitre = tableData.waterLitrePerKgMix;
        // sand temp nested
        tp.sandTemp = {
          BC: tableData.sandTempBC,
          WU: tableData.sandTempWU,
          SSUmax: tableData.sandTempSSU
        };
        tp.newSandKgs = tableData.newSandKgsPerMould;
        // nested materials
        tp.bentoniteWithPremix = { Kgs: tableData.bentoniteWithPremix };
        tp.bentonite = { Kgs: tableData.bentoniteOnly };
        tp.premix = { Kgs: tableData.premixKgsMix };
        tp.coalDust = { Kgs: tableData.coalDustKgsMix };
        // numeric settings and values only
        if (tableData.lcScmCompactabilityValue !== '' && !Number.isNaN(Number(tableData.lcScmCompactabilityValue))) {
          tp.CompactabilitySettings = Number(tableData.lcScmCompactabilityValue);
        }
        if (tableData.mouldStrengthShearValue !== '' && !Number.isNaN(Number(tableData.mouldStrengthShearValue))) {
          // do not send checkpoint string to numeric field; omit shearStrengthSetting entirely
          // backend will use mouldStrength as the measured value
        }
        tp.lc = tableData.lcScmCompactabilityValue;
        tp.mouldStrength = tableData.mouldStrengthShearValue;
        // additional checkpoints
        tp.bentoniteCheckpoint = tableData.bentoniteCheckpoint;
        tp.premixCoalDustCheckpoint = tableData.premixCoalDustCheckpoint;
        tp.preparedSandlumps = tableData.preparedSandLumpsPerKg;
        tp.itemName = tableData.itemName;
        tp.remarks = tableData.remarks;
        dataToSend = tp;
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
        // Transform mixNo fields to nested structure for backend
        const filtered = {
          ShiftI: {},
          ShiftII: {},
          ShiftIII: {}
        };
        ['shiftI', 'shiftII', 'shiftIII'].forEach((shift, idx) => {
          const backendShiftKey = idx === 0 ? 'ShiftI' : idx === 1 ? 'ShiftII' : 'ShiftIII';
          const shiftData = tableData[shift] || {};
          Object.keys(shiftData).forEach(field => {
            const lockKey = `${shift}.${field}`;
            if (!locks[lockKey] && shiftData[field]) {
              // Transform mixNo fields to nested structure
              if (field === 'mixNoStart' || field === 'mixNoEnd' || field === 'mixNoTotal') {
                if (!filtered[backendShiftKey].mixno) {
                  filtered[backendShiftKey].mixno = {};
                }
                if (field === 'mixNoStart') {
                  filtered[backendShiftKey].mixno.start = shiftData[field];
                } else if (field === 'mixNoEnd') {
                  filtered[backendShiftKey].mixno.end = shiftData[field];
                } else if (field === 'mixNoTotal') {
                  filtered[backendShiftKey].mixno.total = shiftData[field];
                }
              } else if (field === 'noOfMixRejected') {
                filtered[backendShiftKey].numberOfMixRejected = shiftData[field];
              } else {
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

  const handleSaveAll = async () => {
    if (!primaryData.date) {
      alert('Please enter a date first.');
      return;
    }
    setSavingAll(true);
    try {
      for (let t = 1; t <= 5; t++) {
        await handleTableSubmit(t, true);
      }
      alert('All tables saved successfully!');
      navigate('/sand-lab/sand-testing-record/report');
    } catch (e) {
      console.error('Save all error', e);
      alert('Some sections may not have saved. Please review and try again.');
    } finally {
      setSavingAll(false);
    }
  };

  const handlePrimaryChange = (field, value) => {
    setPrimaryData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // When date changes, automatically check for existing data
    if (field === 'date' && value) {
      checkExistingData(value);
    } else if (field === 'date' && !value) {
      // Clear all data when date is cleared
      resetAllTables();
    }
  };

  // Check for existing data when date is entered
  const checkExistingData = async (date) => {
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
            shiftI: {},
            shiftII: {},
            shiftIII: {}
          };
          
          ['shiftI', 'shiftII', 'shiftIII'].forEach(shift => {
            const shiftData = record.sandShifts[shift] || {};
            Object.keys(shiftData).forEach(field => {
              if (field === 'batchNo') {
                if (shiftData.batchNo) {
                  if (shiftData.batchNo.bentonite) {
                    table1Locks[`${shift}.batchNo.bentonite`] = true;
                    table1Data[shift].batchNoBentonite = shiftData.batchNo.bentonite;
                  }
                  if (shiftData.batchNo.coalDustPremix) {
                    table1Locks[`${shift}.batchNo.coalDustPremix`] = true;
                    table1Data[shift].batchNoCoalDustPremix = shiftData.batchNo.coalDustPremix;
                  }
                }
              } else if (shiftData[field]) {
                table1Locks[`${shift}.${field}`] = true;
                table1Data[shift][field] = shiftData[field];
              }
            });
          });
          
          setTable1(prev => {
            const updated = { ...prev };
            Object.keys(table1Data).forEach(shift => {
              updated[shift] = { ...prev[shift], ...table1Data[shift] };
            });
            return updated;
          });
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
            shiftI: {},
            shiftII: {},
            shiftIII: {},
            total: {}
          };
          
          ['ShiftI', 'ShiftII', 'ShiftIII'].forEach((shift, idx) => {
            const shiftKey = idx === 0 ? 'shiftI' : idx === 1 ? 'shiftII' : 'shiftIII';
            const shiftData = record.mixshifts[shift] || {};
            if (shiftData.mixno) {
              if (shiftData.mixno.start) {
                table3Locks[`${shiftKey}.mixNoStart`] = true;
                table3Data[shiftKey].mixNoStart = shiftData.mixno.start;
              }
              if (shiftData.mixno.end) {
                table3Locks[`${shiftKey}.mixNoEnd`] = true;
                table3Data[shiftKey].mixNoEnd = shiftData.mixno.end;
              }
              if (shiftData.mixno.total) {
                table3Locks[`${shiftKey}.mixNoTotal`] = true;
                table3Data[shiftKey].mixNoTotal = shiftData.mixno.total;
              }
            }
            if (shiftData.numberOfMixRejected !== undefined && shiftData.numberOfMixRejected !== null && shiftData.numberOfMixRejected !== '' && shiftData.numberOfMixRejected !== 0) {
              table3Locks[`${shiftKey}.noOfMixRejected`] = true;
              table3Data[shiftKey].noOfMixRejected = shiftData.numberOfMixRejected;
            }
            if (shiftData.returnSandHopperLevel !== undefined && shiftData.returnSandHopperLevel !== null && shiftData.returnSandHopperLevel !== '' && shiftData.returnSandHopperLevel !== 0) {
              table3Locks[`${shiftKey}.returnSandHopperLevel`] = true;
              table3Data[shiftKey].returnSandHopperLevel = shiftData.returnSandHopperLevel;
            }
          });
          
          setTable3(prev => {
            const updated = { ...prev };
            Object.keys(table3Data).forEach(shift => {
              updated[shift] = { ...prev[shift], ...table3Data[shift] };
            });
            return updated;
          });
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
      } else {
        // No data found, clear all locks
        resetAllTables();
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
      resetAllTables();
    }
  };

  const resetAllTables = () => {
    setTable1({
      shiftI: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', checkpointBentonite: '', checkpointCoalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' },
      shiftII: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', checkpointBentonite: '', checkpointCoalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' },
      shiftIII: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', checkpointBentonite: '', checkpointCoalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' }
    });
    setTable2({
      shiftI: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
      shiftII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
      shiftIII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' }
    });
    setTable3({
      shiftI: { mixNoStart: '', mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '', returnSandHopperLevel: '' },
      shiftII: { mixNoStart: '', mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '', returnSandHopperLevel: '' },
      shiftIII: { mixNoStart: '', mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '', returnSandHopperLevel: '' },
      total: { mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '' }
    });
    setTable4({
      sandLump: '',
      newSandWt: '',
      friability: {
        shiftI: '',
        shiftII: '',
        shiftIII: ''
      }
    });
    setTableLocks({
      table1: {},
      table2: {},
      table3: {},
      table4: {}
    });
  };


  // Separate reset functions for each table
  const resetPrimaryData = () => {
    if (!window.confirm('Are you sure you want to reset Primary data?')) return;
    setPrimaryData({ date: '' });
    resetAllTables();
  };

  const resetTable1 = () => {
    if (!window.confirm('Are you sure you want to reset Table 1?')) return;
    setTable1({
      shiftI: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', checkpointBentonite: '', checkpointCoalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' },
      shiftII: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', checkpointBentonite: '', checkpointCoalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' },
      shiftIII: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', checkpointBentonite: '', checkpointCoalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' }
    });
  };

  const resetTable2 = () => {
    if (!window.confirm('Are you sure you want to reset Table 2?')) return;
    setTable2({
      shiftI: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
      shiftII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
      shiftIII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' }
    });
  };

  const resetTable3 = () => {
    if (!window.confirm('Are you sure you want to reset Table 3?')) return;
    setTable3({
      shiftI: { mixNoStart: '', mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '', returnSandHopperLevel: '' },
      shiftII: { mixNoStart: '', mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '', returnSandHopperLevel: '' },
      shiftIII: { mixNoStart: '', mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '', returnSandHopperLevel: '' },
      total: { mixNoEnd: '', mixNoTotal: '', noOfMixRejected: '' }
    });
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
  };

  const resetTable5 = () => {
    if (!window.confirm('Are you sure you want to reset Table 5?')) return;
    setTable5({
      sno: '',
      time: '',
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

  const renderTableRow = (tableNum, field, label, type = "text") => (
    <tr>
      <td>{label}</td>
      <td>
        {type === "textarea" ? (
          <textarea
            value={tableNum === 1 ? (table1[field] || '') : tableNum === 2 ? (table2[field] || '') : tableNum === 3 ? (table3[field] || '') : tableNum === 4 ? (table4[field] || '') : (table5[field] || '')}
            onChange={(e) => handleTableChange(tableNum, field, e.target.value)}
            rows="4"
            placeholder={`Enter ${label.toLowerCase()}`}
            className="sand-table-input"
          />
        ) : (
      <input
        type={type}
            value={tableNum === 1 ? (table1[field] || '') : tableNum === 2 ? (table2[field] || '') : tableNum === 3 ? (table3[field] || '') : tableNum === 4 ? (table4[field] || '') : (table5[field] || '')}
            onChange={(e) => handleTableChange(tableNum, field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="sand-table-input"
          />
        )}
      </td>
    </tr>
  );

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
      </div>

      {/* Primary Data Section */}
      <div className="sand-primary-container" onKeyDown={handleEnterToNext}>
        <div className="sand-section-header">
          <h3 className="primary-data-title">Primary Data :</h3>
        </div>
        <div className="sand-primary-row">
          <div className="sand-primary-form-group">
            <label>Date</label>
            <CustomDatePicker
              value={primaryData.date}
              onChange={(e) => handlePrimaryChange('date', e.target.value)}
              name="date"
            />
          </div>
        </div>
      </div>

      {/* Table 1 */}
      <div className="sand-section-header">
        <h3>Table 1</h3>
            </div>
      <table className="sand-shift-table" onKeyDown={handleEnterToNext}>
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
              <input
                type="number"
                value={table1.shiftI.rSand || ''}
                onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'rSand')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftI.rSand')}
                readOnly={isFieldLocked(1, 'shiftI.rSand')}
                style={{
                  backgroundColor: isFieldLocked(1, 'shiftI.rSand') ? '#f1f5f9' : '#ffffff',
                  cursor: isFieldLocked(1, 'shiftI.rSand') ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table1.shiftII.rSand || ''}
                onChange={(e) => handleTableChange(1, 'shiftII', e.target.value, 'rSand')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftII.rSand')}
                readOnly={isFieldLocked(1, 'shiftII.rSand')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftII.rSand')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftII.rSand')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table1.shiftIII.rSand || ''}
                onChange={(e) => handleTableChange(1, 'shiftIII', e.target.value, 'rSand')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftIII.rSand')}
                readOnly={isFieldLocked(1, 'shiftIII.rSand')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftIII.rSand')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftIII.rSand')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr key="n-sand">
            <td>N. Sand ( Kgs/Mix )</td>
            <td>
              <input
                type="number"
                value={table1.shiftI.nSand || ''}
                onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'nSand')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftI.nSand')}
                readOnly={isFieldLocked(1, 'shiftI.nSand')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftI.nSand')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftI.nSand')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table1.shiftII.nSand || ''}
                onChange={(e) => handleTableChange(1, 'shiftII', e.target.value, 'nSand')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftII.nSand')}
                readOnly={isFieldLocked(1, 'shiftII.nSand')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftII.nSand')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftII.nSand')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table1.shiftIII.nSand || ''}
                onChange={(e) => handleTableChange(1, 'shiftIII', e.target.value, 'nSand')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftIII.nSand')}
                readOnly={isFieldLocked(1, 'shiftIII.nSand')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftIII.nSand')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftIII.nSand')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr key="mixing-mode">
            <td>Mixing Mode</td>
            <td>
              <input
                type="text"
                value={table1.shiftI.mixingMode || ''}
                onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'mixingMode')}
                placeholder="Enter mode"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftI.mixingMode')}
                readOnly={isFieldLocked(1, 'shiftI.mixingMode')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftI.mixingMode')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftI.mixingMode')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="text"
                value={table1.shiftII.mixingMode || ''}
                onChange={(e) => handleTableChange(1, 'shiftII', e.target.value, 'mixingMode')}
                placeholder="Enter mode"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftII.mixingMode')}
                readOnly={isFieldLocked(1, 'shiftII.mixingMode')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftII.mixingMode')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftII.mixingMode')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="text"
                value={table1.shiftIII.mixingMode || ''}
                onChange={(e) => handleTableChange(1, 'shiftIII', e.target.value, 'mixingMode')}
                placeholder="Enter mode"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftIII.mixingMode')}
                readOnly={isFieldLocked(1, 'shiftIII.mixingMode')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftIII.mixingMode')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftIII.mixingMode')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr key="bentonite">
            <td>Bentonite ( Kgs/Mix )</td>
            <td>
              <input
                type="number"
                value={table1.shiftI.bentonite || ''}
                onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'bentonite')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftI.bentonite')}
                readOnly={isFieldLocked(1, 'shiftI.bentonite')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftI.bentonite')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftI.bentonite')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table1.shiftII.bentonite || ''}
                onChange={(e) => handleTableChange(1, 'shiftII', e.target.value, 'bentonite')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftII.bentonite')}
                readOnly={isFieldLocked(1, 'shiftII.bentonite')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftII.bentonite')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftII.bentonite')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table1.shiftIII.bentonite || ''}
                onChange={(e) => handleTableChange(1, 'shiftIII', e.target.value, 'bentonite')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(1, 'shiftIII.bentonite')}
                readOnly={isFieldLocked(1, 'shiftIII.bentonite')}
                style={{
                  backgroundColor: (isFieldLocked(1, 'shiftIII.bentonite')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(1, 'shiftIII.bentonite')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr key="batch-no">
            <td>Batch NO...</td>
            <td>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="checkpoint-shiftI"
                      value="bentonite"
                      checked={table1.shiftI.checkpointBentonite === 'bentonite'}
                      onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'checkpointBentonite')}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Bentonite</span>
                  </label>
          </div>
                <input
                  type="text"
                  value={table1.shiftI.batchNoBentonite || ''}
                  onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'batchNoBentonite')}
                  placeholder="Enter batch no"
                  className="sand-table-input"
                  disabled={isFieldLocked(1, 'shiftI.batchNo.bentonite')}
                  readOnly={isFieldLocked(1, 'shiftI.batchNo.bentonite')}
                  style={{
                    backgroundColor: (isFieldLocked(1, 'shiftI.batchNo.bentonite')) ? '#f1f5f9' : '#ffffff',
                    cursor: (isFieldLocked(1, 'shiftI.batchNo.bentonite')) ? 'not-allowed' : 'text'
                  }}
                />
            </div>
            </td>
            <td colSpan={2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isFieldLocked(1, 'shiftI.batchNo.coalDustPremix') ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: (isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')) ? 0.6 : 1 }}>
                    <input
                      type="radio"
                      name="checkpoint-shiftIIIII"
                      value="coalDust"
                      checked={table1.shiftI.checkpointCoalDustPremix === 'coalDust'}
                      onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'checkpointCoalDustPremix')}
                      disabled={isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')}
                      style={{ cursor: (isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')) ? 'not-allowed' : 'pointer' }}
                    />
                    <span>Coal dust</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isFieldLocked(1, 'shiftI.batchNo.coalDustPremix') ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: (isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')) ? 0.6 : 1 }}>
                    <input
                      type="radio"
                      name="checkpoint-shiftIIIII"
                      value="premix"
                      checked={table1.shiftI.checkpointCoalDustPremix === 'premix'}
                      onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'checkpointCoalDustPremix')}
                      disabled={isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')}
                      style={{ cursor: (isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')) ? 'not-allowed' : 'pointer' }}
                    />
                    <span>Premix</span>
                  </label>
          </div>
                <input
                  type="text"
                  value={table1.shiftI.batchNoCoalDustPremix || ''}
                  onChange={(e) => handleTableChange(1, 'shiftI', e.target.value, 'batchNoCoalDustPremix')}
                  placeholder="Enter batch no"
                  className="sand-table-input"
                  disabled={isFieldLocked(1, 'shiftI.batchNo.coalDustPremix') || !table1.shiftI.checkpointCoalDustPremix}
                  readOnly={isFieldLocked(1, 'shiftI.batchNo.coalDustPremix')}
                  style={{
                    backgroundColor: (isFieldLocked(1, 'shiftI.batchNo.coalDustPremix') || !table1.shiftI.checkpointCoalDustPremix) ? '#f1f5f9' : '#ffffff',
                    cursor: (isFieldLocked(1, 'shiftI.batchNo.coalDustPremix') || !table1.shiftI.checkpointCoalDustPremix) ? 'not-allowed' : 'text'
                  }}
                />
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
      </div>

      {/* Table 2 */}
      <div className="sand-section-header">
        <h3>Table 2</h3>
            </div>
      <table className="sand-shift-table" onKeyDown={handleEnterToNext}>
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
      </div>

      {/* Table 3 */}
      <div className="sand-section-header">
        <h3>Table 3</h3>
            </div>
      <table className="sand-shift-table" onKeyDown={handleEnterToNext}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '60px', minWidth: '60px' }}>Shift</th>
            <th colSpan={3} style={{ textAlign: 'center', width: '35%' }}>Mix No.</th>
            <th rowSpan={2} style={{ width: '20%' }}>No. Of Mix Rejected</th>
            <th rowSpan={2} style={{ width: '25%' }}>Return Sand Hopper Level</th>
          </tr>
          <tr>
            <th style={{ borderRight: '1px solid #e2e8f0', width: '11.67%' }}>Start</th>
            <th style={{ borderRight: '1px solid #e2e8f0', width: '11.67%' }}>End</th>
            <th style={{ width: '11.67%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: '60px', minWidth: '60px', textAlign: 'center', fontWeight: 600 }}>I</td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.shiftI.mixNoStart || ''}
                onChange={(e) => handleTableChange(3, 'shiftI', e.target.value, 'mixNoStart')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftI.mixNoStart')}
                readOnly={isFieldLocked(3, 'shiftI.mixNoStart')}
              />
            </td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.shiftI.mixNoEnd || ''}
                onChange={(e) => handleTableChange(3, 'shiftI', e.target.value, 'mixNoEnd')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftI.mixNoEnd')}
                readOnly={isFieldLocked(3, 'shiftI.mixNoEnd')}
              />
            </td>
            <td style={{ width: '11.67%', padding: '0.4rem', borderRight: '1px solid #e2e8f0' }}>
              <input
                type="number"
                value={table3.shiftI.mixNoTotal || ''}
                onChange={(e) => handleTableChange(3, 'shiftI', e.target.value, 'mixNoTotal')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftI.mixNoTotal')}
                readOnly={isFieldLocked(3, 'shiftI.mixNoTotal')}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.shiftI.noOfMixRejected || ''}
                onChange={(e) => handleTableChange(3, 'shiftI', e.target.value, 'noOfMixRejected')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'shiftI.noOfMixRejected')}
                readOnly={isFieldLocked(3, 'shiftI.noOfMixRejected')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'shiftI.noOfMixRejected')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'shiftI.noOfMixRejected')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.shiftI.returnSandHopperLevel || ''}
                onChange={(e) => handleTableChange(3, 'shiftI', e.target.value, 'returnSandHopperLevel')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'shiftI.returnSandHopperLevel')}
                readOnly={isFieldLocked(3, 'shiftI.returnSandHopperLevel')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'shiftI.returnSandHopperLevel')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'shiftI.returnSandHopperLevel')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={{ width: '60px', minWidth: '60px', textAlign: 'center', fontWeight: 600 }}>II</td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.shiftII.mixNoStart || ''}
                onChange={(e) => handleTableChange(3, 'shiftII', e.target.value, 'mixNoStart')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftII.mixNoStart')}
                readOnly={isFieldLocked(3, 'shiftII.mixNoStart')}
              />
            </td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.shiftII.mixNoEnd || ''}
                onChange={(e) => handleTableChange(3, 'shiftII', e.target.value, 'mixNoEnd')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftII.mixNoEnd')}
                readOnly={isFieldLocked(3, 'shiftII.mixNoEnd')}
              />
            </td>
            <td style={{ width: '11.67%', padding: '0.4rem', borderRight: '1px solid #e2e8f0' }}>
              <input
                type="number"
                value={table3.shiftII.mixNoTotal || ''}
                onChange={(e) => handleTableChange(3, 'shiftII', e.target.value, 'mixNoTotal')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftII.mixNoTotal')}
                readOnly={isFieldLocked(3, 'shiftII.mixNoTotal')}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.shiftII.noOfMixRejected || ''}
                onChange={(e) => handleTableChange(3, 'shiftII', e.target.value, 'noOfMixRejected')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'shiftII.noOfMixRejected')}
                readOnly={isFieldLocked(3, 'shiftII.noOfMixRejected')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'shiftII.noOfMixRejected')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'shiftII.noOfMixRejected')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.shiftII.returnSandHopperLevel || ''}
                onChange={(e) => handleTableChange(3, 'shiftII', e.target.value, 'returnSandHopperLevel')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'shiftII.returnSandHopperLevel')}
                readOnly={isFieldLocked(3, 'shiftII.returnSandHopperLevel')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'shiftII.returnSandHopperLevel')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'shiftII.returnSandHopperLevel')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={{ width: '60px', minWidth: '60px', textAlign: 'center', fontWeight: 600 }}>III</td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.shiftIII.mixNoStart || ''}
                onChange={(e) => handleTableChange(3, 'shiftIII', e.target.value, 'mixNoStart')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftIII.mixNoStart')}
                readOnly={isFieldLocked(3, 'shiftIII.mixNoStart')}
              />
            </td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.shiftIII.mixNoEnd || ''}
                onChange={(e) => handleTableChange(3, 'shiftIII', e.target.value, 'mixNoEnd')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftIII.mixNoEnd')}
                readOnly={isFieldLocked(3, 'shiftIII.mixNoEnd')}
              />
            </td>
            <td style={{ width: '11.67%', padding: '0.4rem', borderRight: '1px solid #e2e8f0' }}>
              <input
                type="number"
                value={table3.shiftIII.mixNoTotal || ''}
                onChange={(e) => handleTableChange(3, 'shiftIII', e.target.value, 'mixNoTotal')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'shiftIII.mixNoTotal')}
                readOnly={isFieldLocked(3, 'shiftIII.mixNoTotal')}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.shiftIII.noOfMixRejected || ''}
                onChange={(e) => handleTableChange(3, 'shiftIII', e.target.value, 'noOfMixRejected')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'shiftIII.noOfMixRejected')}
                readOnly={isFieldLocked(3, 'shiftIII.noOfMixRejected')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'shiftIII.noOfMixRejected')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'shiftIII.noOfMixRejected')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.shiftIII.returnSandHopperLevel || ''}
                onChange={(e) => handleTableChange(3, 'shiftIII', e.target.value, 'returnSandHopperLevel')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'shiftIII.returnSandHopperLevel')}
                readOnly={isFieldLocked(3, 'shiftIII.returnSandHopperLevel')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'shiftIII.returnSandHopperLevel')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'shiftIII.returnSandHopperLevel')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ fontWeight: 600, textAlign: 'center' }}>Total</td>
            <td style={{ borderRight: '1px solid #e2e8f0', width: '11.67%', padding: '0.4rem' }}>
              <input
                type="number"
                value={table3.total.mixNoEnd || ''}
                onChange={(e) => handleTableChange(3, 'total', e.target.value, 'mixNoEnd')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'total.mixNoEnd')}
                readOnly={isFieldLocked(3, 'total.mixNoEnd')}
              />
            </td>
            <td style={{ width: '11.67%', padding: '0.4rem', borderRight: '1px solid #e2e8f0' }}>
              <input
                type="number"
                value={table3.total.mixNoTotal || ''}
                onChange={(e) => handleTableChange(3, 'total', e.target.value, 'mixNoTotal')}
                placeholder="Enter value"
                className="sand-table-input"
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.8125rem', width: '100%' }}
                disabled={isFieldLocked(3, 'total.mixNoTotal')}
                readOnly={isFieldLocked(3, 'total.mixNoTotal')}
              />
            </td>
            <td>
              <input
                type="number"
                value={table3.total.noOfMixRejected || ''}
                onChange={(e) => handleTableChange(3, 'total', e.target.value, 'noOfMixRejected')}
                placeholder="Enter value"
                className="sand-table-input"
                disabled={isFieldLocked(3, 'total.noOfMixRejected')}
                readOnly={isFieldLocked(3, 'total.noOfMixRejected')}
                style={{
                  backgroundColor: (isFieldLocked(3, 'total.noOfMixRejected')) ? '#f1f5f9' : '#ffffff',
                  cursor: (isFieldLocked(3, 'total.noOfMixRejected')) ? 'not-allowed' : 'text'
                }}
              />
            </td>
            <td></td>
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
        <table className="sand-shift-table" onKeyDown={handleEnterToNext}>
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
      </div>

      {/* Table 5 */}
      <div className="sand-table5-main-card">
        <h4 className="sand-table5-main-card-title">Sand Properties & Test Parameters</h4>

        <div className="sand-table5-form-grid" onKeyDown={handleEnterToNext}>
          <div className="sand-table5-form-group">
            <label>Sno</label>
            <input 
              type="text" 
              name="sno" 
              value={table5.sno || ''} 
              onChange={(e) => handleTableChange(5, 'sno', e.target.value)} 
              placeholder="Enter Sno"
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Time</label>
            <input 
              type="time" 
              name="time" 
              value={table5.time || ''} 
              onChange={(e) => handleTableChange(5, 'time', e.target.value)} 
              className="sand-table5-input"
            />
          </div>
          <div className="sand-table5-form-group">
            <label>Mix No</label>
            <input 
              type="text" 
              name="mixNo" 
              value={table5.mixNo || ''} 
              onChange={(e) => handleTableChange(5, 'mixNo', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'permeability', e.target.value)} 
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
                onChange={(e) => handleTableChange(5, 'gcsCheckpoint', e.target.value)}
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
                onChange={(e) => handleTableChange(5, 'gcsValue', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'wts', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'moisture', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'compactability', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'compressability', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'waterLitrePerKgMix', e.target.value)} 
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
                onChange={(e) => handleTableChange(5, 'sandTempBC', e.target.value)} 
                placeholder="BC"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="sandTempWU" 
                value={table5.sandTempWU || ''} 
                onChange={(e) => handleTableChange(5, 'sandTempWU', e.target.value)} 
                placeholder="WU"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="sandTempSSU" 
                value={table5.sandTempSSU || ''} 
                onChange={(e) => handleTableChange(5, 'sandTempSSU', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'newSandKgsPerMould', e.target.value)} 
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
                onChange={(e) => handleTableChange(5, 'bentoniteCheckpoint', e.target.value)}
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
                onChange={(e) => handleTableChange(5, 'bentoniteWithPremix', e.target.value)} 
                placeholder="Kgs"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="bentoniteOnly" 
                value={table5.bentoniteOnly || ''} 
                onChange={(e) => handleTableChange(5, 'bentoniteOnly', e.target.value)} 
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
                onChange={(e) => handleTableChange(5, 'premixCoalDustCheckpoint', e.target.value)}
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
                onChange={(e) => handleTableChange(5, 'premixKgsMix', e.target.value)} 
                placeholder="Kgs"
                step="0.01"
                className="sand-table5-input"
              />
              <input 
                type="number" 
                name="coalDustKgsMix" 
                value={table5.coalDustKgsMix || ''} 
                onChange={(e) => handleTableChange(5, 'coalDustKgsMix', e.target.value)} 
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
                onChange={(e) => handleTableChange(5, 'lcScmCompactabilityCheckpoint', e.target.value)}
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
                onChange={(e) => handleTableChange(5, 'lcScmCompactabilityValue', e.target.value)} 
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
                onChange={(e) => handleTableChange(5, 'mouldStrengthShearCheckpoint', e.target.value)}
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
                onChange={(e) => handleTableChange(5, 'mouldStrengthShearValue', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'preparedSandLumpsPerKg', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'itemName', e.target.value)} 
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
              onChange={(e) => handleTableChange(5, 'remarks', e.target.value)} 
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
            onClick={handleSaveAll}
            disabled={savingAll}
            title="Save All Tables"
          >
            {savingAll ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {savingAll ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

    </>
  );
};

export default SandTestingRecord;
