// Forwards a rejected promise to Express's error handler.
//
// Express 4 does not catch async rejections, which is why every handler in the
// old controllers/auth.js carried its own try/catch — and why distinct failures
// all collapsed into the same generic 500. Wrapping instead lets controllers
// stay branch-free and lets services throw AppError with a real status.
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
