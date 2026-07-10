const MicroTensile = require('../models/MicroTensile');
const { sendError } = require('../utils/mongooseError');
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

/** CHECK DATE+DISA ENTRIES COUNT **/
exports.checkDateDisaEntries = async (req, res) => {
    try {
        const { date, disa } = req.query;

        if (!date || !disa) {
            return res.status(400).json({ success: false, message: 'Date and DISA are required.' });
        }

        // Convert date string (YYYY-MM-DD) to Date object for proper matching
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        // Find document using date range to handle any timezone variations
        const document = await MicroTensile.findOne({ 
            date: { 
                $gte: startOfDay, 
                $lte: endOfDay 
            } 
        });

        if (!document) {
            return res.status(200).json({ success: true, exists: false, count: 0 });
        }

        // Check if this disa is in savedDisas array
        const exists = document.savedDisas && document.savedDisas.includes(disa);
        
        // Count entries for this specific disa
        const count = document.entries.filter(entry => entry.disa === disa).length;

        return res.status(200).json({ success: true, exists, count });
    } catch (error) {
        console.error('Error checking date+disa:', error);
        res.status(500).json({ success: false, message: 'Error checking entries.' });
    }
};

/** SAVE PRIMARY DATA (Date + DISA) **/
exports.savePrimary = async (req, res) => {
    try {
        const { date, disa } = req.body;

        console.log('savePrimary called with:', { date, disa });

        if (!date || !disa) {
            return res.status(400).json({ success: false, message: 'Date and DISA are required.' });
        }

        // Convert date string (YYYY-MM-DD) to Date object for proper matching
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        console.log('Date range:', { startOfDay, endOfDay });

        // Find document using date range to handle any timezone variations
        let document = await MicroTensile.findOne({ 
            date: { 
                $gte: startOfDay, 
                $lte: endOfDay 
            } 
        });

        console.log('Existing document:', document ? 'found' : 'not found');

        if (!document) {
            // Create new document with this disa in savedDisas
            console.log('Creating new document...');
            document = await MicroTensile.create({
                date: startOfDay,
                savedDisas: [disa],
                entries: []
            });
            console.log('Document created successfully');
        } else {
            // Add disa to savedDisas if not already present
            if (!document.savedDisas) {
                document.savedDisas = [];
            }
            if (!document.savedDisas.includes(disa)) {
                console.log('Adding disa to existing document...');
                document.savedDisas.push(disa);
                await document.save();
                console.log('Document updated successfully');
            }
        }

        // Count entries for this specific disa
        const count = document.entries.filter(entry => entry.disa === disa).length;

        return res.status(200).json({ 
            success: true, 
            count,
            message: 'Primary data saved successfully.' 
        });
    } catch (error) {
        console.error('Error saving primary (DETAILED):', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        res.status(500).json({ success: false, message: `Error saving primary data: ${error.message}` });
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
        console.log('createEntry called with body:', JSON.stringify(req.body, null, 2));
        
        const { date, ...entryData } = req.body;
        
        // Centralized validation for metallurgical precision (including disa)
        const required = ['disa', 'item', 'dateCode', 'heatCode', 'barDia', 'gaugeLength', 'maxLoad', 'yieldLoad', 'tensileStrength', 'yieldStrength', 'elongation'];
        for (let field of required) {
            if (!entryData[field] && entryData[field] !== 0) {  // Allow 0 as valid value
                console.log(`Missing field: ${field}`);
                return res.status(400).json({ success: false, message: `Field ${field} is missing.` });
            }
        }

        // Validate item object structure
        if (typeof entryData.item !== 'object' || !entryData.item.it1) {
            console.log('Invalid item structure:', entryData.item);
            return res.status(400).json({ success: false, message: 'Item must have it1 property.' });
        }

        console.log('All required fields present, ensuring date document...');
        const document = await ensureDateDocument(MicroTensile, date);
        console.log('Date document retrieved/created, adding entry...');
        
        document.entries.push({ ...entryData, createdBy: req.user._id });
        await document.save();
        console.log('Entry saved successfully');

        res.status(201).json({ 
            success: true, 
            data: document.entries[document.entries.length - 1],
            message: 'MicroTensile entry recorded successfully.' 
        });
    } catch (error) {
        console.error('Error creating entry (DETAILED):', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
        sendError(res, error);
    }
};

/** 4. ADVANCED FILTERING (Reporting) **/

exports.getAllEntries = async (req, res) => {
    try {
        const documents = await MicroTensile.find().sort({ date: -1 });

        const allEntries = documents.flatMap(doc =>
            doc.entries.map(entry => ({
                ...entry.toObject(),
                date: doc.date,
                formattedDate: doc.date.toISOString().split('T')[0]
            }))
        );

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching all entries.' });
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

        const documents = await MicroTensile.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });

        // Flattening for Excel/PDF Export compatibility
        const allEntries = documents.flatMap(doc => 
            doc.entries.map(entry => {
                const entryObj = entry.toObject();
                console.log('Entry object keys:', Object.keys(entryObj));
                console.log('Entry disa value:', entryObj.disa);
                return {
                    ...entryObj, 
                    date: doc.date,
                    dateOfInspection: doc.date,
                    formattedDate: doc.date.toISOString().split('T')[0] 
                };
            })
        );

        console.log('Total entries returned:', allEntries.length);
        if (allEntries.length > 0) {
            console.log('Sample entry:', JSON.stringify(allEntries[0], null, 2));
        }

        res.status(200).json({ success: true, count: allEntries.length, data: allEntries });
    } catch (error) {
        console.error('Filter operation failed:', error);
        res.status(500).json({ success: false, message: 'Filter operation failed.' });
    }
};

/** 5. UPDATE / DELETE A SINGLE ENTRY (admin or creator within edit window) **/
// req.targetDoc / req.targetEntry are resolved & authorized by editWindow middleware.

const PROTECTED_ENTRY_FIELDS = ['_id', 'createdBy', 'createdAt', 'updatedAt', 'date'];

exports.updateEntry = async (req, res) => {
    try {
        const updates = { ...req.body };
        PROTECTED_ENTRY_FIELDS.forEach(f => delete updates[f]);

        req.targetEntry.set(updates);
        await req.targetDoc.save();

        res.status(200).json({
            success: true,
            data: req.targetEntry,
            message: 'MicroTensile entry updated successfully.'
        });
    } catch (error) {
        console.error('Error updating micro tensile entry:', error);
        sendError(res, error);
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        req.targetEntry.deleteOne();
        await req.targetDoc.save();

        res.status(200).json({ success: true, message: 'MicroTensile entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting micro tensile entry:', error);
        sendError(res, error);
    }
};