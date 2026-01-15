import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import '../styles/ComponentStyles/CustomDatePicker.css';

const CustomDatePicker = forwardRef(({ value, onChange, max, style, name, onKeyDown, disabled }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [showYearList, setShowYearList] = useState(false);
  const [showMonthList, setShowMonthList] = useState(false);
  
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const yearDragRef = useRef(null);
  const monthDragRef = useRef(null);
  const yearListRef = useRef(null);
  const monthListRef = useRef(null);

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const maxDate = max ? new Date(max) : new Date();

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setViewDate(new Date(value));
    } else {
      setSelectedDate('');
      setViewDate(new Date());
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const newDate = new Date(year, month, day);
    
    // Check if date is not in future
    if (newDate <= maxDate) {
      const formatted = formatDate(newDate);
      setSelectedDate(formatted);
      if (onChange) {
        const event = { target: { name, value: formatted } };
        onChange(event);
      }
      setIsOpen(false);
    }
  };

  const changeMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    
    if (newDate <= maxDate || direction < 0) {
      setViewDate(newDate);
    }
  };

  const changeYear = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() + direction);
    
    if (newDate <= maxDate || direction < 0) {
      setViewDate(newDate);
    }
  };

  const selectYear = (year) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setShowYearList(false);
  };

  const selectMonth = (monthIndex) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    setShowMonthList(false);
  };

  const selectToday = () => {
    const today = new Date();
    const formatted = formatDate(today);
    setSelectedDate(formatted);
    setViewDate(today);
    if (onChange) {
      const event = { target: { name, value: formatted } };
      onChange(event);
    }
    setIsOpen(false);
  };

  const getYearList = () => {
    const currentYear = viewDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    const years = [];
    
    // Show 100 years before current and up to max year
    const startYear = Math.max(1900, currentYear - 100);
    const endYear = maxYear;
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    
    return years;
  };

  const getMonthList = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  // Auto-scroll to selected year when list opens
  useEffect(() => {
    if (showYearList && yearListRef.current) {
      const selectedYearElement = yearListRef.current.querySelector('.year-item.selected');
      if (selectedYearElement) {
        selectedYearElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showYearList]);

  // Auto-scroll to selected month when list opens
  useEffect(() => {
    if (showMonthList && monthListRef.current) {
      const selectedMonthElement = monthListRef.current.querySelector('.month-item.selected');
      if (selectedMonthElement) {
        selectedMonthElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showMonthList]);

  // Fast wheel scrolling for years
  const handleYearWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 1 : -1;
    changeYear(delta);
  };

  // Fast wheel scrolling for months
  const handleMonthWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 1 : -1;
    changeMonth(delta);
  };

  const handleYearClick = () => {
    setShowYearList(!showYearList);
    setShowMonthList(false);
  };

  const handleMonthClick = () => {
    setShowMonthList(!showMonthList);
    setShowYearList(false);
  };


  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = selectedDate && currentDate.toDateString() === new Date(selectedDate).toDateString();
      const isFuture = currentDate > maxDate;
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isFuture ? 'disabled' : ''}`}
          onClick={() => !isFuture && handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="calendar-popup">
        <div className="calendar-header">
              <div className="calendar-nav">
                <div 
                  className={`month-year-display ${showMonthList ? 'active' : ''}`}
                  ref={monthDragRef}
                  onClick={handleMonthClick}
                >
                  <span className="month-text">{monthNames[month]}</span>
                </div>
              </div>
              <div className="calendar-nav">
                <div 
                  className={`month-year-display ${showYearList ? 'active' : ''}`}
                  ref={yearDragRef}
                  onClick={handleYearClick}
                >
                  <span className="year-text">{year}</span>
                </div>
              </div>
            </div>

        {showYearList && (
          <div className="year-list-container" ref={yearListRef}>
            <div className="year-list">
              {getYearList().map(y => (
                <div
                  key={y}
                  className={`year-item ${y === year ? 'selected' : ''}`}
                  onClick={() => selectYear(y)}
                >
                  {y}
                </div>
              ))}
            </div>
          </div>
        )}

        {showMonthList && (
          <div className="month-list-container" ref={monthListRef}>
            <div className="month-list">
              {getMonthList().map((m, index) => (
                <div
                  key={m}
                  className={`month-item ${index === month ? 'selected' : ''}`}
                  onClick={() => selectMonth(index)}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        )}

        {!showYearList && !showMonthList && (
          <>
            <div className="calendar-weekdays">
              {dayNames.map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {days}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="custom-date-picker" ref={pickerRef}>
      <div className="date-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={formatDisplayDate(selectedDate)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={onKeyDown}
          placeholder="e.g: DD/MM/YYYY"
          readOnly
          disabled={disabled}
          style={{ ...style, ...(disabled ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed', opacity: 0.8 } : {}) }}
          className="date-input"
        />
        <span className="calendar-icon" onClick={() => !disabled && setIsOpen(!isOpen)} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>📅</span>
      </div>
      {isOpen && renderCalendar()}
    </div>
  );
});

CustomDatePicker.displayName = 'CustomDatePicker';

export default CustomDatePicker;

