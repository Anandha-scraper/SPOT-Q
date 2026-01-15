const MicroTensile = require('../models/MicroTensile');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    try {
        await ensureDateDocument(MicroTensile, getCurrentDate());
    } catch (error) {
        console.error('MicroTensile Initialization Error:', error.message);
    }
};

exports.getCurrentDate = async (req, res) => {
    try {
        const today = getCurrentDate();
        await ensureDateDocument(MicroTensile, today);
        res.status(200).json({ success: true, date: today });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server clock sync failed' });
    }
};

/** 2. DATA RETRIEVAL & REPORTING **/

exports.getGroupedByDate = async (req, res) => {
    try {
        const documents = await MicroTensile.find().select('date entries').sort({ date: -1 });
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

        const document = await ensureDateDocument(MicroTensile, date);
        res.status(200).json({ success: true, count: document.entries.length, data: document.entries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching entries.' });
    }
};

/** 3. CORE CRUD OPERATIONS **/

exports.createEntry = async (req, res) => {
    try {
        const { date, ...entryData } = req.body;
        // Centralized validation for metallurgical precision
        const required = ['item', 'dateCode', 'heatCode', 'barDia', 'maxLoad', 'tensileStrength'];
        for (let field of required) {
            if (!entryData[field]) return res.status(400).json({ success: false, message: `Field ${field} is missing.` });
        }

        const document = await ensureDateDocument(MicroTensile, date);
        document.entries.push(entryData);
        await document.save();

        res.status(201).json({ 
            success: true, 
            data: document.entries[document.entries.length - 1],
            message: 'MicroTensile entry recorded successfully.' 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await MicroTensile.findOne({ 'entries._id': id });
        if (!document) return res.status(404).json({ success: false, message: 'Entry not found.' });

        const entry = document.entries.id(id);
        Object.assign(entry, req.body); // Efficiently syncs all metallurgical fields
        
        await document.save();
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await MicroTensile.findOne({ 'entries._id': id });
        if (document) {
            document.entries.pull(id);
            await document.save();
        }
        res.status(200).json({ success: true, message: 'Entry deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 4. ADVANCED FILTERING (Reporting) **/

exports.filterEntries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate) return res.status(400).json({ success: false, message: 'Start date required.' });

        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const start = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0));
        
        let end = new Date(start);
        if (endDate) {
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
            end = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999));
        } else {
            end.setUTCHours(23, 59, 59, 999);
        }

        const documents = await MicroTensile.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });

        // Flattening for Excel/PDF Export compatibility
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(entry => ({ 
                ...entry.toObject(), 
                date: doc.date,
                formattedDate: doc.date.toISOString().split('T')[0] 
            }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Filter operation failed.' });
    }
};