const express = require('express');
const router = express.Router();
const {
    getPrimaryByDate,
    filterByDateRange,
    createTableEntry,
    createOrUpdatePrimary,
    updateEntry,
    deleteEntry,
    updatePrimary,
    deletePrimary,
    backfillPrimaryOwners
} = require('../controllers/Melting-MeltingLogsheet');
const { authorizeEntry } = require('../middleware/entryAccess');
const { checkAdminAccess } = require('../middleware/access');
const { loadEntryForAuth, loadPrimaryForAuth } = require('../services/meltingLogService');

// `protect` and checkDepartmentAccess('Melting') are applied at the mount site
// in server.js, not here.

router.get('/filter', filterByDateRange);
router.get('/primary/:date', getPrimaryByDate);
router.post('/primary', createOrUpdatePrimary);
router.post('/table-update', createTableEntry);

// Primary edit is creator-within-edit-window (same as entries), now that a
// primary carries createdBy — rows saved before that migration have a null
// createdBy and stay admin-only, same as the DMM/Cupola precedent. Delete
// stays admin-only unconditionally (authorizeEntry enforces that for every
// `action: 'delete'` regardless of ownerless), and cascades the primary's
// entries via the DB's onDelete: Cascade FK.
router.route('/primary/:id')
    .put(authorizeEntry({ loadEntry: loadPrimaryForAuth, action: 'edit' }), updatePrimary)
    .delete(authorizeEntry({ loadEntry: loadPrimaryForAuth, action: 'delete' }), deletePrimary);

router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

// One-off repair, admin-only regardless of department (checkAdminAccess, not
// checkDepartmentAccess) — was previously a CLI-only script; see backend.md.
router.post('/admin/backfill-primary-owners', checkAdminAccess, backfillPrimaryOwners);

module.exports = router;
