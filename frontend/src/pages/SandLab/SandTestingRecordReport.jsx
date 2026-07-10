import React, { useEffect, useState, useRef } from 'react';
import { PencilLine, Trash2, BookOpenCheck } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadDialog } from '../../Components/alert';
import { FilterButton, ClearButton, EntryNavButton, ExcelDownloadButton } from '../../Components/Buttons';
import Table from '../../Components/Table';
import { exportWorkbookToExcel, getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';

import '../../styles/PageStyles/Sandlab/SandTestingRecordReport.css';

const SandTestingRecordReport = () => {
  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(getCurrentDate()); // "To" defaults to today; "From" optional
  const [datesList, setDatesList] = useState([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [isRangeMode, setIsRangeMode] = useState(false);

  // In-memory cache (per session) of single-date fetches, keyed by YYYY-MM-DD
  const cacheRef = useRef({});

  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [isFiltered, setIsFiltered] = useState(false);
  const [table1Data, setTable1Data] = useState({
    table1a: {
      '0_1': [], '0_2': [], '0_3': [],
      '1_1': [], '1_2': [], '1_3': [],
      '2_1': [], '2_2': [], '2_3': [],
      '3_1': [], '3_2': [], '3_3': [],
      '4_1': [], '4_2': [], '4_3': []
    },
    table1b: {
      bentonite: '',
      batchType: '',
      value: ''
    }
  });

  const [table2Data, setTable2Data] = useState({
    '0_0': '', '0_1': '', '0_2': '',
    '1_0': '', '1_1': '', '1_2': '',
    '2_0': '', '2_1': '', '2_2': '',
    '3_0': '', '3_1': '', '3_2': '',
    '4_0': '', '4_1': '', '4_2': '',
    '5_0': '', '5_1': '', '5_2': '',
    '6_0': '', '6_1': '', '6_2': ''
  });

  const [table3Data, setTable3Data] = useState({
    '0_0': [], '0_1': [], '0_2': [], '0_3': [], '0_4': [],
    '1_0': [], '1_1': [], '1_2': [], '1_3': [], '1_4': [],
    '2_0': [], '2_1': [], '2_2': [], '2_3': [], '2_4': []
  });

  const [table4Data, setTable4Data] = useState({
    sandLump: '',
    newSandWt: '',
    friabilityShiftI: '',
    friabilityShiftII: '',
    friabilityShiftIII: ''
  });

  const [table5Data, setTable5Data] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // Function to fetch data for a single date (cached in memory for instant re-view)
  const fetchDataForDate = async (date) => {
    if (cacheRef.current[date] !== undefined) {
      return cacheRef.current[date];
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/date/${date}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      const record = (result.success && result.data && result.data.length > 0) ? result.data[0] : null;
      cacheRef.current[date] = record;
      return record;
    } catch (error) {
      console.error(`Error fetching data for ${date}:`, error);
      return null;
    }
  };

  // Function to process and set record data
  const processRecordData = (record) => {
    if (record) {
      // Map sandShifts to table1Data
      if (record.sandShifts) {
          const shifts = record.sandShifts;
          setTable1Data({
            table1a: {
              '0_1': shifts.shiftI?.rSand || [],
              '0_2': shifts.shiftII?.rSand || [],
              '0_3': shifts.shiftIII?.rSand || [],
              '1_1': shifts.shiftI?.nSand || [],
              '1_2': shifts.shiftII?.nSand || [],
              '1_3': shifts.shiftIII?.nSand || [],
              '2_1': shifts.shiftI?.mixingMode || [],
              '2_2': shifts.shiftII?.mixingMode || [],
              '2_3': shifts.shiftIII?.mixingMode || [],
              '3_1': shifts.shiftI?.bentonite || [],
              '3_2': shifts.shiftII?.bentonite || [],
              '3_3': shifts.shiftIII?.bentonite || [],
              '4_1': shifts.shiftI?.coalDustPremix || [],
              '4_2': shifts.shiftII?.coalDustPremix || [],
              '4_3': shifts.shiftIII?.coalDustPremix || []
            },
            table1b: {
              bentonite: shifts.batchNo?.bentonite || '',
              coalDust: shifts.batchNo?.coalDust || '',
              premix: shifts.batchNo?.premix || '',
              batchType: (shifts.batchNo?.coalDust && shifts.batchNo.coalDust.trim() !== '') ? 'coalDust' : ((shifts.batchNo?.premix && shifts.batchNo.premix.trim() !== '') ? 'premix' : ''),
              value: shifts.batchNo?.coalDust || shifts.batchNo?.premix || ''
            }
          });
        }

        // Map clayShifts to table2Data
        if (record.clayShifts) {
          const clay = record.clayShifts;
          setTable2Data({
            '0_0': clay.shiftI?.totalClay || '',
            '0_1': clay.ShiftII?.totalClay || '',
            '0_2': clay.ShiftIII?.totalClay || '',
            '1_0': clay.shiftI?.activeClay || '',
            '1_1': clay.ShiftII?.activeClay || '',
            '1_2': clay.ShiftIII?.activeClay || '',
            '2_0': clay.shiftI?.deadClay || '',
            '2_1': clay.ShiftII?.deadClay || '',
            '2_2': clay.ShiftIII?.deadClay || '',
            '3_0': clay.shiftI?.vcm || '',
            '3_1': clay.ShiftII?.vcm || '',
            '3_2': clay.ShiftIII?.vcm || '',
            '4_0': clay.shiftI?.loi || '',
            '4_1': clay.ShiftII?.loi || '',
            '4_2': clay.ShiftIII?.loi || '',
            '5_0': clay.shiftI?.afsNo || '',
            '5_1': clay.ShiftII?.afsNo || '',
            '5_2': clay.ShiftIII?.afsNo || '',
            '6_0': clay.shiftI?.fines || '',
            '6_1': clay.ShiftII?.fines || '',
            '6_2': clay.ShiftIII?.fines || ''
          });
        }

        // Map mixshifts to table3Data
        if (record.mixshifts) {
          const mix = record.mixshifts;
          setTable3Data({
            '0_0': mix.ShiftI?.mixno?.start || [],
            '0_1': mix.ShiftI?.mixno?.end || [],
            '0_2': mix.ShiftI?.mixno?.total || [],
            '0_3': mix.ShiftI?.numberOfMixRejected || [],
            '0_4': mix.ShiftI?.returnSandHopperLevel || [],
            '1_0': mix.ShiftII?.mixno?.start || [],
            '1_1': mix.ShiftII?.mixno?.end || [],
            '1_2': mix.ShiftII?.mixno?.total || [],
            '1_3': mix.ShiftII?.numberOfMixRejected || [],
            '1_4': mix.ShiftII?.returnSandHopperLevel || [],
            '2_0': mix.ShiftIII?.mixno?.start || [],
            '2_1': mix.ShiftIII?.mixno?.end || [],
            '2_2': mix.ShiftIII?.mixno?.total || [],
            '2_3': mix.ShiftIII?.numberOfMixRejected || [],
            '2_4': mix.ShiftIII?.returnSandHopperLevel || []
          });
        }

        // Map sand friability data to table4Data
        setTable4Data({
          sandLump: record.sandLump || '',
          newSandWt: record.newSandWt || '',
          friabilityShiftI: record.sandFriability?.shiftI || '',
          friabilityShiftII: record.sandFriability?.shiftII || '',
          friabilityShiftIII: record.sandFriability?.shiftIII || ''
        });

        // Map testParameter to table5Data
        if (record.testParameter && Array.isArray(record.testParameter)) {
          const formattedTable5 = record.testParameter.map((item, index) => {
            // Convert time from number format (e.g., 830) to display format (e.g., "08:30 AM")
            const formatTime = (timeNum) => {
              if (!timeNum) return '';
              const hour = Math.floor(timeNum / 100);
              const minute = timeNum % 100;
              const period = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
              return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
            };

            return {
              sno: item.sno || index + 1,
              time: formatTime(item.time),
              mixNo: item.mixno || '',
              permeability: item.permeability || '',
              gcsFdyA: item.gcsFdyA || '',
              gcsFdyB: item.gcsFdyB || '',
              wts: item.wts || '',
              moisture: item.moisture || '',
              compactability: item.compactability || '',
              compressibility: item.compressibility || '',
              waterLitre: item.waterLitre || '',
              sandTempBC: item.sandTemp?.BC || '',
              sandTempWU: item.sandTemp?.WU || '',
              sandTempSSU: item.sandTemp?.SSUmax || '',
              newSandKgs: item.newSandKgs || '',
              bentoniteWithPremixKgs: item.bentoniteWithPremix?.Kgs || '',
              bentoniteWithPremixPercent: item.bentoniteWithPremix?.Percent || '',
              bentoniteKgs: item.bentonite?.Kgs || '',
              bentonitePercent: item.bentonite?.Percent || '',
              premixKgs: item.premix?.Kgs || '',
              premixPercent: item.premix?.Percent || '',
              coalDustKgs: item.coalDust?.Kgs || '',
              coalDustPercent: item.coalDust?.Percent || '',
              lc: item.lc || '',
              compactabilitySettings: item.CompactabilitySettings || '',
              mouldStrength: item.mouldStrength || '',
              shearStrengthSetting: item.shearStrengthSetting || '',
              preparedSandlumps: item.preparedSandlumps || '',
              itemName: item.itemName || '',
              remarks: item.remarks || ''
            };
          });
          setTable5Data(formattedTable5);
        }
      }
  };

  // Main function to fetch and display data
  // Accept explicit params to avoid reading stale React state from async callers
  const fetchData = async (filteredFlag = isFiltered, fromDate = startDate, toDate = endDate) => {
    const MINIMUM_LOADING_TIME = 1500; // 1.5 seconds minimum for full animation
    const startTime = Date.now();

    try {
      setLoading(true);

      // If no filter applied, show current date
      if (!filteredFlag) {
        const today = getCurrentDate();
        const record = await fetchDataForDate(today);
        setCurrentDate(today);
        if (record) {
          processRecordData(record);
        } else {
          clearAllData();
        }
      } else if (fromDate) {
        // If only start date (or same dates), fetch that single date
        if (!toDate || fromDate === toDate) {
          const record = await fetchDataForDate(fromDate);
          setCurrentDate(fromDate);
          setIsRangeMode(false);
          setDatesList([]);
          setCurrentEntryIndex(0);
          if (record) {
            processRecordData(record);
          } else {
            clearAllData();
          }
        } else {
          // Date range — collect ALL dates that have data in DB
          const allDates = [];
          const start = new Date(fromDate);
          const end = new Date(toDate);
          const current = new Date(start);

          while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            allDates.push(dateStr);
            current.setDate(current.getDate() + 1);
          }

          // Fetch every date and keep only those with records
          const datesWithData = [];
          for (const dateStr of allDates) {
            const record = await fetchDataForDate(dateStr);
            if (record) {
              datesWithData.push(dateStr);
            }
          }

          setIsRangeMode(true);

          if (datesWithData.length > 0) {
            setDatesList(datesWithData);
            setCurrentEntryIndex(0);
            setCurrentDate(datesWithData[0]);
            processRecordData(cacheRef.current[datesWithData[0]]);
          } else {
            setDatesList([]);
            setCurrentEntryIndex(0);
            setCurrentDate(fromDate);
            clearAllData();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please try again.');
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  // Helper function to clear all data
  const clearAllData = () => {
    setTable1Data({
      table1a: {
        '0_1': [], '0_2': [], '0_3': [],
        '1_1': [], '1_2': [], '1_3': [],
        '2_1': [], '2_2': [], '2_3': [],
        '3_1': [], '3_2': [], '3_3': [],
        '4_1': [], '4_2': [], '4_3': []
      },
      table1b: { bentonite: '', batchType: '', value: '' }
    });
    setTable2Data({
      '0_0': '', '0_1': '', '0_2': '', '1_0': '', '1_1': '', '1_2': '',
      '2_0': '', '2_1': '', '2_2': '', '3_0': '', '3_1': '', '3_2': '',
      '4_0': '', '4_1': '', '4_2': '', '5_0': '', '5_1': '', '5_2': '',
      '6_0': '', '6_1': '', '6_2': ''
    });
    setTable3Data({
      '0_0': [], '0_1': [], '0_2': [], '0_3': [], '0_4': [],
      '1_0': [], '1_1': [], '1_2': [], '1_3': [], '1_4': [],
      '2_0': [], '2_1': [], '2_2': [], '2_3': [], '2_4': []
    });
    setTable4Data({ sandLump: '', newSandWt: '', friabilityShiftI: '', friabilityShiftII: '', friabilityShiftIII: '' });
    setTable5Data([]);
  };

  // Fetch current date data on component mount
  useEffect(() => {
    fetchData();
  }, []);


  const handleFilter = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    // Validate that end date is not before start date
    if (endDate && new Date(endDate) < new Date(startDate)) {
      alert('End date cannot be before start date');
      return;
    }

    setIsFiltered(true);
    // Pass explicit values — React state updates are async so isFiltered
    // would still be false if we called fetchData() without these args
    await fetchData(true, startDate, endDate);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(getCurrentDate());
    setIsFiltered(false);
    setIsRangeMode(false);
    setDatesList([]);
    setCurrentEntryIndex(0);
    clearAllData();

    // Reload current date data
    fetchData();
  };

  const handlePrevEntry = () => {
    if (currentEntryIndex > 0) {
      const newIndex = currentEntryIndex - 1;
      const newDate = datesList[newIndex];
      setCurrentEntryIndex(newIndex);
      setCurrentDate(newDate);
      processRecordData(cacheRef.current[newDate]);
    }
  };

  const handleNextEntry = () => {
    if (currentEntryIndex < datesList.length - 1) {
      const newIndex = currentEntryIndex + 1;
      const newDate = datesList[newIndex];
      setCurrentEntryIndex(newIndex);
      setCurrentDate(newDate);
      processRecordData(cacheRef.current[newDate]);
    }
  };



  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day} / ${month} / ${year}`;
    } catch {
      return dateStr;
    }
  };

  // ─── Excel export: one worksheet (tab) per section, flat table per tab ───
  const handleExcelDownload = async ({ from: rawFrom, to: rawTo }) => {
    const { from, to } = getExportRange(rawFrom, rawTo);
    if (from > to) { alert('From date cannot be after To date.'); return; }
    const dayDiff = Math.round((new Date(to) - new Date(from)) / 86400000);
    if (dayDiff > MAX_EXPORT_DAYS) {
      alert('Maximum 2 months of data can be downloaded. Please narrow the date range.');
      return;
    }

    setIsDownloading(true);
    try {
      const url = `${API_ENDPOINTS.sandTestingRecords}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}&limit=1000`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      const records = (result.success && Array.isArray(result.data)) ? result.data : [];
      // Oldest → newest for a natural top-to-bottom read.
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (records.length === 0) { alert('No data to export for the selected range.'); return; }

      const D = (r) => formatDateDisplay(r.date);
      const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(' / ') : '');
      const formatTime = (timeNum) => {
        if (!timeNum) return '';
        const hour = Math.floor(timeNum / 100);
        const minute = timeNum % 100;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
      };

      // 1) Sand & Mix Testing — one row per date.
      const sandMixRows = records.map((r) => {
        const s = r.sandShifts || {};
        return {
          date: D(r),
          rSandI: joinArr(s.shiftI?.rSand), rSandII: joinArr(s.shiftII?.rSand), rSandIII: joinArr(s.shiftIII?.rSand),
          nSandI: joinArr(s.shiftI?.nSand), nSandII: joinArr(s.shiftII?.nSand), nSandIII: joinArr(s.shiftIII?.nSand),
          mixI: joinArr(s.shiftI?.mixingMode), mixII: joinArr(s.shiftII?.mixingMode), mixIII: joinArr(s.shiftIII?.mixingMode),
          benI: joinArr(s.shiftI?.bentonite), benII: joinArr(s.shiftII?.bentonite), benIII: joinArr(s.shiftIII?.bentonite),
          cdpI: joinArr(s.shiftI?.coalDustPremix), cdpII: joinArr(s.shiftII?.coalDustPremix), cdpIII: joinArr(s.shiftIII?.coalDustPremix),
          batchBentonite: s.batchNo?.bentonite || '',
          batchCoalPremix: s.batchNo?.coalDust || s.batchNo?.premix || '',
        };
      });
      const sandMixColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'I', key: 'rSandI', width: 12, group: 'R. Sand (Kgs./Mix)' },
        { header: 'II', key: 'rSandII', width: 12, group: 'R. Sand (Kgs./Mix)' },
        { header: 'III', key: 'rSandIII', width: 12, group: 'R. Sand (Kgs./Mix)' },
        { header: 'I', key: 'nSandI', width: 12, group: 'N. Sand (Kgs./Mould)' },
        { header: 'II', key: 'nSandII', width: 12, group: 'N. Sand (Kgs./Mould)' },
        { header: 'III', key: 'nSandIII', width: 12, group: 'N. Sand (Kgs./Mould)' },
        { header: 'I', key: 'mixI', width: 12, group: 'Mixing Mode' },
        { header: 'II', key: 'mixII', width: 12, group: 'Mixing Mode' },
        { header: 'III', key: 'mixIII', width: 12, group: 'Mixing Mode' },
        { header: 'I', key: 'benI', width: 12, group: 'Bentonite (Kgs./Mix)' },
        { header: 'II', key: 'benII', width: 12, group: 'Bentonite (Kgs./Mix)' },
        { header: 'III', key: 'benIII', width: 12, group: 'Bentonite (Kgs./Mix)' },
        { header: 'I', key: 'cdpI', width: 12, group: 'Coal Dust / Premix (Kgs./Mix)' },
        { header: 'II', key: 'cdpII', width: 12, group: 'Coal Dust / Premix (Kgs./Mix)' },
        { header: 'III', key: 'cdpIII', width: 12, group: 'Coal Dust / Premix (Kgs./Mix)' },
        { header: 'Bentonite', key: 'batchBentonite', width: 14, group: 'Batch No.' },
        { header: 'Coal Dust / Premix', key: 'batchCoalPremix', width: 16, group: 'Batch No.' },
      ];

      // 2) Clay Testing — one row per date. (Note the record's mixed-case shift keys.)
      const clayRows = records.map((r) => {
        const c = r.clayShifts || {};
        const pick = (param) => ({
          I: c.shiftI?.[param] || '', II: c.ShiftII?.[param] || '', III: c.ShiftIII?.[param] || '',
        });
        const tc = pick('totalClay'), ac = pick('activeClay'), dc = pick('deadClay');
        const vcm = pick('vcm'), loi = pick('loi'), afs = pick('afsNo'), fines = pick('fines');
        return {
          date: D(r),
          tcI: tc.I, tcII: tc.II, tcIII: tc.III,
          acI: ac.I, acII: ac.II, acIII: ac.III,
          dcI: dc.I, dcII: dc.II, dcIII: dc.III,
          vcmI: vcm.I, vcmII: vcm.II, vcmIII: vcm.III,
          loiI: loi.I, loiII: loi.II, loiIII: loi.III,
          afsI: afs.I, afsII: afs.II, afsIII: afs.III,
          finesI: fines.I, finesII: fines.II, finesIII: fines.III,
        };
      });
      const clayGroup = (label, prefix) => [
        { header: 'I', key: `${prefix}I`, width: 11, group: label },
        { header: 'II', key: `${prefix}II`, width: 11, group: label },
        { header: 'III', key: `${prefix}III`, width: 11, group: label },
      ];
      const clayColumns = [
        { header: 'Date', key: 'date', width: 13 },
        ...clayGroup('Total Clay (11.0-14.5%)', 'tc'),
        ...clayGroup('Active Clay (8.5-11.0%)', 'ac'),
        ...clayGroup('Dead Clay (2.0-4.0%)', 'dc'),
        ...clayGroup('V.C.M. (2.0-3.2%)', 'vcm'),
        ...clayGroup('L.O.I. (4.5-6.0%)', 'loi'),
        ...clayGroup('AFS No. (Min. 48)', 'afs'),
        ...clayGroup('Fines (10% Max)', 'fines'),
      ];

      // 3) Mix Testing & Hopper Level — three rows per date (one per shift).
      const mixHopperRows = records.flatMap((r) => {
        const m = r.mixshifts || {};
        return [
          { label: 'I', k: 'ShiftI' },
          { label: 'II', k: 'ShiftII' },
          { label: 'III', k: 'ShiftIII' },
        ].map(({ label, k }) => ({
          date: D(r),
          shift: label,
          mixStart: joinArr(m[k]?.mixno?.start),
          mixEnd: joinArr(m[k]?.mixno?.end),
          mixTotal: joinArr(m[k]?.mixno?.total),
          rejected: joinArr(m[k]?.numberOfMixRejected),
          hopper: joinArr(m[k]?.returnSandHopperLevel),
        }));
      });
      const mixHopperColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Start', key: 'mixStart', width: 14, group: 'Mix No.' },
        { header: 'End', key: 'mixEnd', width: 14, group: 'Mix No.' },
        { header: 'Total', key: 'mixTotal', width: 14, group: 'Mix No.' },
        { header: 'No. Of Rejected', key: 'rejected', width: 16 },
        { header: 'Return Sand Hopper Level', key: 'hopper', width: 20 },
      ];

      // 4) Sand Weight & Friability — one row per date.
      const sandWtRows = records.map((r) => ({
        date: D(r),
        sandLump: r.sandLump || '',
        newSandWt: r.newSandWt || '',
        friI: r.sandFriability?.shiftI || '',
        friII: r.sandFriability?.shiftII || '',
        friIII: r.sandFriability?.shiftIII || '',
      }));
      const sandWtColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Sand Lumps', key: 'sandLump', width: 14 },
        { header: 'New Sand Wt', key: 'newSandWt', width: 14 },
        { header: 'I', key: 'friI', width: 12, group: 'Prepared Sand Friability (8.0%-13.0%)' },
        { header: 'II', key: 'friII', width: 12, group: 'Prepared Sand Friability (8.0%-13.0%)' },
        { header: 'III', key: 'friIII', width: 12, group: 'Prepared Sand Friability (8.0%-13.0%)' },
      ];

      // 5) Sand Properties & Test Parameters — one row per testParameter entry.
      const propRows = records.flatMap((r) =>
        (Array.isArray(r.testParameter) ? r.testParameter : []).map((item, index) => ({
          date: D(r),
          sno: item.sno || index + 1,
          time: formatTime(item.time),
          mixNo: item.mixno || '',
          permeability: item.permeability || '',
          gcsFdyA: item.gcsFdyA || '',
          gcsFdyB: item.gcsFdyB || '',
          wts: item.wts || '',
          moisture: item.moisture || '',
          compactability: item.compactability || '',
          compressibility: item.compressibility || '',
          waterLitre: item.waterLitre || '',
          sandTempBC: item.sandTemp?.BC || '',
          sandTempWU: item.sandTemp?.WU || '',
          sandTempSSU: item.sandTemp?.SSUmax || '',
          newSandKgs: item.newSandKgs || '',
          bentoniteWithPremixKgs: item.bentoniteWithPremix?.Kgs || '',
          bentoniteWithPremixPercent: item.bentoniteWithPremix?.Percent || '',
          bentoniteKgs: item.bentonite?.Kgs || '',
          bentonitePercent: item.bentonite?.Percent || '',
          premixKgs: item.premix?.Kgs || '',
          premixPercent: item.premix?.Percent || '',
          coalDustKgs: item.coalDust?.Kgs || '',
          coalDustPercent: item.coalDust?.Percent || '',
          lc: item.lc || '',
          compactabilitySettings: item.CompactabilitySettings || '',
          mouldStrength: item.mouldStrength || '',
          shearStrengthSetting: item.shearStrengthSetting || '',
          preparedSandlumps: item.preparedSandlumps || '',
          itemName: item.itemName || '',
          remarks: item.remarks || '',
        }))
      );
      const propColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'S.No', key: 'sno', width: 7 },
        { header: 'Time', key: 'time', width: 12 },
        { header: 'Mix No', key: 'mixNo', width: 10 },
        { header: 'Permeability (90-160)', key: 'permeability', width: 14 },
        { header: 'GCS Fdy A Gm/cm² (Min 1800)', key: 'gcsFdyA', width: 14 },
        { header: 'GCS Fdy B Gm/cm² (Min 1900)', key: 'gcsFdyB', width: 14 },
        { header: 'WTS N/cm² (Min 0.15)', key: 'wts', width: 14 },
        { header: 'Moisture (3.0-4.0%)', key: 'moisture', width: 13 },
        { header: 'Compactability (33-40%)', key: 'compactability', width: 14 },
        { header: 'Compressibility (20-28%)', key: 'compressibility', width: 14 },
        { header: 'Water L/Kg', key: 'waterLitre', width: 11 },
        { header: 'BC', key: 'sandTempBC', width: 8, group: 'Sand Temp °C (Max 45)' },
        { header: 'WU', key: 'sandTempWU', width: 8, group: 'Sand Temp °C (Max 45)' },
        { header: 'SSU', key: 'sandTempSSU', width: 8, group: 'Sand Temp °C (Max 45)' },
        { header: 'New Sand Kgs (0.0-5.0)', key: 'newSandKgs', width: 13 },
        { header: 'Kgs', key: 'bentoniteWithPremixKgs', width: 9, group: 'Bentonite with Premix' },
        { header: '%', key: 'bentoniteWithPremixPercent', width: 9, group: 'Bentonite with Premix' },
        { header: 'Kgs', key: 'bentoniteKgs', width: 9, group: 'Bentonite' },
        { header: '%', key: 'bentonitePercent', width: 9, group: 'Bentonite' },
        { header: 'Kgs', key: 'premixKgs', width: 9, group: 'Premix' },
        { header: '%', key: 'premixPercent', width: 9, group: 'Premix' },
        { header: 'Kgs', key: 'coalDustKgs', width: 9, group: 'Coal Dust' },
        { header: '%', key: 'coalDustPercent', width: 9, group: 'Coal Dust' },
        { header: 'LC', key: 'lc', width: 8 },
        { header: 'Compactability Settings (SMC42)', key: 'compactabilitySettings', width: 14 },
        { header: 'Mould Strength (SMC23)', key: 'mouldStrength', width: 14 },
        { header: 'Shear Strength Setting (At15)', key: 'shearStrengthSetting', width: 14 },
        { header: 'Prepared Sand Lumps/Kg', key: 'preparedSandlumps', width: 14 },
        { header: 'Item Name', key: 'itemName', width: 16 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      await exportWorkbookToExcel({
        title: 'Sand Testing Record - Report',
        fromDate: from,
        toDate: to,
        fileName: 'Sand_Testing_Record_Report',
        sheets: [
          { sheetName: 'Sand & Mix Testing', columns: sandMixColumns, rows: sandMixRows },
          { sheetName: 'Clay Testing', columns: clayColumns, rows: clayRows },
          { sheetName: 'Mix Testing & Hopper', columns: mixHopperColumns, rows: mixHopperRows },
          { sheetName: 'Sand Weight & Friability', columns: sandWtColumns, rows: sandWtRows },
          { sheetName: 'Sand Properties & Test', columns: propColumns, rows: propRows },
        ],
      });
    } catch (err) {
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="sand-record-report-container">
      {/* Header */}
      <div className="sand-header">
        <div className="sand-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Sand Testing Record - Report
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {currentDate && (
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>
              Date: {formatDateDisplay(currentDate)}
            </div>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="impact-filter-container" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div className="impact-filter-group">
          <label>From Date</label>
          <CustomDatePicker
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
            disabled={loading}
          />
        </div>
        <div className="impact-filter-group">
          <label>To Date</label>
          <CustomDatePicker
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
            min={startDate}
            disabled={loading}
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!startDate || loading}>
          Filter
        </FilterButton>
        {isFiltered && (
          <ClearButton onClick={handleClear} disabled={loading}>
            Clear
          </ClearButton>
        )}
        <ExcelDownloadButton onClick={() => setShowDownloadDialog(true)} disabled={loading || isDownloading} />
        <ExcelDownloadDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          defaultFrom={startDate}
          defaultTo={endDate}
          loading={isDownloading}
          onConfirm={({ from, to }) => { setShowDownloadDialog(false); handleExcelDownload({ from, to }); }}
        />

        {/* Range navigation: shown only in date-range mode after filter */}
        {isFiltered && isRangeMode && datesList.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px',
            userSelect: 'none'
          }}>
            <EntryNavButton
              direction="prev"
              onClick={handlePrevEntry}
              disabled={currentEntryIndex === 0 || loading}
              title="Previous entry"
            />
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#475569',
              whiteSpace: 'nowrap',
              minWidth: '70px',
              textAlign: 'center'
            }}>
              {currentEntryIndex + 1} of {datesList.length}
            </span>
            <EntryNavButton
              direction="next"
              onClick={handleNextEntry}
              disabled={currentEntryIndex === datesList.length - 1 || loading}
              title="Next entry"
            />
          </div>
        )}

      </div>
      


      {/* Table 1 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand & Mix Testing</h3>

      {/* Table 1a - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1rem' }}>
        <Table
          template
          showHeader={true}
          rows={5}
          columns={[
            { key: 'col1', label: 'Shift', bold: true, align: 'center' },
            { key: 'col2', label: 'I', align: 'center' },
            { key: 'col3', label: 'II', align: 'center' },
            { key: 'col4', label: 'III', align: 'center' }
          ]}
          renderCell={(rowIndex, colIndex) => {
            // First column: row labels
            if (colIndex === 0) {
              const labels = [
                'R. Sand ( Kgs. / Mix )',
                'N. Sand ( Kgs. / Mould )',
                'Mixing Mode',
                'Bentonite ( Kgs. / Mix )',
                'Coal Dust / Premix ( Kgs. / Mix )'
              ];
              return <strong style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#1e293b' }}>{labels[rowIndex]}</strong>;
            }

            // Other columns: display values
            const key = `${rowIndex}_${colIndex}`;
            const values = table1Data.table1a[key] || [];

            return (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                {values.length > 0 ? (
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#334155',
                    minHeight: '20px'
                  }}>
                    {values.join(' / ')}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                )}
              </div>
            );
          }}
          minWidth="800px"
        />
      </div>

      {/* Table 1b - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '600px' }}>
            <tbody>
              <tr style={{ height: '50px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>BATCH No.</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Bentonite</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', padding: '8px' }}>
                  {table1Data.table1b.batchType === 'coalDust' ? 'Coal Dust' : table1Data.table1b.batchType === 'premix' ? 'Premix' : '-'}
                </td>
              </tr>
              <tr style={{ height: '50px' }}>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#334155'
                  }}>
                    {table1Data.table1b.bentonite || '-'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#334155'
                  }}>
                    {table1Data.table1b.value || '-'}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 2 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Clay Testing</h3>

      {/* Table 2 - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px' }}>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
              </tr>
              {/* Data Rows */}
              {[
                'Total Clay (11.0-14.5%)',
                'Active Clay (8.5-11.0%)',
                'Dead Clay (2.0-4.0%)',
                'V.C.M. (2.0-3.2%)',
                'L.O.I. (4.5-6.0%)',
                'AFS No. (Min. 48)',
                'Fines (10% Max)'
              ].map((label, rowIndex) => (
                <tr key={rowIndex} style={{ height: '50px' }}>
                  <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{label}</td>
                  {[0, 1, 2].map((colIndex) => {
                    const key = `${rowIndex}_${colIndex}`;
                    const value = table2Data[key] || '';
                    
                    return (
                      <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                        <div style={{
                          padding: '10px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#334155',
                          minHeight: '20px'
                        }}>
                          {value || '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 3 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Mix Testing & Hopper Level</h3>

      {/* Table 3 - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px', width: '100%' }}>
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col />
              <col />
            </colgroup>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shift</td>
                <td colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>
                  Mix No.
                </td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>No. Of Rejected</td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Return Sand Hopper level</td>
              </tr>
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Start</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>End</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Total</td>
              </tr>
              {/* Data Rows */}
              {['I', 'II', 'III'].map((shift, rowIndex) => {
                const columns = [0, 1, 2, 3, 4];
                return (
                  <tr key={rowIndex} style={{ height: '50px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{shift}</td>
                    {columns.map((colIndex) => {
                      const key = `${rowIndex}_${colIndex}`;
                      const values = table3Data[key] || [];
                      
                      return (
                        <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                          <div style={{
                            padding: '10px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#334155',
                            minHeight: '20px'
                          }}>
                            {values.length > 0 ? values.join(' / ') : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 4 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Weight & Friability</h3>

      {/* Table 4a and 4b - Side by Side - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Table 4a - 2x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SAND LUMPS</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.sandLump || '-'}
                      </div>
                    </td>
                  </tr>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>NEW SAND WT</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.newSandWt || '-'}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4b - 4x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Prepared Sand Friability ( 8.0 % - 13.0 % )</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.friabilityShiftI || '-'}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.friabilityShiftII || '-'}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.friabilityShiftIII || '-'}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Table 5 Display - Sand Properties & Test Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Properties & Test Parameters</h3>

      {/* Table 5 - Scrollable display with sub-columns */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        {table5Data.length === 0 ? (
          <div className="reusable-table-container">
            <table className="reusable-table table-template table-bordered" style={{ minWidth: '2600px' }}>
              <thead>
                <tr style={{ height: '50px' }}>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>S.No</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Time</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mix No</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Permeability<br/>(90-160)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>G.C.S<br/>Gm/cm²</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>WTS N/cm²<br/>(Min 0.15)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Moisture<br/>(3.0-4.0%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>(33-40%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compressibility<br/>(20-28%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Water<br/>L/Kg</th>
                  <th colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Sand Temp °C (Max 45)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>New Sand Kgs<br/>(0.0-5.0)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix / Coal Dust</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>Setting</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mould Strength<br/>Setting</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Prepared Sand<br/>Lumps/Kg</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Item Name</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Remarks</th>
                </tr>
                <tr style={{ height: '40px' }}>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>BC</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>WU</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>SSU</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: '50px' }}>
                  {Array.from({ length: 23 }).map((_, i) => (
                    <td key={i} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#94a3b8' }}>-</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (() => {
          // Determine which GCS columns have data
          const hasGcsFdyA = table5Data.some(row => row.gcsFdyA && row.gcsFdyA !== '-');
          const hasGcsFdyB = table5Data.some(row => row.gcsFdyB && row.gcsFdyB !== '-');
          
          // Determine which Bentonite columns have data
          const hasBentoniteWithPremix = table5Data.some(row => 
            (row.bentoniteWithPremixKgs && row.bentoniteWithPremixKgs !== '-') || 
            (row.bentoniteWithPremixPercent && row.bentoniteWithPremixPercent !== '-')
          );
          const hasBentonite = table5Data.some(row => 
            (row.bentoniteKgs && row.bentoniteKgs !== '-') || 
            (row.bentonitePercent && row.bentonitePercent !== '-')
          );
          
          // Detect bentonite range from data
          let bentoniteRange = '';
          if (hasBentonite) {
            const bentonitePercents = table5Data
              .map(row => parseFloat(row.bentonitePercent))
              .filter(val => !isNaN(val) && val > 0);
            if (bentonitePercents.length > 0) {
              const maxPercent = Math.max(...bentonitePercents);
              bentoniteRange = maxPercent <= 1.20 ? ' (0.60-1.20)' : ' (0.80-2.20)';
            }
          }
          
          // Determine which Premix/Coal Dust columns have data
          const hasPremix = table5Data.some(row => 
            (row.premixKgs && row.premixKgs !== '-') || 
            (row.premixPercent && row.premixPercent !== '-')
          );
          const hasCoalDust = table5Data.some(row => 
            (row.coalDustKgs && row.coalDustKgs !== '-') || 
            (row.coalDustPercent && row.coalDustPercent !== '-')
          );
          
          // Determine which Compactability/Strength columns have data
          const hasLC = table5Data.some(row => row.lc && row.lc !== '-');
          const hasCompactabilitySettings = table5Data.some(row => row.compactabilitySettings && row.compactabilitySettings !== '-');
          const hasMouldStrength = table5Data.some(row => row.mouldStrength && row.mouldStrength !== '-');
          const hasShearStrength = table5Data.some(row => row.shearStrengthSetting && row.shearStrengthSetting !== '-');
          
          return (
          <div className="reusable-table-container">
            <table className="reusable-table table-template table-bordered" style={{ minWidth: '4000px' }}>
              <thead>
                {/* Main Header Row */}
                <tr style={{ height: '50px' }}>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>S.No</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Time</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mix No</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Permeability<br/>(90-160)</th>
                  {hasGcsFdyA && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>GCS Fdy A<br/>Gm/cm²<br/>(Min 1800)</th>
                  )}
                  {hasGcsFdyB && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>GCS Fdy B<br/>Gm/cm²<br/>(Min 1900)</th>
                  )}
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>WTS N/cm²<br/>(Min 0.15)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Moisture<br/>(3.0-4.0%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>(33-40%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compressibility<br/>(20-28%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Water<br/>L/Kg</th>
                  <th colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Sand Temp °C (Max 45)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>New Sand Kgs<br/>(0.0-5.0)</th>
                  {hasBentoniteWithPremix && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite with Premix</th>
                  )}
                  {hasBentonite && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite{bentoniteRange}</th>
                  )}
                  {hasPremix && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix (0.60-1.20)</th>
                  )}
                  {hasCoalDust && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Coal Dust (0.28-0.70)</th>
                  )}
                  {hasLC && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>LC</th>
                  )}
                  {hasCompactabilitySettings && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>Settings<br/>(SMC42)</th>
                  )}
                  {hasMouldStrength && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mould<br/>Strength<br/>(SMC23)</th>
                  )}
                  {hasShearStrength && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shear Strength<br/>Setting<br/>(At15)</th>
                  )}
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Prepared Sand<br/>Lumps/Kg</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Item Name</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Remarks</th>
                </tr>
                {/* Sub-Header Row */}
                <tr style={{ height: '40px' }}>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>BC</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>WU</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>SSU</th>
                  {hasBentoniteWithPremix && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                  {hasBentonite && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                  {hasPremix && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                  {hasCoalDust && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {table5Data.map((row, index) => (
                  <tr key={index} style={{ height: '50px', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{row.sno}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.time || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.mixNo || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.permeability || '-'}</td>
                    {hasGcsFdyA && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.gcsFdyA || '-'}</td>
                    )}
                    {hasGcsFdyB && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.gcsFdyB || '-'}</td>
                    )}
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.wts || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.moisture || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.compactability || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.compressibility || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.waterLitre || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.sandTempBC || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.sandTempWU || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.sandTempSSU || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.newSandKgs || '-'}</td>
                    {hasBentoniteWithPremix && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentoniteWithPremixKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentoniteWithPremixPercent || '-'}</td>
                      </>
                    )}
                    {hasBentonite && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentoniteKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentonitePercent || '-'}</td>
                      </>
                    )}
                    {hasPremix && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.premixKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.premixPercent || '-'}</td>
                      </>
                    )}
                    {hasCoalDust && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.coalDustKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.coalDustPercent || '-'}</td>
                      </>
                    )}
                    {hasLC && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.lc || '-'}</td>
                    )}
                    {hasCompactabilitySettings && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.compactabilitySettings || '-'}</td>
                    )}
                    {hasMouldStrength && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.mouldStrength || '-'}</td>
                    )}
                    {hasShearStrength && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.shearStrengthSetting || '-'}</td>
                    )}
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.preparedSandlumps || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.itemName || '-'}</td>
                    <td style={{ textAlign: 'left', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          );
        })()}
      </div>
      </div>


    </div>
  );
};

export default SandTestingRecordReport;