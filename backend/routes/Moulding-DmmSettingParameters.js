const express = require('express');
const router = express.Router();
const {
    getAllDMMSettings,
    getDMMSettingsByDate,
    createDMMSettings,
    updateDMMEntry,
    deleteDMMEntry,
    updateDMMMachineShift,
    clearDMMMachineShift,
    getCustomerNames
} = require('../controllers/Moulding-DmmSettingParameters');
const { authorizeEntry } = require('../middleware/entryAccess');
const { loadEntryForAuth, loadMachineShiftForAuth } = require('../services/dmmLogService');

// protect/checkDepartmentAccess('Moulding') apply at the server.js mount site. GET /search/customer is dropped (zero frontend callers).

router.get('/all', getAllDMMSettings);
router.get('/search/primary', getDMMSettingsByDate);
router.get('/customer-names', getCustomerNames);
router.post('/', createDMMSettings);

router.route('/:id')
    .put(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'edit' }), updateDMMEntry)
    .delete(authorizeEntry({ loadEntry: loadEntryForAuth, action: 'delete' }), deleteDMMEntry);

// Operator Name/Operated By live on the machine-shift row, not the parameter
// row above — a separate id space, hence its own :id route under /shift.
router.route('/shift/:id')
    .put(authorizeEntry({ loadEntry: loadMachineShiftForAuth, action: 'edit' }), updateDMMMachineShift)
    .delete(authorizeEntry({ loadEntry: loadMachineShiftForAuth, action: 'delete' }), clearDMMMachineShift);

module.exports = router;
