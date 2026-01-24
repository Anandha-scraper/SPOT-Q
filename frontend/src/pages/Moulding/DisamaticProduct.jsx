import React, { useState } from "react";
import { Save, Plus, X, RefreshCw } from "lucide-react";
import "../../styles/PageStyles/Moulding/DisamaticProduct.css";

// Get today's date in YYYY-MM-DD format
const getTodaysDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const initialFormData = {
  date: getTodaysDate(),
  shift: "",
  incharge: "",
  ppOperator: "",
  members: [""],
  productionTable: [{ counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }],
  nextShiftPlanTable: [{ componentName: "", plannedMoulds: "", remarks: "" }],
  delaysTable: [{ delays: "", durationMinutes: "", durationTime: "" }],
  mouldHardnessTable: [{ componentName: "", mpPP: "", mpSP: "", bsPP: "", bsSP: "", remarks: "" }],
  patternTempTable: [{ item: "", pp: "", sp: "" }],
  significantEvent: "",
  maintenance: "",
  supervisorName: "",
};

const DisamaticProduct = () => {
  const [formData, setFormData] = useState(initialFormData);

  // Handle basic field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Members management
  const handleMemberChange = (index, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMemberField = () => {
    setFormData(prev => ({ ...prev, members: [...prev.members, ""] }));
  };

  const removeMemberField = (index) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  // Production Table
  const addProductionRow = () => {
    setFormData(prev => ({
      ...prev,
      productionTable: [...prev.productionTable, { counterNo: "", componentName: "", produced: "", poured: "", cycleTime: "", mouldsPerHour: "", remarks: "" }]
    }));
  };

  const deleteProductionRow = (index) => {
    setFormData(prev => ({
      ...prev,
      productionTable: prev.productionTable.filter((_, i) => i !== index)
    }));
  };

  const handleProductionChange = (index, field, value) => {
    const newTable = [...formData.productionTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, productionTable: newTable }));
  };

  // Next Shift Plan Table
  const addNextShiftPlanRow = () => {
    setFormData(prev => ({
      ...prev,
      nextShiftPlanTable: [...prev.nextShiftPlanTable, { componentName: "", plannedMoulds: "", remarks: "" }]
    }));
  };

  const deleteNextShiftPlanRow = (index) => {
    setFormData(prev => ({
      ...prev,
      nextShiftPlanTable: prev.nextShiftPlanTable.filter((_, i) => i !== index)
    }));
  };

  const handleNextShiftPlanChange = (index, field, value) => {
    const newTable = [...formData.nextShiftPlanTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, nextShiftPlanTable: newTable }));
  };

  // Delays Table
  const addDelaysRow = () => {
    setFormData(prev => ({
      ...prev,
      delaysTable: [...prev.delaysTable, { delays: "", durationMinutes: "", durationTime: "" }]
    }));
  };

  const deleteDelaysRow = (index) => {
    setFormData(prev => ({
      ...prev,
      delaysTable: prev.delaysTable.filter((_, i) => i !== index)
    }));
  };

  const handleDelaysChange = (index, field, value) => {
    const newTable = [...formData.delaysTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, delaysTable: newTable }));
  };

  // Mould Hardness Table
  const addMouldHardnessRow = () => {
    setFormData(prev => ({
      ...prev,
      mouldHardnessTable: [...prev.mouldHardnessTable, { componentName: "", mpPP: "", mpSP: "", bsPP: "", bsSP: "", remarks: "" }]
    }));
  };

  const deleteMouldHardnessRow = (index) => {
    setFormData(prev => ({
      ...prev,
      mouldHardnessTable: prev.mouldHardnessTable.filter((_, i) => i !== index)
    }));
  };

  const handleMouldHardnessChange = (index, field, value) => {
    const newTable = [...formData.mouldHardnessTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, mouldHardnessTable: newTable }));
  };

  // Pattern Temp Table
  const addPatternTempRow = () => {
    setFormData(prev => ({
      ...prev,
      patternTempTable: [...prev.patternTempTable, { item: "", pp: "", sp: "" }]
    }));
  };

  const deletePatternTempRow = (index) => {
    setFormData(prev => ({
      ...prev,
      patternTempTable: prev.patternTempTable.filter((_, i) => i !== index)
    }));
  };

  const handlePatternTempChange = (index, field, value) => {
    const newTable = [...formData.patternTempTable];
    newTable[index][field] = value;
    setFormData(prev => ({ ...prev, patternTempTable: newTable }));
  };

  // Reset Form
  const resetForm = () => {
    setFormData(initialFormData);
  };

  // Submit Handler (placeholder)
  const handleSubmit = () => {
    console.log("Form Data:", formData);
    alert("Form submitted! Check console for data.");
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="disamatic-header">
        <div className="disamatic-header-text">
          <h2>
            <Save size={28} style={{ color: '#5B9AA9' }} />
            Disamatic Product - Entry Form
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          DATE : {formData.date ? (() => {
            const [y, m, d] = formData.date.split('-');
            return `${d} / ${m} / ${y}`;
          })() : '-'}
        </div>
      </div>

      {/* Primary Section */}
      <div className="disamatic-section primary-section">
        <div className="primary-header-container">
          <h3 className="primary-section-title">PRIMARY</h3>
        </div>
        
        {/* First Row: Shift, Incharge, PP Operator */}
        <div className="primary-fields-row">
          <div className="disamatic-form-group">
            <label>Shift <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              value={formData.shift}
              onChange={e => handleChange("shift", e.target.value)}
            >
              <option value="">Select Shift</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
            </select>
          </div>
          <div className="disamatic-form-group">
            <label>Incharge <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              value={formData.incharge} 
              onChange={e => handleChange("incharge", e.target.value)}
              placeholder="Enter incharge name"
            />
          </div>
          <div className="disamatic-form-group">
            <label>PP Operator <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              value={formData.ppOperator} 
              onChange={e => handleChange("ppOperator", e.target.value)}
              placeholder="Enter PP Operator name"
            />
          </div>
        </div>
        
        {/* Second Row: Members Present */}
        <div className="primary-fields-row" style={{ marginTop: '1rem' }}>
          <div className="disamatic-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Members Present <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="disamatic-members-container">
              {formData.members.map((member, index) => (
                <div key={index} className="disamatic-member-input-wrapper">
                  <input
                    type="text"
                    value={member}
                    onChange={e => handleMemberChange(index, e.target.value)}
                    placeholder={`Enter member name ${index + 1}`}
                    className="disamatic-member-input"
                  />
                  {formData.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMemberField(index)}
                      className="disamatic-remove-member-btn"
                      title="Remove member"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMemberField}
                className="disamatic-add-member-btn"
                title="Add another member"
              >
                <Plus size={16} />
                Add Member
              </button>
            </div>
          </div>
        </div>
        
        {/* Primary Submit Container */}
        <div className="disamatic-submit-container" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="disamatic-submit-btn" type="button" onClick={handleSubmit}>
            <Save size={18} />
            Save Primary
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}></div>

      {/* Production Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Production Table</h3>
          <div className="disamatic-section-actions">
            <button type="button" onClick={addProductionRow} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
            {formData.productionTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteProductionRow(formData.productionTable.length - 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Counter No.</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Component Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Produced (Nos)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Poured (Nos)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Cycle Time</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Moulds/Hour</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.productionTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.counterNo}
                      onChange={e => handleProductionChange(index, 'counterNo', e.target.value)}
                      placeholder="Counter No"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.componentName}
                      onChange={e => handleProductionChange(index, 'componentName', e.target.value)}
                      placeholder="Component Name"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.produced}
                      onChange={e => handleProductionChange(index, 'produced', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.poured}
                      onChange={e => handleProductionChange(index, 'poured', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.cycleTime}
                      onChange={e => handleProductionChange(index, 'cycleTime', e.target.value)}
                      placeholder="00:00"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.mouldsPerHour}
                      onChange={e => handleProductionChange(index, 'mouldsPerHour', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleProductionChange(index, 'remarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Shift Plan Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Next Shift Plan</h3>
          <div className="disamatic-section-actions">
            <button type="button" onClick={addNextShiftPlanRow} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
            {formData.nextShiftPlanTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteNextShiftPlanRow(formData.nextShiftPlanTable.length - 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Component Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Planned Moulds</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.nextShiftPlanTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.componentName}
                      onChange={e => handleNextShiftPlanChange(index, 'componentName', e.target.value)}
                      placeholder="Component Name"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.plannedMoulds}
                      onChange={e => handleNextShiftPlanChange(index, 'plannedMoulds', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleNextShiftPlanChange(index, 'remarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delays Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Delays</h3>
          <div className="disamatic-section-actions">
            <button type="button" onClick={addDelaysRow} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
            {formData.delaysTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteDelaysRow(formData.delaysTable.length - 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Delays</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Duration (Minutes)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Duration (Time)</th>
              </tr>
            </thead>
            <tbody>
              {formData.delaysTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.delays}
                      onChange={e => handleDelaysChange(index, 'delays', e.target.value)}
                      placeholder="Delay reason"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.durationMinutes}
                      onChange={e => handleDelaysChange(index, 'durationMinutes', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.durationTime}
                      onChange={e => handleDelaysChange(index, 'durationTime', e.target.value)}
                      placeholder="00:00"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mould Hardness Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Mould Hardness</h3>
          <div className="disamatic-section-actions">
            <button type="button" onClick={addMouldHardnessRow} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
            {formData.mouldHardnessTable.length > 1 && (
              <button
                type="button"
                onClick={() => deleteMouldHardnessRow(formData.mouldHardnessTable.length - 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Component Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>MP (PP)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>MP (SP)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>BS (PP)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>BS (SP)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.mouldHardnessTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.componentName}
                      onChange={e => handleMouldHardnessChange(index, 'componentName', e.target.value)}
                      placeholder="Component Name"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.mpPP}
                      onChange={e => handleMouldHardnessChange(index, 'mpPP', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.mpSP}
                      onChange={e => handleMouldHardnessChange(index, 'mpSP', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.bsPP}
                      onChange={e => handleMouldHardnessChange(index, 'bsPP', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.bsSP}
                      onChange={e => handleMouldHardnessChange(index, 'bsSP', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleMouldHardnessChange(index, 'remarks', e.target.value)}
                      placeholder="Remarks"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern Temp Table */}
      <div className="disamatic-section">
        <div className="disamatic-section-header">
          <h3 className="disamatic-section-title">Pattern Temperature</h3>
          <div className="disamatic-section-actions">
            <button type="button" onClick={addPatternTempRow} className="disamatic-add-row-btn">
              <Plus size={18} />
            </button>
            {formData.patternTempTable.length > 1 && (
              <button
                type="button"
                onClick={() => deletePatternTempRow(formData.patternTempTable.length - 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>PP</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600 }}>SP</th>
              </tr>
            </thead>
            <tbody>
              {formData.patternTempTable.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={row.item}
                      onChange={e => handlePatternTempChange(index, 'item', e.target.value)}
                      placeholder="Item"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.pp}
                      onChange={e => handlePatternTempChange(index, 'pp', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <input
                      type="number"
                      value={row.sp}
                      onChange={e => handlePatternTempChange(index, 'sp', e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Section */}
      <div className="disamatic-section">
        <h3 className="disamatic-section-title">Significant Events & Maintenance</h3>
        
        <div className="disamatic-form-grid" style={{ marginTop: '1rem' }}>
          <div className="disamatic-form-group full-width">
            <label>Significant Event :</label>
            <textarea
              value={formData.significantEvent}
              onChange={e => handleChange("significantEvent", e.target.value)}
              placeholder="Enter any significant events"
              className="disamatic-textarea"
              rows={3}
            />
          </div>
          
          <div className="disamatic-form-group full-width">
            <label>Maintenance :</label>
            <textarea
              value={formData.maintenance}
              onChange={e => handleChange("maintenance", e.target.value)}
              placeholder="Enter maintenance details"
              className="disamatic-textarea"
              rows={3}
            />
          </div>
          
          <div className="disamatic-form-group">
            <label>Supervisor Name :</label>
            <input
              type="text"
              value={formData.supervisorName}
              onChange={e => handleChange("supervisorName", e.target.value)}
              placeholder="Enter supervisor name"
            />
          </div>
        </div>
      </div>

      {/* Submit All Button */}
      <div className="disamatic-submit-container">
        <button className="disamatic-reset-btn" type="button" onClick={resetForm}>
          <RefreshCw size={18} />
          Reset Form
        </button>
        <button className="disamatic-submit-btn" type="button" onClick={handleSubmit}>
          <Save size={18} />
          Submit All
        </button>
      </div>
    </div>
  );
};

export default DisamaticProduct;
