import React, { useState, useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, DeviationToggleButton, MachineDropdown, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadDialog, useToast } from '../../Components/alert';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useDeviationClass } from '../../utils/deviationDisplay';
import { validationRanges, keyToRuleField } from '../../deviations/DdmmSettingParameters';
import '../../styles/PageStyles/Moulding/DisamaticProductReport.css';
import '../../styles/ComponentStyles/Buttons.css';
import '../../styles/ComponentStyles/Table.css';
// Redesigned to mirror TensileReport: one consolidated table showing all parameter rows across shifts.
// Each parameter row gains Date + Machine + Shift context columns.
const DmmSettingParametersReport = () => {
  const { isAdmin } = useAuth();
  const [showDeviations, setShowDeviations] = useState(false);
  const devClass = useDeviationClass(validationRanges, keyToRuleField, { isAdmin, showDeviations });
  const { toast } = useToast();
  // Use LOCAL date (not UTC) to avoid off-by-one issues
  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const getTodayLocal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getTodayLocal();

  // Helper: Convert any date value to 'YYYY-MM-DD' string in local timezone
  // Used for consistent date comparisons (avoids timezone issues with toISOString)
  const formatDateLocal = formatDate;

  const [fromDate, setFromDate] = useState('');         // optional — no lower bound when empty
  const [toDate, setToDate] = useState(todayStr);       // required — defaults to today
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [appliedShift, setAppliedShift] = useState('');
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Remarks' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // Filter enabled when toDate is set AND (fromDate is empty OR toDate >= fromDate)
  const isFilterEnabled = toDate && toDate.trim() !== '' && (!fromDate || toDate >= fromDate);

  // Section checkboxes removed – always show all columns

  const showRemarksPopup = (content, title = 'Remarks') => {
    setRemarksModal({ show: true, content, title });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Remarks' });
  };

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_ENDPOINTS.mouldingDmm}/all`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await resp.json();
      if (data.success) {
        const all = data.data || [];
        setAllEntries(all);
        // Auto-filter: show only today's entries on mount
        const todayDate = getTodayLocal();
        const filtered = all.filter(r => {
          if (!r.date) return false;
          return formatDateLocal(r.date) === todayDate;
        });
        setFilteredEntries(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch dmm settings', err);
    } finally { setLoading(false); }
  };

  const applyFilters = (overrideFrom, overrideTo, overrideMachine, overrideShift) => {
    const fd = overrideFrom !== undefined ? overrideFrom : fromDate;
    const td = overrideTo   !== undefined ? overrideTo   : toDate;
    const mach = overrideMachine !== undefined ? overrideMachine : selectedMachine;
    const sh   = overrideShift   !== undefined ? overrideShift   : selectedShift;

    let filtered = [...allEntries];

    // Date filter:
    // - If fromDate is set → show range [fromDate, toDate]
    // - If fromDate is empty → show only entries matching toDate exactly
    filtered = filtered.filter(r => {
      if (!r.date) return false;
      const d = formatDateLocal(r.date);
      if (fd && fd.trim() !== '') {
        return d >= fd && d <= td;
      }
      return d === td;
    });

    // Optional machine filter
    if (mach && mach.trim() !== '') {
      filtered = filtered.filter(r => String(r.machine) === String(mach));
    }

    setFilteredEntries(filtered);
    setAppliedShift(sh);
  };

  const handleFilter = () => {
    if (isFilterEnabled) {
      applyFilters();
      setCurrentPage(1);
    }
  };

  const handleClear = () => {
    const today = getTodayLocal();
    setFromDate('');
    setToDate(today);
    setSelectedMachine('');
    setSelectedShift('');
    // Re-filter to today only (same as initial mount)
    applyFilters('', today, '', '');
    setCurrentPage(1);
  };

  // Display a 'YYYY-MM-DD'/date value as 'dd / mm / yyyy' for the export Date column.
  const formatDisplayDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return `${String(dt.getDate()).padStart(2, '0')} / ${String(dt.getMonth() + 1).padStart(2, '0')} / ${dt.getFullYear()}`;
  };

  // Flatten a set of reports (all shifts) into unified parameter rows — same
  // shape as `flattenedRows` below, but reusable for export over a date range.
  const flattenReports = (reports) => reports.flatMap(report => {
    const rows = [];
    if (report.parameters) {
      ['shift1', 'shift2', 'shift3'].forEach(shiftKey => {
        const arr = report.parameters[shiftKey];
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach((param, rowIndex) => {
            rows.push({
              _id: report._id,
              date: report.date,
              machine: report.machine,
              shift: shiftKey.replace('shift', 'Shift '),
              shiftKey,
              rowIndex,
              operatorName: report.shifts?.[shiftKey]?.operatorName || '-',
              checkedBy: report.shifts?.[shiftKey]?.checkedBy || '-',
              ...param
            });
          });
        }
      });
    }
    return rows;
  });

  const handleExcelDownload = async ({ from: rawFrom, to: rawTo }) => {
    const { from, to } = getExportRange(rawFrom, rawTo);
    const dayDiff = Math.round((new Date(to) - new Date(from)) / 86400000);
    if (dayDiff > MAX_EXPORT_DAYS) {
      return;
    }

    setIsDownloading(true);
    try {
      let reports = allEntries.filter(r => {
        if (!r.date) return false;
        const rd = formatDateLocal(r.date);
        return rd >= from && rd <= to;
      });
      if (selectedMachine && selectedMachine.trim() !== '') {
        reports = reports.filter(r => String(r.machine) === String(selectedMachine));
      }
      reports.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return String(a.machine).localeCompare(String(b.machine));
      });

      const rows = flattenReports(reports);

      const exportColumns = [
        { header: 'Date', key: 'date', width: 13, value: (r) => formatDisplayDate(r.date) },
        { header: 'Machine', key: 'machine', width: 10 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Operator Name', key: 'operatorName', width: 16 },
        { header: 'Operated By', key: 'checkedBy', width: 16 },
        { header: 'Customer', key: 'customer', width: 16 },
        { header: 'Item Description', key: 'itemDescription', width: 20 },
        { header: 'Time', key: 'time', width: 10 },
        { header: 'PP Thickness (mm)', key: 'ppThickness', width: 14 },
        { header: 'PP Height (mm)', key: 'ppHeight', width: 14 },
        { header: 'SP Thickness (mm)', key: 'spThickness', width: 14 },
        { header: 'SP Height (mm)', key: 'spHeight', width: 14 },
        { header: 'Core Mask Thickness (mm)', key: 'coreMaskThickness', width: 16 },
        { header: 'Core Mask Height Outside (mm)', key: 'coreMaskHeightOutside', width: 18 },
        { header: 'Core Mask Height Inside (mm)', key: 'coreMaskHeightInside', width: 18 },
        { header: 'Sand Shot Pressure (Bar)', key: 'sandShotPressureBar', width: 16 },
        { header: 'Correction Shot Time (s)', key: 'correctionShotTime', width: 16 },
        { header: 'Squeeze Pressure (Kg/cm²)', key: 'squeezePressure', width: 16 },
        { header: 'PP Stripping Accel.', key: 'ppStrippingAcceleration', width: 14 },
        { header: 'PP Stripping Dist.', key: 'ppStrippingDistance', width: 14 },
        { header: 'SP Stripping Accel.', key: 'spStrippingAcceleration', width: 14 },
        { header: 'SP Stripping Dist.', key: 'spStrippingDistance', width: 14 },
        { header: 'Mould Thickness ±10mm', key: 'mouldThicknessPlus10', width: 16 },
        { header: 'Close-Up Force/Pressure', key: 'closeUpForceMouldCloseUpPressure', width: 18 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      await exportToExcel({
        title: 'DMM Setting Parameters Check Sheet - Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'DMM_Setting_Parameters_Report',
        sheetName: 'DMM',
      });
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Flatten each shift's parameter arrays into unified list of rows.
  const flattenedRows = filteredEntries.flatMap(report => {
    const rows = [];
    if (report.parameters) {
      ['shift1','shift2','shift3'].forEach(shiftKey => {
        // Only show data for the selected shift
        if (appliedShift && appliedShift !== shiftKey.replace('shift','Shift ')) return;
        const arr = report.parameters[shiftKey];
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach((param, rowIndex) => {
            rows.push({
              _id: report._id,
              date: report.date,
              machine: report.machine,
              shift: shiftKey.replace('shift','Shift '),
              shiftKey,
              rowIndex,
              operatorName: report.shifts?.[shiftKey]?.operatorName || '-',
              checkedBy: report.shifts?.[shiftKey]?.checkedBy || '-',
              ...param
            });
          });
        }
      });
    }
    return rows;
  });

  // Pagination calculation
  const totalPages = Math.ceil(flattenedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = flattenedRows.slice(startIndex, endIndex);

  // Resolve the full report by id, or fallback to date+machine match
  const resolveReportByRow = (row) => {
    const byId = allEntries.find(r => r._id === row._id);
    if (byId) return byId;
    try {
      const rowDateKey = row.date ? formatDate(row.date) : '';
      return allEntries.find(r => {
        const repDateKey = r.date ? formatDate(r.date) : '';
        return repDateKey === rowDateKey && String(r.machine) === String(row.machine);
      }) || null;
    } catch {
      return null;
    }
  };

  return (
    <div className="page-wrapper moulding-page-wrapper">
      <div className="impact-report-header">
        <div className="impact-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            DMM Setting Parameters Check Sheet - Report
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div className="impact-filter-group">
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>From Date</label>
          <CustomDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From date" />
        </div>
        <div className="impact-filter-group">
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>To Date</label>
          <CustomDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To date" />
        </div>
        <div className="impact-filter-group">
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Select Machine (Optional)</label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            style={{
              padding: '0.625rem 0.875rem',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="">All Machines</option>
            <option value="1">Machine 1</option>
            <option value="2">Machine 2</option>
            <option value="3">Machine 3</option>
            <option value="4">Machine 4</option>
          </select>
        </div>
        <div className="impact-filter-group">
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Select Shift (Optional)</label>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            style={{
              padding: '0.625rem 0.875rem',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.875rem',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="">All Shifts</option>
            <option value="Shift 1">Shift 1</option>
            <option value="Shift 2">Shift 2</option>
            <option value="Shift 3">Shift 3</option>
          </select>
        </div>
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
        {isAdmin && (
          <DeviationToggleButton
            active={showDeviations}
            onClick={() => setShowDeviations((prev) => !prev)}
          />
        )}
        <ExcelDownloadButton onClick={() => setShowDownloadDialog(true)} disabled={loading || isDownloading} />
        <ExcelDownloadDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          defaultFrom={fromDate}
          defaultTo={toDate}
          loading={isDownloading}
          onConfirm={({ from, to }) => { setShowDownloadDialog(false); handleExcelDownload({ from, to }); }}
        />
      </div>

      {loading ? <div className="impact-loader-container"><div>Loading...</div></div> : (
        <div className="impact-table-container">
          <table className="impact-table">
              <thead>
                <tr>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Machine</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Shift</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Operator Name</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Operated By</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Customer</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Item Description</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Time</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Thickness (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Height (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Thickness (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Height (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Core Mask Thickness (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Core Mask Height Outside (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Core Mask Height Inside (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Sand Shot Pressure (Bar)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Correction Shot Time (s)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Squeeze Pressure (Kg/cm²)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Stripping Accel.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Stripping Dist.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Stripping Accel.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Stripping Dist.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Mould Thickness ±10mm</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Close-Up Force/Pressure</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr><td colSpan="24" className="impact-no-records">{flattenedRows.length === 0 ? 'No parameter rows found' : 'No data on this page'}</td></tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    // Calculate group size for this row
                    const getGroupSize = (startIdx) => {
                      let size = 1;
                      for (let i = startIdx + 1; i < paginatedRows.length; i++) {
                        if (paginatedRows[i].date === row.date && 
                            paginatedRows[i].machine === row.machine && 
                            paginatedRows[i].shift === row.shift) {
                          size++;
                        } else {
                          break;
                        }
                      }
                      return size;
                    };
                    
                    // Check if this row is the first in a group
                    const prevRow = idx > 0 ? paginatedRows[idx - 1] : null;
                    const isFirstInGroup = !prevRow || 
                      row.date !== prevRow.date || 
                      row.machine !== prevRow.machine || 
                      row.shift !== prevRow.shift;
                    
                    // Check if this row is the last in a group
                    const nextRow = idx < paginatedRows.length - 1 ? paginatedRows[idx + 1] : null;
                    const isLastInGroup = !nextRow || 
                      row.date !== nextRow.date || 
                      row.machine !== nextRow.machine || 
                      row.shift !== nextRow.shift;
                    
                    const groupSize = isFirstInGroup ? getGroupSize(idx) : 0;
                    
                    // Generate unique group identifier for hover effects
                    const groupId = `${row.date}-${row.machine}-${row.shift}`.replace(/[^a-zA-Z0-9]/g, '-');
                    
                    return (
                      <tr key={row._id + '-' + idx} 
                          className={`group-row group-${groupId}`}
                          style={{ 
                            transition: 'background-color 0.2s ease',
                            borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none'
                          }}>
                        {isFirstInGroup ? (
                          <td rowSpan={groupSize} style={{ 
                            padding: '12px 18px', 
                            textAlign: 'center', 
                            fontWeight: 500,
                            verticalAlign: 'middle',
                            borderTop: idx > 0 ? '2px solid #e2e8f0' : 'none',
                            borderBottom: '2px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          className={`grouped-cell group-${groupId}-cell`}
                          onMouseEnter={() => {
                            // Highlight all rows in the same group
                            const groupRows = document.querySelectorAll(`.group-${groupId}`);
                            groupRows.forEach(row => row.style.backgroundColor = '#e0f2fe');
                          }}
                          onMouseLeave={() => {
                            // Remove highlight from all rows in the same group
                            const groupRows = document.querySelectorAll(`.group-${groupId}`);
                            groupRows.forEach(row => row.style.backgroundColor = '');
                          }}>
                            {row.date ? (() => {
                              const date = new Date(row.date);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${day} / ${month} / ${year}`;
                            })() : '-'}
                          </td>
                        ) : null}
                        
                        {isFirstInGroup ? (
                          <td rowSpan={groupSize} style={{ 
                            padding: '12px 18px', 
                            textAlign: 'center', 
                            fontWeight: 500,
                            verticalAlign: 'middle',
                            borderTop: idx > 0 ? '2px solid #e2e8f0' : 'none',
                            borderBottom: '2px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          className={`grouped-cell group-${groupId}-cell`}
                          onMouseEnter={() => {
                            // Highlight all rows in the same group
                            const groupRows = document.querySelectorAll(`.group-${groupId}`);
                            groupRows.forEach(row => row.style.backgroundColor = '#e0f2fe');
                          }}
                          onMouseLeave={() => {
                            // Remove highlight from all rows in the same group
                            const groupRows = document.querySelectorAll(`.group-${groupId}`);
                            groupRows.forEach(row => row.style.backgroundColor = '');
                          }}>
                            {row.machine || '-'}
                          </td>
                        ) : null}
                        
                        {isFirstInGroup ? (
                          <td rowSpan={groupSize} style={{ 
                            padding: '12px 18px', 
                            textAlign: 'center', 
                            fontWeight: 500,
                            verticalAlign: 'middle',
                            borderTop: idx > 0 ? '2px solid #e2e8f0' : 'none',
                            borderBottom: '2px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          className={`grouped-cell group-${groupId}-cell`}
                          onMouseEnter={() => {
                            // Highlight all rows in the same group
                            const groupRows = document.querySelectorAll(`.group-${groupId}`);
                            groupRows.forEach(row => row.style.backgroundColor = '#e0f2fe');
                          }}
                          onMouseLeave={() => {
                            // Remove highlight from all rows in the same group
                            const groupRows = document.querySelectorAll(`.group-${groupId}`);
                            groupRows.forEach(row => row.style.backgroundColor = '');
                          }}>
                            {row.shift}
                          </td>
                        ) : null}
                        
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('operatorName', row.operatorName)}>{row.operatorName}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('checkedBy', row.checkedBy)}>{row.checkedBy}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('customer', row.customer)}>{row.customer || '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('itemDescription', row.itemDescription)}>{row.itemDescription || '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('time', row.time)}>{row.time || '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('ppThickness', row.ppThickness)}>{row.ppThickness ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('ppHeight', row.ppHeight)}>{row.ppHeight ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('spThickness', row.spThickness)}>{row.spThickness ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('spHeight', row.spHeight)}>{row.spHeight ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('coreMaskThickness', row.coreMaskThickness)}>{row.coreMaskThickness ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('coreMaskHeightOutside', row.coreMaskHeightOutside)}>{row.coreMaskHeightOutside ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('coreMaskHeightInside', row.coreMaskHeightInside)}>{row.coreMaskHeightInside ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('sandShotPressureBar', row.sandShotPressureBar)}>{row.sandShotPressureBar ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('correctionShotTime', row.correctionShotTime)}>{row.correctionShotTime ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('squeezePressure', row.squeezePressure)}>{row.squeezePressure ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('ppStrippingAcceleration', row.ppStrippingAcceleration)}>{row.ppStrippingAcceleration ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('ppStrippingDistance', row.ppStrippingDistance)}>{row.ppStrippingDistance ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('spStrippingAcceleration', row.spStrippingAcceleration)}>{row.spStrippingAcceleration ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('spStrippingDistance', row.spStrippingDistance)}>{row.spStrippingDistance ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('mouldThicknessPlus10', row.mouldThicknessPlus10)}>{row.mouldThicknessPlus10 ?? '-'}</td>
                        <td style={{ 
                          padding: '12px 18px', 
                          textAlign: 'center',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.target.closest('tr').style.backgroundColor = '';
                        }} className={devClass('closeUpForceMouldCloseUpPressure', row.closeUpForceMouldCloseUpPressure)}>{row.closeUpForceMouldCloseUpPressure || '-'}</td>
                        <td style={{ 
                          cursor: row.remarks ? 'pointer' : 'default',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          padding: '12px 18px',
                          textAlign: 'center',
                          color: row.remarks ? '#5B9AA9' : '#94a3b8',
                          textDecoration: row.remarks ? 'underline' : 'none',
                          borderTop: isFirstInGroup && idx > 0 ? '2px solid #e2e8f0' : 'none',
                          borderBottom: isLastInGroup ? '2px solid #e2e8f0' : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                          onClick={() => row.remarks && showRemarksPopup(row.remarks)}
                          onMouseEnter={(e) => {
                            e.target.closest('tr').style.backgroundColor = '#e0f2fe';
                          }}
                          onMouseLeave={(e) => {
                            e.target.closest('tr').style.backgroundColor = '';
                          }}
                          title={row.remarks || 'No remarks'}>
                          {row.remarks || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>
      )}

      {!loading && flattenedRows.length > 0 && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Remarks Modal */}
      {remarksModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={closeRemarksModal}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{remarksModal.title}</h3>
              <button onClick={closeRemarksModal} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0',
                color: '#64748b'
              }}>&times;</button>
            </div>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#334155' }}>{remarksModal.content}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default DmmSettingParametersReport;