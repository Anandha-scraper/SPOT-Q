import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, DeviationToggleButton, CustomPagination, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadDialog, useToast } from '../../Components/alert';
import { API_ENDPOINTS } from '../../config/api';
import exportToExcel, { getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import EntryActions from '../../Components/EntryActions';
import { impactEditConfig } from '../../utils/editFieldConfigs';
import { useAuth } from '../../context/AuthContext';
import { isDeviant } from '../../utils/formValidation';
import { validationRanges } from '../../deviations/Dimpact';
import '../../styles/PageStyles/Impact/ImpactReport.css';
import '../../styles/ComponentStyles/Table.css';

const ImpactReport = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [showDeviations, setShowDeviations] = useState(false);
  const ruleByField = useMemo(() => {
    const map = {};
    validationRanges.forEach((r) => { map[r.field] = r; });
    return map;
  }, []);
  const devClass = (fieldName, value) => {
    if (!showDeviations || !isAdmin) return undefined;
    const rule = ruleByField[fieldName];
    return rule && isDeviant(rule, value) ? 'deviation-flag' : undefined;
  };
  // observedValue is stored as a raw CSV string ("12.5, 13.0") — the
  // "Observed Value" rule declares type: 'NumberArray', so each part is
  // checked individually as a plain Number against the same min/max.
  const observedValueDevClass = (value) => {
    if (!showDeviations || !isAdmin) return undefined;
    const rule = ruleByField['Observed Value'];
    if (!rule) return undefined;
    // No value at all is itself checked against the rule's spec — matches
    // isDeviant's "blank on a field with min/max is a deviation" behavior.
    const parts = value ? String(value).split(',').map((v) => v.trim()) : [''];
    return parts.some((v) => isDeviant({ ...rule, type: 'Number' }, v)) ? 'deviation-flag' : undefined;
  };
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
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const itemsPerPage = 15;

  const isFilterEnabled = toDate && toDate.trim() !== '' && !(fromDate && fromDate.trim() !== '' && toDate <= fromDate);

  // Apply the current From/To filter to a set of entries.
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
      const response = await fetch(`${API_ENDPOINTS.impactTests}/filter?startDate=2000-01-01&endDate=2099-12-31`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch impact data');
      const result = await response.json();

      if (result.success && result.data) {
        setAllEntries(result.data);
        setFilteredEntries(computeFiltered(result.data));
      }
    } catch (error) {
      toast.error('Failed to load impact data. Please refresh.');
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

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${date.getFullYear()}`;
  };

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredEntries]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + itemsPerPage);

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
      const response = await fetch(`${API_ENDPOINTS.impactTests}/filter?startDate=2000-01-01&endDate=2099-12-31`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch impact data');
      const result = await response.json();
      if (!result.success || !result.data) throw new Error('No data received');

      const rows = result.data
        .filter(r => {
          if (!r.date) return false;
          const rd = formatDateLocal(r.date);
          return rd >= from && rd <= to;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (rows.length === 0) { toast.error('No data to export for the selected range.'); return; }

      const exportColumns = [
        { header: 'Date', key: 'date', width: 16, value: (r) => formatDisplayDate(r.date) },
        { header: 'Part Name', key: 'partName', width: 24 },
        { header: 'Date Code', key: 'dateCode', width: 14 },
        { header: 'Specification', key: 'specification', width: 28 },
        { header: 'Observed Value', key: 'observedValue', width: 18, value: (r) => (r.observedValue !== undefined && r.observedValue !== null ? r.observedValue : '-') },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      await exportToExcel({
        title: 'Impact Test Report',
        fromDate: from,
        toDate: to,
        columns: exportColumns,
        rows,
        fileName: 'Impact_Test_Report',
        sheetName: 'Impact',
      });
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
            Impact Test - Report
          </h2>
        </div>
      </div>

      {}
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

      {}
      {loading ? (
        <div className="impact-loader-container">
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading...</div>
        </div>
      ) : (
        <div className="reusable-table-container">
          <table className="reusable-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ width: '20%', textAlign: 'center', whiteSpace: 'nowrap' }}>Part Name</th>
                <th style={{ width: '10%', textAlign: 'center', whiteSpace: 'nowrap' }}>Date Code</th>
                <th style={{ width: '25%', textAlign: 'center', whiteSpace: 'nowrap' }}>Specification</th>
                <th style={{ width: '20%', textAlign: 'center', whiteSpace: 'nowrap' }}>Observed Value</th>
                <th style={{ width: '15%', textAlign: 'center', whiteSpace: 'nowrap' }}>Remarks</th>
                <th style={{ width: '10%', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="reusable-table-no-records">No records found</td>
                </tr>
              ) : (
                paginatedEntries.map((item, idx) => {
                  const isDateGroupStart = dateGroups[idx];

                  return (
                    <tr key={item._id || idx}>
                      {isDateGroupStart ? (
                        <td
                          rowSpan={isDateGroupStart.rowspan}
                          style={{ textAlign: 'center', verticalAlign: 'middle' }}
                        >
                          {formatDisplayDate(item.date)}
                        </td>
                      ) : null}
                      <td style={{ textAlign: 'center' }}>{item.partName || '-'}</td>
                      <td className={devClass('Date Code', item.dateCode)} style={{ textAlign: 'center' }}>{item.dateCode || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{item.specification || '-'}</td>
                      <td className={observedValueDevClass(item.observedValue)} style={{ textAlign: 'center' }}>
                        {item.observedValue !== undefined && item.observedValue !== null ? item.observedValue : '-'}
                      </td>
                      <td className={devClass('Remarks', item.remarks)} style={{ textAlign: 'center' }}>{item.remarks || '-'}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <EntryActions entry={item} editConfig={impactEditConfig} onChanged={fetchData} />
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

    </>
  );
};

export default ImpactReport;
