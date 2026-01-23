import { useState, useEffect } from 'react';
import { X, BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton, EditButton, DeleteButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import Table from '../../Components/Table';
import "../../styles/PageStyles/MicroStructure/MicroStructureReport.css";

const MicroStructureReport = () => {
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
      // Fetch all entries using a wide date range
      const startDate = '2020-01-01';
      const endDate = '2030-12-31';
      const resp = await fetch(`http://localhost:5000/api/v1/micro-structure/filter?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await resp.json();

      if (data.success) {
        setItems(data.data || []);
        setFilteredItems(data.data || []);
      } else {
        console.error('Failed to fetch:', data.message);
      }
    } catch (error) {
      console.error('Error fetching micro structure tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      disa: item.disa || '',
      partName: item.partName || '',
      dateCode: item.dateCode || '',
      heatCode: item.heatCode || '',
      nodularity: item.nodularity || '',
      graphiteType: item.graphiteType || '',
      countNos: item.countNos || '',
      size: item.size || '',
      ferrite: item.ferrite || '',
      pearlite: item.pearlite || '',
      carbide: item.carbide || '',
      remarks: item.remarks || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      setEditLoading(true);
      const resp = await fetch(`http://localhost:5000/api/v1/micro-structure/${editingItem._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });
      const data = await resp.json();

      if (data.success) {
        setShowEditModal(false);
        fetchItems();
      } else {
        alert('Failed to update entry: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating micro structure test:', error);
      alert('Failed to update entry: ' + (error.message || 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const resp = await fetch(`http://localhost:5000/api/v1/micro-structure/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await resp.json();

        if (data.success) {
          fetchItems();
        } else {
          alert('Failed to delete entry: ' + (data.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting micro structure test:', error);
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
      const rawDate = item.date;
      if (!rawDate) return false;

      const itemDate = new Date(rawDate);
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

  // Format date for display
  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <div className="impact-report-header">
        <div className="impact-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Micro Structure - Report
          </h2>
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
              render: (item) => formatDate(item.date)
            },
            { key: 'disa', label: 'DISA', width: '100px', align: 'center' },
            { key: 'partName', label: 'Part Name', width: '180px' },
            { key: 'dateCode', label: 'Date Code', width: '110px', align: 'center' },
            { key: 'heatCode', label: 'Heat Code', width: '110px', align: 'center' },
            { 
              key: 'nodularity', 
              label: 'Nodularity %', 
              width: '120px',
              align: 'center',
              render: (item) => item.nodularity !== undefined && item.nodularity !== null ? item.nodularity : '-'
            },
            { 
              key: 'graphiteType', 
              label: 'Graphite Type %', 
              width: '140px',
              align: 'center',
              render: (item) => item.graphiteType !== undefined && item.graphiteType !== null ? item.graphiteType : '-'
            },
            { key: 'countNos', label: 'Count Nos/mm²', width: '130px', align: 'center' },
            { key: 'size', label: 'Size', width: '90px', align: 'center' },
            { 
              key: 'ferrite', 
              label: 'Ferrite %', 
              width: '100px',
              align: 'center',
              render: (item) => item.ferrite !== undefined && item.ferrite !== null ? item.ferrite : '-'
            },
            { 
              key: 'pearlite', 
              label: 'Pearlite %', 
              width: '100px',
              align: 'center',
              render: (item) => item.pearlite !== undefined && item.pearlite !== null ? item.pearlite : '-'
            },
            { 
              key: 'carbide', 
              label: 'Carbide %', 
              width: '100px',
              align: 'center',
              render: (item) => item.carbide !== undefined && item.carbide !== null ? item.carbide : '-'
            },
            { key: 'remarks', label: 'Remarks', width: '200px' }
          ]}
          data={filteredItems}
          minWidth={1700}
          defaultAlign="left"
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
              <h2>Edit Micro Structure Entry</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="microstructure-form-grid">
                <div className="microstructure-form-group">
                  <label>DISA</label>
                  <input
                    type="text"
                    name="disa"
                    value={editFormData.disa}
                    onChange={handleEditChange}
                    placeholder="e.g: DISA 1"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Part Name</label>
                  <input
                    type="text"
                    name="partName"
                    value={editFormData.partName}
                    onChange={handleEditChange}
                    placeholder="e.g: Engine Block"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Date Code</label>
                  <input
                    type="text"
                    name="dateCode"
                    value={editFormData.dateCode}
                    onChange={handleEditChange}
                    placeholder="e.g: 6F25"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Heat Code</label>
                  <input
                    type="text"
                    name="heatCode"
                    value={editFormData.heatCode}
                    onChange={handleEditChange}
                    placeholder="e.g: HC-2024-001"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Nodularity %</label>
                  <input
                    type="number"
                    name="nodularity"
                    value={editFormData.nodularity}
                    onChange={handleEditChange}
                    placeholder="e.g: 85"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Graphite Type %</label>
                  <input
                    type="number"
                    name="graphiteType"
                    value={editFormData.graphiteType}
                    onChange={handleEditChange}
                    placeholder="e.g: 15"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Count Nos/mm²</label>
                  <input
                    type="text"
                    name="countNos"
                    value={editFormData.countNos}
                    onChange={handleEditChange}
                    placeholder="e.g: 120-250"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Size</label>
                  <input
                    type="text"
                    name="size"
                    value={editFormData.size}
                    onChange={handleEditChange}
                    placeholder="e.g: 5-7"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Ferrite %</label>
                  <input
                    type="number"
                    name="ferrite"
                    value={editFormData.ferrite}
                    onChange={handleEditChange}
                    placeholder="e.g: 60"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Pearlite %</label>
                  <input
                    type="number"
                    name="pearlite"
                    value={editFormData.pearlite}
                    onChange={handleEditChange}
                    placeholder="e.g: 35"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="microstructure-form-group">
                  <label>Carbide %</label>
                  <input
                    type="number"
                    name="carbide"
                    value={editFormData.carbide}
                    onChange={handleEditChange}
                    placeholder="e.g: 5"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="microstructure-form-group full-width">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={editFormData.remarks}
                    onChange={handleEditChange}
                    rows="3"
                    placeholder="Any additional notes"
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

export default MicroStructureReport;
