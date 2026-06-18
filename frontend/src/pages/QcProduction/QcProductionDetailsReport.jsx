import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Table from '../../Components/Table';
import { API_ENDPOINTS } from '../../config/api';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { ExcelDownloadModal, toast } from '../../Components/Alert';
import EntryActions from '../../Components/EntryActions';
import { qcProductionEditConfig } from '../../utils/editFieldConfigs';
import '../../styles/PageStyles/QcProduction/QcProductionDetailsReport.css';

const QcProductionDetailsReport = () => {
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
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);

  const itemsPerPage = 15;

  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

  const computeFiltered = (entries) => {
    const toDateStr = toDate;
    const fromDateStr = fromDate || '';
    return entries.filter(r => {
      if (!r.date) return false;
      const reportDate = formatDateLocal(r.date);
      if (fromDateStr) {
        return reportDate >= fromDateStr && reportDate <= toDateStr;
      }
      return reportDate === toDateStr;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.qcReports, { credentials: 'include' });
      const data = await response.json();

      let serverItems = [];
      if (data.success) serverItems = data.data || [];

      let localItems = [];
      try {
        const localRaw = localStorage.getItem('qcProductionLocalEntries');
        localItems = localRaw ? JSON.parse(localRaw) : [];
      } catch (e) {
      }

      const combined = [...serverItems, ...localItems];
      setAllEntries(combined);
      setFilteredEntries(computeFiltered(combined));
    } catch (error) {
      toast.error('Failed to load QC production data. Please refresh.');
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

    const filtered = allEntries.filter(r => {
      if (!r.date) return false;
      const reportDate = formatDateLocal(r.date);
      if (fromDateStr) {
        return reportDate >= fromDateStr && reportDate <= toDateStr;
      }
      return reportDate === toDateStr;
    });

    setFilteredEntries(filtered);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFromDate('');
    setToDate(todayStr);

    const todayFiltered = allEntries.filter(r => {
      if (!r.date) return false;
      return formatDateLocal(r.date) === todayStr;
    });
    setFilteredEntries(todayFiltered);
    setCurrentPage(1);
  };

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredEntries]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

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

  // Normalise a "min - max" string (max of 0/blank collapses to a single value).
  // Defensive against non-string input so a stray number/array never crashes the table.
  const formatRangeDisplay = (rangeStr) => {
    if (rangeStr === null || rangeStr === undefined || rangeStr === '') return '-';
    const trimmed = String(rangeStr).trim();
    if (trimmed === '') return '-';

    if (trimmed.includes('-')) {
      const parts = trimmed.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const min = parts[0];
        const max = parts[1];
        if (max === '0' || max === '0.0' || max === '') {
          return min;
        }
        return `${min} - ${max}`;
      }
    }

    return trimmed;
  };

  // Build a display string from the model's flat From/To pair (To of 0/blank = single value).
  const formatFromTo = (from, to) => {
    if (from === null || from === undefined || from === '') return '-';
    return Number(to) ? `${from} - ${to}` : `${from}`;
  };

  // ts/ys/el are stored as arrays (ts: numbers, ys/el: range strings).
  const formatList = (arr, fmt) => {
    if (!Array.isArray(arr) || arr.length === 0) return '-';
    return arr.map(fmt).join(', ');
  };

  const tableColumns = [
    { key: 'date', label: 'Date', width: '130px', xlsWidth: 16, align: 'center', render: (item) => formatDateDisplay(item.date) },
    { key: 'partName', label: 'Part Name', width: '180px', xlsWidth: 22, align: 'center' },
    { key: 'noOfMoulds', label: 'No.Of Moulds', width: '130px', xlsWidth: 14, align: 'center' },
    { key: 'cPercent', label: 'C %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.cPercentFrom, item.cPercentTo) },
    { key: 'siPercent', label: 'Si %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.siPercentFrom, item.siPercentTo) },
    { key: 'mnPercent', label: 'Mn %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.mnPercentFrom, item.mnPercentTo) },
    { key: 'pPercent', label: 'P %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.pPercentFrom, item.pPercentTo) },
    { key: 'sPercent', label: 'S %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.sPercentFrom, item.sPercentTo) },
    { key: 'mgPercent', label: 'Mg %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.mgPercentFrom, item.mgPercentTo) },
    { key: 'cuPercent', label: 'Cu %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.cuPercentFrom, item.cuPercentTo) },
    { key: 'crPercent', label: 'Cr %', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatFromTo(item.crPercentFrom, item.crPercentTo) },
    { key: 'nodularity', label: 'Nodularity', width: '150px', xlsWidth: 14, align: 'center', render: (item) => (item.nodularity ?? '-') },
    { key: 'noduleCount', label: 'Nodule count', width: '120px', xlsWidth: 14, align: 'center', render: (item) => (item.noduleCount ?? '-') },
    { key: 'graphiteType', label: 'Graphite Type', width: '150px', xlsWidth: 16, align: 'center', render: (item) => formatFromTo(item.graphiteTypeFrom, item.graphiteTypeTo) },
    { key: 'pearlite', label: 'Pearlite', width: '120px', xlsWidth: 12, align: 'center', render: (item) => (item.pearlite ?? '-') },
    { key: 'ferrite', label: 'Ferrite', width: '120px', xlsWidth: 12, align: 'center', render: (item) => (item.ferrite ?? '-') },
    { key: 'hardnessBHN', label: 'Hardness BHN', width: '150px', xlsWidth: 16, align: 'center', render: (item) => formatFromTo(item.hardnessBHNFrom, item.hardnessBHNTo) },
    { key: 'ts', label: 'TS', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatList(item.ts, (v) => `${v}`) },
    { key: 'ys', label: 'YS', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatList(item.ys, formatRangeDisplay) },
    { key: 'el', label: 'EL', width: '130px', xlsWidth: 12, align: 'center', render: (item) => formatList(item.el, formatRangeDisplay) }
  ];

  // Display-only Actions column (not part of the Excel export).
  const actionsColumn = {
    key: 'actions',
    label: 'Actions',
    width: '100px',
    align: 'center',
    render: (item) => (
      <EntryActions entry={item} editConfig={qcProductionEditConfig} onChanged={fetchData} />
    )
  };

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
      const response = await fetch(API_ENDPOINTS.qcReports, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch QC reports');
      const data = await response.json();
      if (!data.success) throw new Error('No data received');

      let localItems = [];
      try {
        const localRaw = localStorage.getItem('qcProductionLocalEntries');
        localItems = localRaw ? JSON.parse(localRaw) : [];
      } catch { localItems = []; }

      const combined = [...(data.data || []), ...localItems];
      const rows = combined
        .filter(r => {
          if (!r.date) return false;
          const rd = formatDateLocal(r.date);
          return rd >= from && rd <= to;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (rows.length === 0) { toast.info('No data to export for the selected range.'); return; }

      const exportColumns = tableColumns.map(c => ({
        header: c.label, key: c.key, width: c.xlsWidth, value: c.render
      }));

      await exportToExcel({
        title: 'QC Production Details Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'QC_Production_Details_Report',
        sheetName: 'QC Production',
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
      <div className="impact-report-header">
        <div className="impact-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            QC Production Details - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {loading ? 'Loading...' : `DATE : ${formatDateDisplay(todayStr)}`}
        </div>
      </div>

      <div className="impact-filter-container">
        <div className="impact-filter-group">
          <label>From Date</label>
          <CustomDatePicker
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From date"
          />
        </div>
        <div className="impact-filter-group">
          <label>To Date</label>
          <CustomDatePicker
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!isFilterEnabled} />
        <ClearButton onClick={handleClear} />
        <ExcelDownloadButton onClick={() => setShowExcelModal(true)} disabled={loading} />
      </div>

      {loading ? (
        <div className="impact-loader-container">
          <div>Loading...</div>
        </div>
      ) : (
        <Table
          columns={[...tableColumns, actionsColumn]}
          data={paginatedEntries}
          minWidth={2400}
          defaultAlign="left"
          groupByColumn="date"
          noDataMessage="No records found"
        />
      )}

      {!loading && sortedEntries.length > itemsPerPage && (
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <ExcelDownloadModal
        open={showExcelModal}
        loading={isDownloading}
        onClose={() => setShowExcelModal(false)}
        onDownload={handleExcelDownload}
        title="Download QC Production Report"
      />
    </>
  );
};

export default QcProductionDetailsReport;