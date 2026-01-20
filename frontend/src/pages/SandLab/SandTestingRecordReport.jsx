import React, { useEffect, useState } from 'react';
import { PencilLine, Trash2, BookOpen } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';

import '../../styles/PageStyles/Sandlab/SandTestingRecordReport.css';

const TABLE5_ROWS = [
  'S.No',
  'Time',
  'Mix No',
  'Permeability',
  'GCS Checkpoint',
  'GCS Value',
  'WTS',
  'Moisture',
  'Compactability',
  'Compressability',
  'Water Litre/Kg Mix',
  'Sand Temp BC',
  'Sand Temp WU',
  'Sand Temp SSU',
  'New Sand Kgs/Mould',
  'Bentonite Checkpoint',
  'Bentonite With Premix',
  'Bentonite Only',
  'Premix Coal Dust Checkpoint',
  'Premix Kgs/Mix',
  'Coal Dust Kgs/Mix',
  'LCSM Compactability Checkpoint',
  'LCSM Compactability Value',
  'Mould Strength Shear Checkpoint',
  'Mould Strength Shear Value',
  'Prepared Sand Lumps/Kg',
  'Item Name',
  'Remarks'
];

const SHIFTS = [
  { key: 'shiftI', label: 'Shift I' },
  { key: 'shiftII', label: 'Shift II' },
  { key: 'shiftIII', label: 'Shift III' }
];

const TABLE5_KEYS = [
  'sno','time','mixNo','permeability','gcsCheckpoint','gcsValue','wts','moisture','compactability',
  'compressability','waterLitrePerKgMix','sandTempBC','sandTempWU','sandTempSSU','newSandKgsPerMould',
  'bentoniteCheckpoint','bentoniteWithPremix','bentoniteOnly','premixCoalDustCheckpoint','premixKgsMix',
  'coalDustKgsMix','lcScmCompactabilityCheckpoint','lcScmCompactabilityValue','mouldStrengthShearCheckpoint',
  'mouldStrengthShearValue','preparedSandLumpsPerKg','itemName','remarks'
];

const SandTestingRecordReport = () => {
  const [selectedDate, setSelectedDate] = useState('');
  // Tabs removed; we will render all tables inline in rows as per new layout
  const [records, setRecords] = useState([]);
  const [displayRecords, setDisplayRecords] = useState([]);

  // Edit modal state (Table 5 full edit)
  const [editTpModalOpen, setEditTpModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    sno: '',
    time: '',
    mixNo: '',
    permeability: '',
    gcsCheckpoint: '',
    gcsValue: '',
    wts: '',
    moisture: '',
    compactability: '',
    compressability: '',
    waterLitrePerKgMix: '',
    sandTempBC: '',
    sandTempWU: '',
    sandTempSSU: '',
    newSandKgsPerMould: '',
    bentoniteCheckpoint: '',
    bentoniteWithPremix: '',
    bentoniteOnly: '',
    premixCoalDustCheckpoint: '',
    premixKgsMix: '',
    coalDustKgsMix: '',
    lcScmCompactabilityCheckpoint: '',
    lcScmCompactabilityValue: '',
    mouldStrengthShearCheckpoint: '',
    mouldStrengthShearValue: '',
    preparedSandLumpsPerKg: '',
    itemName: '',
    remarks: ''
  });
  const [editMeta, setEditMeta] = useState({ id: null, date: null });

  const [t1EditModalOpen, setT1EditModalOpen] = useState(false);
  const [t1EditForm, setT1EditForm] = useState({
    shiftI: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' },
    shiftII: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' },
    shiftIII: { rSand: '', nSand: '', mixingMode: '', bentonite: '', coalDustPremix: '', batchNoBentonite: '', batchNoCoalDustPremix: '' }
  });
  const [t1EditMeta, setT1EditMeta] = useState({ id: null, date: null });

  const [t2EditModalOpen, setT2EditModalOpen] = useState(false);
  const [t2EditForm, setT2EditForm] = useState({
    shiftI: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
    shiftII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' },
    shiftIII: { totalClay: '', activeClay: '', deadClay: '', vcm: '', loi: '', afsNo: '', fines: '' }
  });
  const [t2EditMeta, setT2EditMeta] = useState({ id: null, date: null });

  const [t3EditModalOpen, setT3EditModalOpen] = useState(false);
  const [t3EditForm, setT3EditForm] = useState({
    ShiftI: { mixnoStart: '', mixnoEnd: '', mixnoTotal: '', numberOfMixRejected: '', returnSandHopperLevel: '' },
    ShiftII: { mixnoStart: '', mixnoEnd: '', mixnoTotal: '', numberOfMixRejected: '', returnSandHopperLevel: '' },
    ShiftIII: { mixnoStart: '', mixnoEnd: '', mixnoTotal: '', numberOfMixRejected: '', returnSandHopperLevel: '' },
    total: { mixnoStart: '', mixnoEnd: '', mixnoTotal: '', numberOfMixRejected: '' }
  });
  const [t3EditMeta, setT3EditMeta] = useState({ id: null, date: null });

  const [t4EditModalOpen, setT4EditModalOpen] = useState(false);
  const [t4EditForm, setT4EditForm] = useState({ sandLump: '', newSandWt: '', sandFriability: { shiftI: '', shiftII: '', shiftIII: '' } });
  const [t4EditMeta, setT4EditMeta] = useState({ id: null, date: null });

  
  
  // lightweight toast for success/error
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleting, setDeleting] = useState({}); // map of id:true while delete in-flight
  const showToast = (message, type = 'success', duration = 2000) => {
    setToast({ show: true, message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, message: '', type }), duration);
  };

  // deep checker for any non-empty value inside an object/array
  const hasAnyValue = (val) => {
    if (val == null) return false;
    if (typeof val === 'string') return val.trim() !== '';
    if (typeof val === 'number') return !Number.isNaN(val) && val !== 0; // treat 0 as empty for counts? keep as value
    if (typeof val === 'boolean') return val === true; // booleans usually flags
    if (Array.isArray(val)) return val.some(hasAnyValue);
    if (typeof val === 'object') return Object.values(val).some(hasAnyValue);
    return false;
  };

  // determine if a record has any meaningful data across tables
  const isRecordEmpty = (r) => {
    if (!r) return true;
    const hasSandShifts = hasAnyValue(r?.sandShifts);
    const hasClayShifts = hasAnyValue(r?.clayShifts);
    const hasMix = hasAnyValue(r?.mixshifts);
    const hasSandProps = (
      (r?.sandLump != null && String(r.sandLump).trim() !== '') ||
      (r?.newSandWt != null && String(r.newSandWt).trim() !== '') ||
      hasAnyValue(r?.sandFriability)
    );
    const hasTP = hasAnyValue(r?.testParameter);
    return !(hasSandShifts || hasClayShifts || hasMix || hasSandProps || hasTP);
  };

  const openT2EditModal = (rec) => {
    const cs = rec?.clayShifts || {};
    const s1 = cs.shiftI || {};
    const s2 = cs.shiftII || cs.ShiftII || {};
    const s3 = cs.shiftIII || cs.ShiftIII || {};
    setT2EditForm({
      shiftI: { totalClay: s1.totalClay || '', activeClay: s1.activeClay || '', deadClay: s1.deadClay || '', vcm: s1.vcm || '', loi: s1.loi || '', afsNo: s1.afsNo || '', fines: s1.fines || '' },
      shiftII: { totalClay: s2.totalClay || '', activeClay: s2.activeClay || '', deadClay: s2.deadClay || '', vcm: s2.vcm || '', loi: s2.loi || '', afsNo: s2.afsNo || '', fines: s2.fines || '' },
      shiftIII: { totalClay: s3.totalClay || '', activeClay: s3.activeClay || '', deadClay: s3.deadClay || '', vcm: s3.vcm || '', loi: s3.loi || '', afsNo: s3.afsNo || '', fines: s3.fines || '' }
    });
    setT2EditMeta({ id: rec?._id || rec?.id || null, date: rec?.date || null });
    setT2EditModalOpen(true);
  };
  const closeT2EditModal = () => setT2EditModalOpen(false);
  const submitT2Edit = async () => {
    try {
      const payload = {
        tableNum: 2,
        data: {
          date: t2EditMeta.date,
          shiftI: { ...t2EditForm.shiftI },
          ShiftII: { ...t2EditForm.shiftII },
          ShiftIII: { ...t2EditForm.shiftIII }
        }
      };
      const response = await fetch('http://localhost:5000/api/v1/sand-testing-records/table2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const res = await response.json();
      if (res?.success) {
        setT2EditModalOpen(false);
        await refetchByDateOrRange();
        showToast('Table 2 updated', 'success');
      } else {
        alert(res?.message || 'Update failed.');
      }
    } catch (e) {
      console.error('Error updating Table 2:', e);
      alert('Update failed.');
    }
  };

  // specific getters for Table 1 Batch No parts
  const getBatchNoPart = (rec, key, part) => {
    if (!rec) return '';
    const altKey = key === 'shiftI' ? 'ShiftI' : (key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
    const s = (rec.sandShifts && (rec.sandShifts[key] || rec.sandShifts[altKey])) || {};
    // prefer structured batchNo object
    const bn = s?.batchNo;
    if (bn && typeof bn === 'object') {
      // direct match for requested part
      const tryKeys = part === 'coalDustPremix'
        ? ['coalDustPremix','coalDust','premix']
        : ['bentonite'];
      for (const k of tryKeys) {
        const v = (bn[k]?.batchNo) || (bn[k]?.no) || (bn[k]?.value) || bn[k];
        if (v != null && String(v).trim() !== '') return v;
      }
    }
    // try common flat aliases that include type in key
    if (part === 'bentonite') {
      const v = s.batchNoBentonite || s.bentoniteBatch || s.bentonite_no || s.BatchNoBentonite;
      if (v != null && String(v).trim() !== '') return v;
    } else if (part === 'coalDustPremix') {
      const v1 = s.batchNoCoalDustPremix || s.coalDustBatch || s.coal_dust_no || s.BatchNoCoalDustPremix;
      const v2 = s.premixBatch || s.premix_no;
      if (v1 != null && String(v1).trim() !== '') return v1;
      if (v2 != null && String(v2).trim() !== '') return v2;
    }
    // nothing found
    return '';
  };
  const getBatchNoBentonite = (rec, key) => getBatchNoPart(rec, key, 'bentonite');
  const getBatchNoCoalDustPremix = (rec, key) => getBatchNoPart(rec, key, 'coalDustPremix');

  // Dedicated getters for Coal Dust and Premix columns in report (Option B)
  const extractVal = (obj) => (obj?.batchNo ?? obj?.no ?? obj?.value ?? obj);
  const getBatchNoCoalDust = (rec, key) => {
    if (!rec) return '';
    const altKey = key === 'shiftI' ? 'ShiftI' : (key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
    const s = (rec.sandShifts && (rec.sandShifts[key] || rec.sandShifts[altKey])) || {};
    const bn = s?.batchNo;
    // Prefer explicit coalDust
    if (bn && typeof bn === 'object') {
      const v1 = extractVal(bn.coalDust);
      if (v1 != null && String(v1).trim() !== '') return v1;
      // Default combined to Coal Dust (Option B)
      const vCombo = extractVal(bn.coalDustPremix);
      if (vCombo != null && String(vCombo).trim() !== '') return vCombo;
    }
    // Flat aliases
    const v2 = s.coalDustBatch || s.coal_dust_no || s.BatchNoCoalDust;
    if (v2 != null && String(v2).trim() !== '') return v2;
    // Also allow combined flat to map to Coal Dust by default
    const vComboFlat = s.batchNoCoalDustPremix || s.BatchNoCoalDustPremix;
    if (vComboFlat != null && String(vComboFlat).trim() !== '') return vComboFlat;
    return '';
  };
  const getBatchNoPremix = (rec, key) => {
    if (!rec) return '';
    const altKey = key === 'shiftI' ? 'ShiftI' : (key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
    const s = (rec.sandShifts && (rec.sandShifts[key] || rec.sandShifts[altKey])) || {};
    const bn = s?.batchNo;
    if (bn && typeof bn === 'object') {
      const v1 = extractVal(bn.premix);
      if (v1 != null && String(v1).trim() !== '') return v1;
    }
    const v2 = s.premixBatch || s.premix_no || s.BatchNoPremix;
    if (v2 != null && String(v2).trim() !== '') return v2;
    // Do NOT map combined to Premix by default
    return '';
  };

  const openT3EditModal = (rec) => {
    const ms = rec?.mixshifts || {};
    const s1 = ms.ShiftI || {};
    const s2 = ms.ShiftII || {};
    const s3 = ms.ShiftIII || {};
    const total = ms.total || {};
    setT3EditForm({
      ShiftI: { mixnoStart: s1?.mixno?.start || '', mixnoEnd: s1?.mixno?.end || '', mixnoTotal: s1?.mixno?.total || '', numberOfMixRejected: s1.numberOfMixRejected || '', returnSandHopperLevel: s1.returnSandHopperLevel || '' },
      ShiftII: { mixnoStart: s2?.mixno?.start || '', mixnoEnd: s2?.mixno?.end || '', mixnoTotal: s2?.mixno?.total || '', numberOfMixRejected: s2.numberOfMixRejected || '', returnSandHopperLevel: s2.returnSandHopperLevel || '' },
      ShiftIII: { mixnoStart: s3?.mixno?.start || '', mixnoEnd: s3?.mixno?.end || '', mixnoTotal: s3?.mixno?.total || '', numberOfMixRejected: s3.numberOfMixRejected || '', returnSandHopperLevel: s3.returnSandHopperLevel || '' },
      total: { mixnoStart: total?.mixno?.start || '', mixnoEnd: total?.mixno?.end || '', mixnoTotal: total?.mixno?.total || '', numberOfMixRejected: total?.numberOfMixRejected || '' }
    });
    setT3EditMeta({ id: rec?._id || rec?.id || null, date: rec?.date || null });
    setT3EditModalOpen(true);
  };
  const closeT3EditModal = () => setT3EditModalOpen(false);
  const submitT3Edit = async () => {
    try {
      const toNum = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));
      const data = {
        date: t3EditMeta.date,
        ShiftI: {
          mixno: { start: t3EditForm.ShiftI.mixnoStart, end: t3EditForm.ShiftI.mixnoEnd, total: t3EditForm.ShiftI.mixnoTotal },
          numberOfMixRejected: toNum(t3EditForm.ShiftI.numberOfMixRejected),
          returnSandHopperLevel: toNum(t3EditForm.ShiftI.returnSandHopperLevel)
        },
        ShiftII: {
          mixno: { start: t3EditForm.ShiftII.mixnoStart, end: t3EditForm.ShiftII.mixnoEnd, total: t3EditForm.ShiftII.mixnoTotal },
          // schema has string for ShiftII.numberOfMixRejected; keep raw string if provided
          numberOfMixRejected: t3EditForm.ShiftII.numberOfMixRejected ?? '',
          returnSandHopperLevel: toNum(t3EditForm.ShiftII.returnSandHopperLevel)
        },
        ShiftIII: {
          mixno: { start: t3EditForm.ShiftIII.mixnoStart, end: t3EditForm.ShiftIII.mixnoEnd, total: t3EditForm.ShiftIII.mixnoTotal },
          numberOfMixRejected: toNum(t3EditForm.ShiftIII.numberOfMixRejected),
          returnSandHopperLevel: toNum(t3EditForm.ShiftIII.returnSandHopperLevel)
        },
        // Include totals so they can be stored if backend supports it
        total: { mixno: { start: t3EditForm.total.mixnoStart, end: t3EditForm.total.mixnoEnd, total: t3EditForm.total.mixnoTotal }, numberOfMixRejected: toNum(t3EditForm.total.numberOfMixRejected) }
      };
      const payload = { tableNum: 3, data };
      const response = await fetch('http://localhost:5000/api/v1/sand-testing-records/table3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const res = await response.json();
      if (res?.success) {
        setT3EditModalOpen(false);
        await refetchByDateOrRange();
        showToast('Table 3 updated', 'success');
      } else {
        alert(res?.message || 'Update failed.');
      }
    } catch (e) {
      console.error('Error updating Table 3:', e);
      alert('Update failed.');
    }
  };

  const openT4EditModal = (rec) => {
    setT4EditForm({
      sandLump: rec?.sandLump || '',
      newSandWt: rec?.newSandWt || '',
      sandFriability: {
        shiftI: rec?.sandFriability?.shiftI || '',
        shiftII: rec?.sandFriability?.shiftII || '',
        shiftIII: rec?.sandFriability?.shiftIII || ''
      }
    });
    setT4EditMeta({ id: rec?._id || rec?.id || null, date: rec?.date || null });
    setT4EditModalOpen(true);
  };
  const closeT4EditModal = () => setT4EditModalOpen(false);
  const submitT4Edit = async () => {
    try {
      const payload = {
        tableNum: 4,
        data: { date: t4EditMeta.date, sandLump: t4EditForm.sandLump, newSandWt: t4EditForm.newSandWt, sandFriability: { ...t4EditForm.sandFriability } }
      };
      const response = await fetch('http://localhost:5000/api/v1/sand-testing-records/table4', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const res = await response.json();
      if (res?.success) {
        setT4EditModalOpen(false);
        await refetchByDateOrRange();
        showToast('Table 4 updated', 'success');
      } else {
        alert(res?.message || 'Update failed.');
      }
    } catch (e) {
      console.error('Error updating Table 4:', e);
      alert('Update failed.');
    }
  };
  
  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/sand-testing-records?limit=1000&order=desc', { credentials: 'include' });
      const response = await res.json();
      if (response.success && Array.isArray(response.data)) {
        setRecords(response.data);
        setDisplayRecords(response.data.filter(r => !isRecordEmpty(r)));
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
      setDisplayRecords([]);
    }
  };

  const refetchByDateOrRange = async () => {
    const sel = normalizeDateYMD(selectedDate);
    try {
      if (!sel) {
        setDisplayRecords((records || []).filter(r => !isRecordEmpty(r)));
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/sand-testing-records/date/${sel}`, { credentials: 'include' });
      const res = await response.json();
      if (res.success && Array.isArray(res.data)) {
        setRecords(res.data);
        setDisplayRecords(res.data.filter(r => !isRecordEmpty(r)));
      } else {
        setRecords([]);
        setDisplayRecords([]);
      }
    } catch (e) {
      console.error('Error refetching records:', e);
      setRecords([]);
      setDisplayRecords([]);
    }
  };

  // no manual filter; auto-refetch on date change

  const openEditTpModal = (rec) => {
    const tp = rec?.testParameter || {};
    const form = {
      sno: tp.sno ?? '',
      time: tp.time ? String(tp.time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2') : '',
      mixNo: tp.mixno ?? '',
      permeability: tp.permeability ?? '',
      gcsCheckpoint: (typeof tp.gcsFdyA === 'number' && tp.gcsFdyA > 0) ? 'fdyA' : ((typeof tp.gcsFdyB === 'number' && tp.gcsFdyB > 0) ? 'fdyB' : ''),
      gcsValue: (typeof tp.gcsFdyA === 'number' && tp.gcsFdyA > 0) ? tp.gcsFdyA : ((typeof tp.gcsFdyB === 'number' && tp.gcsFdyB > 0) ? tp.gcsFdyB : ''),
      wts: tp.wts ?? '',
      moisture: tp.moisture ?? '',
      compactability: tp.compactability ?? '',
      compressability: tp.compressibility ?? '',
      waterLitrePerKgMix: tp.waterLitre ?? '',
      sandTempBC: tp.sandTemp?.BC ?? '',
      sandTempWU: tp.sandTemp?.WU ?? '',
      sandTempSSU: tp.sandTemp?.SSUmax ?? '',
      newSandKgsPerMould: tp.newSandKgs ?? '',
      bentoniteCheckpoint: tp.bentoniteCheckpoint ?? '',
      bentoniteWithPremix: tp.bentoniteWithPremix?.Kgs ?? tp.bentoniteWithPremix?.Percent ?? '',
      bentoniteOnly: tp.bentonite?.Kgs ?? tp.bentonite?.Percent ?? '',
      premixCoalDustCheckpoint: tp.premixCoalDustCheckpoint ?? '',
      premixKgsMix: tp.premix?.Kgs ?? '',
      coalDustKgsMix: tp.coalDust?.Kgs ?? '',
      lcScmCompactabilityCheckpoint: tp.CompactabilitySettings != null ? 'lcScm' : '',
      lcScmCompactabilityValue: tp.lc ?? tp.CompactabilitySettings ?? '',
      mouldStrengthShearCheckpoint: tp.shearStrengthSetting != null ? 'shearStrength' : 'mouldStrength',
      mouldStrengthShearValue: tp.mouldStrength ?? '',
      preparedSandLumpsPerKg: tp.preparedSandlumps ?? '',
      itemName: tp.itemName ?? '',
      remarks: tp.remarks ?? ''
    };
    setEditForm(form);
    setEditMeta({ id: rec?._id || rec?.id || null, date: rec?.date || null });
    setEditTpModalOpen(true);
  };

  const closeEditTpModal = () => setEditTpModalOpen(false);

  const openT1EditModal = (rec) => {
    const ss = rec?.sandShifts || {};
    const s1 = ss.shiftI || {};
    const s2 = ss.shiftII || ss.ShiftII || {};
    const s3 = ss.shiftIII || ss.ShiftIII || {};
    const pickBn = (s, key) => {
      const bn = s?.batchNo;
      if (!bn) return '';
      if (key === 'bentonite') return bn.bentonite || bn.Bentonite || '';
      return bn.coalDustPremix || bn.coalDust || bn.premix || bn.CoalDust || bn.Premix || '';
    };
    setT1EditForm({
      shiftI: {
        rSand: s1.rSand || '',
        nSand: s1.nSand || '',
        mixingMode: s1.mixingMode || '',
        bentonite: s1.bentonite || '',
        coalDustPremix: s1.coalDustPremix || '',
        batchNoBentonite: pickBn(s1, 'bentonite') || '',
        batchNoCoalDustPremix: pickBn(s1, 'coal') || ''
      },
      shiftII: {
        rSand: s2.rSand || '',
        nSand: s2.nSand || '',
        mixingMode: s2.mixingMode || '',
        bentonite: s2.bentonite || '',
        coalDustPremix: s2.coalDustPremix || '',
        batchNoBentonite: pickBn(s2, 'bentonite') || '',
        batchNoCoalDustPremix: pickBn(s2, 'coal') || ''
      },
      shiftIII: {
        rSand: s3.rSand || '',
        nSand: s3.nSand || '',
        mixingMode: s3.mixingMode || '',
        bentonite: s3.bentonite || '',
        coalDustPremix: s3.coalDustPremix || '',
        batchNoBentonite: pickBn(s3, 'bentonite') || '',
        batchNoCoalDustPremix: pickBn(s3, 'coal') || ''
      }
    });
    setT1EditMeta({ id: rec?._id || rec?.id || null, date: rec?.date || null });
    setT1EditModalOpen(true);
  };
  const closeT1EditModal = () => setT1EditModalOpen(false);
  const submitT1Edit = async () => {
    try {
      const payload = {
        tableNum: 1,
        data: {
          date: t1EditMeta.date,
          shiftI: {
            rSand: t1EditForm.shiftI.rSand,
            nSand: t1EditForm.shiftI.nSand,
            mixingMode: t1EditForm.shiftI.mixingMode,
            bentonite: t1EditForm.shiftI.bentonite,
            coalDustPremix: t1EditForm.shiftI.coalDustPremix,
            batchNo: {
              bentonite: t1EditForm.shiftI.batchNoBentonite,
              coalDustPremix: t1EditForm.shiftI.batchNoCoalDustPremix
            }
          },
          shiftII: {
            rSand: t1EditForm.shiftII.rSand,
            nSand: t1EditForm.shiftII.nSand,
            mixingMode: t1EditForm.shiftII.mixingMode,
            bentonite: t1EditForm.shiftII.bentonite,
            coalDustPremix: t1EditForm.shiftII.coalDustPremix,
            batchNo: {
              bentonite: t1EditForm.shiftII.batchNoBentonite,
              coalDustPremix: t1EditForm.shiftII.batchNoCoalDustPremix
            }
          },
          shiftIII: {
            rSand: t1EditForm.shiftIII.rSand,
            nSand: t1EditForm.shiftIII.nSand,
            mixingMode: t1EditForm.shiftIII.mixingMode,
            bentonite: t1EditForm.shiftIII.bentonite,
            coalDustPremix: t1EditForm.shiftIII.coalDustPremix,
            batchNo: {
              bentonite: t1EditForm.shiftIII.batchNoBentonite,
              coalDustPremix: t1EditForm.shiftIII.batchNoCoalDustPremix
            }
          }
        }
      };
      const response = await fetch('http://localhost:5000/api/v1/sand-testing-records/table1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const res = await response.json();
      if (res?.success) {
        setT1EditModalOpen(false);
        await refetchByDateOrRange();
        showToast('Table 1 updated', 'success');
      } else {
        alert(res?.message || 'Update failed.');
      }
    } catch (e) {
      console.error('Error updating Table 1:', e);
      alert('Update failed.');
    }
  };

  const submitEditTp = async () => {
    try {
      const td = editForm;
      const data = {};
      // numeric helpers
      const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

      data.sno = num(td.sno);
      if (td.time) {
        const tstr = String(td.time).trim();
        const hhmm = tstr.includes(':') ? tstr.replace(':', '') : tstr;
        const tnum = Number(hhmm);
        if (!Number.isNaN(tnum)) data.time = tnum;
      }
      data.mixno = num(td.mixNo);
      data.permeability = num(td.permeability);
      // GCS: clear both by default to 0 so backend $set overwrites previous values
      data.gcsFdyA = 0;
      data.gcsFdyB = 0;
      if (td.gcsCheckpoint === 'fdyA' && td.gcsValue !== '' && !Number.isNaN(Number(td.gcsValue))) {
        data.gcsFdyA = Number(td.gcsValue);
      } else if (td.gcsCheckpoint === 'fdyB' && td.gcsValue !== '' && !Number.isNaN(Number(td.gcsValue))) {
        data.gcsFdyB = Number(td.gcsValue);
      }

      data.wts = num(td.wts);
      data.moisture = num(td.moisture);
      data.compactability = num(td.compactability);
      data.compressibility = num(td.compressability);
      data.waterLitre = num(td.waterLitrePerKgMix);
      data.sandTemp = { BC: num(td.sandTempBC), WU: num(td.sandTempWU), SSUmax: num(td.sandTempSSU) };
      data.newSandKgs = num(td.newSandKgsPerMould);
      // keep checkpoint label if backend uses, else omit; backend schema doesn't have bentoniteCheckpoint field
      // data.bentoniteCheckpoint = td.bentoniteCheckpoint;
      data.bentoniteWithPremix = { Kgs: num(td.bentoniteWithPremix) };
      data.bentonite = { Kgs: num(td.bentoniteOnly) };
      data.premixCoalDustCheckpoint = td.premixCoalDustCheckpoint;
      data.premix = { Kgs: num(td.premixKgsMix) };
      data.coalDust = { Kgs: num(td.coalDustKgsMix) };
      // LC/Compactability: backend expects numbers for lc and CompactabilitySettings
      const lcVal = num(td.lcScmCompactabilityValue);
      if (lcVal !== undefined) {
        data.lc = lcVal;
        data.CompactabilitySettings = lcVal;
      }

      // Mould/Shear: backend fields are numeric; set one based on selection
      const msNum = num(td.mouldStrengthShearValue);
      if (msNum !== undefined) {
        if (td.mouldStrengthShearCheckpoint === 'shearStrength') {
          data.shearStrengthSetting = msNum;
          // optionally also mirror to mouldStrength if needed by UI
          data.mouldStrength = msNum;
        } else {
          data.mouldStrength = msNum;
        }
      }
      data.preparedSandlumps = num(td.preparedSandLumpsPerKg);
      data.itemName = td.itemName;
      data.remarks = td.remarks;

      const payload = { tableNum: 5, data: { ...data, date: editMeta.date } };
      const response = await fetch('http://localhost:5000/api/v1/sand-testing-records/table5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const res = await response.json();
      if (res.success) {
        setEditTpModalOpen(false);
        await refetchByDateOrRange();
      } else {
        alert(res.message || 'Failed to update.');
      }
    } catch (e) {
      console.error('Error updating Table 5 fields:', e);
      alert('Update failed. Please try again.');
    }
  };

  const handleDeleteRecord = async (rec, table) => {
    const id = rec?._id || rec?.id || rec?.recordId || rec?.Id || rec?.ID;
    const date = rec?.date;
    if (!id) return alert('Record id missing.');
    // If no table specified and record is empty, allow deleting the entire record (date)
    if (!table && isRecordEmpty(rec)) {
      if (!window.confirm('This date has no data. Delete the date?')) return;
      setDeleting(prev => ({ ...prev, [id]: true }));
      try {
        const deleteResponse = await fetch(`http://localhost:5000/api/v1/sand-testing-records/${id}`, { method: 'DELETE', credentials: 'include' });
        const delRes = await deleteResponse.json();
        const ok = (delRes && (delRes.success === true || delRes.status === 200 || delRes.ok === true));
        if (ok) {
          setRecords(prev => prev.filter(r => (r?._id || r?.id) !== id));
          setDisplayRecords(prev => prev.filter(r => (r?._id || r?.id) !== id));
          showToast('Deleted record and date', 'success');
        } else {
          alert('Delete failed.');
        }
      } catch (e) {
        console.error('Error deleting whole record:', e);
        alert('Delete failed.');
      } finally {
        setDeleting(prev => { const cp = { ...prev }; delete cp[id]; return cp; });
      }
      return;
    }
    // Ask for confirmation before proceeding for per-table delete
    if (!window.confirm("Are you sure you want to delete only this table's data? This cannot be undone.")) return;
    // single-click delete with in-flight disabling
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      let res;
      // Prefer scoped clear per-table. If backend only supports updates, send minimal clearing payloads.
      if (table === 'table5') {
        const data = {
          sno: '',
          time: '',
          mixno: '',
          permeability: '',
          gcsFdyA: undefined,
          gcsFdyB: undefined,
          wts: '',
          moisture: '',
          compactability: '',
          compressibility: '',
          waterLitre: '',
          sandTemp: { BC: '', WU: '', SSUmax: '' },
          newSandKgs: '',
          bentoniteCheckpoint: '',
          bentoniteWithPremix: { Kgs: null },
          bentonite: { Kgs: null },
          premixCoalDustCheckpoint: '',
          premix: { Kgs: null },
          coalDust: { Kgs: null },
          CompactabilitySettings: '',
          lc: '',
          shearStrengthSetting: '',
          mouldStrength: '',
          shearStrength: undefined,
          preparedSandlumps: '',
          itemName: '',
          remarks: ''
        };
        const payload = { tableNum: 5, data: { ...data, date } };
        const response = await fetch('http://localhost:5000/api/v1/sand-testing-records/table5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
        res = await response.json();
      } else if (table === 'table1') {
        const payload = { tableNum: 1, data: { date, sandShifts: {} } };
        const resp1 = await fetch('http://localhost:5000/api/v1/sand-testing-records/table1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
        res = await resp1.json();
      } else if (table === 'table2') {
        const payload = { tableNum: 2, data: { date, clayShifts: {} } };
        const resp2 = await fetch('http://localhost:5000/api/v1/sand-testing-records/table2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
        res = await resp2.json();
      } else if (table === 'table3') {
        const payload = { tableNum: 3, data: { date, mixshifts: {} } };
        const resp3 = await fetch('http://localhost:5000/api/v1/sand-testing-records/table3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
        res = await resp3.json();
      } else if (table === 'table4') {
        const payload = { tableNum: 4, data: { date, sandLump: '', newSandWt: '', sandFriability: {} } };
        const resp4 = await fetch('http://localhost:5000/api/v1/sand-testing-records/table4', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
        res = await resp4.json();
      } else {
        // Fallback: do not delete the whole record if table scope missing
        return alert('Unknown table scope for delete.');
      }

      const ok = (res && (res.success === true || res.status === 200 || res.ok === true));
      if (ok) {
        // Helper to determine if a record has any meaningful table data remaining
        const isRecordDataEmpty = (r) => {
          const hasSandShifts = r?.sandShifts && Object.keys(r.sandShifts).length > 0;
          const hasClayShifts = r?.clayShifts && Object.keys(r.clayShifts).length > 0;
          const hasMix = r?.mixshifts && Object.keys(r.mixshifts).length > 0;
          const hasSandProps = (
            (r?.sandLump != null && String(r.sandLump).trim() !== '') ||
            (r?.newSandWt != null && String(r.newSandWt).trim() !== '') ||
            (r?.sandFriability && Object.values(r.sandFriability).some(v => v != null && String(v).trim() !== ''))
          );
          const hasTP = r?.testParameter && Object.values(r.testParameter).some(v => {
            if (v == null) return false;
            if (typeof v === 'object') return Object.values(v).some(x => x != null && String(x).trim() !== '');
            return String(v).trim() !== '';
          });
          return !(hasSandShifts || hasClayShifts || hasMix || hasSandProps || hasTP);
        };

        // Optimistic local update: clear only the scoped section for matching record id
        let updatedRecords;
        setRecords(prev => {
          updatedRecords = prev.map(r => {
            const rid = r?._id || r?.id;
            if (rid !== id) return r;
            const copy = { ...r };
            if (table === 'table5') copy.testParameter = {};
            if (table === 'table1') copy.sandShifts = {};
            if (table === 'table2') copy.clayShifts = {};
            if (table === 'table3') copy.mixshifts = {};
            if (table === 'table4') { copy.sandLump = undefined; copy.newSandWt = undefined; copy.sandFriability = {}; }
            return copy;
          });
          return updatedRecords;
        });
        let updatedDisplay;
        setDisplayRecords(prev => {
          updatedDisplay = prev.map(r => {
            const rid = r?._id || r?.id;
            if (rid !== id) return r;
            const copy = { ...r };
            if (table === 'table5') copy.testParameter = {};
            if (table === 'table1') copy.sandShifts = {};
            if (table === 'table2') copy.clayShifts = {};
            if (table === 'table3') copy.mixshifts = {};
            if (table === 'table4') { copy.sandLump = undefined; copy.newSandWt = undefined; copy.sandFriability = {}; }
            return copy;
          });
          return updatedDisplay;
        });

        // Find the updated record and if it's empty, delete the whole entry by id
        const updatedRec = (updatedRecords || []).find(r => (r?._id || r?.id) === id) || (updatedDisplay || []).find(r => (r?._id || r?.id) === id);
        if (updatedRec && isRecordDataEmpty(updatedRec)) {
          try {
            const deleteResp = await fetch(`http://localhost:5000/api/v1/sand-testing-records/${id}`, { method: 'DELETE', credentials: 'include' });
            const delRes = await deleteResp.json();
            if (delRes?.success || delRes?.status === 200) {
              setRecords(prev => prev.filter(r => (r?._id || r?.id) !== id));
              setDisplayRecords(prev => prev.filter(r => (r?._id || r?.id) !== id));
              showToast('Deleted record and date', 'success');
              return;
            }
          } catch (e) {
            console.error('Error deleting whole record:', e);
          }
        }

        await refetchByDateOrRange();
        showToast('Deleted successfully', 'success');
      } else {
        console.error('Delete response:', res);
        alert(res?.message || 'Delete failed.');
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Delete failed.');
    }
    finally {
      setDeleting(prev => { const cp = { ...prev }; delete cp[id]; return cp; });
    }
  };

  // helper to safely access nested values
  const getAt = (obj, path) => {
    if (!obj || !path) return '';
    const parts = path.split('.');
    let cur = obj;
    for (let p of parts) {
      if (cur == null) return '';
      cur = cur[p];
    }
    return cur == null ? '' : cur;
  };

  // robust getter for Table 1 Batch No across various shapes and casings
  const getBatchNoDisplay = (rec, key) => {
    if (!rec) return '';
    const altKey = key === 'shiftI' ? 'ShiftI' : (key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
    const s = (rec.sandShifts && (rec.sandShifts[key] || rec.sandShifts[altKey])) || {};
    // Allow batch number to be stored at either shift root or under batchNo object
    const bnRootCandidates = [s.batchNoValue, s.batchNo, s.batch, s.bnNo, s.batch_no, s.BatchNo];
    const bnRoot = bnRootCandidates.find(v => typeof v === 'string' && v.trim() !== '');
    if (bnRoot) return bnRoot;
    const bn = s?.batchNo;
    if (!bn) return '';
    if (typeof bn === 'string') return bn;
    try {
      // If a selector exists (type/selectedOption/selected/choice/kind), honor it
      const selector = (bn.type || bn.selectedOption || bn.selected || bn.choice || bn.kind || '').toString().toLowerCase().replace(/\s|_/g, '');
      const mapKey = selector.includes('bentonite') ? 'bentonite'
                   : selector.includes('coaldustpremix') ? 'coalDustPremix'
                   : selector.includes('coaldust') ? 'coalDust'
                   : selector.includes('premix') ? 'premix'
                   : '';
      const bySelector = mapKey ? (bn[mapKey] || bn.value || bn.batchNo || bn.number) : '';

      const direct = [
        bySelector,
        bn.bentonite, bn.coalDustPremix, bn.coalDust, bn.premix,
        bn.bentoniteBatch, bn.coalDustBatch, bn.premixBatch,
        bn.bentonite_no, bn.coal_dust_no, bn.premix_no,
        bn.value, bn.batchNo, bn.number,
      ];
      const nested = [
        bn.bentonite?.batchNo, bn.coalDust?.batchNo, bn.premix?.batchNo,
        bn.bentonite?.no, bn.coalDust?.no, bn.premix?.no,
        bn.bentonite?.value, bn.coalDust?.value, bn.premix?.value,
        bn.bentonite?.BatchNo, bn.coalDust?.BatchNo, bn.premix?.BatchNo,
      ];
      const anyObjVal = Array.isArray(bn) ? bn.find(Boolean) : Object.values(bn).find(v => v != null && v !== '');
      const v = [...direct, ...nested, anyObjVal].find(x => x != null && x !== '');
      return v ?? '';
    } catch (_) {
      return '';
    }
  };

  // helper to normalize date to YYYY-MM-DD (safe for comparing user-picked date vs stored ISO)
  const normalizeDateYMD = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateDMY = (d) => {
    const ymd = normalizeDateYMD(d);
    if (!ymd) return '';
    const [y, m, day] = ymd.split('-');
    return `${day}-${m}-${y}`;
  };

  // NEW: Only show entries that exactly match a single chosen date.
  // Uses fromDate if set, otherwise toDate. If neither set returns [].
  const getRecordsForModalBySingleDate = () => {
    const sel = normalizeDateYMD(selectedDate);
    if (!sel) return [];
    return records.filter(rec => normalizeDateYMD(rec?.date) === sel);
  };

  useEffect(() => {
    refetchByDateOrRange();
  }, [selectedDate]);

  // build headers for "All Data" (label + getter) — removed "TableX -" prefixes
  const buildAllHeaders = () => {
    const headers = [{ label: 'Date', get: rec => formatDateDMY(rec.date) || '' }];

    // Table1 fields (no "Table1 -" prefix)
    SHIFTS.forEach(shift => {
      const key = shift.key; // shiftI/shiftII/shiftIII
      const altKey = key === 'shiftI' ? 'ShiftI' : (key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
      headers.push(
        { label: `R. Sand (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.rSand`) || getAt(rec, `sandShifts.${altKey}.rSand`) || '' },
        { label: `N. Sand (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.nSand`) || getAt(rec, `sandShifts.${altKey}.nSand`) || '' },
        { label: `Mixing Mode (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.mixingMode`) || getAt(rec, `sandShifts.${altKey}.mixingMode`) || '' },
        { label: `Bentonite (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.bentonite`) || getAt(rec, `sandShifts.${altKey}.bentonite`) || '' },
      );
      if (key === 'shiftI') {
        headers.push({ label: `Batch NO (Bentonite) (${shift.label})`, get: rec => getBatchNoBentonite(rec, key) });
      } else {
        headers.push(
          { label: `Batch NO (Coal Dust) (${shift.label})`, get: rec => getBatchNoCoalDust(rec, key) },
          { label: `Batch NO (Premix) (${shift.label})`, get: rec => getBatchNoPremix(rec, key) }
        );
      }
    });

    // Table2 clay params (no prefix)
    SHIFTS.forEach(shift => {
      const altKey = shift.key === 'shiftI' ? 'shiftI' : (shift.key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
      headers.push(
        { label: `Total Clay (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.totalClay`) || getAt(rec, `clayShifts.${altKey}.totalClay`) || '' },
        { label: `Active Clay (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.activeClay`) || getAt(rec, `clayShifts.${altKey}.activeClay`) || '' },
        { label: `Dead Clay (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.deadClay`) || getAt(rec, `clayShifts.${altKey}.deadClay`) || '' },
        { label: `V.C.M (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.vcm`) || getAt(rec, `clayShifts.${altKey}.vcm`) || '' },
        { label: `L.O.I (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.loi`) || getAt(rec, `clayShifts.${altKey}.loi`) || '' },
        { label: `AFS No (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.afsNo`) || getAt(rec, `clayShifts.${altKey}.afsNo`) || '' },
        { label: `Fines (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.fines`) || getAt(rec, `clayShifts.${altKey}.fines`) || '' }
      );
    });

    // Table3 mix data per shift + total (no prefix)
    ['shiftI','shiftII','shiftIII','total'].forEach(shiftKey => {
      const labelShift = shiftKey === 'total' ? 'Total' : (shiftKey === 'shiftI' ? 'Shift I' : shiftKey === 'shiftII' ? 'Shift II' : 'Shift III');
      const bk = shiftKey === 'shiftI' ? 'ShiftI' : (shiftKey === 'shiftII' ? 'ShiftII' : (shiftKey === 'shiftIII' ? 'ShiftIII' : 'total'));
      headers.push(
        { label: `Mix No Start (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.mixno.start`) || '' },
        { label: `Mix No End (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.mixno.end`) || '' },
        { label: `Mix No Total (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.mixno.total`) || '' },
        { label: `No. Of Mix Rejected (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.numberOfMixRejected`) || '' },
        { label: `Return Sand Hopper Level (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.returnSandHopperLevel`) || '' }
      );
    });

    // Table4 sand properties (no prefix)
    headers.push(
      { label: 'Sand Lump', get: rec => getAt(rec, 'sandLump') || '' },
      { label: 'New Sand Wt', get: rec => getAt(rec, 'newSandWt') || '' }
    );
    SHIFTS.forEach(shift => {
      headers.push({ label: `Friability (${shift.label})`, get: rec => getAt(rec, `sandFriability.${shift.key}`) || '' });
    });

    // Table5 test parameters mapped from backend testParameter
    const getTable5Field = (rec, key) => {
      const tp = rec.testParameter || {};
      switch (key) {
        case 'sno': return tp.sno ?? '';
        case 'time': return tp.time ?? '';
        case 'mixNo': return tp.mixno ?? '';
        case 'permeability': return tp.permeability ?? '';
        case 'gcsCheckpoint': {
          const a = typeof tp.gcsFdyA === 'number' ? tp.gcsFdyA : 0;
          const b = typeof tp.gcsFdyB === 'number' ? tp.gcsFdyB : 0;
          if (a > 0) return 'FDY-A';
          if (b > 0) return 'FDY-B';
          return '';
        }
        case 'gcsValue': {
          const a = typeof tp.gcsFdyA === 'number' ? tp.gcsFdyA : 0;
          const b = typeof tp.gcsFdyB === 'number' ? tp.gcsFdyB : 0;
          if (a > 0) return a;
          if (b > 0) return b;
          return '';
        }
        case 'wts': return tp.wts ?? '';
        case 'moisture': return tp.moisture ?? '';
        case 'compactability': return tp.compactability ?? '';
        case 'compressability': return tp.compressibility ?? '';
        case 'waterLitrePerKgMix': return tp.waterLitre ?? '';
        case 'sandTempBC': return tp.sandTemp?.BC ?? '';
        case 'sandTempWU': return tp.sandTemp?.WU ?? '';
        case 'sandTempSSU': return tp.sandTemp?.SSUmax ?? '';
        case 'newSandKgsPerMould': return tp.newSandKgs ?? '';
        case 'bentoniteCheckpoint': {
          const kPremix = (tp.bentoniteWithPremix?.Kgs ?? tp.bentoniteWithPremix?.Percent) ?? 0;
          const kOnly = (tp.bentonite?.Kgs ?? tp.bentonite?.Percent) ?? 0;
          if (kPremix && Number(kPremix) > 0) return 'With Premix';
          if (kOnly && Number(kOnly) > 0) return 'Only';
          return '';
        }
        case 'bentoniteWithPremix': {
          const v = tp.bentoniteWithPremix?.Kgs ?? tp.bentoniteWithPremix?.Percent ?? '';
          return (v === 0 || v === '0') ? '' : v;
        }
        case 'bentoniteOnly': {
          const v = tp.bentonite?.Kgs ?? tp.bentonite?.Percent ?? '';
          return (v === 0 || v === '0') ? '' : v;
        }
        case 'premixCoalDustCheckpoint': {
          const kPremix = (tp.premix?.Kgs ?? tp.premix?.Percent) ?? 0;
          const kCoal = (tp.coalDust?.Kgs ?? tp.coalDust?.Percent) ?? 0;
          if (kPremix && Number(kPremix) > 0) return 'Premix';
          if (kCoal && Number(kCoal) > 0) return 'Coal Dust';
          return '';
        }
        case 'premixKgsMix': return tp.premix?.Kgs ?? '';
        case 'coalDustKgsMix': return tp.coalDust?.Kgs ?? '';
        case 'lcScmCompactabilityCheckpoint': return tp.CompactabilitySettings ?? '';
        case 'lcScmCompactabilityValue': return tp.lc ?? '';
        case 'mouldStrengthShearCheckpoint': return tp.shearStrengthSetting ?? '';
        case 'mouldStrengthShearValue': return tp.mouldStrength ?? '';
        case 'preparedSandLumpsPerKg': return tp.preparedSandlumps ?? '';
        case 'itemName': return tp.itemName ?? '';
        case 'remarks': return tp.remarks ?? '';
        default: return '';
      }
    };

    TABLE5_KEYS.forEach((key, idx) => {
      const label = TABLE5_ROWS[idx] || key;
      headers.push({ label: `${label}`, get: rec => getTable5Field(rec, key) });
    });

    return headers;
  };

  const renderAllData = () => {
    const headers = buildAllHeaders();
    const rows = displayRecords.length ? displayRecords : [];
    return (
      <div className="sand-testing-table-wrapper" style={{ overflowX: 'auto', marginTop: 16 }}>
        <table className="sand-testing-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap', background: '#f1f5f8', fontSize: '0.75rem' }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={headers.length} style={{ padding: 20, textAlign: 'left' }}>
                      No records found.
                    </td>
                  </tr>
                );
              }
              // Group rows by display date key
              const groupsMap = rows.reduce((acc, rec) => {
                const k = formatDateDMY(rec.date) || '';
                if (!acc[k]) acc[k] = [];
                acc[k].push(rec);
                return acc;
              }, {});
              const groups = Object.entries(groupsMap);

              return groups.flatMap(([dateKey, recs]) =>
                recs.map((rec, idx) => (
                  <tr key={`${dateKey}-${idx}`}>
                    {headers.map((h, cIdx) => {
                      // Date column (first header): render once per group with rowSpan
                      if (cIdx === 0) {
                        if (idx === 0) {
                          return (
                            <td key={`date-${dateKey}`} rowSpan={recs.length} style={{ padding: '8px 10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                              {dateKey}
                            </td>
                          );
                        }
                        return null;
                      }
                      // Other columns
                      return (
                        <td key={cIdx} style={{ padding: '8px 10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                          {h.label === 'Actions' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                title="Edit"
                                onClick={() => openEditTpModal(rec)}
                                style={{ border: '1px solid #3b82f6', color: '#1d4ed8', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                              >
                                <PencilLine size={16} />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => handleDeleteRecord(rec)}
                                disabled={!!deleting[(rec?._id || rec?.id || rec?.recordId || rec?.Id || rec?.ID)]}
                                style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', opacity: deleting[(rec?._id || rec?.id || rec?.recordId || rec?.Id || rec?.ID)] ? 0.6 : 1 }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : (
                            String(h.get(rec) ?? '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              );
            })()}
          </tbody>
        </table>
      </div>
    );
  };

  // Inline renderers for Table 1–4 (columnar tables like Table 5)
  const buildTable1Headers = () => {
    const headers = [{ label: 'Date', get: rec => formatDateDMY(rec.date) || '' }];
    SHIFTS.forEach(shift => {
      const key = shift.key;
      const altKey = key === 'shiftI' ? 'ShiftI' : (key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
      headers.push(
        { label: `R. Sand (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.rSand`) || getAt(rec, `sandShifts.${altKey}.rSand`) || '' },
        { label: `N. Sand (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.nSand`) || getAt(rec, `sandShifts.${altKey}.nSand`) || '' },
        { label: `Mixing Mode (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.mixingMode`) || getAt(rec, `sandShifts.${altKey}.mixingMode`) || '' },
        { label: `Bentonite (${shift.label})`, get: rec => getAt(rec, `sandShifts.${key}.bentonite`) || getAt(rec, `sandShifts.${altKey}.bentonite`) || '' },
      );
      if (key === 'shiftI') {
        headers.push({ label: `Batch NO (Bentonite) (${shift.label})`, get: rec => getBatchNoBentonite(rec, key) });
      } else {
        headers.push(
          { label: `Batch NO (Coal Dust) (${shift.label})`, get: rec => getBatchNoCoalDust(rec, key) },
          { label: `Batch NO (Premix) (${shift.label})`, get: rec => getBatchNoPremix(rec, key) }
        );
      }
    });
    return headers;
  };

  const renderTable1Inline = () => {
    const data = getRecordsForModalBySingleDate();
    if (!data.length) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 1</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>SHIFT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>I</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>II</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>III</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    const groups = data.reduce((acc, rec) => {
      const k = formatDateDMY(rec.date) || '';
      (acc[k] ||= []).push(rec);
      return acc;
    }, {});
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(groups).map(([dateKey, recs]) =>
          recs.map((rec, idx) => (
            <div key={`${dateKey}-t1b-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 600 }}>Table 1</div>
                {(() => {
                  const rid = rec?._id || rec?.id;
                  const isEditing = t1EditModalOpen && t1EditMeta?.id === rid;
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isEditing ? (
                        <>
                          <button title="Edit" onClick={() => openT1EditModal(rec)} style={{ border: '1px solid #3b82f6', color: '#1d4ed8', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                            <PencilLine size={16} />
                          </button>
                          <button title="Delete" onClick={() => handleDeleteRecord(rec, 'table1')} disabled={!!deleting[rid]} style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: deleting[rid] ? 0.6 : 1 }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button title="Save" onClick={submitT1Edit} style={{ border: 'none', color: '#fff', background: '#16a34a', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                          <button title="Cancel" onClick={closeT1EditModal} style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>I</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>II</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>III</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rid = rec?._id || rec?.id;
                      const isEditing = t1EditModalOpen && t1EditMeta?.id === rid;
                      const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 };
                      const rows = [
                        { label: 'R. Sand ( Kgs/Mix )', key: 'rSand' },
                        { label: 'N. Sand ( Kgs/Mix )', key: 'nSand' },
                        { label: 'Mixing Mode', key: 'mixingMode' },
                        { label: 'Bentonite ( Kgs/Mix )', key: 'bentonite' },
                      ];
                      const readVal = (k, field) => getAt(rec, `sandShifts.${k}.${field}`) || getAt(rec, `sandShifts.${k === 'shiftI' ? 'ShiftI' : k === 'shiftII' ? 'ShiftII' : 'ShiftIII'}.${field}`) || '';
                      return rows.map((row) => (
                        <tr key={row.label}>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' }}>{row.label}</td>
                          {['shiftI','shiftII','shiftIII'].map((sk) => (
                            <td key={sk} style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                              {!isEditing ? (
                                String(readVal(sk, row.key) ?? '')
                              ) : (
                                <input
                                  value={t1EditForm[sk][row.key] ?? ''}
                                  onChange={(e) => setT1EditForm(p => ({ ...p, [sk]: { ...p[sk], [row.key]: e.target.value } }))}
                                  style={inputStyle}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto', borderTop: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>BATCH No.</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Bentonite</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Coal Dust / Premix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rid = rec?._id || rec?.id;
                      const isEditing = t1EditModalOpen && t1EditMeta?.id === rid;
                      const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 };
                      const coalDisplay = (
                        getBatchNoCoalDust(rec, 'shiftII') || getBatchNoPremix(rec, 'shiftII') ||
                        getBatchNoCoalDust(rec, 'shiftIII') || getBatchNoPremix(rec, 'shiftIII') ||
                        getBatchNoCoalDust(rec, 'shiftI') || getBatchNoPremix(rec, 'shiftI') ||
                        ''
                      );
                      const coalValue = (
                        t1EditForm.shiftII?.batchNoCoalDustPremix ||
                        t1EditForm.shiftIII?.batchNoCoalDustPremix ||
                        t1EditForm.shiftI?.batchNoCoalDustPremix ||
                        ''
                      );
                      return (
                        <tr>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' }}></td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                            {!isEditing ? (
                              String(getBatchNoBentonite(rec, 'shiftI') || '')
                            ) : (
                              <input
                                value={t1EditForm.shiftI?.batchNoBentonite ?? ''}
                                onChange={(e) => setT1EditForm(p => ({ ...p, shiftI: { ...p.shiftI, batchNoBentonite: e.target.value } }))}
                                style={inputStyle}
                              />
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                            {!isEditing ? (
                              String(coalDisplay)
                            ) : (
                              <input
                                value={coalValue}
                                onChange={(e) => setT1EditForm(p => ({
                                  ...p,
                                  shiftII: { ...p.shiftII, batchNoCoalDustPremix: e.target.value },
                                  shiftIII: { ...p.shiftIII, batchNoCoalDustPremix: e.target.value }
                                }))}
                                style={inputStyle}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const buildTable2Headers = () => {
    const headers = [{ label: 'Date', get: rec => formatDateDMY(rec.date) || '' }];
    SHIFTS.forEach(shift => {
      const altKey = shift.key === 'shiftI' ? 'shiftI' : (shift.key === 'shiftII' ? 'ShiftII' : 'ShiftIII');
      headers.push(
        { label: `Total Clay (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.totalClay`) || getAt(rec, `clayShifts.${altKey}.totalClay`) || '' },
        { label: `Active Clay (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.activeClay`) || getAt(rec, `clayShifts.${altKey}.activeClay`) || '' },
        { label: `Dead Clay (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.deadClay`) || getAt(rec, `clayShifts.${altKey}.deadClay`) || '' },
        { label: `V.C.M (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.vcm`) || getAt(rec, `clayShifts.${altKey}.vcm`) || '' },
        { label: `L.O.I (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.loi`) || getAt(rec, `clayShifts.${altKey}.loi`) || '' },
        { label: `AFS No (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.afsNo`) || getAt(rec, `clayShifts.${altKey}.afsNo`) || '' },
        { label: `Fines (${shift.label})`, get: rec => getAt(rec, `clayShifts.${shift.key}.fines`) || getAt(rec, `clayShifts.${altKey}.fines`) || '' }
      );
    });
    return headers;
  };

  const renderTable2Inline = () => {
    const data = getRecordsForModalBySingleDate();
    if (!data.length) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 2</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>I</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>II</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>III</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    const groups = data.reduce((acc, rec) => {
      const k = formatDateDMY(rec.date) || '';
      (acc[k] ||= []).push(rec);
      return acc;
    }, {});
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(groups).map(([dateKey, recs]) =>
          recs.map((rec, idx) => (
            <div key={`${dateKey}-t2b-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 600 }}>Table 2</div>
                {(() => {
                  const rid = rec?._id || rec?.id;
                  const isEditing = t2EditModalOpen && t2EditMeta?.id === rid;
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isEditing ? (
                        <>
                          <button title="Edit" onClick={() => openT2EditModal(rec)} style={{ border: '1px solid #3b82f6', color: '#1d4ed8', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                            <PencilLine size={16} />
                          </button>
                          <button title="Delete" onClick={() => handleDeleteRecord(rec, 'table2')} disabled={!!deleting[rid]} style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: deleting[rid] ? 0.6 : 1 }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button title="Save" onClick={submitT2Edit} style={{ border: 'none', color: '#fff', background: '#16a34a', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                          <button title="Cancel" onClick={closeT2EditModal} style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>I</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>II</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>III</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rid = rec?._id || rec?.id;
                      const isEditing = t2EditModalOpen && t2EditMeta?.id === rid;
                      const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 };
                      const rows = [
                        { label: 'Total Clay', key: 'totalClay' },
                        { label: 'Active Clay', key: 'activeClay' },
                        { label: 'Dead Clay', key: 'deadClay' },
                        { label: 'V.C.M', key: 'vcm' },
                        { label: 'L.O.I', key: 'loi' },
                        { label: 'AFS No', key: 'afsNo' },
                        { label: 'Fines', key: 'fines' },
                      ];
                      const readVal = (sk, k) => getAt(rec, `clayShifts.${sk}.${k}`) || getAt(rec, `clayShifts.${sk === 'shiftI' ? 'ShiftI' : sk === 'shiftII' ? 'ShiftII' : 'ShiftIII'}.${k}`) || '';
                      return rows.map(row => (
                        <tr key={row.label}>
                          <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' }}>{row.label}</td>
                          {['shiftI','shiftII','shiftIII'].map(sk => (
                            <td key={sk} style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                              {!isEditing ? (
                                String(readVal(sk, row.key) ?? '')
                              ) : (
                                <input
                                  value={t2EditForm[sk][row.key] ?? ''}
                                  onChange={(e) => setT2EditForm(p => ({ ...p, [sk]: { ...p[sk], [row.key]: e.target.value } }))}
                                  style={inputStyle}
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const buildTable3Headers = () => {
    const headers = [{ label: 'Date', get: rec => formatDateDMY(rec.date) || '' }];
    ['shiftI','shiftII','shiftIII','total'].forEach(shiftKey => {
      const labelShift = shiftKey === 'total' ? 'Total' : (shiftKey === 'shiftI' ? 'Shift I' : shiftKey === 'shiftII' ? 'Shift II' : 'Shift III');
      const bk = shiftKey === 'shiftI' ? 'ShiftI' : (shiftKey === 'shiftII' ? 'ShiftII' : (shiftKey === 'shiftIII' ? 'ShiftIII' : 'total'));
      headers.push(
        { label: `Mix No Start (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.mixno.start`) || '' },
        { label: `Mix No End (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.mixno.end`) || '' },
        { label: `Mix No Total (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.mixno.total`) || '' },
        ...(shiftKey !== 'total' ? [
          { label: `No. Of Mix Rejected (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.numberOfMixRejected`) || '' },
          { label: `Return Sand Hopper Level (${labelShift})`, get: rec => getAt(rec, `mixshifts.${bk}.returnSandHopperLevel`) || '' }
        ] : [])
      );
    });
    return headers;
  };

  const renderTable3Inline = () => {
    const data = getRecordsForModalBySingleDate();
    if (!data.length) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 3</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Start</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>End</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>No. of Mix Rejected</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Return sand Hopper level</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    const groups = data.reduce((acc, rec) => {
      const k = formatDateDMY(rec.date) || '';
      (acc[k] ||= []).push(rec);
      return acc;
    }, {});
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(groups).map(([dateKey, recs]) =>
          recs.map((rec, idx) => (
            <div key={`${dateKey}-t3b-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 600 }}>Table 3</div>
                {(() => {
                  const rid = rec?._id || rec?.id;
                  const isEditing = t3EditModalOpen && t3EditMeta?.id === rid;
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isEditing ? (
                        <>
                          <button title="Edit" onClick={() => openT3EditModal(rec)} style={{ border: '1px solid #3b82f6', color: '#1d4ed8', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                            <PencilLine size={16} />
                          </button>
                          <button title="Delete" onClick={() => handleDeleteRecord(rec, 'table3')} disabled={!!deleting[rid]} style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: deleting[rid] ? 0.6 : 1 }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button title="Save" onClick={submitT3Edit} style={{ border: 'none', color: '#fff', background: '#16a34a', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                          <button title="Cancel" onClick={closeT3EditModal} style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Start</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>End</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>No. of Mix Rejected</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Return sand Hopper level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rid = rec?._id || rec?.id;
                      const isEditing = t3EditModalOpen && t3EditMeta?.id === rid;
                      const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 };
                      const renderCell = (val, onChange) => !isEditing ? String(val ?? '') : (
                        <input value={val ?? ''} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
                      );
                      const rows = ['ShiftI','ShiftII','ShiftIII'];
                      return (
                        <>
                          {rows.map((k, i) => (
                            <tr key={k}>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' }}>{i === 0 ? 'I' : i === 1 ? 'II' : 'III'}</td>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                                {renderCell(getAt(rec, `mixshifts.${k}.mixno.start`) || '', v => setT3EditForm(p => ({ ...p, [k]: { ...p[k], mixnoStart: v } })))}
                              </td>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                                {renderCell(getAt(rec, `mixshifts.${k}.mixno.end`) || '', v => setT3EditForm(p => ({ ...p, [k]: { ...p[k], mixnoEnd: v } })))}
                              </td>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                                {renderCell(getAt(rec, `mixshifts.${k}.mixno.total`) || '', v => setT3EditForm(p => ({ ...p, [k]: { ...p[k], mixnoTotal: v } })))}
                              </td>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                                {renderCell(getAt(rec, `mixshifts.${k}.numberOfMixRejected`) || '', v => setT3EditForm(p => ({ ...p, [k]: { ...p[k], numberOfMixRejected: v } })))}
                              </td>
                              <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                                {renderCell(getAt(rec, `mixshifts.${k}.returnSandHopperLevel`) || '', v => setT3EditForm(p => ({ ...p, [k]: { ...p[k], returnSandHopperLevel: v } })))}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td style={{ padding: '8px 10px', borderTop: '1px solid #e5e7eb', fontWeight: 600 }}>Total</td>
                            <td style={{ padding: '8px 10px', borderTop: '1px solid #e5e7eb' }}>
                              {renderCell(getAt(rec, 'mixshifts.total.mixno.start') || '', v => setT3EditForm(p => ({ ...p, total: { ...p.total, mixnoStart: v } })))}
                            </td>
                            <td style={{ padding: '8px 10px', borderTop: '1px solid #e5e7eb' }}>
                              {renderCell(getAt(rec, 'mixshifts.total.mixno.end') || '', v => setT3EditForm(p => ({ ...p, total: { ...p.total, mixnoEnd: v } })))}
                            </td>
                            <td style={{ padding: '8px 10px', borderTop: '1px solid #e5e7eb' }}>
                              {renderCell(getAt(rec, 'mixshifts.total.mixno.total') || '', v => setT3EditForm(p => ({ ...p, total: { ...p.total, mixnoTotal: v } })))}
                            </td>
                            <td style={{ padding: '8px 10px', borderTop: '1px solid #e5e7eb' }}>
                              {renderCell(getAt(rec, 'mixshifts.total.numberOfMixRejected') || '', v => setT3EditForm(p => ({ ...p, total: { ...p.total, numberOfMixRejected: v } })))}
                            </td>
                            <td style={{ padding: '8px 10px', borderTop: '1px solid #e5e7eb' }}></td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const buildTable4Headers = () => {
    const headers = [
      { label: 'Date', get: rec => formatDateDMY(rec.date) || '' },
      { label: 'Sand Lump', get: rec => getAt(rec, 'sandLump') || '' },
      { label: 'New Sand Wt', get: rec => getAt(rec, 'newSandWt') || '' }
    ];
    SHIFTS.forEach(shift => {
      headers.push({ label: `Friability (${shift.label})`, get: rec => getAt(rec, `sandFriability.${shift.key}`) || '' });
    });
    return headers;
  };

  const renderTable4Inline = () => {
    const data = getRecordsForModalBySingleDate();
    if (!data.length) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 4</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>I</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>II</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>III</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    const groups = data.reduce((acc, rec) => {
      const k = formatDateDMY(rec.date) || '';
      (acc[k] ||= []).push(rec);
      return acc;
    }, {});
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(groups).map(([dateKey, recs]) =>
          recs.map((rec, idx) => {
            const rid = rec?._id || rec?.id;
            const isEditing = t4EditModalOpen && t4EditMeta?.id === rid;
            const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6 };
            const val = (path, fallback = '') => getAt(rec, path) ?? fallback;
            return (
              <div key={`${dateKey}-t4-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 600 }}>Table 4</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isEditing ? (
                      <>
                        <button title="Edit" onClick={() => openT4EditModal(rec)} style={{ border: '1px solid #3b82f6', color: '#1d4ed8', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                          <PencilLine size={16} />
                        </button>
                        <button title="Delete" onClick={() => handleDeleteRecord(rec, 'table4')} disabled={!!deleting[rid]} style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', opacity: deleting[rid] ? 0.6 : 1 }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button title="Save" onClick={submitT4Edit} style={{ border: 'none', color: '#fff', background: '#16a34a', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                        <button title="Cancel" onClick={closeT4EditModal} style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Top: Sand Lump & New Sand Wt */}
                <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#334155', marginBottom: 6 }}>Sand Lump</div>
                      {!isEditing ? (
                        <div>{String(val('sandLump', ''))}</div>
                      ) : (
                        <input value={t4EditForm.sandLump ?? ''} onChange={(e) => setT4EditForm(p => ({ ...p, sandLump: e.target.value }))} style={inputStyle} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#334155', marginBottom: 6 }}>New Sand Wt</div>
                      {!isEditing ? (
                        <div>{String(val('newSandWt', ''))}</div>
                      ) : (
                        <input value={t4EditForm.newSandWt ?? ''} onChange={(e) => setT4EditForm(p => ({ ...p, newSandWt: e.target.value }))} style={inputStyle} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom: Friability by Shift */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>I</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>II</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>III</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', whiteSpace: 'nowrap' }}>Prepared Sand Friability (8.0 - 13.0 %)</td>
                        {['shiftI','shiftII','shiftIII'].map(sk => (
                          <td key={sk} style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>
                            {!isEditing ? (
                              String(getAt(rec, `sandFriability.${sk}`) || '')
                            ) : (
                              <input
                                value={t4EditForm.sandFriability?.[sk] ?? ''}
                                onChange={(e) => setT4EditForm(p => ({ ...p, sandFriability: { ...(p.sandFriability || {}), [sk]: e.target.value } }))}
                                style={inputStyle}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const getTable5Data = () => {
    const src = (() => { const s = getRecordsForModalBySingleDate(); return s.length ? s : displayRecords; })();
    const mapRecord = (rec) => {
      const obj = { __rec: rec };
      const tp = rec.testParameter || {};
      obj.sno = tp.sno ?? '';
      obj.time = tp.time ?? '';
      obj.mixNo = tp.mixno ?? '';
      obj.permeability = tp.permeability ?? '';
      {
        const a = typeof tp.gcsFdyA === 'number' ? tp.gcsFdyA : 0;
        const b = typeof tp.gcsFdyB === 'number' ? tp.gcsFdyB : 0;
        if (a > 0) {
          obj.gcsCheckpoint = 'FDY-A';
          obj.gcsValue = a;
        } else if (b > 0) {
          obj.gcsCheckpoint = 'FDY-B';
          obj.gcsValue = b;
        } else {
          obj.gcsCheckpoint = '';
          obj.gcsValue = '';
        }
      }
      obj.wts = tp.wts ?? '';
      obj.moisture = tp.moisture ?? '';
      obj.compactability = tp.compactability ?? '';
      obj.compressability = tp.compressibility ?? '';
      obj.waterLitrePerKgMix = tp.waterLitre ?? '';
      obj.sandTempBC = tp.sandTemp?.BC ?? '';
      obj.sandTempWU = tp.sandTemp?.WU ?? '';
      obj.sandTempSSU = tp.sandTemp?.SSUmax ?? '';
      obj.newSandKgsPerMould = tp.newSandKgs ?? '';
      // Derive bentonite checkpoint label from Kgs presence
      {
        const kPremix = tp.bentoniteWithPremix?.Kgs ?? 0;
        const kOnly = tp.bentonite?.Kgs ?? 0;
        if (kPremix && Number(kPremix) > 0) obj.bentoniteCheckpoint = 'With Premix';
        else if (kOnly && Number(kOnly) > 0) obj.bentoniteCheckpoint = 'Only';
        else obj.bentoniteCheckpoint = '';
      }
      // Prefer Kgs for display
      {
        const v1 = tp.bentoniteWithPremix?.Kgs ?? tp.bentoniteWithPremix?.Percent ?? '';
        obj.bentoniteWithPremix = (v1 === 0 || v1 === '0') ? '' : v1;
      }
      {
        const v2 = tp.bentonite?.Kgs ?? tp.bentonite?.Percent ?? '';
        obj.bentoniteOnly = (v2 === 0 || v2 === '0') ? '' : v2;
      }
      // Derive premix/coal dust checkpoint from Kgs
      {
        const kPremix2 = tp.premix?.Kgs ?? 0;
        const kCoal2 = tp.coalDust?.Kgs ?? 0;
        if (kPremix2 && Number(kPremix2) > 0) obj.premixCoalDustCheckpoint = 'Premix';
        else if (kCoal2 && Number(kCoal2) > 0) obj.premixCoalDustCheckpoint = 'Coal Dust';
        else obj.premixCoalDustCheckpoint = '';
      }
      obj.premixKgsMix = tp.premix?.Kgs ?? '';
      obj.coalDustKgsMix = tp.coalDust?.Kgs ?? '';
      obj.lcScmCompactabilityCheckpoint = tp.CompactabilitySettings ?? '';
      obj.lcScmCompactabilityValue = tp.lc ?? '';
      obj.mouldStrengthShearCheckpoint = tp.shearStrengthSetting ?? '';
      obj.mouldStrengthShearValue = tp.mouldStrength ?? '';
      obj.preparedSandLumpsPerKg = tp.preparedSandlumps ?? '';
      obj.itemName = tp.itemName ?? '';
      obj.remarks = tp.remarks ?? '';
      return obj;
    };
    return src.map(mapRecord);
  };

  

  const renderTable5 = () => {
    const data = getTable5Data();
    return (
      <div className="sand-testing-table-wrapper" style={{ overflowX: 'auto', marginTop: 16 }}>
        <table className="sand-testing-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap', background: '#f1f5f8', fontSize: '0.75rem' }}>Date</th>
              {TABLE5_ROWS.map(row => (
                <th key={row} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap', background: '#f1f5f8', fontSize: '0.75rem' }}>{row}</th>
              ))}
              <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap', background: '#f1f5f8', fontSize: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (data.length === 0) {
                return (
                  <tr>
                    <td colSpan={TABLE5_ROWS.length + 2} style={{ padding: 20, textAlign: 'left' }}>No records found.</td>
                  </tr>
                );
              }
              const groups = data.reduce((acc, row) => {
                const k = formatDateDMY(row.__rec?.date) || '';
                (acc[k] ||= []).push(row);
                return acc;
              }, {});
              return Object.entries(groups).flatMap(([dateKey, recs]) => (
                recs.map((row, idx) => (
                  <tr key={`${dateKey}-t5-${idx}`}>
                    {idx === 0 ? (
                      <td rowSpan={recs.length} style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{dateKey}</td>
                    ) : null}
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.sno || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.time || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.mixNo || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.permeability || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.gcsCheckpoint || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.gcsValue || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.wts || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.moisture || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.compactability || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.compressability || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.waterLitrePerKgMix || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.sandTempBC || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.sandTempWU || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.sandTempSSU || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.newSandKgsPerMould || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.bentoniteCheckpoint || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.bentoniteWithPremix || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.bentoniteOnly || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.premixCoalDustCheckpoint || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.premixKgsMix || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.coalDustKgsMix || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.lcScmCompactabilityCheckpoint || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.lcScmCompactabilityValue || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.mouldStrengthShearCheckpoint || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.mouldStrengthShearValue || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.preparedSandLumpsPerKg || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.itemName || ''}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{row.remarks || ''}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button title="Edit" onClick={() => openEditTpModal(row.__rec)} style={{ border: '1px solid #3b82f6', color: '#1d4ed8', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                          <PencilLine size={16} />
                        </button>
                        <button title="Delete" onClick={() => handleDeleteRecord(row.__rec, 'table5')} disabled={!!deleting[(row.__rec?._id || row.__rec?.id)]} style={{ border: '1px solid #ef4444', color: '#dc2626', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', opacity: deleting[(row.__rec?._id || row.__rec?.id)] ? 0.6 : 1 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ));
            })()}
          </tbody>
        </table>
      </div>
    );
  };
  return (
    <>
      {toast.show && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            padding: '10px 14px',
            borderRadius: 8,
            color: '#065f46',
            background: '#d1fae5',
            border: '1px solid #10b981',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 2000,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {toast.message}
        </div>
      )}
      {editTpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: 20 }}
          onClick={closeEditTpModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(720px, 94%)', maxHeight: '92vh', overflow: 'hidden', background: '#fff', borderRadius: 14, boxShadow: '0 18px 60px rgba(0,0,0,0.28)', padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Edit Entry</h3>
              <button onClick={closeEditTpModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, maxHeight: '68vh', overflowY: 'auto', paddingRight: 4 }}>
              {[
                { label: 'S.No', key: 'sno' },
                { label: 'Time', key: 'time', type: 'time' },
                { label: 'Mix No', key: 'mixNo' },
                { label: 'Permeability', key: 'permeability', type: 'number' },
                { label: 'WTS', key: 'wts', type: 'number' },
                { label: 'Moisture', key: 'moisture', type: 'number' },
                { label: 'Compactability', key: 'compactability', type: 'number' },
                { label: 'Compressability', key: 'compressability', type: 'number' },
                { label: 'Water Litre/Kg Mix', key: 'waterLitrePerKgMix', type: 'number' },
                { label: 'Sand Temp BC', key: 'sandTempBC', type: 'number' },
                { label: 'Sand Temp WU', key: 'sandTempWU', type: 'number' },
                { label: 'Sand Temp SSU', key: 'sandTempSSU', type: 'number' },
                { label: 'New Sand Kgs/Mould', key: 'newSandKgsPerMould', type: 'number' },
                { label: 'Premix Kgs/Mix', key: 'premixKgsMix', type: 'number' },
                { label: 'Coal Dust Kgs/Mix', key: 'coalDustKgsMix', type: 'number' },
                { label: 'Prepared Sand Lumps/Kg', key: 'preparedSandLumpsPerKg', type: 'number' },
                { label: 'Item Name', key: 'itemName' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type || 'text'} value={editForm[f.key] ?? ''} onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="sand-table5-input" />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>GCS Checkpoint</label>
                  <select value={editForm.gcsCheckpoint} onChange={(e) => setEditForm(p => ({ ...p, gcsCheckpoint: e.target.value }))} className="sand-table5-input">
                    <option value="">Select</option>
                    <option value="fdyA">FDY-A</option>
                    <option value="fdyB">FDY-B</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>GCS Value</label>
                  <input type="number" value={editForm.gcsValue} onChange={(e) => setEditForm(p => ({ ...p, gcsValue: e.target.value }))} className="sand-table5-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Bentonite Checkpoint</label>
                  <select value={editForm.bentoniteCheckpoint} onChange={(e) => setEditForm(p => ({ ...p, bentoniteCheckpoint: e.target.value }))} className="sand-table5-input">
                    <option value="">Select</option>
                    <option value="withPremix">With Premix</option>
                    <option value="only">Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Bentonite With Premix (Kgs)</label>
                  <input type="number" value={editForm.bentoniteWithPremix} onChange={(e) => setEditForm(p => ({ ...p, bentoniteWithPremix: e.target.value }))} className="sand-table5-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Bentonite Only (Kgs)</label>
                  <input type="number" value={editForm.bentoniteOnly} onChange={(e) => setEditForm(p => ({ ...p, bentoniteOnly: e.target.value }))} className="sand-table5-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Premix/Coal Dust Checkpoint</label>
                  <select value={editForm.premixCoalDustCheckpoint} onChange={(e) => setEditForm(p => ({ ...p, premixCoalDustCheckpoint: e.target.value }))} className="sand-table5-input">
                    <option value="">Select</option>
                    <option value="premix">Premix</option>
                    <option value="coalDust">Coal Dust</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>LC SCM / Compactability Checkpoint</label>
                  <select value={editForm.lcScmCompactabilityCheckpoint} onChange={(e) => setEditForm(p => ({ ...p, lcScmCompactabilityCheckpoint: e.target.value }))} className="sand-table5-input">
                    <option value="">Select</option>
                    <option value="lcScm">LC SCM</option>
                    <option value="compactabilitySetting">Compactability At1</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>LC SCM / Compactability Value</label>
                  <input type="number" value={editForm.lcScmCompactabilityValue} onChange={(e) => setEditForm(p => ({ ...p, lcScmCompactabilityValue: e.target.value }))} className="sand-table5-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Mould/Shear Checkpoint</label>
                  <select value={editForm.mouldStrengthShearCheckpoint} onChange={(e) => setEditForm(p => ({ ...p, mouldStrengthShearCheckpoint: e.target.value }))} className="sand-table5-input">
                    <option value="mouldStrength">Mould strength</option>
                    <option value="shearStrength">Shear Strength</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Mould/Shear Value</label>
                  <input type="number" value={editForm.mouldStrengthShearValue} onChange={(e) => setEditForm(p => ({ ...p, mouldStrengthShearValue: e.target.value }))} className="sand-table5-input" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 4 }}>Remarks</label>
                  <input value={editForm.remarks} onChange={(e) => setEditForm(f => ({ ...f, remarks: e.target.value }))} className="sand-table5-input" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={closeEditTpModal} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={submitEditTp} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Update Entry</button>
            </div>
          </div>
        </div>
      )}
      <div className="sand-testing-report-container">
        <div className="sand-testing-report-header">
          <div className="sand-testing-report-header-text">
            <BookOpen size={22} />
            <h2>Sand Testing Record - Report</h2>
          </div>
        </div>
        <div className="sand-testing-filter-container">
          <div className="sand-testing-filter-group">
            <label>Date</label>
            <CustomDatePicker
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              name="selectedDate"
              placeholder="e.g: DD/MM/YY"
            />
          </div>
        </div>

        {/* Row 1: Table 1 and Table 2 side-by-side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 16, marginTop: 16 }}>
          <div>{renderTable1Inline()}</div>
          <div>{renderTable2Inline()}</div>
        </div>

        {/* Row 2: Table 3 */}
        <div style={{ marginTop: 24 }}>
          {renderTable3Inline()}
        </div>

        {/* Row 3: Table 4 */}
        <div style={{ marginTop: 24 }}>
          {renderTable4Inline()}
        </div>

        {/* Bottom: Sand Properties & Test Parameters */}
        <div style={{ marginTop: 24 }}>
          {renderTable5()}
        </div>

      </div>
      </>
  );
};

export default SandTestingRecordReport;