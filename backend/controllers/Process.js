const Process = require('../models/Process');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    try {
        await ensureDateDocument(Process, getCurrentDate());
    } catch (error) {
        console.error('Process initialization failed:', error.message);
    }
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        // Flattening all entries from all days into one list for the UI
        const documents = await Process.find().sort({ date: -1 });
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(e => ({ ...e.toObject(), date: doc.date }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching entries.' });
    }
};

/** 3. CORE LOGIC (Create or Update Entry) **/

exports.createEntry = async (req, res) => {
    try {
        const { date, heatCode, ...updateData } = req.body;

        if (!date || !heatCode) {
            return res.status(400).json({ success: false, message: 'Date and Heat Code are required.' });
        }

        const document = await ensureDateDocument(Process, date);

        // Check if an entry for this specific Heat already exists in today's array
        const existingEntryIndex = document.entries.findIndex(e => e.heatCode === heatCode);

        if (existingEntryIndex > -1) {
            // UPDATE: Merge new data into the existing entry
            Object.assign(document.entries[existingEntryIndex], updateData);
            await document.save();
            return res.status(200).json({
                success: true,
                data: document.entries[existingEntryIndex],
                message: 'Process record updated in daily log.'
            });
        }

        // CREATE: Push new entry if it doesn't exist
        document.entries.push({ heatCode, ...updateData });
        await document.save();

        res.status(201).json({
            success: true,
            data: document.entries[document.entries.length - 1],
            message: 'New process record added to daily log.'
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. SPECIFIC UPDATES & DELETIONS **/

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Process.findOne({ 'entries._id': id });

        if (!document) return res.status(404).json({ success: false, message: 'Record not found.' });

        const entry = document.entries.id(id);
        Object.assign(entry, req.body);
        await document.save();

        res.status(200).json({ success: true, data: entry, message: 'Updated successfully.' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Process.findOne({ 'entries._id': id });

        if (!document) return res.status(404).json({ success: false, message: 'Record not found.' });

        document.entries.pull(id);
        await document.save();

        res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};