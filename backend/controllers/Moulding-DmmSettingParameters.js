const DMM = require('../models/Moulding-DmmSettingParameters');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    // Skip initialization - DMM documents require 'machine' field
    // Documents will be created via createDMMSettings when actual data is provided
    return;
};

/** 2. DATA RETRIEVAL **/

exports.getDMMSettingsByDate = async (req, res) => {
    try {
        const { date, machine } = req.query;
        if (!date || !machine) return res.status(400).json({ success: false, message: 'Date and Machine required.' });

        const document = await DMM.findOne({ date: new Date(date), machine: String(machine).trim() });
        res.status(200).json({ success: true, data: document ? [document] : [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 3. CORE LOGIC (Smart Sectional Update) **/

exports.createDMMSettings = async (req, res) => {
    try {
        const { date, machine, section, ...payload } = req.body;
        
        // Find or create based on unique Date + Machine combination
        let record = await DMM.findOne({ date: new Date(date), machine: String(machine).trim() });
        if (!record) {
            record = new DMM({ 
                date: new Date(date), 
                machine: String(machine).trim(),
                shifts: { shift1: {}, shift2: {}, shift3: {} },
                parameters: { shift1: [], shift2: [], shift3: [] }
            });
        }

        // Sectional Logic
        if (section === 'operation') {
            // Update Shift Operator/Checker Info
            if (payload.shifts) {
                Object.keys(payload.shifts).forEach(key => {
                    if (record.shifts[key]) Object.assign(record.shifts[key], payload.shifts[key]);
                });
            }
        } 
        else if (['shift1', 'shift2', 'shift3'].includes(section)) {
            // Add a new Parameter entry to the specific shift array
            const shiftData = payload.parameters?.[section];
            if (shiftData) {
                const nextSNo = (record.parameters[section].length || 0) + 1;
                record.parameters[section].push({ ...shiftData, sNo: nextSNo });
            }
        }

        await record.save();
        res.status(200).json({ success: true, data: record, message: `${section} recorded successfully.` });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. SEARCH & ANALYTICS **/

exports.getDMMSettingsByCustomer = async (req, res) => {
    try {
        const { customer } = req.query;
        // Search across all three shift arrays for a specific customer
        const results = await DMM.find({
            $or: [
                { 'parameters.shift1.customer': customer },
                { 'parameters.shift2.customer': customer },
                { 'parameters.shift3.customer': customer }
            ]
        }).sort({ date: -1 });

        res.status(200).json({ success: true, count: results.length, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Standard CRUD for general updates/deletes
exports.updateDMMSettings = async (req, res) => {
    try {
        const entry = await DMM.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};