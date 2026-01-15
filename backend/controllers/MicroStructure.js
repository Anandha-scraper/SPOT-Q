const MicroStructure = require('../models/MicroStructure');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION & METADATA **/

// Initialize current date entry on server startup
exports.initializeTodayEntry = async () => {
    try {
        await ensureDateDocument(MicroStructure, getCurrentDate());
    } catch (error) {
        console.error('Error initializing today\'s MicroStructure document:', error.message);
    }
};

// Get current date from server (ensures timezone consistency)
exports.getCurrentDate = async (req, res) => {
    try {
        const todayString = getCurrentDate();
        await ensureDateDocument(MicroStructure, todayString);
        res.status(200).json({ success: true, date: todayString });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching current date.' });
    }
};

/** 2. DATA RETRIEVAL & REPORTING **/

exports.getGroupedByDate = async (req, res) => {
    try {
        const documents = await MicroStructure.find().select('date entries').sort({ date: -1 });
        const grouped = documents.map(doc => ({
            date: doc.date.toISOString().split('T')[0],
            count: doc.entries.length,
            hasData: doc.entries.length > 0
        }));
        res.status(200).json({ success: true, count: grouped.length, data: grouped });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grouped dates.' });
    }
};

exports.getEntriesByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date required.' });

        const document = await ensureDateDocument(MicroStructure, date);
        res.status(200).json({ success: true, count: document.entries.length, data: document.entries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching entries.' });
    }
};

/** 3. CORE CRUD OPERATIONS **/

exports.createEntry = async (req, res) => {
    try {
        const { date, ...entryData } = req.body;
        
        // Basic mandatory field validation
        if (!date || !entryData.partName || !entryData.heatCode) {
            return res.status(400).json({ success: false, message: 'Date, Part Name, and Heat Code are required.' });
        }

        const document = await ensureDateDocument(MicroStructure, date);
        document.entries.push(entryData);
        await document.save();

        res.status(201).json({ 
            success: true, 
            data: document.entries[document.entries.length - 1],
            message: 'MicroStructure record added successfully.' 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await MicroStructure.findOne({ 'entries._id': id });
        if (!document) return res.status(404).json({ success: false, message: 'Record not found.' });

        const entry = document.entries.id(id);
        Object.assign(entry, req.body); // Dynamically updates all provided fields
        
        await document.save();
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await MicroStructure.findOne({ 'entries._id': id });
        if (document) {
            document.entries.pull(id);
            await document.save();
        }
        res.status(200).json({ success: true, message: 'Entry removed successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 4. ADVANCED FILTERING (History View) **/

exports.filterEntries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate) return res.status(400).json({ success: false, message: 'Start date required.' });

        // Logic to build UTC range
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const start = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0));
        
        let end = new Date(start);
        if (endDate) {
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
            end = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999));
        } else {
            end.setUTCHours(23, 59, 59, 999);
        }

        const documents = await MicroStructure.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });

        // Flatten entries while attaching the parent date for traceability
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(entry => ({ ...entry.toObject(), date: doc.date }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Filtering failed.' });
    }
};