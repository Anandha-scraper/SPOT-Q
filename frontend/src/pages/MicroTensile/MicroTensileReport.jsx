import React, { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { DatePicker, FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import { EditCard } from '../../Components/PopUp';
import '../../styles/PageStyles/MicroTensile/MicroTensileReport.css';
import '../../styles/PageStyles/MicroTensile/MicroTensile.css';

const MicroTensileReport = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [show, setShow] = useState({ table1: false, remarks: false });
  const [confirm, setConfirm] = useState({ open: false, row: null });
  const [editModal, setEditModal] = useState({ open: false, row: null });
  const [editForm, setEditForm] = useState({});
  const [originalEditForm, setOriginalEditForm] = useState({});
  const [saveConfirm, setSaveConfirm] = useState({ open: false });
  const [remarkModal, setRemarkModal] = useState({ open: false, text: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const disaOptions = ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'];

  const toggle = (key) => setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const requestDelete = (row) => {
    if (!row?._id) return;
    setConfirm({ open: true, row });
  };

  const closeConfirm = () => setConfirm({ open: false, row: null });

  const performDelete = async () => {
    const row = confirm.row;
    if (!row?._id) return;
    setDeleteLoading(true);
    try {
      const resp = await fetch(`http://localhost:5000/api/v1/micro-tensile/${row._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (resp.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== row._id));
      } else {
        const data = await resp.json();
        alert(data.message || 'Failed to delete the record');
      }
    } catch (e) {
      alert(e.message || 'Failed to delete the record');
    } finally {
      setDeleteLoading(false);
      closeConfirm();
    }
  };

  const requestEdit = (row) => {
    if (!row?._id) return;
    // Map stored item object/string into edit form fields
    let itemVal = '';
    let itemSecondVal = '';
    if (row.item) {
      if (typeof row.item === 'string') {
        itemVal = row.item;
      } else if (typeof row.item === 'object') {
        itemVal = row.item.it1 || '';
        if (row.item.it2) {
          // strip surrounding parentheses if present
          itemSecondVal = String(row.item.it2).replace(/^\(/, '').replace(/\)$/, '');
        }
      }
    }

    const formData = {
      dateOfInspection: row.dateOfInspection ? new Date(row.dateOfInspection).toISOString().split('T')[0] : '',
      disa: Array.isArray(row.disa) ? row.disa.slice() : (row.disa ? [row.disa] : []),
      item: itemVal,
      itemSecond: itemSecondVal,
      dateCode: row.dateCode || '',
      heatCode: row.heatCode || '',
      barDia: row.barDia ?? '',
      gaugeLength: row.gaugeLength ?? '',
      maxLoad: row.maxLoad ?? '',
      yieldLoad: row.yieldLoad ?? '',
      tensileStrength: row.tensileStrength ?? '',
      yieldStrength: row.yieldStrength ?? '',
      elongation: row.elongation ?? '',
      testedBy: row.testedBy ?? '',
      remarks: row.remarks || ''
    };

    setEditForm(formData);
    setOriginalEditForm(formData);
    setSaveError('');
    setEditModal({ open: true, row });
  };

  const closeEditModal = () => setEditModal({ open: false, row: null });

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // For heatCode, only allow digits
    if (name === 'heatCode') {
      const cleaned = String(value).replace(/\D/g, '');
      setEditForm((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEditDisa = (value) => {
    setEditForm((prev) => {
      const arr = Array.isArray(prev.disa) ? prev.disa : [];
      const exists = arr.includes(value);
      return { ...prev, disa: exists ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const openSaveConfirm = () => {
    // Check if any data has been edited
    const hasChanges = JSON.stringify(editForm) !== JSON.stringify(originalEditForm);
    if (!hasChanges) {
      setSaveError('No data edited');
      setTimeout(() => setSaveError(''), 3000);
      return;
    }
    setSaveConfirm({ open: true });
  };

  const closeSaveConfirm = () => setSaveConfirm({ open: false });

  const performSave = async () => {
    const row = editModal.row;
    if (!row?._id) return;
    setSaveLoading(true);
    setSaveError('');
    try {
      // Convert editForm.item + itemSecond into backend item object
      const itemObj = { it1: editForm.item };
      if (editForm.itemSecond && String(editForm.itemSecond).trim() !== '') {
        const cleaned = String(editForm.itemSecond).trim();
        itemObj.it2 = cleaned.startsWith('(') && cleaned.endsWith(')') ? cleaned : `(${cleaned})`;
      }

      const payload = { ...editForm, item: itemObj };
      delete payload.itemSecond;

      const resp = await fetch(`http://localhost:5000/api/v1/micro-tensile/${row._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const res = await resp.json();
      if (res?.success) {
        const updated = payload;
        setEntries((prev) => prev.map((e) => (e._id === row._id ? { ...e, ...updated, _id: row._id } : e)));
        setEditModal({ open: false, row: null });
        setSaveConfirm({ open: false });
      }
    } catch (e) {
      setSaveError(e.message || 'Failed to update the record');
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m, rest] = d.split('-');
      const day = rest.slice(0, 2);
      return `${day}-${m}-${y}`;
    }
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleFilter = async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const start = selectedDate;
      const end = selectedDate;
      const resp = await fetch(`http://localhost:5000/api/v1/micro-tensile/filter?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await resp.json();
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : [];
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.dateOfInspection || a.createdAt || 0).getTime();
          const db = new Date(b.dateOfInspection || b.createdAt || 0).getTime();
          return db - da;
        });
        setEntries(sorted); // Show all filtered entries
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

  const loadRecent = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;
      
      const resp = await fetch(`http://localhost:5000/api/v1/micro-tensile/filter?startDate=${encodeURIComponent(todayString)}&endDate=${encodeURIComponent(todayString)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const res = await resp.json();
      if (res?.success && Array.isArray(res.data)) {
        // Filter to ensure we only get today's entries
        const todaysEntries = res.data.filter(entry => {
          const entryDate = entry.dateOfInspection || entry.date;
          if (!entryDate) return false;
          
          // Normalize the date for comparison
          const entryDateStr = typeof entryDate === 'string' 
            ? entryDate.split('T')[0] 
            : new Date(entryDate).toISOString().split('T')[0];
          
          return entryDateStr === todayString;
        });
        
        const sorted = [...todaysEntries].sort((a, b) => {
          const da = new Date(a.dateOfInspection || a.createdAt || 0).getTime();
          const db = new Date(b.dateOfInspection || b.createdAt || 0).getTime();
          return db - da;
        });
        setEntries(sorted);
      } else {
        setEntries([]);
      }
    } catch (e) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
    setError('');
    setEntries([]);
    loadRecent();
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const PrimaryTable = ({ list, show }) => {
    const renderRemarkCell = (text) => {
      const value = typeof text === 'string' ? text : '';
      if (!value) return '-';
      const short = value.length > 6 ? value.slice(0, 5) + '..' : value;
      return (
        <span
          onClick={() => setRemarkModal({ open: true, text: value })}
          title={value}
          style={{ cursor: 'pointer', color: '#0ea5e9', textDecoration: 'underline dotted' }}
        >
          {short}
        </span>
      );
    };

    const columns = [
      { key: 'dateOfInspection', label: 'Date of Inspection', get: (r) => formatDate(r.dateOfInspection || r.date || r.dateOfInspection), style: { minWidth: '80px' } },
      { key: 'disa', label: 'DISA', get: (r) => Array.isArray(r.disa) ? r.disa.join(', ') : (r.disa || '-'), style: { minWidth: '90px' } },
      { key: 'item', label: 'Item', get: (r) => {
          if (!r.item) return '-';
          if (typeof r.item === 'string') return r.item;
          if (typeof r.item === 'object') {
            const it1 = r.item.it1 || '';
            const it2 = r.item.it2 || '';
            return `${it1}${it2 ? ' ' + it2 : ''}`.trim() || '-';
          }
          return String(r.item);
        }, style: { minWidth: '120px' } },
      { key: 'dateCode', label: 'Date Code', get: (r) => r.dateCode || '-', style: { minWidth: '100px' } },
      { key: 'heatCode', label: 'Heat Code', get: (r) => r.heatCode || '-', style: { minWidth: '100px' } },
    ];

    if (show.table1) {
      columns.push(
        { key: 'barDia', label: 'Bar Dia (mm)', get: (r) => r.barDia ?? '-', style: { minWidth: '110px', textAlign: 'right' } },
        { key: 'gaugeLength', label: 'Gauge Length (mm)', get: (r) => r.gaugeLength ?? '-', style: { minWidth: '140px', textAlign: 'right' } },
        { key: 'maxLoad', label: 'Max Load (Kgs/KN)', get: (r) => r.maxLoad ?? '-', style: { minWidth: '150px', textAlign: 'right' } },
        { key: 'yieldLoad', label: 'Yield Load (Kgs/KN)', get: (r) => r.yieldLoad ?? '-', style: { minWidth: '150px', textAlign: 'right' } },
        { key: 'tensileStrength', label: 'Tensile Strength (Kg/mm² or MPa)', get: (r) => r.tensileStrength ?? '-', style: { minWidth: '200px', textAlign: 'right' } },
        { key: 'yieldStrength', label: 'Yield Strength (Kg/mm² or MPa)', get: (r) => r.yieldStrength ?? '-', style: { minWidth: '200px', textAlign: 'right' } },
        { key: 'elongation', label: 'Elongation', get: (r) => r.elongation ?? '-', style: { minWidth: '100px', textAlign: 'right' } },
        { key: 'testedBy', label: 'Tested By', get: (r) => r.testedBy ?? '-', style: { minWidth: '120px' } },
      );
    }

    if (show.remarks) {
      columns.push({ key: 'remarks', label: 'Remarks', get: (r) => renderRemarkCell(r.remarks), style: { minWidth: '120px', maxWidth: '200px' } });
    }

    return (
      <div className="chr-table-scroll">
        <table className="chr-primary-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={c.style}>{c.label}</th>
              ))}
              <th style={{ minWidth: '160px' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    textAlign: 'center',
                    padding: '14px',
                    color: '#64748b',
                    fontStyle: 'italic'
                  }}
                >
                  {selectedDate ? 'No records found for the selected date.' : 'No records found for the current date.'}
                </td>
              </tr>
            ) : (
              list.map((row) => (
                <tr key={`primary-${row._id || `${row.item}-${row.dateCode}-${row.heatCode}`}`}>
                  {columns.map((c) => (
                    <td key={`${(row._id || 'row')}-${c.key}`} style={c.style}>{c.get(row)}</td>
                  ))}

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '64px', margin: '0 auto' }}>
                      <EditButton onClick={() => requestEdit(row)} />
                      <DeleteButton onClick={() => requestDelete(row)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <div className="microtensile-report-header">
        <div className="microtensile-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Micro Tensile Test - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {loading ? 'Loading...' : `DATE : ${new Date().toLocaleDateString('en-GB')}`}
        </div>
      </div>

      <div className="microtensile-filter-container">
        <div className="microtensile-filter-group">
          <label>Date</label>
          <DatePicker
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            placeholder="Select date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!selectedDate || loading}>
          {loading ? 'Loading...' : 'Filter'}
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!selectedDate}>
          Clear
        </ClearButton>
      </div>

      <div className="chr-checklist">
        <label className="chr-check">
          <input type="checkbox" checked={show.table1} onChange={() => toggle('table1')} />
          <span>Table 1</span>
        </label>
        <label className="chr-check">
          <input type="checkbox" checked={show.remarks} onChange={() => toggle('remarks')} />
          <span>Remarks</span>
        </label>
      </div>

      <PrimaryTable list={entries} show={show} />

      {error && (
        <div className="chr-error">{error}</div>
      )}

      <EditCard
        isOpen={editModal.open}
        onClose={closeEditModal}
        departmentName="Micro Tensile"
        onSave={openSaveConfirm}
        onCancel={closeEditModal}
        saveText="Save"
        loading={saveLoading}
        error={saveError}
      >
        <div className="microtensile-form-grid">
          <div className="microtensile-form-group">
            <label>Item <span className="required-indicator">*</span></label>
            <input type="text" name="item" value={editForm.item || ''} onChange={handleEditChange} placeholder="e.g: Sample Bar" />
          </div>

          <div className="microtensile-form-group">
            <label>Item (Optional)</label>
            <input type="text" name="itemSecond" value={editForm.itemSecond || ''} onChange={handleEditChange} placeholder="e.g: 234/4564/4334" />
          </div>

          <div className="microtensile-form-group">
            <label>Date Code <span className="required-indicator">*</span></label>
            <input type="text" name="dateCode" value={editForm.dateCode || ''} onChange={handleEditChange} placeholder="e.g: 2024-HC" />
          </div>

          <div className="microtensile-form-group">
            <label>Heat Code <span className="required-indicator">*</span></label>
            <input type="text" inputMode="numeric" pattern="\d*" name="heatCode" value={editForm.heatCode || ''} onChange={handleEditChange} placeholder="e.g: 012" />
          </div>

          <div className="microtensile-form-group">
            <label>Bar Dia (mm) <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="barDia" value={editForm.barDia ?? ''} onChange={handleEditChange} placeholder="e.g: 6.0" />
          </div>

          <div className="microtensile-form-group">
            <label>Gauge Length (mm) <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="gaugeLength" value={editForm.gaugeLength ?? ''} onChange={handleEditChange} placeholder="e.g: 30.0" />
          </div>

          <div className="microtensile-form-group">
            <label>Max Load (Kgs) or KN <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="maxLoad" value={editForm.maxLoad ?? ''} onChange={handleEditChange} placeholder="e.g: 1560" />
          </div>

          <div className="microtensile-form-group">
            <label>Yield Load (Kgs) or KN <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="yieldLoad" value={editForm.yieldLoad ?? ''} onChange={handleEditChange} placeholder="e.g: 1290" />
          </div>

          <div className="microtensile-form-group">
            <label>Tensile Strength (Kg/mm² or Mpa) <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="tensileStrength" value={editForm.tensileStrength ?? ''} onChange={handleEditChange} placeholder="e.g: 550" />
          </div>

          <div className="microtensile-form-group">
            <label>Yield Strength (Kg/mm² or Mpa) <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="yieldStrength" value={editForm.yieldStrength ?? ''} onChange={handleEditChange} placeholder="e.g: 455" />
          </div>

          <div className="microtensile-form-group">
            <label>Elongation % <span className="required-indicator">*</span></label>
            <input type="number" step="0.01" name="elongation" value={editForm.elongation ?? ''} onChange={handleEditChange} placeholder="e.g: 18.5" />
          </div>

          <div className="microtensile-form-group">
            <label>Tested By <span className="required-indicator">*</span></label>
            <input type="text" name="testedBy" value={editForm.testedBy || ''} onChange={handleEditChange} placeholder="e.g: John Smith" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'start' }}>
            <div>
              <label>DISA <span className="required-indicator">*</span></label>
              <div className="microtensile-disa-checklist" style={{ display: 'flex', flexDirection: 'row', gap: '12px', flexWrap: 'nowrap', marginTop: '0.5rem' }}>
                {disaOptions.map((opt) => (
                  <label key={opt} className="microtensile-checkbox-label">
                    <input
                      type="checkbox"
                      className="microtensile-checkbox"
                      checked={Array.isArray(editForm.disa) && editForm.disa.includes(opt)}
                      onChange={() => toggleEditDisa(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="microtensile-form-group" style={{ margin: 0 }}>
              <label>Remarks</label>
              <input
                type="text"
                name="remarks"
                value={editForm.remarks || ''}
                onChange={handleEditChange}
                placeholder="Enter any additional notes..."
                maxLength={80}
              />
            </div>
          </div>
        </div>
      </EditCard>

      {saveConfirm.open && (
        <div className="impact-modal-overlay" onClick={closeSaveConfirm}>
          <div className="impact-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Save</h3>
            <p>Do you want to save the changes to this Micro Tensile test?</p>
            <div className="impact-modal-actions">
              <button 
                className="impact-modal-btn cancel-btn" 
                onClick={closeSaveConfirm}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button 
                className="impact-modal-btn save-btn" 
                onClick={performSave}
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {remarkModal.open && (
        <div onClick={() => setRemarkModal({ open: false, text: '' })} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 10, padding: 16, width: 'min(520px, 95vw)', maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Remarks</div>
            <div style={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{remarkModal.text}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default MicroTensileReport;
