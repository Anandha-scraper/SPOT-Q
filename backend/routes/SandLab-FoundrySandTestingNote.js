const express = require('express');
const router = express.Router();
const { getAllEntries, createEntry } = require('../controllers/SandLab-FoundrySandTestingNote');

// protect/checkDepartmentAccess('Sand Lab') apply at the server.js mount site. GET /date/:date is dropped (zero frontend callers); only GET /?startDate=&endDate= is used.

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

module.exports = router;
