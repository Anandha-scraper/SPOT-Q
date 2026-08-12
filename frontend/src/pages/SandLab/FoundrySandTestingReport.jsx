import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpenCheck, ChevronLeft, ChevronRight, Table2, PencilLine, Save, Trash2, X } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { AlertDialog, ExcelDownloadDialog, useToast } from '../../Components/alert';
import { FilterButton, ClearButton, DeviationToggleButton, ExcelDownloadButton, FilterDisaDropdown } from '../../Components/Buttons';
import Table from '../../Components/Table';
import { exportWorkbookToExcel, getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { isDeviant } from '../../utils/formValidation';
import { validationRanges as foundrySandValidationRanges } from '../../deviations/DfoundrySandTestingNote';
import '../../styles/ComponentStyles/Table.css';
import '../../styles/PageStyles/Sandlab/FoundrySandTestingReport.css';

// paramConfig/additionalParamKeys keys -> Info.jsx rule display name, for the
// parameters that actually declare a min/max worth flagging as a deviation.
const TEST_PARAM_KEY_TO_RULE_FIELD = {
  compactability: 'Compactability',
  permeability: 'Permeability',
  wts: 'WTS',
  moisture: 'Moisture'
};
const ADDITIONAL_KEY_TO_RULE_FIELD = {
  afsNo: 'AFS No.',
  fines: 'Fines'
};
const CLAY_PARAM_TO_RULE_FIELD = {
  totalClay: 'Total Clay (Solution %)',
  activeClay: 'Active Clay (Solution %)',
  deadClay: 'Dead Clay (Solution %)',
  vcm: 'VCM (Solution %)',
  loi: 'LOI (Solution %)'
};

const SHIFT_OPTIONS = ['Shift 1', 'Shift 2', 'Shift 3'];
const PLANT_OPTIONS = ['Eirich', 'Disa', 'Foundry-A'];

const navButtonStyle = (disabled) => ({
  display: 'flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.5rem 0.75rem', borderRadius: '8px', border: '2px solid #5B9AA9',
  background: '#fff', color: disabled ? '#94a3b8' : '#5B9AA9', borderColor: disabled ? '#cbd5e1' : '#5B9AA9',
  cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem'
});

const FoundrySandTestingReport = () => {
  const { isAdmin, user, editWindowMs } = useAuth();
  const { toast } = useToast();
  const [showDeviations, setShowDeviations] = useState(false);
  const ruleByField = useMemo(() => {
    const map = {};
    foundrySandValidationRanges.forEach((r) => { map[r.field] = r; });
    return map;
  }, []);
  const isFieldDeviant = (ruleFieldName, value) => {
    if (!showDeviations || !isAdmin || !ruleFieldName) return false;
    const rule = ruleByField[ruleFieldName];
    return Boolean(rule && isDeviant(rule, value));
  };
  const getCurrentDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [entries, setEntries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEntryTable, setShowEntryTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getCurrentDate());
  const [isFiltered, setIsFiltered] = useState(false);        // true once a range filter runs
  const [shiftFilter, setShiftFilter] = useState('All');
  const [plantFilter, setPlantFilter] = useState('All');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // In-memory cache (per session) of single-date fetches, keyed by YYYY-MM-DD
  const cacheRef = useRef({});

  const applyEntryFilters = (list) => list.filter((e) =>
    (shiftFilter === 'All' || e.shift === shiftFilter) &&
    (plantFilter === 'All' || e.sandPlant === plantFilter)
  );

  const sortEntries = (list) => [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.shift !== b.shift) return String(a.shift).localeCompare(String(b.shift));
    return String(a.sandPlant).localeCompare(String(b.sandPlant));
  });

  useEffect(() => { fetchSingleDate(getCurrentDate()); }, []);

  // Fetch a single date's records (uses the in-memory cache for instant re-view)
  const fetchSingleDate = async (date) => {
    setError('');
    setCurrentIndex(0);
    setShowEntryTable(false);

    if (cacheRef.current[date] !== undefined) {
      setEntries(applyEntryFilters(cacheRef.current[date]));
      return;
    }

    setLoading(true);
    try {
      const url = `${API_ENDPOINTS.foundrySandTestingNotes}?startDate=${encodeURIComponent(date)}&endDate=${encodeURIComponent(date)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = sortEntries((data.success && Array.isArray(data.data)) ? data.data : []);
      cacheRef.current[date] = list;
      setEntries(applyEntryFilters(list));
    } catch (err) {
      console.error('Error fetching data:', err);
      setEntries([]);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a date range
  const fetchRange = async (from, to) => {
    setLoading(true);
    setError('');
    setCurrentIndex(0);
    setShowEntryTable(false);
    try {
      const url = `${API_ENDPOINTS.foundrySandTestingNotes}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = sortEntries((data.success && Array.isArray(data.data)) ? data.data : []);
      const filtered = applyEntryFilters(list);
      setEntries(filtered);
      if (filtered.length === 0) setError('No data found for the selected filters');
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
      if (new Date(to) < new Date(fromDate)) { toast.error('To date cannot be before From date'); return; }
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
    setShiftFilter('All');
    setPlantFilter('All');
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

  // ─── Inline edit (report page, not the entry-form's popup EditEntryModal) ───
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState({}); // `${section}|${testNum}|${fieldPath}` -> pending value
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Navigating to a different entry (or back to the combinations table) must
  // never carry stale pending edits over to whatever's shown next.
  useEffect(() => {
    setEditMode(false);
    setEdits({});
  }, [currentIndex, showEntryTable]);

  const editKey = (section, testNum, fieldPath) => `${section}|${testNum}|${fieldPath}`;
  const getEditValue = (section, testNum, fieldPath, fallback) => {
    const key = editKey(section, testNum, fieldPath);
    return edits[key] !== undefined ? edits[key] : (fallback ?? '');
  };
  const setEditValue = (section, testNum, fieldPath, value) => {
    setEdits((prev) => ({ ...prev, [editKey(section, testNum, fieldPath)]: value }));
  };

  // A single-value cell (sieve/test-parameter/additional-data): plain text in
  // read mode, a text input wired to the pending-edits map in edit mode.
  const editableCell = (section, testNum, fieldPath, currentValue, extraStyle) => {
    if (editMode) {
      return (
        <input
          type="text"
          value={getEditValue(section, testNum, fieldPath, currentValue)}
          onChange={(e) => setEditValue(section, testNum, fieldPath, e.target.value)}
          style={{ width: '70px', padding: '0.3rem', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', ...extraStyle }}
        />
      );
    }
    return <span style={{ color: '#475569', ...extraStyle }}>{currentValue || '-'}</span>;
  };

  // Not every editable field is test1/test2-scoped — Compactability/Shear
  // Strength Setting are flat entry-level columns. `section: 'top'` is a
  // sentinel buildEditsPayload recognizes to assign straight onto the body
  // instead of nesting under body[section][testNum].
  const editableTopCell = (fieldName, currentValue, extraStyle) => editableCell('top', fieldName, '', currentValue, extraStyle);

  function setNestedPath(target, path, value) {
    const parts = path.split('.');
    let node = target;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
  }

  // Sieve Testing's Total row is always derived, never typed — matches the
  // entry form's sumSieveColumn, reading the *current* (edited-or-original)
  // value of each of the 11 sieve rows rather than what was last saved.
  const computeSieveTotal = (record, testNum, group) => {
    let sum = 0;
    let hasAny = false;
    sieveData.forEach((r) => {
      const key = group === 'mf' ? r.mf : r.size;
      const original = record.sieveTesting?.[testNum]?.[group]?.[key];
      const current = getEditValue('sieveTesting', testNum, `${group}.${key}`, original);
      const n = parseFloat(current);
      if (!isNaN(n)) { sum += n; hasAny = true; }
    });
    if (!hasAny) return '';
    return Number.isInteger(sum) ? String(sum) : String(parseFloat(sum.toFixed(2)));
  };

  const buildEditsPayload = () => {
    const body = {};
    Object.entries(edits).forEach(([key, value]) => {
      const [section, testNum, fieldPath] = key.split('|');
      if (section === 'top') { body[testNum] = value; return; }
      body[section] = body[section] || {};
      body[section][testNum] = body[section][testNum] || {};
      setNestedPath(body[section][testNum], fieldPath, value);
    });

    // Total is derived — recompute and include it whenever any row feeding
    // into that column actually changed, same as the entry form's submit.
    ['test1', 'test2'].forEach((testNum) => {
      ['sieveSize', 'mf'].forEach((group) => {
        const touched = sieveData.some((r) => {
          const key = group === 'mf' ? r.mf : r.size;
          return edits[editKey('sieveTesting', testNum, `${group}.${key}`)] !== undefined;
        });
        if (!touched || !currentEntry) return;
        const total = computeSieveTotal(currentEntry, testNum, group);
        body.sieveTesting = body.sieveTesting || {};
        body.sieveTesting[testNum] = body.sieveTesting[testNum] || {};
        setNestedPath(body.sieveTesting[testNum], `${group}.total`, total);
      });
    });

    // Clay solution is derived — recompute and include it whenever any of its
    // inputs changed, same as the entry form storing `solution` alongside inputs.
    ['test1', 'test2'].forEach((testNum) => {
      clayParamKeys.forEach((param) => {
        const touched = ['input1', 'input2', 'input3'].some((inputKey) => (
          edits[editKey('clayTests', testNum, `${param}.${inputKey}`)] !== undefined
        ));
        if (!touched || !currentEntry) return;
        const original = currentEntry.clayTests?.[testNum]?.[param];
        const liveValues = {
          input1: getEditValue('clayTests', testNum, `${param}.input1`, original?.input1),
          input2: getEditValue('clayTests', testNum, `${param}.input2`, original?.input2),
          input3: getEditValue('clayTests', testNum, `${param}.input3`, original?.input3),
        };
        const solution = computeSolution(param, liveValues);
        body.clayTests = body.clayTests || {};
        body.clayTests[testNum] = body.clayTests[testNum] || {};
        setNestedPath(body.clayTests[testNum], `${param}.solution`, solution);
      });
    });

    return body;
  };

  // Same rule as EntryActions.jsx: admin bypasses entirely; otherwise the
  // creator, within editWindowMs of createdAt.
  const canEditEntry = (entry) => {
    if (!entry) return false;
    if (isAdmin) return true;
    const isOwner = entry.createdBy && user?.id && String(entry.createdBy) === String(user.id);
    const createdMs = entry.createdAt ? new Date(entry.createdAt).getTime() : null;
    if (!isOwner || !createdMs) return false;
    return (editWindowMs - (Date.now() - createdMs)) > 0;
  };
  const canDeleteEntry = () => isAdmin;

  const handleSaveEdits = async () => {
    if (!currentEntry?._id) return;
    if (Object.keys(edits).length === 0) { setEditMode(false); return; }
    setSaving(true);
    try {
      const body = buildEditsPayload();
      const res = await fetch(`${API_ENDPOINTS.foundrySandTestingNotes}/${currentEntry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setEntries((prev) => prev.map((e, i) => (i === currentIndex ? data.data : e)));
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
      const res = await fetch(`${API_ENDPOINTS.foundrySandTestingNotes}/${currentEntry._id}`, {
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
    const isSimple = param === "activeClay" || param === "deadClay";
    const operator = param === "activeClay" ? "x" : "-";

    if (editMode) {
      const inputStyle = { width: '55px', padding: '0.3rem', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' };
      const liveValues = {
        input1: getEditValue('clayTests', testNum, `${param}.input1`, data?.input1),
        input2: getEditValue('clayTests', testNum, `${param}.input2`, data?.input2),
        input3: getEditValue('clayTests', testNum, `${param}.input3`, data?.input3),
      };
      const liveSolution = computeSolution(param, liveValues);
      return (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input type="number" step="0.01" value={liveValues.input1} onChange={(e) => setEditValue('clayTests', testNum, `${param}.input1`, e.target.value)} style={inputStyle} />
          <span>{operator}</span>
          <input type="number" step="0.01" value={liveValues.input2} onChange={(e) => setEditValue('clayTests', testNum, `${param}.input2`, e.target.value)} style={inputStyle} />
          {!isSimple && (
            <>
              <span>/</span>
              <input type="number" step="0.01" value={liveValues.input3} onChange={(e) => setEditValue('clayTests', testNum, `${param}.input3`, e.target.value)} style={inputStyle} />
            </>
          )}
          <span>=</span>
          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' }}>{liveSolution || '0'}%</span>
        </div>
      );
    }

    if (!data) return <span style={{ color: '#94a3b8' }}>-</span>;

    const solution = computeSolution(param, data) || data.solution || '0';
    const solutionDeviant = isFieldDeviant(CLAY_PARAM_TO_RULE_FIELD[param], solution);
    const solutionStyle = { color: '#10b981', fontWeight: 600, fontSize: '0.9375rem' };

    if (isSimple) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ minWidth: '50px', textAlign: 'center', color: '#475569' }}>{data.input1 || '-'}</span>
          <span>{operator}</span>
          <span style={{ minWidth: '50px', textAlign: 'center', color: '#475569' }}>{data.input2 || '-'}</span>
          <span>=</span>
          <span className={solutionDeviant ? 'deviation-flag' : undefined} style={solutionStyle}>{solution}%</span>
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
        <span className={solutionDeviant ? 'deviation-flag' : undefined} style={solutionStyle}>{solution}%</span>
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

    if (isTotal) {
      const group = (colKey === 'wtTest1' || colKey === 'wtTest2') ? 'sieveSize' : 'mf';
      const testNum = (colKey === 'wtTest1' || colKey === 'prodTest1') ? 'test1' : 'test2';
      if (colKey === 'wtTest1' || colKey === 'wtTest2' || colKey === 'prodTest1' || colKey === 'prodTest2') {
        return <span style={{ ...cellStyle, fontWeight: 700 }}>{computeSieveTotal(record, testNum, group) || '-'}</span>;
      }
    }

    if (colKey === 'wtTest1') return editableCell('sieveTesting', 'test1', `sieveSize.${sizeKey}`, record.sieveTesting?.test1?.sieveSize?.[sizeKey], cellStyle);
    if (colKey === 'wtTest2') return editableCell('sieveTesting', 'test2', `sieveSize.${sizeKey}`, record.sieveTesting?.test2?.sieveSize?.[sizeKey], cellStyle);
    if (colKey === 'prodTest1') return editableCell('sieveTesting', 'test1', `mf.${mfKey}`, record.sieveTesting?.test1?.mf?.[mfKey], cellStyle);
    if (colKey === 'prodTest2') return editableCell('sieveTesting', 'test2', `mf.${mfKey}`, record.sieveTesting?.test2?.mf?.[mfKey], cellStyle);
    return null;
  };

  const renderTestParamCell = (record) => (rowIndex, colIndex, colKey) => {
    const paramConfig = testParamConfig[rowIndex];
    if (colKey === 'parameter') {
      return <strong style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>{paramConfig.label}</strong>;
    }
    const val = record.parameters?.[colKey]?.[paramConfig.key];
    if (editMode) return editableCell('parameters', colKey, paramConfig.key, val);
    return <span style={{ color: '#475569' }}>{val || '-'}</span>;
  };

  // Mirrors renderTestParamCell's own lookup — passed to <Table renderCellClassName>
  // so the whole <td> tints yellow (td.deviation-flag) instead of a pill around the text.
  const testParamCellClass = (record) => (rowIndex, colIndex, colKey) => {
    if (editMode || colKey === 'parameter') return undefined;
    const paramConfig = testParamConfig[rowIndex];
    const val = record.parameters?.[colKey]?.[paramConfig.key];
    return isFieldDeviant(TEST_PARAM_KEY_TO_RULE_FIELD[paramConfig.key], val) ? 'deviation-flag' : undefined;
  };

  const renderAdditionalCell = (record) => (rowIndex, colIndex, colKey) => {
    const param = additionalParamKeys[rowIndex];
    if (colKey === 'parameter') {
      return <strong style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>{additionalParamLabels[rowIndex]}</strong>;
    }
    const val = record.additionalData?.[colKey]?.[param];
    if (editMode) return editableCell('additionalData', colKey, param, val);
    return <span style={{ color: '#475569' }}>{val || '-'}</span>;
  };

  const additionalCellClass = (record) => (rowIndex, colIndex, colKey) => {
    if (editMode || colKey === 'parameter') return undefined;
    const param = additionalParamKeys[rowIndex];
    const val = record.additionalData?.[colKey]?.[param];
    return isFieldDeviant(ADDITIONAL_KEY_TO_RULE_FIELD[param], val) ? 'deviation-flag' : undefined;
  };

  // ─── Detail view for a single record — always exactly one at a time ───
  const renderDetail = (record) => (
    <div>
      {/* Info box — Date/Shift/Sand Plant already shown in the header, only the
          settings/remarks fields (with no other home) render here. */}
      {(editMode || record.compactibilitySetting || record.shearStrengthSetting || record.remarks) && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          {(editMode || record.compactibilitySetting) && (
            <div>
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Compactability Setting</span>
              <div style={{ fontWeight: 500, color: '#1e293b' }}>{editableTopCell('compactibilitySetting', record.compactibilitySetting)}</div>
            </div>
          )}
          {(editMode || record.shearStrengthSetting) && (
            <div>
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Shear/Mould Strength Setting</span>
              <div style={{ fontWeight: 500, color: '#1e293b' }}>{editableTopCell('shearStrengthSetting', record.shearStrengthSetting)}</div>
            </div>
          )}
          {record.remarks && (
            <div>
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Remarks</span>
              <div style={{ fontWeight: 500, color: '#1e293b' }}>{record.remarks}</div>
            </div>
          )}
        </div>
      )}

      {/* Clay Parameters */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Clay Parameters</h3></div>
      <Table template bordered rows={5} minWidth={800} columns={clayColumns} renderCell={renderClayCell(record)} />

      {/* Sieve Testing */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Sieve Testing</h3></div>
      <Table template bordered rows={sieveData.length + 1} minWidth={900} columns={sieveColumns} renderCell={renderSieveCell(record)} />

      {/* Test Parameters */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Test Parameters</h3></div>
      <Table template bordered rows={11} minWidth={800} columns={testParamColumns} renderCell={renderTestParamCell(record)} renderCellClassName={testParamCellClass(record)} />

      {/* Additional Data */}
      <div className="foundry-section-header" style={{ marginTop: '1.5rem' }}><h3>Additional Data</h3></div>
      <Table template bordered rows={3} minWidth={800} columns={additionalColumns} renderCell={renderAdditionalCell(record)} renderCellClassName={additionalCellClass(record)} />
    </div>
  );

  // ─── Combination table columns (the "Table" nav button's view) ───
  const summaryColumns = [
    { key: 'sno', label: 'S.No', width: '70px', align: 'center' },
    { key: 'date', label: 'Date', width: '150px', align: 'center' },
    { key: 'shift', label: 'Shift', width: '100px', align: 'center' },
    { key: 'sandPlant', label: 'Sand Plant', width: '150px', align: 'center' }
  ];

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
      const url = `${API_ENDPOINTS.foundrySandTestingNotes}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      let records = (data.success && Array.isArray(data.data)) ? data.data : [];
      records = applyEntryFilters(records);
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (records.length === 0) { toast.error('No data to export for the selected range.'); return; }

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
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const currentEntry = entries[currentIndex];

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
        {currentEntry && !showEntryTable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontWeight: 600, color: '#1e293b' }}>
            <span>{formatDate(currentEntry.date)}</span>
            {currentEntry.shift && <span>{currentEntry.shift}</span>}
            {currentEntry.sandPlant && <span>Sand Plant: {currentEntry.sandPlant}</span>}
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
        <div className="foundry-sand-testing-filter-group">
          <label style={{ fontWeight: 600 }}>Shift</label>
          <FilterDisaDropdown
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            options={SHIFT_OPTIONS}
          />
        </div>
        <div className="foundry-sand-testing-filter-group">
          <label style={{ fontWeight: 600 }}>Sand Plant</label>
          <FilterDisaDropdown
            value={plantFilter}
            onChange={(e) => setPlantFilter(e.target.value)}
            options={PLANT_OPTIONS}
          />
        </div>
        <div className="foundry-sand-testing-filter-actions">
          <FilterButton onClick={handleFilter} disabled={loading} />
          <ClearButton onClick={handleClear} disabled={loading} />
          {isAdmin && (
            <DeviationToggleButton
              active={showDeviations}
              onClick={() => setShowDeviations((prev) => !prev)}
            />
          )}
          {entries.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={showEntryTable || currentIndex === 0}
                style={navButtonStyle(showEntryTable || currentIndex === 0)}
                title="Previous"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                type="button"
                onClick={() => setShowEntryTable((v) => !v)}
                style={{ ...navButtonStyle(false), ...(showEntryTable ? { background: '#5B9AA9', color: '#fff' } : {}) }}
                title="Show combinations table"
              >
                <Table2 size={16} /> Table
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(entries.length - 1, i + 1))}
                disabled={showEntryTable || currentIndex === entries.length - 1}
                style={navButtonStyle(showEntryTable || currentIndex === entries.length - 1)}
                title="Next"
              >
                Next <ChevronRight size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                {currentIndex + 1} / {entries.length}
              </span>
            </div>
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

      {/* Combination table — pick a Date/Shift/Sand Plant directly, or an empty table when no data is found */}
      {!loading && (showEntryTable || entries.length === 0) && (
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
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={summaryColumns.length} className="reusable-table-no-records">No records found</td>
                </tr>
              ) : entries.map((record, idx) => (
                <tr
                  key={record._id || idx}
                  onClick={() => { setCurrentIndex(idx); setShowEntryTable(false); }}
                  style={{ cursor: 'pointer', backgroundColor: idx === currentIndex ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx === currentIndex ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                >
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{idx + 1}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{formatDate(record.date)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{record.shift || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{record.sandPlant || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail view — exactly one record's data at a time */}
      {!loading && !showEntryTable && entries.length > 0 && currentEntry && renderDetail(currentEntry)}
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


    </div>
  );
};

export default FoundrySandTestingReport;
