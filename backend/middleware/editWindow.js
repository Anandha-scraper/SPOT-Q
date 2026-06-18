const { getEditWindowMs } = require('../utils/duration');

// Resolve the target entry for a PUT/DELETE on /:id and authorize the requester.
//
// Authorization rules (by `action`):
//   - 'delete' : ADMINS ONLY (role === 'admin' OR department === 'Admin'). Non-admins
//                are always rejected, regardless of ownership or window.
//   - 'edit'   : admins may edit ANY entry at any time; a non-admin may edit only an
//                entry that THEY created (entry.createdBy === req.user._id) AND only
//                within the EDIT_TIME window measured from the entry's createdAt.
//
// `mode`:
//   - 'nested' : entry lives inside parent.entries[] (Process, Tensile,
//                MicroTensile, MicroStructure). Parent is found via the
//                sub-document _id; the sub-document is attached as req.targetEntry.
//   - 'deepNested' : entry lives two levels deep in parent.primaries[].entries[]
//                (Melting Log Sheet, Cupola Holder Log). The saveable parent
//                document is attached as req.targetDoc.
//   - 'flat'   : the document itself is the entry (QcProduction).
//
// On success it attaches `req.targetDoc` (the saveable mongoose document) and
// `req.targetEntry` (the entry sub-doc, or the doc itself in flat mode).
function resolveAndAuthorize(Model, { mode = 'nested', action = 'edit' } = {}) {
    return async (req, res, next) => {
        try {
            const { id } = req.params;

            let doc;
            let entry;

            if (mode === 'flat') {
                doc = await Model.findById(id);
                entry = doc;
            } else if (mode === 'deepNested') {
                doc = await Model.findOne({ 'primaries.entries._id': id });
                if (doc) {
                    for (const primary of doc.primaries) {
                        const found = primary.entries.id(id);
                        if (found) { entry = found; break; }
                    }
                }
            } else {
                doc = await Model.findOne({ 'entries._id': id });
                entry = doc ? doc.entries.id(id) : null;
            }

            if (!doc || !entry) {
                return res.status(404).json({ success: false, message: 'Entry not found.' });
            }

            const isAdmin = req.user.role === 'admin' || req.user.department === 'Admin';

            if (action === 'delete') {
                // Deleting is restricted to admins.
                if (!isAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: 'Only admins can delete entries.'
                    });
                }
            } else if (!isAdmin) {
                // Editing: non-admins may only edit their own entry within the window.
                if (!entry.createdBy || !entry.createdBy.equals(req.user._id)) {
                    return res.status(403).json({
                        success: false,
                        message: 'You can only edit entries that you created.'
                    });
                }

                // Must be within the edit window
                if (!entry.createdAt) {
                    return res.status(403).json({
                        success: false,
                        message: 'This entry can no longer be edited.'
                    });
                }

                const ageMs = Date.now() - new Date(entry.createdAt).getTime();
                if (ageMs > getEditWindowMs()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Edit window expired. This entry can no longer be edited.'
                    });
                }
            }

            req.targetDoc = doc;
            req.targetEntry = entry;
            next();
        } catch (error) {
            console.error('editWindow authorization error:', error);
            return res.status(500).json({ success: false, message: 'Authorization failed.' });
        }
    };
}

module.exports = { resolveAndAuthorize };
