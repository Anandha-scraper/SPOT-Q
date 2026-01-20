import React, { useState, useEffect } from 'react';
import { X, PencilLine, BookOpenCheck } from 'lucide-react';
import { DatePicker, FilterButton, ClearButton } from '../../Components/Buttons';
import Loader from '../../Components/Loader';
import '../../styles/PageStyles/QcProduction/QcProductionDetailsReport.css';

const QcProductionDetailsReport = () => {
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

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/v1/qc-reports', { credentials: 'include' });
      const data = await response.json();

      if (data.success) {
        setItems(data.data || []);
        setFilteredItems(data.data || []);
      }
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
      noofMoulds: item.noOfMoulds || '',
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
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      setEditLoading(true);
      const response = await fetch(`http://localhost:5000/api/v1/qc-production-details/${editingItem._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(editFormData) });
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
        const response = await fetch(`http://localhost:5000/api/v1/qc-production-details/${id}`, { method: 'DELETE', credentials: 'include' });
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
    setFilteredItems(items);
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
      </div>

      <div className="impact-filter-container">
        <div className="impact-filter-group">
          <label>Start Date</label>
          <DatePicker
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="impact-filter-group">
          <label>End Date</label>
          <DatePicker
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
          <Loader />
        </div>
      ) : (
        <div className="impact-details-card">
          <div className="impact-table-container">
            <table className="impact-table">
              <thead>
                <tr>
                  <th>Date </th>
                  <th>Part Name</th>
                  <th>No.Of Moulds</th>
                  <th>C %</th>
                  <th>Si %</th>
                  <th>Mn %</th>
                  <th>P %</th>
                  <th>S %</th>
                  <th>Mg %</th>
                  <th>Cu %</th>
                  <th>Cr %</th>
                  <th>Nodularity</th>
                  <th>Graphite Type</th>
                  <th>Pearlite Ferrite</th>
                  <th>Hardness BHN</th>
                  <th>TS</th>
                  <th>YS</th>
                  <th>EL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="19" className="qc-production-no-records">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <tr key={item._id || index}>
                      <td>{item.date? new Date(item.date).toLocaleDateString() : '-'}</td>
                      <td>{item.partName || '-'}</td>
                      <td>{item.noOfMoulds|| '-'}</td>
                      <td>{item.cPercent  !== undefined && item.cPercent  !== null ? item.cPercent  : '-'}</td>
                      <td>{item.siPercent !== undefined && item.siPercent !== null ? item.siPercent : '-'}</td>
                      <td>{item.mnPercent !== undefined && item.mnPercent !== null ? item.mnPercent : '-'}</td>
                      <td>{item.pPercent  !== undefined && item.pPercent  !== null ? item.pPercent  : '-'}</td>
                      <td>{item.sPercent  !== undefined && item.sPercent  !== null ? item.sPercent  : '-'}</td>
                      <td>{item.mgPercent !== undefined && item.mgPercent !== null ? item.mgPercent : '-'}</td>
                      <td>{item.cuPercent !== undefined && item.cuPercent !== null ? item.cuPercent : '-'}</td>
                      <td>{item.crPercent !== undefined && item.crPercent !== null ? item.crPercent : '-'}</td>
                      <td>{item.nodularity || '-'}</td>
                      <td>{item.graphiteType || '-'}</td>
                      <td>{item.pearliteFerrite|| '-'}</td>
                      <td>{item.hardnessBHN !== undefined && item.hardnessBHN !== null ? item.hardnessBHN : '-'}</td>
                      <td>{item.ts !== undefined && item.ts !== null ? item.ts : '-'}</td>
                      <td>{item.ys !== undefined && item.ys !== null ? item.ys : '-'}</td>
                      <td>{item.el !== undefined && item.el !== null ? item.el : '-'}</td>
                      <td style={{ minWidth: '100px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              border: '1px solid #fecaca',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
              <div className="qc-production-form-grid">
                <div className="qc-production-form-group">
                  <label>Date *</label>
                  <DatePicker
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditChange}
                    readOnly
                    disabled
                    style={{ cursor: 'not-allowed', opacity: 0.7 }}
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Part Name *</label>
                  <input
                    type="text"
                    name="partName"
                    value={editFormData.partName}
                    onChange={handleEditChange}
                    placeholder="e.g: Engine Block"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>No. Of Moulds *</label>
                  <input
                    type="number"
                    name="noOfMoulds"
                    value={editFormData.noOfMoulds}
                    onChange={handleEditChange}
                    placeholder="e.g: 10"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>C % *</label>
                  <input
                    type="number"
                    name="cPercent"
                    value={editFormData.cPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 3.50"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Si % *</label>
                  <input
                    type="number"
                    name="siPercent"
                    value={editFormData.siPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 2.50"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Mn % *</label>
                  <input
                    type="number"
                    name="mnPercent"
                    value={editFormData.mnPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.50"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>P % *</label>
                  <input
                    type="number"
                    name="pPercent"
                    value={editFormData.pPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.03"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>S % *</label>
                  <input
                    type="number"
                    name="sPercent"
                    value={editFormData.sPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.02"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Mg % *</label>
                  <input
                    type="number"
                    name="mgPercent"
                    value={editFormData.mgPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.04"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Cu % *</label>
                  <input
                    type="number"
                    name="cuPercent"
                    value={editFormData.cuPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.80"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Cr % *</label>
                  <input
                    type="number"
                    name="crPercent"
                    value={editFormData.crPercent}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 0.10"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Nodularity *</label>
                  <input
                    type="text"
                    name="nodularity"
                    value={editFormData.nodularity}
                    onChange={handleEditChange}
                    placeholder="e.g: 90%"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Graphite Type *</label>
                  <input
                    type="text"
                    name="graphiteType"
                    value={editFormData.graphiteType}
                    onChange={handleEditChange}
                    placeholder="e.g: Type VI"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Pearlite Ferrite *</label>
                  <input
                    type="text"
                    name="pearliteFerrite"
                    value={editFormData.pearliteFerrite}
                    onChange={handleEditChange}
                    placeholder="e.g: 80/20 %"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>Hardness BHN *</label>
                  <input
                    type="number"
                    name="hardnessBHN"
                    value={editFormData.hardnessBHN}
                    onChange={handleEditChange}
                    placeholder="e.g: 220"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>TS *</label>
                  <input
                    type="number"
                    name="ts"
                    value={editFormData.ts}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 600"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>YS *</label>
                  <input
                    type="number"
                    name="ys"
                    value={editFormData.ys}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 400"
                  />
                </div>

                <div className="qc-production-form-group">
                  <label>EL *</label>
                  <input
                    type="number"
                    name="el"
                    value={editFormData.el}
                    onChange={handleEditChange}
                    step="0.01"
                    placeholder="e.g: 10"
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
    </>
  );
};

export default QcProductionDetailsReport;