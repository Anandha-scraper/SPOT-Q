// Parses "45s"/"30min"/"1h"/"2d" or plain seconds into milliseconds; see backend.md.
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
function getEditWindowMs() {
    if (!process.env.EDIT_TIME) {
        throw new Error('EDIT_TIME env var is required (e.g. "1h", "30min", "3600").');
    }
    return parseDurationMs(process.env.EDIT_TIME);
}

module.exports = { parseDurationMs, getEditWindowMs };
