const dmmLogService = require('../services/dmmLogService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.getDMMSettingsByDate = asyncHandler(async (req, res) => {
    const { date, machine, shift } = req.query;
    const data = await dmmLogService.getSettingsByDate({ date, machine, shift });

    res.status(200).json({ success: true, data });
});

exports.createDMMSettings = asyncHandler(async (req, res) => {
    const result = await dmmLogService.createSettings(req.body ?? {}, req.user.id);

    res.status(200).json({ success: true, message: result.message });
});

// `data` must be an array of plain strings — mirrors Disamatic's getComponentNames.
exports.getCustomerNames = asyncHandler(async (req, res) => {
    const names = await dmmLogService.listCustomerNames();
    res.status(200).json({ success: true, count: names.length, data: names });
});

exports.getAllDMMSettings = asyncHandler(async (req, res) => {
    const data = await dmmLogService.getAllSettings();

    res.status(200).json({ success: true, count: data.length, data });
});

exports.updateDMMEntry = asyncHandler(async (req, res) => {
    await dmmLogService.updateEntry(req.targetEntry.id, req.body);

    res.status(200).json({ success: true, message: 'DMM entry updated successfully.' });
});

exports.deleteDMMEntry = asyncHandler(async (req, res) => {
    await dmmLogService.deleteEntry(req.targetEntry.id);

    res.status(200).json({ success: true, message: 'DMM entry deleted successfully.' });
});

exports.updateDMMMachineShift = asyncHandler(async (req, res) => {
    await dmmLogService.updateMachineShift(req.targetEntry.id, req.body);

    res.status(200).json({ success: true, message: 'Operator info updated successfully.' });
});

// EntryActions always offers Delete to admins alongside Edit — this clears
// operatorName/checkedBy rather than deleting the DmmMachineShift row itself,
// since that row is also the parent of every parameter entry for this shift
// (onDelete: Cascade) and a real delete would wipe unrelated parameter data.
exports.clearDMMMachineShift = asyncHandler(async (req, res) => {
    await dmmLogService.updateMachineShift(req.targetEntry.id, { operatorName: '', checkedBy: '' });

    res.status(200).json({ success: true, message: 'Operator info cleared successfully.' });
});
