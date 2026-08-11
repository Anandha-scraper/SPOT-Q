const express = require('express');
const router = express.Router();
const {
    getAllDMMSettings,
    getDMMSettingsByDate,
    createDMMSettings,
    updateDMMEntry,
    deleteDMMEntry
} = require('../controllers/Moulding-DmmSettingParameters');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth } = require('../services/dmmLogService');

// protect/checkDepartmentAccess('Moulding') apply at the server.js mount site. GET /search/customer is dropped (zero frontend callers).

router.get('/all', getAllDMMSettings);
router.get('/search/primary', getDMMSettingsByDate);
router.post('/', createDMMSettings);

router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateDMMEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteDMMEntry);

module.exports = router;
