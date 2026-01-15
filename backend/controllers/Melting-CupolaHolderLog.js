const CupolaHolderLog = require('../models/Melting-CupolaHolderLog');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. DATA RETRIEVAL **/

exports.getPrimaryByDate = async (req, res) => {
    try {
        const { date, shift, holderNumber } = req.params;
        const hNo = parseInt(holderNumber);

        // Find specific log by triple-key: Date, Shift, and Holder
        const entry = await CupolaHolderLog.findOne({ 
            date: new Date(date), 
            shift: shift, 
            holderno: hNo 
        });

        res.status(200).json({
            success: true,
            data: entry ? {
                _id: entry._id,
                date: entry.date,
                shift: entry.shift,
                holderNumber: entry.holderno.toString(),
                heatNo: entry.heatNo || ''
            } : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllEntries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const entries = await CupolaHolderLog.find(query).sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 2. CORE LOGIC (Smart Upsert) **/

exports.createEntry = async (req, res) => {
    try {
        const { date, shift, holderNumber, holderno, ...payload } = req.body;
        const hNo = parseInt(holderNumber || holderno);

        if (!date || !shift || !hNo) {
            return res.status(400).json({ success: false, message: 'Date, Shift, and Holder No are required.' });
        }

        // 1. Normalize Date
        const dateObj = new Date(date);
        dateObj.setUTCHours(0, 0, 0, 0);

        // 2. Find or Create
        let entry = await CupolaHolderLog.findOne({ date: dateObj, shift, holderno: hNo });

        if (entry) {
            // DEEP MERGE: Update nested objects (tapping, electrical, etc.) without losing existing sub-fields
            Object.keys(payload).forEach(key => {
                if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
                    entry[key] = { ...entry[key], ...payload[key] };
                } else {
                    entry[key] = payload[key];
                }
            });
            await entry.save();
        } else {
            // CREATE NEW
            entry = await CupolaHolderLog.create({ date: dateObj, shift, holderno: hNo, ...payload });
        }

        res.status(entry.isNew ? 201 : 200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 3. STANDARD CRUD **/

exports.updateEntry = async (req, res) => {
    try {
        const entry = await CupolaHolderLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!entry) return res.status(404).json({ success: false, message: 'Log not found' });
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await CupolaHolderLog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Log deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};