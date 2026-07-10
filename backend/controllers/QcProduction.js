const QcProduction = require('../models/QcProduction');
const { sendError } = require('../utils/mongooseError');
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

// Get unique part names for autocomplete
exports.getPartNames = async (req, res) => {
    try {
        // Get distinct part names from the database, excluding empty/null values
        const partNames = await QcProduction.distinct('partName', {
            partName: { $exists: true, $ne: '', $ne: null }
        });

        // Sort alphabetically for better UX
        partNames.sort();

        res.status(200).json({ success: true, partNames });
    } catch (error) {
        console.error('Error fetching part names:', error);
        res.status(500).json({ success: false, message: 'Error fetching part names.' });
    }
};

/** 3. CORE OPERATIONS **/

// Helper function to parse range string "min - max" or single value
const parseRange = (rangeStr) => {
    const str = (rangeStr ?? '').toString().trim();
    // Blank → leave the field unset (optional range).
    if (str === '') {
        return { from: undefined, to: undefined };
    }
    if (str.includes(' - ')) {
        const [from, to] = str.split(' - ').map(v => parseFloat(v.trim()));
        return { from, to };
    }
    // Single value or already a number
    return { from: parseFloat(str), to: 0 };
};

// Blank/invalid numeric input → undefined so the field is left unset (requiredness
// is driven by the frontend validationRanges, not hard-coded in the model).
const toNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
};

// Transform the frontend payload (range strings) into the flat backend model format.
const transformQcPayload = (entryData) => {
    const cPercent = parseRange(entryData.cPercent);
    const siPercent = parseRange(entryData.siPercent);
    const mnPercent = parseRange(entryData.mnPercent);
    const pPercent = parseRange(entryData.pPercent);
    const sPercent = parseRange(entryData.sPercent);
    const mgPercent = parseRange(entryData.mgPercent);
    const cuPercent = parseRange(entryData.cuPercent);
    const crPercent = parseRange(entryData.crPercent);
    const graphiteType = parseRange(entryData.graphiteType);
    const hardnessBHN = parseRange(entryData.hardnessBHN);

    return {
        date: entryData.date,
        partName: entryData.partName,
        noOfMoulds: toNum(entryData.noOfMoulds),
        cPercentFrom: cPercent.from,
        cPercentTo: cPercent.to,
        siPercentFrom: siPercent.from,
        siPercentTo: siPercent.to,
        mnPercentFrom: mnPercent.from,
        mnPercentTo: mnPercent.to,
        pPercentFrom: pPercent.from,
        pPercentTo: pPercent.to,
        sPercentFrom: sPercent.from,
        sPercentTo: sPercent.to,
        mgPercentFrom: mgPercent.from,
        mgPercentTo: mgPercent.to,
        cuPercentFrom: cuPercent.from,
        cuPercentTo: cuPercent.to,
        crPercentFrom: crPercent.from,
        crPercentTo: crPercent.to,
        nodularity: toNum(entryData.nodularity),
        noduleCount: toNum(entryData.noduleCount),
        graphiteTypeFrom: graphiteType.from,
        graphiteTypeTo: graphiteType.to,
        pearlite: toNum(entryData.pearlite),
        ferrite: toNum(entryData.ferrite),
        hardnessBHNFrom: hardnessBHN.from,
        hardnessBHNTo: hardnessBHN.to,
        ts: entryData.ts, // Array of numbers
        ys: entryData.ys, // Array of strings (range format)
        el: entryData.el  // Array of strings (range format)
    };
};

exports.createEntry = async (req, res) => {
    try {
        const entryData = req.body;

        if (!entryData.date) {
            return res.status(400).json({ success: false, message: 'Date is required.' });
        }

        const transformedData = { ...transformQcPayload(entryData), createdBy: req.user._id };

        const newEntry = await QcProduction.create(transformedData);

        res.status(201).json({
            success: true,
            data: newEntry,
            message: 'Entry added to production log.'
        });
    } catch (error) {
        sendError(res, error);
    }
};

/** 4. UPDATE / DELETE A SINGLE DOCUMENT (admin or creator within edit window) **/
// req.targetDoc is resolved & authorized by editWindow middleware (flat mode).

// The edit modal sends model-shaped fields directly (cPercentFrom, cPercentTo, ...),
// which is what the report already holds — so update sets whitelisted fields as-is
// rather than re-parsing range strings. Omitted fields (e.g. ts/ys/el) are preserved.
const QC_PROTECTED_FIELDS = ['_id', 'createdBy', 'createdAt', 'updatedAt', '__v'];

exports.updateEntry = async (req, res) => {
    try {
        const updates = { ...req.body };
        QC_PROTECTED_FIELDS.forEach(f => delete updates[f]);

        req.targetDoc.set(updates);
        await req.targetDoc.save();

        res.status(200).json({
            success: true,
            data: req.targetDoc,
            message: 'QC production entry updated successfully.'
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await QcProduction.findByIdAndDelete(req.targetDoc._id);

        res.status(200).json({ success: true, message: 'QC production entry deleted successfully.' });
    } catch (error) {
        sendError(res, error);
    }
};