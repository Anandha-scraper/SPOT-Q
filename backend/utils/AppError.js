// Errors thrown deliberately by the service layer.
//
// The global handler in server.js trusts `err.status` and echoes `err.message`
// verbatim — that is safe only because these messages are written for
// operators. Anything without a `status` is treated as unexpected and its
// message is never echoed (see utils/prismaError.js).

class AppError extends Error {
    /**
     * @param {number} status  HTTP status to send.
     * @param {string} message Operator-facing text. Safe to display.
     * @param {{fields?: string[], details?: object}} [opts]
     *        `fields` — offending form keys; the frontend maps them to labels.
     *        `details` — extra top-level response keys, e.g. { isTokenExpired: true }.
     */
    constructor(status, message, { fields, details } = {}) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        // Marks a 4xx the app raised on purpose, so the handler logs a one-line
        // warning instead of a full stack trace.
        this.expected = true;
        if (fields) this.fields = fields;
        if (details) this.details = details;
    }
}

module.exports = { AppError };
