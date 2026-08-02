// HTTP layer only: read the request, call a service, shape the response.
// No Prisma import, no try/catch (asyncHandler forwards rejections to the
// global handler in server.js), no business rules.

const processService = require('../services/processService');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeRow, serializeRows } = require('../utils/serialize');

// GET /api/v1/process
//
// `from`, `to` and `disa` are all optional. With none supplied this returns
// every entry, which is what the current report page expects — it fetches the
// whole table and filters client-side. The filters exist so the frontend can
// adopt them later without another backend change.
exports.getAllEntries = asyncHandler(async (req, res) => {
    const { from, to, disa } = req.query;
    const entries = await processService.listEntries({ from, to, disa });
    const data = serializeRows(entries);

    res.status(200).json({ success: true, count: data.length, data });
});

// GET /api/v1/process/part-names
// `data` must be an array of plain STRINGS — the form calls pn.toUpperCase()
// on each element.
exports.getPartNames = asyncHandler(async (req, res) => {
    const partNames = await processService.listPartNames();
    res.status(200).json({ success: true, count: partNames.length, data: partNames });
});

// GET /api/v1/process/check?date=&disa=
// Read side of the primary lock. usePrimaryLock branches on `exists`.
exports.checkDateDisaEntries = asyncHandler(async (req, res) => {
    const { date, disa } = req.query;
    const result = await processService.checkPrimary({ date, disa });

    res.status(200).json({
        success: true,
        ...result,
        lastEntry: serializeRow(result.lastEntry),
    });
});

// POST /api/v1/process/save-primary
// Write side of the primary lock. Idempotent.
exports.savePrimary = asyncHandler(async (req, res) => {
    const { date, disa } = req.body ?? {};
    const result = await processService.savePrimary({ date, disa });

    res.status(200).json({ success: true, ...result });
});

// POST /api/v1/process
//
// Returns the created entry. The old controller returned the entire date
// document (every entry for that day) and split 200/201 between append and
// create; the frontend reads only `data.success`, so this is simpler and
// always 201.
exports.createEntry = asyncHandler(async (req, res) => {
    const entry = await processService.createEntry(req.body ?? {}, req.user.id);

    res.status(201).json({
        success: true,
        data: serializeRow(entry),
        message: 'Process record saved successfully.',
    });
});

// PUT /api/v1/process/:id
// Partial: only the keys present in the body are written.
exports.updateEntry = asyncHandler(async (req, res) => {
    const entry = await processService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({
        success: true,
        data: serializeRow(entry),
        message: 'Process entry updated successfully.',
    });
});

// DELETE /api/v1/process/:id — admin only, enforced by middleware.
exports.deleteEntry = asyncHandler(async (req, res) => {
    await processService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'Process entry deleted successfully.' });
});
