import React, { useEffect, useState } from 'react';
import { PencilLine, Trash2, BookOpenCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { FilterButton, ClearButton } from '../../Components/Buttons';
import Table from '../../Components/Table';
import { API_ENDPOINTS } from '../../config/api';
import Sakthi from '../../Components/Sakthi';
import '../../styles/PageStyles/Sandlab/SandTestingRecordReport.css';

const SandTestingRecordReport = () => {
  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [datesList, setDatesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltered, setIsFiltered] = useState(false);
  const [table1Data, setTable1Data] = useState({
    table1a: {
      '0_1': [], '0_2': [], '0_3': [],
      '1_1': [], '1_2': [], '1_3': [],
      '2_1': [], '2_2': [], '2_3': [],
      '3_1': [], '3_2': [], '3_3': [],
      '4_1': [], '4_2': [], '4_3': []
    },
    table1b: {
      bentonite: '',
      batchType: '',
      value: ''
    }
  });

  const [table2Data, setTable2Data] = useState({
    '0_0': '', '0_1': '', '0_2': '',
    '1_0': '', '1_1': '', '1_2': '',
    '2_0': '', '2_1': '', '2_2': '',
    '3_0': '', '3_1': '', '3_2': '',
    '4_0': '', '4_1': '', '4_2': '',
    '5_0': '', '5_1': '', '5_2': '',
    '6_0': '', '6_1': '', '6_2': ''
  });

  const [table3Data, setTable3Data] = useState({
    '0_0': [], '0_1': [], '0_2': [], '0_3': [], '0_4': [],
    '1_0': [], '1_1': [], '1_2': [], '1_3': [], '1_4': [],
    '2_0': [], '2_1': [], '2_2': [], '2_3': [], '2_4': []
  });

  const [table4Data, setTable4Data] = useState({
    sandLump: '',
    newSandWt: '',
    friabilityShiftI: '',
    friabilityShiftII: '',
    friabilityShiftIII: ''
  });

  const [table5Data, setTable5Data] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch data for a single date
  const fetchDataForDate = async (date) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.sandTestingRecords}/date/${date}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        return result.data[0];
      }
      return null;
    } catch (error) {
      console.error(`Error fetching data for ${date}:`, error);
      return null;
    }
  };

  // Function to process and set record data
  const processRecordData = (record) => {
    if (record) {
      // Map sandShifts to table1Data
      if (record.sandShifts) {
          const shifts = record.sandShifts;
          setTable1Data({
            table1a: {
              '0_1': shifts.shiftI?.rSand || [],
              '0_2': shifts.shiftII?.rSand || [],
              '0_3': shifts.shiftIII?.rSand || [],
              '1_1': shifts.shiftI?.nSand || [],
              '1_2': shifts.shiftII?.nSand || [],
              '1_3': shifts.shiftIII?.nSand || [],
              '2_1': shifts.shiftI?.mixingMode || [],
              '2_2': shifts.shiftII?.mixingMode || [],
              '2_3': shifts.shiftIII?.mixingMode || [],
              '3_1': shifts.shiftI?.bentonite || [],
              '3_2': shifts.shiftII?.bentonite || [],
              '3_3': shifts.shiftIII?.bentonite || [],
              '4_1': shifts.shiftI?.coalDustPremix || [],
              '4_2': shifts.shiftII?.coalDustPremix || [],
              '4_3': shifts.shiftIII?.coalDustPremix || []
            },
            table1b: {
              bentonite: shifts.batchNo?.bentonite || '',
              coalDust: shifts.batchNo?.coalDust || '',
              premix: shifts.batchNo?.premix || '',
              batchType: (shifts.batchNo?.coalDust && shifts.batchNo.coalDust.trim() !== '') ? 'coalDust' : ((shifts.batchNo?.premix && shifts.batchNo.premix.trim() !== '') ? 'premix' : ''),
              value: shifts.batchNo?.coalDust || shifts.batchNo?.premix || ''
            }
          });
        }

        // Map clayShifts to table2Data
        if (record.clayShifts) {
          const clay = record.clayShifts;
          setTable2Data({
            '0_0': clay.shiftI?.totalClay || '',
            '0_1': clay.ShiftII?.totalClay || '',
            '0_2': clay.ShiftIII?.totalClay || '',
            '1_0': clay.shiftI?.activeClay || '',
            '1_1': clay.ShiftII?.activeClay || '',
            '1_2': clay.ShiftIII?.activeClay || '',
            '2_0': clay.shiftI?.deadClay || '',
            '2_1': clay.ShiftII?.deadClay || '',
            '2_2': clay.ShiftIII?.deadClay || '',
            '3_0': clay.shiftI?.vcm || '',
            '3_1': clay.ShiftII?.vcm || '',
            '3_2': clay.ShiftIII?.vcm || '',
            '4_0': clay.shiftI?.loi || '',
            '4_1': clay.ShiftII?.loi || '',
            '4_2': clay.ShiftIII?.loi || '',
            '5_0': clay.shiftI?.afsNo || '',
            '5_1': clay.ShiftII?.afsNo || '',
            '5_2': clay.ShiftIII?.afsNo || '',
            '6_0': clay.shiftI?.fines || '',
            '6_1': clay.ShiftII?.fines || '',
            '6_2': clay.ShiftIII?.fines || ''
          });
        }

        // Map mixshifts to table3Data
        if (record.mixshifts) {
          const mix = record.mixshifts;
          setTable3Data({
            '0_0': mix.ShiftI?.mixno?.start || [],
            '0_1': mix.ShiftI?.mixno?.end || [],
            '0_2': mix.ShiftI?.mixno?.total || [],
            '0_3': mix.ShiftI?.numberOfMixRejected || [],
            '0_4': mix.ShiftI?.returnSandHopperLevel || [],
            '1_0': mix.ShiftII?.mixno?.start || [],
            '1_1': mix.ShiftII?.mixno?.end || [],
            '1_2': mix.ShiftII?.mixno?.total || [],
            '1_3': mix.ShiftII?.numberOfMixRejected || [],
            '1_4': mix.ShiftII?.returnSandHopperLevel || [],
            '2_0': mix.ShiftIII?.mixno?.start || [],
            '2_1': mix.ShiftIII?.mixno?.end || [],
            '2_2': mix.ShiftIII?.mixno?.total || [],
            '2_3': mix.ShiftIII?.numberOfMixRejected || [],
            '2_4': mix.ShiftIII?.returnSandHopperLevel || []
          });
        }

        // Map sand friability data to table4Data
        setTable4Data({
          sandLump: record.sandLump || '',
          newSandWt: record.newSandWt || '',
          friabilityShiftI: record.sandFriability?.shiftI || '',
          friabilityShiftII: record.sandFriability?.shiftII || '',
          friabilityShiftIII: record.sandFriability?.shiftIII || ''
        });

        // Map testParameter to table5Data
        if (record.testParameter && Array.isArray(record.testParameter)) {
          const formattedTable5 = record.testParameter.map((item, index) => {
            // Convert time from number format (e.g., 830) to display format (e.g., "08:30 AM")
            const formatTime = (timeNum) => {
              if (!timeNum) return '';
              const hour = Math.floor(timeNum / 100);
              const minute = timeNum % 100;
              const period = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
              return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
            };

            return {
              sno: item.sno || index + 1,
              time: formatTime(item.time),
              mixNo: item.mixno || '',
              permeability: item.permeability || '',
              gcsFdyA: item.gcsFdyA || '',
              gcsFdyB: item.gcsFdyB || '',
              wts: item.wts || '',
              moisture: item.moisture || '',
              compactability: item.compactability || '',
              compressibility: item.compressibility || '',
              waterLitre: item.waterLitre || '',
              sandTempBC: item.sandTemp?.BC || '',
              sandTempWU: item.sandTemp?.WU || '',
              sandTempSSU: item.sandTemp?.SSUmax || '',
              newSandKgs: item.newSandKgs || '',
              bentoniteWithPremixKgs: item.bentoniteWithPremix?.Kgs || '',
              bentoniteWithPremixPercent: item.bentoniteWithPremix?.Percent || '',
              bentoniteKgs: item.bentonite?.Kgs || '',
              bentonitePercent: item.bentonite?.Percent || '',
              premixKgs: item.premix?.Kgs || '',
              premixPercent: item.premix?.Percent || '',
              coalDustKgs: item.coalDust?.Kgs || '',
              coalDustPercent: item.coalDust?.Percent || '',
              lc: item.lc || '',
              compactabilitySettings: item.CompactabilitySettings || '',
              mouldStrength: item.mouldStrength || '',
              shearStrengthSetting: item.shearStrengthSetting || '',
              preparedSandlumps: item.preparedSandlumps || '',
              itemName: item.itemName || '',
              remarks: item.remarks || ''
            };
          });
          setTable5Data(formattedTable5);
        }
      }
  };

  // Main function to fetch and display data
  const fetchData = async () => {
    const MINIMUM_LOADING_TIME = 1500; // 1.5 seconds minimum for full animation
    const startTime = Date.now();
    
    try {
      setLoading(true);
      
      // If no filter applied, show current date
      if (!isFiltered) {
        const currentDate = getCurrentDate();
        const record = await fetchDataForDate(currentDate);
        
        if (record) {
          setDatesList([currentDate]);
          setCurrentPage(1);
          processRecordData(record);
        } else {
          // Clear all data
          clearAllData();
        }
      } else if (startDate) {
        // If only start date, fetch that single date
        if (!endDate || startDate === endDate) {
          const record = await fetchDataForDate(startDate);
          
          if (record) {
            setDatesList([startDate]);
            setCurrentPage(1);
            processRecordData(record);
          } else {
            clearAllData();
          }
        } else {
          // If date range, fetch all dates and filter only those with data
          const allDates = [];
          const start = new Date(startDate);
          const end = new Date(endDate);
          const current = new Date(start);
          
          while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            allDates.push(dateStr);
            current.setDate(current.getDate() + 1);
          }
          
          // Check which dates actually have data
          const datesWithData = [];
          for (const dateStr of allDates) {
            const record = await fetchDataForDate(dateStr);
            if (record) {
              datesWithData.push(dateStr);
            }
          }
          
          setDatesList(datesWithData);
          setCurrentPage(1);
          
          // Fetch data for first page (first date with data)
          if (datesWithData.length > 0) {
            const record = await fetchDataForDate(datesWithData[0]);
            if (record) {
              processRecordData(record);
            } else {
              clearAllData();
            }
          } else {
            clearAllData();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please try again.');
    } finally {
      // Ensure minimum loading time has passed before hiding loader
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  // Helper function to clear all data
  const clearAllData = () => {
    setTable1Data({
      table1a: {
        '0_1': [], '0_2': [], '0_3': [],
        '1_1': [], '1_2': [], '1_3': [],
        '2_1': [], '2_2': [], '2_3': [],
        '3_1': [], '3_2': [], '3_3': [],
        '4_1': [], '4_2': [], '4_3': []
      },
      table1b: { bentonite: '', batchType: '', value: '' }
    });
    setTable2Data({
      '0_0': '', '0_1': '', '0_2': '', '1_0': '', '1_1': '', '1_2': '',
      '2_0': '', '2_1': '', '2_2': '', '3_0': '', '3_1': '', '3_2': '',
      '4_0': '', '4_1': '', '4_2': '', '5_0': '', '5_1': '', '5_2': '',
      '6_0': '', '6_1': '', '6_2': ''
    });
    setTable3Data({
      '0_0': [], '0_1': [], '0_2': [], '0_3': [], '0_4': [],
      '1_0': [], '1_1': [], '1_2': [], '1_3': [], '1_4': [],
      '2_0': [], '2_1': [], '2_2': [], '2_3': [], '2_4': []
    });
    setTable4Data({ sandLump: '', newSandWt: '', friabilityShiftI: '', friabilityShiftII: '', friabilityShiftIII: '' });
    setTable5Data([]);
  };

  // Fetch current date data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data when page changes in date range mode
  useEffect(() => {
    if (datesList.length > 1 && currentPage > 0 && currentPage <= datesList.length) {
      const fetchPageData = async () => {
        setLoading(true);
        const targetDate = datesList[currentPage - 1];
        const record = await fetchDataForDate(targetDate);
        if (record) {
          processRecordData(record);
        } else {
          clearAllData();
        }
        setLoading(false);
      };
      fetchPageData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, datesList]);

  const handleFilter = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    // Validate that end date is not before start date
    if (endDate && new Date(endDate) < new Date(startDate)) {
      alert('End date cannot be before start date');
      return;
    }

    setIsFiltered(true);
    await fetchData();
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setIsFiltered(false);
    setDatesList([]);
    setCurrentPage(1);
    clearAllData();
    
    // Reload current date data
    fetchData();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= datesList.length) {
      setCurrentPage(page);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day} / ${month} / ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="sand-record-report-container">
      {/* Header */}
      <div className="sand-header">
        <div className="sand-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Sand Testing Record - Report
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {datesList.length > 0 && (
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#1e293b' }}>
              {datesList.length === 1 
                ? `Date: ${formatDateDisplay(datesList[0])}`
                : `Showing: ${formatDateDisplay(datesList[currentPage - 1])} (Page ${currentPage} of ${datesList.length})`
              }
            </div>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="impact-filter-container" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div className="impact-filter-group">
          <label>From Date</label>
          <CustomDatePicker
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
            disabled={loading}
          />
        </div>
        <div className="impact-filter-group">
          <label>To Date</label>
          <CustomDatePicker
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
            min={startDate}
            disabled={loading}
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!startDate || loading}>
          Filter
        </FilterButton>
        <ClearButton onClick={handleClear} disabled={!startDate && !endDate || loading}>
          Clear
        </ClearButton>

        {/* Pagination - right side of Clear button */}
        {datesList.length > 1 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginLeft: 'auto'
          }}>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                backgroundColor: currentPage === 1 ? '#e2e8f0' : '#5B9AA9',
                color: currentPage === 1 ? '#94a3b8' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {Array.from({ length: datesList.length }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  style={{
                    padding: '0.4rem 0.6rem',
                    backgroundColor: currentPage === page ? '#5B9AA9' : '#ffffff',
                    color: currentPage === page ? '#ffffff' : '#1e293b',
                    border: currentPage === page ? 'none' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: currentPage === page ? '700' : '500',
                    minWidth: '32px'
                  }}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                backgroundColor: currentPage === datesList.length ? '#e2e8f0' : '#5B9AA9',
                color: currentPage === datesList.length ? '#94a3b8' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === datesList.length ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === datesList.length}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <Sakthi 
            loopAnimation={true} 
            showMessage={true} 
            message="Loading data..." 
            onComplete={() => {}}
          />
        </div>
      )}

      {/* Table 1 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand & Mix Testing</h3>

      {/* Table 1a - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1rem' }}>
        <Table
          template
          showHeader={true}
          rows={5}
          columns={[
            { key: 'col1', label: 'Shift', bold: true, align: 'center' },
            { key: 'col2', label: 'I', align: 'center' },
            { key: 'col3', label: 'II', align: 'center' },
            { key: 'col4', label: 'III', align: 'center' }
          ]}
          renderCell={(rowIndex, colIndex) => {
            // First column: row labels
            if (colIndex === 0) {
              const labels = [
                'R. Sand ( Kgs. / Mix )',
                'N. Sand ( Kgs. / Mould )',
                'Mixing Mode',
                'Bentonite ( Kgs. / Mix )',
                'Coal Dust / Premix ( Kgs. / Mix )'
              ];
              return <strong style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#1e293b' }}>{labels[rowIndex]}</strong>;
            }

            // Other columns: display values
            const key = `${rowIndex}_${colIndex}`;
            const values = table1Data.table1a[key] || [];

            return (
              <div style={{ padding: '8px', textAlign: 'center' }}>
                {values.length > 0 ? (
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#334155',
                    minHeight: '20px'
                  }}>
                    {values.join(' / ')}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                )}
              </div>
            );
          }}
          minWidth="800px"
        />
      </div>

      {/* Table 1b - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '600px' }}>
            <tbody>
              <tr style={{ height: '50px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>BATCH No.</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Bentonite</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', padding: '8px' }}>
                  {table1Data.table1b.batchType === 'coalDust' ? 'Coal Dust' : table1Data.table1b.batchType === 'premix' ? 'Premix' : '-'}
                </td>
              </tr>
              <tr style={{ height: '50px' }}>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#334155'
                  }}>
                    {table1Data.table1b.bentonite || '-'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#334155'
                  }}>
                    {table1Data.table1b.value || '-'}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 2 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Clay Testing</h3>

      {/* Table 2 - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px' }}>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
              </tr>
              {/* Data Rows */}
              {[
                'Total Clay (11.0-14.5%)',
                'Active Clay (8.5-11.0%)',
                'Dead Clay (2.0-4.0%)',
                'V.C.M. (2.0-3.2%)',
                'L.O.I. (4.5-6.0%)',
                'AFS No. (Min. 48)',
                'Fines (10% Max)'
              ].map((label, rowIndex) => (
                <tr key={rowIndex} style={{ height: '50px' }}>
                  <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{label}</td>
                  {[0, 1, 2].map((colIndex) => {
                    const key = `${rowIndex}_${colIndex}`;
                    const value = table2Data[key] || '';
                    
                    return (
                      <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                        <div style={{
                          padding: '10px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#334155',
                          minHeight: '20px'
                        }}>
                          {value || '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 3 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Mix Testing & Hopper Level</h3>

      {/* Table 3 - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div className="reusable-table-container">
          <table className="reusable-table table-template table-bordered" style={{ minWidth: '800px', width: '100%' }}>
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col style={{ width: '300px' }} />
              <col />
              <col />
            </colgroup>
            <tbody>
              {/* Header Row */}
              <tr style={{ height: '40px' }}>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shift</td>
                <td colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>
                  Mix No.
                </td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>No. Of Rejected</td>
                <td rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Return Sand Hopper level</td>
              </tr>
              <tr style={{ height: '40px' }}>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Start</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>End</td>
                <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Total</td>
              </tr>
              {/* Data Rows */}
              {['I', 'II', 'III'].map((shift, rowIndex) => {
                const columns = [0, 1, 2, 3, 4];
                return (
                  <tr key={rowIndex} style={{ height: '50px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>{shift}</td>
                    {columns.map((colIndex) => {
                      const key = `${rowIndex}_${colIndex}`;
                      const values = table3Data[key] || [];
                      
                      return (
                        <td key={colIndex} style={{ textAlign: 'center', padding: '10px' }}>
                          <div style={{
                            padding: '10px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#334155',
                            minHeight: '20px'
                          }}>
                            {values.length > 0 ? values.join(' / ') : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Table 4 Display - Always visible */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Weight & Friability</h3>

      {/* Table 4a and 4b - Side by Side - Display only */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Table 4a - 2x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SAND LUMPS</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.sandLump || '-'}
                      </div>
                    </td>
                  </tr>
                  <tr style={{ height: '60px' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>NEW SAND WT</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.newSandWt || '-'}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4b - 4x2 */}
          <div>
            <div className="reusable-table-container">
              <table className="reusable-table table-template table-bordered">
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>SHIFT</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>Prepared Sand Friability ( 8.0 % - 13.0 % )</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>I</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.friabilityShiftI || '-'}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>II</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.friabilityShiftII || '-'}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b' }}>III</td>
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <div style={{
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#334155',
                        minHeight: '20px'
                      }}>
                        {table4Data.friabilityShiftIII || '-'}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Table 5 Display - Sand Properties & Test Parameters */}
      <div className="foundry-section">
        <h3 className="foundry-section-title">Sand Properties & Test Parameters</h3>

      {/* Table 5 - Scrollable display with sub-columns */}
      <div className="foundry-table-wrapper" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        {table5Data.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '1rem' }}>
            No test parameters recorded
          </div>
        ) : (() => {
          // Determine which GCS columns have data
          const hasGcsFdyA = table5Data.some(row => row.gcsFdyA && row.gcsFdyA !== '-');
          const hasGcsFdyB = table5Data.some(row => row.gcsFdyB && row.gcsFdyB !== '-');
          
          // Determine which Bentonite columns have data
          const hasBentoniteWithPremix = table5Data.some(row => 
            (row.bentoniteWithPremixKgs && row.bentoniteWithPremixKgs !== '-') || 
            (row.bentoniteWithPremixPercent && row.bentoniteWithPremixPercent !== '-')
          );
          const hasBentonite = table5Data.some(row => 
            (row.bentoniteKgs && row.bentoniteKgs !== '-') || 
            (row.bentonitePercent && row.bentonitePercent !== '-')
          );
          
          // Detect bentonite range from data
          let bentoniteRange = '';
          if (hasBentonite) {
            const bentonitePercents = table5Data
              .map(row => parseFloat(row.bentonitePercent))
              .filter(val => !isNaN(val) && val > 0);
            if (bentonitePercents.length > 0) {
              const maxPercent = Math.max(...bentonitePercents);
              bentoniteRange = maxPercent <= 1.20 ? ' (0.60-1.20)' : ' (0.80-2.20)';
            }
          }
          
          // Determine which Premix/Coal Dust columns have data
          const hasPremix = table5Data.some(row => 
            (row.premixKgs && row.premixKgs !== '-') || 
            (row.premixPercent && row.premixPercent !== '-')
          );
          const hasCoalDust = table5Data.some(row => 
            (row.coalDustKgs && row.coalDustKgs !== '-') || 
            (row.coalDustPercent && row.coalDustPercent !== '-')
          );
          
          // Determine which Compactability/Strength columns have data
          const hasLC = table5Data.some(row => row.lc && row.lc !== '-');
          const hasCompactabilitySettings = table5Data.some(row => row.compactabilitySettings && row.compactabilitySettings !== '-');
          const hasMouldStrength = table5Data.some(row => row.mouldStrength && row.mouldStrength !== '-');
          const hasShearStrength = table5Data.some(row => row.shearStrengthSetting && row.shearStrengthSetting !== '-');
          
          return (
          <div className="reusable-table-container">
            <table className="reusable-table table-template table-bordered" style={{ minWidth: '4000px' }}>
              <thead>
                {/* Main Header Row */}
                <tr style={{ height: '50px' }}>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>S.No</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Time</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mix No</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Permeability<br/>(90-160)</th>
                  {hasGcsFdyA && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>GCS Fdy A<br/>Gm/cm²<br/>(Min 1800)</th>
                  )}
                  {hasGcsFdyB && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>GCS Fdy B<br/>Gm/cm²<br/>(Min 1900)</th>
                  )}
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>WTS N/cm²<br/>(Min 0.15)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Moisture<br/>(3.0-4.0%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>(33-40%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compressibility<br/>(20-28%)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Water<br/>L/Kg</th>
                  <th colSpan={3} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Sand Temp °C (Max 45)</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>New Sand Kgs<br/>(0.0-5.0)</th>
                  {hasBentoniteWithPremix && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite with Premix</th>
                  )}
                  {hasBentonite && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Bentonite{bentoniteRange}</th>
                  )}
                  {hasPremix && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Premix (0.60-1.20)</th>
                  )}
                  {hasCoalDust && (
                    <th colSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', borderBottom: '1px solid #ddd' }}>Coal Dust (0.28-0.70)</th>
                  )}
                  {hasLC && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>LC</th>
                  )}
                  {hasCompactabilitySettings && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Compactability<br/>Settings<br/>(SMC42)</th>
                  )}
                  {hasMouldStrength && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Mould<br/>Strength<br/>(SMC23)</th>
                  )}
                  {hasShearStrength && (
                    <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Shear Strength<br/>Setting<br/>(At15)</th>
                  )}
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Prepared Sand<br/>Lumps/Kg</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Item Name</th>
                  <th rowSpan={2} style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1.0625rem', color: '#1e293b', verticalAlign: 'middle' }}>Remarks</th>
                </tr>
                {/* Sub-Header Row */}
                <tr style={{ height: '40px' }}>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>BC</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>WU</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>SSU</th>
                  {hasBentoniteWithPremix && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                  {hasBentonite && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                  {hasPremix && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                  {hasCoalDust && (
                    <>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Kgs</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>%</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {table5Data.map((row, index) => (
                  <tr key={index} style={{ height: '50px', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ textAlign: 'center', padding: '10px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{row.sno}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.time || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.mixNo || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.permeability || '-'}</td>
                    {hasGcsFdyA && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.gcsFdyA || '-'}</td>
                    )}
                    {hasGcsFdyB && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.gcsFdyB || '-'}</td>
                    )}
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.wts || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.moisture || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.compactability || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.compressibility || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.waterLitre || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.sandTempBC || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.sandTempWU || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.sandTempSSU || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.newSandKgs || '-'}</td>
                    {hasBentoniteWithPremix && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentoniteWithPremixKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentoniteWithPremixPercent || '-'}</td>
                      </>
                    )}
                    {hasBentonite && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentoniteKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.bentonitePercent || '-'}</td>
                      </>
                    )}
                    {hasPremix && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.premixKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.premixPercent || '-'}</td>
                      </>
                    )}
                    {hasCoalDust && (
                      <>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.coalDustKgs || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.coalDustPercent || '-'}</td>
                      </>
                    )}
                    {hasLC && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.lc || '-'}</td>
                    )}
                    {hasCompactabilitySettings && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.compactabilitySettings || '-'}</td>
                    )}
                    {hasMouldStrength && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.mouldStrength || '-'}</td>
                    )}
                    {hasShearStrength && (
                      <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.shearStrengthSetting || '-'}</td>
                    )}
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.preparedSandlumps || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.itemName || '-'}</td>
                    <td style={{ textAlign: 'left', padding: '10px', fontSize: '0.95rem', color: '#334155' }}>{row.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          );
        })()}
      </div>
      </div>


    </div>
  );
};

export default SandTestingRecordReport;