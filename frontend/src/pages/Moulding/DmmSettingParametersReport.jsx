import React, { useState, useEffect } from 'react';
import { BookOpenCheck, Trash2, Edit, X, Save } from 'lucide-react';
import { FilterButton } from '../../Components/Buttons';
import '../../styles/PageStyles/Moulding/DisamaticProductReport.css';

// Redesigned to mirror TensileReport: one consolidated table showing all parameter rows across shifts.
// Each parameter row gains Date + Machine + Shift context columns.

const DmmSettingParametersReport = () => {
  // Use LOCAL date (not UTC) to avoid off-by-one issues
  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const getTodayLocal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getTodayLocal();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedShift, setSelectedShift] = useState('All');
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [remarksModal, setRemarksModal] = useState({ show: false, content: '', title: 'Remarks' });
  // Row-level edit state
  const [rowEdit, setRowEdit] = useState(null); // { reportId, shiftKey, rowIndex }
  const [rowEditData, setRowEditData] = useState(null);

  // Section checkboxes removed – always show all columns

  const showRemarksPopup = (content, title = 'Remarks') => {
    setRemarksModal({ show: true, content, title });
  };

  const closeRemarksModal = () => {
    setRemarksModal({ show: false, content: '', title: 'Remarks' });
  };

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/v1/dmm-settings');
      if (resp.success) {
        const all = resp.data || [];
        setReports(all);
        if (all.length === 0) { setFilteredReports([]); return; }
        let dateToUse = selectedDate || todayStr;
        const hasToday = all.some(r => r.date && formatDate(r.date) === todayStr);
        if (!hasToday) {
          const latest = [...all].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          if (latest?.date) {
            dateToUse = formatDate(latest.date);
            setSelectedDate(dateToUse);
          }
        }
        setFilteredReports(all.filter(r => r.date && formatDate(r.date) === dateToUse));
      }
    } catch (err) {
      console.error('Failed to fetch dmm settings', err);
    } finally { setLoading(false); }
  };

  const applyFilters = (date, shift, allReports = reports) => {
    let dateToUse = date || todayStr;
    let filtered = allReports.filter(r => r.date && formatDate(r.date) === dateToUse);
    if (filtered.length === 0 && dateToUse === todayStr && allReports.length > 0) {
      const latest = [...allReports].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      if (latest?.date) {
        const latestDate = formatDate(latest.date);
        setSelectedDate(latestDate);
        filtered = allReports.filter(r => r.date && formatDate(r.date) === latestDate);
      }
    }
    setFilteredReports(filtered);
  };

  const handleFilter = () => {
    applyFilters(selectedDate, selectedShift, reports);
  };

  useEffect(() => {
    if (reports && reports.length >= 0) {
      applyFilters(selectedDate, selectedShift, reports);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedShift, reports]);

  // Flatten each shift's parameter arrays into unified list of rows.
  const flattenedRows = filteredReports.flatMap(report => {
    const rows = [];
    if (report.parameters) {
      ['shift1','shift2','shift3'].forEach(shiftKey => {
        if (selectedShift !== 'All' && selectedShift !== shiftKey.replace('shift','Shift ')) return;
        const arr = report.parameters[shiftKey];
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach((param, rowIndex) => {
            rows.push({
              _id: report._id,
              date: report.date,
              machine: report.machine,
              shift: shiftKey.replace('shift','Shift '),
              shiftKey,
              rowIndex,
              operatorName: report.shifts?.[shiftKey]?.operatorName || '-',
              checkedBy: report.shifts?.[shiftKey]?.checkedBy || '-',
              ...param
            });
          });
        }
      });
    }
    return rows;
  });

  const deleteWholeReport = async (id) => {
    if (!window.confirm('Delete entire machine report (all shift rows)?')) return;
    try {
      const res = await api.delete(`/v1/dmm-settings/${id}`);
      if (res.success) fetchReports();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  // Resolve the full report by id, or fallback to date+machine match
  const resolveReportByRow = (row) => {
    const byId = reports.find(r => r._id === row._id);
    if (byId) return byId;
    try {
      const rowDateKey = row.date ? formatDate(row.date) : '';
      return reports.find(r => {
        const repDateKey = r.date ? formatDate(r.date) : '';
        return repDateKey === rowDateKey && String(r.machine) === String(row.machine);
      }) || null;
    } catch {
      return null;
    }
  };

  const handleEditClick = (report) => {
    console.log('Editing report:', report);
    setEditingReport(report._id);
    setEditFormData({
      date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
      machine: report.machine || '',
      shifts: {
        shift1: { 
          operatorName: report.shifts?.shift1?.operatorName || '', 
          checkedBy: report.shifts?.shift1?.checkedBy || '' 
        },
        shift2: { 
          operatorName: report.shifts?.shift2?.operatorName || '', 
          checkedBy: report.shifts?.shift2?.checkedBy || '' 
        },
        shift3: { 
          operatorName: report.shifts?.shift3?.operatorName || '', 
          checkedBy: report.shifts?.shift3?.checkedBy || '' 
        }
      },
      parameters: {
        shift1: report.parameters?.shift1 || [],
        shift2: report.parameters?.shift2 || [],
        shift3: report.parameters?.shift3 || []
      }
    });
  };

  // ===== Row-level edit/delete =====
  const handleEditRow = (row) => {
    const report = resolveReportByRow(row);
    if (!report) {
      alert('Report not found for this row');
      return;
    }
    setRowEdit({ reportId: report._id, shiftKey: row.shiftKey, rowIndex: row.rowIndex });
    setRowEditData({ ...row });
  };

  const handleRowEditChange = (field, value) => {
    setRowEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRowEdit = async () => {
    if (!rowEdit || !rowEditData) return;
    try {
      setUpdating(true);
      const report = reports.find(r => r._id === rowEdit.reportId);
      if (!report) throw new Error('Report not found');
      const updatedArray = [...(report.parameters?.[rowEdit.shiftKey] || [])];
      if (!updatedArray[rowEdit.rowIndex]) throw new Error('Row not found');

      // Build updated row payload with correct database field names
      const updatedRow = {};
      const copyFrom = rowEditData;
      const assign = (k, v) => { if (v !== undefined) updatedRow[k] = v; };
      
      assign('customer', copyFrom.customer);
      assign('itemDescription', copyFrom.itemDescription);
      assign('time', copyFrom.time);
      assign('ppThickness', copyFrom.ppThickness === '' ? 0 : parseFloat(copyFrom.ppThickness));
      assign('ppHeight', copyFrom.ppHeight === '' ? 0 : parseFloat(copyFrom.ppHeight));
      assign('spThickness', copyFrom.spThickness === '' ? 0 : parseFloat(copyFrom.spThickness));
      assign('spHeight', copyFrom.spHeight === '' ? 0 : parseFloat(copyFrom.spHeight));
      
      // Core mask fields - use database schema field names
      assign('coreMaskThickness', copyFrom.coreMaskThickness === '' ? 0 : parseFloat(copyFrom.coreMaskThickness));
      assign('coreMaskHeightOutside', copyFrom.coreMaskHeightOutside === '' ? 0 : parseFloat(copyFrom.coreMaskHeightOutside));
      assign('coreMaskHeightInside', copyFrom.coreMaskHeightInside === '' ? 0 : parseFloat(copyFrom.coreMaskHeightInside));
      
      assign('sandShotPressureBar', copyFrom.sandShotPressureBar === '' ? 0 : parseFloat(copyFrom.sandShotPressureBar));
      assign('correctionShotTime', copyFrom.correctionShotTime === '' ? 0 : parseFloat(copyFrom.correctionShotTime));
      assign('squeezePressure', copyFrom.squeezePressure === '' ? 0 : parseFloat(copyFrom.squeezePressure));
      assign('ppStrippingAcceleration', copyFrom.ppStrippingAcceleration === '' ? 0 : parseFloat(copyFrom.ppStrippingAcceleration));
      assign('ppStrippingDistance', copyFrom.ppStrippingDistance === '' ? 0 : parseFloat(copyFrom.ppStrippingDistance));
      assign('spStrippingAcceleration', copyFrom.spStrippingAcceleration === '' ? 0 : parseFloat(copyFrom.spStrippingAcceleration));
      assign('spStrippingDistance', copyFrom.spStrippingDistance === '' ? 0 : parseFloat(copyFrom.spStrippingDistance));
      assign('mouldThicknessPlus10', copyFrom.mouldThicknessPlus10 === '' ? 0 : parseFloat(copyFrom.mouldThicknessPlus10));
      assign('closeUpForceMouldCloseUpPressure', copyFrom.closeUpForceMouldCloseUpPressure);
      assign('remarks', copyFrom.remarks);

      updatedArray[rowEdit.rowIndex] = updatedRow;
      const payload = { parameters: { [rowEdit.shiftKey]: updatedArray } };
      const res = await api.put(`/v1/dmm-settings/${rowEdit.reportId}`, payload);
      if (res.success) {
        alert('Row updated successfully');
        setRowEdit(null); setRowEditData(null);
        await fetchReports();
      } else {
        alert(res.message || 'Update failed');
      }
    } catch (err) {
      console.error('Row update failed', err);
      alert('Failed to update row: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally { setUpdating(false); }
  };

  const handleDeleteRow = async (row) => {
    if (!window.confirm('Delete this parameter row?')) return;
    try {
      setUpdating(true);
      const report = resolveReportByRow(row);
      if (!report) throw new Error('Report not found');
      const shiftKey = row.shiftKey;
      const array = [...(report.parameters?.[shiftKey] || [])];
      if (!array[row.rowIndex]) throw new Error('Row not found');
      array.splice(row.rowIndex, 1);
      const res = await api.put(`/v1/dmm-settings/${report._id}`, { parameters: { [shiftKey]: array } });
      if (res.success) {
        alert('Row deleted successfully');
        await fetchReports();
      } else {
        alert(res.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Row delete failed', err);
      alert('Failed to delete row: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally { setUpdating(false); }
  };

  const handleUpdateReport = async () => {
    if (!editFormData) return;

    try {
      setUpdating(true);
      const res = await api.put(`/v1/dmm-settings/${editingReport}`, editFormData);
      if (res.success) {
        alert('Report updated successfully!');
        setEditingReport(null);
        setEditFormData(null);
        fetchReports();
      }
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleOperationChange = (shift, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      shifts: {
        ...prev.shifts,
        [shift]: {
          ...prev.shifts[shift],
          [field]: value
        }
      }
    }));
  };

  const handleParameterChange = (shiftKey, rowIndex, field, value) => {
    setEditFormData(prev => {
      const newParams = { ...prev.parameters };
      const shiftParams = [...(newParams[shiftKey] || [])];
      if (shiftParams[rowIndex]) {
        shiftParams[rowIndex] = {
          ...shiftParams[rowIndex],
          [field]: value
        };
        newParams[shiftKey] = shiftParams;
      }
      return {
        ...prev,
        parameters: newParams
      };
    });
  };

  return (
    <div className="page-wrapper">
      <div className="impact-report-header">
        <div className="impact-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            DMM Setting Parameters Check Sheet - Report
          </h2>
        </div>
      </div>

      <div className="impact-filter-container" style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="impact-filter-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Select Date</label>
            <DatePicker value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} placeholder="Select date" />
          </div>
          <div className="impact-filter-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Select Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              style={{
                padding: '0.625rem 0.875rem',
                border: '2px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="All">All Shifts</option>
              <option value="Shift 1">Shift 1</option>
              <option value="Shift 2">Shift 2</option>
              <option value="Shift 3">Shift 3</option>
            </select>
          </div>
          {/* Auto-applied filters; removed manual Apply button for consistency */}
        </div>
      </div>

      {/* Section checkboxes removed */}

      {loading ? <div className="impact-loader-container"><div>Loading...</div></div> : (
        <div className="impact-details-card">
          <div className="impact-table-container">
            <table className="impact-table">
              <thead>
                <tr>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Machine</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Shift</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Operator Name</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Checked By</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Customer</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Item Description</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Time</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Thickness (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Height (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Thickness (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Height (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Core Mask Thickness (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Core Mask Height Outside (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Core Mask Height Inside (mm)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Sand Shot Pressure (Bar)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Correction Shot Time (s)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Squeeze Pressure (Kg/cm²)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Stripping Accel.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>PP Stripping Dist.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Stripping Accel.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>SP Stripping Dist.</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Mould Thickness ±10mm</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Close-Up Force/Pressure</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Remarks</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flattenedRows.length === 0 ? (
                  <tr><td colSpan="26" className="impact-no-records">No parameter rows found</td></tr>
                ) : (
                  flattenedRows.map((row, idx) => (
                    <tr key={row._id + '-' + idx} style={{ transition: 'background-color 0.2s ease' }}>
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 500 }}>{row.date ? new Date(row.date).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 500 }}>{row.machine || '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 500 }}>{row.shift}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.operatorName}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.checkedBy}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.customer || '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.itemDescription || '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.time || '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.ppThickness ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.ppHeight ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.spThickness ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.spHeight ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.coreMaskThickness ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.coreMaskHeightOutside ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.coreMaskHeightInside ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.sandShotPressureBar ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.correctionShotTime ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.squeezePressure ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.ppStrippingAcceleration ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.ppStrippingDistance ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.spStrippingAcceleration ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.spStrippingDistance ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.mouldThicknessPlus10 ?? '-'}</td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>{row.closeUpForceMouldCloseUpPressure || '-'}</td>
                      <td style={{ 
                        cursor: row.remarks ? 'pointer' : 'default',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        padding: '12px 18px',
                        textAlign: 'center',
                        color: row.remarks ? '#5B9AA9' : '#94a3b8',
                        textDecoration: row.remarks ? 'underline' : 'none'
                      }}
                        onClick={() => row.remarks && showRemarksPopup(row.remarks)}
                        title={row.remarks || 'No remarks'}>
                        {row.remarks || '-'}
                      </td>
                      <td style={{ minWidth: '120px', padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleEditRow(row)}
                            style={{
                              padding: '0.5rem',
                              background: '#5B9AA9',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            title="Edit Row"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const fullReport = resolveReportByRow(row);
                              if (!fullReport?._id) {
                                alert('Failed to delete: Report not found for this row');
                                return;
                              }
                              deleteWholeReport(fullReport._id);
                            }}
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
        <div className="modal-overlay" onClick={() => { setEditingReport(null); setEditFormData(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit DMM Settings Report</h2>
              <button className="modal-close-btn" onClick={() => { setEditingReport(null); setEditFormData(null); }}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
            {/* Primary Information */}
            <div className="edit-section">
              <h3 className="edit-section-title">Primary Information</h3>
              <div className="disamatic-form-grid">
                <div className="disamatic-form-group">
                  <label>Date</label>
                  <input type="date" value={editFormData.date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value}))} />
                </div>
                <div className="disamatic-form-group">
                  <label>Machine</label>
                  <input type="text" value={editFormData.machine}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, machine: e.target.value}))} />
                </div>
              </div>
            </div>

            {/* Operation Information */}
            <div className="edit-section">
              <h3 className="edit-section-title">Operation Information</h3>
              <table className="edit-operations-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Shift I</th>
                    <th>Shift II</th>
                    <th>Shift III</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="param-label">Operator Name</td>
                    <td>
                      <input type="text" value={editFormData.shifts.shift1.operatorName}
                        onChange={(e) => handleOperationChange('shift1', 'operatorName', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" value={editFormData.shifts.shift2.operatorName}
                        onChange={(e) => handleOperationChange('shift2', 'operatorName', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" value={editFormData.shifts.shift3.operatorName}
                        onChange={(e) => handleOperationChange('shift3', 'operatorName', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="param-label">Checked By</td>
                    <td>
                      <input type="text" value={editFormData.shifts.shift1.checkedBy}
                        onChange={(e) => handleOperationChange('shift1', 'checkedBy', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" value={editFormData.shifts.shift2.checkedBy}
                        onChange={(e) => handleOperationChange('shift2', 'checkedBy', e.target.value)} />
                    </td>
                    <td>
                      <input type="text" value={editFormData.shifts.shift3.checkedBy}
                        onChange={(e) => handleOperationChange('shift3', 'checkedBy', e.target.value)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Shift Parameters - Show each shift's parameters */}
            {['shift1', 'shift2', 'shift3'].map((shiftKey, shiftIdx) => {
              const shiftParams = editFormData.parameters[shiftKey] || [];
              if (shiftParams.length === 0) return null;
              
              return (
                <div key={shiftKey} className="edit-section">
                  <h3 className="edit-section-title">Shift {shiftIdx + 1} Parameters</h3>
                  {shiftParams.map((param, rowIdx) => (
                    <div key={rowIdx} className="edit-table-row">
                      <h4 style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: '#64748b' }}>Entry #{rowIdx + 1}</h4>
                      <div className="disamatic-form-grid">
                        <div className="disamatic-form-group">
                          <label>Customer</label>
                          <input type="text" value={param.customer || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'customer', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Item Description</label>
                          <input type="text" value={param.itemDescription || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'itemDescription', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Time</label>
                          <input type="text" value={param.time || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'time', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>PP Thickness</label>
                          <input type="number" value={param.ppThickness || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'ppThickness', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>PP Height</label>
                          <input type="number" value={param.ppHeight || param.ppheight || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'ppHeight', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>SP Thickness</label>
                          <input type="number" value={param.spThickness || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'spThickness', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>SP Height</label>
                          <input type="number" value={param.spHeight || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'spHeight', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Core Mask Thickness</label>
                          <input type="number" value={param.coreMaskThickness ?? ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'coreMaskThickness', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Core Mask Height Outside</label>
                          <input type="number" value={param.coreMaskHeightOutside ?? ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'coreMaskHeightOutside', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Core Mask Height Inside</label>
                          <input type="number" value={param.coreMaskHeightInside ?? ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'coreMaskHeightInside', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Sand Shot Pressure (Bar)</label>
                          <input type="number" value={param.sandShotPressureBar ?? ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'sandShotPressureBar', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Correction Shot Time</label>
                          <input type="number" value={param.correctionShotTime || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'correctionShotTime', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Squeeze Pressure</label>
                          <input type="number" value={param.squeezePressure || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'squeezePressure', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>PP Stripping Acceleration</label>
                          <input type="number" value={param.ppStrippingAcceleration || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'ppStrippingAcceleration', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>PP Stripping Distance</label>
                          <input type="number" value={param.ppStrippingDistance || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'ppStrippingDistance', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>SP Stripping Acceleration</label>
                          <input type="number" value={param.spStrippingAcceleration || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'spStrippingAcceleration', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>SP Stripping Distance</label>
                          <input type="number" value={param.spStrippingDistance || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'spStrippingDistance', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Mould Thickness ±10mm</label>
                          <input type="number" value={param.mouldThicknessPlus10 ?? ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'mouldThicknessPlus10', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group">
                          <label>Close-Up Force/Pressure</label>
                          <input type="text" value={param.closeUpForceMouldCloseUpPressure || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'closeUpForceMouldCloseUpPressure', e.target.value)} />
                        </div>
                        <div className="disamatic-form-group full-width">
                          <label>Remarks</label>
                          <textarea 
                            value={param.remarks || ''}
                            onChange={(e) => handleParameterChange(shiftKey, rowIdx, 'remarks', e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.625rem 0.875rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontFamily: 'Poppins, sans-serif',
                              resize: 'vertical',
                              minHeight: '80px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Action Buttons */}
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => { setEditingReport(null); setEditFormData(null); }}>
                Cancel
              </button>
              <button className="modal-submit-btn" onClick={handleUpdateReport} disabled={updating}>
                <Save size={18} />
                {updating ? 'Updating...' : 'Update Report'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      {rowEdit && rowEditData && (
        <div className="modal-overlay" onClick={() => { setRowEdit(null); setRowEditData(null); }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Edit Parameter Row - {rowEdit.shiftKey.replace('shift','Shift ')}</h2>
              <button className="modal-close-btn" onClick={() => { setRowEdit(null); setRowEditData(null); }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="disamatic-form-grid">
                <div className="disamatic-form-group">
                  <label>Customer</label>
                  <input type="text" value={rowEditData.customer || ''} onChange={(e) => handleRowEditChange('customer', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Item Description</label>
                  <input type="text" value={rowEditData.itemDescription || ''} onChange={(e) => handleRowEditChange('itemDescription', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Time</label>
                  <input type="text" value={rowEditData.time || ''} onChange={(e) => handleRowEditChange('time', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>PP Thickness</label>
                  <input type="number" value={rowEditData.ppThickness ?? ''} onChange={(e) => handleRowEditChange('ppThickness', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>PP Height</label>
                  <input type="number" value={rowEditData.ppHeight ?? rowEditData.ppheight ?? ''} onChange={(e) => handleRowEditChange('ppHeight', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>SP Thickness</label>
                  <input type="number" value={rowEditData.spThickness ?? ''} onChange={(e) => handleRowEditChange('spThickness', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>SP Height</label>
                  <input type="number" value={rowEditData.spHeight ?? ''} onChange={(e) => handleRowEditChange('spHeight', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Core Mask Thickness</label>
                  <input type="number" value={rowEditData.coreMaskThickness ?? ''} onChange={(e) => handleRowEditChange('coreMaskThickness', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Core Mask Height Outside</label>
                  <input type="number" value={rowEditData.coreMaskHeightOutside ?? ''} onChange={(e) => handleRowEditChange('coreMaskHeightOutside', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Core Mask Height Inside</label>
                  <input type="number" value={rowEditData.coreMaskHeightInside ?? ''} onChange={(e) => handleRowEditChange('coreMaskHeightInside', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Sand Shot Pressure (Bar)</label>
                  <input type="number" value={rowEditData.sandShotPressureBar ?? ''} onChange={(e) => handleRowEditChange('sandShotPressureBar', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Correction Shot Time</label>
                  <input type="number" value={rowEditData.correctionShotTime ?? ''} onChange={(e) => handleRowEditChange('correctionShotTime', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Squeeze Pressure</label>
                  <input type="number" value={rowEditData.squeezePressure ?? ''} onChange={(e) => handleRowEditChange('squeezePressure', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>PP Stripping Acceleration</label>
                  <input type="number" value={rowEditData.ppStrippingAcceleration ?? ''} onChange={(e) => handleRowEditChange('ppStrippingAcceleration', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>PP Stripping Distance</label>
                  <input type="number" value={rowEditData.ppStrippingDistance ?? ''} onChange={(e) => handleRowEditChange('ppStrippingDistance', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>SP Stripping Acceleration</label>
                  <input type="number" value={rowEditData.spStrippingAcceleration ?? ''} onChange={(e) => handleRowEditChange('spStrippingAcceleration', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>SP Stripping Distance</label>
                  <input type="number" value={rowEditData.spStrippingDistance ?? ''} onChange={(e) => handleRowEditChange('spStrippingDistance', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Mould Thickness ±10mm</label>
                  <input type="number" value={rowEditData.mouldThicknessPlus10 ?? ''} onChange={(e) => handleRowEditChange('mouldThicknessPlus10', e.target.value)} />
                </div>
                <div className="disamatic-form-group">
                  <label>Close-Up Force/Pressure</label>
                  <input type="text" value={rowEditData.closeUpForceMouldCloseUpPressure ?? ''} onChange={(e) => handleRowEditChange('closeUpForceMouldCloseUpPressure', e.target.value)} />
                </div>
                <div className="disamatic-form-group full-width">
                  <label>Remarks</label>
                  <textarea 
                    value={rowEditData.remarks ?? ''} 
                    onChange={(e) => handleRowEditChange('remarks', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif',
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => { setRowEdit(null); setRowEditData(null); }} disabled={updating}>Cancel</button>
              <button className="modal-submit-btn" onClick={handleSaveRowEdit} disabled={updating}>{updating ? 'Saving...' : 'Save Row'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DmmSettingParametersReport;