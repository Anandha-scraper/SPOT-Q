// Drives Components/alert.jsx's SaveSuccessOverlay: spinner while the request is
// in flight, then a check mark held long enough to actually register. See frontend.md.

import { useCallback, useEffect, useRef, useState } from 'react';

// Total visible time is at least this; a fast save still reads as confirmed.
export const SAVE_SUCCESS_MIN_MS = 1500;
// The tick needs this long to finish drawing, so it is never flashed and cut off.
const TICK_DWELL_MS = 900;

const CLOSED = { open: false, status: 'saving' };

export function useSaveSuccess({ minDurationMs = SAVE_SUCCESS_MIN_MS } = {}) {
  const [saveState, setSaveState] = useState(CLOSED);
  const timers = useRef([]);
  const alive = useRef(true);

  useEffect(() => () => {
    alive.current = false;
    timers.current.forEach(clearTimeout);
  }, []);

  const wait = (ms) => new Promise((resolve) => {
    timers.current.push(setTimeout(resolve, ms));
  });

  // `task` runs the actual save. Returning false (or throwing) means "failed" —
  // the overlay closes with no tick so the caller can surface its own error toast.
  const runSave = useCallback(async (task, { savingLabel, successLabel } = {}) => {
    setSaveState({ open: true, status: 'saving', savingLabel, successLabel });
    const startedAt = Date.now();

    try {
      const result = await task();
      if (result === false) {
        if (alive.current) setSaveState(CLOSED);
        return result;
      }

      const remaining = minDurationMs - (Date.now() - startedAt);
      if (alive.current) setSaveState({ open: true, status: 'success', savingLabel, successLabel });
      await wait(Math.max(remaining, TICK_DWELL_MS));
      if (alive.current) setSaveState(CLOSED);
      return result;
    } catch (error) {
      if (alive.current) setSaveState(CLOSED);
      throw error;
    }
  }, [minDurationMs]);

  return { saveState, runSave };
}
