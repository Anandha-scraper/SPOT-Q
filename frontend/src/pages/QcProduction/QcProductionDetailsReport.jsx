import React, { useState, useEffect } from 'react';
import { X, PencilLine, BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Table from '../../Components/Table';
import '../../styles/PageStyles/QcProduction/QcProductionDetailsReport.css';

const QcProductionDetailsReport = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Edit Validation states
  const [editPartNameValid, setEditPartNameValid] = useState(null);
  const [editNoOfMouldsValid, setEditNoOfMouldsValid] = useState(null);
  const [editCPercentValid, setEditCPercentValid] = useState(null);
  const [editSiPercentValid, setEditSiPercentValid] = useState(null);
  const [editMnPercentValid, setEditMnPercentValid] = useState(null);
  const [editPPercentValid, setEditPPercentValid] = useState(null);
  const [editSPercentValid, setEditSPercentValid] = useState(null);
  const [editMgPercentValid, setEditMgPercentValid] = useState(null);
  const [editCuPercentValid, setEditCuPercentValid] = useState(null);
  const [editCrPercentValid, setEditCrPercentValid] = useState(null);
  const [editNodularityValid, setEditNodularityValid] = useState(null);
  const [editGraphiteTypeValid, setEditGraphiteTypeValid] = useState(null);
  const [editPearliteFertiteValid, setEditPearliteFertiteValid] = useState(null);
  const [editHardnessBHNValid, setEditHardnessBHNValid] = useState(null);
  const [editTsValid, setEditTsValid] = useState(null);
  const [editYsValid, setEditYsValid] = useState(null);
  const [editElValid, setEditElValid] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  // Helper function to validate range format (e.g., "3.50-3.75" or "3.50")
  const isValidRange = (value) => {
    if (!value || value.trim() === '') return false;
    const trimmed = value.trim();
    // Check if it's a range (e.g., "3.50-3.75") or single number
    const rangePattern = /^\d+(\.\d+)?\s*-\s*\d+(\.\d+)?$/;
    const numberPattern = /^\d+(\.\d+)?$/;
    return rangePattern.test(trimmed) || numberPattern.test(trimmed);
  };

  const fetchItems = async () => {

    try {
      setLoading(true);
      
      // Get today's date in local timezone (YYYY-MM-DD format)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      setCurrentDate(todayStr);
      
      const response = await fetch('http://localhost:5000/api/v1/qc-reports', { credentials: 'include' });
      const data = await response.json();

      let serverItems = [];
      if (data.success) {
        serverItems = data.data || [];
      }

      // Merge with locally stored QC entries (frontend-only fallback)
      let localItems = [];
      try {
        const localRaw = localStorage.getItem('qcProductionLocalEntries');
        localItems = localRaw ? JSON.parse(localRaw) : [];
      } catch (e) {
        console.error('Error reading local QC entries:', e);
      }

      const combined = [...serverItems, ...localItems];
      setItems(combined);
      
      // Filter to show today's entries by default
      const todaysEntries = combined.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date).toISOString().split('T')[0];
        return itemDate === todayStr;
      });
      setFilteredItems(todaysEntries);

    } catch (error) {
      console.error('Error fetching QC production details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent date changes
    if (name === 'date') {
      return;
    }

    // Validate Part Name
    if (name === 'partName') {
      if (value.trim() === '') {
        setEditPartNameValid(null);
      } else {
        setEditPartNameValid(value.trim().length > 0);
      }
    }

    // Validate No. of Moulds (number >= 1)
    if (name === 'noOfMoulds') {
      if (value.trim() === '') {
        setEditNoOfMouldsValid(null);
      } else {
        setEditNoOfMouldsValid(!isNaN(value) && parseFloat(value) >= 1);
      }
    }

    // Validate percentage fields (range format: "X.XX-Y.YY" or single number)
    if (name === 'cPercent') {
      if (value.trim() === '') {
        setEditCPercentValid(null);
      } else {
        setEditCPercentValid(isValidRange(value));
      }
    }
    if (name === 'siPercent') {
      if (value.trim() === '') {
        setEditSiPercentValid(null);
      } else {
        setEditSiPercentValid(isValidRange(value));
      }
    }
    if (name === 'mnPercent') {
      if (value.trim() === '') {
        setEditMnPercentValid(null);
      } else {
        setEditMnPercentValid(isValidRange(value));
      }
    }
    if (name === 'pPercent') {
      if (value.trim() === '') {
        setEditPPercentValid(null);
      } else {
        setEditPPercentValid(isValidRange(value));
      }
    }
    if (name === 'sPercent') {
      if (value.trim() === '') {
        setEditSPercentValid(null);
      } else {
        setEditSPercentValid(isValidRange(value));
      }
    }
    if (name === 'mgPercent') {
      if (value.trim() === '') {
        setEditMgPercentValid(null);
      } else {
        setEditMgPercentValid(isValidRange(value));
      }
    }
    if (name === 'cuPercent') {
      if (value.trim() === '') {
        setEditCuPercentValid(null);
      } else {
        setEditCuPercentValid(isValidRange(value));
      }
    }
    if (name === 'crPercent') {
      if (value.trim() === '') {
        setEditCrPercentValid(null);
      } else {
        setEditCrPercentValid(isValidRange(value));
      }
    }

    // Validate text fields
    if (name === 'nodularity') {
      if (value.trim() === '') {
        setEditNodularityValid(null);
      } else {
        setEditNodularityValid(value.trim().length > 0);
      }
    }
    if (name === 'graphiteType') {
      if (value.trim() === '') {
        setEditGraphiteTypeValid(null);
      } else {
        setEditGraphiteTypeValid(value.trim().length > 0);
      }
    }
    if (name === 'pearliteFerrite') {
      if (value.trim() === '') {
        setEditPearliteFertiteValid(null);
      } else {
        setEditPearliteFertiteValid(value.trim().length > 0);
      }
    }

    // Validate Hardness BHN (range format)
    if (name === 'hardnessBHN') {
      if (value.trim() === '') {
        setEditHardnessBHNValid(null);
      } else {
        setEditHardnessBHNValid(isValidRange(value));
      }
    }

    // Validate TS, YS, EL (text fields)
    if (name === 'ts') {
      if (value.trim() === '') {
        setEditTsValid(null);
      } else {
        setEditTsValid(value.trim().length > 0);
      }
    }
    if (name === 'ys') {
      if (value.trim() === '') {
        setEditYsValid(null);
      } else {
        setEditYsValid(value.trim().length > 0);
      }
    }
    if (name === 'el') {
      if (value.trim() === '') {
        setEditElValid(null);
      } else {
        setEditElValid(value.trim().length > 0);
      }
    }
    
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      partName: item.partName || '',
      noOfMoulds: item.noOfMoulds || '',
      cPercent: item.cPercent || '',
      siPercent: item.siPercent || '',
      mnPercent: item.mnPercent || '',
      pPercent: item.pPercent || '',
      sPercent: item.sPercent || '',
      mgPercent: item.mgPercent || '',
      cuPercent: item.cuPercent || '',
      crPercent: item.crPercent || '',
      nodularity: item.nodularity || '',
      graphiteType: item.graphiteType || '',
      pearliteFerrite: item.pearliteFerrite|| '',
      hardnessBHN: item.hardnessBHN || '',
      ts: item.ts || '',
      ys: item.ys || '',
      el: item.el || ''
    });
    // Reset validation states
    setEditPartNameValid(null);
    setEditNoOfMouldsValid(null);
    setEditCPercentValid(null);
    setEditSiPercentValid(null);
    setEditMnPercentValid(null);
    setEditPPercentValid(null);
    setEditSPercentValid(null);
    setEditMgPercentValid(null);
    setEditCuPercentValid(null);
    setEditCrPercentValid(null);
    setEditNodularityValid(null);
    setEditGraphiteTypeValid(null);
    setEditPearliteFertiteValid(null);
    setEditHardnessBHNValid(null);
    setEditTsValid(null);
    setEditYsValid(null);
    setEditElValid(null);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    // Validate all fields before updating
    let hasErrors = false;

    if (!editFormData.partName || editFormData.partName.trim() === '') {
      setEditPartNameValid(false);
      hasErrors = true;
    }
    if (!editFormData.noOfMoulds || isNaN(editFormData.noOfMoulds) || parseFloat(editFormData.noOfMoulds) < 1) {
      setEditNoOfMouldsValid(false);
      hasErrors = true;
    }
    if (!editFormData.cPercent || !isValidRange(editFormData.cPercent)) {
      setEditCPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.siPercent || !isValidRange(editFormData.siPercent)) {
      setEditSiPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.mnPercent || !isValidRange(editFormData.mnPercent)) {
      setEditMnPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.pPercent || !isValidRange(editFormData.pPercent)) {
      setEditPPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.sPercent || !isValidRange(editFormData.sPercent)) {
      setEditSPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.mgPercent || !isValidRange(editFormData.mgPercent)) {
      setEditMgPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.cuPercent || !isValidRange(editFormData.cuPercent)) {
      setEditCuPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.crPercent || !isValidRange(editFormData.crPercent)) {
      setEditCrPercentValid(false);
      hasErrors = true;
    }
    if (!editFormData.nodularity || editFormData.nodularity.trim() === '') {
      setEditNodularityValid(false);
      hasErrors = true;
    }
    if (!editFormData.graphiteType || editFormData.graphiteType.trim() === '') {
      setEditGraphiteTypeValid(false);
      hasErrors = true;
    }
    if (!editFormData.pearliteFerrite || editFormData.pearliteFerrite.trim() === '') {
      setEditPearliteFertiteValid(false);
      hasErrors = true;
    }
    if (!editFormData.hardnessBHN || !isValidRange(editFormData.hardnessBHN)) {
      setEditHardnessBHNValid(false);
      hasErrors = true;
    }
    if (!editFormData.ts || editFormData.ts.trim() === '') {
      setEditTsValid(false);
      hasErrors = true;
    }
    if (!editFormData.ys || editFormData.ys.trim() === '') {
      setEditYsValid(false);
      hasErrors = true;
    }
    if (!editFormData.el || editFormData.el.trim() === '') {
      setEditElValid(false);
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    try {
      setEditLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/qc-reports/${editingItem._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(editFormData) });
      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        fetchItems();
      }
    } catch (error) {
      console.error('Error updating QC production details:', error);
      alert('Failed to update entry: ' + (error.message || 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/v1/qc-reports/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
          fetchItems();
        }
      } catch (error) {
        console.error('Error deleting QC production details:', error);
        alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleFilter = () => {
    if (!startDate) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // If end date is provided, filter by date range
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      } else {
        // If only start date is provided, show only records from that exact date
        return itemDate.getTime() === start.getTime();
      }
    });

    setFilteredItems(filtered);
  };

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    
    // Show today's entries again when clearing
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const todaysEntries = items.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === todayStr;
    });
    setFilteredItems(todaysEntries);
  };

  // Helper to get input style class based on validation state
  const getInputStyle = (validState) => {
    if (validState === true) return 'valid-input';
    if (validState === false) return 'invalid-input';
    return '';
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="impact-report-header">
        <div className="impact-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            QC Production Details - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {loading ? 'Loading...' : `DATE : ${formatDateDisplay(currentDate)}`}
        </div>
      </div>

      <div className="impact-filter-container">
        <div className="impact-filter-group">
          <label>Start Date</label>
          <CustomDatePicker
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="impact-filter-group">
          <label>End Date</label>
          <CustomDatePicker
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!startDate}>
          Filter
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!startDate && !endDate}>
          Clear
        </ClearButton>
      </div>

      {loading ? (
        <div className="impact-loader-container">
          <div>Loading...</div>
        </div>
      ) : (
        <Table
          columns={[
            { 
              key: 'date', 
              label: 'Date', 
              width: '120px',
              align: 'center',
              render: (item) => formatDateDisplay(item.date)
            },
            { key: 'partName', label: 'Part Name', width: '180px',align : "center"  },
            { key: 'noOfMoulds', label: 'No.Of Moulds', width: '130px', align: 'center' },
            { 
              key: 'cPercent', 
              label: 'C %', 
              width: '80px',
              align: 'center',
              render: (item) => item.cPercent !== undefined && item.cPercent !== null ? item.cPercent : '-'
            },
            { 
              key: 'siPercent', 
              label: 'Si %', 
              width: '80px',
              align: 'center',
              render: (item) => item.siPercent !== undefined && item.siPercent !== null ? item.siPercent : '-'
            },
            { 
              key: 'mnPercent', 
              label: 'Mn %', 
              width: '80px',
              align: 'center',
              render: (item) => item.mnPercent !== undefined && item.mnPercent !== null ? item.mnPercent : '-'
            },
            { 
              key: 'pPercent', 
              label: 'P %', 
              width: '80px',
              align: 'center',
              render: (item) => item.pPercent !== undefined && item.pPercent !== null ? item.pPercent : '-'
            },
            { 
              key: 'sPercent', 
              label: 'S %', 
              width: '80px',
              align: 'center',
              render: (item) => item.sPercent !== undefined && item.sPercent !== null ? item.sPercent : '-'
            },
            { 
              key: 'mgPercent', 
              label: 'Mg %', 
              width: '80px',
              align: 'center',
              render: (item) => item.mgPercent !== undefined && item.mgPercent !== null ? item.mgPercent : '-'
            },
            { 
              key: 'cuPercent', 
              label: 'Cu %', 
              width: '80px',
              align: 'center',
              render: (item) => item.cuPercent !== undefined && item.cuPercent !== null ? item.cuPercent : '-'
            },
            { 
              key: 'crPercent', 
              label: 'Cr %', 
              width: '80px',
              align: 'center',
              render: (item) => item.crPercent !== undefined && item.crPercent !== null ? item.crPercent : '-'
            },
            { key: 'nodularity', label: 'Nodularity', width: '110px', align: 'center' },
            { key: 'graphiteType', label: 'Graphite Type', width: '130px', align: 'center' },
            { key: 'pearliteFerrite', label: 'Pearlite Ferrite', width: '140px', align: 'center' },
            { 
              key: 'hardnessBHN', 
              label: 'Hardness BHN', 
              width: '130px',
              align: 'center',
              render: (item) => item.hardnessBHN !== undefined && item.hardnessBHN !== null ? item.hardnessBHN : '-'
            },
            { 
              key: 'ts', 
              label: 'TS', 
              width: '80px',
              align: 'center',
              render: (item) => item.ts !== undefined && item.ts !== null ? item.ts : '-'
            },
            { 
              key: 'ys', 
              label: 'YS', 
              width: '80px',
              align: 'center',
              render: (item) => item.ys !== undefined && item.ys !== null ? item.ys : '-'
            },
            { 
              key: 'el', 
              label: 'EL', 
              width: '80px',
              align: 'center',
              render: (item) => item.el !== undefined && item.el !== null ? item.el : '-'
            }
          ]}
          data={filteredItems}
          minWidth={2000}
          defaultAlign="left"
          groupByColumn="date"
          renderActions={(item) => (
            <>
              <EditButton onClick={() => handleEdit(item)} />
              <DeleteButton onClick={() => handleDelete(item._id)} />
            </>
          )}
          noDataMessage="No records found"
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit QC Production Details</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="qc-form-grid">
                <div className="qc-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditChange}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed', opacity: 0.7 }}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Part Name *</label>
                  <input
                    type="text"
                    name="partName"
                    value={editFormData.partName}
                    onChange={handleEditChange}
                    placeholder="e.g: Engine Block"
                    className={getInputStyle(editPartNameValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>No. Of Moulds *</label>
                  <input
                    type="number"
                    name="noOfMoulds"
                    value={editFormData.noOfMoulds}
                    onChange={handleEditChange}
                    placeholder="e.g: 10"
                    className={getInputStyle(editNoOfMouldsValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>C % *</label>
                  <input
                    type="number"
                    name="cPercent"
                    value={editFormData.cPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 3.50"
                    className={getInputStyle(editCPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Si % *</label>
                  <input
                    type="number"
                    name="siPercent"
                    value={editFormData.siPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 2.50"
                    className={getInputStyle(editSiPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Mn % *</label>
                  <input
                    type="number"
                    name="mnPercent"
                    value={editFormData.mnPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.50"
                    className={getInputStyle(editMnPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>P % *</label>
                  <input
                    type="number"
                    name="pPercent"
                    value={editFormData.pPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.03"
                    className={getInputStyle(editPPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>S % *</label>
                  <input
                    type="number"
                    name="sPercent"
                    value={editFormData.sPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.02"
                    className={getInputStyle(editSPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Mg % *</label>
                  <input
                    type="number"
                    name="mgPercent"
                    value={editFormData.mgPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.04"
                    className={getInputStyle(editMgPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Cu % *</label>
                  <input
                    type="number"
                    name="cuPercent"
                    value={editFormData.cuPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.80"
                    className={getInputStyle(editCuPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Cr % *</label>
                  <input
                    type="number"
                    name="crPercent"
                    value={editFormData.crPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.10"
                    className={getInputStyle(editCrPercentValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Nodularity *</label>
                  <input
                    type="text"
                    name="nodularity"
                    value={editFormData.nodularity}
                    onChange={handleEditChange}
                    placeholder="e.g: 90%"
                    className={getInputStyle(editNodularityValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Graphite Type *</label>
                  <input
                    type="text"
                    name="graphiteType"
                    value={editFormData.graphiteType}
                    onChange={handleEditChange}
                    placeholder="e.g: Type VI"
                    className={getInputStyle(editGraphiteTypeValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Pearlite Ferrite *</label>
                  <input
                    type="text"
                    name="pearliteFerrite"
                    value={editFormData.pearliteFerrite}
                    onChange={handleEditChange}
                    placeholder="e.g: 80/20 %"
                    className={getInputStyle(editPearliteFertiteValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>Hardness BHN *</label>
                  <input
                    type="number"
                    name="hardnessBHN"
                    value={editFormData.hardnessBHN}
                    onChange={handleEditChange}
                    placeholder="e.g: 220"
                    className={getInputStyle(editHardnessBHNValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>TS *</label>
                  <input
                    type="number"
                    name="ts"
                    value={editFormData.ts}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 600"
                    className={getInputStyle(editTsValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>YS *</label>
                  <input
                    type="number"
                    name="ys"
                    value={editFormData.ys}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 400"
                    className={getInputStyle(editYsValid)}
                  />
                </div>

                <div className="qc-form-group">
                  <label>EL *</label>
                  <input
                    type="number"
                    name="el"
                    value={editFormData.el}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 10"                    className={getInputStyle(editElValid)}                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="modal-cancel-btn" 
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button 
                className="modal-submit-btn" 
                onClick={handleUpdate}
                disabled={editLoading}
              >
                {editLoading ? 'Updating...' : 'Update Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QcProductionDetailsReport;