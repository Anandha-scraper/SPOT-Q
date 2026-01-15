import React, { useState, useEffect, useRef } from 'react';
import { BookOpenCheck, Trash2, Edit, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { DatePicker, FilterButton } from '../../Components/Buttons';
import Loader from '../../Components/Loader';
import '../../styles/PageStyles/Moulding/DisamaticProductReport.css';

const DisamaticProductReport = () => {
  // Format a date to YYYY-MM-DD using local timezone (avoids UTC shift)
  const formatInputDateLocal = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState('All');
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [updating, setUpdating] = useState(false);
  // Row-level edit state
  const [rowEdit, setRowEdit] = useState(null); // { section: 'productionDetails', index: 0 }
  const [rowEditData, setRowEditData] = useState(null);
  // Sections are only shown after user applies the filter. Keep them hidden initially.
  const [showSections, setShowSections] = useState({
    productionDetails: false,
    nextShiftPlan: false,
    delays: false,
    mouldHardness: false,
    patternTemperature: false
  });
  // Temporary selection state used inside the dropdown. Changes here are only committed when 'Apply Filter' is pressed.
  const [tempSections, setTempSections] = useState({
    productionDetails: false,
    nextShiftPlan: false,
    delays: false,
    mouldHardness: false,
    patternTemperature: false
  });
  const [collapsedSections, setCollapsedSections] = useState({
    productionDetails: false,
    nextShiftPlan: false,
    delays: false,
    mouldHardness: false,
    patternTemperature: false
  });
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Remarks' });

  const toggleSection = (section) => {
    setShowSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTempSection = (section) => {
    setTempSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCollapse = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const showRemarksPopup = (content, title = 'Remarks') => {
    setRemarksModal({ show: true, content, title });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Remarks' });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Close the section dropdown when clicking outside
  const sectionDropdownRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (showSectionDropdown && sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target)) {
        setShowSectionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSectionDropdown]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.get('/v1/dismatic-reports');
      if (data.success && data.data && data.data.length > 0) {
        setReports(data.data || []);
        
        // Get the latest/last entered date
        const sortedReports = [...data.data].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestDate = sortedReports[0].date;

        setSelectedDate(latestDate ? formatInputDateLocal(latestDate) : null);
        filterReportByDateAndShift(latestDate ? formatInputDateLocal(latestDate) : null, 'All', data.data);
      }
    } catch (err) {
      console.error('Failed to fetch disamatic reports', err);
    } finally {
      setLoading(false);
    }
  };

  const filterReportByDateAndShift = (date, shift, reportsData = reports) => {
    if (!date) {
      setCurrentReport(null);
      return;
    }
    
    const report = reportsData.find(r => {
      if (!r.date) return false;
      const reportDate = formatInputDateLocal(r.date);
      const dateMatch = reportDate === date;
      
      // If specific shift is selected, check if it matches
      if (shift !== 'All') {
        return dateMatch && r.shift === shift;
      }
      return dateMatch;
    });

    setCurrentReport(report || null);
  };

  const handleFilter = () => {
    if (!selectedDate) {
      return;
    }
    filterReportByDateAndShift(selectedDate, selectedShift);
  };

  // Auto-apply filter when date or shift changes
  useEffect(() => {
    handleFilter();
  }, [selectedDate, selectedShift]);

  // Apply section selections immediately
  const handleSectionToggle = (section) => {
    setShowSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this entire report and all its data?')) return;
    try {
      const res = await api.delete(`/v1/dismatic-reports/${id}`);
      if (res.success) {
        alert('Report deleted successfully');
        fetchReports();
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete report: ' + (err.message || 'Unknown error'));
    }
  };

  // Filter section data by shift
  const filterDataByShift = (dataArray) => {
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) return [];
    if (selectedShift === 'All') return dataArray;
    
    // Since shift is stored at report level, all data belongs to that shift
    return dataArray;
  };

  const handleEditClick = (report) => {
    setEditingReport(report);
    setEditFormData({
      date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
      shift: report.shift || '',
      incharge: report.incharge || '',
      ppOperator: report.ppOperator || '',
      memberspresent: report.memberspresent || '',
      productionDetails: report.productionDetails || [],
      nextShiftPlan: report.nextShiftPlan || [],
      delays: report.delays || [],
      mouldHardness: report.mouldHardness || [],
      patternTemperature: report.patternTemperature || [],
      significantEvent: report.significantEvent || '',
      maintenance: report.maintenance || '',
      supervisorName: report.supervisorName || ''
    });
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTableChange = (tableName, index, field, value) => {
    setEditFormData(prev => {
      const updatedTable = [...prev[tableName]];
      updatedTable[index] = { ...updatedTable[index], [field]: value };
      return { ...prev, [tableName]: updatedTable };
    });
  };

  const handleUpdateReport = async () => {
    try {
      setUpdating(true);
      const payload = {
        ...editFormData,
        section: 'all'
      };
      
      const res = await api.put(`/v1/dismatic-reports/${editingReport._id}`, payload);
      if (res.success) {
        alert('Report updated successfully!');
        setEditingReport(null);
        setEditFormData(null);
        fetchReports();
      }
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update report: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  // Row-level edit handler - opens edit modal with specific row pre-selected
  const handleEditRow = (sectionName, rowIndex) => {
    if (!currentReport) return;
    // Initialize row-level editing instead of full form edit
    const sourceArray = currentReport[sectionName] || [];
    if (!Array.isArray(sourceArray) || !sourceArray[rowIndex]) return;
    setRowEdit({ section: sectionName, index: rowIndex });
    // Clone row data to avoid mutating original until save
    setRowEditData({ ...sourceArray[rowIndex] });
  };

  // Row-level delete handler
  const handleDeleteRow = async (sectionName, rowIndex) => {
    if (!currentReport) return;
    
    const sectionLabels = {
      productionDetails: 'Production Details',
      nextShiftPlan: 'Next Shift Plan',
      delays: 'Delays',
      mouldHardness: 'Mould Hardness',
      patternTemperature: 'Pattern Temperature'
    };
    
    if (!window.confirm(`Delete this ${sectionLabels[sectionName]} entry?`)) return;
    
    try {
      setLoading(true);
      // Create a copy of the report data
      const updatedData = { ...currentReport };
      
      // Remove the specific row
      if (updatedData[sectionName] && Array.isArray(updatedData[sectionName])) {
        updatedData[sectionName] = updatedData[sectionName].filter((_, idx) => idx !== rowIndex);
        
        // Recalculate totals if needed
        if (sectionName === 'productionDetails' && updatedData.productionDetails.length > 0) {
          const totals = updatedData.productionDetails.reduce((acc, item) => ({
            produced: acc.produced + (item.produced || 0),
            poured: acc.poured + (item.poured || 0)
          }), { produced: 0, poured: 0 });
          updatedData.productionTotals = { ...updatedData.productionTotals, ...totals };
        }
        
        if (sectionName === 'delays' && updatedData.delays.length > 0) {
          const totalMinutes = updatedData.delays.reduce((acc, item) => acc + (item.durationMinutes || 0), 0);
          updatedData.delaysTotals = { durationMinutes: totalMinutes };
        }
      }
      
      // Update the report
      const res = await api.put(`/v1/dismatic-reports/${currentReport._id}`, {
        ...updatedData,
        section: 'all'
      });
      
      if (res.success) {
        alert('Row deleted successfully!');
        fetchReports();
      }
    } catch (err) {
      console.error('Delete row failed', err);
      alert('Failed to delete row: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // ===== Row-Level Editing Helpers =====
  const sectionFieldConfig = {
    productionDetails: [
      { key: 'counterNo', label: 'Counter No', type: 'text' },
      { key: 'componentName', label: 'Component Name', type: 'text' },
      { key: 'produced', label: 'Produced', type: 'number' },
      { key: 'poured', label: 'Poured', type: 'number' },
      { key: 'cycleTime', label: 'Cycle Time', type: 'text' },
      { key: 'mouldsPerHour', label: 'Moulds/Hour', type: 'number' },
      { key: 'remarks', label: 'Remarks', type: 'text' }
    ],
    nextShiftPlan: [
      { key: 'componentName', label: 'Component Name', type: 'text' },
      { key: 'plannedMoulds', label: 'Planned Moulds', type: 'number' },
      { key: 'remarks', label: 'Remarks', type: 'text' }
    ],
    delays: [
      { key: 'delays', label: 'Delays', type: 'text' },
      { key: 'durationMinutes', label: 'Duration (Minutes)', type: 'number' },
      { key: 'durationTime', label: 'Duration (Time)', type: 'text' }
    ],
    mouldHardness: [
      { key: 'componentName', label: 'Component Name', type: 'text' },
      { key: 'mpPP', label: 'MP-PP', type: 'text' },
      { key: 'mpSP', label: 'MP-SP', type: 'text' },
      { key: 'bsPP', label: 'BS-PP', type: 'text' },
      { key: 'bsSP', label: 'BS-SP', type: 'text' },
      { key: 'remarks', label: 'Remarks', type: 'text' }
    ],
    patternTemperature: [
      { key: 'item', label: 'Item', type: 'text' },
      { key: 'pp', label: 'PP', type: 'number' },
      { key: 'sp', label: 'SP', type: 'number' }
    ]
  };

  const handleRowEditChange = (field, value) => {
    setRowEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRowEdit = async () => {
    if (!rowEdit || !rowEditData || !currentReport) return;
    try {
      setUpdating(true);
      const { section, index } = rowEdit;
      const updatedArray = [...(currentReport[section] || [])];
      if (!updatedArray[index]) return;
      // Preserve sNo if exists
      const existingSNo = updatedArray[index].sNo;
      updatedArray[index] = { ...rowEditData };
      if (existingSNo !== undefined) {
        updatedArray[index].sNo = existingSNo;
      }

      // Recalculate totals if productionDetails or delays
      const updatePayload = { [section]: updatedArray };
      if (section === 'productionDetails') {
        const totals = updatedArray.reduce((acc, item) => ({
          produced: acc.produced + (parseFloat(item.produced) || 0),
          poured: acc.poured + (parseFloat(item.poured) || 0)
        }), { produced: 0, poured: 0 });
        updatePayload.productionTotals = {
          ...(currentReport.productionTotals || {}),
          produced: totals.produced,
          poured: totals.poured
        };
      }
      if (section === 'delays') {
        const minutes = updatedArray.reduce((acc, item) => acc + (parseFloat(item.durationMinutes) || 0), 0);
        updatePayload.delaysTotals = { durationMinutes: minutes };
      }

      const res = await api.put(`/v1/dismatic-reports/${currentReport._id}`, updatePayload);
      if (res.success) {
        alert('Row updated successfully!');
        // Refresh reports & clear row edit state
        await fetchReports();
        setRowEdit(null);
        setRowEditData(null);
      } else {
        alert(res.message || 'Update failed');
      }
    } catch (err) {
      console.error('Row update failed', err);
      alert('Failed to update row: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelRowEdit = () => {
    setRowEdit(null);
    setRowEditData(null);
  };

  return (
    <div className="page-wrapper" style={{ padding: '1.5rem', maxWidth: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          <BookOpenCheck size={32} style={{ color: '#5B9AA9' }} />
          Disamatic Product - Report
        </h2>
      </div>

      {/* Filter Section */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        border: '1px solid #e2e8f0',
        borderRadius: '8px', 
        marginBottom: '2rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', color: '#475569' }}>Select Date</label>
            <DatePicker 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              placeholder="Select date" 
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', color: '#475569' }}>Select Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#5B9AA9'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            >
              <option value="All">All Shifts</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
            </select>
          </div>
          <div style={{ position: 'relative' }} ref={sectionDropdownRef}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', color: '#475569' }}>Show Sections</label>
            <button
              onClick={() => setShowSectionDropdown(prev => !prev)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5B9AA9'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <span style={{ color: '#475569' }}>{Object.values(showSections).filter(v => v).length} sections selected</span>
              <span style={{ color: '#64748b' }}>{showSectionDropdown ? '▲' : '▼'}</span>
            </button>
            
            {showSectionDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                zIndex: 1000,
                padding: '0.5rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {[
                  { key: 'productionDetails', label: 'Production Details' },
                  { key: 'nextShiftPlan', label: 'Next Shift Plan' },
                  { key: 'delays', label: 'Delays' },
                  { key: 'mouldHardness', label: 'Mould Hardness' },
                  { key: 'patternTemperature', label: 'Pattern Temperature' }
                ].map(({ key, label }) => (
                  <label 
                    key={key}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.625rem 0.75rem', 
                      cursor: 'pointer', 
                      borderRadius: '6px',
                      transition: 'background 0.15s',
                      fontSize: '0.875rem',
                      color: '#334155'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <input 
                      type="checkbox" 
                      checked={showSections[key]} 
                      onChange={() => handleSectionToggle(key)}
                      style={{ 
                        cursor: 'pointer', 
                        width: '18px', 
                        height: '18px',
                        accentColor: '#5B9AA9'
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader /></div>
      ) : !currentReport ? (
        <div style={{ 
          background: 'white', 
          padding: '3rem', 
          textAlign: 'center', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#64748b', margin: 0 }}>No data found for the selected date and shift</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#94a3b8' }}>Please select a different date or shift</p>
        </div>
      ) : (
        <>
          {/* Primary Information Section with gray background */}
          <div style={{ 
            background: '#f8fafc', 
            padding: '2rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #cbd5e1'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                Primary Information
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleEditClick(currentReport)}
                  title="Edit"
                  style={{
                    padding: '0.375rem',
                    background: '#5B9AA9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteReport(currentReport._id)}
                  title="Delete"
                  style={{
                    padding: '0.375rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Primary Info Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Date</label>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  {currentReport.date ? new Date(currentReport.date).toLocaleDateString('en-GB') : '-'}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Shift</label>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  {currentReport.shift || '-'}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Incharge</label>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  {currentReport.incharge || '-'}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>PP Operator</label>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  {currentReport.ppOperator || '-'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Members Present</label>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                {currentReport.memberspresent || '-'}
              </p>
            </div>

            {/* Event Information Grid */}
            <div style={{ 
              borderTop: '1px solid #cbd5e1',
              paddingTop: '1.5rem',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem'
            }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Significant Event</label>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#334155', lineHeight: '1.6' }}>
                  {currentReport.significantEvent || '-'}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Maintenance</label>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#334155', lineHeight: '1.6' }}>
                  {currentReport.maintenance || '-'}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Supervisor Name</label>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#334155', lineHeight: '1.6' }}>
                  {currentReport.supervisorName || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Production Details Section */}
          {showSections.productionDetails && currentReport.productionDetails && currentReport.productionDetails.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  Production Details
                </h3>
                <button
                  onClick={() => toggleCollapse('productionDetails')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  {collapsedSections.productionDetails ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!collapsedSections.productionDetails && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>S.No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Counter No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Component Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Produced</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Poured</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Cycle Time</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Moulds/Hr</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Remarks</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterDataByShift(currentReport.productionDetails).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.counterNo || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.componentName || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.produced || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.poured || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.cycleTime || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.mouldsPerHour || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: item.remarks ? 'pointer' : 'default' }}
                            onClick={() => item.remarks && showRemarksPopup(item.remarks, 'Production Remarks')}>
                            {item.remarks || '-'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditRow('productionDetails', idx)}
                                style={{ padding: '0.375rem', background: '#5B9AA9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Edit Row"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow('productionDetails', idx)}
                                style={{ padding: '0.375rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentReport.productionTotals && (
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #5B9AA9' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>TOTAL</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{currentReport.productionTotals.counterNo || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{(currentReport.productionTotals.produced ?? 0)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{(currentReport.productionTotals.poured ?? 0)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{currentReport.productionTotals.remarks || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Next Shift Plan Section */}
          {showSections.nextShiftPlan && currentReport.nextShiftPlan && currentReport.nextShiftPlan.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  Next Shift Plan
                </h3>
                <button
                  onClick={() => toggleCollapse('nextShiftPlan')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  {collapsedSections.nextShiftPlan ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!collapsedSections.nextShiftPlan && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>S.No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Component Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Planned Moulds</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Remarks</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterDataByShift(currentReport.nextShiftPlan).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.componentName || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.plannedMoulds || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: item.remarks ? 'pointer' : 'default' }}
                            onClick={() => item.remarks && showRemarksPopup(item.remarks, 'Next Shift Plan Remarks')}>
                            {item.remarks || '-'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditRow('nextShiftPlan', idx)}
                                style={{ padding: '0.375rem', background: '#5B9AA9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Edit Row"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow('nextShiftPlan', idx)}
                                style={{ padding: '0.375rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Delays Section */}
          {showSections.delays && currentReport.delays && currentReport.delays.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  Delays
                </h3>
                <button
                  onClick={() => toggleCollapse('delays')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  {collapsedSections.delays ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!collapsedSections.delays && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>S.No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Delays</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Duration (Minutes)</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Duration (Time)</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterDataByShift(currentReport.delays).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.delays || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.durationMinutes || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.durationTime || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditRow('delays', idx)}
                                style={{ padding: '0.375rem', background: '#5B9AA9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Edit Row"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow('delays', idx)}
                                style={{ padding: '0.375rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentReport.delaysTotals && (
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #5B9AA9' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>TOTAL</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{(currentReport.delaysTotals.durationMinutes ?? 0)}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Mould Hardness Section */}
          {showSections.mouldHardness && currentReport.mouldHardness && currentReport.mouldHardness.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  Mould Hardness
                </h3>
                <button
                  onClick={() => toggleCollapse('mouldHardness')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  {collapsedSections.mouldHardness ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!collapsedSections.mouldHardness && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: 'white' }}>
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>S.No</th>
                        <th rowSpan="2" style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Component Name</th>
                        <th colSpan="2" style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Mould Penetrant (N/cm²)</th>
                        <th colSpan="2" style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>B-Scale</th>
                        <th rowSpan="2" style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Remarks</th>
                        <th rowSpan="2" style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', width: '100px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
                      </tr>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>PP</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>SP</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>PP</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>SP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterDataByShift(currentReport.mouldHardness).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.componentName || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.mpPP || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.mpSP || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.bsPP || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.bsSP || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: item.remarks ? 'pointer' : 'default' }}
                            onClick={() => item.remarks && showRemarksPopup(item.remarks, 'Mould Hardness Remarks')}>
                            {item.remarks || '-'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditRow('mouldHardness', idx)}
                                style={{ padding: '0.375rem', background: '#5B9AA9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Edit Row"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow('mouldHardness', idx)}
                                style={{ padding: '0.375rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Pattern Temperature Section */}
          {showSections.patternTemperature && currentReport.patternTemperature && currentReport.patternTemperature.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                  Pattern Temperature
                </h3>
                <button
                  onClick={() => toggleCollapse('patternTemperature')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                >
                  {collapsedSections.patternTemperature ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              {!collapsedSections.patternTemperature && (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', background: 'white' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>S.No</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>Item</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>PP</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase' }}>SP</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.8125rem', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterDataByShift(currentReport.patternTemperature).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.item || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.pp || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{item.sp || '-'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditRow('patternTemperature', idx)}
                                style={{ padding: '0.375rem', background: '#5B9AA9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Edit Row"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow('patternTemperature', idx)}
                                style={{ padding: '0.375rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Delete Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Remarks Modal */}
      {remarksModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={closeRemarksModal}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{remarksModal.title}</h3>
              <button onClick={closeRemarksModal} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0',
                color: '#64748b'
              }}>&times;</button>
            </div>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#334155' }}>{remarksModal.content}</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReport && editFormData && (
        <div className="modal-overlay" onClick={() => setEditingReport(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Disamatic Product Entry</h2>
              <button className="modal-close-btn" onClick={() => setEditingReport(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Primary Information */}
              <div className="edit-section">
                <h3 className="edit-section-title">Primary Information</h3>
                <div className="disamatic-form-grid">
                  <div className="disamatic-form-group">
                    <label>Date *</label>
                    <input 
                      type="date" 
                      value={editFormData.date} 
                      onChange={(e) => handleEditChange('date', e.target.value)}
                    />
                  </div>
                  <div className="disamatic-form-group">
                    <label>Shift *</label>
                    <input 
                      type="text" 
                      value={editFormData.shift} 
                      onChange={(e) => handleEditChange('shift', e.target.value)}
                    />
                  </div>
                  <div className="disamatic-form-group">
                    <label>Incharge</label>
                    <input 
                      type="text" 
                      value={editFormData.incharge} 
                      onChange={(e) => handleEditChange('incharge', e.target.value)}
                    />
                  </div>
                  <div className="disamatic-form-group">
                    <label>PP Operator</label>
                    <input 
                      type="text" 
                      value={editFormData.ppOperator} 
                      onChange={(e) => handleEditChange('ppOperator', e.target.value)}
                    />
                  </div>
                  <div className="disamatic-form-group full-width">
                    <label>Members Present</label>
                    <input 
                      type="text" 
                      value={editFormData.memberspresent} 
                      onChange={(e) => handleEditChange('memberspresent', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Production Details */}
              {editFormData.productionDetails && editFormData.productionDetails.length > 0 && (
                <div className="edit-section" data-edit-section="productionDetails">
                  <h3 className="edit-section-title">Production Details</h3>
                  {editFormData.productionDetails.map((item, idx) => (
                    <div key={idx} className="edit-table-row">
                      <div className="disamatic-form-grid">
                        <div className="disamatic-form-group">
                          <label>Counter No</label>
                          <input 
                            type="text" 
                            value={item.counterNo || ''} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'counterNo', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Component Name</label>
                          <input 
                            type="text" 
                            value={item.componentName || ''} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'componentName', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Produced</label>
                          <input 
                            type="number" 
                            value={item.produced || 0} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'produced', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Poured</label>
                          <input 
                            type="number" 
                            value={item.poured || 0} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'poured', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Cycle Time</label>
                          <input 
                            type="text" 
                            value={item.cycleTime || ''} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'cycleTime', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Moulds/Hour</label>
                          <input 
                            type="number" 
                            value={item.mouldsPerHour || 0} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'mouldsPerHour', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="disamatic-form-group full-width">
                          <label>Remarks</label>
                          <input 
                            type="text" 
                            value={item.remarks || ''} 
                            onChange={(e) => handleTableChange('productionDetails', idx, 'remarks', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Next Shift Plan */}
              {editFormData.nextShiftPlan && editFormData.nextShiftPlan.length > 0 && (
                <div className="edit-section" data-edit-section="nextShiftPlan">
                  <h3 className="edit-section-title">Next Shift Plan</h3>
                  {editFormData.nextShiftPlan.map((item, idx) => (
                    <div key={idx} className="edit-table-row">
                      <div className="disamatic-form-grid">
                        <div className="disamatic-form-group">
                          <label>Component Name</label>
                          <input 
                            type="text" 
                            value={item.componentName || ''} 
                            onChange={(e) => handleTableChange('nextShiftPlan', idx, 'componentName', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Planned Moulds</label>
                          <input 
                            type="number" 
                            value={item.plannedMoulds || 0} 
                            onChange={(e) => handleTableChange('nextShiftPlan', idx, 'plannedMoulds', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="disamatic-form-group full-width">
                          <label>Remarks</label>
                          <input 
                            type="text" 
                            value={item.remarks || ''} 
                            onChange={(e) => handleTableChange('nextShiftPlan', idx, 'remarks', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delays */}
              {editFormData.delays && editFormData.delays.length > 0 && (
                <div className="edit-section" data-edit-section="delays">
                  <h3 className="edit-section-title">Delays</h3>
                  {editFormData.delays.map((item, idx) => (
                    <div key={idx} className="edit-table-row">
                      <div className="disamatic-form-grid">
                        <div className="disamatic-form-group">
                          <label>Delays</label>
                          <input 
                            type="text" 
                            value={item.delays || ''} 
                            onChange={(e) => handleTableChange('delays', idx, 'delays', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Duration (Minutes)</label>
                          <input 
                            type="number" 
                            value={item.durationMinutes || 0} 
                            onChange={(e) => handleTableChange('delays', idx, 'durationMinutes', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Duration (Time)</label>
                          <input 
                            type="text" 
                            value={item.durationTime || ''} 
                            onChange={(e) => handleTableChange('delays', idx, 'durationTime', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mould Hardness */}
              {editFormData.mouldHardness && editFormData.mouldHardness.length > 0 && (
                <div className="edit-section" data-edit-section="mouldHardness">
                  <h3 className="edit-section-title">Mould Hardness Production</h3>
                  {editFormData.mouldHardness.map((item, idx) => (
                    <div key={idx} className="edit-table-row">
                      <div className="disamatic-form-grid">
                        <div className="disamatic-form-group">
                          <label>Component Name</label>
                          <input 
                            type="text" 
                            value={item.componentName || ''} 
                            onChange={(e) => handleTableChange('mouldHardness', idx, 'componentName', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>MP-PP</label>
                          <input 
                            type="text" 
                            value={item.mpPP || ''} 
                            onChange={(e) => handleTableChange('mouldHardness', idx, 'mpPP', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>MP-SP</label>
                          <input 
                            type="text" 
                            value={item.mpSP || ''} 
                            onChange={(e) => handleTableChange('mouldHardness', idx, 'mpSP', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>BS-PP</label>
                          <input 
                            type="text" 
                            value={item.bsPP || ''} 
                            onChange={(e) => handleTableChange('mouldHardness', idx, 'bsPP', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>BS-SP</label>
                          <input 
                            type="text" 
                            value={item.bsSP || ''} 
                            onChange={(e) => handleTableChange('mouldHardness', idx, 'bsSP', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group full-width">
                          <label>Remarks</label>
                          <input 
                            type="text" 
                            value={item.remarks || ''} 
                            onChange={(e) => handleTableChange('mouldHardness', idx, 'remarks', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pattern Temperature */}
              {editFormData.patternTemperature && editFormData.patternTemperature.length > 0 && (
                <div className="edit-section" data-edit-section="patternTemperature">
                  <h3 className="edit-section-title">Pattern Temperature</h3>
                  {editFormData.patternTemperature.map((item, idx) => (
                    <div key={idx} className="edit-table-row">
                      <div className="disamatic-form-grid">
                        <div className="disamatic-form-group">
                          <label>Item</label>
                          <input 
                            type="text" 
                            value={item.item || ''} 
                            onChange={(e) => handleTableChange('patternTemperature', idx, 'item', e.target.value)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>PP</label>
                          <input 
                            type="number" 
                            value={item.pp || 0} 
                            onChange={(e) => handleTableChange('patternTemperature', idx, 'pp', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="disamatic-form-group">
                          <label>SP</label>
                          <input 
                            type="number" 
                            value={item.sp || 0} 
                            onChange={(e) => handleTableChange('patternTemperature', idx, 'sp', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Event Section */}
              <div className="edit-section">
                <h3 className="edit-section-title">Event Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  <div className="disamatic-form-group">
                    <label>Significant Event</label>
                    <input 
                      type="text" 
                      value={editFormData.significantEvent} 
                      onChange={(e) => handleEditChange('significantEvent', e.target.value)}
                    />
                  </div>
                  <div className="disamatic-form-group">
                    <label>Maintenance</label>
                    <input 
                      type="text" 
                      value={editFormData.maintenance} 
                      onChange={(e) => handleEditChange('maintenance', e.target.value)}
                    />
                  </div>
                  <div className="disamatic-form-group">
                    <label>Supervisor Name</label>
                    <input 
                      type="text" 
                      value={editFormData.supervisorName} 
                      onChange={(e) => handleEditChange('supervisorName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setEditingReport(null)} disabled={updating}>
                Cancel
              </button>
              <button className="modal-submit-btn" onClick={handleUpdateReport} disabled={updating}>
                {updating ? 'Updating...' : 'Update Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      {rowEdit && rowEditData && (
        <div className="modal-overlay" onClick={handleCancelRowEdit}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Row - {rowEdit.section}</h2>
              <button className="modal-close-btn" onClick={handleCancelRowEdit}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="edit-section">
                <div className="disamatic-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
                  {sectionFieldConfig[rowEdit.section].map(field => (
                    <div key={field.key} className="disamatic-form-group" style={{ gridColumn: field.key === 'remarks' ? '1 / -1' : 'auto' }}>
                      <label>{field.label}</label>
                      <input
                        type={field.type}
                        value={rowEditData[field.key] ?? ''}
                        onChange={(e) => handleRowEditChange(field.key, field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value) || 0) : e.target.value)}
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={handleCancelRowEdit} disabled={updating}>Cancel</button>
              <button className="modal-submit-btn" onClick={handleSaveRowEdit} disabled={updating}>{updating ? 'Saving...' : 'Save Row'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisamaticProductReport;