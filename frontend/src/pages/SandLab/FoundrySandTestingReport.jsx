import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import '../../styles/PageStyles/Sandlab/FoundrySandTestingReport.css';

const FoundrySandTestingReport = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [records, setRecords] = useState([]);
  const [displayRecords, setDisplayRecords] = useState([]);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleting, setDeleting] = useState({});

  const showToast = (message, type = 'success', duration = 2000) => {
    setToast({ show: true, message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, message: '', type }), duration);
  };

  useEffect(() => {
    fetchAllRecords();
  }, []);

  useEffect(() => {
    refetchByDateOrRange();
  }, [selectedDate]);

  const fetchAllRecords = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/foundry-sand-testing-notes', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const refetchByDateOrRange = async () => {
    const sel = normalizeDateYMD(selectedDate);
    if (!sel) {
      setDisplayRecords([]);
      return;
    }
    try {
      const url = `http://localhost:5000/api/v1/foundry-sand-testing-notes/date/${sel}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDisplayRecords(Array.isArray(data) ? data : []);
      } else {
        setDisplayRecords([]);
      }
    } catch (e) {
      console.error('Refetch error:', e);
      setDisplayRecords([]);
    }
  };

  const getAt = (obj, path) => {
    if (!obj || !path) return '';
    const parts = path.split('.');
    let cur = obj;
    for (let p of parts) {
      cur = cur?.[p];
      if (cur == null) return '';
    }
    return cur == null ? '' : cur;
  };

  const normalizeDateYMD = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateDMY = (d) => {
    const ymd = normalizeDateYMD(d);
    if (!ymd) return '';
    const [y, m, day] = ymd.split('-');
    return `${day}-${m}-${y}`;
  };

  const handleDeleteRecord = async (rec) => {
    const id = rec?._id || rec?.id;
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`http://localhost:5000/api/v1/foundry-sand-testing-notes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showToast('Record deleted successfully', 'success');
        await refetchByDateOrRange();
      } else {
        showToast('Failed to delete record', 'error');
      }
    } catch (e) {
      console.error('Delete error:', e);
      showToast('Error deleting record', 'error');
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  // Render Table 1: Primary Information
  const renderTable1 = () => {
    if (displayRecords.length === 0) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 1 - Primary Information</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Sand Plant</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Compactibility Setting</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shear Strength Setting</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayRecords.map((rec, idx) => (
          <div key={rec._id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 600 }}>Table 1 - Primary Information</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shift</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Sand Plant</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Compactibility Setting</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Shear Strength Setting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>{formatDateDMY(rec.date)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>{rec.shift || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>{rec.sandPlant || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>{rec.compactibilitySetting || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7' }}>{rec.shearStrengthSetting || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table 2: Clay Test Results
  const renderTable2 = () => {
    if (displayRecords.length === 0) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 2 - Clay Test Results</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayRecords.map((rec, idx) => (
          <div key={rec._id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 600 }}>Table 2 - Clay Test Results</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Total Clay - Solution</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test1.totalClay.solution') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test2.totalClay.solution') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Active Clay - Solution</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test1.activeClay.solution') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test2.activeClay.solution') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Dead Clay - Solution</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test1.deadClay.solution') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test2.deadClay.solution') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>VCM - Solution</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test1.vcm.solution') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test2.vcm.solution') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>LOI - Solution</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test1.loi.solution') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'clayTests.test2.loi.solution') || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table 3: Sieve Testing
  const renderTable3 = () => {
    if (displayRecords.length === 0) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 3 - Sieve Testing</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Sieve Size</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    const sieveSizes = [
      { size: '1700', label: '1700 µm (5 MF)' },
      { size: '850', label: '850 µm (10 MF)' },
      { size: '600', label: '600 µm (20 MF)' },
      { size: '425', label: '425 µm (30 MF)' },
      { size: '300', label: '300 µm (40 MF)' },
      { size: '212', label: '212 µm (50 MF)' },
      { size: '150', label: '150 µm (70 MF)' },
      { size: '106', label: '106 µm (100 MF)' },
      { size: '75', label: '75 µm (140 MF)' },
      { size: 'pan', label: 'Pan' },
      { size: 'total', label: 'Total' }
    ];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayRecords.map((rec, idx) => (
          <div key={rec._id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 600 }}>Table 3 - Sieve Testing</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Sieve Size</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1 (%)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2 (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {sieveSizes.map((sieve, sIdx) => (
                    <tr key={sIdx} style={{ background: sieve.size === 'total' ? '#f1f5f9' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: sieve.size === 'total' ? 600 : 400 }}>{sieve.label}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center', fontWeight: sieve.size === 'total' ? 600 : 400 }}>
                        {getAt(rec, `sieveTesting.test1.sieveSize.${sieve.size}`) || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center', fontWeight: sieve.size === 'total' ? 600 : 400 }}>
                        {getAt(rec, `sieveTesting.test2.sieveSize.${sieve.size}`) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table 4: Test Parameters
  const renderTable4 = () => {
    if (displayRecords.length === 0) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 4 - Test Parameters</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayRecords.map((rec, idx) => (
          <div key={rec._id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 600 }}>Table 4 - Test Parameters</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Compactability (%)</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.compactability') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.compactability') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Permeability</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.permeability') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.permeability') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>GCS (Green Compression Strength)</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.gcs') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.gcs') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>WTS (Wet Tensile Strength)</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.wts') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.wts') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Moisture (%)</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.moisture') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.moisture') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Bentonite</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.bentonite') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.bentonite') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Coal Dust</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.coalDust') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.coalDust') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Hopper Level</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.hopperLevel') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.hopperLevel') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Shear Strength</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.shearStrength') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.shearStrength') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Dust Collector Settings</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.dustCollectorSettings') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.dustCollectorSettings') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Return Sand Moisture</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test1.returnSandMoisture') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'parameters.test2.returnSandMoisture') || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Table 5: Additional Data & Remarks
  const renderTable5 = () => {
    if (displayRecords.length === 0) {
      return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600 }}>Table 5 - Additional Data & Remarks</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ padding: '14px 10px', borderBottom: '1px solid #eef2f7', color: '#64748b' }}>No records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayRecords.map((rec, idx) => (
          <div key={rec._id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 600 }}>Table 5 - Additional Data & Remarks</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 1</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>Test 2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>AFS No</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'additionalData.test1.afsNo') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'additionalData.test2.afsNo') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>Fines (%)</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'additionalData.test1.fines') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'additionalData.test2.fines') || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 500 }}>GD (Grain Distribution)</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'additionalData.test1.gd') || '-'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'center' }}>{getAt(rec, 'additionalData.test2.gd') || '-'}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', fontWeight: 600 }}>Remarks</td>
                    <td colSpan={2} style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', textAlign: 'left' }}>{rec.remarks || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {toast.show && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            padding: '10px 14px',
            borderRadius: 8,
            color: toast.type === 'success' ? '#065f46' : '#991b1b',
            background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 2000,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {toast.message}
        </div>
      )}
      
      <div className="sand-testing-report-container">
        <div className="sand-testing-report-header">
          <div className="sand-testing-report-header-text">
            <h2>
              <BookOpen size={24} />
              Foundry Sand Testing Note - Report
            </h2>
          </div>
        </div>

        <div className="sand-testing-filter-container">
          <div className="sand-testing-filter-group">
            <label>Date</label>
            <CustomDatePicker
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              name="selectedDate"
              placeholder="e.g: DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Table 1 - Full Width */}
        <div>
          {renderTable1()}
        </div>

        {/* Tables 2 & 5 - Side by Side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
          {renderTable2()}
          {renderTable5()}
        </div>

        {/* Table 3 - Full Width */}
        <div style={{ marginTop: 16 }}>
          {renderTable3()}
        </div>

        {/* Table 4 - Full Width */}
        <div style={{ marginTop: 16 }}>
          {renderTable4()}
        </div>
      </div>
    </>
  );
};

export default FoundrySandTestingReport;
