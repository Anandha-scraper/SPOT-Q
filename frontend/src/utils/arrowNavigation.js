import { useCallback, useRef } from 'react';

const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// Native inputs whose own arrow handling (segment/value editing) we must not hijack.
const NATIVE_ARROW_TYPES = ['date', 'time', 'datetime-local', 'month', 'week'];

const TEXT_LIKE_TYPES = ['text', 'search', 'url', 'tel', 'password', 'email'];

const isVisible = (el) => {
  if (el.disabled) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
};

const getNavigableElements = (container) =>
  Array.from(container.querySelectorAll('input, select, textarea')).filter(isVisible);

// Returns true when focus should move to a neighbouring control for this key.
// Returns false to let the control keep the keypress (caret movement / line movement).
const shouldNavigate = (el, key) => {
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

  // Number inputs (caret API unavailable) and selects: all arrows navigate.
  return true;
};

// Pick the nearest navigable element in the pressed direction, preferring alignment.
const findNearest = (current, container, key) => {
  const cur = current.getBoundingClientRect();
  const cx = cur.left + cur.width / 2;
  const cy = cur.top + cur.height / 2;

  let best = null;
  let bestScore = Infinity;

  for (const el of getNavigableElements(container)) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2;
    const dx = ex - cx;
    const dy = ey - cy;

    let inDirection;
    let forward;
    let cross;
    switch (key) {
      case 'ArrowUp':
        inDirection = dy < -1; forward = -dy; cross = Math.abs(dx); break;
      case 'ArrowDown':
        inDirection = dy > 1; forward = dy; cross = Math.abs(dx); break;
      case 'ArrowLeft':
        inDirection = dx < -1; forward = -dx; cross = Math.abs(dy); break;
      default: // ArrowRight
        inDirection = dx > 1; forward = dx; cross = Math.abs(dy); break;
    }
    if (!inDirection) continue;

    const score = cross * 2 + forward;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
};

/**
 * Spatial arrow-key navigation for grid-style entry forms.
 *
 * Attach the returned `containerRef` and `handleArrowKeyDown` to the form's
 * wrapper element. Bubbling delivers every field's arrow keypress to the single
 * handler, which moves focus to the control physically above/below/left/right.
 */
export function useArrowNavigation() {
  const containerRef = useRef(null);

  const handleArrowKeyDown = useCallback((e) => {
    if (!NAV_KEYS.includes(e.key)) return;
    if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;

    const el = e.target;
    if (!el || !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return;

    // Leave native date/time segment editing alone.
    if (el.tagName === 'INPUT' && NATIVE_ARROW_TYPES.includes((el.type || '').toLowerCase())) return;

    // Suppress the native number-input spinner: ↑/↓ must never change the value,
    // only move focus. Done up-front so it's killed even at grid boundaries where
    // no neighbouring control exists to navigate to.
    const isNumber = el.tagName === 'INPUT' && (el.type || '').toLowerCase() === 'number';
    if (isNumber && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
    }

    if (!shouldNavigate(el, e.key)) return;

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
