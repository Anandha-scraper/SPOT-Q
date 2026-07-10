const SandTestingRecord = require('../models/SandLab-SandTestingRecord');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const { startDate, endDate, plant, page = 1, limit = 10 } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (plant) query.plant = plant;

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
        const { plant } = req.query;
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        // Find document without creating if it doesn't exist
        const document = await SandTestingRecord.findOne({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            ...(plant ? { plant } : {})
        });
        
        // Return as array for frontend compatibility (empty array if no document)
        res.status(200).json({ 
            success: true, 
            data: document ? [document] : [] 
        });
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
        const plant = req.body.plant || data.plant;

        if (!['Disa', 'Eirich'].includes(plant)) {
            return res.status(400).json({ success: false, message: 'A valid plant ("Disa" or "Eirich") is required.' });
        }

        // Batch Update: Find or Create for this day + plant
        const document = await ensureDateDocument(SandTestingRecord, targetDate, { plant }, { plant });
        
        // Deep merge helper for nested objects and arrays
        const deepMerge = (target, source) => {
            Object.keys(source).forEach(key => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else if (Array.isArray(source[key])) {
                    // For arrays, append new values to existing array instead of replacing
                    if (!target[key]) {
                        target[key] = [];
                    }
                    // Filter out empty strings and append only non-empty new values
                    const newValues = source[key].filter(val => val && val.trim() !== '');
                    if (newValues.length > 0) {
                        target[key] = [...target[key], ...newValues];
                    }
                } else {
                    // For primitive values, only assign if not empty string (to preserve existing data)
                    if (source[key] !== '' && source[key] !== null && source[key] !== undefined) {
                        target[key] = source[key];
                    }
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
            // Only update if value is not empty - preserves existing data
            if (data.sandLump !== undefined && data.sandLump !== null && data.sandLump.trim() !== '') {
                document.sandLump = data.sandLump;
            }
            if (data.newSandWt !== undefined && data.newSandWt !== null && data.newSandWt.trim() !== '') {
                document.newSandWt = data.newSandWt;
            }
            if (data.sandFriability !== undefined) {
                // Initialize sandFriability if it doesn't exist
                if (!document.sandFriability) {
                    document.sandFriability = {};
                }
                // Only update individual shift values if they are not empty
                if (data.sandFriability.shiftI !== undefined && data.sandFriability.shiftI !== null && data.sandFriability.shiftI.trim() !== '') {
                    document.sandFriability.shiftI = data.sandFriability.shiftI;
                }
                if (data.sandFriability.shiftII !== undefined && data.sandFriability.shiftII !== null && data.sandFriability.shiftII.trim() !== '') {
                    document.sandFriability.shiftII = data.sandFriability.shiftII;
                }
                if (data.sandFriability.shiftIII !== undefined && data.sandFriability.shiftIII !== null && data.sandFriability.shiftIII.trim() !== '') {
                    document.sandFriability.shiftIII = data.sandFriability.shiftIII;
                }
            }
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

/** 5. ANALYTICS **/

exports.getStats = async (req, res) => {
    try {
        const { startDate, endDate, plant } = req.query;
        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }
        if (plant) matchStage.plant = plant;

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