// Turns raw Mongoose errors into short, user-facing messages.
//
// Operators must never see internals like
//   'Process validation failed: entries.0.quantityOfMoulds: Cast to Number failed
//    for value "-" (type string) at path "quantityOfMoulds"'
// so anything we don't explicitly recognise collapses to GENERIC_MESSAGE. The
// `fields` array carries the offending schema keys; the frontend maps them back to
// the form's display labels.

// Neutral on purpose: sendError also backs the read handlers, not just saves.
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

// Schema paths arrive nested: 'entries.0.heatNo', 'primaries.0.entries.1.heatNo'.
// Only the leaf means anything to a user.
const leafField = (path) => String(path || '').split('.').pop();

const describeMongooseError = (error) => {
    if (error && error.name === 'ValidationError' && error.errors) {
        const fields = [...new Set(Object.values(error.errors).map(e => leafField(e.path)))];
        return {
            status: 400,
            message: `Invalid input for: ${fields.join(', ')}. Please check these fields and try again.`,
            fields
        };
    }

    if (error && error.name === 'CastError') {
        const field = leafField(error.path);
        const fields = field ? [field] : [];
        return {
            status: 400,
            message: field
                ? `Invalid input for: ${field}. Please check this field and try again.`
                : 'Invalid input. Please check your entries and try again.',
            fields
        };
    }

    if (error && error.code === 11000) {
        const fields = Object.keys(error.keyPattern || {});
        return {
            status: 409,
            message: 'A record for this date already exists.',
            fields
        };
    }

    return { status: 500, message: GENERIC_MESSAGE, fields: [] };
};

// Log the real error server-side, reply with the safe version.
const sendError = (res, error) => {
    console.error(error);
    const { status, message, fields } = describeMongooseError(error);
    return res.status(status).json({ success: false, message, fields });
};

module.exports = { describeMongooseError, sendError, GENERIC_MESSAGE };
