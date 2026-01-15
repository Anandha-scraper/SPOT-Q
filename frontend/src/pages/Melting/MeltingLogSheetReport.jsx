import React, { useState, useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { DatePicker, FilterButton, ClearButton } from '../../Components/Buttons';
import '../../styles/PageStyles/Melting/MeltingLogSheetReport.css';

const MeltingLogSheetReport = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [show, setShow] = useState({ table0: true, table1: false, table2: false, table3: false, table4: false, table5: false });

  const handleFilter = async () => {
    if (!fromDate) return;
    setLoading(true);
    setError('');
    try {
      const start = fromDate;
      const end = toDate || fromDate;
      const data = await api.get(`/v1/melting-logs?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : [];
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.date || a.createdAt || 0).getTime();
          const db = new Date(b.date || b.createdAt || 0).getTime();
          return db - da;
        });
        setEntries(sorted.slice(0, 5));
      } else {
        setEntries([]);
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch report data');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setError('');
    // Load recent entries to show initial view
    const loadRecent = async () => {
      try {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        const past = new Date(today);
        past.setDate(past.getDate() - 60);
        const start = past.toISOString().split('T')[0];
        const res = await api.get(`/v1/melting-logs?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
        if (res?.success && Array.isArray(res.data)) {
          const sorted = [...res.data].sort((a, b) => {
            const da = new Date(a.date || a.createdAt || 0).getTime();
            const db = new Date(b.date || b.createdAt || 0).getTime();
            return db - da;
          });
          setEntries(sorted.slice(0, 5));
        } else {
          setEntries([]);
        }
      } catch (e) {
        setEntries([]);
      }
    };
    loadRecent();
  };

  useEffect(() => {
    setEntries([]);
  }, [fromDate, toDate]);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        const past = new Date(today);
        past.setDate(past.getDate() - 60);
        const start = past.toISOString().split('T')[0];
        const res = await api.get(`/v1/melting-logs?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
        if (res?.success && Array.isArray(res.data)) {
          const sorted = [...res.data].sort((a, b) => {
            const da = new Date(a.date || a.createdAt || 0).getTime();
            const db = new Date(b.date || b.createdAt || 0).getTime();
            return db - da;
          });
          setEntries(sorted.slice(0, 5));
        } else {
          setEntries([]);
        }
      } catch (e) {
        setEntries([]);
      }
    };
    loadRecent();
  }, []);

  const toggle = (key) => setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const [confirm, setConfirm] = useState({ open: false, row: null });
  const [editModal, setEditModal] = useState({ open: false, row: null });
  const [editForm, setEditForm] = useState({});
  const [saveConfirm, setSaveConfirm] = useState({ open: false });

  const requestDelete = (row) => {
    if (!row?._id) return;
    setConfirm({ open: true, row });
  };

  const closeConfirm = () => setConfirm({ open: false, row: null });

  const performDelete = async () => {
    const row = confirm.row;
    if (!row?._id) return;
    try {
      await api.delete(`/v1/melting-logs/${row._id}`);
      setEntries((prev) => prev.filter((e) => e._id !== row._id));
    } catch (e) {
      alert(e.message || 'Failed to delete the record');
    } finally {
      closeConfirm();
    }
  };

  const requestEdit = (row) => {
    if (!row?._id) return;
    setEditForm({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      shift: row.shift || '',
      furnaceNo: row.furnaceNo || '',
      panel: row.panel || '',
      cumulativeLiquidMetal: row.cumulativeLiquidMetal ?? '',
      finalKWHr: row.finalKWHr ?? '',
      initialKWHr: row.initialKWHr ?? '',
      totalUnits: row.totalUnits ?? '',
      cumulativeUnits: row.cumulativeUnits ?? '',
      heatNo: row.heatNo ?? '',
      grade: row.grade ?? '',
      chargingTime: row.chargingTime ?? '',
      ifBath: row.ifBath ?? '',
      liquidMetalPressPour: row.liquidMetalPressPour ?? '',
      liquidMetalHolder: row.liquidMetalHolder ?? '',
      sgMsSteel: row.sgMsSteel ?? '',
      greyMsSteel: row.greyMsSteel ?? '',
      returnsSg: row.returnsSg ?? '',
      gl: row.gl ?? '',
      pigIron: row.pigIron ?? '',
      borings: row.borings ?? '',
      finalBath: row.finalBath ?? '',
      charCoal: row.charCoal ?? '',
      cpcFur: row.cpcFur ?? '',
      cpcLc: row.cpcLc ?? '',
      siliconCarbideFur: row.siliconCarbideFur ?? '',
      ferrosiliconFur: row.ferrosiliconFur ?? '',
      ferrosiliconLc: row.ferrosiliconLc ?? '',
      ferroManganeseFur: row.ferroManganeseFur ?? '',
      ferroManganeseLc: row.ferroManganeseLc ?? '',
      cu: row.cu ?? '',
      cr: row.cr ?? '',
      pureMg: row.pureMg ?? '',
      ironPyrite: row.ironPyrite ?? '',
      labCoinTime: row.labCoinTime ?? '',
      labCoinTempC: row.labCoinTempC ?? '',
      deslagingTimeFrom: row.deslagingTimeFrom ?? '',
      deslagingTimeTo: row.deslagingTimeTo ?? '',
      metalReadyTime: row.metalReadyTime ?? '',
      waitingForTappingFrom: row.waitingForTappingFrom ?? '',
      waitingForTappingTo: row.waitingForTappingTo ?? '',
      reason: row.reason ?? '',
      time: row.time ?? '',
      tempCSg: row.tempCSg ?? '',
      tempCGrey: row.tempCGrey ?? '',
      directFurnace: row.directFurnace ?? '',
      holderToFurnace: row.holderToFurnace ?? '',
      furnaceToHolder: row.furnaceToHolder ?? '',
      disaNo: row.disaNo ?? '',
      item: row.item ?? '',
      furnace1Kw: row.furnace1Kw ?? '',
      furnace1A: row.furnace1A ?? '',
      furnace1V: row.furnace1V ?? '',
      furnace2Kw: row.furnace2Kw ?? '',
      furnace2A: row.furnace2A ?? '',
      furnace2V: row.furnace2V ?? '',
      furnace3Kw: row.furnace3Kw ?? '',
      furnace3A: row.furnace3A ?? '',
      furnace3V: row.furnace3V ?? '',
      furnace4Hz: row.furnace4Hz ?? '',
      furnace4Gld: row.furnace4Gld ?? '',
      furnace4KwHr: row.furnace4KwHr ?? ''
    });
    setEditModal({ open: true, row });
  };

  const closeEditModal = () => setEditModal({ open: false, row: null });
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const openSaveConfirm = () => setSaveConfirm({ open: true });
  const closeSaveConfirm = () => setSaveConfirm({ open: false });
  const performSave = async () => {
    const row = editModal.row;
    if (!row?._id) return;
    try {
      const payload = { ...editForm };
      const res = await api.put(`/v1/melting-logs/${row._id}`, payload);
      if (res?.success) {
        setEntries((prev) => prev.map((e) => (e._id === row._id ? { ...e, ...payload, _id: row._id } : e)));
        setEditModal({ open: false, row: null });
        setSaveConfirm({ open: false });
      }
    } catch (e) {
      alert(e.message || 'Failed to update the record');
    } finally {
      setSaveConfirm({ open: false });
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toISOString().split('T')[0];
  };

  const PrimaryTable = ({ list, show }) => {
    const columns = [
      { key: 'date', label: 'Date', get: (r) => formatDate(r.date) },
      { key: 'shift', label: 'Shift', get: (r) => r.shift || '-' },
      { key: 'furnaceNo', label: 'Furnace No', get: (r) => r.furnaceNo || '-' },
      { key: 'panel', label: 'Panel', get: (r) => r.panel || '-' },
    ];

    if (show.table0) {
      columns.push(
        { key: 'cumulativeLiquidMetal', label: 'Cumulative Liquid Metal', get: (r) => r.cumulativeLiquidMetal ?? '-' },
        { key: 'finalKWHr', label: 'Final KWHr', get: (r) => r.finalKWHr ?? '-' },
        { key: 'initialKWHr', label: 'Initial KWHr', get: (r) => r.initialKWHr ?? '-' },
        { key: 'totalUnits', label: 'Total Units', get: (r) => r.totalUnits ?? '-' },
        { key: 'cumulativeUnits', label: 'Cumulative Units', get: (r) => r.cumulativeUnits ?? '-' },
      );
    }

    if (show.table1) {
      columns.push(
        { key: 'heatNo', label: 'Heat No', get: (r) => r.heatNo ?? '-' },
        { key: 'grade', label: 'Grade', get: (r) => r.grade ?? '-' },
        { key: 'chargingTime', label: 'Charging Time', get: (r) => r.chargingTime ?? '-' },
        { key: 'ifBath', label: 'If Bath', get: (r) => r.ifBath ?? '-' },
        { key: 'liquidMetalPressPour', label: 'Press Pour (kgs)', get: (r) => r.liquidMetalPressPour ?? '-' },
        { key: 'liquidMetalHolder', label: 'Holder (kgs)', get: (r) => r.liquidMetalHolder ?? '-' },
        { key: 'sgMsSteel', label: 'SG-MS Steel', get: (r) => r.sgMsSteel ?? '-' },
        { key: 'greyMsSteel', label: 'Grey MS Steel', get: (r) => r.greyMsSteel ?? '-' },
        { key: 'returnsSg', label: 'Returns SG', get: (r) => r.returnsSg ?? '-' },
        { key: 'gl', label: 'GL', get: (r) => r.gl ?? '-' },
        { key: 'pigIron', label: 'Pig Iron', get: (r) => r.pigIron ?? '-' },
        { key: 'borings', label: 'Borings', get: (r) => r.borings ?? '-' },
        { key: 'finalBath', label: 'Final Bath', get: (r) => r.finalBath ?? '-' },
      );
    }

    if (show.table2) {
      columns.push(
        { key: 'charCoal', label: 'CharCoal', get: (r) => r.charCoal ?? '-' },
        { key: 'cpcFur', label: 'CPC (Fur)', get: (r) => r.cpcFur ?? '-' },
        { key: 'cpcLc', label: 'CPC (LC)', get: (r) => r.cpcLc ?? '-' },
        { key: 'siliconCarbideFur', label: 'Silicon Carbide (Fur)', get: (r) => r.siliconCarbideFur ?? '-' },
        { key: 'ferrosiliconFur', label: 'Ferrosilicon (Fur)', get: (r) => r.ferrosiliconFur ?? '-' },
        { key: 'ferrosiliconLc', label: 'Ferrosilicon (LC)', get: (r) => r.ferrosiliconLc ?? '-' },
        { key: 'ferroManganeseFur', label: 'Fe Mn (Fur)', get: (r) => r.ferroManganeseFur ?? '-' },
        { key: 'ferroManganeseLc', label: 'Fe Mn (LC)', get: (r) => r.ferroManganeseLc ?? '-' },
        { key: 'cu', label: 'Cu', get: (r) => r.cu ?? '-' },
        { key: 'cr', label: 'Cr', get: (r) => r.cr ?? '-' },
        { key: 'pureMg', label: 'Pure Mg', get: (r) => r.pureMg ?? '-' },
        { key: 'ironPyrite', label: 'Iron Pyrite', get: (r) => r.ironPyrite ?? '-' },
      );
    }

    if (show.table3) {
      columns.push(
        { key: 'labCoinTime', label: 'Lab Coin Time', get: (r) => r.labCoinTime ?? '-' },
        { key: 'labCoinTempC', label: 'Lab Coin Temp (°C)', get: (r) => r.labCoinTempC ?? '-' },
        { key: 'deslagingTimeFrom', label: 'Deslag From', get: (r) => r.deslagingTimeFrom ?? '-' },
        { key: 'deslagingTimeTo', label: 'Deslag To', get: (r) => r.deslagingTimeTo ?? '-' },
        { key: 'metalReadyTime', label: 'Metal Ready Time', get: (r) => r.metalReadyTime ?? '-' },
        { key: 'waitingForTappingFrom', label: 'Wait Tap From', get: (r) => r.waitingForTappingFrom ?? '-' },
        { key: 'waitingForTappingTo', label: 'Wait Tap To', get: (r) => r.waitingForTappingTo ?? '-' },
        { key: 'reason', label: 'Reason', get: (r) => r.reason ?? '-' },
      );
    }

    if (show.table4) {
      columns.push(
        { key: 'time', label: 'Time', get: (r) => r.time ?? '-' },
        { key: 'tempCSg', label: 'Temp C (SG)', get: (r) => r.tempCSg ?? '-' },
        { key: 'tempCGrey', label: 'Temp C (Grey)', get: (r) => r.tempCGrey ?? '-' },
        { key: 'directFurnace', label: 'Direct Furnace', get: (r) => r.directFurnace ?? '-' },
        { key: 'holderToFurnace', label: 'Holder to Furnace', get: (r) => r.holderToFurnace ?? '-' },
        { key: 'furnaceToHolder', label: 'Furnace to Holder', get: (r) => r.furnaceToHolder ?? '-' },
        { key: 'disaNo', label: 'DISA No', get: (r) => r.disaNo ?? '-' },
        { key: 'item', label: 'Item', get: (r) => r.item ?? '-' },
      );
    }

    if (show.table5) {
      columns.push(
        { key: 'furnace1Kw', label: 'F1 kW', get: (r) => r.furnace1Kw ?? '-' },
        { key: 'furnace1A', label: 'F1 A', get: (r) => r.furnace1A ?? '-' },
        { key: 'furnace1V', label: 'F1 V', get: (r) => r.furnace1V ?? '-' },
        { key: 'furnace2Kw', label: 'F2 kW', get: (r) => r.furnace2Kw ?? '-' },
        { key: 'furnace2A', label: 'F2 A', get: (r) => r.furnace2A ?? '-' },
        { key: 'furnace2V', label: 'F2 V', get: (r) => r.furnace2V ?? '-' },
        { key: 'furnace3Kw', label: 'F3 kW', get: (r) => r.furnace3Kw ?? '-' },
        { key: 'furnace3A', label: 'F3 A', get: (r) => r.furnace3A ?? '-' },
        { key: 'furnace3V', label: 'F3 V', get: (r) => r.furnace3V ?? '-' },
        { key: 'furnace4Hz', label: 'F4 Hz', get: (r) => r.furnace4Hz ?? '-' },
        { key: 'furnace4Gld', label: 'F4 GLD', get: (r) => r.furnace4Gld ?? '-' },
        { key: 'furnace4KwHr', label: 'F4 kWhr', get: (r) => r.furnace4KwHr ?? '-' },
      );
    }

    return (
      <div className="chr-primary-table-wrap">
        <div className="chr-section-title">Primary Data</div>
        <div className="chr-table-scroll">
          <table className="chr-primary-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={`primary-${row._id}`}>
                  {columns.map((c) => (
                    <td key={`${row._id}-${c.key}`}>{c.get(row)}</td>
                  ))}
                  <td>
                    <div className="chr-actions">
                      <button onClick={() => requestEdit(row)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => requestDelete(row)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #fecaca', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="melting-log-report-header">
        <div className="melting-log-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Melting Log Sheet - Report
          </h2>
        </div>
      </div>

      <div className="melting-log-filter-container">
        <div className="melting-log-filter-group">
          <label>Start Date</label>
          <DatePicker
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="melting-log-filter-group">
          <label>End Date</label>
          <DatePicker
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="Select end date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!fromDate || loading}>
          {loading ? 'Loading...' : 'Filter'}
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!fromDate && !toDate}>
          Clear
        </ClearButton>
      </div>

      <div className="chr-checklist-container">
        <div className="chr-checklist-title">Checklist</div>
        <div className="chr-checklist">
          <label className="chr-check">
            <input type="checkbox" checked={show.table0} onChange={() => toggle('table0')} />
            <span>Table 0 (Power & Metal)</span>
          </label>
          <label className="chr-check">
            <input type="checkbox" checked={show.table1} onChange={() => toggle('table1')} />
            <span>Table 1</span>
          </label>
          <label className="chr-check">
            <input type="checkbox" checked={show.table2} onChange={() => toggle('table2')} />
            <span>Table 2</span>
          </label>
          <label className="chr-check">
            <input type="checkbox" checked={show.table3} onChange={() => toggle('table3')} />
            <span>Table 3</span>
          </label>
          <label className="chr-check">
            <input type="checkbox" checked={show.table4} onChange={() => toggle('table4')} />
            <span>Table 4</span>
          </label>
          <label className="chr-check">
            <input type="checkbox" checked={show.table5} onChange={() => toggle('table5')} />
            <span>Table 5</span>
          </label>
        </div>
      </div>

      <PrimaryTable list={entries} show={show} />

      {error && (
        <div className="chr-error">{error}</div>
      )}

      <div className="chr-results">
        {entries.length === 0 && !loading && (
          <div className="chr-empty">No records found for the selected date range.</div>
        )}
      </div>

      {confirm.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 20, width: 'min(420px, 95vw)', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Confirm Deletion</div>
            <div style={{ color: '#334155' }}>Are you sure you want to delete this record?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={closeConfirm} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
              <button onClick={performDelete} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {editModal.open && (
        <div
          onClick={closeEditModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 12, padding: 20, width: 'min(900px, 95vw)', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Edit Melting Log</div>
            </div>

            <div className="microtensile-form-grid">
              <div className="microtensile-form-group">
                <label>Date</label>
                <input type="date" name="date" value={editForm.date || ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Shift</label>
                <input type="text" name="shift" value={editForm.shift || ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Furnace No</label>
                <input type="text" name="furnaceNo" value={editForm.furnaceNo || ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Panel</label>
                <input type="text" name="panel" value={editForm.panel || ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>Cumulative Liquid Metal</label>
                <input type="text" name="cumulativeLiquidMetal" value={editForm.cumulativeLiquidMetal ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Final KWHr</label>
                <input type="text" name="finalKWHr" value={editForm.finalKWHr ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Initial KWHr</label>
                <input type="text" name="initialKWHr" value={editForm.initialKWHr ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Total Units</label>
                <input type="text" name="totalUnits" value={editForm.totalUnits ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Cumulative Units</label>
                <input type="text" name="cumulativeUnits" value={editForm.cumulativeUnits ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>Heat No</label>
                <input type="text" name="heatNo" value={editForm.heatNo ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Grade</label>
                <input type="text" name="grade" value={editForm.grade ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Charging Time</label>
                <input type="text" name="chargingTime" value={editForm.chargingTime ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>If Bath</label>
                <input type="text" name="ifBath" value={editForm.ifBath ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>Press Pour (kgs)</label>
                <input type="text" name="liquidMetalPressPour" value={editForm.liquidMetalPressPour ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Holder (kgs)</label>
                <input type="text" name="liquidMetalHolder" value={editForm.liquidMetalHolder ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>SG-MS Steel</label>
                <input type="text" name="sgMsSteel" value={editForm.sgMsSteel ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Grey MS Steel</label>
                <input type="text" name="greyMsSteel" value={editForm.greyMsSteel ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Returns SG</label>
                <input type="text" name="returnsSg" value={editForm.returnsSg ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>GL</label>
                <input type="text" name="gl" value={editForm.gl ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Pig Iron</label>
                <input type="text" name="pigIron" value={editForm.pigIron ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Borings</label>
                <input type="text" name="borings" value={editForm.borings ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Final Bath</label>
                <input type="text" name="finalBath" value={editForm.finalBath ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>CharCoal</label>
                <input type="text" name="charCoal" value={editForm.charCoal ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>CPC (Fur)</label>
                <input type="text" name="cpcFur" value={editForm.cpcFur ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>CPC (LC)</label>
                <input type="text" name="cpcLc" value={editForm.cpcLc ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Silicon Carbide (Fur)</label>
                <input type="text" name="siliconCarbideFur" value={editForm.siliconCarbideFur ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Ferrosilicon (Fur)</label>
                <input type="text" name="ferrosiliconFur" value={editForm.ferrosiliconFur ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Ferrosilicon (LC)</label>
                <input type="text" name="ferrosiliconLc" value={editForm.ferrosiliconLc ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Fe Mn (Fur)</label>
                <input type="text" name="ferroManganeseFur" value={editForm.ferroManganeseFur ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Fe Mn (LC)</label>
                <input type="text" name="ferroManganeseLc" value={editForm.ferroManganeseLc ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Cu</label>
                <input type="text" name="cu" value={editForm.cu ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Cr</label>
                <input type="text" name="cr" value={editForm.cr ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Pure Mg</label>
                <input type="text" name="pureMg" value={editForm.pureMg ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Iron Pyrite</label>
                <input type="text" name="ironPyrite" value={editForm.ironPyrite ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>Lab Coin Time</label>
                <input type="text" name="labCoinTime" value={editForm.labCoinTime ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Lab Coin Temp (°C)</label>
                <input type="text" name="labCoinTempC" value={editForm.labCoinTempC ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Deslag From</label>
                <input type="text" name="deslagingTimeFrom" value={editForm.deslagingTimeFrom ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Deslag To</label>
                <input type="text" name="deslagingTimeTo" value={editForm.deslagingTimeTo ?? ''} onChange={handleEditChange} />
              </div>
              
              <div className="microtensile-form-group">
                <label>Metal Ready Time</label>
                <input type="text" name="metalReadyTime" value={editForm.metalReadyTime ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Wait Tap From</label>
                <input type="text" name="waitingForTappingFrom" value={editForm.waitingForTappingFrom ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Wait Tap To</label>
                <input type="text" name="waitingForTappingTo" value={editForm.waitingForTappingTo ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Reason</label>
                <input type="text" name="reason" value={editForm.reason ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>Time</label>
                <input type="text" name="time" value={editForm.time ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Temp C (SG)</label>
                <input type="text" name="tempCSg" value={editForm.tempCSg ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Temp C (Grey)</label>
                <input type="text" name="tempCGrey" value={editForm.tempCGrey ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Direct Furnace</label>
                <input type="text" name="directFurnace" value={editForm.directFurnace ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Holder to Furnace</label>
                <input type="text" name="holderToFurnace" value={editForm.holderToFurnace ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Furnace to Holder</label>
                <input type="text" name="furnaceToHolder" value={editForm.furnaceToHolder ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>DISA No</label>
                <input type="text" name="disaNo" value={editForm.disaNo ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>Item</label>
                <input type="text" name="item" value={editForm.item ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>F1 kW</label>
                <input type="text" name="furnace1Kw" value={editForm.furnace1Kw ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F1 A</label>
                <input type="text" name="furnace1A" value={editForm.furnace1A ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F1 V</label>
                <input type="text" name="furnace1V" value={editForm.furnace1V ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>F2 kW</label>
                <input type="text" name="furnace2Kw" value={editForm.furnace2Kw ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F2 A</label>
                <input type="text" name="furnace2A" value={editForm.furnace2A ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F2 V</label>
                <input type="text" name="furnace2V" value={editForm.furnace2V ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>F3 kW</label>
                <input type="text" name="furnace3Kw" value={editForm.furnace3Kw ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F3 A</label>
                <input type="text" name="furnace3A" value={editForm.furnace3A ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F3 V</label>
                <input type="text" name="furnace3V" value={editForm.furnace3V ?? ''} onChange={handleEditChange} />
              </div>

              <div className="microtensile-form-group">
                <label>F4 Hz</label>
                <input type="text" name="furnace4Hz" value={editForm.furnace4Hz ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F4 GLD</label>
                <input type="text" name="furnace4Gld" value={editForm.furnace4Gld ?? ''} onChange={handleEditChange} />
              </div>
              <div className="microtensile-form-group">
                <label>F4 kWhr</label>
                <input type="text" name="furnace4KwHr" value={editForm.furnace4KwHr ?? ''} onChange={handleEditChange} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={closeEditModal} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
              <button onClick={openSaveConfirm} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {saveConfirm.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 20, width: 'min(420px, 95vw)', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Confirm Save</div>
            <div style={{ color: '#334155' }}>Do you want to save the changes?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={closeSaveConfirm} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>No</button>
              <button onClick={performSave} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#166534', cursor: 'pointer' }}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeltingLogSheetReport;
