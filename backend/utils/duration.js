// Parse a human-friendly duration string into milliseconds.
// Accepts plain seconds ("3600") or value+unit forms where the unit is one of
// s/sec, m/min, h/hr, d/day (e.g. "45s", "30min", "1h", "1hr", "2d").
// Returns `fallbackMs` (and logs a warning) when the input is missing or malformed.
const UNIT_MS = {
    s: 1000,
    sec: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    hr: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000
};

function parseDurationMs(value, fallbackMs) {
    if (value === undefined || value === null || value === '') {
        return fallbackMs;
    }

    const raw = String(value).trim().toLowerCase();

    // Plain number => seconds (matches how JWT_EXPIRE numeric values are treated)
    if (!isNaN(raw)) {
        return parseInt(raw, 10) * 1000;
    }

    const match = raw.match(/^(\d+)\s*(sec|min|hr|day|s|m|h|d)$/);
    if (!match) {
        console.warn(`Invalid duration format: "${value}". Falling back to default.`);
        return fallbackMs;
    }

    return parseInt(match[1], 10) * UNIT_MS[match[2]];
}

// Default edit window for non-admin users = 1 hour.
const DEFAULT_EDIT_WINDOW_MS = 60 * 60 * 1000;

function getEditWindowMs() {
    return parseDurationMs(process.env.EDIT_TIME, DEFAULT_EDIT_WINDOW_MS);
}

module.exports = { parseDurationMs, getEditWindowMs, DEFAULT_EDIT_WINDOW_MS };
