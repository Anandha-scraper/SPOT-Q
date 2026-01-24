import React, { useEffect, useState } from 'react';
import { BookOpenCheck, X } from 'lucide-react';
import { FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Table from '../../Components/Table';
import { RemarksCard, DeleteConfirmCard } from '../../Components/PopUp';
import '../../styles/PageStyles/MicroTensile/MicroTensileReport.css';


const MicroTensileReport = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [remarkModal, setRemarkModal] = useState({ open: false, text: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Edit validation states
  const [editItemValid, setEditItemValid] = useState(null);
  const [editDateCodeValid, setEditDateCodeValid] = useState(null);
  const [editHeatCodeValid, setEditHeatCodeValid] = useState(null);
  const [editBarDiaValid, setEditBarDiaValid] = useState(null);
  const [editGaugeLengthValid, setEditGaugeLengthValid] = useState(null);
  const [editMaxLoadValid, setEditMaxLoadValid] = useState(null);
  const [editYieldLoadValid, setEditYieldLoadValid] = useState(null);
  const [editTensileStrengthValid, setEditTensileStrengthValid] = useState(null);
  const [editYieldStrengthValid, setEditYieldStrengthValid] = useState(null);
  const [editElongationValid, setEditElongationValid] = useState(null);
  const [editSubmitAttempted, setEditSubmitAttempted] = useState(false);
  
  const disaOptions = ['DISA 1', 'DISA 2', 'DISA 3', 'DISA 4'];

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/micro-tensile/${deletingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setDeletingId(null);
        setEntries((prev) => prev.filter((e) => e._id !== deletingId));
      } else {
        alert(data.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting micro tensile test:', error);
      alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestEdit = (row) => {
    if (!row?._id) return;
    setEditingItem(row);
    
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
    setSaveError('');
    
    // Reset validation states
    setEditItemValid(null);
    setEditDateCodeValid(null);
    setEditHeatCodeValid(null);
    setEditBarDiaValid(null);
    setEditGaugeLengthValid(null);
    setEditMaxLoadValid(null);
    setEditYieldLoadValid(null);
    setEditTensileStrengthValid(null);
    setEditYieldStrengthValid(null);
    setEditElongationValid(null);
    setEditSubmitAttempted(false);
    
    setShowEditModal(true);
  };

  const closeEditModal = () => setEditModal({ open: false, row: null });

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // --- VALIDATE ITEM ---
    if (name === 'item') {
      if (value.trim() === "") {
        setEditItemValid(editSubmitAttempted ? false : null);
      } else {
        setEditItemValid(value.trim().length > 0);
      }
    }

    // --- VALIDATE DATE CODE ---
    if (name === 'dateCode') {
      if (value.trim() === "") {
        setEditDateCodeValid(editSubmitAttempted ? false : null);
      } else {
        setEditDateCodeValid(value.trim().length > 0);
      }
    }

    // For heatCode, only allow digits
    if (name === 'heatCode') {
      const cleaned = String(value).replace(/\D/g, '');
      if (cleaned === "") {
        setEditHeatCodeValid(editSubmitAttempted ? false : null);
      } else {
        setEditHeatCodeValid(cleaned.length > 0);
      }
      setEditForm((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }

    // --- VALIDATE BAR DIA ---
    if (name === 'barDia') {
      if (value.trim() === "") {
        setEditBarDiaValid(editSubmitAttempted ? false : null);
      } else {
        setEditBarDiaValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE GAUGE LENGTH ---
    if (name === 'gaugeLength') {
      if (value.trim() === "") {
        setEditGaugeLengthValid(editSubmitAttempted ? false : null);
      } else {
        setEditGaugeLengthValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE MAX LOAD ---
    if (name === 'maxLoad') {
      if (value.trim() === "") {
        setEditMaxLoadValid(editSubmitAttempted ? false : null);
      } else {
        setEditMaxLoadValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE YIELD LOAD ---
    if (name === 'yieldLoad') {
      if (value.trim() === "") {
        setEditYieldLoadValid(editSubmitAttempted ? false : null);
      } else {
        setEditYieldLoadValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE TENSILE STRENGTH ---
    if (name === 'tensileStrength') {
      if (value.trim() === "") {
        setEditTensileStrengthValid(editSubmitAttempted ? false : null);
      } else {
        setEditTensileStrengthValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE YIELD STRENGTH ---
    if (name === 'yieldStrength') {
      if (value.trim() === "") {
        setEditYieldStrengthValid(editSubmitAttempted ? false : null);
      } else {
        setEditYieldStrengthValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE ELONGATION ---
    if (name === 'elongation') {
      if (value.trim() === "") {
        setEditElongationValid(editSubmitAttempted ? false : null);
      } else {
        const num = parseFloat(value);
        setEditElongationValid(!isNaN(num) && num >= 0 && num <= 100);
      }
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

  const handleUpdate = async () => {
    setEditSubmitAttempted(true);
    
    // Validate required fields
    let hasErrors = false;
    
    if (!editForm.item || editForm.item.trim() === '') {
      setEditItemValid(false);
      hasErrors = true;
    } else {
      setEditItemValid(true);
    }
    
    if (!editForm.dateCode || editForm.dateCode.trim() === '') {
      setEditDateCodeValid(false);
      hasErrors = true;
    } else {
      setEditDateCodeValid(true);
    }
    
    if (!editForm.heatCode || editForm.heatCode.trim() === '') {
      setEditHeatCodeValid(false);
      hasErrors = true;
    } else {
      setEditHeatCodeValid(true);
    }
    
    if (!editForm.barDia || editForm.barDia.toString().trim() === '') {
      setEditBarDiaValid(false);
      hasErrors = true;
    } else if (isNaN(editForm.barDia) || parseFloat(editForm.barDia) <= 0) {
      setEditBarDiaValid(false);
      hasErrors = true;
    } else {
      setEditBarDiaValid(true);
    }
    
    if (!editForm.gaugeLength || editForm.gaugeLength.toString().trim() === '') {
      setEditGaugeLengthValid(false);
      hasErrors = true;
    } else if (isNaN(editForm.gaugeLength) || parseFloat(editForm.gaugeLength) <= 0) {
      setEditGaugeLengthValid(false);
      hasErrors = true;
    } else {
      setEditGaugeLengthValid(true);
    }
    
    if (!editForm.maxLoad || editForm.maxLoad.toString().trim() === '') {
      setEditMaxLoadValid(false);
      hasErrors = true;
    } else if (isNaN(editForm.maxLoad) || parseFloat(editForm.maxLoad) <= 0) {
      setEditMaxLoadValid(false);
      hasErrors = true;
    } else {
      setEditMaxLoadValid(true);
    }
    
    if (!editForm.yieldLoad || editForm.yieldLoad.toString().trim() === '') {
      setEditYieldLoadValid(false);
      hasErrors = true;
    } else if (isNaN(editForm.yieldLoad) || parseFloat(editForm.yieldLoad) <= 0) {
      setEditYieldLoadValid(false);
      hasErrors = true;
    } else {
      setEditYieldLoadValid(true);
    }
    
    if (!editForm.tensileStrength || editForm.tensileStrength.toString().trim() === '') {
      setEditTensileStrengthValid(false);
      hasErrors = true;
    } else if (isNaN(editForm.tensileStrength) || parseFloat(editForm.tensileStrength) <= 0) {
      setEditTensileStrengthValid(false);
      hasErrors = true;
    } else {
      setEditTensileStrengthValid(true);
    }
    
    if (!editForm.yieldStrength || editForm.yieldStrength.toString().trim() === '') {
      setEditYieldStrengthValid(false);
      hasErrors = true;
    } else if (isNaN(editForm.yieldStrength) || parseFloat(editForm.yieldStrength) <= 0) {
      setEditYieldStrengthValid(false);
      hasErrors = true;
    } else {
      setEditYieldStrengthValid(true);
    }
    
    if (!editForm.elongation || editForm.elongation.toString().trim() === '') {
      setEditElongationValid(false);
      hasErrors = true;
    } else {
      const num = parseFloat(editForm.elongation);
      if (isNaN(num) || num < 0 || num > 100) {
        setEditElongationValid(false);
        hasErrors = true;
      } else {
        setEditElongationValid(true);
      }
    }
    
    if (hasErrors) {
      return;
    }
    
    try {
      setSaveLoading(true);
      
      // Convert editForm.item + itemSecond into backend item object
      const itemObj = { it1: editForm.item };
      if (editForm.itemSecond && String(editForm.itemSecond).trim() !== '') {
        const cleaned = String(editForm.itemSecond).trim();
        itemObj.it2 = cleaned.startsWith('(') && cleaned.endsWith(')') ? cleaned : `(${cleaned})`;
      }

      const payload = { ...editForm, item: itemObj };
      delete payload.itemSecond;

      const resp = await fetch(`http://localhost:5000/api/v1/micro-tensile/${editingItem._id}`, {
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
        // Update entry in the list
        setEntries((prev) => prev.map((e) => 
          e._id === editingItem._id ? { ...e, ...payload, _id: editingItem._id } : e
        ));
        setShowEditModal(false);
        setEditingItem(null);
        setEditSubmitAttempted(false);
      } else {
        alert(res.message || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating micro tensile test:', error);
      alert('Failed to update entry: ' + (error.message || 'Unknown error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m, rest] = d.split('-');
      const day = rest.slice(0, 2);
      return `${day} / ${m} / ${y}`;
    }
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd} / ${mm} / ${yyyy}`;
  };

  const handleFilter = async () => {
    if (!startDate) return;
    
    // Validate that end date is not before start date
    if (endDate && new Date(endDate) < new Date(startDate)) {
      alert('End date cannot be before start date');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const start = startDate;
      const end = endDate || startDate;
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
    setStartDate(null);
    setEndDate(null);
    setError('');
    setEntries([]);
    loadRecent();
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const PrimaryTable = ({ list }) => {
    const columns = [
      { 
        key: 'dateOfInspection', 
        label: 'Date of Inspection', 
        width: '10%',
        align: 'center',
        render: (r) => formatDate(r.dateOfInspection || r.date || r.dateOfInspection)
      },
      { 
        key: 'disa', 
        label: 'DISA', 
        width: '8%',
        align: 'center',
        render: (r) => Array.isArray(r.disa) ? r.disa.join(', ') : (r.disa || '-')
      },
      { 
        key: 'item', 
        label: 'Item', 
        width: '15%',
        align : "center",
        render: (r) => {
          if (!r.item) return '-';
          if (typeof r.item === 'string') return r.item;
          if (typeof r.item === 'object') {
            const it1 = r.item.it1 || '';
            const it2 = r.item.it2 || '';
            return `${it1}${it2 ? ' ' + it2 : ''}`.trim() || '-';
          }
          return String(r.item);
        }
      },
      { key: 'dateCode', label: 'Date Code', width: '8%', align: 'center' },
      { key: 'heatCode', label: 'Heat Code', width: '8%', align: 'center' },
      { key: 'barDia', label: 'Bar Dia (mm)', width: '8%', align: 'center', render: (r) => r.barDia ?? '-' },
      { key: 'gaugeLength', label: 'Gauge Length (mm)', width: '10%', align: 'center', render: (r) => r.gaugeLength ?? '-' },
      { key: 'maxLoad', label: 'Max Load (Kgs/KN)', width: '10%', align: 'center', render: (r) => r.maxLoad ?? '-' },
      { key: 'yieldLoad', label: 'Yield Load (Kgs/KN)', width: '11%', align: 'center', render: (r) => r.yieldLoad ?? '-' },
      { key: 'tensileStrength', label: 'Tensile Strength (Kg/mm² or MPa)', width: '14%', align: 'center', render: (r) => r.tensileStrength ?? '-' },
      { key: 'yieldStrength', label: 'Yield Strength (Kg/mm² or MPa)', width: '14%', align: 'center', render: (r) => r.yieldStrength ?? '-' },
      { key: 'elongation', label: 'Elongation', width: '8%', align: 'center', render: (r) => r.elongation ?? '-' },
      { key: 'testedBy', label: 'Tested By', width: '9%', render: (r) => r.testedBy ?? '-' },
      { 
        key: 'remarks', 
        label: 'Remarks', 
        width: '10%',
        render: (r) => r.remarks || '-'
      },
    ];

    const noDataMessage = startDate 
      ? 'No records found for the selected date range.' 
      : 'No records found for the current date.';

    return (
      <Table
        columns={columns}
        data={list}
        minWidth={2000}
        defaultAlign="left"
        renderActions={(row) => (
          <>
            <EditButton onClick={() => requestEdit(row)} />
            <DeleteButton onClick={() => handleDeleteClick(row._id)} />
          </>
        )}
        noDataMessage={noDataMessage}
      />
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
          {loading ? 'Loading...' : (() => {
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `DATE : ${day} / ${month} / ${year}`;
          })()}
        </div>
      </div>

      <div className="microtensile-filter-container">
        <div className="microtensile-filter-group">
          <label>Start Date</label>
          <CustomDatePicker
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="microtensile-filter-group">
          <label>End Date</label>
          <CustomDatePicker
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!startDate || loading}>
          {loading ? 'Loading...' : 'Filter'}
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!startDate && !endDate}>
          Clear
        </ClearButton>
      </div>

      <PrimaryTable list={entries} />

      {error && (
        <div className="chr-error">{error}</div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Micro Tensile Test Entry</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="microtensile-form-grid">
          <div className="microtensile-form-group">
            <label>Item <span className="required-indicator">*</span></label>
            <input 
              type="text" 
              name="item" 
              value={editForm.item || ''} 
              onChange={handleEditChange} 
              placeholder="e.g: Sample Bar"
              className={editItemValid === null ? "" : editItemValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Item (Optional)</label>
            <input type="text" name="itemSecond" value={editForm.itemSecond || ''} onChange={handleEditChange} placeholder="e.g: 234/4564/4334" />
          </div>

          <div className="microtensile-form-group">
            <label>Date Code <span className="required-indicator">*</span></label>
            <input 
              type="text" 
              name="dateCode" 
              value={editForm.dateCode || ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 2024-HC"
              className={editDateCodeValid === null ? "" : editDateCodeValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Heat Code <span className="required-indicator">*</span></label>
            <input 
              type="text" 
              inputMode="numeric" 
              pattern="\d*" 
              name="heatCode" 
              value={editForm.heatCode || ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 012"
              className={editHeatCodeValid === null ? "" : editHeatCodeValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Bar Dia (mm) <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="barDia" 
              value={editForm.barDia ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 6.0"
              className={editBarDiaValid === null ? "" : editBarDiaValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Gauge Length (mm) <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="gaugeLength" 
              value={editForm.gaugeLength ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 30.0"
              className={editGaugeLengthValid === null ? "" : editGaugeLengthValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Max Load (Kgs) or KN <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="maxLoad" 
              value={editForm.maxLoad ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 1560"
              className={editMaxLoadValid === null ? "" : editMaxLoadValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Yield Load (Kgs) or KN <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="yieldLoad" 
              value={editForm.yieldLoad ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 1290"
              className={editYieldLoadValid === null ? "" : editYieldLoadValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Tensile Strength (Kg/mm² or Mpa) <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="tensileStrength" 
              value={editForm.tensileStrength ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 550"
              className={editTensileStrengthValid === null ? "" : editTensileStrengthValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Yield Strength (Kg/mm² or Mpa) <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="yieldStrength" 
              value={editForm.yieldStrength ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 455"
              className={editYieldStrengthValid === null ? "" : editYieldStrengthValid ? "valid-input" : "invalid-input"}
            />
          </div>

          <div className="microtensile-form-group">
            <label>Elongation % <span className="required-indicator">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="elongation" 
              value={editForm.elongation ?? ''} 
              onChange={handleEditChange} 
              placeholder="e.g: 18.5"
              className={editElongationValid === null ? "" : editElongationValid ? "valid-input" : "invalid-input"}
            />
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
      </div>
            
      <div className="modal-footer">
              <button 
                className="modal-cancel-btn" 
                onClick={() => setShowEditModal(false)}
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button 
                className="modal-submit-btn" 
                onClick={handleUpdate}
                disabled={saveLoading}
              >
                {saveLoading ? 'Updating...' : 'Update Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {remarkModal.open && (
        <RemarksCard
          isOpen={remarkModal.open}
          onClose={() => setRemarkModal({ open: false, text: '' })}
          remarksText={remarkModal.text}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmCard
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        departmentName="Micro Tensile"
        loading={deleteLoading}
      />
    </>
  );
};

export default MicroTensileReport;
