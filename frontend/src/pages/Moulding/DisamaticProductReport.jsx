import React, { useState, useEffect } from 'react';
import { BookOpenCheck, ArrowLeft } from 'lucide-react';
import { FilterButton, ClearButton, ShiftDropdown, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadDialog } from '../../Components/alert';
import Table from '../../Components/Table';
import { exportWorkbookToExcel, getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/Moulding/DisamaticProductReport.css';

const DisamaticProductReport = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredDelayIndex, setHoveredDelayIndex] = useState({ rowIndex: null, itemIndex: null });

  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shift, setShift] = useState('');

  // Range mode states
  const [rangeMode, setRangeMode] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [detailFromRange, setDetailFromRange] = useState(false);
  const [hoveredDateGroup, setHoveredDateGroup] = useState(null);
  const [hoveredSummaryRow, setHoveredSummaryRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Excel export
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // Transform backend data to frontend format
  const transformBackendData = (dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return [];
    }
    
    return dataArray.map(item => ({
      shift: item.shift || '-',
      incharge: item.incharge || '-',
      ppOperator: item.ppOperator || '-',
      members: Array.isArray(item.memberspresent) 
        ? item.memberspresent.map(name => ({ name })) 
        : [],
      productionTable: item.productionDetails || [],
      nextShiftPlanTable: item.nextShiftPlan || [],
      delaysTable: item.delays || [],
      mouldHardnessTable: item.mouldHardness || [],
      patternTempTable: item.patternTemperature || [],
      significantEvent: item.significantEvent || '',
      maintenance: item.maintenance || '',
      supervisorName: item.supervisorName || ''
    }));
  };

  // Group range data by date for summary table
  const groupByDateForSummary = (data) => {
    const sorted = [...data].sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.shift || '').localeCompare(b.shift || '');
    });
    return sorted.map(item => ({
      _id: item._id,
      date: item.date,
      shift: item.shift || '-',
      rawData: item
    }));
  };

  // Calculate rowspans for date grouping in summary table
  const calculateDateGroups = (data) => {
    const groups = {};
    let currentDateVal = null;
    let groupStart = 0;
    
    data.forEach((item, index) => {
      const itemDate = new Date(item.date).toDateString();
      if (itemDate !== currentDateVal) {
        if (currentDateVal !== null) {
          groups[groupStart] = { rowspan: index - groupStart, date: currentDateVal };
        }
        currentDateVal = itemDate;
        groupStart = index;
      }
      if (index === data.length - 1) {
        groups[groupStart] = { rowspan: index - groupStart + 1, date: currentDateVal };
      }
    });
    return groups;
  };

  // Pagination for summary
  const totalPages = Math.ceil(summaryData.length / itemsPerPage);
  const paginatedSummary = summaryData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const dateGroups = calculateDateGroups(paginatedSummary);

  const isRowInHoveredDateGroup = (rowIndex) => {
    if (!hoveredDateGroup) return false;
    return new Date(paginatedSummary[rowIndex]?.date).toDateString() === hoveredDateGroup;
  };

  const getDateForRow = (rowIndex) => {
    return new Date(paginatedSummary[rowIndex]?.date).toDateString();
  };

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    fetchCurrentDateAndEntries();
  }, []);

  const fetchCurrentDateAndEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      setCurrentDate(todayStr);
      setStartDate(todayStr);

      const response = await fetch(
        `${API_ENDPOINTS.mouldingDisa}/range?startDate=${todayStr}&endDate=${todayStr}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        setEntries([]);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        const allEntries = transformBackendData(data.data);
        const lastShift = allEntries[allEntries.length - 1].shift;
        setShift(lastShift);
        setEntries(allEntries.filter(entry => entry.shift === lastShift));
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!startDate) {
      alert('Please select a date');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (endDate) {
        // Range mode - fetch from range endpoint
        if (new Date(endDate) < new Date(startDate)) {
          alert('End date cannot be before start date');
          setLoading(false);
          return;
        }
        const url = `${API_ENDPOINTS.mouldingDisa}/range?startDate=${startDate}&endDate=${endDate}`;
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const grouped = groupByDateForSummary(data.data);
          setSummaryData(grouped);
          setRangeMode(true);
          setDetailFromRange(false);
          setEntries([]);
          setCurrentPage(1);
        } else {
          setSummaryData([]);
          setRangeMode(true);
          setDetailFromRange(false);
          setEntries([]);
          setError('No data found for the selected date range');
        }
      } else {
        // Single date mode
        const url = `${API_ENDPOINTS.mouldingDisa}/range?startDate=${startDate}&endDate=${startDate}`;
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          let filteredData = transformBackendData(data.data);
          
          if (shift) {
            filteredData = filteredData.filter(entry => entry.shift === shift);
          } else if (filteredData.length > 0) {
            // Auto-select last entered shift
            const lastShift = filteredData[filteredData.length - 1].shift;
            setShift(lastShift);
            filteredData = filteredData.filter(entry => entry.shift === lastShift);
          }
          
          setEntries(filteredData);
          setRangeMode(false);
          setDetailFromRange(false);
          
          if (filteredData.length === 0) {
            setError('No data found for the selected filters');
          }
        } else {
          setEntries([]);
          setRangeMode(false);
          setError('No data found for the selected date');
        }
      }
    } catch (error) {
      console.error('Error filtering entries:', error);
      setError('Failed to filter entries: ' + error.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setShift('');
    setRangeMode(false);
    setDetailFromRange(false);
    setSummaryData([]);
    setCurrentPage(1);
    setHoveredDateGroup(null);
    setHoveredSummaryRow(null);
    fetchCurrentDateAndEntries();
  };

  // Handle click on date cell in summary table - show all shifts for that date
  const handleDateClick = (dateStr) => {
    const targetDate = new Date(dateStr).toDateString();
    const dateEntries = summaryData
      .filter(item => new Date(item.date).toDateString() === targetDate)
      .map(item => item.rawData);
    const transformed = transformBackendData(dateEntries);
    setEntries(transformed);
    setDetailFromRange(true);
  };

  // Handle click on a specific shift row in summary table
  const handleShiftRowClick = (item) => {
    const transformed = transformBackendData([item.rawData]);
    setEntries(transformed);
    setDetailFromRange(true);
  };

  // Back to summary from detail
  const handleBackToSummary = () => {
    setDetailFromRange(false);
    setEntries([]);
    setError('');
  };

  const formatDate = (dateStr) => {
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
      const url = `${API_ENDPOINTS.mouldingDisa}/range?startDate=${from}&endDate=${to}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
      const data = await response.json();
      const records = (data.success && Array.isArray(data.data)) ? data.data : [];
      records.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.shift || '').localeCompare(b.shift || '');
      });
      if (records.length === 0) { alert('No data to export for the selected range.'); return; }

      const D = (r) => formatDate(r.date);
      const S = (r) => r.shift || '-';
      const joinPairs = (arr) => (Array.isArray(arr) && arr.length
        ? arr.map((p) => `${p[0] ?? '-'} - ${p[1] ?? '-'}`).join(', ') : '');

      // 1) Overview — one row per record (shift).
      const overviewRows = records.map((r) => ({
        date: D(r), shift: S(r),
        incharge: r.incharge || '',
        ppOperator: r.ppOperator || '',
        members: Array.isArray(r.memberspresent) ? r.memberspresent.join(', ') : '',
      }));
      const overviewColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Incharge', key: 'incharge', width: 16 },
        { header: 'PP Operator', key: 'ppOperator', width: 16 },
        { header: 'Members Present', key: 'members', width: 30 },
      ];

      // 2) Production — one row per item.
      const productionRows = records.flatMap((r) =>
        (Array.isArray(r.productionDetails) ? r.productionDetails : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: item.sNo || i + 1,
          counterNo: item.counterNo || '',
          componentName: item.componentName || '',
          produced: item.produced ?? '',
          poured: item.poured ?? '',
          cycleTime: item.cycleTime || '',
          mouldsPerHour: item.mouldsPerHour || '',
          remarks: item.remarks || '',
        }))
      );
      const productionColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Counter No', key: 'counterNo', width: 12 },
        { header: 'Component Name', key: 'componentName', width: 22 },
        { header: 'Produced', key: 'produced', width: 12 },
        { header: 'Poured', key: 'poured', width: 12 },
        { header: 'Cycle Time', key: 'cycleTime', width: 12 },
        { header: 'Moulds/Hour', key: 'mouldsPerHour', width: 13 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 3) Next Shift Plan — one row per item.
      const nextShiftRows = records.flatMap((r) =>
        (Array.isArray(r.nextShiftPlan) ? r.nextShiftPlan : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: item.sNo || i + 1,
          componentName: item.componentName || '',
          plannedMoulds: item.plannedMoulds ?? '',
          remarks: item.remarks || '',
        }))
      );
      const nextShiftColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Component Name', key: 'componentName', width: 24 },
        { header: 'Planned Moulds', key: 'plannedMoulds', width: 16 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 4) Delays — one row per item.
      const delaysRows = records.flatMap((r) =>
        (Array.isArray(r.delays) ? r.delays : []).map((item, i) => {
          const durations = Array.isArray(item.durationMinutes)
            ? item.durationMinutes.map((m) => `${m} min`).join(' / ')
            : (item.durationMinutes ?? '');
          const times = Array.isArray(item.fromTime) && Array.isArray(item.toTime)
            ? item.fromTime.map((f, idx) => `${f} - ${item.toTime[idx] ?? ''}`).join(', ')
            : '';
          return {
            date: D(r), shift: S(r),
            sNo: item.sNo || i + 1,
            delays: item.delays || '',
            durationMinutes: durations,
            durationInTime: times,
          };
        })
      );
      const delaysColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Delays', key: 'delays', width: 24 },
        { header: 'Duration (Minutes)', key: 'durationMinutes', width: 22 },
        { header: 'Duration in Time', key: 'durationInTime', width: 28 },
      ];

      // 5) Mould Hardness — one row per item.
      const mouldHardnessRows = records.flatMap((r) =>
        (Array.isArray(r.mouldHardness) ? r.mouldHardness : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: item.sNo || i + 1,
          componentName: item.componentName || '',
          mpPP: joinPairs(item.mpPP),
          mpSP: joinPairs(item.mpSP),
          bsPP: joinPairs(item.bsPP),
          bsSP: joinPairs(item.bsSP),
          remarks: item.remarks || '',
        }))
      );
      const mouldHardnessColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Component Name', key: 'componentName', width: 22 },
        { header: 'PP', key: 'mpPP', width: 16, group: 'Mould Penetrant tester (N/cm²)' },
        { header: 'SP', key: 'mpSP', width: 16, group: 'Mould Penetrant tester (N/cm²)' },
        { header: 'PP', key: 'bsPP', width: 16, group: 'B - Scale' },
        { header: 'SP', key: 'bsSP', width: 16, group: 'B - Scale' },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 6) Pattern Temperature — one row per item.
      const patternTempRows = records.flatMap((r) =>
        (Array.isArray(r.patternTemperature) ? r.patternTemperature : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: i + 1,
          item: item.item || '',
          pp: item.pp ?? '',
          sp: item.sp ?? '',
        }))
      );
      const patternTempColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Item', key: 'item', width: 24 },
        { header: 'PP', key: 'pp', width: 12 },
        { header: 'SP', key: 'sp', width: 12 },
      ];

      // 7) Events & Maintenance — one row per record.
      const eventsRows = records.map((r) => ({
        date: D(r), shift: S(r),
        significantEvent: r.significantEvent || '',
        maintenance: r.maintenance || '',
        supervisorName: r.supervisorName || '',
      }));
      const eventsColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Significant Event', key: 'significantEvent', width: 36 },
        { header: 'Maintenance', key: 'maintenance', width: 36 },
        { header: 'Supervisor Name', key: 'supervisorName', width: 20 },
      ];

      await exportWorkbookToExcel({
        title: 'Disamatic Product - Report',
        fromDate: from,
        toDate: to,
        fileName: 'Disamatic_Product_Report',
        sheets: [
          { sheetName: 'Overview', columns: overviewColumns, rows: overviewRows },
          { sheetName: 'Production', columns: productionColumnsX, rows: productionRows },
          { sheetName: 'Next Shift Plan', columns: nextShiftColumns, rows: nextShiftRows },
          { sheetName: 'Delays', columns: delaysColumnsX, rows: delaysRows },
          { sheetName: 'Mould Hardness', columns: mouldHardnessColumns, rows: mouldHardnessRows },
          { sheetName: 'Pattern Temperature', columns: patternTempColumnsX, rows: patternTempRows },
          { sheetName: 'Events & Maintenance', columns: eventsColumns, rows: eventsRows },
        ],
      });
    } catch (err) {
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Production Table Columns
  const productionColumns = [
    { 
      key: 'sNo', 
      label: 'S.No', 
      width: '80px', 
      align: 'center',
      render: (item, rowIndex) => item.isTotalRow ? '' : (item.sNo || rowIndex + 1)
    },
    { 
      key: 'counterNo', 
      label: 'Counter No', 
      width: '120px', 
      align: 'center',
      render: (item) => item.isTotalRow ? '' : item.counterNo
    },
    { 
      key: 'componentName', 
      label: 'Component Name', 
      width: '200px', 
      align: 'left',
      render: (item) => (
        <span style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#1e293b' : '#475569' }}>
          {item.componentName}
        </span>
      )
    },
    { 
      key: 'produced', 
      label: 'Produced', 
      width: '120px', 
      align: 'center',
      render: (item) => (
        <span style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#5B9AA9' : '#475569', fontSize: item.isTotalRow ? '1.05rem' : 'inherit' }}>
          {item.produced}
        </span>
      )
    },
    { 
      key: 'poured', 
      label: 'Poured', 
      width: '120px', 
      align: 'center',
      render: (item) => (
        <span style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#5B9AA9' : '#475569', fontSize: item.isTotalRow ? '1.05rem' : 'inherit' }}>
          {item.poured}
        </span>
      )
    },
    { 
      key: 'cycleTime', 
      label: 'Cycle Time', 
      width: '120px', 
      align: 'center',
      render: (item) => item.isTotalRow ? '' : item.cycleTime
    },
    { 
      key: 'mouldsPerHour', 
      label: 'Moulds/Hour', 
      width: '140px', 
      align: 'center',
      render: (item) => item.isTotalRow ? '' : item.mouldsPerHour
    },
    { 
      key: 'remarks', 
      label: 'Remarks', 
      width: '200px', 
      align: 'left',
      render: (item) => item.isTotalRow ? '' : item.remarks
    }
  ];

  // Get production data with totals row
  const getProductionDataWithTotals = () => {
    if (entries.length === 0 || !entries[0]?.productionTable) {
      return [];
    }
    
    const data = entries[0].productionTable;
    
    if (data.length === 0) {
      return [];
    }
    
    // Calculate totals
    const totals = data.reduce(
      (acc, row) => {
        acc.totalProduced += Number(row.produced) || 0;
        acc.totalPoured += Number(row.poured) || 0;
        return acc;
      },
      { totalProduced: 0, totalPoured: 0 }
    );
    
    // Add total row
    return [
      ...data,
      {
        _id: 'total-row',
        isTotalRow: true,
        counterNo: '',
        componentName: 'TOTAL',
        produced: totals.totalProduced,
        poured: totals.totalPoured,
        cycleTime: '',
        mouldsPerHour: '',
        remarks: ''
      }
    ];
  };

  // Next Shift Plan Table Columns
  const nextShiftPlanColumns = [
    { 
      key: 'sNo', 
      label: 'S.No', 
      width: '80px', 
      align: 'center',
      render: (item, rowIndex) => item.sNo || rowIndex + 1
    },
    { key: 'componentName', label: 'Component Name', width: '300px', align: 'left' },
    { key: 'plannedMoulds', label: 'Planned Moulds', width: '200px', align: 'center' },
    { key: 'remarks', label: 'Remarks', width: '300px', align: 'left' }
  ];

  // Delays Table Columns
  const delaysColumns = [
    { 
      key: 'sNo', 
      label: 'S.No', 
      width: '80px', 
      align: 'center',
      render: (item, rowIndex) => item.isTotalRow ? '' : (item.sNo || rowIndex + 1)
    },
    { 
      key: 'delays', 
      label: 'Delays', 
      width: '250px', 
      align: 'left',
      render: (item) => (
        <span style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#1e293b' : '#475569' }}>
          {item.delays}
        </span>
      )
    },
    { 
      key: 'durationMinutes', 
      label: 'Duration (Minutes)', 
      width: '300px', 
      align: 'left',
      render: (item, rowIndex) => {
        // Total row - show total minutes
        if (item.isTotalRow) {
          return (
            <span style={{ 
              fontWeight: 700, 
              color: '#1e293b',
              fontSize: '1rem'
            }}>
              {item.totalMinutes} min
            </span>
          );
        }
        
        // Regular row
        if (!Array.isArray(item.durationMinutes)) {
          return item.durationMinutes;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {item.durationMinutes.map((duration, idx) => (
              <span
                key={idx}
                onMouseEnter={() => setHoveredDelayIndex({ rowIndex, itemIndex: idx })}
                onMouseLeave={() => setHoveredDelayIndex({ rowIndex: null, itemIndex: null })}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#5B9AA9' : '#f1f5f9',
                  color: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#ffffff' : '#334155',
                  fontWeight: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? 600 : 500,
                  cursor: 'default',
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#5B9AA9' : '#cbd5e1'
                }}
              >
                {duration} min
              </span>
            ))}
          </div>
        );
      }
    },
    { 
      key: 'durationInTime', 
      label: 'Duration in Time', 
      width: '350px', 
      align: 'left',
      render: (item, rowIndex) => {
        // Total row - show empty
        if (item.isTotalRow) {
          return '';
        }
        
        if (!Array.isArray(item.fromTime) || !Array.isArray(item.toTime)) {
          return '-';
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {item.fromTime.map((from, idx) => (
              <span
                key={idx}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#5B9AA9' : '#f8fafc',
                  color: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#ffffff' : '#475569',
                  fontWeight: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? 600 : 500,
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#5B9AA9' : '#e2e8f0'
                }}
              >
                {from} - {item.toTime[idx]}
              </span>
            ))}
          </div>
        );
      }
    }
  ];

  // Get delays data with totals row
  const getDelaysDataWithTotals = () => {
    if (entries.length === 0 || !entries[0]?.delaysTable) {
      return [];
    }
    
    const data = entries[0].delaysTable;
    
    if (data.length === 0) {
      return [];
    }
    
    // Calculate total minutes
    const totalMinutes = data.reduce((acc, row) => {
      if (Array.isArray(row.durationMinutes)) {
        row.durationMinutes.forEach(min => {
          acc += Number(min) || 0;
        });
      } else {
        acc += Number(row.durationMinutes) || 0;
      }
      return acc;
    }, 0);
    
    // Add total row
    return [
      ...data,
      {
        _id: 'delays-total-row',
        isTotalRow: true,
        delays: 'TOTAL',
        totalMinutes: totalMinutes,
        durationMinutes: [],
        fromTime: [],
        toTime: []
      }
    ];
  };

  // Mould Hardness Table - Custom render with two-row header
  const renderMouldHardnessTable = () => {
    const data = entries.length > 0 && entries[0]?.mouldHardnessTable ? entries[0].mouldHardnessTable : [];

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle', color: '#1e293b' }}>S.No</th>
              <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle', color: '#1e293b' }}>Component Name</th>
              <th colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>Mould Penetrant tester (N/cm²)</th>
              <th colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>B - Scale</th>
              <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle', color: '#1e293b' }}>Remarks</th>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>PP</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>SP</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>PP</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>SP</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
                    No mould hardness data available
                  </span>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
              <tr key={row._id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                  {row.sNo || index + 1}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                  {row.componentName || '-'}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.mpPP) || row.mpPP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.mpPP.map((pair, idx) => (
                        <span key={idx} style={{ color: '#334155', fontWeight: 500 }}>
                          {pair[0] || '-'} - {pair[1] || '-'}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.mpSP) || row.mpSP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.mpSP.map((pair, idx) => (
                        <span key={idx} style={{ color: '#334155', fontWeight: 500 }}>
                          {pair[0] || '-'} - {pair[1] || '-'}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.bsPP) || row.bsPP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.bsPP.map((pair, idx) => (
                        <span key={idx} style={{ color: '#334155', fontWeight: 500 }}>
                          {pair[0] || '-'} - {pair[1] || '-'}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.bsSP) || row.bsSP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.bsSP.map((pair, idx) => (
                        <span key={idx} style={{ color: '#334155', fontWeight: 500 }}>
                          {pair[0] || '-'} - {pair[1] || '-'}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                  {row.remarks || '-'}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Pattern Temperature Table Columns
  const patternTempColumns = [
    { 
      key: 'sno', 
      label: 'S.No', 
      width: '100px', 
      align: 'center',
      render: (item, rowIndex) => rowIndex + 1
    },
    { 
      key: 'item', 
      label: 'Item', 
      width: '300px', 
      align: 'left' 
    },
    { 
      key: 'pp', 
      label: 'PP', 
      width: '150px', 
      align: 'center' 
    },
    { 
      key: 'sp', 
      label: 'SP', 
      width: '150px', 
      align: 'center' 
    }
  ];

  return (
    <div className="page-wrapper moulding-page-wrapper">
      <div className="disamatic-report-header">
        <div className="disamatic-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Disamatic Product - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {currentDate ? `DATE : ${formatDate(currentDate)}` : 'Loading...'}
        </div>
      </div>

      {/* Filter Section */}
      {!detailFromRange && (
        <div className="disamatic-filter-container">
          <div className="disamatic-filter-group">
            <label>From</label>
            <CustomDatePicker
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Select start date"
            />
          </div>
          <div className="disamatic-filter-group">
            <label>To</label>
            <CustomDatePicker
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Select end date"
              min={startDate}
            />
          </div>
          {!endDate && (
            <div className="disamatic-filter-group">
              <label>Shift</label>
              <ShiftDropdown
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                disabled={!startDate}
              />
            </div>
          )}
          <FilterButton onClick={handleFilter} disabled={!startDate || loading}>
            {loading ? 'Loading...' : 'Filter'}
          </FilterButton>
          <ClearButton onClick={handleClearFilter} disabled={!startDate && !endDate && !shift}>
            Clear
          </ClearButton>
          <ExcelDownloadButton onClick={() => setShowDownloadDialog(true)} disabled={loading || isDownloading} />
          <ExcelDownloadDialog
            open={showDownloadDialog}
            onOpenChange={setShowDownloadDialog}
            defaultFrom={startDate}
            defaultTo={endDate}
            loading={isDownloading}
            onConfirm={({ from, to }) => { setShowDownloadDialog(false); handleExcelDownload({ from, to }); }}
          />
          {error && (
            <span className="disa-inline-error" style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</span>
          )}
        </div>
      )}

      {/* Summary Table - Range Mode */}
      {rangeMode && !detailFromRange && (
        <>
          <div className="reusable-table-container">
            <table className="reusable-table" style={{ minWidth: '400px' }}>
              <thead>
                <tr>
                  <th style={{ width: '200px', textAlign: 'center' }}>Date</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>Shift</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSummary.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="reusable-table-no-records">No records found</td>
                  </tr>
                ) : (
                  paginatedSummary.map((item, rowIndex) => {
                    const isDateGroupStart = dateGroups[rowIndex];
                    const isInHoveredGroup = isRowInHoveredDateGroup(rowIndex);
                    const isRowHovered = hoveredSummaryRow === rowIndex;
                    const shouldHighlightDateCell = hoveredSummaryRow !== null &&
                      isDateGroupStart &&
                      getDateForRow(hoveredSummaryRow) === new Date(item.date).toDateString();

                    return (
                      <tr
                        key={item._id || rowIndex}
                        className={`${isInHoveredGroup && !isRowHovered ? 'date-group-hovered' : ''} ${isRowHovered ? 'row-hovered' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleShiftRowClick(item)}
                      >
                        {isDateGroupStart ? (
                          <td
                            rowSpan={isDateGroupStart.rowspan}
                            className={`date-cell ${shouldHighlightDateCell ? 'date-cell-row-hovered' : ''}`}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setHoveredDateGroup(new Date(item.date).toDateString());
                              setHoveredSummaryRow(null);
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              setHoveredDateGroup(null);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(item.date);
                            }}
                            style={{
                              width: '200px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            {formatDate(item.date)}
                          </td>
                        ) : null}
                        <td
                          style={{ width: '200px', textAlign: 'center', color: '#475569' }}
                          onMouseEnter={() => {
                            setHoveredSummaryRow(rowIndex);
                            setHoveredDateGroup(null);
                          }}
                          onMouseLeave={() => setHoveredSummaryRow(null)}
                        >
                          {item.shift}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      )}

      {/* Detail View - Back button when navigated from range */}
      {detailFromRange && (
        <button
          onClick={handleBackToSummary}
          className="disamatic-back-btn"
        >
          <ArrowLeft size={18} />
          Back to Summary
        </button>
      )}

      {/* Primary Section */}
      {!loading && (!rangeMode || detailFromRange) && (
        <>
          <h3 className="primary-heading">
            Primary {entries.length > 0 && entries[0]?.shift ? `( ${entries[0].shift} )` : ''}
          </h3>
          <div className="primary-details" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="primary-detail-item">
              <span className="detail-label">Incharge</span>
              <span className="detail-value">{entries.length > 0 && entries[0]?.incharge ? entries[0].incharge : '-'}</span>
            </div>
            <div className="primary-detail-item">
              <span className="detail-label">PP Operator</span>
              <span className="detail-value">{entries.length > 0 && entries[0]?.ppOperator ? entries[0].ppOperator : '-'}</span>
            </div>
            <div className="primary-detail-item">
              <span className="detail-label">Members Present</span>
              <span className="detail-value">
                {entries.length > 0 && entries[0]?.members && entries[0].members.length > 0
                  ? entries[0].members.slice(0, 4).map(member => member.name || member).join(', ')
                  : '-'}
              </span>
            </div>
          </div>

          {/* Production Table */}
          <h3 className="section-heading">Production</h3>
          <Table
            columns={productionColumns}
            data={getProductionDataWithTotals()}
            noDataMessage="No production data available"
            minWidth={1200}
            striped={true}
            bordered={true}
          />

          {/* Next Shift Plan Table */}
          <h3 className="section-heading">Next Shift Plan</h3>
          <Table
            columns={nextShiftPlanColumns}
            data={entries.length > 0 && entries[0]?.nextShiftPlanTable ? entries[0].nextShiftPlanTable : []}
            noDataMessage="No next shift plan data available"
            minWidth={800}
            striped={true}
            bordered={true}
          />

          {/* Delays Table */}
          <h3 className="section-heading">Delays</h3>
          <Table
            columns={delaysColumns}
            data={getDelaysDataWithTotals()}
            noDataMessage="No delays data available"
            minWidth={900}
            striped={true}
            bordered={true}
          />

          {/* Mould Hardness Table */}
          <h3 className="section-heading">Mould Hardness</h3>
          {renderMouldHardnessTable()}

          {/* Pattern Temperature Table */}
          <h3 className="section-heading">Pattern Temperature</h3>
          <Table
            columns={patternTempColumns}
            data={entries.length > 0 && entries[0]?.patternTempTable ? entries[0].patternTempTable : []}
            noDataMessage="No pattern temperature data available"
            minWidth={700}
            striped={true}
            bordered={true}
          />

          {/* Significant Events & Maintenance */}
          <h3 className="primary-heading">Significant Events & Maintenance</h3>
          <div className="primary-details" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            <div className="primary-detail-item" style={{ minHeight: 'auto' }}>
              <span className="detail-label">Significant Event</span>
              <span className="detail-value" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: 'auto' }}>
                {entries.length > 0 && entries[0]?.significantEvent ? entries[0].significantEvent : '-'}
              </span>
            </div>
            <div className="primary-detail-item" style={{ minHeight: 'auto' }}>
              <span className="detail-label">Maintenance</span>
              <span className="detail-value" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: 'auto' }}>
                {entries.length > 0 && entries[0]?.maintenance ? entries[0].maintenance : '-'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="primary-detail-item" style={{ maxWidth: '350px', flex: '0 0 auto' }}>
              <span className="detail-label">Supervisor Name</span>
              <span className="detail-value">
                {entries.length > 0 && entries[0]?.supervisorName ? entries[0].supervisorName : '-'}
              </span>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default DisamaticProductReport;
