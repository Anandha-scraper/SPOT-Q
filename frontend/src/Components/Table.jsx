import React from 'react';
import '../styles/ComponentStyles/Table.css';

// Report mode (default) renders data against columns; template mode renders `rows` blank rows via renderCell — see frontend.md.
const Table = ({
  columns = [],
  data = [],
  rows = 0,
  renderActions = null,
  noDataMessage = 'No records found',
  minWidth = 1400,
  striped = false,
  headerGradient = false,
  defaultAlign = 'left',
  template = false,
  showHeader = true,
  bordered = false,
  renderCell = null,
  groupByColumn = null
}) => {
  const calculateRowspans = () => {
    if (!groupByColumn) return {};

    const rowspans = {};
    let currentGroup = null;
    let groupStart = 0;

    data.forEach((item, index) => {
      const groupValue = item[groupByColumn];

      if (groupValue !== currentGroup) {
        if (currentGroup !== null) {
          rowspans[groupStart] = index - groupStart;
        }
        currentGroup = groupValue;
        groupStart = index;
      }

      if (index === data.length - 1) {
        rowspans[groupStart] = index - groupStart + 1;
      }
    });

    return rowspans;
  };

  const rowspans = calculateRowspans();

  const tableClasses = [
    'reusable-table',
    striped && 'table-striped',
    headerGradient && 'table-gradient-header',
    template && 'table-template',
    bordered && 'table-bordered'
  ].filter(Boolean).join(' ');

  const templateData = template && rows > 0
    ? Array.from({ length: rows }, (_, i) => ({ _id: `empty-${i}` }))
    : data;

  const columnsArray = columns;

  return (
    <div className="reusable-table-container">
      <table
        className={tableClasses}
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
          {(template ? templateData : data).length === 0 ? (
            <tr>
              <td
                colSpan={columnsArray.length + (renderActions ? 1 : 0)}
                className="reusable-table-no-records"
              >
                {noDataMessage}
              </td>
            </tr>
          ) : (
            (template ? templateData : data).map((item, rowIndex) => (
              <tr key={item._id || item.id || rowIndex}>
                {columns.map((col, colIndex) => {
                  const isGroupedColumn = groupByColumn && col.key === groupByColumn;
                  const shouldSkip = isGroupedColumn && !rowspans[rowIndex];

                  if (shouldSkip) {
                    return null;
                  }

                  let value;
                  if (template && renderCell) {
                    value = renderCell(rowIndex, colIndex, col.key);
                  } else if (col.render) {
                    value = col.render(item, rowIndex);
                  } else {
                    value = item[col.key];
                  }

                  const rowSpan = isGroupedColumn ? rowspans[rowIndex] : 1;

                  return (
                    <td
                      key={col.key || colIndex}
                      rowSpan={rowSpan}
                      style={{
                        width: col.width || 'auto',
                        textAlign: col.align || defaultAlign,
                        fontWeight: col.bold ? 600 : 'normal',
                        color: col.bold ? '#334155' : '#475569',
                        verticalAlign: 'middle'
                      }}
                    >
                      {template ? (value || '') : (value !== undefined && value !== null ? value : '-')}
                    </td>
                  );
                })}
                {renderActions && (
                  <td style={{ width: '120px', textAlign: 'center' }}>
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
