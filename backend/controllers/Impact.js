const Impact = require('../models/Impact');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

// 1. SYSTEM INITIALIZATION & METADATA

// Initialize current date entry on server startup
exports.initializeTodayEntry = async () => {
    try {
        const todayString = getCurrentDate();
        await ensureDateDocument(Impact, todayString);
    } catch (error) {
        console.error('Error initializing today\'s Impact document:', error.message);
    }
};

// Get current date from server (ensures timezone consistency)
exports.getCurrentDate = async (req, res) => {
    try {
        const todayString = getCurrentDate();
        await ensureDateDocument(Impact, todayString);

        res.status(200).json({ success: true, date: todayString });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching current date.' });
    }
};

// Get validation schema for frontend
exports.getValidationSchema = async (req, res) => {
    try {
        const schema = {
            partName: { type: 'string', required: true, label: 'Part Name', placeholder: 'e.g: Crankshaft' },
            dateCode: { 
                type: 'string', 
                required: true, 
                pattern: /^[0-9][A-Z][0-9]{2}$/, 
                patternMessage: 'Format: 1 digit, 1 uppercase letter, 2 digits (e.g: 6F25)', 
                label: 'Date Code' 
            },
            specificationVal: { type: 'number', required: true, label: 'Specification Value' },
            specificationConstraint: { type: 'string', required: false, label: 'Specification Constraint' },
            observedValue: { 
                type: 'string', 
                required: true, 
                pattern: /^[0-9]+(\s*,\s*[0-9]+)?$/, 
                patternMessage: 'Format: numbers separated by comma (e.g: 12 or 34,45)', 
                label: 'Observed Value' 
            },
            remarks: { type: 'string', required: false, maxLength: 80, label: 'Remarks' }
        };
        res.status(200).json({ success: true, schema });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching validation schema.' });
    }
};

// 2. DATA RETRIEVAL & REPORTING

exports.getGroupedByDate = async (req, res) => {
    try {
        const documents = await Impact.find().select('date entries').sort({ date: -1 });
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

        const document = await ensureDateDocument(Impact, date);
        res.status(200).json({ success: true, count: document.entries.length, data: document.entries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching entries.' });
    }
};

// 3. CRUD OPERATIONS (Array Manipulation)

exports.createEntry = async (req, res) => {
    try {
        const { date, partName, dateCode, specification, observedValue, remarks } = req.body;
        if (!date || !partName || !dateCode || !specification || observedValue == null) {
            return res.status(400).json({ success: false, message: 'Required fields missing.' });
        }

        const document = await ensureDateDocument(Impact, date);
        
        const newEntry = { partName, dateCode, specification, observedValue, remarks: remarks || '' };
        document.entries.push(newEntry);
        await document.save();

        res.status(201).json({ success: true, data: document.entries[document.entries.length - 1] });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Impact.findOne({ 'entries._id': id });
        if (!document) return res.status(404).json({ success: false, message: 'Entry not found.' });

        const entry = document.entries.id(id);
        Object.assign(entry, req.body); // Efficiently updates fields present in req.body

        await document.save();
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Impact.findOne({ 'entries._id': id });
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

        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const start = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0, 0));
        
        let end = new Date(start);
        if (endDate) {
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
            end = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59, 999));
        } else {
            end.setUTCHours(23, 59, 59, 999);
        }

        const documents = await Impact.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });

        // Flatten documents into a single array of entries with their parent date
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(entry => ({ ...entry.toObject(), date: doc.date }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error filtering entries.' });
    }
};