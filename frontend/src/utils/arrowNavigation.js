import { useCallback, useRef } from 'react';

const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// Native inputs whose own arrow handling (segment/value editing) we must not hijack.
const NATIVE_ARROW_TYPES = ['date', 'time', 'datetime-local', 'month', 'week'];

const TEXT_LIKE_TYPES = ['text', 'search', 'url', 'tel', 'password', 'email'];

const isVisible = (el) => {
  if (el.disabled) return false;
  // tabIndex={-1} is how readOnly-but-locked fields (e.g. Melting's primary
  // value fields) opt out of the native Tab order when `disabled` can't be
  // used — respect the same signal here so they're not arrow-reachable either.
  if (el.tabIndex === -1) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

const getNavigableElements = (container) =>
  Array.from(container.querySelectorAll('input, select, textarea')).filter(isVisible);

// Returns true when focus should move to a neighbouring control for this key.
// Returns false to let the control keep the keypress (caret movement / line movement).
const shouldNavigate = (el, key, shiftKey) => {
  const tag = el.tagName;
  const type = (el.type || '').toLowerCase();

  // Textarea: respect multi-line caret — only jump out at the very start/end.
  if (tag === 'TEXTAREA') {
    const { selectionStart: start, selectionEnd: end, value } = el;
    if (start == null || start !== end) return start !== end; // selection -> let native collapse
    if (key === 'ArrowUp' || key === 'ArrowLeft') return start === 0;
    return start === value.length; // ArrowDown / ArrowRight
  }

  // Text-like inputs: ←/→ only at the caret boundary; ↑/↓ always navigate.
  if (tag === 'INPUT' && TEXT_LIKE_TYPES.includes(type)) {
    if (key === 'ArrowUp' || key === 'ArrowDown') return true;
    const { selectionStart: start, selectionEnd: end, value } = el;
    if (start == null || start !== end) return start !== end;
    if (key === 'ArrowLeft') return start === 0;
    return start === value.length; // ArrowRight
  }

  // Selects: plain ↑/↓ navigate like every other field; Shift+↑/↓ cycles the
  // native option list instead — without the Shift gate, arrowing through a
  // mixed form gets stuck on every dropdown instead of moving past it.
  // ←/→ always navigate.
  if (tag === 'SELECT') {
    if (key === 'ArrowUp' || key === 'ArrowDown') return !shiftKey;
    return true;
  }

  // Number inputs (caret API unavailable): all arrows navigate.
  return true;
};

// Elements within this many px of vertical center of a row's first element
// are considered part of that same visual row. Generous enough to absorb
// minor height differences between <input>/<select>/custom pickers, tight
// enough not to merge genuinely different rows.
const ROW_TOLERANCE_PX = 14;

// Group navigable elements into visual rows (by rendered geometry, not DOM/CSS
// structure, so this works the same for CSS Grid rows and flex-wrap sub-rows
// nested inside one grid cell), then sort each row left-to-right. Recomputed
// on every keypress so dynamically disabled fields are naturally excluded.
const buildRows = (container) => {
  const items = getNavigableElements(container).map((el) => {
    const r = el.getBoundingClientRect();
    return { el, top: r.top, cx: r.left + r.width / 2 };
  });
  items.sort((a, b) => a.top - b.top);

  const rows = [];
  for (const item of items) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(item.top - row[0].top) <= ROW_TOLERANCE_PX) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }
  rows.forEach((row) => row.sort((a, b) => a.cx - b.cx));

  return rows;
};

const findRowCol = (rows, current) => {
  for (let r = 0; r < rows.length; r++) {
    const c = rows[r].findIndex((item) => item.el === current);
    if (c !== -1) return { r, c };
  }
  return null;
};

// Row-and-column aware navigation: Left/Right stay on the same row and wrap
// to the adjacent row's start/end at a boundary; Up/Down are restricted to
// the immediately adjacent row (picking its horizontally-nearest item) so a
// wide element (e.g. a full-width textarea) several rows away can never be
// picked over the field that is actually next.
const findNearest = (current, container, key) => {
  const rows = buildRows(container);
  const pos = findRowCol(rows, current);
  if (!pos) return null;
  const { r, c } = pos;
  const row = rows[r];

  if (key === 'ArrowRight') {
    if (c < row.length - 1) return row[c + 1].el;
    const nextRow = rows[r + 1];
    return nextRow ? nextRow[0].el : null;
  }

  if (key === 'ArrowLeft') {
    if (c > 0) return row[c - 1].el;
    const prevRow = rows[r - 1];
    return prevRow ? prevRow[prevRow.length - 1].el : null;
  }

  const targetRow = key === 'ArrowDown' ? rows[r + 1] : rows[r - 1];
  if (!targetRow) return null;

  const curX = row[c].cx;
  let best = null;
  let bestDist = Infinity;
  for (const item of targetRow) {
    const dist = Math.abs(item.cx - curX);
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }
  return best ? best.el : null;
};

// Attach containerRef/handleArrowKeyDown to a grid-style form's wrapper — see frontend.md for the row-clustering model.
export function useArrowNavigation() {
  const containerRef = useRef(null);

  const handleArrowKeyDown = useCallback((e) => {
    if (!NAV_KEYS.includes(e.key)) return;
    if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;

    const el = e.target;
    if (!el || !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return;

    // Leave native date/time segment editing alone.
    if (el.tagName === 'INPUT' && NATIVE_ARROW_TYPES.includes((el.type || '').toLowerCase())) return;

    // Suppress the native number-input spinner up-front (↑/↓ must only move focus), even at grid boundaries with no neighbour to navigate to.
    const isNumber = el.tagName === 'INPUT' && (el.type || '').toLowerCase() === 'number';
    if (isNumber && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
    }

    if (!shouldNavigate(el, e.key, e.shiftKey)) return;

    const container = containerRef.current || el.closest('form') || document.body;
    const next = findNearest(el, container, e.key);
    if (!next) return;

    e.preventDefault();
    next.focus();
    if (next.tagName !== 'SELECT' && typeof next.select === 'function') {
      try { next.select(); } catch { /* not all inputs support select() */ }
    }
  }, []);

  return { containerRef, handleArrowKeyDown };
}
