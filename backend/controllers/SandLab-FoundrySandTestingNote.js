const FoundrySandTestingNote = require('../models/SandLab-FoundrySandTestingNote');

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

exports.getEntriesByDate = async (req, res) => {
    try {
        const { date } = req.params;
        
        // Parse the date string (format: YYYY-MM-DD)
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        
        // Find all entries for this specific date
        const entries = await FoundrySandTestingNote.find({ date: dateObj }).sort({ shift: 1 });
        
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching records by date.' });
    }
};

/** 3. CORE LOGIC (Smart Upsert) **/

exports.createEntry = async (req, res) => {
    try {
        const { date, shift, section, sandPlant, ...otherData } = req.body;
        
        if (!date || !shift) {
            return res.status(400).json({ success: false, message: 'Date and Shift are required.' });
        }

        // Parse date to ensure consistent format
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

        // Find existing record by date and shift
        let record = await FoundrySandTestingNote.findOne({ 
            date: dateObj, 
            shift: String(shift).trim() 
        });

        if (!record) {
            // For new records, sandPlant is required
            if (!sandPlant) {
                return res.status(400).json({ success: false, message: 'Sand Plant is required for new entries.' });
            }
            record = new FoundrySandTestingNote({ 
                date: dateObj, 
                shift: String(shift).trim(),
                sandPlant: sandPlant
            });
        }

        // 3. SMART MERGE: Use Object.assign for the specific section
        if (section === 'primary') {
            // Update primary fields including sandPlant
            Object.assign(record, { sandPlant, ...otherData });
        } else if (otherData[section]) {
            // Merges clayTests, sieveTesting, parameters, or additionalData dynamically
            record[section] = { ...record[section], ...otherData[section] };
            // Also update sandPlant if provided (to handle updates)
            if (sandPlant) record.sandPlant = sandPlant;
        } else {
            // Fallback for general updates
            Object.assign(record, { sandPlant, ...otherData });
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