const FoundrySandTestingNote = require('../models/SandLab-FoundrySandTestingNote');
const { sendError } = require('../utils/mongooseError');

// ─── Helper: parse "YYYY-MM-DD" → UTC Date ───
const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// ─── Helper: flatten a date-doc into individual entry objects ───
const flattenDoc = (doc) => {
    const dateISO = doc.date;
    return (doc.entries || []).map(entry => {
        const obj = entry.toObject ? entry.toObject() : { ...entry };
        obj.date = dateISO;
        return obj;
    });
};

// ─── Helper: deep-merge src into target (only non-empty strings) ───
const deepMerge = (target, src) => {
    if (!src || typeof src !== 'object') return;
    Object.keys(src).forEach(key => {
        const val = src[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (!target[key] || typeof target[key] !== 'object') target[key] = {};
            deepMerge(target[key], val);
        } else if (val !== undefined && val !== null && val !== '') {
            target[key] = val;
        }
    });
};

/** 1. SYSTEM SYNC **/

exports.initializeTodayEntry = async () => {
    return; // Documents are created on demand via createEntry
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = parseDate(startDate);
            if (endDate) query.date.$lte = parseDate(endDate);
        }

        const docs = await FoundrySandTestingNote.find(query).sort({ date: -1 });

        // Flatten: each entry gets the parent's date attached
        const flat = [];
        docs.forEach(doc => flat.push(...flattenDoc(doc)));

        res.status(200).json({ success: true, count: flat.length, data: flat });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getEntriesByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const dateObj = parseDate(date);

        const doc = await FoundrySandTestingNote.findOne({ date: dateObj });
        if (!doc) return res.status(200).json([]);

        const flat = flattenDoc(doc);
        res.status(200).json(flat);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching records by date.' });
    }
};

/** 3. CORE LOGIC (Smart Upsert — date-wise collection) **/

exports.createEntry = async (req, res) => {
    try {
        const { date, shift, section, sandPlant, ...otherData } = req.body;

        if (!date || !shift) {
            return res.status(400).json({ success: false, message: 'Date and Shift are required.' });
        }

        const dateObj = parseDate(date);

        // 1. Find or create the date document
        let doc = await FoundrySandTestingNote.findOne({ date: dateObj });
        if (!doc) {
            doc = new FoundrySandTestingNote({ date: dateObj, entries: [] });
        }

        // 2. Find or create the entry in the entries array by shift + sandPlant
        let entry = doc.entries.find(e =>
            e.shift === String(shift).trim() &&
            e.sandPlant === String(sandPlant || '').trim()
        );

        if (!entry) {
            if (!sandPlant) {
                return res.status(400).json({ success: false, message: 'Sand Plant is required for new entries.' });
            }
            doc.entries.push({
                shift: String(shift).trim(),
                sandPlant: String(sandPlant).trim()
            });
            entry = doc.entries[doc.entries.length - 1];
        }

        // 3. SMART MERGE into the entry
        if (section === 'primary') {
            if (sandPlant) entry.sandPlant = sandPlant;
            if (otherData.compactibilitySetting !== undefined) entry.compactibilitySetting = otherData.compactibilitySetting;
            if (otherData.shearStrengthSetting !== undefined) entry.shearStrengthSetting = otherData.shearStrengthSetting;
        } else if (section === 'remarks') {
            if (otherData.remarks !== undefined) entry.remarks = otherData.remarks;
        } else if (otherData.clayTests || otherData.sieveTesting || otherData.parameters || otherData.additionalData) {
            // Merge section data
            ['clayTests', 'sieveTesting', 'parameters', 'additionalData'].forEach(key => {
                if (otherData[key]) {
                    if (!entry[key]) entry[key] = {};
                    deepMerge(entry[key], otherData[key]);
                    entry.markModified(key);
                }
            });
        } else {
            // Fallback
            if (sandPlant) entry.sandPlant = sandPlant;
            Object.keys(otherData).forEach(k => {
                if (k !== 'section' && otherData[k] !== undefined) entry[k] = otherData[k];
            });
        }

        await doc.save();

        // Return the entry with date attached (same flat format frontend expects)
        const returnEntry = entry.toObject();
        returnEntry.date = doc.date;

        res.status(200).json({
            success: true,
            data: returnEntry,
            message: 'Note updated successfully.'
        });

    } catch (error) {
        sendError(res, error);
    }
};