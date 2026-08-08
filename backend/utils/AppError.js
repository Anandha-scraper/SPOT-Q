// Thrown deliberately by the service layer; server.js trusts err.status and echoes err.message verbatim.

class AppError extends Error {
    constructor(status, message, { fields, details } = {}) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.expected = true; // marks a deliberate 4xx so the handler logs one line, not a stack trace
        if (fields) this.fields = fields;
        if (details) this.details = details;
    }
}

module.exports = { AppError };
