const express = require('express');
const router = express.Router();
const dmmController = require('../controllers/Moulding-DmmSettingParameters');

router.get('/search/primary', dmmController.getDMMSettingsByDate); 
router.get('/search/customer', dmmController.getDMMSettingsByCustomer);
router.post('/', dmmController.createDMMSettings);
router.route('/:id')
    .put(dmmController.updateDMMSettings);

module.exports = router;