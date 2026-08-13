import React, { useState, useEffect, useMemo } from 'react';
import { BookOpenCheck, PencilLine, Save, X, Trash2 } from 'lucide-react';
import { FilterButton, ClearButton, DeviationToggleButton, ShiftDropdown, EntryNavigator, ExcelDownloadButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { AlertDialog, ExcelDownloadDialog, useToast } from '../../Components/alert';
import Table from '../../Components/Table';
import { exportWorkbookToExcel, getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { isDeviant } from '../../utils/formValidation';
import { validationRanges, HARDNESS_READING_RULES } from '../../deviations/DdisamaticProduct';
import '../../styles/ComponentStyles/Table.css';
import '../../styles/PageStyles/Moulding/DisamaticProductReport.css';

const navButtonStyle = (disabled) => ({
  display: 'flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.5rem 0.75rem', borderRadius: '8px', border: '2px solid #5B9AA9',
  background: '#fff', color: disabled ? '#94a3b8' : '#5B9AA9', borderColor: disabled ? '#cbd5e1' : '#5B9AA9',
  cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem'
});

const DisamaticProductReport = () => {
  const { toast } = useToast();
  const { isAdmin, user, editWindowMs } = useAuth();
  const [showDeviations, setShowDeviations] = useState(false);
  const ruleByField = useMemo(() => {
    const map = {};
    validationRanges.forEach((r) => { map[r.field] = r; });
    return map;
  }, []);
  const isFieldDeviant = (ruleFieldName, value) => {
    if (!showDeviations || !isAdmin) return false;
    const rule = ruleByField[ruleFieldName];
    return Boolean(rule && isDeviant(rule, value));
  };
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredDelayIndex, setHoveredDelayIndex] = useState({ rowIndex: null, itemIndex: null });

  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(null);
  const [shift, setShift] = useState('');

  // One record shown at a time; Table toggles the combinations picker.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEntryTable, setShowEntryTable] = useState(false);

  // Excel export
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const currentEntry = entries[currentIndex] || null;

  // Transform backend data to frontend format
  const transformBackendData = (dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return [];
    }

    return dataArray.map(item => ({
      _id: item._id,
      date: item.date,
      shift: item.shift || '-',
      incharge: item.incharge || '-',
      ppOperator: item.ppOperator || '-',
      // Report-page whole-entry edit/delete permission gating (EntryActions.jsx-style).
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      members: Array.isArray(item.memberspresent)
        ? item.memberspresent.map(name => ({ name }))
        : [],
      productionTable: item.productionDetails || [],
      nextShiftPlanTable: item.nextShiftPlan || [],
      delaysTable: item.delays || [],
      mouldHardnessTable: item.mouldHardness || [],
      patternTempTable: item.patternTemperature || [],
      significantEvent: item.significantEvent || '',
      maintenance: item.maintenance || '',
      supervisorName: item.supervisorName || ''
    }));
  };

  // ─── Inline edit (report page, whole entry at once — not per-row) ───
  // A non-destructive `edits` map layered on top of the read-only *Table
  // arrays — those stay exactly what transformBackendData last computed, so
  // Cancel is just "discard the map," and Save reads the map to build the
  // PUT payload. Cell keys are `${table}_${rowId}_${field}`.
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditMode(false);
    setEdits({});
  }, [currentIndex, showEntryTable]);

  const getEdit = (cellKey, fallback) => (edits[cellKey] !== undefined ? edits[cellKey] : (fallback ?? ''));
  const setEdit = (cellKey, value) => setEdits((prev) => ({ ...prev, [cellKey]: value }));

  const editableTd = (cellKey, currentValue, inputStyle) => {
    if (editMode) {
      return (
        <input
          type="text"
          value={getEdit(cellKey, currentValue)}
          onChange={(e) => setEdit(cellKey, e.target.value)}
          style={{ width: '100%', minWidth: '70px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem', boxSizing: 'border-box', ...inputStyle }}
        />
      );
    }
    return currentValue ?? '-';
  };

  const canEditEntry = (entry) => {
    if (!entry) return false;
    if (isAdmin) return true;
    const isOwner = entry.createdBy && user?.id && String(entry.createdBy) === String(user.id);
    const createdMs = entry.createdAt ? new Date(entry.createdAt).getTime() : null;
    if (!isOwner || !createdMs) return false;
    return (editWindowMs - (Date.now() - createdMs)) > 0;
  };
  const canDeleteEntry = () => isAdmin;

  const EDITABLE_FIELDS_BY_TABLE = {
    productionTable: ['counterNo', 'componentName', 'cycleTime', 'remarks', 'produced', 'poured', 'mouldsPerHour'],
    nextShiftPlanTable: ['componentName', 'remarks', 'plannedMoulds'],
    delaysTable: ['delays'],
    mouldHardnessTable: ['componentName', 'remarks'],
    patternTempTable: ['item', 'pp', 'sp'],
  };
  const EDIT_KEY_BY_TABLE = {
    productionTable: 'productionEdits',
    nextShiftPlanTable: 'nextShiftPlanEdits',
    delaysTable: 'delaysEdits',
    mouldHardnessTable: 'mouldHardnessEdits',
    patternTempTable: 'patternTempEdits',
  };

  const buildEditsPayload = () => {
    const payload = {};
    for (const [table, fields] of Object.entries(EDITABLE_FIELDS_BY_TABLE)) {
      const rows = currentEntry?.[table] || [];
      const out = [];
      rows.forEach((row) => {
        if (!row._id) return;
        const data = {};
        fields.forEach((field) => {
          const cellKey = `${table}_${row._id}_${field}`;
          if (edits[cellKey] !== undefined) data[field] = edits[cellKey];
        });
        if (Object.keys(data).length) out.push({ id: row._id, data });
      });
      payload[EDIT_KEY_BY_TABLE[table]] = out;
    }
    return payload;
  };

  const handleSaveEdits = async () => {
    if (!currentEntry?._id) return;
    if (Object.keys(edits).length === 0) { setEditMode(false); return; }
    setSaving(true);
    try {
      const body = buildEditsPayload();
      const res = await fetch(`${API_ENDPOINTS.mouldingDisa}/${currentEntry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const [updated] = transformBackendData([data.data]);
        setEntries((prev) => prev.map((e, i) => (i === currentIndex ? updated : e)));
        setEdits({});
        setEditMode(false);
        toast.success(data.message || 'Entry updated successfully.');
      } else {
        toast.error(data.message || 'Failed to save changes.');
      }
    } catch (err) {
      toast.error('Network error while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdits = () => {
    setEdits({});
    setEditMode(false);
  };

  const handleDeleteEntry = async () => {
    if (!currentEntry?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.mouldingDisa}/${currentEntry._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const remaining = entries.filter((_, i) => i !== currentIndex);
        setEntries(remaining);
        setCurrentIndex((i) => Math.max(0, Math.min(i, remaining.length - 1)));
        toast.success(data.message || 'Entry deleted successfully.');
      } else {
        toast.error(data.message || 'Failed to delete entry.');
      }
    } catch (err) {
      toast.error('Network error while deleting. Please try again.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    fetchCurrentDateAndEntries();
  }, []);

  const loadRange = async (from, to, { selectShift } = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_ENDPOINTS.mouldingDisa}/range?startDate=${from}&endDate=${to}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

      const data = await response.json();
      const records = (data.success && Array.isArray(data.data)) ? transformBackendData(data.data) : [];
      const shown = selectShift ? records.filter((entry) => entry.shift === selectShift) : records;

      setEntries(shown);
      setCurrentIndex(0);
      setShowEntryTable(false);
      if (shown.length === 0) setError('No data found for the selected filters');
      return records;
    } catch (err) {
      setError('Failed to load entries: ' + err.message);
      setEntries([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentDateAndEntries = async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setCurrentDate(todayStr);
    setToDate(todayStr);
    await loadRange(todayStr, todayStr);
  };

  // fromDate is optional (blank = single day); toDate is required and defaults
  // to today — matches the fromDate/toDate convention every other report page
  // uses (e.g. ProcessReport.jsx's computeFiltered/isFilterEnabled).
  const handleFilter = async () => {
    if (!toDate) {
      toast.error('Please select a date');
      return;
    }
    if (fromDate && new Date(fromDate) > new Date(toDate)) {
      toast.error('From date cannot be after To date.');
      return;
    }
    // With no from date the Shift dropdown narrows a single day; over a range
    // every shift is kept and the navigator steps through them.
    await loadRange(fromDate || toDate, toDate, { selectShift: fromDate ? '' : shift });
  };

  const handleClearFilter = () => {
    setFromDate('');
    setShift('');
    fetchCurrentDateAndEntries();
  };

  const formatDate = (dateStr) => {
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

  // ─── Excel export: one worksheet (tab) per section, flat table per tab ───
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
      const url = `${API_ENDPOINTS.mouldingDisa}/range?startDate=${from}&endDate=${to}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
      const data = await response.json();
      const records = (data.success && Array.isArray(data.data)) ? data.data : [];
      records.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.shift || '').localeCompare(b.shift || '');
      });
      if (records.length === 0) { toast.error('No data to export for the selected range.'); return; }

      const D = (r) => formatDate(r.date);
      const S = (r) => r.shift || '-';
      const joinReadings = (arr) => (Array.isArray(arr) && arr.length
        ? arr.map((v) => (Array.isArray(v) ? v[0] : v) ?? '-').join(', ') : '');

      // 1) Overview — one row per record (shift).
      const overviewRows = records.map((r) => ({
        date: D(r), shift: S(r),
        incharge: r.incharge || '',
        ppOperator: r.ppOperator || '',
        members: Array.isArray(r.memberspresent) ? r.memberspresent.join(', ') : '',
      }));
      const overviewColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Incharge', key: 'incharge', width: 16 },
        { header: 'PP Operator', key: 'ppOperator', width: 16 },
        { header: 'Members Present', key: 'members', width: 30 },
      ];

      // 2) Production — one row per item.
      const productionRows = records.flatMap((r) =>
        (Array.isArray(r.productionDetails) ? r.productionDetails : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: item.sNo || i + 1,
          counterNo: item.counterNo || '',
          componentName: item.componentName || '',
          produced: item.produced ?? '',
          poured: item.poured ?? '',
          cycleTime: item.cycleTime || '',
          mouldsPerHour: item.mouldsPerHour || '',
          remarks: item.remarks || '',
        }))
      );
      const productionColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Counter No', key: 'counterNo', width: 12 },
        { header: 'Component Name', key: 'componentName', width: 22 },
        { header: 'Produced', key: 'produced', width: 12 },
        { header: 'Poured', key: 'poured', width: 12 },
        { header: 'Cycle Time', key: 'cycleTime', width: 12 },
        { header: 'Moulds/Hour', key: 'mouldsPerHour', width: 13 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 3) Next Shift Plan — one row per item.
      const nextShiftRows = records.flatMap((r) =>
        (Array.isArray(r.nextShiftPlan) ? r.nextShiftPlan : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: item.sNo || i + 1,
          componentName: item.componentName || '',
          plannedMoulds: item.plannedMoulds ?? '',
          remarks: item.remarks || '',
        }))
      );
      const nextShiftColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Component Name', key: 'componentName', width: 24 },
        { header: 'Planned Moulds', key: 'plannedMoulds', width: 16 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 4) Delays — one row per item.
      const delaysRows = records.flatMap((r) =>
        (Array.isArray(r.delays) ? r.delays : []).map((item, i) => {
          const durations = Array.isArray(item.durationMinutes)
            ? item.durationMinutes.map((m) => `${m} min`).join(' / ')
            : (item.durationMinutes ?? '');
          const times = Array.isArray(item.fromTime) && Array.isArray(item.toTime)
            ? item.fromTime.map((f, idx) => `${f} - ${item.toTime[idx] ?? ''}`).join(', ')
            : '';
          return {
            date: D(r), shift: S(r),
            sNo: item.sNo || i + 1,
            delays: item.delays || '',
            durationMinutes: durations,
            durationInTime: times,
          };
        })
      );
      const delaysColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Delays', key: 'delays', width: 24 },
        { header: 'Duration (Minutes)', key: 'durationMinutes', width: 22 },
        { header: 'Duration in Time', key: 'durationInTime', width: 28 },
      ];

      // 5) Mould Hardness — one row per item.
      const mouldHardnessRows = records.flatMap((r) =>
        (Array.isArray(r.mouldHardness) ? r.mouldHardness : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: item.sNo || i + 1,
          componentName: item.componentName || '',
          mpPP: joinReadings(item.mpPP),
          mpSP: joinReadings(item.mpSP),
          bsPP: joinReadings(item.bsPP),
          bsSP: joinReadings(item.bsSP),
          remarks: item.remarks || '',
        }))
      );
      const mouldHardnessColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Component Name', key: 'componentName', width: 22 },
        { header: 'PP', key: 'mpPP', width: 16, group: 'Mould Penetrant tester (N/cm²)' },
        { header: 'SP', key: 'mpSP', width: 16, group: 'Mould Penetrant tester (N/cm²)' },
        { header: 'PP', key: 'bsPP', width: 16, group: 'B - Scale' },
        { header: 'SP', key: 'bsSP', width: 16, group: 'B - Scale' },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      // 6) Pattern Temperature — one row per item.
      const patternTempRows = records.flatMap((r) =>
        (Array.isArray(r.patternTemperature) ? r.patternTemperature : []).map((item, i) => ({
          date: D(r), shift: S(r),
          sNo: i + 1,
          item: item.item || '',
          pp: item.pp ?? '',
          sp: item.sp ?? '',
        }))
      );
      const patternTempColumnsX = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'S.No', key: 'sNo', width: 7 },
        { header: 'Item', key: 'item', width: 24 },
        { header: 'PP', key: 'pp', width: 12 },
        { header: 'SP', key: 'sp', width: 12 },
      ];

      // 7) Events & Maintenance — one row per record.
      const eventsRows = records.map((r) => ({
        date: D(r), shift: S(r),
        significantEvent: r.significantEvent || '',
        maintenance: r.maintenance || '',
        supervisorName: r.supervisorName || '',
      }));
      const eventsColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Significant Event', key: 'significantEvent', width: 36 },
        { header: 'Maintenance', key: 'maintenance', width: 36 },
        { header: 'Supervisor Name', key: 'supervisorName', width: 20 },
      ];

      await exportWorkbookToExcel({
        title: 'Disamatic Product - Report',
        fromDate: from,
        toDate: to,
        fileName: 'Disamatic_Product_Report',
        sheets: [
          { sheetName: 'Overview', columns: overviewColumns, rows: overviewRows },
          { sheetName: 'Production', columns: productionColumnsX, rows: productionRows },
          { sheetName: 'Next Shift Plan', columns: nextShiftColumns, rows: nextShiftRows },
          { sheetName: 'Delays', columns: delaysColumnsX, rows: delaysRows },
          { sheetName: 'Mould Hardness', columns: mouldHardnessColumns, rows: mouldHardnessRows },
          { sheetName: 'Pattern Temperature', columns: patternTempColumnsX, rows: patternTempRows },
          { sheetName: 'Events & Maintenance', columns: eventsColumns, rows: eventsRows },
        ],
      });
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Production Table Columns
  const productionColumns = [
    { 
      key: 'sNo', 
      label: 'S.No', 
      width: '80px', 
      align: 'center',
      render: (item, rowIndex) => item.isTotalRow ? '' : (item.sNo || rowIndex + 1)
    },
    {
      key: 'counterNo',
      label: 'Counter No',
      width: '120px',
      align: 'center',
      render: (item) => item.isTotalRow ? '' : editableTd(`productionTable_${item._id}_counterNo`, item.counterNo)
    },
    {
      key: 'componentName',
      label: 'Component Name',
      width: '200px',
      align: 'left',
      render: (item) => editMode && !item.isTotalRow
        ? editableTd(`productionTable_${item._id}_componentName`, item.componentName, { textAlign: 'left' })
        : (
          <span style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#1e293b' : '#475569' }}>
            {item.componentName}
          </span>
        )
    },
    {
      key: 'produced',
      label: 'Produced',
      width: '120px',
      align: 'center',
      cellClassName: (item) => (!item.isTotalRow && isFieldDeviant('Produced', item.produced) ? 'deviation-flag' : undefined),
      render: (item) => editMode && !item.isTotalRow
        ? editableTd(`productionTable_${item._id}_produced`, item.produced)
        : (
          <span
            style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#5B9AA9' : '#475569', fontSize: item.isTotalRow ? '1.05rem' : 'inherit' }}
          >
            {item.produced}
          </span>
        )
    },
    {
      key: 'poured',
      label: 'Poured',
      width: '120px',
      align: 'center',
      cellClassName: (item) => (!item.isTotalRow && isFieldDeviant('Poured', item.poured) ? 'deviation-flag' : undefined),
      render: (item) => editMode && !item.isTotalRow
        ? editableTd(`productionTable_${item._id}_poured`, item.poured)
        : (
          <span
            style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#5B9AA9' : '#475569', fontSize: item.isTotalRow ? '1.05rem' : 'inherit' }}
          >
            {item.poured}
          </span>
        )
    },
    {
      key: 'cycleTime',
      label: 'Cycle Time',
      width: '120px',
      align: 'center',
      render: (item) => item.isTotalRow ? '' : editableTd(`productionTable_${item._id}_cycleTime`, item.cycleTime)
    },
    {
      key: 'mouldsPerHour',
      label: 'Moulds/Hour',
      width: '140px',
      align: 'center',
      cellClassName: (item) => (!item.isTotalRow && isFieldDeviant('Moulds/Hour', item.mouldsPerHour) ? 'deviation-flag' : undefined),
      render: (item) => item.isTotalRow ? '' : editableTd(`productionTable_${item._id}_mouldsPerHour`, item.mouldsPerHour)
    },
    {
      key: 'remarks',
      label: 'Remarks',
      width: '200px',
      align: 'left',
      render: (item) => item.isTotalRow ? '' : editableTd(`productionTable_${item._id}_remarks`, item.remarks, { textAlign: 'left' })
    }
  ];

  // Get production data with totals row
  const getProductionDataWithTotals = () => {
    if (!currentEntry?.productionTable) {
      return [];
    }
    
    const data = currentEntry.productionTable;
    
    if (data.length === 0) {
      return [];
    }
    
    // Calculate totals
    const totals = data.reduce(
      (acc, row) => {
        acc.totalProduced += Number(row.produced) || 0;
        acc.totalPoured += Number(row.poured) || 0;
        return acc;
      },
      { totalProduced: 0, totalPoured: 0 }
    );
    
    // Add total row
    return [
      ...data,
      {
        _id: 'total-row',
        isTotalRow: true,
        counterNo: '',
        componentName: 'TOTAL',
        produced: totals.totalProduced,
        poured: totals.totalPoured,
        cycleTime: '',
        mouldsPerHour: '',
        remarks: ''
      }
    ];
  };

  // Next Shift Plan Table Columns
  const nextShiftPlanColumns = [
    { 
      key: 'sNo', 
      label: 'S.No', 
      width: '80px', 
      align: 'center',
      render: (item, rowIndex) => item.sNo || rowIndex + 1
    },
    {
      key: 'componentName', label: 'Component Name', width: '300px', align: 'left',
      render: (item) => editableTd(`nextShiftPlanTable_${item._id}_componentName`, item.componentName, { textAlign: 'left' })
    },
    {
      key: 'plannedMoulds', label: 'Planned Moulds', width: '200px', align: 'center',
      cellClassName: (item) => (isFieldDeviant('Planned Moulds', item.plannedMoulds) ? 'deviation-flag' : undefined),
      render: (item) => editableTd(`nextShiftPlanTable_${item._id}_plannedMoulds`, item.plannedMoulds)
    },
    {
      key: 'remarks', label: 'Remarks', width: '300px', align: 'left',
      render: (item) => editableTd(`nextShiftPlanTable_${item._id}_remarks`, item.remarks, { textAlign: 'left' })
    }
  ];

  // Delays Table Columns
  const delaysColumns = [
    { 
      key: 'sNo', 
      label: 'S.No', 
      width: '80px', 
      align: 'center',
      render: (item, rowIndex) => item.isTotalRow ? '' : (item.sNo || rowIndex + 1)
    },
    {
      key: 'delays',
      label: 'Delays',
      width: '250px',
      align: 'left',
      render: (item) => editMode && !item.isTotalRow
        ? editableTd(`delaysTable_${item._id}_delays`, item.delays, { textAlign: 'left' })
        : (
          <span style={{ fontWeight: item.isTotalRow ? 700 : 'normal', color: item.isTotalRow ? '#1e293b' : '#475569' }}>
            {item.delays}
          </span>
        )
    },
    { 
      key: 'durationMinutes', 
      label: 'Duration (Minutes)', 
      width: '300px', 
      align: 'left',
      render: (item, rowIndex) => {
        // Total row - show total minutes
        if (item.isTotalRow) {
          return (
            <span style={{ 
              fontWeight: 700, 
              color: '#1e293b',
              fontSize: '1rem'
            }}>
              {item.totalMinutes} min
            </span>
          );
        }
        
        // Regular row
        if (!Array.isArray(item.durationMinutes)) {
          return item.durationMinutes;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {item.durationMinutes.map((duration, idx) => {
              const isHovered = hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx;
              const deviant = isFieldDeviant('Duration (Minutes)', duration);
              return (
                <span
                  key={idx}
                  onMouseEnter={() => setHoveredDelayIndex({ rowIndex, itemIndex: idx })}
                  onMouseLeave={() => setHoveredDelayIndex({ rowIndex: null, itemIndex: null })}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: isHovered ? '#5B9AA9' : (deviant ? '#fef9c3' : '#f1f5f9'),
                    color: isHovered ? '#ffffff' : '#334155',
                    fontWeight: isHovered ? 600 : 500,
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor: isHovered ? '#5B9AA9' : (deviant ? '#eab308' : '#cbd5e1')
                  }}
                >
                  {duration} min
                </span>
              );
            })}
          </div>
        );
      }
    },
    { 
      key: 'durationInTime', 
      label: 'Duration in Time', 
      width: '350px', 
      align: 'left',
      render: (item, rowIndex) => {
        // Total row - show empty
        if (item.isTotalRow) {
          return '';
        }
        
        if (!Array.isArray(item.fromTime) || !Array.isArray(item.toTime)) {
          return '-';
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {item.fromTime.map((from, idx) => (
              <span
                key={idx}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#5B9AA9' : '#f8fafc',
                  color: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#ffffff' : '#475569',
                  fontWeight: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? 600 : 500,
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: hoveredDelayIndex.rowIndex === rowIndex && hoveredDelayIndex.itemIndex === idx ? '#5B9AA9' : '#e2e8f0'
                }}
              >
                {from} - {item.toTime[idx]}
              </span>
            ))}
          </div>
        );
      }
    }
  ];

  // Get delays data with totals row
  const getDelaysDataWithTotals = () => {
    if (!currentEntry?.delaysTable) {
      return [];
    }
    
    const data = currentEntry.delaysTable;
    
    if (data.length === 0) {
      return [];
    }
    
    // Calculate total minutes
    const totalMinutes = data.reduce((acc, row) => {
      if (Array.isArray(row.durationMinutes)) {
        row.durationMinutes.forEach(min => {
          acc += Number(min) || 0;
        });
      } else {
        acc += Number(row.durationMinutes) || 0;
      }
      return acc;
    }, 0);
    
    // Add total row
    return [
      ...data,
      {
        _id: 'delays-total-row',
        isTotalRow: true,
        delays: 'TOTAL',
        totalMinutes: totalMinutes,
        durationMinutes: [],
        fromTime: [],
        toTime: []
      }
    ];
  };

  // Mould Hardness Table - Custom render with two-row header
  const renderMouldHardnessTable = () => {
    const data = currentEntry?.mouldHardnessTable ? currentEntry.mouldHardnessTable : [];

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle', color: '#1e293b' }}>S.No</th>
              <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle', color: '#1e293b' }}>Component Name</th>
              <th colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>Mould Penetrant tester (N/cm²)</th>
              <th colSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>B - Scale</th>
              <th rowSpan={2} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, verticalAlign: 'middle', color: '#1e293b' }}>Remarks</th>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>PP</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>SP</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>PP</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>SP</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
                    No mould hardness data available
                  </span>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
              <tr key={row._id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                  {row.sNo || index + 1}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                  {editableTd(`mouldHardnessTable_${row._id}_componentName`, row.componentName)}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.mpPP) || row.mpPP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.mpPP.map((reading, idx) => {
                        const value = Array.isArray(reading) ? reading[0] : reading;
                        return (
                          <span
                            key={idx}
                            className={isFieldDeviant(HARDNESS_READING_RULES.mpPP, value) ? 'deviation-flag' : undefined}
                            style={{ color: '#334155', fontWeight: 500 }}
                          >
                            {value || '-'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.mpSP) || row.mpSP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.mpSP.map((reading, idx) => {
                        const value = Array.isArray(reading) ? reading[0] : reading;
                        return (
                          <span
                            key={idx}
                            className={isFieldDeviant(HARDNESS_READING_RULES.mpSP, value) ? 'deviation-flag' : undefined}
                            style={{ color: '#334155', fontWeight: 500 }}
                          >
                            {value || '-'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.bsPP) || row.bsPP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.bsPP.map((reading, idx) => {
                        const value = Array.isArray(reading) ? reading[0] : reading;
                        return (
                          <span
                            key={idx}
                            className={isFieldDeviant(HARDNESS_READING_RULES.bsPP, value) ? 'deviation-flag' : undefined}
                            style={{ color: '#334155', fontWeight: 500 }}
                          >
                            {value || '-'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' }}>
                  {!Array.isArray(row.bsSP) || row.bsSP.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                      {row.bsSP.map((reading, idx) => {
                        const value = Array.isArray(reading) ? reading[0] : reading;
                        return (
                          <span
                            key={idx}
                            className={isFieldDeviant(HARDNESS_READING_RULES.bsSP, value) ? 'deviation-flag' : undefined}
                            style={{ color: '#334155', fontWeight: 500 }}
                          >
                            {value || '-'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                  {editableTd(`mouldHardnessTable_${row._id}_remarks`, row.remarks)}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Pattern Temperature Table Columns
  const patternTempColumns = [
    { 
      key: 'sno', 
      label: 'S.No', 
      width: '100px', 
      align: 'center',
      render: (item, rowIndex) => rowIndex + 1
    },
    {
      key: 'item',
      label: 'Item',
      width: '300px',
      align: 'left',
      render: (item) => editableTd(`patternTempTable_${item._id}_item`, item.item, { textAlign: 'left' })
    },
    {
      key: 'pp',
      label: 'PP',
      width: '150px',
      align: 'center',
      render: (item) => editableTd(`patternTempTable_${item._id}_pp`, item.pp)
    },
    {
      key: 'sp',
      label: 'SP',
      width: '150px',
      align: 'center',
      render: (item) => editableTd(`patternTempTable_${item._id}_sp`, item.sp)
    }
  ];

  return (
    <div className="page-wrapper moulding-page-wrapper">
      <div className="disamatic-report-header">
        <div className="disamatic-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Disamatic Product - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {currentDate ? `DATE : ${formatDate(currentDate)}` : 'Loading...'}
        </div>
      </div>

      {/* Filter Section */}
      <div className="disamatic-filter-container">
          <div className="disamatic-filter-group">
            <label>From</label>
            <CustomDatePicker
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="Select start date"
              max={toDate}
            />
          </div>
          <div className="disamatic-filter-group">
            <label>To</label>
            <CustomDatePicker
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="Select end date"
            />
          </div>
          {!fromDate && (
            <div className="disamatic-filter-group">
              <label>Shift</label>
              <ShiftDropdown
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                disabled={!toDate}
              />
            </div>
          )}
          <FilterButton onClick={handleFilter} disabled={!toDate || loading}>
            {loading ? 'Loading...' : 'Filter'}
          </FilterButton>
          <ClearButton onClick={handleClearFilter} disabled={!fromDate && !shift}>
            Clear
          </ClearButton>
          {isAdmin && (
            <DeviationToggleButton
              active={showDeviations}
              onClick={() => setShowDeviations((prev) => !prev)}
            />
          )}
          <EntryNavigator
            currentIndex={currentIndex}
            total={entries.length}
            showTable={showEntryTable}
            onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentIndex((i) => Math.min(entries.length - 1, i + 1))}
            onToggleTable={() => setShowEntryTable((v) => !v)}
          />
          {currentEntry && !showEntryTable && !editMode && canEditEntry(currentEntry) && (
            <button type="button" onClick={() => setEditMode(true)} style={navButtonStyle(false)} title="Edit this entry">
              <PencilLine size={16} /> Edit
            </button>
          )}
          {editMode && (
            <>
              <button type="button" onClick={handleSaveEdits} disabled={saving} style={navButtonStyle(saving)} title="Save changes">
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={handleCancelEdits} disabled={saving} style={{ ...navButtonStyle(false), borderColor: '#cbd5e1', color: '#64748b' }} title="Discard changes">
                <X size={16} /> Cancel
              </button>
            </>
          )}
          {currentEntry && !showEntryTable && !editMode && canDeleteEntry() && (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting} style={{ ...navButtonStyle(deleting), borderColor: '#e74c3c', color: deleting ? '#94a3b8' : '#e74c3c' }} title="Delete this entry">
              <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
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
          <AlertDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="Delete this entry?"
            description="This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="danger"
            loading={deleting}
            closeOnConfirm={false}
            onConfirm={handleDeleteEntry}
          />
        {error && (
          <span className="disa-inline-error" style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</span>
        )}
      </div>

      {/* Combinations picker — jump straight to a Date/Shift, or an empty table when nothing matched */}
      {!loading && (showEntryTable || entries.length === 0) && (
        <div className="reusable-table-container">
          <table className="reusable-table table-bordered" style={{ minWidth: '400px' }}>
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>#</th>
                <th style={{ width: '200px', textAlign: 'center' }}>Date</th>
                <th style={{ width: '200px', textAlign: 'center' }}>Shift</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={3} className="reusable-table-no-records">No records found</td></tr>
              ) : (
                entries.map((record, idx) => (
                  <tr
                    key={record._id || idx}
                    onClick={() => { setCurrentIndex(idx); setShowEntryTable(false); }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: idx === currentIndex ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'center' }}>{formatDate(record.date)}</td>
                    <td style={{ textAlign: 'center' }}>{record.shift || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Primary Section */}
      {!loading && !showEntryTable && entries.length > 0 && (
        <>
          <h3 className="primary-heading">
            Primary {currentEntry?.shift ? `( ${currentEntry.shift} )` : ''}
          </h3>
          <div className="primary-details" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="primary-detail-item">
              <span className="detail-label">Incharge</span>
              <span className="detail-value">{currentEntry?.incharge ? currentEntry.incharge : '-'}</span>
            </div>
            <div className="primary-detail-item">
              <span className="detail-label">PP Operator</span>
              <span className="detail-value">{currentEntry?.ppOperator ? currentEntry.ppOperator : '-'}</span>
            </div>
            <div className="primary-detail-item">
              <span className="detail-label">Members Present</span>
              <span className="detail-value">
                {currentEntry?.members && currentEntry.members.length > 0
                  ? currentEntry.members.slice(0, 4).map(member => member.name || member).join(', ')
                  : '-'}
              </span>
            </div>
          </div>

          {/* Production Table */}
          <h3 className="section-heading">Production</h3>
          <Table
            columns={productionColumns}
            data={getProductionDataWithTotals()}
            noDataMessage="No production data available"
            minWidth={1200}
            striped={true}
            bordered={true}
          />

          {/* Next Shift Plan Table */}
          <h3 className="section-heading">Next Shift Plan</h3>
          <Table
            columns={nextShiftPlanColumns}
            data={currentEntry?.nextShiftPlanTable ? currentEntry.nextShiftPlanTable : []}
            noDataMessage="No next shift plan data available"
            minWidth={800}
            striped={true}
            bordered={true}
          />

          {/* Delays Table */}
          <h3 className="section-heading">Delays</h3>
          <Table
            columns={delaysColumns}
            data={getDelaysDataWithTotals()}
            noDataMessage="No delays data available"
            minWidth={900}
            striped={true}
            bordered={true}
          />

          {/* Mould Hardness Table */}
          <h3 className="section-heading">Mould Hardness</h3>
          {renderMouldHardnessTable()}

          {/* Pattern Temperature Table */}
          <h3 className="section-heading">Pattern Temperature</h3>
          <Table
            columns={patternTempColumns}
            data={currentEntry?.patternTempTable ? currentEntry.patternTempTable : []}
            noDataMessage="No pattern temperature data available"
            minWidth={700}
            striped={true}
            bordered={true}
          />

          {/* Significant Events & Maintenance */}
          <h3 className="primary-heading">Significant Events & Maintenance</h3>
          <div className="primary-details" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            <div className="primary-detail-item" style={{ minHeight: 'auto' }}>
              <span className="detail-label">Significant Event</span>
              <span className="detail-value" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: 'auto' }}>
                {currentEntry?.significantEvent ? currentEntry.significantEvent : '-'}
              </span>
            </div>
            <div className="primary-detail-item" style={{ minHeight: 'auto' }}>
              <span className="detail-label">Maintenance</span>
              <span className="detail-value" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: 'auto' }}>
                {currentEntry?.maintenance ? currentEntry.maintenance : '-'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="primary-detail-item" style={{ maxWidth: '350px', flex: '0 0 auto' }}>
              <span className="detail-label">Supervisor Name</span>
              <span className="detail-value">
                {currentEntry?.supervisorName ? currentEntry.supervisorName : '-'}
              </span>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default DisamaticProductReport;
