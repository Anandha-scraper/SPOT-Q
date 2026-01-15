const QcProduction = require('../models/QcProduction');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    // Skip initialization - QcProduction documents must be created with all required fields
    // Documents will be created via createEntry when actual data is provided
    return;
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const documents = await QcProduction.find().sort({ date: -1 });
        // Flatten entries for the "Production History" table
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(e => ({ ...e.toObject(), date: doc.date }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching history.' });
    }
};

/** 3. CORE OPERATIONS **/

exports.createEntry = async (req, res) => {
    try {
        const { date, ...entryData } = req.body;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

        const document = await ensureDateDocument(QcProduction, date);
        document.entries.push(entryData);
        await document.save();

        res.status(201).json({ 
            success: true, 
            data: document.entries[document.entries.length - 1],
            message: 'Entry added to production log.' 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await QcProduction.findOne({ 'entries._id': id });
        if (!document) return res.status(404).json({ success: false, message: 'Entry not found.' });

        const entry = document.entries.id(id);
        Object.assign(entry, req.body); // Syncs all chemistry/mechanical fields
        await document.save();

        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await QcProduction.findOne({ 'entries._id': id });
        if (document) {
            document.entries.pull(id);
            await document.save();
        }
        res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};