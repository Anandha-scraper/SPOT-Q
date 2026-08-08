// Express 4 doesn't catch async rejections — wraps a handler so services can throw AppError with a real status.
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
