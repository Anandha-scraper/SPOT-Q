import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, FilterDisaDropdown, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { API_ENDPOINTS } from '../../config/api';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import EntryActions from '../../Components/EntryActions';
import { ExcelDownloadModal, toast } from '../../Components/Alert';
import { microStructureEditConfig } from '../../utils/editFieldConfigs';
import '../../styles/PageStyles/MicroStructure/MicroStructureReport.css';
import '../../styles/ComponentStyles/Table.css';

const MicroStructureReport = () => {

  // ========================================================================
  // FILTER SYSTEM — Reusable pattern for date-range + optional dropdown filter
  // ========================================================================

  // Helper: Convert any date value to 'YYYY-MM-DD' string in local timezone
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(todayStr);
  const [selectedDisa, setSelectedDisa] = useState('All');
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Remarks' });

  const itemsPerPage = 15;

  // FILTER BUTTON ENABLE LOGIC
  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

  // Get unique DISA values
  const disaOptions = useMemo(() => {
    return Array.from(new Set(allEntries.map(item => item.disa).filter(Boolean))).sort();
  }, [allEntries]);

  // Apply the current From/To/DISA filter to a set of entries.
  const computeFiltered = (entries) => {
    const toDateStr = toDate;
    const fromDateStr = fromDate || '';
    let filtered = entries.filter(r => {
      if (!r.date) return false;
      const reportDate = formatDateLocal(r.date);
      if (fromDateStr) {
        return reportDate >= fromDateStr && reportDate <= toDateStr;
      }
      return reportDate === toDateStr;
    });
    if (selectedDisa && selectedDisa !== 'All') {
      filtered = filtered.filter(r => r.disa === selectedDisa);
    }
    return filtered;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = '2020-01-01';
      const endDate = '2030-12-31';
      const response = await fetch(`${API_ENDPOINTS.microStructure}/filter?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch micro structure data');
      const result = await response.json();

      if (result.success && result.data) {
        const validEntries = result.data.filter(entry => entry.disa && entry.disa.trim() !== '');
        setAllEntries(validEntries);
        setFilteredEntries(computeFiltered(validEntries));
      }
    } catch (error) {
      console.error('Error fetching micro structure data:', error);
      toast.error('Failed to load micro structure data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Fetch ALL entries once on mount
  useEffect(() => {
    fetchData();
  }, []);

  // STEP 2: handleFilter — Client-side filtering
  const handleFilter = () => {
    if (!toDate) {
      setFilteredEntries([]);
      return;
    }

    const toDateStr = toDate;
    const fromDateStr = fromDate || '';

    let filtered = allEntries.filter(r => {
      if (!r.date) return false;
      const reportDate = formatDateLocal(r.date);
      if (fromDateStr) {
        return reportDate >= fromDateStr && reportDate <= toDateStr;
      }
      return reportDate === toDateStr;
    });

    if (selectedDisa && selectedDisa !== 'All') {
      filtered = filtered.filter(r => r.disa === selectedDisa);
    }

    setFilteredEntries(filtered);
    setCurrentPage(1);
  };

  // STEP 3: handleClear — Reset all filters to defaults
  const handleClear = () => {
    setFromDate('');
    setToDate(todayStr);
    setSelectedDisa('All');
    const todayFiltered = allEntries.filter(r => {
      if (!r.date) return false;
      return formatDateLocal(r.date) === todayStr;
    });
    setFilteredEntries(todayFiltered);
    setCurrentPage(1);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${date.getFullYear()}`;
  };

  // Helper for range display
  const renderRange = (min, max) => {
    if (min !== undefined && min !== null && max !== undefined && max !== null) {
      return `${min} - ${max}`;
    } else if (min !== undefined && min !== null) {
      return min;
    }
    return '-';
  };

  // Sort entries by date descending, then by disa
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.disa || '').localeCompare(b.disa || '');
    });
  }, [filteredEntries]);

  // Pagination
  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

  const showRemarksPopup = (content, title = 'Remarks') => {
    setRemarksModal({ show: true, content, title });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Remarks' });
  };

  const totalColCount = 14;

  // Group calculation for date rowSpan
  const getGroupInfo = () => {
    const groups = {};
    let currentDate = null;
    let groupStartIdx = 0;

    paginatedEntries.forEach((item, idx) => {
      const itemDate = formatDateLocal(item.date);
      if (itemDate !== currentDate) {
        if (currentDate !== null) {
          groups[groupStartIdx] = { rowspan: idx - groupStartIdx, date: currentDate };
        }
        currentDate = itemDate;
        groupStartIdx = idx;
      }
      if (idx === paginatedEntries.length - 1) {
        groups[groupStartIdx] = { rowspan: idx - groupStartIdx + 1, date: currentDate };
      }
    });
    return groups;
  };

  const dateGroups = getGroupInfo();

  // Group calculation for DISA rowSpan (consecutive same date+disa)
  const getDisaGroupInfo = () => {
    const groups = {};
    let currentKey = null;
    let groupStartIdx = 0;

    paginatedEntries.forEach((item, idx) => {
      const itemDate = formatDateLocal(item.date);
      const itemDisa = item.disa || '';
      const key = `${itemDate}|${itemDisa}`;

      if (key !== currentKey) {
        if (currentKey !== null) {
          groups[groupStartIdx] = { rowspan: idx - groupStartIdx, disa: currentKey.split('|')[1] };
        }
        currentKey = key;
        groupStartIdx = idx;
      }
      if (idx === paginatedEntries.length - 1) {
        groups[groupStartIdx] = { rowspan: idx - groupStartIdx + 1, disa: currentKey.split('|')[1] };
      }
    });
    return groups;
  };

  const disaGroups = getDisaGroupInfo();

  // Excel export — fetch all entries, filter by the chosen range/DISA, then build the sheet.
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
      const response = await fetch(`${API_ENDPOINTS.microStructure}/filter?startDate=2020-01-01&endDate=2030-12-31`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch micro structure data');
      const result = await response.json();
      if (!result.success || !result.data) throw new Error('No data received');

      let rows = result.data.filter(r => {
        if (!r.date) return false;
        const rd = formatDateLocal(r.date);
        return rd >= from && rd <= to;
      });
      if (selectedDisa && selectedDisa !== 'All') {
        rows = rows.filter(r => r.disa === selectedDisa);
      }
      rows.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.disa || '').localeCompare(b.disa || '');
      });

      if (rows.length === 0) { toast.info('No data to export for the selected range.'); return; }

      const exportColumns = [
        { header: 'Date', key: 'date', width: 16, value: (r) => formatDisplayDate(r.date) },
        { header: 'DISA', key: 'disa', width: 10 },
        { header: 'Part Name', key: 'partName', width: 22 },
        { header: 'Date Code', key: 'dateCode', width: 14 },
        { header: 'Heat Code', key: 'heatCode', width: 14 },
        { header: 'Nodularity %', key: 'nodularity', width: 14 },
        { header: 'Graphite Type', key: 'graphiteType', width: 16 },
        { header: 'Count Nos/mm²', key: 'count', width: 16, value: (r) => renderRange(r.countMin, r.countMax) },
        { header: 'Size', key: 'size', width: 12, value: (r) => renderRange(r.sizeMin, r.sizeMax) },
        { header: 'Ferrite %', key: 'ferrite', width: 12, value: (r) => renderRange(r.ferriteMin, r.ferriteMax) },
        { header: 'Pearlite %', key: 'pearlite', width: 14, value: (r) => renderRange(r.pearliteMin, r.pearliteMax) },
        { header: 'Carbide %', key: 'carbide', width: 12, value: (r) => renderRange(r.carbideMin, r.carbideMax) },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      await exportToExcel({
        title: 'Micro Structure Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Micro_Structure_Report',
        sheetName: 'Micro Structure',
      });
      setShowExcelModal(false);
    } catch (err) {
      toast.error('Download failed due to a network/connectivity issue. Please check your connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="micro-report-header">
        <div className="micro-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Micro Structure - Report
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="micro-report-filter-wrapper">
        <div className="micro-filter-group">
          <label className="micro-report-filter-label">From Date</label>
          <CustomDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From date" />
        </div>
        <div className="micro-filter-group">
          <label className="micro-report-filter-label">To Date</label>
          <CustomDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To date" />
        </div>
        <div className="micro-filter-group">
          <label className="micro-report-filter-label">DISA (Optional)</label>
          <FilterDisaDropdown
            value={selectedDisa}
            onChange={(e) => setSelectedDisa(e.target.value)}
            options={disaOptions}
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
        <ExcelDownloadButton onClick={() => setShowExcelModal(true)} disabled={loading} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="micro-loader-container"><div>Loading...</div></div>
      ) : (
        <div className="reusable-table-container">
          <table className="reusable-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>DISA</th>
                <th style={{ minWidth: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>Part Name</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date Code</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Heat Code</th>
                <th style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Nodularity %</th>
                <th style={{ minWidth: '130px', textAlign: 'center', whiteSpace: 'nowrap' }}>Graphite Type %</th>
                <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Count Nos/mm²</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Size</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Ferrite %</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Pearlite %</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Carbide %</th>
                <th style={{ minWidth: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>Remarks</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={totalColCount} className="reusable-table-no-records">No records found</td>
                </tr>
              ) : (
                paginatedEntries.map((item, idx) => {
                  const isDateGroupStart = dateGroups[idx];
                  const itemDate = formatDateLocal(item.date);

                  const prevItem = idx > 0 ? paginatedEntries[idx - 1] : null;
                  const isFirstInGroup = !prevItem || formatDateLocal(prevItem.date) !== itemDate;
                  const isDisaGroupStart = disaGroups[idx];

                  return (
                    <tr
                      key={item._id || idx}
                      className={`micro-report-data-row${isFirstInGroup && idx > 0 ? ' group-first' : ''}`}
                    >
                      {isDateGroupStart ? (
                        <td
                          rowSpan={isDateGroupStart.rowspan}
                          className={`micro-report-date-cell${idx > 0 ? ' border-top' : ''}`}
                        >
                          {formatDisplayDate(item.date)}
                        </td>
                      ) : null}
                      {isDisaGroupStart ? (
                        <td
                          rowSpan={isDisaGroupStart.rowspan}
                          className="micro-report-disa-cell"
                        >
                          {item.disa || '-'}
                        </td>
                      ) : null}
                      <td>{item.partName || '-'}</td>
                      <td>{item.dateCode || '-'}</td>
                      <td>{item.heatCode || '-'}</td>
                      <td>{item.nodularity !== undefined && item.nodularity !== null ? item.nodularity : '-'}</td>
                      <td>{item.graphiteType !== undefined && item.graphiteType !== null ? item.graphiteType : '-'}</td>
                      <td>{renderRange(item.countMin, item.countMax)}</td>
                      <td>{renderRange(item.sizeMin, item.sizeMax)}</td>
                      <td>{renderRange(item.ferriteMin, item.ferriteMax)}</td>
                      <td>{renderRange(item.pearliteMin, item.pearliteMax)}</td>
                      <td>{renderRange(item.carbideMin, item.carbideMax)}</td>
                      <td
                        className={`micro-report-remarks-cell ${item.remarks ? 'clickable' : 'empty'}`}
                        onClick={() => item.remarks && showRemarksPopup(item.remarks)}
                        title={item.remarks || 'No remarks'}
                      >
                        {item.remarks || '-'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <EntryActions entry={item} editConfig={microStructureEditConfig} onChanged={fetchData} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && sortedEntries.length > itemsPerPage && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Remarks Modal */}
      {remarksModal.show && (
        <div className="micro-report-modal-overlay" onClick={closeRemarksModal}>
          <div className="micro-report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="micro-report-modal-header">
              <h3 className="micro-report-modal-title">{remarksModal.title}</h3>
              <button onClick={closeRemarksModal} className="micro-report-modal-close">&times;</button>
            </div>
            <p className="micro-report-modal-text">{remarksModal.content}</p>
          </div>
        </div>
      )}

      <ExcelDownloadModal
        open={showExcelModal}
        loading={isDownloading}
        onClose={() => setShowExcelModal(false)}
        onDownload={handleExcelDownload}
        title="Download Micro Structure Report"
      />
    </>
  );
};

export default MicroStructureReport;
