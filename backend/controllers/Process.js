const Process = require('../models/Process');

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
                        _id: entry._id,
                        date: doc.date,
                        ...entry.toObject()
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
                entries: [{ disa, ...entryData }]
            });
            return res.status(201).json({
                success: true,
                data: document,
                message: 'New process record created successfully.'
            });
        }

        // Add new entry (multiple entries allowed per DISA on same date)
        document.entries.push({ disa, ...entryData });

        await document.save();

        res.status(200).json({
            success: true,
            data: document,
            message: 'Process record saved successfully.'
        });

    } catch (error) {
        console.error('Error creating/updating process record:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. SPECIFIC UPDATES & DELETIONS **/

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, disa, ...entryData } = req.body;

        const document = await Process.findOne({ date });

        if (!document) return res.status(404).json({ success: false, message: 'Record not found.' });

        const entry = document.entries.id(id);
        if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

        Object.assign(entry, { disa, ...entryData });
        await document.save();

        res.status(200).json({ success: true, data: document, message: 'Updated successfully.' });
    } catch (error) {
        console.error('Error updating process record:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        
        const document = await Process.findOne({ 'entries._id': id });

        if (!document) return res.status(404).json({ success: false, message: 'Record not found.' });

        document.entries.pull(id);
        await document.save();

        res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting process record:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};