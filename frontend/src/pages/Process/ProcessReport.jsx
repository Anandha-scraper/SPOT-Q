import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, FilterDisaDropdown, CustomPagination, SectionToggles, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { API_ENDPOINTS } from '../../config/api';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { ExcelDownloadModal, toast } from '../../Components/Alert';
import EntryActions from '../../Components/EntryActions';
import { processEditConfig } from '../../utils/editFieldConfigs';
import '../../styles/PageStyles/Process/ProcessReport.css';
import '../../styles/ComponentStyles/Table.css';

const ProcessReport = () => {

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
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [show, setShow] = useState({ metalComposition: true, correctiveAdditions: true });
  const toggle = (key) => setShow(prev => ({ ...prev, [key]: !prev[key] }));
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Remarks' });

  const itemsPerPage = 15;

  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

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
      const response = await fetch(API_ENDPOINTS.process, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch process data');
      const result = await response.json();

      if (result.success && result.data) {
        const validEntries = result.data.filter(entry => entry.disa && entry.disa.trim() !== '');
        setAllEntries(validEntries);
        setFilteredEntries(computeFiltered(validEntries));
      }
    } catch (error) {
      toast.error('Failed to load process data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.disa || '').localeCompare(b.disa || '');
    });
  }, [filteredEntries]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

  const showRemarksPopup = (content, title = 'Remarks') => {
    setRemarksModal({ show: true, content, title });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Remarks' });
  };

  const baseColCount = 22;
  const metalColCount = show.metalComposition ? 8 : 0;
  const correctiveColCount = show.correctiveAdditions ? 7 : 0;
  const totalColCount = baseColCount + metalColCount + correctiveColCount;

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
      const response = await fetch(API_ENDPOINTS.process, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch process data');
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

      const pouringTemp = (r) =>
        r.pouringTemperatureMin && r.pouringTemperatureMax
          ? `${r.pouringTemperatureMin} - ${r.pouringTemperatureMax}`
          : '-';

      const exportColumns = [
        { header: 'Date', key: 'date', width: 11, value: (r) => formatDisplayDate(r.date) },
        { header: 'DISA', key: 'disa', width: 10 },
        { header: 'Part Name', key: 'partName', width: 24 },
        { header: 'Date Code', key: 'datecode', width: 12 },
        { header: 'Heat Code', key: 'heatcode', width: 12 },
        { header: 'Qty of Moulds', key: 'quantityOfMoulds', width: 14 },
        { header: 'C', key: 'metalCompositionC', width: 11, group: 'Metal Composition (%)' },
        { header: 'Si', key: 'metalCompositionSi', width: 11, group: 'Metal Composition (%)' },
        { header: 'Mn', key: 'metalCompositionMn', width: 11, group: 'Metal Composition (%)' },
        { header: 'P', key: 'metalCompositionP', width: 11, group: 'Metal Composition (%)' },
        { header: 'S', key: 'metalCompositionS', width: 11, group: 'Metal Composition (%)' },
        { header: 'Mg FL', key: 'metalCompositionMgFL', width: 13, group: 'Metal Composition (%)' },
        { header: 'Cu', key: 'metalCompositionCu', width: 11, group: 'Metal Composition (%)' },
        { header: 'Cr', key: 'metalCompositionCr', width: 11, group: 'Metal Composition (%)' },
        { header: 'Pouring Temp', key: 'pouringTemp', width: 16, value: pouringTemp },
        { header: 'Time of Pouring', key: 'timeOfPouring', width: 18 },
        { header: 'PP Code', key: 'ppCode', width: 12 },
        { header: 'Treatment No', key: 'treatmentNo', width: 13 },
        { header: 'FC No', key: 'fcNo', width: 10 },
        { header: 'Heat No', key: 'heatNo', width: 12 },
        { header: 'Con No', key: 'conNo', width: 10 },
        { header: 'C', key: 'correctiveAdditionC', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'Si', key: 'correctiveAdditionSi', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'Mn', key: 'correctiveAdditionMn', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'S', key: 'correctiveAdditionS', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'Cr', key: 'correctiveAdditionCr', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'Cu', key: 'correctiveAdditionCu', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'Sn', key: 'correctiveAdditionSn', width: 10, group: 'Corrective Additions (Kgs)' },
        { header: 'Tapping Wt', key: 'tappingWt', width: 12 },
        { header: 'Tapping Time', key: 'tappingTime', width: 13 },
        { header: 'Mg', key: 'mg', width: 10 },
        { header: 'Res Mg Convertor', key: 'resMgConvertor', width: 16 },
        { header: 'Rec of Mg', key: 'recOfMg', width: 12 },
        { header: 'Stream Inoculant', key: 'streamInoculant', width: 16 },
        { header: 'P Time', key: 'pTime', width: 10 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      await exportToExcel({
        title: 'Process Control Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Process_Control_Report',
        sheetName: 'Process',
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
      <div className="process-report-header">
        <div className="process-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Report
          </h2>
        </div>
      </div>

      {}
      <div className="process-report-filter-wrapper">
        <div className="process-filter-group">
          <label className="process-report-filter-label">From Date</label>
          <CustomDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From date" />
        </div>
        <div className="process-filter-group">
          <label className="process-report-filter-label">To Date</label>
          <CustomDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To date" />
        </div>
        <div className="process-filter-group">
          <label className="process-report-filter-label">DISA (Optional)</label>
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

      {}
      <SectionToggles
        sections={[
          { key: 'metalComposition', label: 'Metal Composition (%)' },
          { key: 'correctiveAdditions', label: 'Corrective Additions (Kgs)' }
        ]}
        show={show}
        onToggle={toggle}
        onClear={() => setShow({ metalComposition: false, correctiveAdditions: false })}
      />

      {}
      {loading ? (
        <div className="process-loader-container"><div>Loading...</div></div>
      ) : (
        <div className="reusable-table-container">
          <table className="reusable-table" style={{ tableLayout: 'auto', minWidth: '100%' }}>
            <thead>
              {}
              <tr>
                <th rowSpan={2} style={{ minWidth: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>DISA</th>
                <th rowSpan={2} style={{ minWidth: '200px', textAlign: 'center', whiteSpace: 'nowrap' }}>Part Name</th>
                <th rowSpan={2} style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Date Code</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Heat Code</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Qty of Moulds</th>
                {show.metalComposition && <th colSpan={8} style={{ textAlign: 'center' }}>Metal Composition (%)</th>}
                <th rowSpan={2} style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Pouring Temp</th>
                <th rowSpan={2} style={{ minWidth: '200px', textAlign: 'center', whiteSpace: 'nowrap' }}>Time of Pouring</th>
                <th rowSpan={2} style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>PP Code</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Treatment No</th>
                <th rowSpan={2} style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>FC No</th>
                <th rowSpan={2} style={{ minWidth: '80px', textAlign: 'center', whiteSpace: 'nowrap' }}>Heat No</th>
                <th rowSpan={2} style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>Con No</th>
                {show.correctiveAdditions && <th colSpan={7} style={{ textAlign: 'center' }}>Corrective Additions (Kgs)</th>}
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tapping Wt</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tapping Time</th>
                <th rowSpan={2} style={{ minWidth: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>Mg</th>
                <th rowSpan={2} style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Res Mg Convertor</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Rec of Mg</th>
                <th rowSpan={2} style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>Stream Inoculant</th>
                <th rowSpan={2} style={{ minWidth: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>P Time</th>
                <th rowSpan={2} style={{ minWidth: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>Remarks</th>
                <th rowSpan={2} style={{ minWidth: '90px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
              {}
              <tr>
                {show.metalComposition && (
                  <>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>C</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Si</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Mn</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>P</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>S</th>
                    <th style={{ minWidth: '90px', textAlign: 'center' }}>Mg FL</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Cu</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Cr</th>
                  </>
                )}
                {show.correctiveAdditions && (
                  <>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>C</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Si</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Mn</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>S</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Cr</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Cu</th>
                    <th style={{ minWidth: '60px', textAlign: 'center' }}>Sn</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={totalColCount + 1} className="reusable-table-no-records">No records found</td>
                </tr>
              ) : (
                paginatedEntries.map((item, idx) => {
                  const isDateGroupStart = dateGroups[idx];
                  const itemDate = formatDateLocal(item.date);

                  const prevItem = idx > 0 ? paginatedEntries[idx - 1] : null;
                  const nextItem = idx < paginatedEntries.length - 1 ? paginatedEntries[idx + 1] : null;
                  const isFirstInGroup = !prevItem || formatDateLocal(prevItem.date) !== itemDate;
                  const isLastInGroup = !nextItem || formatDateLocal(nextItem.date) !== itemDate;
                  const isDisaGroupStart = disaGroups[idx];

                  return (
                    <tr
                      key={item._id || idx}
                      className={`process-report-data-row${isFirstInGroup && idx > 0 ? ' group-first' : ''}`}
                    >
                      {isDateGroupStart ? (
                        <td
                          rowSpan={isDateGroupStart.rowspan}
                          className={`process-report-date-cell${idx > 0 ? ' border-top' : ''}`}
                        >
                          {formatDisplayDate(item.date)}
                        </td>
                      ) : null}
                      {isDisaGroupStart ? (
                        <td
                          rowSpan={isDisaGroupStart.rowspan}
                          className="process-report-disa-cell"
                        >
                          {item.disa || '-'}
                        </td>
                      ) : null}
                      <td>{item.partName || '-'}</td>
                      <td>{item.datecode || '-'}</td>
                      <td>{item.heatcode || '-'}</td>
                      <td>{item.quantityOfMoulds || '-'}</td>
                      {show.metalComposition && (
                        <>
                          <td>{item.metalCompositionC || '-'}</td>
                          <td>{item.metalCompositionSi || '-'}</td>
                          <td>{item.metalCompositionMn || '-'}</td>
                          <td>{item.metalCompositionP || '-'}</td>
                          <td>{item.metalCompositionS || '-'}</td>
                          <td>{item.metalCompositionMgFL || '-'}</td>
                          <td>{item.metalCompositionCu || '-'}</td>
                          <td>{item.metalCompositionCr || '-'}</td>
                        </>
                      )}
                      <td>
                        {item.pouringTemperatureMin && item.pouringTemperatureMax
                          ? `${item.pouringTemperatureMin} - ${item.pouringTemperatureMax}`
                          : '-'}
                      </td>
                      <td>{item.timeOfPouring || '-'}</td>
                      <td>{item.ppCode || '-'}</td>
                      <td>{item.treatmentNo || '-'}</td>
                      <td>{item.fcNo || '-'}</td>
                      <td>{item.heatNo || '-'}</td>
                      <td>{item.conNo || '-'}</td>
                      {show.correctiveAdditions && (
                        <>
                          <td>{item.correctiveAdditionC || '-'}</td>
                          <td>{item.correctiveAdditionSi || '-'}</td>
                          <td>{item.correctiveAdditionMn || '-'}</td>
                          <td>{item.correctiveAdditionS || '-'}</td>
                          <td>{item.correctiveAdditionCr || '-'}</td>
                          <td>{item.correctiveAdditionCu || '-'}</td>
                          <td>{item.correctiveAdditionSn || '-'}</td>
                        </>
                      )}
                      <td>{item.tappingWt || '-'}</td>
                      <td>{item.tappingTime || '-'}</td>
                      <td>{item.mg || '-'}</td>
                      <td>{item.resMgConvertor || '-'}</td>
                      <td>{item.recOfMg || '-'}</td>
                      <td>{item.streamInoculant || '-'}</td>
                      <td>{item.pTime || '-'}</td>
                      <td
                        className={`process-report-remarks-cell ${item.remarks ? 'clickable' : 'empty'}`}
                        onClick={() => item.remarks && showRemarksPopup(item.remarks)}
                        title={item.remarks || 'No remarks'}
                      >
                        {item.remarks || '-'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <EntryActions entry={item} editConfig={processEditConfig} onChanged={fetchData} />
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
        <div className="process-report-modal-overlay" onClick={closeRemarksModal}>
          <div className="process-report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="process-report-modal-header">
              <h3 className="process-report-modal-title">{remarksModal.title}</h3>
              <button onClick={closeRemarksModal} className="process-report-modal-close">&times;</button>
            </div>
            <p className="process-report-modal-text">{remarksModal.content}</p>
          </div>
        </div>
      )}

      <ExcelDownloadModal
        open={showExcelModal}
        loading={isDownloading}
        onClose={() => setShowExcelModal(false)}
        onDownload={handleExcelDownload}
        title="Download Process Control Report"
      />
    </>
  );
};

export default ProcessReport;
