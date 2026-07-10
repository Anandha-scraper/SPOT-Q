import React, { useState, useEffect, useRef } from 'react';
import { BookOpenCheck, ChevronDown, ChevronUp } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { ExcelDownloadDialog } from '../../Components/alert';
import { FilterButton, ClearButton, ExcelDownloadButton } from '../../Components/Buttons';
import Table from '../../Components/Table';
import { exportWorkbookToExcel, getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import '../../styles/PageStyles/Sandlab/FoundrySandTestingReport.css';

const FoundrySandTestingReport = () => {
  const getCurrentDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isFiltered, setIsFiltered] = useState(false);        // true once a range filter runs
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // In-memory cache (per session) of single-date fetches, keyed by YYYY-MM-DD
  const cacheRef = useRef({});



  useEffect(() => { fetchSingleDate(getCurrentDate()); }, []);

  // Fetch a single date's records (uses the in-memory cache for instant re-view)
  const fetchSingleDate = async (date) => {
    setError('');
    setExpandedId(null);
    setIsRangeMode(false);

    if (cacheRef.current[date] !== undefined) {
      setEntries(cacheRef.current[date]);
      return;
    }

    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.foundrySandTestingNotes}?startDate=${encodeURIComponent(date)}&endDate=${encodeURIComponent(date)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = (data.success && Array.isArray(data.data)) ? data.data : [];
      cacheRef.current[date] = list;
      setEntries(list);
    } catch (err) {
      console.error('Error fetching data:', err);
      setEntries([]);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a date range (summary/expandable view)
  const fetchRange = async (from, to) => {
    setLoading(true);
    setError('');
    setExpandedId(null);
    try {
      const url = `${API_ENDPOINTS.foundrySandTestingNotes}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = (data.success && Array.isArray(data.data)) ? data.data : [];
      setEntries(list);
      setIsRangeMode(true);
      if (list.length === 0) setError('No data found for the selected filters');
    } catch (err) {
      console.error('Error fetching data:', err);
      setEntries([]);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const to = toDate || getCurrentDate();
    if (fromDate) {
      if (new Date(to) < new Date(fromDate)) { alert('To date cannot be before From date'); return; }
      setIsFiltered(true);
      fetchRange(fromDate, to);
    } else {
      // No From ⇒ view the single "To" date
      setIsFiltered(false);
      fetchSingleDate(to);
    }
  };

  const handleClear = () => {
    const today = getCurrentDate();
    setFromDate('');
    setToDate(today);
    setIsFiltered(false);
    fetchSingleDate(today);
  };



  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr;
      return `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
    } catch { return dateStr; }
  };

  // ─── Sieve data config (same as entry form) ───
  const sieveData = [
    { size: 1700, mf: 5 },
    { size: 850, mf: 10 },
    { size: 600, mf: 20 },
    { size: 425, mf: 30 },
    { size: 300, mf: 40 },
    { size: 212, mf: 50 },
    { size: 150, mf: 70 },
    { size: 106, mf: 100 },
    { size: 75, mf: 140 },
    { size: 53, mf: 200 },
    { size: "Pan", mf: 300 },
  ];

  // ─── Column definitions (same layout as entry form) ───
  const clayColumns = [
    { key: 'parameter', label: 'Parameter', width: '180px', align: 'center' },
    { key: 'test1', label: 'TEST-1', align: 'center' },
    { key: 'test2', label: 'TEST-2', align: 'center' }
  ];

  const sieveColumns = [
    { key: 'sieveSize', label: 'Sieve Size (Mic)', width: '120px', align: 'center' },
    { key: 'wtTest1', label: '% Wt Retained - TEST-1', align: 'center' },
    { key: 'wtTest2', label: '% Wt Retained - TEST-2', align: 'center' },
    { key: 'mf', label: 'MF', width: '80px', align: 'center' },
    { key: 'prodTest1', label: 'Product - TEST-1', align: 'center' },
    { key: 'prodTest2', label: 'Product - TEST-2', align: 'center' }
  ];

  const testParamColumns = [
    { key: 'parameter', label: 'Parameter', width: '200px', align: 'center' },
    { key: 'test1', label: 'TEST-1', align: 'center' },
    { key: 'test2', label: 'TEST-2', align: 'center' }
  ];

  const additionalColumns = [
    { key: 'parameter', label: 'Parameter', width: '180px', align: 'center' },
    { key: 'test1', label: 'TEST-1', align: 'center' },
    { key: 'test2', label: 'TEST-2', align: 'center' }
  ];

  // ─── Parameter configs ───
  const clayParamKeys = ["totalClay", "activeClay", "deadClay", "vcm", "loi"];
  const clayParamLabels = ["Total Clay", "Active Clay", "Dead Clay", "VCM", "LOI"];

  const testParamConfig = [
    { key: "compactability", label: "Compactability" },
    { key: "permeability", label: "Permeability" },
    { key: "gcs", label: "GCS" },
    { key: "wts", label: "WTS" },
    { key: "moisture", label: "Moisture" },
    { key: "bentonite", label: "Bentonite" },
    { key: "coalDust", label: "CoalDust" },
    { key: "hopperLevel", label: "Hopper Level" },
    { key: "shearStrength", label: "Shear Strength" },
    { key: "dustCollectorSettings", label: "Dust Collector Settings" },
    { key: "returnSandMoisture", label: "Return Sand Moisture" }
  ];

  const additionalParamKeys = ["afsNo", "fines", "gd"];
  const additionalParamLabels = ["AFSNO", "FINES", "GD"];

  // ─── Render cell functions for read-only display ───
  const computeSolution = (param, data) => {
    if (!data) return '';
    if (param === 'activeClay') {
      const a = parseFloat(data.input1), b = parseFloat(data.input2);
      return (!isNaN(a) && !isNaN(b)) ? (a * b).toFixed(2) : '';
    }
    if (param === 'deadClay') {
      const a = parseFloat(data.input1), b = parseFloat(data.input2);
      return (!isNaN(a) && !isNaN(b)) ? (a - b).toFixed(2) : '';
    }
    // totalClay, vcm, loi
    const a = parseFloat(data.input1), b = parseFloat(data.input2), c = parseFloat(data.input3);
    return (!isNaN(a) && !isNaN(b) && !isNaN(c) && c !== 0) ? (((a - b) / c) * 100).toFixed(2) : '';
  };

  const renderClayCell = (record) => (rowIndex, colIndex, colKey) => {
    const param = clayParamKeys[rowIndex];
    if (colKey === 'parameter') {
      return <strong style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>{clayParamLabels[rowIndex]}</strong>;
    }
    const testNum = colKey;
    const data = record.clayTests?.[testNum]?.[param];
    if (!data) return <span style={{ color: '#94a3b8' }}>-</span>;

    const isSimple = param === "activeClay" || param === "deadClay";
    const operator = param === "activeClay" ? "x" : "-";
    const solution = computeSolution(param, data) || data.solution || '0';

    if (isSimple) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ minWidth: '50px', textAlign: 'center', color: '#475569' }}>{data.input1 || '-'}</span>
          <span>{operator}</span>
          <span style={{ minWidth: '50px', textAlign: 'center', color: '#475569' }}>{data.input2 || '-'}</span>
          <span>=</span>
          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>{solution}%</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ minWidth: '40px', textAlign: 'center', color: '#475569' }}>{data.input1 || '-'}</span>
        <span>-</span>
        <span style={{ minWidth: '40px', textAlign: 'center', color: '#475569' }}>{data.input2 || '-'}</span>
        <span>/</span>
        <span style={{ minWidth: '40px', textAlign: 'center', color: '#475569' }}>{data.input3 || '-'}</span>
        <span>x 100 =</span>
        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>{solution}%</span>
      </div>
    );
  };

  const renderSieveCell = (record) => (rowIndex, colIndex, colKey) => {
    const isTotal = rowIndex === sieveData.length;
    const row = isTotal ? null : sieveData[rowIndex];
    const sizeKey = isTotal ? 'total' : row.size;
    const mfKey = isTotal ? 'total' : row.mf;
    const cellStyle = { color: '#475569', fontWeight: isTotal ? 700 : 400 };

    if (colKey === 'sieveSize') return <strong style={{ fontWeight: isTotal ? 700 : 600, color: '#1e293b' }}>{isTotal ? 'Total' : row.size}</strong>;
    if (colKey === 'mf') return <strong style={{ fontWeight: isTotal ? 700 : 600, color: '#1e293b' }}>{isTotal ? 'Total' : row.mf}</strong>;
    if (colKey === 'wtTest1') return <span style={cellStyle}>{record.sieveTesting?.test1?.sieveSize?.[sizeKey] || '-'}</span>;
    if (colKey === 'wtTest2') return <span style={cellStyle}>{record.sieveTesting?.test2?.sieveSize?.[sizeKey] || '-'}</span>;
    if (colKey === 'prodTest1') return <span style={cellStyle}>{record.sieveTesting?.test1?.mf?.[mfKey] || '-'}</span>;
    if (colKey === 'prodTest2') return <span style={cellStyle}>{record.sieveTesting?.test2?.mf?.[mfKey] || '-'}</span>;
    return null;
  };

  const renderTestParamCell = (record) => (rowIndex, colIndex, colKey) => {
    const paramConfig = testParamConfig[rowIndex];
    if (colKey === 'parameter') {
      return <strong style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>{paramConfig.label}</strong>;
    }
    const val = record.parameters?.[colKey]?.[paramConfig.key];
    return <span style={{ color: '#475569' }}>{val || '-'}</span>;
  };

  const renderAdditionalCell = (record) => (rowIndex, colIndex, colKey) => {
    const param = additionalParamKeys[rowIndex];
    if (colKey === 'parameter') {
      return <strong style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>{additionalParamLabels[rowIndex]}</strong>;
    }
    const val = record.additionalData?.[colKey]?.[param];
    return <span style={{ color: '#475569' }}>{val || '-'}</span>;
  };

  // ─── Detail view for a single record ───
  const renderDetail = (record, idx, total) => (
    <div key={record._id || idx} style={{ marginBottom: '2.5rem', borderBottom: idx < total - 1 ? '3px solid #e2e8f0' : 'none', paddingBottom: idx < total - 1 ? '2rem' : 0 }}>
      {/* Primary Info */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Sand Plant</span>
          <div style={{ fontWeight: 500, color: '#1e293b' }}>{record.sandPlant || '-'}</div>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Compactability Setting</span>
          <div style={{ fontWeight: 500, color: '#1e293b' }}>{record.compactibilitySetting || '-'}</div>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Shear/Mould Strength Setting</span>
          <div style={{ fontWeight: 500, color: '#1e293b' }}>{record.shearStrengthSetting || '-'}</div>
        </div>
        {record.remarks && (
          <div>
            <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Remarks</span>
            <div style={{ fontWeight: 500, color: '#1e293b' }}>{record.remarks}</div>
          </div>
        )}
      </div>

      {/* Clay Parameters */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Clay Parameters</h3></div>
      <Table template bordered rows={5} minWidth={800} columns={clayColumns} renderCell={renderClayCell(record)} />

      {/* Sieve Testing */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Sieve Testing</h3></div>
      <Table template bordered rows={sieveData.length + 1} minWidth={900} columns={sieveColumns} renderCell={renderSieveCell(record)} />

      {/* Test Parameters */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Test Parameters</h3></div>
      <Table template bordered rows={11} minWidth={800} columns={testParamColumns} renderCell={renderTestParamCell(record)} />

      {/* Additional Data */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Additional Data</h3></div>
      <Table template bordered rows={3} minWidth={800} columns={additionalColumns} renderCell={renderAdditionalCell(record)} />
    </div>
  );

  // ─── Summary table columns for range mode ───
  const summaryColumns = [
    { key: 'sno', label: 'S.No', width: '70px', align: 'center' },
    { key: 'date', label: 'Date', width: '150px', align: 'center' },
    { key: 'shift', label: 'Shift', width: '100px', align: 'center' },
    { key: 'sandPlant', label: 'Sand Plant', width: '150px', align: 'center' },
    { key: 'action', label: 'Action', width: '100px', align: 'center' }
  ];

  const summaryData = entries.map((e, i) => ({
    sno: i + 1,
    date: formatDate(e.date),
    shift: e.shift || '-',
    sandPlant: e.sandPlant || '-',
    action: e._id,
    _id: e._id
  }));

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
      const url = `${API_ENDPOINTS.foundrySandTestingNotes}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const records = (data.success && Array.isArray(data.data)) ? data.data : [];
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (records.length === 0) { alert('No data to export for the selected range.'); return; }

      const D = (r) => formatDate(r.date);

      // 1) Overview — one row per record.
      const overviewRows = records.map((r) => ({
        date: D(r),
        shift: r.shift || '',
        sandPlant: r.sandPlant || '',
        compactability: r.compactibilitySetting || '',
        shearStrength: r.shearStrengthSetting || '',
        remarks: r.remarks || '',
      }));
      const overviewColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Sand Plant', key: 'sandPlant', width: 16 },
        { header: 'Compactability Setting', key: 'compactability', width: 18 },
        { header: 'Shear/Mould Strength Setting', key: 'shearStrength', width: 20 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 2) Clay Parameters — one row per parameter per record (computed solution %).
      const clayRows = records.flatMap((r) =>
        clayParamKeys.map((param, i) => ({
          date: D(r),
          parameter: clayParamLabels[i],
          test1: r.clayTests?.test1?.[param] ? `${computeSolution(param, r.clayTests.test1[param]) || r.clayTests.test1[param].solution || '0'}%` : '',
          test2: r.clayTests?.test2?.[param] ? `${computeSolution(param, r.clayTests.test2[param]) || r.clayTests.test2[param].solution || '0'}%` : '',
        }))
      );
      const paramTestColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Parameter', key: 'parameter', width: 18 },
        { header: 'TEST-1', key: 'test1', width: 14 },
        { header: 'TEST-2', key: 'test2', width: 14 },
      ];

      // 3) Sieve Testing — one row per sieve size (+Total) per record.
      const sieveRows = records.flatMap((r) =>
        [...sieveData, { size: 'Total', mf: 'Total', isTotal: true }].map((row) => {
          const sizeKey = row.isTotal ? 'total' : row.size;
          const mfKey = row.isTotal ? 'total' : row.mf;
          return {
            date: D(r),
            sieveSize: row.isTotal ? 'Total' : row.size,
            mf: row.isTotal ? 'Total' : row.mf,
            wtTest1: r.sieveTesting?.test1?.sieveSize?.[sizeKey] || '',
            wtTest2: r.sieveTesting?.test2?.sieveSize?.[sizeKey] || '',
            prodTest1: r.sieveTesting?.test1?.mf?.[mfKey] || '',
            prodTest2: r.sieveTesting?.test2?.mf?.[mfKey] || '',
          };
        })
      );
      const sieveColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Sieve Size (Mic)', key: 'sieveSize', width: 14 },
        { header: 'MF', key: 'mf', width: 8 },
        { header: '% Wt Retained - TEST-1', key: 'wtTest1', width: 16 },
        { header: '% Wt Retained - TEST-2', key: 'wtTest2', width: 16 },
        { header: 'Product - TEST-1', key: 'prodTest1', width: 14 },
        { header: 'Product - TEST-2', key: 'prodTest2', width: 14 },
      ];

      // 4) Test Parameters — one row per parameter per record.
      const testParamRows = records.flatMap((r) =>
        testParamConfig.map((cfg) => ({
          date: D(r),
          parameter: cfg.label,
          test1: r.parameters?.test1?.[cfg.key] || '',
          test2: r.parameters?.test2?.[cfg.key] || '',
        }))
      );

      // 5) Additional Data — one row per parameter per record.
      const additionalRows = records.flatMap((r) =>
        additionalParamKeys.map((param, i) => ({
          date: D(r),
          parameter: additionalParamLabels[i],
          test1: r.additionalData?.test1?.[param] || '',
          test2: r.additionalData?.test2?.[param] || '',
        }))
      );

      await exportWorkbookToExcel({
        title: 'Foundry Sand Testing Note - Report',
        fromDate: from,
        toDate: to,
        fileName: 'Foundry_Sand_Testing_Note_Report',
        sheets: [
          { sheetName: 'Overview', columns: overviewColumns, rows: overviewRows },
          { sheetName: 'Clay Parameters', columns: paramTestColumns, rows: clayRows },
          { sheetName: 'Sieve Testing', columns: sieveColumnsX, rows: sieveRows },
          { sheetName: 'Test Parameters', columns: paramTestColumns, rows: testParamRows },
          { sheetName: 'Additional Data', columns: paramTestColumns, rows: additionalRows },
        ],
      });
    } catch (err) {
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="foundry-sand-testing-report-container">
      {/* Header */}
      <div className="foundry-sand-testing-report-header">
        <div className="foundry-sand-testing-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Foundry Sand Testing Note - Report
          </h2>
        </div>
        {!isRangeMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontWeight: 600, color: '#1e293b' }}>
            {entries.length === 1 && entries[0].shift && <span>{entries[0].shift}</span>}
            {entries.length === 1 && entries[0].sandPlant && <span>Sand Plant: {entries[0].sandPlant}</span>}
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="foundry-sand-testing-filter-container"> 
        <div className="foundry-sand-testing-filter-group">
          <label style={{ fontWeight: 600 }}>From</label>
          <CustomDatePicker
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            max={getCurrentDate()}
          />
        </div>
        <div className="foundry-sand-testing-filter-group">
          <label style={{ fontWeight: 600 }}>To</label>
          <CustomDatePicker
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            min={fromDate || undefined}
            max={getCurrentDate()}
          />
        </div>
        <div className="foundry-sand-testing-filter-actions">
          <FilterButton onClick={handleFilter} disabled={loading} />
          {isFiltered && <ClearButton onClick={handleClear} disabled={loading} />}
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

      </div>

      {/* Error / Loading */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#5B9AA9' }}>Loading data...</div>
      )}

      {/* === RANGE MODE: Summary table with expandable rows === */}
      {!loading && isRangeMode && entries.length > 0 && (
        <>
          <h3 className="foundry-section-header" style={{ marginTop: '1.5rem' }}>
            Entries ({entries.length})
          </h3>
          <div className="reusable-table-container">
            <table className="reusable-table table-bordered" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  {summaryColumns.map((col) => (
                    <th key={col.key} style={{ width: col.width, textAlign: col.align }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((record, idx) => (
                  <React.Fragment key={record._id || idx}>
                    <tr
                      onClick={() => setExpandedId(expandedId === record._id ? null : record._id)}
                      style={{ cursor: 'pointer', backgroundColor: expandedId === record._id ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedId === record._id ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{idx + 1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{formatDate(record.date)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{record.shift || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{record.sandPlant || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {expandedId === record._id
                          ? <ChevronUp size={18} style={{ color: '#5B9AA9' }} />
                          : <ChevronDown size={18} style={{ color: '#5B9AA9' }} />
                        }
                      </td>
                    </tr>
                    {expandedId === record._id && (
                      <tr>
                        <td colSpan={summaryColumns.length} style={{ padding: '1rem', backgroundColor: '#fafbfc' }}>
                          {renderDetail(record, 0, 1)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* === SINGLE DATE MODE: Show detail directly === */}
      {!loading && !isRangeMode && (
        (entries.length > 0 ? entries : [{}]).map((record, idx) =>
          renderDetail(record, idx, entries.length || 1)
        )
      )}

      {/* Range mode with no entries */}
      {!loading && isRangeMode && entries.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '1rem' }}>
          No entries found for the selected date range
        </div>
      )}

    </div>
  );
};

export default FoundrySandTestingReport;