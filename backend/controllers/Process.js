const Process = require('../models/Process');
const { sendError } = require('../utils/mongooseError');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const existingDoc = await Process.findOne({ date: today });
        
        if (!existingDoc) {
            await Process.create({ date: today, entries: [] });
            console.log(`Created empty process document for ${today}`);
        }
    } catch (error) {
        console.error('Process initialization failed:', error.message);
    }
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const documents = await Process.find().sort({ date: -1 });
        
        // Flatten entries for frontend compatibility
        const flatEntries = [];
        documents.forEach(doc => {
            if (doc.entries && doc.entries.length > 0) {
                doc.entries.forEach(entry => {
                    flatEntries.push({
                        date: doc.date,
                        ...entry.toObject(),
                        _id: entry._id
                    });
                });
            } else {
                // Include empty date documents
                flatEntries.push({
                    _id: doc._id,
                    date: doc.date,
                    disa: '',
                    partName: '',
                    entries: []
                });
            }
        });
        
        res.status(200).json({ success: true, count: flatEntries.length, data: flatEntries });
    } catch (error) {
        console.error('Error fetching process records:', error);
        res.status(500).json({ success: false, message: 'Error fetching entries.' });
    }
};

/** 3. CORE LOGIC (Create or Update Entry) **/
exports.createEntry = async (req, res) => {
    try {
        const { date, disa, ...entryData } = req.body;

        if (!date || !disa) {
            return res.status(400).json({ success: false, message: 'Date and DISA are required.' });
        }

        // Find or create document for this date
        let document = await Process.findOne({ date });

        if (!document) {
            // Create new document with this entry
            document = await Process.create({
                date,
                entries: [{ disa, ...entryData, createdBy: req.user._id }]
            });
            return res.status(201).json({
                success: true,
                data: document,
                message: 'New process record created successfully.'
            });
        }

        // Add new entry (multiple entries allowed per DISA on same date)
        document.entries.push({ disa, ...entryData, createdBy: req.user._id });

        await document.save();

        res.status(200).json({
            success: true,
            data: document,
            message: 'Process record saved successfully.'
        });

    } catch (error) {
        console.error('Error creating/updating process record:', error);
        sendError(res, error);
    }
};

/** 4. CHECK DATE+DISA ENTRIES COUNT **/
exports.checkDateDisaEntries = async (req, res) => {
    try {
        const { date, disa } = req.query;

        if (!date || !disa) {
            return res.status(400).json({ success: false, message: 'Date and DISA are required.' });
        }

        // Find document for this date
        const document = await Process.findOne({ date });

        if (!document) {
            return res.status(200).json({
                success: true,
                exists: false,
                isSaved: false,
                count: 0,
                lastEntry: null,
                message: 'No entries found for this date.'
            });
        }

        // Check if this DISA has been saved as primary
        const isSaved = document.savedDisas && document.savedDisas.includes(disa);

        // Count entries for this specific DISA on this date
        const disaEntries = document.entries.filter(entry => entry.disa === disa);
        const count = disaEntries.length;

        // Get the last entry for this DISA (most recently added)
        const lastEntry = count > 0 ? disaEntries[count - 1].toObject() : null;

        res.status(200).json({
            success: true,
            exists: isSaved,
            isSaved: isSaved,
            count: count,
            lastEntry: lastEntry,
            totalEntriesForDate: document.entries.length,
            message: isSaved ? `Primary saved. Found ${count} entries for ${disa} on ${date}.` : 'Primary not saved yet.'
        });

    } catch (error) {
        console.error('Error checking date+disa entries:', error);
        sendError(res, error);
    }
};

/** 5. GET DISTINCT PART NAMES **/
exports.getPartNames = async (req, res) => {
    try {
        const documents = await Process.find({}, { 'entries.partName': 1 });

        // Extract unique part names from all entries
        const partNamesSet = new Set();
        documents.forEach(doc => {
            if (doc.entries && doc.entries.length > 0) {
                doc.entries.forEach(entry => {
                    if (entry.partName && entry.partName.trim() !== '' && entry.partName !== '-') {
                        partNamesSet.add(entry.partName.trim());
                    }
                });
            }
        });

        // Convert to sorted array
        const partNames = Array.from(partNamesSet).sort();

        res.status(200).json({
            success: true,
            count: partNames.length,
            data: partNames
        });
    } catch (error) {
        console.error('Error fetching part names:', error);
        res.status(500).json({ success: false, message: 'Error fetching part names.' });
    }
};

/** 6. SAVE PRIMARY (Date + DISA) - Creates document if not exists **/
exports.savePrimary = async (req, res) => {
    try {
        const { date, disa } = req.body;

        if (!date || !disa) {
            return res.status(400).json({ success: false, message: 'Date and DISA are required.' });
        }

        // Find or create document for this date
        let document = await Process.findOne({ date });

        if (!document) {
            // Create new document for this date with savedDisas array containing this DISA
            document = await Process.create({
                date,
                savedDisas: [disa],
                entries: []
            });
        } else {
            // Add DISA to savedDisas if not already present
            if (!document.savedDisas) {
                document.savedDisas = [];
            }
            if (!document.savedDisas.includes(disa)) {
                document.savedDisas.push(disa);
                await document.save();
            }
        }

        // Count entries for this specific DISA on this date
        const disaEntries = document.entries.filter(entry => entry.disa === disa);
        const count = disaEntries.length;

        res.status(200).json({
            success: true,
            exists: true,
            isSaved: true,
            count: count,
            totalEntriesForDate: document.entries.length,
            message: 'Primary saved successfully.'
        });

    } catch (error) {
        console.error('Error saving primary:', error);
        sendError(res, error);
    }
};

/** 7. UPDATE / DELETE A SINGLE ENTRY (admin or creator within edit window) **/
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
            message: 'Process entry updated successfully.'
        });
    } catch (error) {
        console.error('Error updating process entry:', error);
        sendError(res, error);
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        req.targetEntry.deleteOne();
        await req.targetDoc.save();

        res.status(200).json({ success: true, message: 'Process entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting process entry:', error);
        sendError(res, error);
    }
};