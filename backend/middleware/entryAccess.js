// Per-entry edit/delete authorisation for Prisma-backed department modules.
//
// The Prisma replacement for the old Mongoose middleware/editWindow.js
// (deleted once the last department using it, Melting Log Sheet, migrated).
// Two things differed from it:
//   - ownership is a plain string compare, not ObjectId `.equals()` (which
//     throws TypeError on a uuid string);
//   - there is no `req.targetDoc`. With real tables the controller updates the
//     row directly instead of mutating a parent document and calling .save().
//
// Every response string below stayed byte-identical to editWindow.js's, so
// each migration changed nothing operators could see.

const { getEditWindowMs } = require('../utils/duration');

/**
 * @param {object}   options
 * @param {Function} options.loadEntry  (id) => Promise<{id, createdBy, createdAt}|null>
 * @param {'edit'|'delete'} options.action
 *
 * Rules:
 *   'delete' — admins only, always. Ownership and the edit window are irrelevant.
 *   'edit'   — admins may edit anything; a non-admin may edit only an entry they
 *              created, and only within EDIT_TIME of its createdAt.
 *
 * On success attaches `req.targetEntry`.
 */
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
                // String compare, not ObjectId.equals(). req.user carries both
                // `id` and `_id` (see middleware/auth.js), and createdBy is a
                // scalar uuid column.
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
