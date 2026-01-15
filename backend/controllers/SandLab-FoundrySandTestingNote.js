const FoundrySandTestingNote = require('../models/SandLab-FoundrySandTestingNote');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM SYNC **/

exports.initializeTodayEntry = async () => {
    // Skip initialization - FoundrySandTestingNote documents require 'shift' and 'sandPlant' fields
    // Documents will be created via createEntry when actual data is provided
    return;
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const entries = await FoundrySandTestingNote.find(query).sort({ date: -1 });
        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 3. CORE LOGIC (Smart Upsert) **/

exports.createEntry = async (req, res) => {
    try {
        const { date, shift, section, ...otherData } = req.body;
        
        if (!date || !shift) {
            return res.status(400).json({ success: false, message: 'Date and Shift are required.' });
        }

        // 1. Find or create the daily batch
        const document = await ensureDateDocument(FoundrySandTestingNote, date);

        // 2. Locate the specific shift record or prepare a new one
        // Note: Assuming your model has an array of entries per shift or you store shift-specific data
        // For this refactor, we match your logic of Date + Shift as a primary key
        let record = await FoundrySandTestingNote.findOne({ 
            date: document.date, 
            shift: String(shift).trim() 
        });

        if (!record) {
            record = new FoundrySandTestingNote({ date: document.date, shift: String(shift).trim() });
        }

        // 3. SMART MERGE: Use Object.assign for the specific section
        // This removes 150 lines of "if (section === ...)" code
        if (section === 'primary') {
            Object.assign(record, otherData);
        } else if (otherData[section]) {
            // Merges clayTests, sieveTesting, parameters, or additionalData dynamically
            record[section] = { ...record[section], ...otherData[section] };
        } else {
            // Fallback for general updates
            Object.assign(record, otherData);
        }

        await record.save();

        res.status(200).json({ 
            success: true, 
            data: record, 
            message: 'Note updated successfully.' 
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. STANDARD CRUD **/

exports.updateEntry = async (req, res) => {
    try {
        const entry = await FoundrySandTestingNote.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await FoundrySandTestingNote.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Entry deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};