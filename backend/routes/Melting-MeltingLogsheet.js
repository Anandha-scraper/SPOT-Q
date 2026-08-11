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
    deletePrimary
} = require('../controllers/Melting-MeltingLogsheet');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth, loadPrimaryForAuth } = require('../services/meltingLogService');

// `protect` and checkDepartmentAccess('Melting') are applied at the mount site
// in server.js, not here.

router.get('/filter', filterByDateRange);
router.get('/primary/:date', getPrimaryByDate);
router.post('/primary', createOrUpdatePrimary);
router.post('/table-update', createTableEntry);

// A primary has no createdBy, so edit is `ownerless` (admin-only) rather than
// falling through to the ownership branch, which would claim a creator it can't have.
router.route('/primary/:id')
    .put(authorizeEntry({ loadEntry: loadPrimaryForAuth, action: 'edit', ownerless: true }), updatePrimary)
    .delete(authorizeEntry({ loadEntry: loadPrimaryForAuth, action: 'delete' }), deletePrimary);

router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteEntry);

module.exports = router;
