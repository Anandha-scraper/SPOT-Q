import React, { useState, useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FilterButton, ClearButton } from '../../Components/Buttons';
import CustomDatePicker from '../../Components/CustomDatePicker';
import '../../styles/PageStyles/Moulding/DisamaticProductReport.css';

const DisamaticProductReport = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    fetchCurrentDateAndEntries();
  }, []);

  const fetchCurrentDateAndEntries = async () => {
    setLoading(true);
    setError('');
    try {
      // Get today's date in local timezone (YYYY-MM-DD format)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      setCurrentDate(todayStr);

      // TODO: Replace with actual API endpoint when backend is ready
      // const response = await fetch(`/api/v1/disamatic-product/by-date?date=${todayStr}`, {
      //   credentials: 'include'
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setEntries(data.data || []);
      // }
      
      // Temporary: Set empty entries
      setEntries([]);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      if (endDate) {
        params.append('endDate', endDate);
      }

      // TODO: Replace with actual API endpoint when backend is ready
      // const response = await fetch(`/api/v1/disamatic-product/filter?${params.toString()}`, {
      //   credentials: 'include'
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setEntries(data.data || []);
      // }
      
      // Temporary: Set empty entries
      setEntries([]);
    } catch (error) {
      console.error('Error filtering entries:', error);
      setError('Failed to filter entries');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    fetchCurrentDateAndEntries();
  };

  const formatDate = (dateStr) => {
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
    <div className="page-wrapper">
      <div className="disamatic-report-header">
        <div className="disamatic-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Disamatic Product - Report
          </h2>
        </div>
        <div aria-label="Date" style={{ fontWeight: 600, color: '#25424c' }}>
          {currentDate ? `DATE : ${formatDate(currentDate)}` : 'Loading...'}
        </div>
      </div>

      {/* Filter Section */}
      <div className="disamatic-filter-container">
        <div className="disamatic-filter-group">
          <label>Start Date</label>
          <CustomDatePicker
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="disamatic-filter-group">
          <label>End Date</label>
          <CustomDatePicker
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Select end date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!startDate || loading}>
          {loading ? 'Loading...' : 'Filter'}
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!startDate && !endDate}>
          Clear
        </ClearButton>
      </div>

      {/* Content Area */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading entries...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          No entries found for {startDate ? 'the selected date range' : 'today'}.
        </div>
      ) : (
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <p>Found {entries.length} entries</p>
          {/* TODO: Add table or list view for entries */}
        </div>
      )}
    </div>
  );
};

export default DisamaticProductReport;
