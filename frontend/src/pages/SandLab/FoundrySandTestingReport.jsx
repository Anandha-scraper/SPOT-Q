import React, { useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { DatePicker, FilterButton, ClearButton } from '../../Components/Buttons';
import '../../styles/PageStyles/Sandlab/FoundarySandTestingNoteReport.css';

const FoundrySandTestingReport = () => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const handleFilter = () => {
    // TODO: Implement filter logic
    console.log('Filtering from:', fromDate, 'to:', toDate);
  };

  const handleClearFilter = () => {
    setFromDate(null);
    setToDate(null);
  };

  return (
    <div className="page-wrapper">
      <div className="foundry-sand-report-header">
        <div className="foundry-sand-report-header-text">
          <h2>
            <BookOpenCheck size={28} style={{ color: '#5B9AA9' }} />
            Foundry Sand Testing Note - Report
          </h2>
        </div>
      </div>

      <div className="foundry-sand-filter-container">
        <div className="foundry-sand-filter-group">
          <label>Start Date</label>
          <DatePicker
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="Select start date"
          />
        </div>
        <div className="foundry-sand-filter-group">
          <label>End Date</label>
          <DatePicker
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="Select end date"
          />
        </div>
        <FilterButton onClick={handleFilter} disabled={!fromDate}>
          Filter
        </FilterButton>
        <ClearButton onClick={handleClearFilter} disabled={!fromDate && !toDate}>
          Clear
        </ClearButton>
      </div>
    </div>
  );
};

export default FoundrySandTestingReport;
