// ============================================================================
// REUSABLE EXCEL EXPORT UTILITY
// ----------------------------------------------------------------------------
// Builds a styled .xlsx (yellow header theme) from a column definition + rows
// and triggers a browser download. The file is only handed to the browser
// building, no partial / broken file is produced.
//
// Usage:
//   await exportToExcel({
//     title: 'Process Control Report',
//     fromDate: '2026-01-01',           // 'YYYY-MM-DD' (or '' / same as toDate)
//     toDate:   '2026-02-15',
//     columns: [{ header, key, width?, value?: (row) => any }],
//     rows: [...],
//     fileName: 'Process_Control_Report',
//     sheetName: 'Report',
//   });
// ============================================================================

// Yellow theme colours
const HEADER_FILL = 'FFFFD966';   // header row fill (warm yellow)
const TITLE_FILL = 'FFFFF2CC';    // title / range rows fill (light yellow)
const BORDER_COLOR = 'FFBFA130';  // muted gold border

const thinBorder = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

// Display a 'YYYY-MM-DD' (or date-ish) value as 'dd / mm / yyyy'
const displayDate = (d) => {
  if (!d) return '-';
  try {
    const iso = typeof d === 'string' ? d.split('T')[0] : d;
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return String(d);
    return `${String(dt.getDate()).padStart(2, '0')} / ${String(dt.getMonth() + 1).padStart(2, '0')} / ${dt.getFullYear()}`;
  } catch {
    return String(d);
  }
};

const safeFileName = (name) => String(name || 'report').replace(/[^a-z0-9_-]+/gi, '_');

// Maximum span (in days) allowed for a single export — ~2 months.
export const MAX_EXPORT_DAYS = 62;

const toLocalYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Resolve the effective export range from the popup's raw values.
// - `to`   defaults to today.
// - `from` defaults to the first day of the previous calendar month relative to `to`
//   (e.g. to = 06/06/26 -> from = 01/05/26), giving the "last 2 months" default.
export const getExportRange = (rawFrom, rawTo) => {
  const to = rawTo || toLocalYMD(new Date());
  let from = rawFrom;
  if (!from) {
    const t = new Date(to);
    from = toLocalYMD(new Date(t.getFullYear(), t.getMonth() - 1, 1));
  }
  return { from, to };
};

// Sanitise a worksheet name to Excel's constraints: max 31 chars and none of
// the reserved characters : \ / ? * [ ].
const safeSheetName = (name) =>
  String(name || 'Sheet').replace(/[:\\/?*[\]]+/g, ' ').trim().slice(0, 31) || 'Sheet';

// Build a single worksheet (title row, date-range row, header, data rows) into
// `workbook`. Extracted so both the single-sheet `exportToExcel` and the
// multi-sheet `exportWorkbookToExcel` share identical rendering.
const buildSheet = (workbook, { sheetName = 'Report', title = 'Report', fromDate = '', toDate = '', columns = [], rows = [] }) => {
  if (!columns.length) throw new Error('buildSheet: no columns provided');

  // Continuous layout (no spacer): row 1 = title, row 2 = date range, then the
  // header starts immediately at row 3. When any column declares a `group`, the
  // header becomes two-tier: a merged group "topper" (row 3) over its sub-columns
  // (row 4). Otherwise a single header row (row 3) is used. The frozen split
  // follows the header.
  const hasGroups = columns.some((c) => c.group);
  const headerRows = hasGroups ? 2 : 1;
  const headerStartRow = 3;
  const firstDataRowNum = headerStartRow + headerRows; // 4 (flat) or 5 (grouped)

  const worksheet = workbook.addWorksheet(safeSheetName(sheetName), {
    views: [{ state: 'frozen', ySplit: firstDataRowNum - 1 }],
  });

  const colCount = columns.length;
  const lastColLetter = worksheet.getColumn(colCount).letter;

  // --- Row 1: Title (merged across all columns) ---
  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 15, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_FILL } };
  worksheet.getRow(1).height = 24;

  // --- Row 2: From / To date range (merged) ---
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  const rangeCell = worksheet.getCell('A2');
  const rangeText = fromDate
    ? `From: ${displayDate(fromDate)}     To: ${displayDate(toDate)}`
    : `Date: ${displayDate(toDate)}`;
  rangeCell.value = rangeText;
  rangeCell.font = { bold: true, size: 11, color: { argb: 'FF334155' } };
  rangeCell.alignment = { horizontal: 'center', vertical: 'middle' };
  rangeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITLE_FILL } };
  worksheet.getRow(2).height = 18;

  // --- Header (yellow theme) — starts at row 3, directly under the date range ---
  // Pass no `value` to style a cell without writing to it — important for the
  // sub-row slave of a vertical merge, where assigning `.value` would redirect to
  // (and overwrite) the merged master's header text.
  const styleHeaderCell = (cell, value) => {
    if (value !== undefined) cell.value = value;
    cell.font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.border = thinBorder;
  };
  const colLetter = (idx) => worksheet.getColumn(idx + 1).letter; // 0-based -> letter

  if (!hasGroups) {
    // --- Row 3: single header row ---
    const headerRow = worksheet.getRow(headerStartRow);
    columns.forEach((col, i) => styleHeaderCell(headerRow.getCell(i + 1), col.header));
    headerRow.height = 22;
  } else {
    // --- Rows 3 & 4: grouped two-tier header ---
    const topRowNum = headerStartRow;
    const subRowNum = headerStartRow + 1;
    const topRow = worksheet.getRow(topRowNum);
    const subRow = worksheet.getRow(subRowNum);

    let i = 0;
    while (i < columns.length) {
      const col = columns[i];
      if (!col.group) {
        // Standalone column — merge vertically across both header rows.
        const letter = colLetter(i);
        worksheet.mergeCells(`${letter}${topRowNum}:${letter}${subRowNum}`);
        styleHeaderCell(topRow.getCell(i + 1), col.header);
        styleHeaderCell(subRow.getCell(i + 1)); // style-only (no value) under the vertical merge
        i += 1;
      } else {
        // Grouped run — consecutive columns sharing the same group string.
        let j = i;
        while (j < columns.length && columns[j].group === col.group) j += 1;
        const firstLetter = colLetter(i);
        const lastLetter = colLetter(j - 1);
        worksheet.mergeCells(`${firstLetter}${topRowNum}:${lastLetter}${topRowNum}`);
        styleHeaderCell(topRow.getCell(i + 1), col.group);
        for (let k = i; k < j; k += 1) {
          styleHeaderCell(subRow.getCell(k + 1), columns[k].header);
        }
        i = j;
      }
    }
    topRow.height = 20;
    subRow.height = 20;
  }

  // --- Data rows (placed explicitly so the grouped header's 2nd row isn't overwritten) ---
  rows.forEach((row, r) => {
    const dataRow = worksheet.getRow(firstDataRowNum + r);
    columns.forEach((col, i) => {
      const cell = dataRow.getCell(i + 1);
      let val = col.value ? col.value(row) : row[col.key];
      if (val === undefined || val === null || val === '') val = '-';
      cell.value = val;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });
  });

  // --- Column widths ---
  columns.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = col.width || 18;
  });

  return worksheet;
};

// Write the workbook's buffer, then trigger a browser download. Kept separate so
// the file is only handed to the browser after the full buffer builds cleanly.
const downloadWorkbook = async (workbook, { fileName, fromDate, toDate }) => {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const datePart = fromDate ? `${fromDate}_to_${toDate}` : `${toDate}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(fileName)}_${datePart}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToExcel = async ({
  title = 'Report',
  fromDate = '',
  toDate = '',
  columns = [],
  rows = [],
  fileName = 'report',
  sheetName = 'Report',
}) => {
  if (!columns.length) throw new Error('exportToExcel: no columns provided');

  // Lazy-load exceljs so it stays out of the initial bundle (loaded on first download)
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SPOT-Q';
  workbook.created = new Date();

  buildSheet(workbook, { sheetName, title, fromDate, toDate, columns, rows });

  await downloadWorkbook(workbook, { fileName, fromDate, toDate });
};

// Multi-sheet variant: one worksheet (tab) per entry in `sheets`, all sharing the
// same title + date-range header rows. Sheets with no rows are skipped so blank
// tabs aren't produced; sheet names are sanitised and de-duplicated.
export const exportWorkbookToExcel = async ({
  title = 'Report',
  fromDate = '',
  toDate = '',
  fileName = 'report',
  sheets = [],
}) => {
  const populated = sheets.filter((s) => s && s.columns && s.columns.length && s.rows && s.rows.length);
  if (!populated.length) throw new Error('exportWorkbookToExcel: no sheets with data provided');

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SPOT-Q';
  workbook.created = new Date();

  // De-duplicate sanitised sheet names (Excel rejects duplicates).
  const usedNames = new Set();
  const uniqueName = (name) => {
    let base = safeSheetName(name);
    let candidate = base;
    let n = 2;
    while (usedNames.has(candidate.toLowerCase())) {
      const suffix = ` (${n})`;
      candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
      n += 1;
    }
    usedNames.add(candidate.toLowerCase());
    return candidate;
  };

  populated.forEach((sheet) => {
    buildSheet(workbook, {
      sheetName: uniqueName(sheet.sheetName),
      title: sheet.title || title,
      fromDate,
      toDate,
      columns: sheet.columns,
      rows: sheet.rows,
    });
  });

  await downloadWorkbook(workbook, { fileName, fromDate, toDate });
};

export default exportToExcel;
