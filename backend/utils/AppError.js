//AppError carries the HTTP status code along with the message.
//"Something went wrong" + "How should HTTP respond?" -> 404 Not Found
class AppError extends Error {
    constructor(status, message, { fields, details } = {}) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.expected = true; 
        if (fields) this.fields = fields;
        if (details) this.details = details;
    }
}

module.exports = { AppError };
