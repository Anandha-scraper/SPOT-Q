import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PencilLine, Trash2, BookOpenCheck, ChevronLeft, ChevronRight, Table2, Save, X } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { AlertDialog, ExcelDownloadDialog, useToast } from '../../Components/alert';
import { FilterButton, ClearButton, DeviationToggleButton, ExcelDownloadButton, FilterDisaDropdown, PlusButton, MinusButton } from '../../Components/Buttons';
import Table from '../../Components/Table';
import { exportWorkbookToExcel, getExportRange, MAX_EXPORT_DAYS } from '../../utils/exportToExcel';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { isDeviant } from '../../utils/formValidation';
import { validationRanges as sandTestingValidationRanges } from '../../deviations/DsandTestingRecord';
import '../../styles/ComponentStyles/Table.css';
import '../../styles/PageStyles/Sandlab/SandTestingRecordReport.css';

// Table 5 report-row key -> Info.jsx rule display name, for the columns that
// actually declare a min/max worth flagging as a deviation.
const TABLE5_KEY_TO_RULE_FIELD = {
  permeability: 'Permeability',
  gcsFdyA: 'G.C.S FDY-A',
  gcsFdyB: 'G.C.S FDY-B',
  wts: 'WTS',
  moisture: 'Moisture',
  compactability: 'Compactability At Dmm',
  compressibility: 'Compressability At Dmm',
  waterLitre: 'Water Litre/Kg Mix',
  sandTempBC: 'Sand Temp BC',
  sandTempWU: 'Sand Temp WU',
  sandTempSSU: 'Sand Temp SSU',
  newSandKgs: 'New Sand Kgs/Mould',
  bentonite060Percent: 'Bentonite % (0.60-1.20 checkpoint)',
  bentonite080Percent: 'Bentonite % (0.80-2.20 checkpoint)',
  premixPercent: 'Premix % (Premix checkpoint)',
  coalDustPercent: 'Coal Dust % (CoalDust checkpoint)',
  compactabilitySettings: 'Compactability Setting Value',
  mouldStrength: 'Mould Strength Setting Value',
  preparedSandlumps: 'Prepared Sand Lumps/Kg'
};

const PLANT_OPTIONS = ['Eirich', 'Disa', 'Foundry-A'];

const navButtonStyle = (disabled) => ({
  display: 'flex', alignItems: 'center', gap: '0.25rem',
  padding: '0.5rem 0.75rem', borderRadius: '8px', border: '2px solid #5B9AA9',
  background: '#fff', color: disabled ? '#94a3b8' : '#5B9AA9', borderColor: disabled ? '#cbd5e1' : '#5B9AA9',
  cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem'
});

const SandTestingRecordReport = () => {
  const { isAdmin, user, editWindowMs } = useAuth();
  const { toast } = useToast();
  const [showDeviations, setShowDeviations] = useState(false);
  const ruleByField = useMemo(() => {
    const map = {};
    sandTestingValidationRanges.forEach((r) => { map[r.field] = r; });
    return map;
  }, []);
  const table5DevClass = (key, value) => {
    if (!showDeviations || !isAdmin) return undefined;
    const ruleFieldName = TABLE5_KEY_TO_RULE_FIELD[key];
    const rule = ruleFieldName && ruleByField[ruleFieldName];
    return rule && isDeviant(rule, value) ? 'deviation-flag' : undefined;
  };
  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(getCurrentDate()); // "To" defaults to today; "From" optional
  const [entries, setEntries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEntryTable, setShowEntryTable] = useState(false);
  const [plantFilter, setPlantFilter] = useState('All');

  // In-memory cache (per session) of range fetches, keyed by `${from}|${to}`
  const cacheRef = useRef({});

  const [isFiltered, setIsFiltered] = useState(false);
  const [table1Data, setTable1Data] = useState({
    table1a: {
      '0_1': [], '0_2': [], '0_3': [],
      '1_1': [], '1_2': [], '1_3': [],
      '2_1': [], '2_2': [], '2_3': [],
      '3_1': [], '3_2': [], '3_3': [],
      '4_1': [], '4_2': [], '4_3': []
    },
    table1b: {
      bentonite: '',
      batchType: '',
      value: ''
    }
  });

  const [table2Data, setTable2Data] = useState({
    '0_0': '', '0_1': '', '0_2': '',
    '1_0': '', '1_1': '', '1_2': '',
    '2_0': '', '2_1': '', '2_2': '',
    '3_0': '', '3_1': '', '3_2': '',
    '4_0': '', '4_1': '', '4_2': '',
    '5_0': '', '5_1': '', '5_2': '',
    '6_0': '', '6_1': '', '6_2': ''
  });

  const [table3Data, setTable3Data] = useState({
    '0_0': [], '0_1': [], '0_2': [], '0_3': [], '0_4': [],
    '1_0': [], '1_1': [], '1_2': [], '1_3': [], '1_4': [],
    '2_0': [], '2_1': [], '2_2': [], '2_3': [], '2_4': []
  });

  const [table4Data, setTable4Data] = useState({
    sandLump: '',
    newSandWt: '',
    friabilityShiftI: '',
    friabilityShiftII: '',
    friabilityShiftIII: ''
  });

  const [table5Data, setTable5Data] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const applyPlantFilter = (list) => plantFilter === 'All' ? list : list.filter((r) => r.plant === plantFilter);

  // Function to process and set record data
  const processRecordData = (record) => {
    if (record) {
      // Map sandShifts to table1Data
      if (record.sandShifts) {
          const shifts = record.sandShifts;
          setTable1Data({
            table1a: {
              '0_1': shifts.shiftI?.rSand || [],
              '0_2': shifts.shiftII?.rSand || [],
              '0_3': shifts.shiftIII?.rSand || [],
              '1_1': shifts.shiftI?.nSand || [],
              '1_2': shifts.shiftII?.nSand || [],
              '1_3': shifts.shiftIII?.nSand || [],
              '2_1': shifts.shiftI?.mixingMode || [],
              '2_2': shifts.shiftII?.mixingMode || [],
              '2_3': shifts.shiftIII?.mixingMode || [],
              '3_1': shifts.shiftI?.bentonite || [],
              '3_2': shifts.shiftII?.bentonite || [],
              '3_3': shifts.shiftIII?.bentonite || [],
              '4_1': shifts.shiftI?.coalDustPremix || [],
              '4_2': shifts.shiftII?.coalDustPremix || [],
              '4_3': shifts.shiftIII?.coalDustPremix || []
            },
            table1b: {
              bentonite: shifts.batchNo?.bentonite || '',
              coalDust: shifts.batchNo?.coalDust || '',
              premix: shifts.batchNo?.premix || '',
              batchType: (shifts.batchNo?.coalDust && shifts.batchNo.coalDust.trim() !== '') ? 'coalDust' : ((shifts.batchNo?.premix && shifts.batchNo.premix.trim() !== '') ? 'premix' : ''),
              value: shifts.batchNo?.coalDust || shifts.batchNo?.premix || ''
            }
          });
        }

        // Map clayShifts to table2Data
        if (record.clayShifts) {
          const clay = record.clayShifts;
          setTable2Data({
            '0_0': clay.shiftI?.totalClay || '',
            '0_1': clay.ShiftII?.totalClay || '',
            '0_2': clay.ShiftIII?.totalClay || '',
            '1_0': clay.shiftI?.activeClay || '',
            '1_1': clay.ShiftII?.activeClay || '',
            '1_2': clay.ShiftIII?.activeClay || '',
            '2_0': clay.shiftI?.deadClay || '',
            '2_1': clay.ShiftII?.deadClay || '',
            '2_2': clay.ShiftIII?.deadClay || '',
            '3_0': clay.shiftI?.vcm || '',
            '3_1': clay.ShiftII?.vcm || '',
            '3_2': clay.ShiftIII?.vcm || '',
            '4_0': clay.shiftI?.loi || '',
            '4_1': clay.ShiftII?.loi || '',
            '4_2': clay.ShiftIII?.loi || '',
            '5_0': clay.shiftI?.afsNo || '',
            '5_1': clay.ShiftII?.afsNo || '',
            '5_2': clay.ShiftIII?.afsNo || '',
            '6_0': clay.shiftI?.fines || '',
            '6_1': clay.ShiftII?.fines || '',
            '6_2': clay.ShiftIII?.fines || ''
          });
        }

        // Map mixshifts to table3Data
        if (record.mixshifts) {
          const mix = record.mixshifts;
          setTable3Data({
            '0_0': mix.ShiftI?.mixno?.start || [],
            '0_1': mix.ShiftI?.mixno?.end || [],
            '0_2': mix.ShiftI?.mixno?.total || [],
            '0_3': mix.ShiftI?.numberOfMixRejected || [],
            '0_4': mix.ShiftI?.returnSandHopperLevel || [],
            '1_0': mix.ShiftII?.mixno?.start || [],
            '1_1': mix.ShiftII?.mixno?.end || [],
            '1_2': mix.ShiftII?.mixno?.total || [],
            '1_3': mix.ShiftII?.numberOfMixRejected || [],
            '1_4': mix.ShiftII?.returnSandHopperLevel || [],
            '2_0': mix.ShiftIII?.mixno?.start || [],
            '2_1': mix.ShiftIII?.mixno?.end || [],
            '2_2': mix.ShiftIII?.mixno?.total || [],
            '2_3': mix.ShiftIII?.numberOfMixRejected || [],
            '2_4': mix.ShiftIII?.returnSandHopperLevel || []
          });
        }

        // Map sand friability data to table4Data
        setTable4Data({
          sandLump: record.sandLump || '',
          newSandWt: record.newSandWt || '',
          friabilityShiftI: record.sandFriability?.shiftI || '',
          friabilityShiftII: record.sandFriability?.shiftII || '',
          friabilityShiftIII: record.sandFriability?.shiftIII || ''
        });

        // Map testParameter to table5Data
        if (record.testParameter && Array.isArray(record.testParameter)) {
          const formattedTable5 = record.testParameter.map((item, index) => {
            // Convert time from number format (e.g., 830) to display format (e.g., "08:30 AM").
            // '-' is the "never entered" sentinel (see SandTestingRecord.jsx's
            // handleTable5Submit) and must short-circuit before the numeric
            // path, or Math.floor('-' / 100) silently produces NaN.
            const formatTime = (timeVal) => {
              if (!timeVal || timeVal === '-') return '';
              const timeNum = Number(timeVal);
              if (!timeNum || isNaN(timeNum)) return '';
              const hour = Math.floor(timeNum / 100);
              const minute = timeNum % 100;
              const period = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
              return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
            };

            return {
              _id: item._id,
              sno: item.sno || index + 1,
              time: formatTime(item.time),
              timeRaw: item.time || '-',
              mixNo: item.mixno || '',
              permeability: item.permeability || '',
              gcsFdyA: item.gcsFdyA || '-',
              gcsFdyB: item.gcsFdyB || '-',
              wts: item.wts || '',
              moisture: item.moisture || '',
              compactability: item.compactability || '',
              compressibility: item.compressibility || '',
              waterLitre: item.waterLitre || '',
              // These (and Bentonite/Premix/Coal Dust/Compactability Settings below)
              // are nested only in the entry form's *write* payload — the API's
              // read/wire shape is flat, matching the Prisma column names directly.
              sandTempBC: item.sandTempBC || '',
              sandTempWU: item.sandTempWU || '',
              sandTempSSU: item.sandTempSSUmax || '',
              newSandKgs: item.newSandKgs || '',
              bentoniteWithPremixKgs: item.bentoniteWithPremixKgs || '',
              bentoniteWithPremixPercent: item.bentoniteWithPremixPercent || '',
              bentoniteKgs: item.bentoniteKgs || '-',
              bentonitePercent: item.bentonitePercent || '-',
              bentoniteCheckpoint: item.bentoniteCheckpoint || '-',
              bentonite060Kgs: item.bentoniteCheckpoint === '0.60-1.20' ? (item.bentoniteKgs || '-') : '-',
              bentonite060Percent: item.bentoniteCheckpoint === '0.60-1.20' ? (item.bentonitePercent || '-') : '-',
              bentonite080Kgs: item.bentoniteCheckpoint === '0.80-2.20' ? (item.bentoniteKgs || '-') : '-',
              bentonite080Percent: item.bentoniteCheckpoint === '0.80-2.20' ? (item.bentonitePercent || '-') : '-',
              premixKgs: item.premixKgs || '',
              premixPercent: item.premixPercent || '',
              coalDustKgs: item.coalDustKgs || '',
              coalDustPercent: item.coalDustPercent || '',
              lc: item.lc || '',
              compactabilitySettings: item.compactabilitySettings || '',
              mouldStrength: item.mouldStrength || '',
              shearStrengthSetting: item.shearStrengthSetting || '',
              preparedSandlumps: item.preparedSandlumps || '',
              itemName: item.itemName || '',
              remarks: item.remarks || ''
            };
          });
          setTable5Data(formattedTable5);
        }
      }
  };

  // ─── Inline edit (report page, not the entry-form's popup EditEntryModal) ───
  // A non-destructive `edits` map layered on top of the read-only table1Data..
  // table5Data — those stay exactly what processRecordData last computed, so
  // Cancel is just "discard the map," and Save reads both the map and the
  // untouched originals together to build the PUT payload.
  const currentEntry = entries[currentIndex];
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState({}); // cellKey -> pending string value
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditMode(false);
    setEdits({});
  }, [currentIndex, showEntryTable]);

  const getEdit = (cellKey, fallback) => (edits[cellKey] !== undefined ? edits[cellKey] : (fallback ?? ''));
  const setEdit = (cellKey, value) => setEdits((prev) => ({ ...prev, [cellKey]: value }));

  const editInputStyle = { width: '100%', padding: '8px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' };

  // Table 1a / Table 3's array-valued cells — one input per element plus
  // Plus/Minus (cap 4, floor 1), matching the entry form's addTableNInput /
  // removeTableNInput exactly instead of one joined "12 / 34" string.
  // `pairedKey`/`pairedOriginal` couple Table 3's Start/End columns so they
  // grow/shrink together (Total is index-paired against both).
  const getArrayEdit = (cellKey, originalValues) => (edits[cellKey] !== undefined ? edits[cellKey] : (originalValues || []));
  const setArrayEdit = (cellKey, values) => setEdits((prev) => ({ ...prev, [cellKey]: values }));

  // An unfilled Plus-added box must never be persisted as a real (blank)
  // array position — matches the entry form's own filterNonEmpty in
  // SandTestingRecord.jsx's saveTable1/saveTable3.
  const filterNonEmpty = (values) => (values || []).filter((v) => v !== undefined && v !== null && String(v).trim() !== '');

  const editableArrayCell = (cellKey, originalValues, pairedKey, pairedOriginal) => {
    if (!editMode) {
      return (originalValues && originalValues.length > 0) ? (
        <div style={{ display: 'grid', gridTemplateColumns: originalValues.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '8px' }}>
          {originalValues.map((v, i) => (
            <div key={i} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '1rem', fontWeight: '500', color: '#334155', minHeight: '20px', textAlign: 'center' }}>
              {v}
            </div>
          ))}
        </div>
      ) : <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>;
    }

    const current = getArrayEdit(cellKey, originalValues);
    const list = current.length > 0 ? current : [''];

    const updateAt = (idx, value) => {
      const next = [...list];
      next[idx] = value;
      setArrayEdit(cellKey, next);
    };
    const addOne = () => {
      if (list.length >= 4) return;
      setArrayEdit(cellKey, [...list, '']);
      if (pairedKey) {
        const pairedCurrent = getArrayEdit(pairedKey, pairedOriginal);
        const pairedList = pairedCurrent.length > 0 ? pairedCurrent : [''];
        if (pairedList.length < 4) setArrayEdit(pairedKey, [...pairedList, '']);
      }
    };
    const removeOne = () => {
      if (list.length <= 1) return;
      setArrayEdit(cellKey, list.slice(0, -1));
      if (pairedKey) {
        const pairedCurrent = getArrayEdit(pairedKey, pairedOriginal);
        const pairedList = pairedCurrent.length > 0 ? pairedCurrent : [''];
        if (pairedList.length > 1) setArrayEdit(pairedKey, pairedList.slice(0, -1));
      }
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: list.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '8px' }}>
        {list.map((v, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              value={v}
              onChange={(e) => updateAt(idx, e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1rem', textAlign: 'center', boxSizing: 'border-box' }}
            />
            {idx === list.length - 1 && list.length > 1 && (
              <MinusButton onClick={removeOne} title="Remove entry" />
            )}
            {idx === list.length - 1 && list.length < 4 && (
              <PlusButton onClick={addOne} title="Add entry" />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Mix Testing Total is always derived from Start/End (mirrors
  // SandTestingRecord.jsx's computeTable3Totals) — never a direct input, in
  // either mode. Reads the live edit buffer while editing so it stays in
  // sync with in-progress Plus/Minus/typed changes.
  const computeTable3Totals = (rowIndex) => {
    const startKey = `${rowIndex}_0`;
    const endKey = `${rowIndex}_1`;
    const startArr = editMode ? getArrayEdit(`table3_${startKey}`, table3Data[startKey]) : (table3Data[startKey] || []);
    const endArr = editMode ? getArrayEdit(`table3_${endKey}`, table3Data[endKey]) : (table3Data[endKey] || []);
    const len = Math.max(startArr.length, endArr.length);
    const totals = [];
    for (let i = 0; i < len; i += 1) {
      const s = parseFloat(startArr[i]);
      const e = parseFloat(endArr[i]);
      totals.push((!isNaN(s) && !isNaN(e)) ? String(e - s) : '');
    }
    return totals.length > 0 ? totals : [''];
  };

  const editableScalarCell = (cellKey, currentValue) => {
    if (editMode) {
      return <input type="text" value={getEdit(cellKey, currentValue)} onChange={(e) => setEdit(cellKey, e.target.value)} style={editInputStyle} />;
    }
    return <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '1rem', fontWeight: '500', color: '#334155', minHeight: '20px' }}>{currentValue || '-'}</div>;
  };

  // Table 5's plain <td> cells — no boxed background, matches that table's own style.
  const editableTd = (cellKey, currentValue) => {
    if (editMode) {
      return <input type="text" value={getEdit(cellKey, currentValue)} onChange={(e) => setEdit(cellKey, e.target.value)} style={{ width: '70px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} />;
    }
    return currentValue || '-';
  };

  // Packed HHMM (e.g. 830) or the '-' sentinel <-> the 24-hour "HH:MM" string
  // <input type="time"> speaks. A native time input avoids the AM/PM parsing
  // ambiguity a text field would reintroduce.
  const packedTimeToInputValue = (raw) => {
    if (!raw || raw === '-') return '';
    const num = Number(raw);
    if (isNaN(num)) return '';
    const hour = Math.floor(num / 100);
    const minute = num % 100;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };
  const inputValueToPackedTime = (hhmm) => {
    if (!hhmm) return '-';
    const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
    if (isNaN(h) || isNaN(m)) return '-';
    return String(h * 100 + m);
  };
  const editableTimeTd = (cellKey, displayValue, rawValue) => {
    if (editMode) {
      const inputValue = edits[cellKey] !== undefined ? edits[cellKey] : packedTimeToInputValue(rawValue);
      return <input type="time" value={inputValue} onChange={(e) => setEdit(cellKey, e.target.value)} style={{ padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} />;
    }
    return displayValue || '-';
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

  // Report-page key -> backend testParameter column, for the two names that
  // don't match 1:1 (sandTempSSU has no "max" suffix here; mixNo is
  // camelCase on the report but the DB/wire column is lowercase `mixno`).
  const TABLE5_KEY_TO_COLUMN = { mixNo: 'mixno', sandTempSSU: 'sandTempSSUmax' };
  const TABLE5_EDITABLE_KEYS = [
    'time', 'permeability', 'gcsFdyA', 'gcsFdyB', 'wts', 'moisture', 'compactability', 'compressibility',
    'waterLitre', 'sandTempBC', 'sandTempWU', 'sandTempSSU', 'newSandKgs',
    'bentoniteWithPremixKgs', 'bentoniteWithPremixPercent',
    'bentonite060Kgs', 'bentonite060Percent', 'bentonite080Kgs', 'bentonite080Percent',
    'premixKgs', 'premixPercent', 'coalDustKgs', 'coalDustPercent', 'lc',
    'compactabilitySettings', 'mouldStrength', 'shearStrengthSetting', 'preparedSandlumps',
    'mixNo', 'itemName', 'remarks',
  ];
  // Editing a derived Bentonite checkpoint cell retags the row's
  // bentoniteCheckpoint to that cell's checkpoint as a side effect — there's
  // no reject/no-op precedent anywhere else in this edit flow, so "I edited
  // the 0.80-2.20 Kgs cell" is taken to mean "this row's checkpoint is now
  // 0.80-2.20."
  const BENTONITE_CHECKPOINT_KEYS = {
    bentonite060Kgs: { checkpoint: '0.60-1.20', column: 'bentoniteKgs' },
    bentonite060Percent: { checkpoint: '0.60-1.20', column: 'bentonitePercent' },
    bentonite080Kgs: { checkpoint: '0.80-2.20', column: 'bentoniteKgs' },
    bentonite080Percent: { checkpoint: '0.80-2.20', column: 'bentonitePercent' },
  };

  const buildEditsPayload = () => {
    const leafEdits = [];
    const dayFieldEdits = {};
    const testParameterEdits = [];

    // Every leafEdits entry now carries the field's *entire current array*
    // (scalars are just a 1-element array) — the backend upserts positions
    // 0..values.length-1 and deletes anything left over beyond that length,
    // so this one shape covers a typed correction, a Plus-added position, and
    // a Minus-removed one uniformly. Array values are run through
    // filterNonEmpty first — an unfilled Plus-added box must never be
    // persisted as a real (blank) position, matching the entry form's own
    // saveTable1/saveTable3, which filter the exact same way before ever
    // appending.
    const TABLE1A_FIELDS = ['rSand', 'nSand', 'mixingMode', 'bentonite', 'coalDustPremix'];
    const TABLE1A_SHIFTS = ['shiftI', 'shiftII', 'shiftIII']; // colIndex 1,2,3
    TABLE1A_FIELDS.forEach((field, rowIndex) => {
      TABLE1A_SHIFTS.forEach((shiftKey, i) => {
        const key = `${rowIndex}_${i + 1}`;
        const cellKey = `table1a_${key}`;
        if (edits[cellKey] === undefined) return;
        leafEdits.push({ section: 'sandShifts', shiftKey, field, values: filterNonEmpty(getArrayEdit(cellKey, table1Data.table1a[key])) });
      });
    });

    if (edits.table1b_bentonite !== undefined) {
      leafEdits.push({ section: 'sandShifts', shiftKey: 'batchNo', field: 'bentonite', values: [edits.table1b_bentonite] });
    }
    const selectedBatchType = edits.table1b_batchType !== undefined ? edits.table1b_batchType : table1Data.table1b.batchType;
    if (edits.table1b_value !== undefined && selectedBatchType) {
      leafEdits.push({ section: 'sandShifts', shiftKey: 'batchNo', field: selectedBatchType, values: [edits.table1b_value] });
    }

    const TABLE2_FIELDS = ['totalClay', 'activeClay', 'deadClay', 'vcm', 'loi', 'afsNo', 'fines'];
    const TABLE2_SHIFTS = ['shiftI', 'ShiftII', 'ShiftIII'];
    TABLE2_FIELDS.forEach((field, rowIndex) => {
      TABLE2_SHIFTS.forEach((shiftKey, colIndex) => {
        const cellKey = `table2_${rowIndex}_${colIndex}`;
        if (edits[cellKey] === undefined) return;
        leafEdits.push({ section: 'clayShifts', shiftKey, field, values: [edits[cellKey]] });
      });
    });

    // Table 3: Start/End (cols 0/1) are user-editable arrays; Total (col 2)
    // is never sent as a direct edit — it's derived and only included
    // (computed fresh) when its own Start or End was touched, same as the
    // entry form's buildTable3TotalsForSubmit: filter Start and End
    // independently, then pair by the *shorter* filtered length, so a
    // half-filled Plus-added pair never produces a bogus Total. Rejected/
    // Hopper (cols 3/4) are independent arrays.
    const TABLE3_SHIFTS = ['ShiftI', 'ShiftII', 'ShiftIII'];
    TABLE3_SHIFTS.forEach((shiftKey, rowIndex) => {
      const startKey = `${rowIndex}_0`;
      const endKey = `${rowIndex}_1`;
      const startCellKey = `table3_${startKey}`;
      const endCellKey = `table3_${endKey}`;
      const startTouched = edits[startCellKey] !== undefined;
      const endTouched = edits[endCellKey] !== undefined;

      const filteredStart = filterNonEmpty(getArrayEdit(startCellKey, table3Data[startKey]));
      const filteredEnd = filterNonEmpty(getArrayEdit(endCellKey, table3Data[endKey]));

      if (startTouched) {
        leafEdits.push({ section: 'mixshifts', shiftKey, field: 'mixno.start', values: filteredStart });
      }
      if (endTouched) {
        leafEdits.push({ section: 'mixshifts', shiftKey, field: 'mixno.end', values: filteredEnd });
      }
      if (startTouched || endTouched) {
        const pairLen = Math.min(filteredStart.length, filteredEnd.length);
        const totals = [];
        for (let i = 0; i < pairLen; i += 1) {
          const s = parseFloat(filteredStart[i]);
          const e = parseFloat(filteredEnd[i]);
          if (!isNaN(s) && !isNaN(e)) totals.push(String(e - s));
        }
        leafEdits.push({ section: 'mixshifts', shiftKey, field: 'mixno.total', values: totals });
      }

      [['numberOfMixRejected', 3], ['returnSandHopperLevel', 4]].forEach(([field, colIndex]) => {
        const key = `${rowIndex}_${colIndex}`;
        const cellKey = `table3_${key}`;
        if (edits[cellKey] === undefined) return;
        leafEdits.push({ section: 'mixshifts', shiftKey, field, values: filterNonEmpty(getArrayEdit(cellKey, table3Data[key])) });
      });
    });

    if (edits.table4_sandLump !== undefined) dayFieldEdits.sandLump = edits.table4_sandLump;
    if (edits.table4_newSandWt !== undefined) dayFieldEdits.newSandWt = edits.table4_newSandWt;
    const FRIABILITY_SHIFTS = { friabilityShiftI: 'shiftI', friabilityShiftII: 'shiftII', friabilityShiftIII: 'shiftIII' };
    Object.entries(FRIABILITY_SHIFTS).forEach(([fieldName, shiftKey]) => {
      const cellKey = `table4_${fieldName}`;
      if (edits[cellKey] === undefined) return;
      leafEdits.push({ section: 'sandFriability', shiftKey, field: 'value', values: [edits[cellKey]] });
    });

    table5Data.forEach((row, rowIndex) => {
      if (!row._id) return;
      const data = {};
      TABLE5_EDITABLE_KEYS.forEach((key) => {
        const cellKey = `table5_${rowIndex}_${key}`;
        if (edits[cellKey] === undefined) return;
        const bentoniteMeta = BENTONITE_CHECKPOINT_KEYS[key];
        if (bentoniteMeta) {
          data[bentoniteMeta.column] = edits[cellKey];
          data.bentoniteCheckpoint = bentoniteMeta.checkpoint;
          return;
        }
        // Time edits arrive as the <input type="time"> "HH:MM" string —
        // convert back to the packed-integer wire format the entry form
        // itself sends (or '-' for a cleared field).
        data[TABLE5_KEY_TO_COLUMN[key] || key] = key === 'time' ? inputValueToPackedTime(edits[cellKey]) : edits[cellKey];
      });
      if (Object.keys(data).length) testParameterEdits.push({ id: row._id, data });
    });

    return { edits: leafEdits, testParameterEdits, dayFieldEdits };
  };

  const handleSaveEdits = async () => {
    if (!currentEntry?._id) return;
    if (Object.keys(edits).length === 0) { setEditMode(false); return; }
    setSaving(true);
    try {
      const body = buildEditsPayload();
      const res = await fetch(`${API_ENDPOINTS.sandTestingRecords}/${currentEntry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setEntries((prev) => prev.map((e, i) => (i === currentIndex ? data.data : e)));
        processRecordData(data.data);
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
      const res = await fetch(`${API_ENDPOINTS.sandTestingRecords}/${currentEntry._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const remaining = entries.filter((_, i) => i !== currentIndex);
        setEntries(remaining);
        const newIndex = Math.max(0, Math.min(currentIndex, remaining.length - 1));
        setCurrentIndex(newIndex);
        if (remaining.length > 0) processRecordData(remaining[newIndex]);
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

  // Fetch every record in [from, to] in one call (all plants included), cached
  // by range, then apply the Plant filter client-side. Replaces the previous
  // day-by-day /date/:date loop, which also silently dropped any second
  // plant's record for a date via `data[0]` — this keeps every record.
  const fetchData = async (fromDate = getCurrentDate(), toDate = getCurrentDate()) => {
    const MINIMUM_LOADING_TIME = 1500; // 1.5 seconds minimum for full animation
    const startTime = Date.now();
    setLoading(true);
    setError('');
    setCurrentIndex(0);
    setShowEntryTable(false);

    try {
      const cacheKey = `${fromDate}|${toDate}`;
      let list = cacheRef.current[cacheKey];
      if (list === undefined) {
        const url = `${API_ENDPOINTS.sandTestingRecords}?startDate=${encodeURIComponent(fromDate)}&endDate=${encodeURIComponent(toDate)}&limit=500`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const result = await res.json();
        list = ((result.success && Array.isArray(result.data)) ? result.data : [])
          .slice()
          .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : String(a.plant).localeCompare(String(b.plant))));
        cacheRef.current[cacheKey] = list;
      }

      const filtered = applyPlantFilter(list);
      setEntries(filtered);
      if (filtered.length > 0) {
        processRecordData(filtered[0]);
      } else {
        clearAllData();
        if (fromDate !== toDate) setError('No data found for the selected filters');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
      setEntries([]);
      clearAllData();
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  // Helper function to clear all data
  const clearAllData = () => {
    setTable1Data({
      table1a: {
        '0_1': [], '0_2': [], '0_3': [],
        '1_1': [], '1_2': [], '1_3': [],
        '2_1': [], '2_2': [], '2_3': [],
        '3_1': [], '3_2': [], '3_3': [],
        '4_1': [], '4_2': [], '4_3': []
      },
      table1b: { bentonite: '', batchType: '', value: '' }
    });
    setTable2Data({
      '0_0': '', '0_1': '', '0_2': '', '1_0': '', '1_1': '', '1_2': '',
      '2_0': '', '2_1': '', '2_2': '', '3_0': '', '3_1': '', '3_2': '',
      '4_0': '', '4_1': '', '4_2': '', '5_0': '', '5_1': '', '5_2': '',
      '6_0': '', '6_1': '', '6_2': ''
    });
    setTable3Data({
      '0_0': [], '0_1': [], '0_2': [], '0_3': [], '0_4': [],
      '1_0': [], '1_1': [], '1_2': [], '1_3': [], '1_4': [],
      '2_0': [], '2_1': [], '2_2': [], '2_3': [], '2_4': []
    });
    setTable4Data({ sandLump: '', newSandWt: '', friabilityShiftI: '', friabilityShiftII: '', friabilityShiftIII: '' });
    setTable5Data([]);
  };

  // Fetch current date data on component mount
  useEffect(() => {
    fetchData(getCurrentDate(), getCurrentDate());
  }, []);

  const handleFilter = async () => {
    const to = endDate || getCurrentDate();

    if (startDate) {
      if (new Date(to) < new Date(startDate)) {
        toast.error('End date cannot be before start date');
        return;
      }
      setIsFiltered(true);
      await fetchData(startDate, to);
    } else {
      // No "From" ⇒ view the single "To" date, same as Foundary/ReturnSand's fallback.
      setIsFiltered(false);
      await fetchData(to, to);
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(getCurrentDate());
    setIsFiltered(false);
    setPlantFilter('All');
    fetchData(getCurrentDate(), getCurrentDate());
  };

  const handlePrevEntry = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      processRecordData(entries[newIndex]);
    }
  };

  const handleNextEntry = () => {
    if (currentIndex < entries.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      processRecordData(entries[newIndex]);
    }
  };

  const jumpToEntry = (idx) => {
    setCurrentIndex(idx);
    processRecordData(entries[idx]);
    setShowEntryTable(false);
  };



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
      const url = `${API_ENDPOINTS.sandTestingRecords}?startDate=${encodeURIComponent(from)}&endDate=${encodeURIComponent(to)}&limit=1000`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      const records = applyPlantFilter((result.success && Array.isArray(result.data)) ? result.data : []);
      // Oldest → newest for a natural top-to-bottom read.
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (records.length === 0) { toast.error('No data to export for the selected range.'); return; }

      const D = (r) => formatDateDisplay(r.date);
      const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(' / ') : '');
      const formatTime = (timeVal) => {
        if (!timeVal || timeVal === '-') return '';
        const timeNum = Number(timeVal);
        if (!timeNum || isNaN(timeNum)) return '';
        const hour = Math.floor(timeNum / 100);
        const minute = timeNum % 100;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
      };

      // 1) Sand & Mix Testing — one row per date.
      const sandMixRows = records.map((r) => {
        const s = r.sandShifts || {};
        return {
          date: D(r),
          rSandI: joinArr(s.shiftI?.rSand), rSandII: joinArr(s.shiftII?.rSand), rSandIII: joinArr(s.shiftIII?.rSand),
          nSandI: joinArr(s.shiftI?.nSand), nSandII: joinArr(s.shiftII?.nSand), nSandIII: joinArr(s.shiftIII?.nSand),
          mixI: joinArr(s.shiftI?.mixingMode), mixII: joinArr(s.shiftII?.mixingMode), mixIII: joinArr(s.shiftIII?.mixingMode),
          benI: joinArr(s.shiftI?.bentonite), benII: joinArr(s.shiftII?.bentonite), benIII: joinArr(s.shiftIII?.bentonite),
          cdpI: joinArr(s.shiftI?.coalDustPremix), cdpII: joinArr(s.shiftII?.coalDustPremix), cdpIII: joinArr(s.shiftIII?.coalDustPremix),
          batchBentonite: s.batchNo?.bentonite || '',
          batchCoalPremix: s.batchNo?.coalDust || s.batchNo?.premix || '',
        };
      });
      const sandMixColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'I', key: 'rSandI', width: 12, group: 'R. Sand (Kgs./Mix)' },
        { header: 'II', key: 'rSandII', width: 12, group: 'R. Sand (Kgs./Mix)' },
        { header: 'III', key: 'rSandIII', width: 12, group: 'R. Sand (Kgs./Mix)' },
        { header: 'I', key: 'nSandI', width: 12, group: 'N. Sand (Kgs./Mould)' },
        { header: 'II', key: 'nSandII', width: 12, group: 'N. Sand (Kgs./Mould)' },
        { header: 'III', key: 'nSandIII', width: 12, group: 'N. Sand (Kgs./Mould)' },
        { header: 'I', key: 'mixI', width: 12, group: 'Mixing Mode' },
        { header: 'II', key: 'mixII', width: 12, group: 'Mixing Mode' },
        { header: 'III', key: 'mixIII', width: 12, group: 'Mixing Mode' },
        { header: 'I', key: 'benI', width: 12, group: 'Bentonite (Kgs./Mix)' },
        { header: 'II', key: 'benII', width: 12, group: 'Bentonite (Kgs./Mix)' },
        { header: 'III', key: 'benIII', width: 12, group: 'Bentonite (Kgs./Mix)' },
        { header: 'I', key: 'cdpI', width: 12, group: 'Coal Dust / Premix (Kgs./Mix)' },
        { header: 'II', key: 'cdpII', width: 12, group: 'Coal Dust / Premix (Kgs./Mix)' },
        { header: 'III', key: 'cdpIII', width: 12, group: 'Coal Dust / Premix (Kgs./Mix)' },
        { header: 'Bentonite', key: 'batchBentonite', width: 14, group: 'Batch No.' },
        { header: 'Coal Dust / Premix', key: 'batchCoalPremix', width: 16, group: 'Batch No.' },
      ];

      // 2) Clay Testing — one row per date. (Note the record's mixed-case shift keys.)
      const clayRows = records.map((r) => {
        const c = r.clayShifts || {};
        const pick = (param) => ({
          I: c.shiftI?.[param] || '', II: c.ShiftII?.[param] || '', III: c.ShiftIII?.[param] || '',
        });
        const tc = pick('totalClay'), ac = pick('activeClay'), dc = pick('deadClay');
        const vcm = pick('vcm'), loi = pick('loi'), afs = pick('afsNo'), fines = pick('fines');
        return {
          date: D(r),
          tcI: tc.I, tcII: tc.II, tcIII: tc.III,
          acI: ac.I, acII: ac.II, acIII: ac.III,
          dcI: dc.I, dcII: dc.II, dcIII: dc.III,
          vcmI: vcm.I, vcmII: vcm.II, vcmIII: vcm.III,
          loiI: loi.I, loiII: loi.II, loiIII: loi.III,
          afsI: afs.I, afsII: afs.II, afsIII: afs.III,
          finesI: fines.I, finesII: fines.II, finesIII: fines.III,
        };
      });
      const clayGroup = (label, prefix) => [
        { header: 'I', key: `${prefix}I`, width: 11, group: label },
        { header: 'II', key: `${prefix}II`, width: 11, group: label },
        { header: 'III', key: `${prefix}III`, width: 11, group: label },
      ];
      const clayColumns = [
        { header: 'Date', key: 'date', width: 13 },
        ...clayGroup('Total Clay (11.0-14.5%)', 'tc'),
        ...clayGroup('Active Clay (8.5-11.0%)', 'ac'),
        ...clayGroup('Dead Clay (2.0-4.0%)', 'dc'),
        ...clayGroup('V.C.M. (2.0-3.2%)', 'vcm'),
        ...clayGroup('L.O.I. (4.5-6.0%)', 'loi'),
        ...clayGroup('AFS No. (Min. 48)', 'afs'),
        ...clayGroup('Fines (10% Max)', 'fines'),
      ];

      // 3) Mix Testing & Hopper Level — three rows per date (one per shift).
      const mixHopperRows = records.flatMap((r) => {
        const m = r.mixshifts || {};
        return [
          { label: 'I', k: 'ShiftI' },
          { label: 'II', k: 'ShiftII' },
          { label: 'III', k: 'ShiftIII' },
        ].map(({ label, k }) => ({
          date: D(r),
          shift: label,
          mixStart: joinArr(m[k]?.mixno?.start),
          mixEnd: joinArr(m[k]?.mixno?.end),
          mixTotal: joinArr(m[k]?.mixno?.total),
          rejected: joinArr(m[k]?.numberOfMixRejected),
          hopper: joinArr(m[k]?.returnSandHopperLevel),
        }));
      });
      const mixHopperColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Shift', key: 'shift', width: 8 },
        { header: 'Start', key: 'mixStart', width: 14, group: 'Mix No.' },
        { header: 'End', key: 'mixEnd', width: 14, group: 'Mix No.' },
        { header: 'Total', key: 'mixTotal', width: 14, group: 'Mix No.' },
        { header: 'No. Of Rejected', key: 'rejected', width: 16 },
        { header: 'Return Sand Hopper Level', key: 'hopper', width: 20 },
      ];

      // 4) Sand Weight & Friability — one row per date.
      const sandWtRows = records.map((r) => ({
        date: D(r),
        sandLump: r.sandLump || '',
        newSandWt: r.newSandWt || '',
        friI: r.sandFriability?.shiftI || '',
        friII: r.sandFriability?.shiftII || '',
        friIII: r.sandFriability?.shiftIII || '',
      }));
      const sandWtColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'Sand Lumps', key: 'sandLump', width: 14 },
        { header: 'New Sand Wt', key: 'newSandWt', width: 14 },
        { header: 'I', key: 'friI', width: 12, group: 'Prepared Sand Friability (8.0%-13.0%)' },
        { header: 'II', key: 'friII', width: 12, group: 'Prepared Sand Friability (8.0%-13.0%)' },
        { header: 'III', key: 'friIII', width: 12, group: 'Prepared Sand Friability (8.0%-13.0%)' },
      ];

      // 5) Sand Properties & Test Parameters — one row per testParameter entry.
      const propRows = records.flatMap((r) =>
        (Array.isArray(r.testParameter) ? r.testParameter : []).map((item, index) => ({
          date: D(r),
          sno: item.sno || index + 1,
          time: formatTime(item.time),
          mixNo: item.mixno || '',
          permeability: item.permeability || '',
          gcsFdyA: item.gcsFdyA || '',
          gcsFdyB: item.gcsFdyB || '',
          wts: item.wts || '',
          moisture: item.moisture || '',
          compactability: item.compactability || '',
          compressibility: item.compressibility || '',
          waterLitre: item.waterLitre || '',
          sandTempBC: item.sandTempBC || '',
          sandTempWU: item.sandTempWU || '',
          sandTempSSU: item.sandTempSSUmax || '',
          newSandKgs: item.newSandKgs || '',
          bentoniteWithPremixKgs: item.bentoniteWithPremixKgs || '',
          bentoniteWithPremixPercent: item.bentoniteWithPremixPercent || '',
          bentonite060Kgs: item.bentoniteCheckpoint === '0.60-1.20' ? (item.bentoniteKgs || '') : '',
          bentonite060Percent: item.bentoniteCheckpoint === '0.60-1.20' ? (item.bentonitePercent || '') : '',
          bentonite080Kgs: item.bentoniteCheckpoint === '0.80-2.20' ? (item.bentoniteKgs || '') : '',
          bentonite080Percent: item.bentoniteCheckpoint === '0.80-2.20' ? (item.bentonitePercent || '') : '',
          premixKgs: item.premixKgs || '',
          premixPercent: item.premixPercent || '',
          coalDustKgs: item.coalDustKgs || '',
          coalDustPercent: item.coalDustPercent || '',
          lc: item.lc || '',
          compactabilitySettings: item.compactabilitySettings || '',
          mouldStrength: item.mouldStrength || '',
          shearStrengthSetting: item.shearStrengthSetting || '',
          preparedSandlumps: item.preparedSandlumps || '',
          itemName: item.itemName || '',
          remarks: item.remarks || '',
        }))
      );
      const propColumns = [
        { header: 'Date', key: 'date', width: 13 },
        { header: 'S.No', key: 'sno', width: 7 },
        { header: 'Time', key: 'time', width: 12 },
        { header: 'Mix No', key: 'mixNo', width: 10 },
        { header: 'Permeability (90-160)', key: 'permeability', width: 14 },
        { header: 'GCS Fdy A Gm/cm² (Min 1800)', key: 'gcsFdyA', width: 14 },
        { header: 'GCS Fdy B Gm/cm² (Min 1900)', key: 'gcsFdyB', width: 14 },
        { header: 'WTS N/cm² (Min 0.15)', key: 'wts', width: 14 },
        { header: 'Moisture (3.0-4.0%)', key: 'moisture', width: 13 },
        { header: 'Compactability (33-40%)', key: 'compactability', width: 14 },
        { header: 'Compressibility (20-28%)', key: 'compressibility', width: 14 },
        { header: 'Water L/Kg', key: 'waterLitre', width: 11 },
        { header: 'BC', key: 'sandTempBC', width: 8, group: 'Sand Temp °C (Max 45)' },
        { header: 'WU', key: 'sandTempWU', width: 8, group: 'Sand Temp °C (Max 45)' },
        { header: 'SSU', key: 'sandTempSSU', width: 8, group: 'Sand Temp °C (Max 45)' },
        { header: 'New Sand Kgs (0.0-5.0)', key: 'newSandKgs', width: 13 },
        { header: 'Kgs', key: 'bentoniteWithPremixKgs', width: 9, group: 'Bentonite with Premix' },
        { header: '%', key: 'bentoniteWithPremixPercent', width: 9, group: 'Bentonite with Premix' },
        { header: 'Kgs', key: 'bentonite060Kgs', width: 9, group: 'Bentonite (0.60-1.20%)' },
        { header: '%', key: 'bentonite060Percent', width: 9, group: 'Bentonite (0.60-1.20%)' },
        { header: 'Kgs', key: 'bentonite080Kgs', width: 9, group: 'Bentonite (0.80-2.20%)' },
        { header: '%', key: 'bentonite080Percent', width: 9, group: 'Bentonite (0.80-2.20%)' },
        { header: 'Kgs', key: 'premixKgs', width: 9, group: 'Premix' },
        { header: '%', key: 'premixPercent', width: 9, group: 'Premix' },
        { header: 'Kgs', key: 'coalDustKgs', width: 9, group: 'Coal Dust' },
        { header: '%', key: 'coalDustPercent', width: 9, group: 'Coal Dust' },
        { header: 'LC', key: 'lc', width: 8 },
        { header: 'Compactability Settings (SMC42)', key: 'compactabilitySettings', width: 14 },
        { header: 'Mould Strength (SMC23)', key: 'mouldStrength', width: 14 },
        { header: 'Shear Strength Setting (At15)', key: 'shearStrengthSetting', width: 14 },
        { header: 'Prepared Sand Lumps/Kg', key: 'preparedSandlumps', width: 14 },
        { header: 'Item Name', key: 'itemName', width: 16 },
        { header: 'Remarks', key: 'remarks', width: 24 },
      ];

      await exportWorkbookToExcel({
        title: 'Sand Testing Record - Report',
        fromDate: from,
        toDate: to,
        fileName: 'Sand_Testing_Record_Report',
        sheets: [
          { sheetName: 'Sand & Mix Testing', columns: sandMixColumns, rows: sandMixRows },
          { sheetName: 'Clay Testing', columns: clayColumns, rows: clayRows },
          { sheetName: 'Mix Testing & Hopper', columns: mixHopperColumns, rows: mixHopperRows },
          { sheetName: 'Sand Weight & Friability', columns: sandWtColumns, rows: sandWtRows },
          { sheetName: 'Sand Properties & Test', columns: propColumns, rows: propRows },
        ],
      });
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="sand-record-report-container">
      {/* Header */}
      <div className="sand-header">
        <div className="sand-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Sand Testing Record - Report
          </h2>
        </div>
        {entries[currentIndex] && !showEntryTable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontWeight: 600, color: '#1e293b' }}>
            <span>Date: {formatDateDisplay(entries[currentIndex].date)}</span>
            {entries[currentIndex].plant && <span>Plant: {entries[currentIndex].plant}</span>}
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="impact-filter-container" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div className="impact-filter-group">
          <label>From Date</label>
          <CustomDatePicker
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
            disabled={loading}
          />
        </div>
        <div className="impact-filter-group">
          <label>To Date</label>
          <CustomDatePicker
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
            min={startDate}
            disabled={loading}
          />
        </div>
        <div className="impact-filter-group">
          <label>Plant</label>
          <FilterDisaDropdown
            value={plantFilter}
            onChange={(e) => setPlantFilter(e.target.value)}
            options={PLANT_OPTIONS}
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={loading}>
          Filter
        </FilterButton>
        <ClearButton onClick={handleClear} disabled={loading}>
          Clear
        </ClearButton>
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
              onClick={handlePrevEntry}
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
              onClick={handleNextEntry}
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
          defaultFrom={startDate}
          defaultTo={endDate}
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

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '1rem' }}>
          No entries found for the selected {isFiltered ? 'date range' : 'date'}{plantFilter !== 'All' ? ' and filters' : ''}.
        </div>
      )}

      {/* Combination table — pick a Date/Plant directly */}
      {!loading && showEntryTable && entries.length > 0 && (
        <div className="reusable-table-container">
          <table className="reusable-table table-bordered" style={{ minWidth: '500px' }}>
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>S.No</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Date</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Plant</th>
                <th style={{ textAlign: 'center' }}>No. of Sand Properties &amp; Test Parameters</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((record, idx) => (
                <tr
                  key={record._id || idx}
                  onClick={() => jumpToEntry(idx)}
                  style={{ cursor: 'pointer', backgroundColor: idx === currentIndex ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx === currentIndex ? '#f0f9ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                >
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{idx + 1}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{formatDateDisplay(record.date)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{record.plant || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{record.testParameter?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {!loading && !showEntryTable && entries.length > 0 && (
      <>
      {/* Table 1 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand & Mix Testing</h3>

      {/* Table 1a - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1rem' }}>
        <Table
          template
          showHeader={true}
          rows={5}
          columns={[
            { key: 'col1', label: 'Shift', bold: true, align: 'center' },
            { key: 'col2', label: 'I', align: 'center' },
            { key: 'col3', label: 'II', align: 'center' },
            { key: 'col4', label: 'III', align: 'center' }
          ]}
          renderCell={(rowIndex, colIndex) => {
            // First column: row labels
            if (colIndex === 0) {
              const labels = [
                'R. Sand ( Kgs. / Mix )',
                'N. Sand ( Kgs. / Mould )',
                'Mixing Mode',
                'Bentonite ( Kgs. / Mix )',
                'Coal Dust / Premix ( Kgs. / Mix )'
              ];
              return <strong style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#1e293b' }}>{labels[rowIndex]}</strong>;
            }

            // Other columns: display values
            const key = `${rowIndex}_${colIndex}`;
            const values = table1Data.table1a[key] || [];
            // Table 1a/2/3 all key their own data by the same bare
            // "row_col" scheme, but they share one flat `edits` map — without
            // a per-table prefix, e.g. Table 2's "0_1" and Table 3's "0_1"
            // collide and one table's string overwrites another's array.
            const cellKey = `table1a_${key}`;

            return (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                {editableArrayCell(cellKey, values)}
              </div>
            );
          }}
          minWidth="800px"
        />
      </div>

      {/* Table 1b - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '600px' }}>
            <tbody>
              <tr style={{ height: '50px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>BATCH No.</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Bentonite</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', padding: '8px' }}>
                  {editMode ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}>
                        <input
                          type="radio"
                          name="report_table1b_type"
                          checked={(edits.table1b_batchType ?? table1Data.table1b.batchType) === 'coalDust'}
                          onChange={() => setEdit('table1b_batchType', 'coalDust')}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span>Coal Dust</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}>
                        <input
                          type="radio"
                          name="report_table1b_type"
                          checked={(edits.table1b_batchType ?? table1Data.table1b.batchType) === 'premix'}
                          onChange={() => setEdit('table1b_batchType', 'premix')}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span>Premix</span>
                      </label>
                    </div>
                  ) : (
                    table1Data.table1b.batchType === 'coalDust' ? 'Coal Dust' : table1Data.table1b.batchType === 'premix' ? 'Premix' : '-'
                  )}
                </td>
              </tr>
              <tr style={{ height: '50px' }}>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  {editableScalarCell('table1b_bentonite', table1Data.table1b.bentonite)}
                </td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  {editableScalarCell('table1b_value', table1Data.table1b.value)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 2 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Clay Testing</h3>

      {/* Table 2 - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px' }}>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
              </tr>
              {/* Data Rows */}
              {[
                { label: 'Total Clay (11.0-14.5%)', ruleField: 'Total Clay' },
                { label: 'Active Clay (8.5-11.0%)', ruleField: 'Active Clay' },
                { label: 'Dead Clay (2.0-4.0%)', ruleField: 'Dead Clay' },
                { label: 'V.C.M. (2.0-3.2%)', ruleField: 'V.C.M.' },
                { label: 'L.O.I. (4.5-6.0%)', ruleField: 'L.O.I.' },
                { label: 'AFS No. (Min. 48)', ruleField: 'AFS No.' },
                { label: 'Fines (10% Max)', ruleField: 'Fines' }
              ].map(({ label, ruleField }, rowIndex) => (
                <tr key={rowIndex} style={{ height: '50px' }}>
                  <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{label}</td>
                  {[0, 1, 2].map((colIndex) => {
                    const key = `${rowIndex}_${colIndex}`;
                    const value = table2Data[key] || '';
                    const cellKey = `table2_${key}`;
                    const rule = showDeviations && isAdmin ? ruleByField[ruleField] : null;
                    const deviant = Boolean(rule && isDeviant(rule, value));

                    return (
                      <td key={colIndex} className={!editMode && deviant ? 'deviation-flag' : undefined} style={{ textAlign: 'center', padding: '10px' }}>
                        {editMode ? editableScalarCell(cellKey, value) : (
                          <div
                            style={{
                              padding: '10px',
                              backgroundColor: deviant ? undefined : '#f8fafc',
                              borderRadius: '4px',
                              fontSize: '1rem',
                              fontWeight: '500',
                              color: '#334155',
                              minHeight: '20px'
                            }}
                          >
                            {value || '-'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 3 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Mix Testing & Hopper Level</h3>

      {/* Table 3 - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px', width: '100%' }}>
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col />
              <col />
            </colgroup>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shift</td>
                <td colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>
                  Mix No.
                </td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>No. Of Rejected</td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Return Sand Hopper level</td>
              </tr>
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Start</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>End</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Total</td>
              </tr>
              {/* Data Rows */}
              {['I', 'II', 'III'].map((shift, rowIndex) => {
                const columns = [0, 1, 2, 3, 4];
                return (
                  <tr key={rowIndex} style={{ height: '50px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{shift}</td>
                    {columns.map((colIndex) => {
                      const key = `${rowIndex}_${colIndex}`;
                      const values = table3Data[key] || [];
                      const cellKey = `table3_${key}`;

                      // Total (col 2) is always derived from Start/End — never a direct input, matching the entry form.
                      if (colIndex === 2) {
                        const totals = computeTable3Totals(rowIndex);
                        return (
                          <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: totals.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '8px' }}>
                              {totals.map((v, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  value={v}
                                  placeholder="Auto"
                                  disabled
                                  readOnly
                                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '1rem', textAlign: 'center', backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                                />
                              ))}
                            </div>
                          </td>
                        );
                      }

                      // Start (0) and End (1) grow/shrink in lockstep so Total stays index-paired.
                      const pairedRawKey = colIndex === 0 ? `${rowIndex}_1` : colIndex === 1 ? `${rowIndex}_0` : undefined;
                      const pairedKey = pairedRawKey ? `table3_${pairedRawKey}` : undefined;
                      const pairedOriginal = pairedRawKey ? (table3Data[pairedRawKey] || []) : undefined;

                      return (
                        <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                          {editableArrayCell(cellKey, values, pairedKey, pairedOriginal)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 4 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Weight & Friability</h3>

      {/* Table 4a and 4b - Side by Side - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Table 4a - 2x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SAND LUMPS</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      {editableScalarCell('table4_sandLump', table4Data.sandLump)}
                    </td>
                  </tr>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>NEW SAND WT</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      {editableScalarCell('table4_newSandWt', table4Data.newSandWt)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4b - 4x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Prepared Sand Friability ( 8.0 % - 13.0 % )</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      {editableScalarCell('table4_friabilityShiftI', table4Data.friabilityShiftI)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      {editableScalarCell('table4_friabilityShiftII', table4Data.friabilityShiftII)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      {editableScalarCell('table4_friabilityShiftIII', table4Data.friabilityShiftIII)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Table 5 Display - Sand Properties & Test Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Properties & Test Parameters</h3>

      {/* Table 5 - Scrollable display with sub-columns */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        {table5Data.length === 0 ? (
          <div className="reusable-table-container">
            <table className="reusable-table table-template table-bordered" style={{ minWidth: '2900px' }}>
              <thead>
                <tr style={{ height: '50px' }}>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>S.No</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Time</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mix No</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Permeability<br/>(90-160)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>G.C.S Gm/cm²</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>WTS N/cm²<br/>(Min 0.15)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Moisture<br/>(3.0-4.0%)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>(33-40%)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compressibility<br/>(20-28%)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Water<br/>L/Kg</th>
                  <th colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Sand Temp °C (Max 45)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>New Sand Kgs<br/>(0.0-5.0)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite with Premix</th>
                  <th colSpan={4} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite (Kgs / Mix)</th>
                  <th colSpan={4} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix/Coal Dust (Kgs / Mix)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>Setting</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mould Strength<br/>Setting</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Prepared Sand<br/>Lumps/Kg</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Item Name</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Remarks</th>
                </tr>
                <tr style={{ height: '40px' }}>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>FDY-A (Min 1800)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>FDY-B (Min 1900)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>BC</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>WU</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>SSU</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>0.60-1.20%</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>0.80-2.20%</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix (0.60-1.20%)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Coal Dust (0.28-0.70%)</th>
                </tr>
                <tr style={{ height: '40px' }}>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: '50px' }}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <td key={i} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#94a3b8' }}>-</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (() => {
          // G.C.S., Bentonite-with-Premix, Bentonite, and Premix/Coal Dust all
          // always render their fixed sub-columns now (see Sand Temp BC/WU/SSU
          // for the original pattern) — Bentonite's checkpoint is resolved per
          // row via bentoniteCheckpoint (processRecordData's derived
          // bentonite060*/bentonite080* fields), not detected from the data.

          // Determine which Compactability/Strength columns have data
          const hasLC = table5Data.some(row => row.lc && row.lc !== '-');
          const hasCompactabilitySettings = table5Data.some(row => row.compactabilitySettings && row.compactabilitySettings !== '-');
          const hasMouldStrength = table5Data.some(row => row.mouldStrength && row.mouldStrength !== '-');
          const hasShearStrength = table5Data.some(row => row.shearStrengthSetting && row.shearStrengthSetting !== '-');
          
          return (
          <div className="reusable-table-container">
            <table className="reusable-table table-template table-bordered" style={{ minWidth: '4400px' }}>
              <thead>
                {/* Main Header Row */}
                <tr style={{ height: '50px' }}>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>S.No</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Time</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mix No</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Permeability<br/>(90-160)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>G.C.S Gm/cm²</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>WTS N/cm²<br/>(Min 0.15)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Moisture<br/>(3.0-4.0%)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>(33-40%)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compressibility<br/>(20-28%)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Water<br/>L/Kg</th>
                  <th colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Sand Temp °C (Max 45)</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>New Sand Kgs<br/>(0.0-5.0)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite with Premix</th>
                  <th colSpan={4} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite (Kgs / Mix)</th>
                  <th colSpan={4} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix/Coal Dust (Kgs / Mix)</th>
                  {hasLC && (
                    <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>LC</th>
                  )}
                  {hasCompactabilitySettings && (
                    <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>Settings<br/>(SMC42)</th>
                  )}
                  {hasMouldStrength && (
                    <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mould<br/>Strength<br/>(SMC23)</th>
                  )}
                  {hasShearStrength && (
                    <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shear Strength<br/>Setting<br/>(At15)</th>
                  )}
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Prepared Sand<br/>Lumps/Kg</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Item Name</th>
                  <th rowSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Remarks</th>
                </tr>
                {/* Sub-Group Header Row */}
                <tr style={{ height: '40px' }}>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>FDY-A (Min 1800)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>FDY-B (Min 1900)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>BC</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>WU</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>SSU</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>0.60-1.20%</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>0.80-2.20%</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix (0.60-1.20%)</th>
                  <th colSpan={2} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Coal Dust (0.28-0.70%)</th>
                </tr>
                {/* Leaf Header Row */}
                <tr style={{ height: '40px' }}>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {table5Data.map((row, index) => (
                  <tr key={index} style={{ height: '50px', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{row.sno}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTimeTd(`table5_${index}_time`, row.time, row.timeRaw)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_mixNo`, row.mixNo)}</td>
                    <td className={table5DevClass('permeability', row.permeability)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_permeability`, row.permeability)}</td>
                    <td className={table5DevClass('gcsFdyA', row.gcsFdyA)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_gcsFdyA`, row.gcsFdyA)}</td>
                    <td className={table5DevClass('gcsFdyB', row.gcsFdyB)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_gcsFdyB`, row.gcsFdyB)}</td>
                    <td className={table5DevClass('wts', row.wts)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_wts`, row.wts)}</td>
                    <td className={table5DevClass('moisture', row.moisture)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_moisture`, row.moisture)}</td>
                    <td className={table5DevClass('compactability', row.compactability)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_compactability`, row.compactability)}</td>
                    <td className={table5DevClass('compressibility', row.compressibility)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_compressibility`, row.compressibility)}</td>
                    <td className={table5DevClass('waterLitre', row.waterLitre)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_waterLitre`, row.waterLitre)}</td>
                    <td className={table5DevClass('sandTempBC', row.sandTempBC)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_sandTempBC`, row.sandTempBC)}</td>
                    <td className={table5DevClass('sandTempWU', row.sandTempWU)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_sandTempWU`, row.sandTempWU)}</td>
                    <td className={table5DevClass('sandTempSSU', row.sandTempSSU)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_sandTempSSU`, row.sandTempSSU)}</td>
                    <td className={table5DevClass('newSandKgs', row.newSandKgs)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_newSandKgs`, row.newSandKgs)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_bentoniteWithPremixKgs`, row.bentoniteWithPremixKgs)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_bentoniteWithPremixPercent`, row.bentoniteWithPremixPercent)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_bentonite060Kgs`, row.bentonite060Kgs)}</td>
                    <td className={table5DevClass('bentonite060Percent', row.bentonite060Percent)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_bentonite060Percent`, row.bentonite060Percent)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_bentonite080Kgs`, row.bentonite080Kgs)}</td>
                    <td className={table5DevClass('bentonite080Percent', row.bentonite080Percent)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_bentonite080Percent`, row.bentonite080Percent)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_premixKgs`, row.premixKgs)}</td>
                    <td className={table5DevClass('premixPercent', row.premixPercent)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_premixPercent`, row.premixPercent)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_coalDustKgs`, row.coalDustKgs)}</td>
                    <td className={table5DevClass('coalDustPercent', row.coalDustPercent)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_coalDustPercent`, row.coalDustPercent)}</td>
                    {hasLC && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_lc`, row.lc)}</td>
                    )}
                    {hasCompactabilitySettings && (
                      <td className={table5DevClass('compactabilitySettings', row.compactabilitySettings)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_compactabilitySettings`, row.compactabilitySettings)}</td>
                    )}
                    {hasMouldStrength && (
                      <td className={table5DevClass('mouldStrength', row.mouldStrength)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_mouldStrength`, row.mouldStrength)}</td>
                    )}
                    {hasShearStrength && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_shearStrengthSetting`, row.shearStrengthSetting)}</td>
                    )}
                    <td className={table5DevClass('preparedSandlumps', row.preparedSandlumps)} style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_preparedSandlumps`, row.preparedSandlumps)}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_itemName`, row.itemName)}</td>
                    <td style={{ textAlign: 'left', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{editableTd(`table5_${index}_remarks`, row.remarks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          );
        })()}
      </div>
      </div>
      </>
      )}
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

export default SandTestingRecordReport;