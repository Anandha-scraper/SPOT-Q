const express = require('express');
const router = express.Router();
const { getAllEntries, createEntry } = require('../controllers/SandLab-FoundrySandTestingNote');

// `protect` and checkDepartmentAccess('Sand Lab') are applied at the mount
// site in server.js, not here. No /:id route — matches the original module.
// GET /date/:date is dropped: confirmed zero frontend callers, only
// GET /?startDate=&endDate= is ever used (including for a single date).

router.route('/')
    .get(getAllEntries)
    .post(createEntry);

module.exports = router;
