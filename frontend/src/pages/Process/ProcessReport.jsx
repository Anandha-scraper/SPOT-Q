import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { DatePicker, FilterButton, ClearButton } from '../../Components/Buttons';
import Loader from '../../Components/Loader';
import '../../styles/PageStyles/Process/ProcessReport.css';

const ProcessReport = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const cardsPerPage = 24; // 6 per row × 4 rows

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/v1/process', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        // Filter out empty entries - only include entries with actual data
        const entriesWithData = (data.data || []).filter(item => {
          // An entry has data if at least one of these key fields is filled
          return item.partName || 
                 item.datecode || 
                 item.heatcode || 
                 item.quantityOfMoulds ||
                 item.metalCompositionC ||
                 item.metalCompositionSi ||
                 item.timeOfPouring ||
                 item.pouringTemperature;
        });
        setItems(entriesWithData);
        setFilteredItems(entriesWithData);
      }
    } catch (error) {
      console.error('Error fetching process records:', error);
    } finally {
      setLoading(false);
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

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      } else {
        return itemDate.getTime() === start.getTime();
      }
    });

    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredItems(items);
    setCurrentPage(1);
  };

  // Group items by date AND DISA (each DISA gets its own card)
  const groupedByDateAndDisa = filteredItems.reduce((acc, item) => {
    const date = item.date || 'No Date';
    const disa = item.disa || 'Unknown DISA';
    const key = `${date}_${disa}`;
    
    if (!acc[key]) {
      acc[key] = {
        date,
        disa,
        entries: []
      };
    }
    acc[key].entries.push(item);
    return acc;
  }, {});

  // Convert to array and sort by date (desc) then by DISA (asc)
  const dateCards = Object.values(groupedByDateAndDisa)
    .sort((a, b) => {
      // First sort by date (descending)
      if (a.date === 'No Date') return 1;
      if (b.date === 'No Date') return -1;
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Then sort by DISA (ascending) for same date
      return a.disa.localeCompare(b.disa);
    })
    .map(group => ({
      date: group.date,
      disa: group.disa,
      entries: group.entries,
      count: group.entries.length
    }));

  // Pagination
  const totalPages = Math.ceil(dateCards.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = dateCards.slice(startIndex, endIndex);

  const handleCardClick = (dateData) => {
    navigate('/process/report/entries', { 
      state: { 
        date: dateData.date,
        disa: dateData.disa,
        entries: dateData.entries 
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No Date') return 'No Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="process-report-header">
        <div className="process-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Process Control - Report
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
        <>
          {currentCards.length === 0 ? (
            <div className="process-no-records">
              <p>No records found</p>
            </div>
          ) : (
            <>
              <div className="process-cards-grid">
                {currentCards.map((card) => (
                  <div 
                    key={`${card.date}_${card.disa}`} 
                    className="process-card"
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="process-card-date">
                      {formatDate(card.date)}
                    </div>
                    <div className="process-card-disa">
                      <span className="process-card-label">DISA:</span>
                      <span className="process-card-value">{card.disa}</span>
                    </div>
                    <div className="process-card-entries">
                      <span className="process-card-count">{card.count}</span>
                      <span className="process-card-text">Entries</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="process-pagination">
                  <button 
                    className="process-pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  
                  <div className="process-pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`process-pagination-page ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button 
                    className="process-pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}


    </>
  );
};

export default ProcessReport;
