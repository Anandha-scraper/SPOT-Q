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
  defaultAlign = 'left'
}) => {
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
            {renderActions && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
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
                        textAlign: col.align || defaultAlign,
                        fontWeight: col.bold ? 600 : 'normal',
                        color: col.bold ? '#334155' : '#475569'
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