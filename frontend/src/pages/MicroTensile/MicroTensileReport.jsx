import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, FilterDisaDropdown, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { API_ENDPOINTS } from '../../config/api';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import EntryActions from '../../Components/EntryActions';
import { microTensileEditConfig } from '../../utils/editFieldConfigs';
import '../../styles/PageStyles/MicroTensile/MicroTensileReport.css';
import '../../styles/ComponentStyles/Table.css';

const MicroTensileReport = () => {

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

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(todayStr);
  const [selectedDisa, setSelectedDisa] = useState('All');
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Remarks' });

  const itemsPerPage = 15;

  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

  const disaOptions = useMemo(() => {
    return Array.from(new Set(allEntries.map(item => item.disa).filter(Boolean))).sort();
  }, [allEntries]);

  const computeFiltered = (entries) => {
    const toDateStr = toDate;
    const fromDateStr = fromDate || '';
    let filtered = entries.filter(r => {
      const d = r.date || r.dateOfInspection;
      if (!d) return false;
      const reportDate = formatDateLocal(d);
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
      const response = await fetch(API_ENDPOINTS.microTensile, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch micro tensile data');
      const result = await response.json();

      if (result.success && result.data) {
        const validEntries = result.data.filter(entry => entry.disa && entry.disa.trim() !== '');
        setAllEntries(validEntries);
        setFilteredEntries(computeFiltered(validEntries));
      }
    } catch (error) {
      alert('Failed to load micro tensile data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    if (!toDate) { setFilteredEntries([]); return; }

    const toDateStr = toDate;
    const fromDateStr = fromDate || '';

    let filtered = allEntries.filter(r => {
      const d = r.date || r.dateOfInspection;
      if (!d) return false;
      const reportDate = formatDateLocal(d);
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

  const handleClear = () => {
    setFromDate('');
    setToDate(todayStr);
    setSelectedDisa('All');
    const todayFiltered = allEntries.filter(r => {
      const d = r.date || r.dateOfInspection;
      if (!d) return false;
      return formatDateLocal(d) === todayStr;
    });
    setFilteredEntries(todayFiltered);
    setCurrentPage(1);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${date.getFullYear()}`;
  };

  const renderItem = (r) => {
    if (!r.item) return '-';
    if (typeof r.item === 'string') return r.item;
    if (typeof r.item === 'object') {
      const it1 = r.item.it1 || '';
      const it2 = r.item.it2 || '';
      return `${it1}${it2 ? ' ' + it2 : ''}`.trim() || '-';
    }
    return String(r.item);
  };

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const da = new Date(a.date || a.dateOfInspection);
      const db = new Date(b.date || b.dateOfInspection);
      const dateCompare = db - da;
      if (dateCompare !== 0) return dateCompare;
      return (a.disa || '').localeCompare(b.disa || '');
    });
  }, [filteredEntries]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

  const showRemarksPopup = (content) => {
    setRemarksModal({ show: true, content, title: 'Remarks' });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Remarks' });
  };

  const getDateGroups = () => {
    const groups = {};
    let currentDate = null;
    let groupStartIdx = 0;
    paginatedEntries.forEach((item, idx) => {
      const itemDate = formatDateLocal(item.date || item.dateOfInspection);
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

  const getDisaGroups = () => {
    const groups = {};
    let currentKey = null;
    let groupStartIdx = 0;
    paginatedEntries.forEach((item, idx) => {
      const key = `${formatDateLocal(item.date || item.dateOfInspection)}|${item.disa || ''}`;
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

  const dateGroups = getDateGroups();
  const disaGroups = getDisaGroups();

  const handleExcelDownload = async ({ from: rawFrom, to: rawTo }) => {
    const { from, to } = getExportRange(rawFrom, rawTo);
    const dayDiff = Math.round((new Date(to) - new Date(from)) / 86400000);
    if (dayDiff > MAX_EXPORT_DAYS) {
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(API_ENDPOINTS.microTensile, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch micro tensile data');
      const result = await response.json();
      if (!result.success || !result.data) throw new Error('No data received');

      let rows = result.data.filter(r => {
        const d = r.date || r.dateOfInspection;
        if (!d) return false;
        const rd = formatDateLocal(d);
        return rd >= from && rd <= to;
      });
      if (selectedDisa && selectedDisa !== 'All') {
        rows = rows.filter(r => r.disa === selectedDisa);
      }
      rows.sort((a, b) => {
        const dateCompare = new Date(b.date || b.dateOfInspection) - new Date(a.date || a.dateOfInspection);
        if (dateCompare !== 0) return dateCompare;
        return (a.disa || '').localeCompare(b.disa || '');
      });


      const exportColumns = [
        { header: 'Date', key: 'date', width: 16, value: (r) => formatDisplayDate(r.date || r.dateOfInspection) },
        { header: 'DISA', key: 'disa', width: 10 },
        { header: 'Item', key: 'item', width: 22, value: (r) => renderItem(r) },
        { header: 'Date Code', key: 'dateCode', width: 14 },
        { header: 'Heat Code', key: 'heatCode', width: 14 },
        { header: 'Bar Dia (mm)', key: 'barDia', width: 14 },
        { header: 'Gauge Length (mm)', key: 'gaugeLength', width: 20 },
        { header: 'Max Load', key: 'maxLoad', width: 14 },
        { header: 'Yield Load', key: 'yieldLoad', width: 14 },
        { header: 'Tensile Strength', key: 'tensileStrength', width: 18 },
        { header: 'Yield Strength', key: 'yieldStrength', width: 18 },
        { header: 'Elongation (%)', key: 'elongation', width: 14 },
        { header: 'Tested By', key: 'testedBy', width: 10 },
        { header: 'Remarks', key: 'remarks', width: 10 },
      ];

      await exportToExcel({
        title: 'Micro Tensile Test Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Micro_Tensile_Test_Report',
        sheetName: 'Micro Tensile',
      });
    } catch (err) {
      alert('Download failed due to a network/connectivity issue. Please check your connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="microtensile-report-header">
        <div className="microtensile-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Micro Tensile Test - Report
          </h2>
        </div>
      </div>

      {}
      <div className="microtensile-filter-container">
        <div className="microtensile-filter-group">
          <label className="microtensile-report-filter-label">From Date</label>
          <CustomDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From date" />
        </div>
        <div className="microtensile-filter-group">
          <label className="microtensile-report-filter-label">To Date</label>
          <CustomDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To date" />
        </div>
        <div className="microtensile-filter-group">
          <label className="microtensile-report-filter-label">DISA (Optional)</label>
          <FilterDisaDropdown
            value={selectedDisa}
            onChange={(e) => setSelectedDisa(e.target.value)}
            options={disaOptions}
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
        <ExcelDownloadButton onClick={() => handleExcelDownload({ from: fromDate, to: toDate })} disabled={loading || isDownloading} />
      </div>

      {}
      {loading ? (
        <div className="microtensile-loader-container"><div>Loading...</div></div>
      ) : (
        <div className="reusable-table-container">
          <table className="reusable-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>DISA</th>
                <th style={{ minWidth: '180px', textAlign: 'center', whiteSpace: 'nowrap' }}>Item</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date Code</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Heat Code</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Bar Dia (mm)</th>
                <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Gauge Length (mm)</th>
                <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Max Load</th>
                <th style={{ minWidth: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>Yield Load</th>
                <th style={{ minWidth: '160px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tensile Strength</th>
                <th style={{ minWidth: '160px', textAlign: 'center', whiteSpace: 'nowrap' }}>Yield Strength</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Elongation (%)</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tested By</th>
                <th style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Remarks</th>
                <th style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={15} className="reusable-table-no-records">No records found</td>
                </tr>
              ) : (
                paginatedEntries.map((item, idx) => {
                  const itemDate = formatDateLocal(item.date || item.dateOfInspection);
                  const prevItem = idx > 0 ? paginatedEntries[idx - 1] : null;
                  const isFirstInGroup = !prevItem || formatDateLocal(prevItem.date || prevItem.dateOfInspection) !== itemDate;
                  const isDateGroupStart = dateGroups[idx];
                  const isDisaGroupStart = disaGroups[idx];

                  return (
                    <tr
                      key={item._id || idx}
                      className={`mt-report-data-row${isFirstInGroup && idx > 0 ? ' group-first' : ''}`}
                    >
                      {isDateGroupStart ? (
                        <td
                          rowSpan={isDateGroupStart.rowspan}
                          className={`mt-report-date-cell${idx > 0 ? ' border-top' : ''}`}
                        >
                          {formatDisplayDate(item.date || item.dateOfInspection)}
                        </td>
                      ) : null}
                      {isDisaGroupStart ? (
                        <td
                          rowSpan={isDisaGroupStart.rowspan}
                          className="mt-report-disa-cell"
                        >
                          {item.disa || '-'}
                        </td>
                      ) : null}
                      <td>{renderItem(item)}</td>
                      <td>{item.dateCode || '-'}</td>
                      <td>{item.heatCode || '-'}</td>
                      <td>{item.barDia ?? '-'}</td>
                      <td>{item.gaugeLength ?? '-'}</td>
                      <td>{item.maxLoad ?? '-'}</td>
                      <td>{item.yieldLoad ?? '-'}</td>
                      <td>{item.tensileStrength ?? '-'}</td>
                      <td>{item.yieldStrength ?? '-'}</td>
                      <td>{item.elongation ?? '-'}</td>
                      <td>{item.testedBy || '-'}</td>
                      <td
                        className={`mt-report-remarks-cell ${item.remarks ? 'clickable' : 'empty'}`}
                        onClick={() => item.remarks && showRemarksPopup(item.remarks)}
                        title={item.remarks || 'No remarks'}
                      >
                        {item.remarks || '-'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <EntryActions entry={item} editConfig={microTensileEditConfig} onChanged={fetchData} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {}
      {!loading && sortedEntries.length > itemsPerPage && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {}
      {remarksModal.show && (
        <div className="mt-report-modal-overlay" onClick={closeRemarksModal}>
          <div className="mt-report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mt-report-modal-header">
              <h3 className="mt-report-modal-title">{remarksModal.title}</h3>
              <button onClick={closeRemarksModal} className="mt-report-modal-close">&times;</button>
            </div>
            <p className="mt-report-modal-text">{remarksModal.content}</p>
          </div>
        </div>
      )}

    </>
  );
};

export default MicroTensileReport;
