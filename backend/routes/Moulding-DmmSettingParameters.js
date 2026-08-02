const express = require('express');
const router = express.Router();
const {
    getAllDMMSettings,
    getDMMSettingsByDate,
    createDMMSettings
} = require('../controllers/Moulding-DmmSettingParameters');

// `protect` and checkDepartmentAccess('Moulding') are applied at the mount
// site in server.js, not here. No /:id route — matches the original module.
// GET /search/customer is dropped: confirmed zero frontend callers.

router.get('/all', getAllDMMSettings);
router.get('/search/primary', getDMMSettingsByDate);
router.post('/', createDMMSettings);

module.exports = router;
