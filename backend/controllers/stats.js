// Per-day entry statistics for the profile "Activity" chart.
//
// TEMPLATE: returns a zero-filled series for the requested month so the
// frontend Chart.js bar chart renders end-to-end. The real implementation
// will aggregate per-day `createdBy === req.user._id` counts across this
// user's department collection.
exports.getEntryStats = async (req, res) => {
    try {
        const now = new Date();
        const year = parseInt(req.query.year, 10) || now.getFullYear();
        // month is 1-based in the query; default to the current calendar month.
        const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

        // Days in the requested month (day 0 of next month = last day of this one).
        const daysInMonth = new Date(year, month, 0).getDate();

        // TODO: aggregate real per-day entry counts for req.user across the
        // department's collection(s). For now, zero-fill so the chart shows an
        // empty-but-valid month.
        const counts = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            count: 0
        }));

        res.status(200).json({
            success: true,
            data: { year, month, daysInMonth, counts }
        });
    } catch (error) {
        console.error('Entry Stats Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch entry statistics' });
    }
};
