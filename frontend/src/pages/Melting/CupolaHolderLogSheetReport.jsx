import React, { useEffect, useState, useMemo } from 'react';
import { BookOpenCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterButton, ClearButton, DeviationToggleButton, ShiftDropdown, HolderDropdown, ExcelDownloadButton, SectionToggles } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadDialog, useToast } from '../../Components/alert';
import EntryActions from '../../Components/EntryActions';
import { cupolaEditConfig, cupolaPrimaryEditConfig } from '../../utils/editFieldConfigs';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useDeviationClass } from '../../utils/deviationDisplay';
import { validationRanges, keyToRuleField } from '../../deviations/DcupolaHolder';
import '../../styles/ComponentStyles/Table.css';
import '../../styles/PageStyles/Melting/CupolaHolderLogSheetReport.css';

const ITEMS_PER_PAGE = 20;

const todayISO = () => new Date().toISOString().split('T')[0];

const CupolaHolderLogSheetReport = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [showDeviations, setShowDeviations] = useState(false);
  const devClass = useDeviationClass(validationRanges, keyToRuleField, { isAdmin, showDeviations });
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  // Start Date is optional — blank means "just the End Date", which defaults to
  // today and so matches the data loaded on mount.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(todayISO());
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedHolder, setSelectedHolder] = useState('');

  // Section visibility toggles
  const [show, setShow] = useState({
    additions: true,
    tapping: true,
    pouring: true,
    electrical: true,
    remarks: true
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Remark modal
  const [remarkModal, setRemarkModal] = useState({ open: false, text: '' });

  // Excel export
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // Load today's data on mount
  useEffect(() => {
    loadCurrentData();
  }, []);

  const getCurrentDate = () => todayISO();

  const loadCurrentData = async () => {
    const currentDate = getCurrentDate();
    setLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.cupolaLogs}/filter?startDate=${currentDate}&endDate=${currentDate}`,
        { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (data?.success) {
        setEntries(Array.isArray(data.data) ? data.data : []);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // End Date carries the range; a Start Date is only rejected when it post-dates it.
  const isFilterEnabled = Boolean(endDate) && !(startDate && startDate > endDate);

  const loadFilteredData = async () => {
    if (!isFilterEnabled) return;

    const filterEnd = endDate || getCurrentDate();
    const filterStart = startDate || filterEnd;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.cupolaLogs}/filter?startDate=${encodeURIComponent(filterStart)}&endDate=${encodeURIComponent(filterEnd)}`,
        { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (data?.success) {
        let list = Array.isArray(data.data) ? data.data : [];
        // Client-side filtering
        if (selectedShift) list = list.filter(r => r.shift === selectedShift);
        if (selectedHolder) list = list.filter(r => String(r.holderNumber || r.holderno) === selectedHolder);
        setEntries(list);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate(todayISO());
    setSelectedShift('');
    setSelectedHolder('');
    setCurrentPage(1);
    loadCurrentData();
  };

  const toggle = (key) => setShow(prev => ({ ...prev, [key]: !prev[key] }));

  const clearSections = () => setShow({ additions: false, tapping: false, pouring: false, electrical: false, remarks: false });
  const checkAllSections = () => setShow({ additions: true, tapping: true, pouring: true, electrical: true, remarks: true });

  // Format date to DD/MM/YYYY
  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString('en-GB');
  };

  // Format value — show '-' for 0 or empty
  const fmtVal = (v) => (v !== undefined && v !== null && v !== '' && v !== 0) ? v : '-';

  // Column count for no-data row
  const totalCols = useMemo(() => {
    let c = 4; // date, shift, holder, heatNo
    if (show.additions) c += 7;
    if (show.tapping) c += 4;
    if (show.pouring) c += 3;
    if (show.electrical) c += 2;
    if (show.remarks) c += 1;
    return c + 2; // primary + actions
  }, [show]);

  // The API orders entries by date then creation time, so rows of the same
  // primary can interleave; the Primary cell's rowSpan needs them adjacent.
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => {
    const byDate = String(b.date || '').localeCompare(String(a.date || ''));
    if (byDate !== 0) return byDate;
    const byShift = String(a.shift || '').localeCompare(String(b.shift || ''));
    if (byShift !== 0) return byShift;
    return String(a.holderNumber || '').localeCompare(String(b.holderNumber || ''));
  }), [entries]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / ITEMS_PER_PAGE));
  const paginatedData = sortedEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getGroupKey = (row) => `${row.date}-${row.shift}-${row.holderNumber}`;

  // Consecutive runs of one primary within the current page, mirroring MeltingLogSheetReport.
  const groupInfo = useMemo(() => {
    const groups = {};
    let currentKey = null;
    let groupStartIdx = 0;

    paginatedData.forEach((row, idx) => {
      const key = getGroupKey(row);
      if (key !== currentKey) {
        if (currentKey !== null) groups[groupStartIdx] = { rowspan: idx - groupStartIdx };
        currentKey = key;
        groupStartIdx = idx;
      }
      if (idx === paginatedData.length - 1) {
        groups[groupStartIdx] = { rowspan: idx - groupStartIdx + 1 };
      }
    });
    return groups;
  }, [paginatedData]);

  const primaryRowOf = (row) => ({
    _id: row.primaryId ?? row._id,
    date: row.date,
    shift: row.shift,
    holderNumber: row.holderNumber
  });

  // Re-run whichever loader matches the current filter state.
  const refresh = () => (isFilterEnabled ? loadFilteredData() : loadCurrentData());

  const sectionConfig = [
    { key: 'additions', label: 'Additions' },
    { key: 'tapping', label: 'Tapping' },
    { key: 'pouring', label: 'Pouring' },
    { key: 'electrical', label: 'Electrical' },
    { key: 'remarks', label: 'Remarks' }
  ];

  // Styles matching the entry page
  const thStyle = {
    padding: '0.5rem 0.4rem',
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#334155',
    borderBottom: '2px solid #cbd5e1',
    borderRight: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    background: '#f8fafc'
  };

  const groupThStyle = {
    ...thStyle,
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#1e293b',
    background: '#eef4f7',
    letterSpacing: '0.03em',
    borderBottom: '1px solid #cbd5e1'
  };

  const tdStyle = {
    padding: '0.5rem 0.4rem',
    textAlign: 'center',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    fontSize: '0.825rem',
    color: '#475569',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap'
  };

  // Excel export — fetches the modal's date range fresh from the API, applies the
  // currently selected Shift/Holder dropdowns, then builds a grouped .xlsx.
  const handleExcelDownload = async ({ from: rawFrom, to: rawTo }) => {
    const { from, to } = getExportRange(rawFrom, rawTo);
    if (from > to) { toast.error('From date cannot be after To date.'); return; }
    const dayDiff = Math.round((new Date(to) - new Date(from)) / 86400000);
    if (dayDiff > MAX_EXPORT_DAYS) {
      toast.error('Maximum 2 months of data can be downloaded. Please narrow the date range.');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.cupolaLogs}/filter?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`,
        { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error('Failed to fetch cupola data');
      const data = await response.json();
      if (!data?.success) throw new Error('No data received');

      let rows = Array.isArray(data.data) ? data.data : [];
      if (selectedShift) rows = rows.filter(r => r.shift === selectedShift);
      if (selectedHolder) rows = rows.filter(r => String(r.holderNumber || r.holderno) === selectedHolder);

      rows.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.shift || '').localeCompare(b.shift || '');
      });

      if (rows.length === 0) { toast.error('No data to export for the selected range.'); return; }

      const exportColumns = [
        { header: 'Date', key: 'date', width: 14, value: (r) => formatDate(r.date) },
        { header: 'Shift', key: 'shift', width: 10, value: (r) => fmtVal(r.shift) },
        { header: 'Holder No', key: 'holderNumber', width: 11, value: (r) => fmtVal(r.holderNumber || r.holderno) },
        { header: 'Heat No', key: 'heatNo', width: 11, value: (r) => fmtVal(r.heatNo) },
        { header: 'CPC', key: 'cpc', width: 10, group: 'Additions', value: (r) => fmtVal(r.cpc) },
        { header: 'Fe Sl', key: 'FeSl', width: 10, group: 'Additions', value: (r) => fmtVal(r.FeSl ?? r.mFeSl) },
        { header: 'Fe Mn', key: 'feMn', width: 10, group: 'Additions', value: (r) => fmtVal(r.feMn) },
        { header: 'SIC', key: 'sic', width: 10, group: 'Additions', value: (r) => fmtVal(r.sic) },
        { header: 'Pure Mg', key: 'pureMg', width: 10, group: 'Additions', value: (r) => fmtVal(r.pureMg) },
        { header: 'Cu', key: 'cu', width: 10, group: 'Additions', value: (r) => fmtVal(r.cu) },
        { header: 'Fe Cr', key: 'feCr', width: 10, group: 'Additions', value: (r) => fmtVal(r.feCr) },
        { header: 'Actual Time', key: 'actualTime', width: 12, group: 'Tapping', value: (r) => fmtVal(r.actualTime) },
        { header: 'Tapping Time', key: 'tappingTime', width: 12, group: 'Tapping', value: (r) => fmtVal(r.tappingTime) },
        { header: 'Temp °C', key: 'tappingTemp', width: 11, group: 'Tapping', value: (r) => fmtVal(r.tappingTemp) },
        { header: 'Metal (KG)', key: 'metalKg', width: 12, group: 'Tapping', value: (r) => fmtVal(r.metalKg) },
        { header: 'DISA LINE', key: 'disaLine', width: 11, group: 'Pouring', value: (r) => fmtVal(r.disaLine) },
        { header: 'IND FUR', key: 'indFur', width: 11, group: 'Pouring', value: (r) => fmtVal(r.indFur) },
        { header: 'BAIL NO', key: 'bailNo', width: 11, group: 'Pouring', value: (r) => fmtVal(r.bailNo) },
        { header: 'TAP', key: 'tap', width: 10, group: 'Electrical', value: (r) => fmtVal(r.tap) },
        { header: 'KW', key: 'kw', width: 10, group: 'Electrical', value: (r) => fmtVal(r.kw) },
        { header: 'Remarks', key: 'remarks', width: 24, value: (r) => fmtVal(r.remarks) },
      ];

      await exportToExcel({
        title: 'Cupola Holder Log Sheet Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Cupola_Holder_Log_Sheet_Report',
        sheetName: 'Cupola Holder',
      });
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="page-wrapper melting-page-wrapper">
      {/* Header */}
      <div className="cupola-holder-report-header">
        <div className="cupola-holder-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Cupola Holder Log Sheet - Report
          </h2>
        </div>
      </div>

      {/* Filter Section */}
      <div className="cupola-holder-filter-container">
        <div className="cupola-holder-filter-group">
          <label>From Date</label>
          <CustomDatePicker value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="From date" />
        </div>
        <div className="cupola-holder-filter-group">
          <label>End Date</label>
          <CustomDatePicker value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="To date" />
        </div>
        <div className="cupola-holder-filter-group">
          <label>Shift</label>
          <ShiftDropdown value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} />
        </div>
        <div className="cupola-holder-filter-group">
          <label>Holder No</label>
          <HolderDropdown value={selectedHolder} onChange={(e) => setSelectedHolder(e.target.value)} />
        </div>
        <FilterButton onClick={loadFilteredData} disabled={loading || !isFilterEnabled}>
          {loading ? 'Loading...' : 'Filter'}
        </FilterButton>
        <ClearButton onClick={clearFilters}>Clear</ClearButton>
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
          defaultFrom={startDate}
          defaultTo={endDate}
          loading={isDownloading}
          onConfirm={({ from, to }) => { setShowDownloadDialog(false); handleExcelDownload({ from, to }); }}
        />
      </div>

      {/* Section Toggles */}
      <SectionToggles
        sections={sectionConfig}
        show={show}
        onToggle={toggle}
        onSelectAll={checkAllSections}
        onClear={clearSections}
      />

      {/* Data Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
      ) : (
        <div className="chr-primary-table-wrap">
          <div style={{ overflowX: 'auto', border: '1.5px solid #cbd5e1', borderRadius: '10px', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                {/* Group Headers Row */}
                <tr>
                  <th rowSpan={2} style={{ ...groupThStyle, borderLeft: 'none' }}>Date</th>
                  <th rowSpan={2} style={groupThStyle}>Shift</th>
                  <th rowSpan={2} style={groupThStyle}>Holder No</th>
                  <th rowSpan={2} style={groupThStyle}>Heat No</th>
                  {show.additions && <th colSpan={7} style={groupThStyle}>ADDITIONS</th>}
                  {show.tapping && <th colSpan={4} style={groupThStyle}>TAPPING</th>}
                  {show.pouring && <th colSpan={3} style={groupThStyle}>POURING</th>}
                  {show.electrical && <th colSpan={2} style={groupThStyle}>ELECTRICAL</th>}
                  {show.remarks && <th rowSpan={2} style={groupThStyle}>Remarks</th>}
                  <th rowSpan={2} style={groupThStyle}>Primary</th>
                  <th rowSpan={2} style={{ ...groupThStyle, borderRight: 'none' }}>Actions</th>
                </tr>
                {/* Sub Headers Row */}
                {(show.additions || show.tapping || show.pouring || show.electrical) && (
                  <tr>
                    {show.additions && (
                      <>
                        <th style={thStyle}>CPC</th>
                        <th style={thStyle}>Fe Sl</th>
                        <th style={thStyle}>Fe Mn</th>
                        <th style={thStyle}>SIC</th>
                        <th style={thStyle}>Pure Mg</th>
                        <th style={thStyle}>Cu</th>
                        <th style={thStyle}>Fe Cr</th>
                      </>
                    )}
                    {show.tapping && (
                      <>
                        <th style={thStyle}>Actual Time</th>
                        <th style={thStyle}>Tapping Time</th>
                        <th style={thStyle}>Temp °C</th>
                        <th style={thStyle}>Metal (KG)</th>
                      </>
                    )}
                    {show.pouring && (
                      <>
                        <th style={thStyle}>DISA LINE</th>
                        <th style={thStyle}>IND FUR</th>
                        <th style={thStyle}>BAIL NO</th>
                      </>
                    )}
                    {show.electrical && (
                      <>
                        <th style={thStyle}>TAP</th>
                        <th style={thStyle}>KW</th>
                      </>
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={totalCols} style={{ ...tdStyle, borderRight: 'none', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      {entries.length === 0 ? 'No records found. Use the filters above to search.' : 'No data on this page'}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={`${row._id || idx}`} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ ...tdStyle, borderLeft: 'none' }}>{formatDate(row.date)}</td>
                      <td style={tdStyle}>{fmtVal(row.shift)}</td>
                      <td style={tdStyle}>{fmtVal(row.holderNumber || row.holderno)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#0ea5e9' }}>{fmtVal(row.heatNo)}</td>
                      {show.additions && (
                        <>
                          <td className={devClass('cpc', row.cpc)} style={tdStyle}>{fmtVal(row.cpc)}</td>
                          <td className={devClass('mFeSl', row.FeSl ?? row.mFeSl)} style={tdStyle}>{fmtVal(row.FeSl ?? row.mFeSl)}</td>
                          <td className={devClass('feMn', row.feMn)} style={tdStyle}>{fmtVal(row.feMn)}</td>
                          <td className={devClass('sic', row.sic)} style={tdStyle}>{fmtVal(row.sic)}</td>
                          <td className={devClass('pureMg', row.pureMg)} style={tdStyle}>{fmtVal(row.pureMg)}</td>
                          <td className={devClass('cu', row.cu)} style={tdStyle}>{fmtVal(row.cu)}</td>
                          <td className={devClass('feCr', row.feCr)} style={tdStyle}>{fmtVal(row.feCr)}</td>
                        </>
                      )}
                      {show.tapping && (
                        <>
                          <td style={tdStyle}>{fmtVal(row.actualTime)}</td>
                          <td style={tdStyle}>{fmtVal(row.tappingTime)}</td>
                          <td className={devClass('tappingTemp', row.tappingTemp)} style={tdStyle}>{fmtVal(row.tappingTemp)}</td>
                          <td className={devClass('metalKg', row.metalKg)} style={tdStyle}>{fmtVal(row.metalKg)}</td>
                        </>
                      )}
                      {show.pouring && (
                        <>
                          <td style={tdStyle}>{fmtVal(row.disaLine)}</td>
                          <td style={tdStyle}>{fmtVal(row.indFur)}</td>
                          <td style={tdStyle}>{fmtVal(row.bailNo)}</td>
                        </>
                      )}
                      {show.electrical && (
                        <>
                          <td style={tdStyle}>{fmtVal(row.tap)}</td>
                          <td className={devClass('kw', row.kw)} style={tdStyle}>{fmtVal(row.kw)}</td>
                        </>
                      )}
                      {show.remarks && (
                        <td style={tdStyle}>
                          {row.remarks ? (
                            <span
                              onClick={() => setRemarkModal({ open: true, text: row.remarks })}
                              title={row.remarks}
                              style={{ cursor: 'pointer', color: '#0ea5e9', textDecoration: 'underline dotted' }}
                            >
                              {row.remarks.length > 8 ? row.remarks.slice(0, 7) + '..' : row.remarks}
                            </span>
                          ) : '-'}
                        </td>
                      )}
                      {/* Primary — one control per group, spanning its entry rows */}
                      {groupInfo[idx] && (
                        <td rowSpan={groupInfo[idx].rowspan} style={{ ...tdStyle, verticalAlign: 'middle' }}>
                          <EntryActions
                            entry={primaryRowOf(row)}
                            editConfig={cupolaPrimaryEditConfig}
                            onChanged={refresh}
                          />
                        </td>
                      )}
                      {/* Actions — only real entry rows (not primary-only placeholders) */}
                      <td style={{ ...tdStyle, borderRight: 'none' }}>
                        {row.primaryId && (
                          <EntryActions entry={row} editConfig={cupolaEditConfig} onChanged={refresh} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', border: '1px solid #e2e8f0',
              borderRadius: '8px', background: currentPage === 1 ? '#f1f5f9' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? '#94a3b8' : '#334155'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                width: '36px', height: '36px', border: '1px solid',
                borderColor: page === currentPage ? '#0ea5e9' : '#e2e8f0',
                borderRadius: '8px',
                background: page === currentPage ? '#0ea5e9' : '#fff',
                color: page === currentPage ? '#fff' : '#334155',
                fontWeight: page === currentPage ? 700 : 500,
                fontSize: '0.875rem', cursor: 'pointer'
              }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', border: '1px solid #e2e8f0',
              borderRadius: '8px', background: currentPage === totalPages ? '#f1f5f9' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              color: currentPage === totalPages ? '#94a3b8' : '#334155'
            }}
          >
            <ChevronRight size={18} />
          </button>
          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
            {entries.length} record{entries.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Remark Modal */}
      {remarkModal.open && (
        <div
          onClick={() => setRemarkModal({ open: false, text: '' })}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', padding: '1.5rem',
              maxWidth: '420px', width: '90%', boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1e293b' }}>Remarks</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, wordBreak: 'break-word' }}>
              {remarkModal.text}
            </p>
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button
                onClick={() => setRemarkModal({ open: false, text: '' })}
                style={{
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '6px',
                  background: '#0ea5e9', color: '#fff', fontSize: '0.875rem',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CupolaHolderLogSheetReport;
