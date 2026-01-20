import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpenCheck, ArrowLeft, Edit } from 'lucide-react';
import Loader from '../../Components/Loader';
import { EditCard } from '../../Components/PopUp';
import '../../styles/PageStyles/Process/ProcessReportEntries.css';

const ProcessReportEntries = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { date, entries } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (!date || !entries) {
      navigate('/process/report');
    }
  }, [date, entries, navigate]);

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

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <Loader />;
  }

  if (!entries) {
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
          <span className="process-entries-info-value">
            {entries.map(e => e.disa || '-').filter((v, i, a) => a.indexOf(v) === i).join(', ')}
          </span>
        </div>
      </div>

      <div className="process-entries-table-container">
        <table className="process-entries-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Date Code</th>
              <th>Heat Code</th>
              <th>Qty. Of Moulds</th>
              <th>C</th>
              <th>Si</th>
              <th>Mn</th>
              <th>P</th>
              <th>S</th>
              <th>Mg FL</th>
              <th>Cu</th>
              <th>Cr</th>
              <th>Time Of Pouring</th>
              <th>Pouring Temp</th>
              <th>PP Code</th>
              <th>Treatment No</th>
              <th>FC No</th>
              <th>Heat No</th>
              <th>Con No</th>
              <th>Tapping Time</th>
              <th>Corr. Add C</th>
              <th>Corr. Add Si</th>
              <th>Corr. Add Mn</th>
              <th>Corr. Add S</th>
              <th>Corr. Add Cr</th>
              <th>Corr. Add Cu</th>
              <th>Corr. Add Sn</th>
              <th>Tapping Wt</th>
              <th>Mg</th>
              <th>Res Mg Convertor</th>
              <th>Rec Of Mg</th>
              <th>Stream Inoculant</th>
              <th>P Time</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((item, index) => (
              <tr key={item._id || index}>
                <td>{item.partName || '-'}</td>
                <td>{item.datecode || '-'}</td>
                <td>{item.heatcode || '-'}</td>
                <td>{item.quantityOfMoulds !== undefined && item.quantityOfMoulds !== null ? item.quantityOfMoulds : '-'}</td>
                <td>{item.metalCompositionC || '-'}</td>
                <td>{item.metalCompositionSi || '-'}</td>
                <td>{item.metalCompositionMn || '-'}</td>
                <td>{item.metalCompositionP || '-'}</td>
                <td>{item.metalCompositionS || '-'}</td>
                <td>{item.metalCompositionMgFL || '-'}</td>
                <td>{item.metalCompositionCu || '-'}</td>
                <td>{item.metalCompositionCr || '-'}</td>
                <td>{item.timeOfPouring || '-'}</td>
                <td>{item.pouringTemperature || '-'}</td>
                <td>{item.ppCode || '-'}</td>
                <td>{item.treatmentNo || '-'}</td>
                <td>{item.fcNo || '-'}</td>
                <td>{item.heatNo || '-'}</td>
                <td>{item.conNo || '-'}</td>
                <td>{item.tappingTime || '-'}</td>
                <td>{item.correctiveAdditionC || '-'}</td>
                <td>{item.correctiveAdditionSi || '-'}</td>
                <td>{item.correctiveAdditionMn || '-'}</td>
                <td>{item.correctiveAdditionS || '-'}</td>
                <td>{item.correctiveAdditionCr || '-'}</td>
                <td>{item.correctiveAdditionCu || '-'}</td>
                <td>{item.correctiveAdditionSn || '-'}</td>
                <td>{item.tappingWt || '-'}</td>
                <td>{item.mg || '-'}</td>
                <td>{item.resMgConvertor || '-'}</td>
                <td>{item.recOfMg || '-'}</td>
                <td>{item.streamInoculant || '-'}</td>
                <td>{item.pTime || '-'}</td>
                <td>{item.remarks || '-'}</td>
                <td>
                  <button 
                    className="process-entries-action-btn"
                    onClick={() => handleEdit(item)}
                    title="Edit Entry"
                  >
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              />
            </div>
            <div className="process-edit-field">
              <label>Date Code</label>
              <input
                type="text"
                value={editFormData.datecode || ''}
                onChange={(e) => handleInputChange('datecode', e.target.value)}
              />
            </div>
            <div className="process-edit-field">
              <label>Heat Code</label>
              <input
                type="text"
                value={editFormData.heatcode || ''}
                onChange={(e) => handleInputChange('heatcode', e.target.value)}
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
              />
            </div>
            <div className="process-edit-field">
              <label>Time Of Pouring</label>
              <input
                type="text"
                value={editFormData.timeOfPouring || ''}
                onChange={(e) => handleInputChange('timeOfPouring', e.target.value)}
              />
            </div>
            <div className="process-edit-field">
              <label>Pouring Temp</label>
              <input
                type="text"
                value={editFormData.pouringTemperature || ''}
                onChange={(e) => handleInputChange('pouringTemperature', e.target.value)}
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
                />
              </div>
              <div className="process-edit-field">
                <label>Si</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionSi || ''}
                  onChange={(e) => handleInputChange('metalCompositionSi', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>Mn</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionMn || ''}
                  onChange={(e) => handleInputChange('metalCompositionMn', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>P</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionP || ''}
                  onChange={(e) => handleInputChange('metalCompositionP', e.target.value)}
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
                />
              </div>
              <div className="process-edit-field">
                <label>Mg FL</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionMgFL || ''}
                  onChange={(e) => handleInputChange('metalCompositionMgFL', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>Cu</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionCu || ''}
                  onChange={(e) => handleInputChange('metalCompositionCu', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>Cr</label>
                <input
                  type="text"
                  value={editFormData.metalCompositionCr || ''}
                  onChange={(e) => handleInputChange('metalCompositionCr', e.target.value)}
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
                />
              </div>
              <div className="process-edit-field">
                <label>Si</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionSi || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionSi', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>Mn</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionMn || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionMn', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>S</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionS || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionS', e.target.value)}
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
                />
              </div>
              <div className="process-edit-field">
                <label>Cu</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionCu || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionCu', e.target.value)}
                />
              </div>
              <div className="process-edit-field">
                <label>Sn</label>
                <input
                  type="text"
                  value={editFormData.correctiveAdditionSn || ''}
                  onChange={(e) => handleInputChange('correctiveAdditionSn', e.target.value)}
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
              />
            </div>
          </div>
        </div>
      </EditCard>
    </>
  );
};

export default ProcessReportEntries;
