const CupolaHolderLog = require('../models/Melting-CupolaHolderLog');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. DATA RETRIEVAL **/

exports.filterByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        const entries = await CupolaHolderLog.find({
            date: { $gte: start, $lte: end }
        }).sort({ date: -1, shift: 1, holderno: 1 });

        // Flatten nested structure for frontend
        const flattenedData = entries.map(entry => ({
            _id: entry._id,
            date: entry.date,
            shift: entry.shift,
            holderNumber: entry.holderno,
            heatNo: entry.heatNo || '',
            // Additions (Table 1)
            cpc: entry.additions?.cpc || 0,
            FeSl: entry.additions?.FeSl || 0,
            feMn: entry.additions?.feMn || 0,
            sic: entry.additions?.sic || 0,
            pureMg: entry.additions?.pureMg || 0,
            cu: entry.additions?.cu || 0,
            feCr: entry.additions?.feCr || 0,
            // Tapping (Table 2)
            actualTime: entry.tapping?.time?.actualTime || '',
            tappingTime: entry.tapping?.time?.tappingTime || '',
            tappingTemp: entry.tapping?.tempC || 0,
            metalKg: entry.tapping?.metalKgs || 0,
            // Pouring (Table 3)
            disaLine: entry.pouring?.disaLine || '',
            indFur: entry.pouring?.indFur || '',
            bailNo: entry.pouring?.bailNo || '',
            // Electrical (Table 4)
            tap: entry.electrical?.tap || '',
            kw: entry.electrical?.kw || 0
        }));

        res.status(200).json({ 
            success: true, 
            count: flattenedData.length, 
            data: flattenedData 
        });
    } catch (error) {
        console.error('Filter error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPrimaryByDate = async (req, res) => {
    try {
        const { date, shift, holderNumber } = req.params;
        
        // Handle various holderNumber formats (0, h, H, H0, etc.)
        let hNo;
        if (holderNumber === '0' || holderNumber.toLowerCase() === 'h' || holderNumber === '') {
            hNo = 0;
        } else {
            // Extract number from formats like "H0", "h1", or plain "1"
            const match = holderNumber.match(/\d+/);
            hNo = match ? parseInt(match[0]) : 0;
        }

        // Normalize date
        const dateObj = new Date(date);
        dateObj.setUTCHours(0, 0, 0, 0);

        // Find specific log by triple-key: Date, Shift, and Holder
        const entry = await CupolaHolderLog.findOne({ 
            date: dateObj, 
            shift: shift, 
            holderno: hNo 
        });

        res.status(200).json({
            success: true,
            data: entry ? {
                _id: entry._id,
                date: entry.date,
                shift: entry.shift,
                holderNumber: entry.holderno.toString(),
                heatNo: entry.heatNo || ''
            } : null
        });
    } catch (error) {
        console.error('Get primary by date error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllEntries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const entries = await CupolaHolderLog.find(query).sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 2. CORE LOGIC (Smart Upsert) **/

exports.createPrimary = async (req, res) => {
    try {
        console.log('Received request body:', JSON.stringify(req.body, null, 2));
        const { primaryData } = req.body;
        
        console.log('Extracted primaryData:', primaryData);
        console.log('Validation checks:', {
            hasPrimaryData: !!primaryData,
            hasDate: primaryData?.date,
            hasShift: primaryData?.shift,
            hasHolderNumber: primaryData?.holderNumber
        });
        
        if (!primaryData || !primaryData.date || !primaryData.shift || !primaryData.holderNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date, shift, and holder number are required in primaryData' 
            });
        }

        const { date, shift, holderNumber, heatNo } = primaryData;
        const hNo = parseInt(holderNumber);

        // Normalize date
        const dateObj = new Date(date);
        dateObj.setUTCHours(0, 0, 0, 0);

        // Find or create entry with just primary fields
        let entry = await CupolaHolderLog.findOne({ 
            date: dateObj, 
            shift, 
            holderno: hNo 
        });

        if (entry) {
            // Update primary fields only
            if (heatNo !== undefined) entry.heatNo = heatNo;
            await entry.save();
        } else {
            // Create new entry with primary fields
            entry = await CupolaHolderLog.create({ 
                date: dateObj, 
                shift, 
                holderno: hNo, 
                heatNo: heatNo || '' 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: {
                _id: entry._id,
                date: entry.date,
                shift: entry.shift,
                holderNumber: entry.holderno,
                heatNo: entry.heatNo || ''
            }
        });
    } catch (error) {
        console.error('Create primary error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createEntry = async (req, res) => {
    try {
        const { date, shift, holderNumber, holderno, ...payload } = req.body;
        const hNo = parseInt(holderNumber || holderno);

        if (!date || !shift || !hNo) {
            return res.status(400).json({ success: false, message: 'Date, Shift, and Holder No are required.' });
        }

        // 1. Normalize Date
        const dateObj = new Date(date);
        dateObj.setUTCHours(0, 0, 0, 0);

        // 2. Find or Create
        let entry = await CupolaHolderLog.findOne({ date: dateObj, shift, holderno: hNo });

        if (entry) {
            // DEEP MERGE: Update nested objects (tapping, electrical, etc.) without losing existing sub-fields
            Object.keys(payload).forEach(key => {
                if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
                    entry[key] = { ...entry[key], ...payload[key] };
                } else {
                    entry[key] = payload[key];
                }
            });
            await entry.save();
        } else {
            // CREATE NEW
            entry = await CupolaHolderLog.create({ date: dateObj, shift, holderno: hNo, ...payload });
        }

        res.status(entry.isNew ? 201 : 200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 3. STANDARD CRUD **/

exports.updateEntry = async (req, res) => {
    try {
        const entry = await CupolaHolderLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!entry) return res.status(404).json({ success: false, message: 'Log not found' });
        res.status(200).json({ success: true, data: entry });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await CupolaHolderLog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Log deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};