import React, { useState, useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Table from '../../Components/Table';
import { EditCard } from '../../Components/PopUp';
import '../../styles/PageStyles/Impact/ImpactReport.css';

const ImpactReport = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCurrentDateAndEntries();
  }, []);

  const fetchCurrentDateAndEntries = async () => {
    setLoading(true);
    try {
      // Get server date
      let todayStr;
      try {
        const dateResponse = await fetch('http://localhost:5000/api/v1/impact-tests/current-date', {
          credentials: 'include'
        });
        const dateData = await dateResponse.json();
        todayStr = dateData.success && dateData.date ? dateData.date : new Date().toISOString().split('T')[0];
      } catch {
        todayStr = new Date().toISOString().split('T')[0];
      }
      setCurrentDate(todayStr);

      // Fetch entries for current date
      const response = await fetch(`http://localhost:5000/api/v1/impact-tests/by-date?date=${todayStr}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        const list = Array.isArray(data.data) ? data.data.map(item => ({ ...item, date: todayStr })) : [];
        setEntries(list);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
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
      partName: item.partName || '',
      dateCode: item.dateCode || '',
      specification: {
        val: item.specification?.val || '',
        constraint: item.specification?.constraint || ''
      },
      observedValue: item.observedValue || '',
      remarks: item.remarks || ''
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
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
      setEditError('No data edited');
      setTimeout(() => {
        setEditError('');
      }, 3000);
      return;
    }

    try {
      setEditLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/impact-tests/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editFormData)
      });
      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        if (isFiltered) {
          handleFilter();
        } else {
          fetchCurrentDateAndEntries();
        }
      }
    } catch (error) {
      console.error('Error updating impact test:', error);
      setEditError('Failed to update entry');
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
      const response = await fetch(`http://localhost:5000/api/v1/impact-tests/${deleteItemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
        if (isFiltered) {
          handleFilter();
        } else {
          fetchCurrentDateAndEntries();
        }
      }
    } catch (error) {
      console.error('Error deleting impact test:', error);
      alert('Failed to delete entry');
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
      const response = await fetch(`http://localhost:5000/api/v1/impact-tests/by-date?date=${selectedDate}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        const list = Array.isArray(data.data) ? data.data.map(item => ({ ...item, date: selectedDate })) : [];
        setEntries(list);
        setCurrentDate(selectedDate);
        setIsFiltered(true);
      }
    } catch (error) {
      console.error('Error fetching entries by date:', error);
      alert('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
    setIsFiltered(false);
    fetchCurrentDateAndEntries();
  };

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
          <CustomDatePicker
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
              render: (item) => {
                const raw = item.date || currentDate;
                const isoDate = typeof raw === 'string' ? raw.split('T')[0] : new Date(raw).toISOString().split('T')[0];
                return formatDateDisplay(isoDate);
              }
            },
            { key: 'partName', label: 'Part Name', width: '200px' },
            { key: 'dateCode', label: 'Date Code', width: '120px', align: 'center' },
            { 
              key: 'specification.val', 
              label: 'Specification Value', 
              width: '160px',
              align: 'center',
              render: (item) => item.specification?.val || '-'
            },
            { 
              key: 'specification.constraint', 
              label: 'Specification Constraint', 
              width: '180px',
              align: 'center',
              render: (item) => item.specification?.constraint || '-'
            },
            { 
              key: 'observedValue', 
              label: 'Observed Value', 
              width: '140px',
              align: 'center',
              render: (item) => item.observedValue !== undefined && item.observedValue !== null ? item.observedValue : '-'
            },
            { key: 'remarks', label: 'Remarks', width: '250px', align: 'center' }
          ]}
          data={entries}
          minWidth={1400}
          defaultAlign="left"
          renderActions={(item) => (
            <>
              <EditButton onClick={() => handleEdit(item)} />
              <DeleteButton onClick={() => handleDeleteClick(item._id)} />
            </>
          )}
          noDataMessage={isFiltered ? 'No entries found for the selected date' : 'No entries found for today'}
        />
      )}

      {/* Edit Modal */}
      <EditCard
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        departmentName="Impact"
        onSave={handleSaveEdit}
        loading={editLoading}
        error={editError}
      >
        <div className="impact-form-grid">
          <div className="impact-form-group">
            <label>Part Name *</label>
            <input
              type="text"
              name="partName"
              value={editFormData.partName || ''}
              onChange={handleEditChange}
              placeholder="e.g: Crankshaft"
            />
          </div>

          <div className="impact-form-group">
            <label>Date Code *</label>
            <input
              type="text"
              name="dateCode"
              value={editFormData.dateCode || ''}
              onChange={handleEditChange}
              placeholder="e.g: 6F25"
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
              placeholder="e.g: 12.5"
            />
          </div>

          <div className="impact-form-group">
            <label>Specification Constraint</label>
            <input
              type="text"
              name="specificationConstraint"
              value={editFormData.specification?.constraint || ''}
              onChange={handleEditChange}
              placeholder="e.g: 30° unnotch"
            />
          </div>

          <div className="impact-form-group">
            <label>Observed Value *</label>
            <input
              type="text"
              name="observedValue"
              value={editFormData.observedValue || ''}
              onChange={handleEditChange}
              placeholder="e.g: 12 or 34,45"
            />
          </div>

          <div className="impact-form-group">
            <label>Remarks</label>
            <input
              type="text"
              name="remarks"
              value={editFormData.remarks || ''}
              onChange={handleEditChange}
              placeholder="Enter any additional notes..."
              maxLength={80}
            />
          </div>
        </div>
      </EditCard>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="impact-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="impact-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this entry?</p>
            <div className="impact-modal-actions">
              <button 
                className="impact-modal-btn cancel-btn" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="impact-modal-btn delete-btn" 
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImpactReport;
