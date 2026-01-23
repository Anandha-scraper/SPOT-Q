import React, { useState, useEffect } from 'react';
import { X, PencilLine, BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { DeleteConfirmCard, RemarksCard } from '../../Components/PopUp';
import Table from '../../Components/Table';

import '../../styles/PageStyles/Tensile/TensileReport.css';

const TensileReport = () => {
  // Helper: display date in readable format (e.g., "23/01/2026")
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const isoDate = typeof dateStr === 'string' ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = isoDate.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Remarks preview modal
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksText, setRemarksText] = useState('');

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit validation states
  const [editItemValid, setEditItemValid] = useState(null);
  const [editDateCodeValid, setEditDateCodeValid] = useState(null);
  const [editHeatCodeValid, setEditHeatCodeValid] = useState(null);
  const [editDiaValid, setEditDiaValid] = useState(null);
  const [editLoValid, setEditLoValid] = useState(null);
  const [editLiValid, setEditLiValid] = useState(null);
  const [editBreakingLoadValid, setEditBreakingLoadValid] = useState(null);
  const [editYieldLoadValid, setEditYieldLoadValid] = useState(null);
  const [editUtsValid, setEditUtsValid] = useState(null);
  const [editYsValid, setEditYsValid] = useState(null);
  const [editElongationValid, setEditElongationValid] = useState(null);
  const [editTestedByValid, setEditTestedByValid] = useState(null);
  const [editSubmitAttempted, setEditSubmitAttempted] = useState(false);

  useEffect(() => {
    fetchCurrentDateAndEntries();
  }, []);

  const refreshData = async () => {
    if (isFilterActive && startDate) {
      // Re-fetch filtered data
      await fetchFilteredData();
    } else {
      // Re-fetch current date data
      await fetchCurrentDateAndEntries();
    }
  };

  const fetchFilteredData = async () => {
    try {
      setLoading(true);

      // Build query params
      let query = `startDate=${startDate}`;
      if (endDate) {
        query += `&endDate=${endDate}`;
      }

      const response = await fetch(`/v1/tensile/filter?${query}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error filtering entries:', error);
      alert('Failed to filter entries: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentDateAndEntries = async () => {
    try {
      setLoading(true);
      // Get current date (client-side)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      setCurrentDate(todayStr);

      // Fetch entries for current date
      const response = await fetch(`/v1/tensile/by-date?date=${todayStr}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tensile tests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helpers for remarks truncation and modal
  const splitIntoSentences = (text) => {
    if (!text) return [];
    return text
      .replace(/\n+/g, ' ')
      .trim()
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
  };

  const getTwoSentencePreview = (text) => {
    const sentences = splitIntoSentences(text);
    if (sentences.length <= 2) return { preview: text, truncated: false };
    const preview = sentences.slice(0, 2).join(' ');
    return { preview, truncated: true };
  };

  const openRemarks = (full) => {
    setRemarksText(full || '');
    setShowRemarksModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    // --- VALIDATE ITEM: text required ---
    if (name === 'item') {
      if (value.trim() === "") {
        setEditItemValid(editSubmitAttempted ? false : null);
      } else {
        setEditItemValid(value.trim().length > 0);
      }
    }

    // --- VALIDATE DATE CODE: specific format (e.g., 6F25) ---
    if (name === 'dateCode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (value.trim() === "") {
        setEditDateCodeValid(editSubmitAttempted ? false : null);
      } else {
        setEditDateCodeValid(pattern.test(value));
      }
      setEditFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
      return;
    }

    // --- VALIDATE HEAT CODE: only numbers ---
    if (name === 'heatCode') {
      const numericPattern = /^\d+$/;
      if (value.trim() === "") {
        setEditHeatCodeValid(null);
      } else {
        setEditHeatCodeValid(numericPattern.test(value));
      }
    }

    // --- VALIDATE DIA: number ---
    if (name === 'dia') {
      if (value.trim() === "") {
        setEditDiaValid(null);
      } else {
        setEditDiaValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE LO: number ---
    if (name === 'lo') {
      if (value.trim() === "") {
        setEditLoValid(null);
      } else {
        setEditLoValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE LI: number ---
    if (name === 'li') {
      if (value.trim() === "") {
        setEditLiValid(null);
      } else {
        setEditLiValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE BREAKING LOAD: number ---
    if (name === 'breakingLoad') {
      if (value.trim() === "") {
        setEditBreakingLoadValid(null);
      } else {
        setEditBreakingLoadValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE YIELD LOAD: number ---
    if (name === 'yieldLoad') {
      if (value.trim() === "") {
        setEditYieldLoadValid(null);
      } else {
        setEditYieldLoadValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE UTS: number ---
    if (name === 'uts') {
      if (value.trim() === "") {
        setEditUtsValid(null);
      } else {
        setEditUtsValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE YS: number ---
    if (name === 'ys') {
      if (value.trim() === "") {
        setEditYsValid(null);
      } else {
        setEditYsValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }

    // --- VALIDATE ELONGATION: number between 0-100 ---
    if (name === 'elongation') {
      if (value.trim() === "") {
        setEditElongationValid(null);
      } else {
        const num = parseFloat(value);
        setEditElongationValid(!isNaN(num) && num >= 0 && num <= 100);
      }
    }

    // --- VALIDATE TESTED BY: optional text field ---
    if (name === 'testedBy') {
      if (value.trim() === "") {
        setEditTestedByValid(null);
      } else {
        setEditTestedByValid(value.trim().length > 0);
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
      item: item.item || '',
      dateCode: item.dateCode || '',
      heatCode: item.heatCode || '',
      dia: item.dia || '',
      lo: item.lo || '',
      li: item.li || '',
      breakingLoad: item.breakingLoad || '',
      yieldLoad: item.yieldLoad || '',
      uts: item.uts || '',
      ys: item.ys || '',
      elongation: item.elongation || '',
      remarks: item.remarks || '',
      testedBy: item.testedBy || ''
    });

    // Reset validation states
    setEditItemValid(null);
    setEditDateCodeValid(null);
    setEditHeatCodeValid(null);
    setEditDiaValid(null);
    setEditLoValid(null);
    setEditLiValid(null);
    setEditBreakingLoadValid(null);
    setEditYieldLoadValid(null);
    setEditUtsValid(null);
    setEditYsValid(null);
    setEditElongationValid(null);
    setEditTestedByValid(null);
    setEditSubmitAttempted(false);

    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    setEditSubmitAttempted(true);

    // Validate ALL fields
    let hasErrors = false;

    // Required fields validation
    if (!editFormData.item || editFormData.item.trim() === '') {
      setEditItemValid(false);
      hasErrors = true;
    } else {
      setEditItemValid(true);
    }

    if (!editFormData.dateCode || editFormData.dateCode.trim() === '') {
      setEditDateCodeValid(false);
      hasErrors = true;
    } else {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (!pattern.test(editFormData.dateCode)) {
        setEditDateCodeValid(false);
        hasErrors = true;
      } else {
        setEditDateCodeValid(true);
      }
    }

    // All other fields - mark as invalid if empty OR if they have invalid data
    if (!editFormData.heatCode || editFormData.heatCode.trim() === '') {
      setEditHeatCodeValid(false);
      hasErrors = true;
    } else {
      const numericPattern = /^\d+$/;
      if (!numericPattern.test(editFormData.heatCode)) {
        setEditHeatCodeValid(false);
        hasErrors = true;
      } else {
        setEditHeatCodeValid(true);
      }
    }

    if (!editFormData.dia || editFormData.dia.toString().trim() === '') {
      setEditDiaValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.dia) || parseFloat(editFormData.dia) <= 0) {
        setEditDiaValid(false);
        hasErrors = true;
      } else {
        setEditDiaValid(true);
      }
    }

    if (!editFormData.lo || editFormData.lo.toString().trim() === '') {
      setEditLoValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.lo) || parseFloat(editFormData.lo) <= 0) {
        setEditLoValid(false);
        hasErrors = true;
      } else {
        setEditLoValid(true);
      }
    }

    if (!editFormData.li || editFormData.li.toString().trim() === '') {
      setEditLiValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.li) || parseFloat(editFormData.li) <= 0) {
        setEditLiValid(false);
        hasErrors = true;
      } else {
        setEditLiValid(true);
      }
    }

    if (!editFormData.breakingLoad || editFormData.breakingLoad.toString().trim() === '') {
      setEditBreakingLoadValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.breakingLoad) || parseFloat(editFormData.breakingLoad) <= 0) {
        setEditBreakingLoadValid(false);
        hasErrors = true;
      } else {
        setEditBreakingLoadValid(true);
      }
    }

    if (!editFormData.yieldLoad || editFormData.yieldLoad.toString().trim() === '') {
      setEditYieldLoadValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.yieldLoad) || parseFloat(editFormData.yieldLoad) <= 0) {
        setEditYieldLoadValid(false);
        hasErrors = true;
      } else {
        setEditYieldLoadValid(true);
      }
    }

    if (!editFormData.uts || editFormData.uts.toString().trim() === '') {
      setEditUtsValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.uts) || parseFloat(editFormData.uts) <= 0) {
        setEditUtsValid(false);
        hasErrors = true;
      } else {
        setEditUtsValid(true);
      }
    }

    if (!editFormData.ys || editFormData.ys.toString().trim() === '') {
      setEditYsValid(false);
      hasErrors = true;
    } else {
      if (isNaN(editFormData.ys) || parseFloat(editFormData.ys) <= 0) {
        setEditYsValid(false);
        hasErrors = true;
      } else {
        setEditYsValid(true);
      }
    }

    if (!editFormData.elongation || editFormData.elongation.toString().trim() === '') {
      setEditElongationValid(false);
      hasErrors = true;
    } else {
      const num = parseFloat(editFormData.elongation);
      if (isNaN(num) || num < 0 || num > 100) {
        setEditElongationValid(false);
        hasErrors = true;
      } else {
        setEditElongationValid(true);
      }
    }

    // Tested By is optional - only validate if it has a value
    if (editFormData.testedBy && editFormData.testedBy.trim() !== '') {
      if (editFormData.testedBy.trim().length === 0) {
        setEditTestedByValid(false);
        hasErrors = true;
      } else {
        setEditTestedByValid(true);
      }
    }

    if (hasErrors) {
      return;
    }

    try {
      setEditLoading(true);
      // Convert numeric fields from strings to numbers
      const updatePayload = {
        ...editFormData,
        dia: editFormData.dia ? parseFloat(editFormData.dia) : '',
        lo: editFormData.lo ? parseFloat(editFormData.lo) : '',
        li: editFormData.li ? parseFloat(editFormData.li) : '',
        breakingLoad: editFormData.breakingLoad ? parseFloat(editFormData.breakingLoad) : '',
        yieldLoad: editFormData.yieldLoad ? parseFloat(editFormData.yieldLoad) : '',
        uts: editFormData.uts ? parseFloat(editFormData.uts) : '',
        ys: editFormData.ys ? parseFloat(editFormData.ys) : '',
        elongation: editFormData.elongation ? parseFloat(editFormData.elongation) : ''
      };
      const response = await fetch(`/v1/tensile/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });
      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setEditSubmitAttempted(false);
        refreshData();
      }
    } catch (error) {
      console.error('Error updating tensile test:', error);
      alert('Failed to update entry: ' + (error.message || 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/v1/tensile/${deletingId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setDeletingId(null);
        refreshData();
      }
    } catch (error) {
      console.error('Error deleting tensile test:', error);
      alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const handleFilter = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    setIsFilterActive(true);
    await fetchFilteredData();
  };

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setIsFilterActive(false);
    fetchCurrentDateAndEntries();
  };

  return (
    <>
      <div className="tensile-report-header">
        <div className="tensile-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Tensile Test - Report
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
              label: 'Date of Inspection', 
              width: '6%', 
              bold: true,
              align: 'center',
              render: (item) => {
                const dateToUse = item.date || currentDate;
                if (!dateToUse) return '-';
                const dateStr = typeof dateToUse === 'string' ? dateToUse : dateToUse.toString();
                const isoDate = dateStr.split('T')[0];
                return formatDateDisplay(isoDate);
              }
            },
            { key: 'item', label: 'Item', width: '4%', align: 'center' },
            { key: 'dateCode', label: 'Date Code', width: '4%', align: 'center' },
            { key: 'heatCode', label: 'Heat Code', width: '4%', align: 'center' },
            { key: 'dia', label: 'Dia (mm)', width: '3%', align: 'center' },
            { key: 'lo', label: 'Lo (mm)', width: '3%', align: 'center' },
            { key: 'li', label: 'Li (mm)', width: '3%', align: 'center' },
            { key: 'breakingLoad', label: 'Breaking Load (kN)', width: '5%', align: 'center' },
            { key: 'yieldLoad', label: 'Yield Load (kN)', width: '4%', align: 'center' },
            { key: 'uts', label: 'UTS (N/mm²)', width: '3%', align: 'center' },
            { key: 'ys', label: 'YS (N/mm²)', width: '3%', align: 'center' },
            { key: 'elongation', label: 'Elongation (%)', width: '5%', align: 'center' },
            { key: 'testedBy', label: 'Tested By', width: '4%', align: 'center' },
            { 
              key: 'remarks', 
              label: 'Remarks', 
              width: '4%',
              align: 'center',
              render: (item) => {
                const value = typeof item.remarks === 'string' ? item.remarks : '';
                if (!value) return '-';
                const short = value.length > 6 ? value.slice(0, 5) + '..' : value;
                return (
                  <span
                    onClick={() => openRemarks(value)}
                    title={value}
                    style={{ cursor: 'pointer', color: '#0ea5e9', textDecoration: 'underline dotted' }}
                    aria-label="View full remarks"
                  >
                    {short}
                  </span>
                );
              }
            }
          ]}
          data={entries}
          groupByColumn="date"
          renderActions={(item) => (
            <>
              <EditButton onClick={() => handleEdit(item)} />
              <DeleteButton onClick={() => handleDeleteClick(item._id)} />
            </>
          )}
          noDataMessage="No records found"
        />
      )}

      {/* Remarks Modal */}
      <RemarksCard
        isOpen={showRemarksModal}
        onClose={() => setShowRemarksModal(false)}
        remarksText={remarksText}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Tensile Test Entry</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="tensile-form-grid">
                <div className="tensile-form-group">
                  <label>Item *</label>
                  <input
                    type="text"
                    name="item"
                    value={editFormData.item}
                    onChange={handleEditChange}
                    placeholder="e.g: Steel Rod"
                    className={
                      editItemValid === null
                        ? ""
                        : editItemValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Date Code *</label>
                  <input
                    type="text"
                    name="dateCode"
                    value={editFormData.dateCode}
                    onChange={handleEditChange}
                    placeholder="e.g: 6F25"
                    className={
                      editDateCodeValid === null
                        ? ""
                        : editDateCodeValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Heat Code</label>
                  <input
                    type="number"
                    name="heatCode"
                    value={editFormData.heatCode}
                    onChange={handleEditChange}
                    placeholder="Enter number only"
                    className={
                      editHeatCodeValid === null
                        ? ""
                        : editHeatCodeValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Dia (mm)</label>
                  <input
                    type="number"
                    name="dia"
                    value={editFormData.dia}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 10.5"
                    className={
                      editDiaValid === null
                        ? ""
                        : editDiaValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Lo (mm)</label>
                  <input
                    type="number"
                    name="lo"
                    value={editFormData.lo}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="Original length"
                    className={
                      editLoValid === null
                        ? ""
                        : editLoValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Li (mm)</label>
                  <input
                    type="number"
                    name="li"
                    value={editFormData.li}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="Final length"
                    className={
                      editLiValid === null
                        ? ""
                        : editLiValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Breaking Load (kN)</label>
                  <input
                    type="number"
                    name="breakingLoad"
                    value={editFormData.breakingLoad}
                    onChange={handleEditChange}
                    step="0.01"
                    className={
                      editBreakingLoadValid === null
                        ? ""
                        : editBreakingLoadValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Yield Load (kN)</label>
                  <input
                    type="number"
                    name="yieldLoad"
                    value={editFormData.yieldLoad}
                    onChange={handleEditChange}
                    step="0.01"
                    className={
                      editYieldLoadValid === null
                        ? ""
                        : editYieldLoadValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>UTS (N/mm²)</label>
                  <input
                    type="number"
                    name="uts"
                    value={editFormData.uts}
                    onChange={handleEditChange}
                    step="0.01"
                    className={
                      editUtsValid === null
                        ? ""
                        : editUtsValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>YS (N/mm²)</label>
                  <input
                    type="number"
                    name="ys"
                    value={editFormData.ys}
                    onChange={handleEditChange}
                    step="0.01"
                    className={
                      editYsValid === null
                        ? ""
                        : editYsValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Elongation (%)</label>
                  <input
                    type="number"
                    name="elongation"
                    value={editFormData.elongation}
                    onChange={handleEditChange}
                    step="0.01"
                    className={
                      editElongationValid === null
                        ? ""
                        : editElongationValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group">
                  <label>Tested By</label>
                  <input
                    type="text"
                    name="testedBy"
                    value={editFormData.testedBy}
                    onChange={handleEditChange}
                    placeholder="e.g: John Doe"
                    className={
                      editTestedByValid === null
                        ? ""
                        : editTestedByValid
                        ? "valid-input"
                        : "invalid-input"
                    }
                  />
                </div>

                <div className="tensile-form-group full-width">
                  <label>Remarks</label>
                  <input
                    type="text"
                    name="remarks"
                    value={editFormData.remarks}
                    onChange={handleEditChange}
                    placeholder="Any additional notes"
                    maxLength={200}
                  />
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmCard
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        departmentName="Tensile"
        loading={deleteLoading}
      />
    </>
  );
};

export default TensileReport;