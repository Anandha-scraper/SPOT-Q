const express = require('express');
const router = express.Router();
const {
    getAllDMMSettings,
    getDMMSettingsByDate,
    createDMMSettings
} = require('../controllers/Moulding-DmmSettingParameters');

// protect/checkDepartmentAccess('Moulding') apply at the server.js mount site. GET /search/customer is dropped (zero frontend callers).

router.get('/all', getAllDMMSettings);
router.get('/search/primary', getDMMSettingsByDate);
router.post('/', createDMMSettings);

module.exports = router;
