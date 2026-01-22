import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpenCheck, ArrowLeft } from 'lucide-react';
import Loader from '../../Components/Loader';
import Table from '../../Components/Table';
import { EditCard, DeleteConfirmCard } from '../../Components/PopUp';
import { EditButton, DeleteButton } from '../../Components/Buttons';
import '../../styles/PageStyles/Process/ProcessReportEntries.css';

const ProcessReportEntries = () => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const location = useLocation();
  const navigate = useNavigate();
  const { date, disa } = location.state || {};
  const [currentEntries, setCurrentEntries] = useState(location.state?.entries || []);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Validation states (null = neutral, true = green/valid, false = red/invalid)
  const [partNameValid, setPartNameValid] = useState(null);
  const [datecodeValid, setDatecodeValid] = useState(null);
  const [heatcodeValid, setHeatcodeValid] = useState(null);
  const [quantityOfMouldsValid, setQuantityOfMouldsValid] = useState(null);
  const [metalCValid, setMetalCValid] = useState(null);
  const [metalSiValid, setMetalSiValid] = useState(null);
  const [metalMnValid, setMetalMnValid] = useState(null);
  const [metalPValid, setMetalPValid] = useState(null);
  const [metalSValid, setMetalSValid] = useState(null);
  const [metalMgFLValid, setMetalMgFLValid] = useState(null);
  const [metalCuValid, setMetalCuValid] = useState(null);
  const [metalCrValid, setMetalCrValid] = useState(null);
  const [timeOfPouringValid, setTimeOfPouringValid] = useState(null);
  const [pouringTempValid, setPouringTempValid] = useState(null);
  const [corrCValid, setCorrCValid] = useState(null);
  const [corrSiValid, setCorrSiValid] = useState(null);
  const [corrMnValid, setCorrMnValid] = useState(null);
  const [corrSValid, setCorrSValid] = useState(null);
  const [corrCrValid, setCorrCrValid] = useState(null);
  const [corrCuValid, setCorrCuValid] = useState(null);
  const [corrSnValid, setCorrSnValid] = useState(null);
  const [remarksValid, setRemarksValid] = useState(null);

  useEffect(() => {
    if (!date || !currentEntries || currentEntries.length === 0) {
      navigate('/process/report');
    }
  }, [date, currentEntries, navigate]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No Date') return 'No Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditFormData({ ...item });
    // Reset all validation states to null (neutral) when opening edit modal
    setPartNameValid(null);
    setDatecodeValid(null);
    setHeatcodeValid(null);
    setQuantityOfMouldsValid(null);
    setMetalCValid(null);
    setMetalSiValid(null);
    setMetalMnValid(null);
    setMetalPValid(null);
    setMetalSValid(null);
    setMetalMgFLValid(null);
    setMetalCuValid(null);
    setMetalCrValid(null);
    setTimeOfPouringValid(null);
    setPouringTempValid(null);
    setCorrCValid(null);
    setCorrSiValid(null);
    setCorrMnValid(null);
    setCorrSValid(null);
    setCorrCrValid(null);
    setCorrCuValid(null);
    setCorrSnValid(null);
    setRemarksValid(null);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedItem(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    // TODO: Implement save functionality
    console.log('Saving:', editFormData);
    handleCloseEdit();
  };

  const handleDelete = (item) => {
    setDeleteItemId(item._id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/v1/process/${deleteItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Remove the deleted entry from the current list
        const updatedEntries = currentEntries.filter(entry => entry._id !== deleteItemId);
        setCurrentEntries(updatedEntries);
        
        // If no entries left, navigate back
        if (updatedEntries.length === 0) {
          navigate('/process/report');
        }
        
        setShowDeleteConfirm(false);
        setDeleteItemId(null);
      } else {
        alert('Failed to delete entry: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting process entry:', error);
      alert('Failed to delete entry: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteItemId(null);
  };

  const handleInputChange = (field, value) => {
    // Validate Part Name
    if (field === 'partName') {
      if (value.trim() === '') {
        setPartNameValid(null);
      } else {
        setPartNameValid(value.trim().length > 0);
      }
    }
    
    // Validate Date Code - specific format (e.g., 6F25)
    if (field === 'datecode') {
      const pattern = /^[0-9][A-Z][0-9]{2}$/;
      if (value.trim() === '') {
        setDatecodeValid(null);
      } else {
        setDatecodeValid(pattern.test(value));
      }
    }
    
    // Validate Heat Code
    if (field === 'heatcode') {
      if (value.trim() === '') {
        setHeatcodeValid(null);
      } else {
        setHeatcodeValid(value.trim().length > 0);
      }
    }
    
    // Validate Quantity of Moulds
    if (field === 'quantityOfMoulds') {
      if (value.trim() === '') {
        setQuantityOfMouldsValid(null);
      } else {
        setQuantityOfMouldsValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    // Metal Composition validations
    if (field === 'metalCompositionC') {
      if (value.trim() === '') {
        setMetalCValid(null);
      } else {
        setMetalCValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionSi') {
      if (value.trim() === '') {
        setMetalSiValid(null);
      } else {
        setMetalSiValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionMn') {
      if (value.trim() === '') {
        setMetalMnValid(null);
      } else {
        setMetalMnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionP') {
      if (value.trim() === '') {
        setMetalPValid(null);
      } else {
        setMetalPValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionS') {
      if (value.trim() === '') {
        setMetalSValid(null);
      } else {
        setMetalSValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionMgFL') {
      if (value.trim() === '') {
        setMetalMgFLValid(null);
      } else {
        setMetalMgFLValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionCu') {
      if (value.trim() === '') {
        setMetalCuValid(null);
      } else {
        setMetalCuValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'metalCompositionCr') {
      if (value.trim() === '') {
        setMetalCrValid(null);
      } else {
        setMetalCrValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    // Time of Pouring (text format like "10:30 - 11:45")
    if (field === 'timeOfPouring') {
      if (value.trim() === '') {
        setTimeOfPouringValid(null);
      } else {
        setTimeOfPouringValid(value.trim().length > 0);
      }
    }
    
    // Pouring Temperature
    if (field === 'pouringTemperature') {
      if (value.trim() === '') {
        setPouringTempValid(null);
      } else {
        setPouringTempValid(!isNaN(value) && parseFloat(value) > 0);
      }
    }
    
    // Corrective Addition validations
    if (field === 'correctiveAdditionC') {
      if (value.trim() === '') {
        setCorrCValid(null);
      } else {
        setCorrCValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionSi') {
      if (value.trim() === '') {
        setCorrSiValid(null);
      } else {
        setCorrSiValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionMn') {
      if (value.trim() === '') {
        setCorrMnValid(null);
      } else {
        setCorrMnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionS') {
      if (value.trim() === '') {
        setCorrSValid(null);
      } else {
        setCorrSValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionCr') {
      if (value.trim() === '') {
        setCorrCrValid(null);
      } else {
        setCorrCrValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionCu') {
      if (value.trim() === '') {
        setCorrCuValid(null);
      } else {
        setCorrCuValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    if (field === 'correctiveAdditionSn') {
      if (value.trim() === '') {
        setCorrSnValid(null);
      } else {
        setCorrSnValid(!isNaN(value) && parseFloat(value) >= 0);
      }
    }
    
    // Validate Remarks
    if (field === 'remarks') {
      if (value.trim() === '') {
        setRemarksValid(null);
      } else {
        setRemarksValid(value.trim().length > 0);
      }
    }
    
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <Loader />;
  }

  if (!currentEntries || currentEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="process-entries-header">
        <div className="process-entries-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Report
          </h2>
        </div>
        <button className="process-entries-back-btn" onClick={() => navigate('/process/report')}>
          <ArrowLeft size={18} />
          Back to Cards
        </button>
      </div>

      <div className="process-entries-info">
        <div className="process-entries-info-item">
          <span className="process-entries-info-label">Date:</span>
          <span className="process-entries-info-value">{formatDate(date)}</span>
        </div>
        <div className="process-entries-info-item">
          <span className="process-entries-info-label">DISA:</span>
          <span className="process-entries-info-value">{disa || '-'}</span>
        </div>
      </div>

      <Table
        columns={[
          { key: 'partName', label: 'Part Name', width: '4%' },
          { key: 'datecode', label: 'Date Code', width: '3%' },
          { key: 'heatcode', label: 'Heat Code', width: '3%' },
          { key: 'quantityOfMoulds', label: 'Qty. Of Moulds', width: '3%' },
          { key: 'metalCompositionC', label: 'C', width: '2%' },
          { key: 'metalCompositionSi', label: 'Si', width: '2%' },
          { key: 'metalCompositionMn', label: 'Mn', width: '2%' },
          { key: 'metalCompositionP', label: 'P', width: '2%' },
          { key: 'metalCompositionS', label: 'S', width: '2%' },
          { key: 'metalCompositionMgFL', label: 'Mg FL', width: '2%' },
          { key: 'metalCompositionCu', label: 'Cu', width: '2%' },
          { key: 'metalCompositionCr', label: 'Cr', width: '2%' },
          { key: 'timeOfPouring', label: 'Time Of Pouring', width: '4%' },
          { key: 'pouringTemperature', label: 'Pouring Temp', width: '3%' },
          { key: 'ppCode', label: 'PP Code', width: '3%' },
          { key: 'treatmentNo', label: 'Treatment No', width: '3%' },
          { key: 'fcNo', label: 'FC No', width: '2%' },
          { key: 'heatNo', label: 'Heat No', width: '3%' },
          { key: 'conNo', label: 'Con No', width: '2%' },
          { key: 'tappingTime', label: 'Tapping Time', width: '3%' },
          { key: 'correctiveAdditionC', label: 'Corr. Add C', width: '3%' },
          { key: 'correctiveAdditionSi', label: 'Corr. Add Si', width: '3%' },
          { key: 'correctiveAdditionMn', label: 'Corr. Add Mn', width: '3%' },
          { key: 'correctiveAdditionS', label: 'Corr. Add S', width: '3%' },
          { key: 'correctiveAdditionCr', label: 'Corr. Add Cr', width: '3%' },
          { key: 'correctiveAdditionCu', label: 'Corr. Add Cu', width: '3%' },
          { key: 'correctiveAdditionSn', label: 'Corr. Add Sn', width: '3%' },
          { key: 'tappingWt', label: 'Tapping Wt', width: '3%' },
          { key: 'mg', label: 'Mg', width: '2%' },
          { key: 'resMgConvertor', label: 'Res Mg Convertor', width: '4%' },
          { key: 'recOfMg', label: 'Rec Of Mg', width: '3%' },
          { key: 'streamInoculant', label: 'Stream Inoculant', width: '4%' },
          { key: 'pTime', label: 'P Time', width: '2%' },
          { key: 'remarks', label: 'Remarks', width: '4%' }
        ]}
        data={currentEntries}
        minWidth={3500}
        renderActions={(item) => (
          <>
            <EditButton onClick={() => handleEdit(item)} />
            <DeleteButton onClick={() => handleDelete(item)} />
          </>
        )}
        noDataMessage="No process entries found"
      />

      {/* Edit Modal */}
      <EditCard
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        departmentName="Process"
        onSave={handleSaveEdit}
      >
        <div className="process-edit-form">
          <div className="process-edit-row">
            <div className="process-edit-field">
              <label>Part Name</label>
              <input
                type="text"
                value={editFormData.partName || ''}
                onChange={(e) => handleInputChange('partName', e.target.value)}
                className={
                  partNameValid === null
                    ? ""
                    : partNameValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field">
              <label>Date Code</label>
              <input
                type="text"
                value={editFormData.datecode || ''}
                onChange={(e) => handleInputChange('datecode', e.target.value)}
                className={
                  datecodeValid === null
                    ? ""
                    : datecodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field">
              <label>Heat Code</label>
              <input
                type="text"
                value={editFormData.heatcode || ''}
                onChange={(e) => handleInputChange('heatcode', e.target.value)}
                className={
                  heatcodeValid === null
                    ? ""
                    : heatcodeValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="process-edit-row">
            <div className="process-edit-field">
              <label>Qty. Of Moulds</label>
              <input
                type="number"
                value={editFormData.quantityOfMoulds || ''}
                onChange={(e) => handleInputChange('quantityOfMoulds', e.target.value)}
                className={
                  quantityOfMouldsValid === null
                    ? ""
                    : quantityOfMouldsValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field">
              <label>Time Of Pouring</label>
              <input
                type="text"
                value={editFormData.timeOfPouring || ''}
                onChange={(e) => handleInputChange('timeOfPouring', e.target.value)}
                className={
                  timeOfPouringValid === null
                    ? ""
                    : timeOfPouringValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
            <div className="process-edit-field">
              <label>Pouring Temp</label>
              <input
                type="text"
                value={editFormData.pouringTemperature || ''}
                onChange={(e) => handleInputChange('pouringTemperature', e.target.value)}
                className={
                  pouringTempValid === null
                    ? ""
                    : pouringTempValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>

          <div className="process-edit-section">
            <h4>Metal Composition</h4>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>C</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionC || ''}
                  onChange={(e) => handleInputChange('metalCompositionC', e.target.value)}
                  className={
                    metalCValid === null
                      ? ""
                      : metalCValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Si</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionSi || ''}
                  onChange={(e) => handleInputChange('metalCompositionSi', e.target.value)}
                  className={
                    metalSiValid === null
                      ? ""
                      : metalSiValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mn</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionMn || ''}
                  onChange={(e) => handleInputChange('metalCompositionMn', e.target.value)}
                  className={
                    metalMnValid === null
                      ? ""
                      : metalMnValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>P</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionP || ''}
                  onChange={(e) => handleInputChange('metalCompositionP', e.target.value)}
                  className={
                    metalPValid === null
                      ? ""
                      : metalPValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>S</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionS || ''}
                  onChange={(e) => handleInputChange('metalCompositionS', e.target.value)}
                  className={
                    metalSValid === null
                      ? ""
                      : metalSValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mg FL</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionMgFL || ''}
                  onChange={(e) => handleInputChange('metalCompositionMgFL', e.target.value)}
                  className={
                    metalMgFLValid === null
                      ? ""
                      : metalMgFLValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Cu</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionCu || ''}
                  onChange={(e) => handleInputChange('metalCompositionCu', e.target.value)}
                  className={
                    metalCuValid === null
                      ? ""
                      : metalCuValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Cr</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionCr || ''}
                  onChange={(e) => handleInputChange('metalCompositionCr', e.target.value)}
                  className={
                    metalCrValid === null
                      ? ""
                      : metalCrValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
          </div>

          <div className="process-edit-section">
            <h4>Corrective Addition</h4>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>C</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionC || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionC', e.target.value)}
                  className={
                    corrCValid === null
                      ? ""
                      : corrCValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Si</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionSi || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionSi', e.target.value)}
                  className={
                    corrSiValid === null
                      ? ""
                      : corrSiValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Mn</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionMn || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionMn', e.target.value)}
                  className={
                    corrMnValid === null
                      ? ""
                      : corrMnValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>S</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionS || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionS', e.target.value)}
                  className={
                    corrSValid === null
                      ? ""
                      : corrSValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
            <div className="process-edit-row">
              <div className="process-edit-field">
                <label>Cr</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionCr || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionCr', e.target.value)}
                  className={
                    corrCrValid === null
                      ? ""
                      : corrCrValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Cu</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionCu || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionCu', e.target.value)}
                  className={
                    corrCuValid === null
                      ? ""
                      : corrCuValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
              <div className="process-edit-field">
                <label>Sn</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionSn || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionSn', e.target.value)}
                  className={
                    corrSnValid === null
                      ? ""
                      : corrSnValid
                      ? "valid-input"
                      : "invalid-input"
                  }
                />
              </div>
            </div>
          </div>

          <div className="process-edit-row">
            <div className="process-edit-field">
              <label>Remarks</label>
              <textarea
                value={editFormData.remarks || ''}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows="3"
                className={
                  remarksValid === null
                    ? ""
                    : remarksValid
                    ? "valid-input"
                    : "invalid-input"
                }
              />
            </div>
          </div>
        </div>
      </EditCard>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmCard
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        departmentName="Process"
        loading={deleteLoading}
      />
    </>
  );
};

export default ProcessReportEntries;
