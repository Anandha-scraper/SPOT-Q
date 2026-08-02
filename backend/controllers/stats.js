// Per-day entry statistics for the profile "Activity" charts.
//
// - getEntryStats: per-user, per-day counts across the logged-in user's
//   department for a given month.
// - getAdminEntryStats: cross-department, per-day counts (all authors) for the
//   admin "Department Entry Trends" chart.
//
// STUB: every department has migrated to Prisma (see INFO.md's Changelog),
// and this file has not been rewritten against the new repositories/ modules
// yet, so both handlers below always return zero-filled data — enough for the
// frontend to render an empty chart rather than error. Unmounted from
// server.js until that rewrite happens (tracked in INFO.md's Open items):
// per-day counts across all thirteen repositories/ modules, mounted at
// /api/v1/entry-stats.

// Resolve year/month (1-based) + daysInMonth from the request query, defaulting
// to the current calendar month.
const resolvePeriod = (req) => {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    return { year, month, daysInMonth };
};

// Zero-filled { day, count } series for every day of the month.
const emptyCounts = (daysInMonth) =>
    Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 }));

// Per-user, per-day entry counts for the current user's department.
exports.getEntryStats = async (req, res) => {
    try {
        const { year, month, daysInMonth } = resolvePeriod(req);

        // Sand Lab is table-based — the frontend renders a placeholder instead
        // of a chart, so there is nothing to aggregate.
        if (req.user.department === 'Sand Lab') {
            return res.status(200).json({ success: true, data: null });
        }

        res.status(200).json({
            success: true,
            data: { year, month, daysInMonth, counts: emptyCounts(daysInMonth) },
        });
    } catch (error) {
        console.error('Entry Stats Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch entry statistics' });
    }
};

// Admin-only: per-day entry counts across every graphable department/form
// (all authors — no per-user filter).
exports.getAdminEntryStats = async (req, res) => {
    try {
        const { year, month, daysInMonth } = resolvePeriod(req);

        res.status(200).json({
            success: true,
            data: { year, month, daysInMonth, departments: [] },
        });
    } catch (error) {
        console.error('Admin Entry Stats Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch entry statistics' });
    }
};
