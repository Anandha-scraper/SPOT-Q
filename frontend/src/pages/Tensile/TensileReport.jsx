import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Table from '../../Components/Table';
import { API_ENDPOINTS } from '../../config/api';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import EntryActions from '../../Components/EntryActions';
import { tensileEditConfig } from '../../utils/editFieldConfigs';
import '../../styles/PageStyles/Tensile/TensileReport.css';

const TensileReport = () => {
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

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const isoDate = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = isoDate.split('-');
      return `${d} / ${m} / ${y}`;
    } catch {
      return dateStr;
    }
  };

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(todayStr);
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const itemsPerPage = 15;

  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

  const computeFiltered = (entries) => {
    const toDateStr = toDate;
    const fromDateStr = fromDate || '';
    return entries.filter(r => {
      const d = r.date;
      if (!d) return false;
      const reportDate = formatDateLocal(d);
      if (fromDateStr) {
        return reportDate >= fromDateStr && reportDate <= toDateStr;
      }
      return reportDate === toDateStr;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.tensile, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tensile data');
      const result = await response.json();

      if (result.success && result.data) {
        setAllEntries(result.data);
        setFilteredEntries(computeFiltered(result.data));
      }
    } catch (error) {
      alert('Failed to load tensile data. Please refresh.');
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
      const d = r.date;
      if (!d) return false;
      const reportDate = formatDateLocal(d);
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
      const d = r.date;
      if (!d) return false;
      return formatDateLocal(d) === todayStr;
    });
    setFilteredEntries(todayFiltered);
    setCurrentPage(1);
  };

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db - da;
    });
  }, [filteredEntries]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

  const tableColumns = [
    {
      key: 'date',
      label: 'Date of Inspection',
      width: '140px',
      xlsWidth: 18,
      bold: true,
      align: 'center',
      render: (item) => {
        const dateToUse = item.date;
        if (!dateToUse) return '-';
        const dateStr = typeof dateToUse === 'string' ? dateToUse : dateToUse.toString();
        const isoDate = dateStr.split('T')[0];
        return formatDateDisplay(isoDate);
      }
    },
    { key: 'item', label: 'Item', width: '200px', xlsWidth: 24, align: 'center' },
    { key: 'dateCode', label: 'Date Code', width: '120px', xlsWidth: 14, align: 'center' },
    { key: 'heatCode', label: 'Heat Code', width: '120px', xlsWidth: 14, align: 'center' },
    { key: 'dia', label: 'Dia (mm)', width: '100px', xlsWidth: 12, align: 'center' },
    { key: 'lo', label: 'Lo (mm)', width: '100px', xlsWidth: 12, align: 'center' },
    { key: 'li', label: 'Li (mm)', width: '100px', xlsWidth: 12, align: 'center' },
    { key: 'breakingLoad', label: 'Breaking Load (kN)', width: '160px', xlsWidth: 18, align: 'center' },
    { key: 'yieldLoad', label: 'Yield Load (kN)', width: '140px', xlsWidth: 16, align: 'center' },
    { key: 'uts', label: 'UTS (N/mm²)', width: '120px', xlsWidth: 14, align: 'center' },
    { key: 'ys', label: 'YS (N/mm²)', width: '120px', xlsWidth: 14, align: 'center' },
    { key: 'elongation', label: 'Elongation (%)', width: '140px', xlsWidth: 16, align: 'center' },
    { key: 'testedBy', label: 'Tested By', width: '140px', xlsWidth: 16, align: 'center' },
    { key: 'remarks', label: 'Remarks', width: '200px', xlsWidth: 24, align: 'center' }
  ];

  // Actions column is display-only (not part of the Excel export columns).
  const actionsColumn = {
    key: 'actions',
    label: 'Actions',
    width: '100px',
    align: 'center',
    render: (item) => (
      <EntryActions entry={item} editConfig={tensileEditConfig} onChanged={fetchData} />
    )
  };

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
      const response = await fetch(API_ENDPOINTS.tensile, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tensile data');
      const result = await response.json();
      if (!result.success || !result.data) throw new Error('No data received');

      const rows = result.data
        .filter(r => {
          if (!r.date) return false;
          const rd = formatDateLocal(r.date);
          return rd >= from && rd <= to;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (rows.length === 0) { alert('No data to export for the selected range.'); return; }

      const exportColumns = tableColumns.map(c => ({
        header: c.label, key: c.key, width: c.xlsWidth, value: c.render
      }));

      await exportToExcel({
        title: 'Tensile Test Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Tensile_Test_Report',
        sheetName: 'Tensile',
      });
    } catch (err) {
      alert('Download failed due to a network/connectivity issue. Please check your connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="tensile-report-header">
        <div className="tensile-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Tensile Test - Report
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
        <ExcelDownloadButton onClick={() => handleExcelDownload({ from: fromDate, to: toDate })} disabled={loading || isDownloading} />
      </div>

      {loading ? (
        <div className="impact-loader-container">
          <div>Loading...</div>
        </div>
      ) : (
        <Table
          columns={[...tableColumns, actionsColumn]}
          data={paginatedEntries}
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
    </>
  );
};

export default TensileReport;