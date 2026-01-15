const Tensile = require('../models/Tensile');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

// 1. SYSTEM INITIALIZATION & METADATA

// Initialize current date entry on server startup
exports.initializeTodayEntry = async () => {
    try {
        const todayString = getCurrentDate();
        await ensureDateDocument(Tensile, todayString);
    } catch (error) {
        console.error('Error initializing today\'s Tensile document:', error.message);
    }
};

// Get current date from server (ensures timezone consistency)
exports.getCurrentDate = async (req, res) => {
    try {
        const todayString = getCurrentDate();
        await ensureDateDocument(Tensile, todayString);

        res.status(200).json({ success: true, date: todayString });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching current date.' });
    }
};

// Get validation schema for frontend
exports.getValidationSchema = async (req, res) => {
    try {
        const schema = {
            item: { type: 'string', required: true, label: 'Item', placeholder: 'Enter item name' },
            dateCode: { 
                type: 'string', 
                required: true, 
                pattern: /^[0-9][A-Z][0-9]{2}$/, 
                patternMessage: 'Format: 1 digit, 1 uppercase letter, 2 digits (e.g: 6F25)', 
                label: 'Date Code' 
            },
            heatCode: { type: 'string', required: false, label: 'Heat Code' },
            dia: { type: 'number', required: false, label: 'Diameter' },
            lo: { type: 'number', required: false, label: 'Original Length (Lo)' },
            li: { type: 'number', required: false, label: 'Final Length (Li)' },
            breakingLoad: { type: 'number', required: false, label: 'Breaking Load' },
            yieldLoad: { type: 'number', required: false, label: 'Yield Load' },
            uts: { type: 'number', required: false, label: 'UTS' },
            ys: { type: 'number', required: false, label: 'YS' },
            elongation: { type: 'number', required: false, label: 'Elongation' },
            remarks: { type: 'string', required: false, maxLength: 200, label: 'Remarks' },
            testedBy: { type: 'string', required: false, label: 'Tested By' }
        };
        res.status(200).json({ success: true, schema });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching validation schema.' });
    }
};

// 2. DATA RETRIEVAL & REPORTING

exports.getGroupedByDate = async (req, res) => {
    try {
        const documents = await Tensile.find().select('date entries').sort({ date: -1 });
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

        const document = await ensureDateDocument(Tensile, date);
        res.status(200).json({ success: true, count: document.entries.length, data: document.entries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching entries.' });
    }
};

// 3. CRUD OPERATIONS

exports.createEntry = async (req, res) => {
    try {
        const { date, ...entryData } = req.body;
        if (!date || !entryData.item || !entryData.dateCode) {
            return res.status(400).json({ success: false, message: 'Item, Date, and Date Code are required.' });
        }

        const document = await ensureDateDocument(Tensile, date);
        document.entries.push(entryData);
        await document.save();

        res.status(201).json({ 
            success: true, 
            data: document.entries[document.entries.length - 1],
            message: 'Tensile entry created successfully.'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Tensile.findOne({ 'entries._id': id });
        if (!document) return res.status(404).json({ success: false, message: 'Entry not found.' });

        const entry = document.entries.id(id);
        Object.assign(entry, req.body); // Syncs all provided fields efficiently

        await document.save();
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Tensile.findOne({ 'entries._id': id });
        if (!document) return res.status(404).json({ success: false, message: 'Entry not found.' });

        document.entries.pull(id);
        await document.save();

        res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting entry.' });
    }
};

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

        const documents = await Tensile.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });

        // Flatten entries while preserving the parent date for traceability
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(entry => ({ ...entry.toObject(), date: doc.date }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error filtering entries.' });
    }
};