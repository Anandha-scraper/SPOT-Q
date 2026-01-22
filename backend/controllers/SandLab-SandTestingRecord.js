const SandTestingRecord = require('../models/SandLab-SandTestingRecord');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    try {
        await ensureDateDocument(SandTestingRecord, getCurrentDate());
    } catch (error) {
        console.error('Sand Lab Initialization Error:', error.message);
    }
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const entries = await SandTestingRecord.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await SandTestingRecord.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            pages: Math.ceil(total / limit),
            data: entries
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEntriesByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const document = await ensureDateDocument(SandTestingRecord, date);
        // Return as array for frontend compatibility
        res.status(200).json({ success: true, data: [document] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching records by date.' });
    }
};

/** 3. THE "SMART" TABLE UPDATER **/

exports.createTableEntry = async (req, res) => {
    try {
        // Get tableNum from either URL param or request body and convert to number
        const tableNum = Number(req.params.tableNum || req.body.tableNum);
        const data = req.body.data || req.body;
        const targetDate = data.date || getCurrentDate();
        
        // Batch Update: Find or Create for this day
        const document = await ensureDateDocument(SandTestingRecord, targetDate);
        
        // Deep merge helper for nested objects and arrays
        const deepMerge = (target, source) => {
            Object.keys(source).forEach(key => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else {
                    // For arrays and primitive values, directly assign
                    target[key] = source[key];
                }
            });
        };
        
        // Apply table-specific updates with deep merge
        if (tableNum === 1) {
            if (!document.sandShifts) document.sandShifts = {};
            deepMerge(document.sandShifts, data);
        } else if (tableNum === 2) {
            if (!document.clayShifts) document.clayShifts = {};
            deepMerge(document.clayShifts, data);
        } else if (tableNum === 3) {
            if (!document.mixshifts) document.mixshifts = {};
            deepMerge(document.mixshifts, data);
        } else if (tableNum === 4) {
            if (data.sandLump !== undefined) document.sandLump = data.sandLump;
            if (data.newSandWt !== undefined) document.newSandWt = data.newSandWt;
            if (data.sandFriability !== undefined) document.sandFriability = data.sandFriability;
        } else if (tableNum === 5) {
            if (!document.testParameter) document.testParameter = [];
            // Add new entry to array
            if (data && typeof data === 'object') {
                document.testParameter.push(data);
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid Table Number' });
        }
        
        await document.save();

        res.status(200).json({ 
            success: true, 
            data: document, 
            message: `Table ${tableNum} recorded for ${targetDate}` 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. STANDARD CRUD **/

exports.updateEntry = async (req, res) => {
    try {
        const entry = await SandTestingRecord.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!entry) return res.status(404).json({ success: false, message: 'Record not found' });
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const entry = await SandTestingRecord.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Record deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 5. ANALYTICS **/

exports.getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        const stats = await SandTestingRecord.aggregate([
            { $match: matchStage },
            { $group: {
                _id: null,
                avgPermeability: { $avg: '$testParameter.permeability' },
                avgMoisture: { $avg: '$testParameter.moisture' },
                avgGcs: { $avg: '$testParameter.gcsFdyA' }
            }}
        ]);

        res.status(200).json({ success: true, data: stats[0] || {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Analytics failed' });
    }
};