const QcProduction = require('../models/QcProduction');
const { getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    // Skip initialization - QcProduction documents are created when data is submitted
    return;
};

/** 2. DATA RETRIEVAL **/

exports.getAllEntries = async (req, res) => {
    try {
        const documents = await QcProduction.find().sort({ date: -1 });
        
        res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching QC production records.' });
    }
};

/** 3. CORE OPERATIONS **/

exports.createEntry = async (req, res) => {
    try {
        const entryData = req.body;
        
        if (!entryData.date) {
            return res.status(400).json({ success: false, message: 'Date is required.' });
        }

        const newEntry = await QcProduction.create(entryData);

        res.status(201).json({ 
            success: true, 
            data: newEntry,
            message: 'Entry added to production log.' 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await QcProduction.findById(id);
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Entry not found.' });
        }

        // Don't allow date changes
        if (req.body.date) {
            delete req.body.date;
        }

        Object.assign(document, req.body);
        await document.save();

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await QcProduction.findByIdAndDelete(id);
        
        if (!document) {
            return res.status(404).json({ success: false, message: 'Entry not found.' });
        }
        
        res.status(200).json({ success: true, message: 'Entry deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};