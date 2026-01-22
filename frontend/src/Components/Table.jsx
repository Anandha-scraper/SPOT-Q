import React from 'react';
import '../styles/ComponentStyles/Table.css';

/**
 * Reusable Table Component
 * 
 * @param {Array} columns - Array of column definitions [{key, label, width, align, render}]
 * @param {Array} data - Array of data objects
 * @param {Function} renderActions - Optional function to render action buttons
 * @param {String} noDataMessage - Message when no data available
 * @param {Number} minWidth - Minimum table width in pixels
 */
const Table = ({ 
  columns = [], 
  data = [], 
  renderActions = null,
  noDataMessage = 'No records found',
  minWidth = 1400
}) => {
  return (
    <div className="reusable-table-container">
      <table className="reusable-table" style={{ minWidth: `${minWidth}px` }}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th 
                key={col.key || index}
                style={{
                  width: col.width || 'auto',
                  textAlign: col.align || 'center'
                }}
              >
                {col.label}
              </th>
            ))}
            {renderActions && <th style={{ width: '6%' }}>Actions</th>}
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
                  const value = col.render 
                    ? col.render(item, rowIndex) 
                    : item[col.key];
                  
                  return (
                    <td 
                      key={col.key || colIndex}
                      style={{
                        textAlign: col.align || 'center',
                        fontWeight: col.bold ? 600 : 'normal',
                        color: col.bold ? '#1e293b' : '#475569'
                      }}
                    >
                      {value !== undefined && value !== null ? value : '-'}
                    </td>
                  );
                })}
                {renderActions && (
                  <td>
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