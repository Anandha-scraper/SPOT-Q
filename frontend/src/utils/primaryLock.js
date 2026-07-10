import { useCallback, useEffect, useRef, useState } from 'react';

// Primary-data lock shared by the entry forms that key their document on
// Date + DISA (Process, MicroTensile, MicroStructure).
//
// Until that pair is saved, every downstream input is disabled. Clicking a
// disabled input nudges the user back to the primary section.
//
// All user-facing feedback funnels through a single `status` value, so exactly
// one message is ever on screen — the states are mutually exclusive rather than
// four independent booleans that can overlap.

export const PRIMARY_STATUS = {
  idle: null,
  checking: { message: 'Fetching Date, Disa', variant: 'primary' },
  unsaved: { message: 'Save Combination', variant: 'primary' },
  saving: { message: 'Fetching Date, Disa', variant: 'primary' },
  added: { message: 'Combination Added', variant: 'success' },
  found: { message: 'Combination Found', variant: 'success' },
  warning: { message: 'Save Date, Disa', variant: 'danger' },
  error: { message: 'Technical error. Please try again.', variant: 'danger' }
};

const MIN_DWELL_MS = 1000;   // keep "Fetching…" visible long enough to read
const REVEAL_MS = 1500;      // how long "Combination Found/Added" shows before unlocking
const WARNING_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {object}   opts
 * @param {string}   opts.endpoint          department base URL (API_ENDPOINTS.process, …)
 * @param {string}   opts.date              current formData.date
 * @param {string}   opts.disa              current formData.disa
 * @param {boolean}  opts.isPrimarySaved    persisted lock flag from DepartmentContext
 * @param {Function} opts.setIsPrimarySaved
 * @param {Function} opts.setEntryCount
 * @param {object}   opts.primarySectionRef ref scrolled into view on a locked-input click
 * @param {string}   opts.formGroupClass    CSS class of a field wrapper, e.g. 'process-form-group'
 * @param {Function} [opts.onSaved]         called after the primary locks (focus the first field)
 *
 * @returns {{ status: string, highlightPrimaryFields: boolean, savePrimary: Function }}
 */
export function usePrimaryLock({
  endpoint,
  date,
  disa,
  isPrimarySaved,
  setIsPrimarySaved,
  setEntryCount,
  primarySectionRef,
  formGroupClass,
  onSaved
}) {
  const [status, setStatus] = useState('idle');
  const [highlightPrimaryFields, setHighlightPrimaryFields] = useState(false);

  // Monotonic id: only the newest date/disa request may write state. Without it
  // the 1s dwell and the 1.5s reveal can land after the user has already moved
  // on to another combination (or after unmount).
  const requestId = useRef(0);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => () => clearTimers(), []);

  // Latest values, read by the callbacks below without re-subscribing.
  const latest = useRef({ onSaved, setIsPrimarySaved, setEntryCount });
  latest.current = { onSaved, setIsPrimarySaved, setEntryCount };

  // Does a document already exist for this Date + DISA?
  useEffect(() => {
    const id = ++requestId.current;
    clearTimers();

    if (!date || !disa) {
      setIsPrimarySaved(false);
      setEntryCount(0);
      setStatus('idle');
      return;
    }

    const check = async () => {
      setStatus('checking');
      const startedAt = Date.now();

      try {
        const response = await fetch(
          `${endpoint}/check?date=${date}&disa=${encodeURIComponent(disa)}`,
          { method: 'GET', credentials: 'include' }
        );
        const data = await response.json();

        await sleep(Math.max(0, MIN_DWELL_MS - (Date.now() - startedAt)));
        if (id !== requestId.current) return;

        if (data.success && data.exists) {
          setStatus('found');
          later(() => {
            if (id !== requestId.current) return;
            setStatus('idle');
            latest.current.setIsPrimarySaved(true);
            latest.current.setEntryCount(data.count || 0);
          }, REVEAL_MS);
        } else {
          // Nothing saved yet — prompt for it instead of showing nothing.
          setIsPrimarySaved(false);
          setEntryCount(0);
          setStatus('unsaved');
        }
      } catch {
        if (id !== requestId.current) return;
        setStatus('error');
      }
    };

    check();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, date, disa]);

  const savePrimary = useCallback(async () => {
    if (!date || !disa) return;
    if (status === 'checking' || status === 'saving' || status === 'found' || status === 'added') return;

    const id = ++requestId.current;
    clearTimers();
    setStatus('saving');
    const startedAt = Date.now();

    try {
      const response = await fetch(`${endpoint}/save-primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, disa })
      });
      const data = await response.json();

      await sleep(Math.max(0, MIN_DWELL_MS - (Date.now() - startedAt)));
      if (id !== requestId.current) return;

      if (!data.success) {
        setStatus('error');
        return;
      }

      setStatus('added');
      later(() => {
        if (id !== requestId.current) return;
        setStatus('idle');
        latest.current.setIsPrimarySaved(true);
        latest.current.setEntryCount(data.count || 0);
        latest.current.onSaved?.();
      }, REVEAL_MS);
    } catch {
      if (id !== requestId.current) return;
      setStatus('error');
    }
  }, [endpoint, date, disa, status]);

  // Clicking any disabled input (or its label/wrapper) while the primary is
  // unlocked scrolls back to the primary section and flags it.
  useEffect(() => {
    if (isPrimarySaved) return undefined;

    const onMouseDown = (e) => {
      const group = e.target.closest?.(`.${formGroupClass}`);
      if (!group) return;
      const input = group.querySelector('input, select, textarea');
      if (!input || !input.disabled) return;

      e.preventDefault();
      e.stopPropagation();

      setStatus('warning');
      setHighlightPrimaryFields(true);
      primarySectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      later(() => {
        setStatus((s) => (s === 'warning' ? 'unsaved' : s));
        setHighlightPrimaryFields(false);
      }, WARNING_MS);
    };

    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrimarySaved, formGroupClass]);

  return { status, highlightPrimaryFields, savePrimary };
}
