import React from 'react';
import '../styles/ComponentStyles/Table.css';

const Table = ({ 
  columns = [], 
  data = [], 
  renderActions = null,
  noDataMessage = 'No records found',
  minWidth = 1400,
  striped = false,
  headerGradient = false,
  defaultAlign = 'left',
  groupByColumn = null // Column key to group by (e.g., 'date')
}) => {
  // Calculate rowspans for grouped column
  const calculateRowspans = () => {
    if (!groupByColumn) return {};
    
    const rowspans = {};
    let currentGroup = null;
    let groupStart = 0;
    
    data.forEach((item, index) => {
      const groupValue = item[groupByColumn];
      
      if (groupValue !== currentGroup) {
        // New group started
        if (currentGroup !== null) {
          // Set rowspan for previous group
          rowspans[groupStart] = index - groupStart;
        }
        currentGroup = groupValue;
        groupStart = index;
      }
      
      // Handle last group
      if (index === data.length - 1) {
        rowspans[groupStart] = index - groupStart + 1;
      }
    });
    
    return rowspans;
  };

  const rowspans = calculateRowspans();

  return (
    <div className="reusable-table-container">
      <table 
        className={`reusable-table ${striped ? 'table-striped' : ''} ${headerGradient ? 'table-gradient-header' : ''}`}
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th 
                key={col.key || index}
                style={{
                  width: col.width || 'auto',
                  textAlign: col.align || 'left'
                }}
              >
                {col.label}
              </th>
            ))}
            {renderActions && <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (renderActions ? 1 : 0)} 
                className="reusable-table-no-records"
              >
                {noDataMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr key={item._id || item.id || rowIndex}>
                {columns.map((col, colIndex) => {
                  // Check if this column should be grouped and if this row should be skipped
                  const isGroupedColumn = groupByColumn && col.key === groupByColumn;
                  const shouldSkip = isGroupedColumn && !rowspans[rowIndex];
                  
                  if (shouldSkip) {
                    return null; // Skip this cell (merged with cell above)
                  }
                  
                  const value = col.render 
                    ? col.render(item, rowIndex) 
                    : item[col.key];
                  
                  const rowSpan = isGroupedColumn ? rowspans[rowIndex] : 1;
                  
                  return (
                    <td 
                      key={col.key || colIndex}
                      rowSpan={rowSpan}
                      style={{
                        textAlign: col.align || defaultAlign,
                        fontWeight: col.bold ? 600 : 'normal',
                        color: col.bold ? '#334155' : '#475569',
                        verticalAlign: 'middle'
                      }}
                    >
                      {value !== undefined && value !== null ? value : '-'}
                    </td>
                  );
                })}
                {renderActions && (
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons-group">
                      {renderActions(item, rowIndex)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;