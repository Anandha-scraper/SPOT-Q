import React, { useState, useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { DatePicker, FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import { EditCard } from '../../Components/PopUp';
import Loader from '../../Components/Loader';
import '../../styles/PageStyles/Impact/ImpactReport.css';

const ImpactReport = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states (single-date filter)
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Save confirmation states
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Edited popup state
  const [showEditedPopup, setShowEditedPopup] = useState(false);

  // Edit validation state
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchCurrentDateAndEntries();
  }, []);

  const fetchCurrentDateAndEntries = async () => {
    setLoading(true);

    try {
      // Get server date
      let todayStr;
      try {
        const dateResponse = await fetch(`${API_BASE}/v1/system/current-date`);
        const dateData = await dateResponse.json();
        todayStr = dateData.success && dateData.date ? dateData.date : new Date().toISOString().split('T')[0];
      } catch {
        todayStr = new Date().toISOString().split('T')[0];
      }
      setCurrentDate(todayStr);

      // Fetch entries for current date
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/v1/impact-tests/by-date?date=${todayStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        // API returns entries array (subdocuments) without a date field — attach the date so UI shows correct stored date
        const list = Array.isArray(data.data) ? data.data.map(item => ({ ...item, date: todayStr })) : [];
        setEntries(list);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      // Set current date even on error
      const todayStr = new Date().toISOString().split('T')[0];
      setCurrentDate(todayStr);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    // Handle nested specification fields
    if (name === 'specificationVal' || name === 'specificationConstraint') {
      const field = name === 'specificationVal' ? 'val' : 'constraint';
      setEditFormData(prev => ({
        ...prev,
        specification: {
          ...prev.specification,
          [field]: value
        }
      }));
      return;
    }

    // Auto-capitalize dateCode
    if (name === 'dateCode') {
      setEditFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
      return;
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
      dateCode: item.dateCode || '',
      specification: {
        val: item.specification?.val || '',
        constraint: item.specification?.constraint || ''
      },
      observedValue: item.observedValue || '',
      remarks: item.remarks || ''
    });
    setEditError(''); // Clear any previous error
    setShowEditModal(true);
  };

  const handleSaveClick = () => {
    // Clear any previous error
    setEditError('');

    // Check if any data has changed
    const hasChanges =
      editFormData.partName !== editingItem.partName ||
      editFormData.dateCode !== editingItem.dateCode ||
      editFormData.specification?.val !== editingItem.specification?.val ||
      editFormData.specification?.constraint !== editingItem.specification?.constraint ||
      editFormData.observedValue !== editingItem.observedValue ||
      editFormData.remarks !== editingItem.remarks;

    if (!hasChanges) {
      setEditError('No data Edited');
      // Clear error message after 3 seconds
      setTimeout(() => {
        setEditError('');
      }, 3000);
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleUpdate = async () => {
    try {
      setEditLoading(true);
      setShowSaveConfirm(false);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/v1/impact-tests/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setShowEditedPopup(true);
        // Refresh the entries - either filtered or current date
        if (isFiltered) {
          handleFilter();
        } else {
          fetchCurrentDateAndEntries();
        }
      }
    } catch (error) {
      console.error('Error updating impact test:', error);
      alert('Failed to update entry: ' + (error.message || 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteItemId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/v1/impact-tests/${deleteItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
        // Refresh the entries - either filtered or current date
        if (isFiltered) {
          handleFilter();
        } else {
          fetchCurrentDateAndEntries();
        }
      }
    } catch (error) {
      console.error('Error deleting impact test:', error);
      alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    try {
      setLoading(true);

      // Query backend for entries of a specific date
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/v1/impact-tests/by-date?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        // Attach the selected date to each entry so the report shows the stored date instead of today's date
        const list = Array.isArray(data.data) ? data.data.map(item => ({ ...item, date: selectedDate })) : [];
        setEntries(list);
        setCurrentDate(selectedDate);
        setIsFiltered(true);
      }
    } catch (error) {
      console.error('Error fetching entries by date:', error);
      alert('Failed to fetch entries: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
    setIsFiltered(false);
    fetchCurrentDateAndEntries();
  };

  // Helper function to format specification display
  const formatSpecification = (spec) => {
    if (!spec) return '-';
    const val = spec.val || '';
    const constraint = spec.constraint || '';
    if (val && constraint) {
      return `${val} ${constraint}`;
    }
    return val || constraint || '-';
  };

  // Helper function to format date display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
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
            Impact Test - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {loading ? 'Loading...' : `DATE : ${formatDateDisplay(currentDate)}`}
        </div>
      </div>

      <div className="impact-filter-container">
        <div className="impact-filter-group">
          <label>Date</label>
          <DatePicker
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            placeholder="Select date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!selectedDate}>
          Show
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!isFiltered}>
          Clear
        </ClearButton>
      </div>

      {loading ? (
        <div className="impact-loader-container">
          <Loader />
        </div>
      ) : (
          <div className="impact-table-container">
            <table className="impact-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Part Name</th>
                  <th>Date Code</th>
                  <th>Specification</th>
                  <th>Observed Value</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="impact-no-records">
                      {isFiltered ? 'No entries found for the selected date range' : 'No entries found for today'}
                    </td>
                  </tr>
                ) : (
                  entries.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>
                        {(() => {
                          const raw = item.date || currentDate;
                          const isoDate = typeof raw === 'string' ? raw.split('T')[0] : new Date(raw).toISOString().split('T')[0];
                          return formatDateDisplay(isoDate);
                        })()}
                      </td>
                      <td>{item.partName || '-'}</td>
                      <td>{item.dateCode || '-'}</td>
                      <td>{formatSpecification(item.specification)}</td>
                      <td>{item.observedValue !== undefined && item.observedValue !== null ? item.observedValue : '-'}</td>
                      <td>{item.remarks || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <EditButton onClick={() => handleEdit(item)} />
                          <DeleteButton onClick={() => handleDeleteClick(item._id)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      )}

      {/* Edit Card */}
      <EditCard
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        departmentName="Impact"
        onSave={handleSaveClick}
        onCancel={() => setShowEditModal(false)}
        loading={editLoading}
        error={editError}
      >
        <div className="impact-form-grid">
          <div className="impact-form-group">
            <label>Part Name *</label>
            <input
              type="text"
              name="partName"
              value={editFormData.partName}
              onChange={handleEditChange}
              placeholder="e.g: Engine Block"
            />
          </div>

          <div className="impact-form-group">
            <label>Date Code *</label>
            <input
              type="text"
              name="dateCode"
              value={editFormData.dateCode}
              onChange={handleEditChange}
              placeholder="e.g: 3A21"
            />
          </div>

          <div className="impact-form-group">
            <label>Specification Value *</label>
            <input
              type="number"
              name="specificationVal"
              value={editFormData.specification?.val || ''}
              onChange={handleEditChange}
              step="0.1"
              placeholder="e.g: 3"
            />
          </div>

          <div className="impact-form-group">
            <label>Specification Constraint</label>
            <input
              type="text"
              name="specificationConstraint"
              value={editFormData.specification?.constraint || ''}
              onChange={handleEditChange}
              placeholder="e.g: unnotch - Rj"
            />
          </div>

          <div className="impact-form-group">
            <label>Observed Value *</label>
            <input
              type="text"
              name="observedValue"
              value={editFormData.observedValue}
              onChange={handleEditChange}
              placeholder="e.g: 12 or 34,45"
            />
          </div>

          <div className="impact-form-group">
            <label>Remarks</label>
            <input
              type="text"
              name="remarks"
              value={editFormData.remarks}
              onChange={handleEditChange}
              placeholder="Enter any additional notes..."
              maxLength={80}
            />
          </div>
        </div>
      </EditCard>

    </>
  );
};

export default ImpactReport;
