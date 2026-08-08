const { getEditWindowMs } = require('../utils/duration');

// Prisma replacement for the old middleware/editWindow.js — same response strings, ownership is a plain string compare (not ObjectId.equals()).
function authorizeEntry({ loadEntry, action = 'edit' } = {}) {
    return async (req, res, next) => {
        try {
            const entry = await loadEntry(req.params.id);

            if (!entry) {
                return res.status(404).json({ success: false, message: 'Entry not found.' });
            }

            const isAdmin = req.user.role === 'admin' || req.user.department === 'Admin';

            if (action === 'delete') {
                if (!isAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: 'Only admins can delete entries.',
                    });
                }
            } else if (!isAdmin) {
                if (!entry.createdBy || String(entry.createdBy) !== String(req.user.id)) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only edit entries that you created.',
                    });
                }

                if (!entry.createdAt) {
                    return res.status(403).json({
                        success: false,
                        message: 'This entry can no longer be edited.',
                    });
                }

                const ageMs = Date.now() - new Date(entry.createdAt).getTime();
                if (ageMs > getEditWindowMs()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Edit window expired. This entry can no longer be edited.',
                    });
                }
            }

            req.targetEntry = entry;
            next();
        } catch (error) {
            console.error('entryAccess authorization error:', error);
            return res.status(500).json({ success: false, message: 'Authorization failed.' });
        }
    };
}

module.exports = { authorizeEntry };
