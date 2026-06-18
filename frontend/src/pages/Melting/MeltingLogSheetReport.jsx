import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, CustomPagination, SectionToggles, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadModal, toast } from '../../Components/Alert';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import EntryActions from '../../Components/EntryActions';
import { meltingEditConfig } from '../../utils/editFieldConfigs';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/Melting/MeltingLogSheetReport.css';
import '../../styles/ComponentStyles/Table.css';
import '../../styles/ComponentStyles/Buttons.css';

const MeltingLogSheetReport = () => {

  // ========================================================================
  // FILTER SYSTEM — Reusable pattern for date-range + optional dropdown filter
  // ========================================================================
  //
  // HOW IT WORKS:
  // 1. On mount, ALL entries are fetched once from the API and stored in `allEntries`.
  // 2. `filteredEntries` is a subset of `allEntries` — this is what the table renders.
  // 3. By default, only today's entries are shown (filtered on mount).
  //
  // FILTER STATES:
  //   - fromDate  : Start of date range (optional — if empty, no lower bound)
  //   - toDate    : End of date range (required — defaults to today)
  //   - selectedX : Any additional dropdown filter (e.g., Shift, Furnace, Panel)
  //
  // FILTER BUTTON ENABLE LOGIC:
  //   - Enabled when toDate is set AND toDate > fromDate (if fromDate is provided).
  //   - This prevents filtering with an invalid/empty range.
  //
  // handleFilter():
  //   - Filters `allEntries` client-side by comparing each entry's date (converted
  //     to 'YYYY-MM-DD' string) against the fromDate–toDate range.
  //   - If fromDate is empty, shows only entries matching toDate exactly.
  //   - Then applies any additional dropdown filters (Shift, Furnace, Panel).
  //   - Resets pagination to page 1.
  //
  // handleClear():
  //   - Resets fromDate to '', toDate to today, dropdowns to ''.
  //   - Re-filters to today's entries only (same as initial load, NOT all entries).
  //   - Resets pagination to page 1.
  // ========================================================================

  // Helper: Convert any date value to 'YYYY-MM-DD' string in local timezone
  // Used for consistent date comparisons (avoids timezone issues with toISOString)
  const formatDateLocal = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const getTodayLocal = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayLocal();

  // --- Filter States ---
  const [fromDate, setFromDate] = useState('');           // Start date (optional — empty means no lower bound)
  const [toDate, setToDate] = useState(todayStr);         // End date (required — defaults to today)
  const [selectedShift, setSelectedShift] = useState('');  // Additional dropdown filter
  const [selectedFurnace, setSelectedFurnace] = useState('');
  const [selectedPanel, setSelectedPanel] = useState('');
  const [allEntries, setAllEntries] = useState([]);        // Full dataset fetched once from API
  const [filteredEntries, setFilteredEntries] = useState([]); // Filtered subset shown in table
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);      // Pagination — reset to 1 on every filter/clear
  const [show, setShow] = useState({ primary: true, table1: true, table2: true, table3: true, table4: true, table5: true });
  const toggle = (key) => setShow(prev => ({ ...prev, [key]: !prev[key] }));
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Reason' });
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const itemsPerPage = 15;

  // FILTER BUTTON ENABLE LOGIC:
  // Enabled when: toDate exists AND (fromDate is empty OR toDate > fromDate)
  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

  const showRemarksPopup = (content, title = 'Reason') => {
    setRemarksModal({ show: true, content, title });
  };
  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Reason' });
  };

  // Pure filter — applies the current date-range + dropdown selections to a list.
  // With no fromDate, shows only entries matching toDate exactly (default = today).
  const computeFiltered = (list) => {
    if (!toDate) return [];
    const toDateStr = toDate;
    const fromDateStr = fromDate || '';
    let filtered = list.filter(r => {
      if (!r.date) return false;
      const reportDate = formatDateLocal(r.date);
      if (fromDateStr) return reportDate >= fromDateStr && reportDate <= toDateStr;
      return reportDate === toDateStr;
    });
    if (selectedShift && selectedShift.trim() !== '') filtered = filtered.filter(r => String(r.shift) === String(selectedShift));
    if (selectedFurnace && selectedFurnace.trim() !== '') filtered = filtered.filter(r => String(r.furnaceNo) === String(selectedFurnace));
    if (selectedPanel && selectedPanel.trim() !== '') filtered = filtered.filter(r => String(r.panel) === String(selectedPanel));
    return filtered;
  };

  // Fetch the full dataset (wide range) and re-apply the current view. Runs on
  // mount and after a successful edit/delete (passed as onChanged to EntryActions).
  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = `${new Date().getFullYear() - 2}-01-01`;
      const endDate = todayStr;
      const resp = await fetch(`${API_ENDPOINTS.meltingLogs}/filter?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await resp.json();
      if (data.success && data.data) {
        setAllEntries(data.data);
        setFilteredEntries(computeFiltered(data.data));
      }
    } catch (error) {
      console.error('Error fetching melting log data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // STEP 2: handleFilter — apply the current filters to the loaded dataset.
  const handleFilter = () => {
    setFilteredEntries(computeFiltered(allEntries));
    setCurrentPage(1); // Always reset to first page after filtering
  };

  // STEP 3: handleClear — Reset all filters to defaults.
  // Shows only today's entries (same as initial load), resets dates, dropdowns, and pagination.
  const handleClear = () => {
    setFromDate('');              // Clear start date
    setToDate(todayStr);          // Reset end date to today
    setSelectedShift('');         // Reset dropdown
    setSelectedFurnace('');       // Reset dropdown
    setSelectedPanel('');         // Reset dropdown
    // Re-filter to today's entries only (not all entries)
    const todayFiltered = allEntries.filter(r => {
      if (!r.date) return false;
      return formatDateLocal(r.date) === todayStr;
    });
    setFilteredEntries(todayFiltered);
    setCurrentPage(1);            // Reset pagination
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${date.getFullYear()}`;
  };

  // Sort entries by date descending
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.shift || '').localeCompare(b.shift || '');
    });
  }, [filteredEntries]);

  // Pagination
  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

  // Group key: date + shift + furnaceNo + panel
  const getGroupKey = (row) => `${row.date}-${row.shift}-${row.furnaceNo}-${row.panel}`.replace(/[^a-zA-Z0-9]/g, '-');

  // Group calculation for grouped rowSpan (consecutive same date+shift+furnace+panel)
  const getGroupInfo = () => {
    const groups = {};
    let currentKey = null;
    let groupStartIdx = 0;

    paginatedRows.forEach((row, idx) => {
      const key = getGroupKey(row);
      if (key !== currentKey) {
        if (currentKey !== null) {
          groups[groupStartIdx] = { rowspan: idx - groupStartIdx };
        }
        currentKey = key;
        groupStartIdx = idx;
      }
      if (idx === paginatedRows.length - 1) {
        groups[groupStartIdx] = { rowspan: idx - groupStartIdx + 1 };
      }
    });
    return groups;
  };

  const groupInfo = getGroupInfo();

  // Excel export — independent of the on-screen table filter. Uses the modal's
  // own from/to range (defaults applied by getExportRange) plus the currently
  // selected Shift/Furnace/Panel dropdowns, against the full fetched dataset.
  const handleExcelDownload = async ({ from: rawFrom, to: rawTo }) => {
    const { from, to } = getExportRange(rawFrom, rawTo);
    if (from > to) { toast.warning('From date cannot be after To date.'); return; }
    const dayDiff = Math.round((new Date(to) - new Date(from)) / 86400000);
    if (dayDiff > MAX_EXPORT_DAYS) {
      toast.warning('Maximum 2 months of data can be downloaded. Please narrow the date range.');
      return;
    }

    setIsDownloading(true);
    try {
      let rows = allEntries.filter(r => {
        if (!r.date) return false;
        const rd = formatDateLocal(r.date);
        return rd >= from && rd <= to;
      });
      if (selectedShift && selectedShift.trim() !== '') rows = rows.filter(r => String(r.shift) === String(selectedShift));
      if (selectedFurnace && selectedFurnace.trim() !== '') rows = rows.filter(r => String(r.furnaceNo) === String(selectedFurnace));
      if (selectedPanel && selectedPanel.trim() !== '') rows = rows.filter(r => String(r.panel) === String(selectedPanel));

      rows.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.shift || '').localeCompare(b.shift || '');
      });

      if (rows.length === 0) { toast.info('No data to export for the selected range.'); return; }

      const exportColumns = [
        { header: 'Date', key: 'date', width: 14, value: (r) => formatDisplayDate(r.date) },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Furnace No', key: 'furnaceNo', width: 12 },
        { header: 'Panel', key: 'panel', width: 10 },
        { header: 'Cumul. Liquid Metal (kgs)', key: 'cumulativeLiquidMetal', width: 18, group: 'Primary' },
        { header: 'Final KW/Hr', key: 'finalKWHr', width: 13, group: 'Primary' },
        { header: 'Initial KW/Hr', key: 'initialKWHr', width: 13, group: 'Primary' },
        { header: 'Total Units', key: 'totalUnits', width: 12, group: 'Primary' },
        { header: 'Cumul. Units', key: 'cumulativeUnits', width: 13, group: 'Primary' },
        { header: 'Heat No', key: 'heatNo', width: 11, group: 'Charging' },
        { header: 'Grade', key: 'grade', width: 10, group: 'Charging' },
        { header: 'Time', key: 'chargingTime', width: 11, group: 'Charging' },
        { header: 'If Bath', key: 'ifBath', width: 10, group: 'Charging' },
        { header: 'Liquid Metal (kgs)', key: 'liquidMetalPressPour', width: 14, group: 'Charging' },
        { header: 'Holder (kgs)', key: 'liquidMetalHolder', width: 13, group: 'Charging' },
        { header: 'SG-MS Steel', key: 'sgMsSteel', width: 12, group: 'Charging' },
        { header: 'MS Steel (Grey)', key: 'greyMsSteel', width: 14, group: 'Charging' },
        { header: 'Returns SG', key: 'returnsSg', width: 12, group: 'Charging' },
        { header: 'Pig Iron', key: 'pigIron', width: 10, group: 'Charging' },
        { header: 'Borings', key: 'borings', width: 10, group: 'Charging' },
        { header: 'Final (Kgs)', key: 'finalBath', width: 12, group: 'Charging' },
        { header: 'Char Coal', key: 'charCoal', width: 11, group: 'Ferro Additions' },
        { header: 'CPC (Fur)', key: 'cpcFur', width: 11, group: 'Ferro Additions' },
        { header: 'CPC (LC)', key: 'cpcLc', width: 11, group: 'Ferro Additions' },
        { header: 'SiC', key: 'siliconCarbideFur', width: 9, group: 'Ferro Additions' },
        { header: 'FeSi (Fur)', key: 'ferrosiliconFur', width: 11, group: 'Ferro Additions' },
        { header: 'FeSi (LC)', key: 'ferrosiliconLc', width: 11, group: 'Ferro Additions' },
        { header: 'FeMn (Fur)', key: 'ferroManganeseFur', width: 11, group: 'Ferro Additions' },
        { header: 'FeMn (LC)', key: 'ferroManganeseLc', width: 11, group: 'Ferro Additions' },
        { header: 'Cu', key: 'cu', width: 9, group: 'Ferro Additions' },
        { header: 'FE-Cr', key: 'cr', width: 9, group: 'Ferro Additions' },
        { header: 'Pure Mg', key: 'pureMg', width: 10, group: 'Ferro Additions' },
        { header: 'Lab Coin Time', key: 'labCoinTime', width: 13, group: 'Lab Coin & Timing' },
        { header: 'Temp (°C)', key: 'labCoinTempC', width: 11, group: 'Lab Coin & Timing' },
        { header: 'Deslagging From', key: 'deslagingTimeFrom', width: 18, group: 'Lab Coin & Timing' },
        { header: 'Deslagging To', key: 'deslagingTimeTo', width: 18, group: 'Lab Coin & Timing' },
        { header: 'Metal Ready', key: 'metalReadyTime', width: 18
          , group: 'Lab Coin & Timing' },
        { header: 'Wait Tapping From', key: 'waitingForTappingFrom', width: 15, group: 'Lab Coin & Timing' },
        { header: 'Wait Tapping To', key: 'waitingForTappingTo', width: 14, group: 'Lab Coin & Timing' },
        { header: 'Reason', key: 'reason', width: 20, group: 'Lab Coin & Timing' },
        { header: 'Tapping Time', key: 'time', width: 12, group: 'Metal Tapping' },
        { header: 'Temp °C (Non-SG)', key: 'tempCSg', width: 14, group: 'Metal Tapping' },
        { header: 'Direct Furnace', key: 'directFurnace', width: 18, group: 'Metal Tapping' },
        { header: 'Holder → Furnace', key: 'holderToFurnace', width: 18, group: 'Metal Tapping' },
        { header: 'Furnace → Holder', key: 'furnaceToHolder', width: 18, group: 'Metal Tapping' },
        { header: 'DISA No', key: 'disaNo', width: 10, group: 'Metal Tapping' },
        { header: 'Item', key: 'item', width: 10, group: 'Metal Tapping' },
        { header: 'F1-2-3 kW', key: 'furnace1Kw', width: 11, group: 'Electrical Readings' },
        { header: 'F1-2-3 A', key: 'furnace1A', width: 11, group: 'Electrical Readings' },
        { header: 'F1-2-3 V', key: 'furnace1V', width: 11, group: 'Electrical Readings' },
        { header: 'F4 Hz', key: 'furnace4Hz', width: 10, group: 'Electrical Readings' },
        { header: 'F4 GLD', key: 'furnace4Gld', width: 10, group: 'Electrical Readings' },
        { header: 'F4 kW/Hr', key: 'furnace4KwHr', width: 11, group: 'Electrical Readings' },
      ];

      await exportToExcel({
        title: 'Melting Log Sheet Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Melting_Log_Sheet_Report',
        sheetName: 'Melting',
      });
      setShowExcelModal(false);
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate total column count for empty-row colSpan
  const totalColCount = 4
    + (show.primary ? 5 : 0)
    + (show.table1 ? 12 : 0)
    + (show.table2 ? 11 : 0)
    + (show.table3 ? 8 : 0)
    + (show.table4 ? 7 : 0)
    + (show.table5 ? 6 : 0)
    + 1; // Actions column

  return (
    <div className="page-wrapper melting-page-wrapper">
      <div className="melting-report-header">
        <div className="melting-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Melting Log Sheet - Report
          </h2>
        </div>
      </div>

      <div className="melting-report-filter-wrapper">
        <div className="melting-report-filter-group">
          <label className="melting-report-filter-label">From Date</label>
          <CustomDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From date" />
        </div>
        <div className="melting-report-filter-group">
          <label className="melting-report-filter-label">To Date</label>
          <CustomDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To date" />
        </div>
        <div className="melting-report-filter-group">
          <label className="melting-report-filter-label">Shift (Optional)</label>
          <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)}
            style={{ padding: '0.625rem 0.875rem', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', cursor: 'pointer', minWidth: '150px' }}>
            <option value="">All Shifts</option>
            <option value="Shift 1">Shift 1</option>
            <option value="Shift 2">Shift 2</option>
            <option value="Shift 3">Shift 3</option>
          </select>
        </div>
        <div className="melting-report-filter-group">
          <label className="melting-report-filter-label">Furnace (Optional)</label>
          <select value={selectedFurnace} onChange={(e) => setSelectedFurnace(e.target.value)}
            style={{ padding: '0.625rem 0.875rem', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', cursor: 'pointer', minWidth: '150px' }}>
            <option value="">All Furnaces</option>
            <option value="1">Furnace 1</option>
            <option value="2">Furnace 2</option>
            <option value="3">Furnace 3</option>
            <option value="4">Furnace 4</option>
          </select>
        </div>
        <div className="melting-report-filter-group">
          <label className="melting-report-filter-label">Panel (Optional)</label>
          <select value={selectedPanel} onChange={(e) => setSelectedPanel(e.target.value)}
            style={{ padding: '0.625rem 0.875rem', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: '#ffffff', cursor: 'pointer', minWidth: '150px' }}>
            <option value="">All Panels</option>
            <option value="A">Panel A</option>
            <option value="B">Panel B</option>
            <option value="C">Panel C</option>
            <option value="D">Panel D</option>
          </select>
        </div>
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
        <ExcelDownloadButton onClick={() => setShowExcelModal(true)} disabled={loading} />
      </div>

      {/* Section Toggles */}
      <SectionToggles
        sections={[
          { key: 'primary', label: 'Primary' },
          { key: 'table1', label: 'Table 1' },
          { key: 'table2', label: 'Table 2' },
          { key: 'table3', label: 'Table 3' },
          { key: 'table4', label: 'Table 4' },
          { key: 'table5', label: 'Table 5' }
        ]}
        show={show}
        onToggle={toggle}
        onClear={() => setShow({ primary: false, table1: false, table2: false, table3: false, table4: false, table5: false })}
      />

      {loading ? <div className="melting-report-loader-container"><div>Loading...</div></div> : (
        <div className="reusable-table-container">
          <table className="reusable-table" style={{ tableLayout: 'auto' }}>
            <thead>
              {/* Row 1: Group Headers */}
              <tr>
                <th rowSpan={2} style={{ minWidth: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date</th>
                <th rowSpan={2} style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Shift</th>
                <th rowSpan={2} style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Furnace No</th>
                <th rowSpan={2} style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Panel</th>
                {show.primary && <th colSpan={5} style={{ textAlign: 'center' }}>Primary</th>}
                {show.table1 && <th colSpan={12} style={{ textAlign: 'center' }}>Charging</th>}
                {show.table2 && <th colSpan={11} style={{ textAlign: 'center' }}>Ferro Additions</th>}
                {show.table3 && <th colSpan={8} style={{ textAlign: 'center' }}>Lab Coin &amp; Timing</th>}
                {show.table4 && <th colSpan={7} style={{ textAlign: 'center' }}>Metal Tapping</th>}
                {show.table5 && <th colSpan={6} style={{ textAlign: 'center' }}>Electrical Readings</th>}
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
              {/* Row 2: Sub Headers */}
              <tr>
                {show.primary && <>
                  <th style={{ minWidth: '160px', textAlign: 'center', whiteSpace: 'nowrap' }}>Cumul. Liquid Metal (kgs)</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Final KW/Hr</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Initial KW/Hr</th>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Total Units</th>
                  <th style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Cumul. Units</th>
                </>}
                {show.table1 && <>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Heat No</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Grade</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Time</th>
                  <th style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>If Bath</th>
                  <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Liquid Metal (kgs)</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Holder (kgs)</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>SG-MS Steel</th>
                  <th style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>MS Steel (Grey)</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Returns SG</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Pig Iron</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Borings</th>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Final (Kgs)</th>
                </>}
                {show.table2 && <>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Char Coal</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>CPC (Fur)</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>CPC (LC)</th>
                  <th style={{ minWidth: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>SiC</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>FeSi (Fur)</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>FeSi (LC)</th>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>FeMn (Fur)</th>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>FeMn (LC)</th>
                  <th style={{ minWidth: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>Cu</th>
                  <th style={{ minWidth: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>FE-Cr</th>
                  <th style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>Pure Mg</th>
                </>}
                {show.table3 && <>
                  <th style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Lab Coin Time</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Temp (°C)</th>
                  <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Deslagging From</th>
                  <th style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Deslagging To</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Metal Ready</th>
                  <th style={{ minWidth: '130px', textAlign: 'center', whiteSpace: 'nowrap' }}>Wait Tapping From</th>
                  <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Wait Tapping To</th>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Reason</th>
                </>}
                {show.table4 && <>
                  <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tapping Time</th>
                  <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Temp °C (Non-SG)</th>
                  <th style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Direct Furnace</th>
                  <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Holder → Furnace</th>
                  <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Furnace → Holder</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>DISA No</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Item</th>
                </>}
                {show.table5 && <>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>F1-2-3 kW</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>F1-2-3 A</th>
                  <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>F1-2-3 V</th>
                  <th style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>F4 Hz</th>
                  <th style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>F4 GLD</th>
                  <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>F4 kW/Hr</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr><td colSpan={totalColCount} className="reusable-table-no-records">{sortedEntries.length === 0 ? 'No records found' : 'No data on this page'}</td></tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const isGroupStart = groupInfo[idx];
                  const prevRow = idx > 0 ? paginatedRows[idx - 1] : null;
                  const isFirstInGroup = !prevRow || getGroupKey(prevRow) !== getGroupKey(row);

                  return (
                    <tr
                      key={`${row._id}-${idx}`}
                      className={`melting-report-data-row${isFirstInGroup && idx > 0 ? ' group-first' : ''}`}
                    >
                      {/* Always visible — grouped cells */}
                      {isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className={`melting-report-grouped-cell${idx > 0 ? ' border-top' : ''}`}>
                          {formatDisplayDate(row.date)}
                        </td>
                      )}
                      {isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">
                          {row.shift || '-'}
                        </td>
                      )}
                      {isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">
                          {row.furnaceNo || '-'}
                        </td>
                      )}
                      {isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">
                          {row.panel || '-'}
                        </td>
                      )}
                      {/* Primary */}
                      {show.primary && isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">{row.cumulativeLiquidMetal ?? '-'}</td>
                      )}
                      {show.primary && isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">{row.finalKWHr ?? '-'}</td>
                      )}
                      {show.primary && isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">{row.initialKWHr ?? '-'}</td>
                      )}
                      {show.primary && isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">{row.totalUnits ?? '-'}</td>
                      )}
                      {show.primary && isGroupStart && (
                        <td rowSpan={isGroupStart.rowspan} className="melting-report-grouped-cell">{row.cumulativeUnits ?? '-'}</td>
                      )}
                      {/* Table 1 */}
                      {show.table1 && <td>{row.heatNo ?? '-'}</td>}
                      {show.table1 && <td>{row.grade ?? '-'}</td>}
                      {show.table1 && <td>{row.chargingTime ?? '-'}</td>}
                      {show.table1 && <td>{row.ifBath ?? '-'}</td>}
                      {show.table1 && <td>{row.liquidMetalPressPour ?? '-'}</td>}
                      {show.table1 && <td>{row.liquidMetalHolder ?? '-'}</td>}
                      {show.table1 && <td>{row.sgMsSteel ?? '-'}</td>}
                      {show.table1 && <td>{row.greyMsSteel ?? '-'}</td>}
                      {show.table1 && <td>{row.returnsSg ?? '-'}</td>}
                      {show.table1 && <td>{row.pigIron ?? '-'}</td>}
                      {show.table1 && <td>{row.borings ?? '-'}</td>}
                      {show.table1 && <td>{row.finalBath ?? '-'}</td>}
                      {/* Table 2 */}
                      {show.table2 && <td>{row.charCoal ?? '-'}</td>}
                      {show.table2 && <td>{row.cpcFur ?? '-'}</td>}
                      {show.table2 && <td>{row.cpcLc ?? '-'}</td>}
                      {show.table2 && <td>{row.siliconCarbideFur ?? '-'}</td>}
                      {show.table2 && <td>{row.ferrosiliconFur ?? '-'}</td>}
                      {show.table2 && <td>{row.ferrosiliconLc ?? '-'}</td>}
                      {show.table2 && <td>{row.ferroManganeseFur ?? '-'}</td>}
                      {show.table2 && <td>{row.ferroManganeseLc ?? '-'}</td>}
                      {show.table2 && <td>{row.cu ?? '-'}</td>}
                      {show.table2 && <td>{row.cr ?? '-'}</td>}
                      {show.table2 && <td>{row.pureMg ?? '-'}</td>}
                      {/* Table 3 */}
                      {show.table3 && <td>{row.labCoinTime ?? '-'}</td>}
                      {show.table3 && <td>{row.labCoinTempC ?? '-'}</td>}
                      {show.table3 && <td>{row.deslagingTimeFrom ?? '-'}</td>}
                      {show.table3 && <td>{row.deslagingTimeTo ?? '-'}</td>}
                      {show.table3 && <td>{row.metalReadyTime ?? '-'}</td>}
                      {show.table3 && <td>{row.waitingForTappingFrom ?? '-'}</td>}
                      {show.table3 && <td>{row.waitingForTappingTo ?? '-'}</td>}
                      {show.table3 && (
                        <td
                          className={`melting-report-reason-cell ${row.reason ? 'clickable' : 'empty'}`}
                          onClick={() => row.reason && showRemarksPopup(row.reason)}
                          title={row.reason || 'No reason'}
                        >
                          {row.reason || '-'}
                        </td>
                      )}
                      {/* Table 4 */}
                      {show.table4 && <td>{row.time ?? '-'}</td>}
                      {show.table4 && <td>{row.tempCSg ?? '-'}</td>}
                      {show.table4 && <td>{row.directFurnace ?? '-'}</td>}
                      {show.table4 && <td>{row.holderToFurnace ?? '-'}</td>}
                      {show.table4 && <td>{row.furnaceToHolder ?? '-'}</td>}
                      {show.table4 && <td>{row.disaNo ?? '-'}</td>}
                      {show.table4 && <td>{row.item ?? '-'}</td>}
                      {/* Table 5 */}
                      {show.table5 && <td>{row.furnace1Kw ?? '-'}</td>}
                      {show.table5 && <td>{row.furnace1A ?? '-'}</td>}
                      {show.table5 && <td>{row.furnace1V ?? '-'}</td>}
                      {show.table5 && <td>{row.furnace4Hz ?? '-'}</td>}
                      {show.table5 && <td>{row.furnace4Gld ?? '-'}</td>}
                      {show.table5 && <td>{row.furnace4KwHr ?? '-'}</td>}
                      {/* Actions — only real entry rows (not primary-only placeholders) */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {row.primaryId && (
                          <EntryActions entry={row} editConfig={meltingEditConfig} onChanged={fetchData} />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && sortedEntries.length > itemsPerPage && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Reason/Remarks Modal */}
      {remarksModal.show && (
        <div className="melting-report-modal-overlay" onClick={closeRemarksModal}>
          <div className="melting-report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="melting-report-modal-header">
              <h3 className="melting-report-modal-title">{remarksModal.title}</h3>
              <button onClick={closeRemarksModal} className="melting-report-modal-close">&times;</button>
            </div>
            <p className="melting-report-modal-text">{remarksModal.content}</p>
          </div>
        </div>
      )}

      <ExcelDownloadModal
        open={showExcelModal}
        loading={isDownloading}
        onClose={() => setShowExcelModal(false)}
        onDownload={handleExcelDownload}
        title="Download Melting Log Sheet Report"
      />
    </div>
  );
};

export default MeltingLogSheetReport;
