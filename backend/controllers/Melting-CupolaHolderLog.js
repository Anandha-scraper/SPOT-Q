const CupolaHolderLog = require('../models/Melting-CupolaHolderLog');
const { sendError } = require('../utils/mongooseError');

/** Helper: normalize date to UTC start of day **/
const toStartOfDay = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const toEndOfDay = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
};

/** Helper: find or create date document **/
const getOrCreateDateDoc = async (dateStr) => {
    const startOfDay = toStartOfDay(dateStr);
    const endOfDay = toEndOfDay(dateStr);
    let doc = await CupolaHolderLog.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
    if (!doc) {
        doc = new CupolaHolderLog({ date: startOfDay, primaries: [] });
        await doc.save();
    }
    return doc;
};

/** Helper: find primary in document **/
const findPrimary = (doc, shift, holderNumber) => {
    return doc.primaries.find(p => p.shift === shift && p.holderNumber === holderNumber);
};

/** 1. DATA RETRIEVAL **/

exports.getPrimaryByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const { shift, holderNumber } = req.query;

        const startOfDay = toStartOfDay(date);
        const endOfDay = toEndOfDay(date);

        const doc = await CupolaHolderLog.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });

        if (!doc) return res.status(200).json({ success: true, data: null });

        // Find matching primary
        const primary = findPrimary(doc, shift, holderNumber);

        if (!primary) return res.status(200).json({ success: true, data: null });

        res.status(200).json({
            success: true,
            data: {
                _id: primary._id,
                date: doc.date,
                shift: primary.shift,
                holderNumber: primary.holderNumber,
                entryCount: primary.entries.length,
                entries: primary.entries
            }
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.filterByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Start and end dates are required.' });
        }

        const documents = await CupolaHolderLog.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: -1 });

        // Flatten: one row per entry per primary per date
        const flattened = [];
        for (const doc of documents) {
            for (const primary of doc.primaries) {
                if (primary.entries.length === 0) {
                    // Primary with no entries — still show it
                    flattened.push({
                        _id: primary._id,
                        date: doc.date,
                        shift: primary.shift,
                        holderNumber: primary.holderNumber,
                        entryCount: 0
                    });
                } else {
                    for (const entry of primary.entries) {
                        flattened.push({
                            _id: entry._id,
                            primaryId: primary._id,
                            date: doc.date,
                            shift: primary.shift,
                            holderNumber: primary.holderNumber,
                            entryCount: primary.entries.length,
                            // Entry fields
                            heatNo: entry.heatNo,
                            cpc: entry.cpc,
                            FeSl: entry.FeSl,
                            feMn: entry.feMn,
                            sic: entry.sic,
                            pureMg: entry.pureMg,
                            cu: entry.cu,
                            feCr: entry.feCr,
                            actualTime: entry.actualTime,
                            tappingTime: entry.tappingTime,
                            tappingTemp: entry.tappingTemp,
                            metalKg: entry.metalKg,
                            disaLine: entry.disaLine,
                            indFur: entry.indFur,
                            bailNo: entry.bailNo,
                            tap: entry.tap,
                            kw: entry.kw,
                            remarks: entry.remarks
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, count: flattened.length, data: flattened });
    } catch (error) {
        console.error('Filter error:', error);
        sendError(res, error);
    }
};

/** 2. TABLE ENTRY — push a new entry into the primary's entries array **/

exports.createTableEntry = async (req, res) => {
    try {
        const { primaryData, data } = req.body;
        if (!data || !primaryData?.date) {
            return res.status(400).json({ success: false, message: 'Data and date are required.' });
        }

        const doc = await getOrCreateDateDoc(primaryData.date);

        // Find or create primary
        let primary = findPrimary(doc, primaryData.shift || '', primaryData.holderNumber || '');
        if (!primary) {
            doc.primaries.push({
                shift: primaryData.shift || '',
                holderNumber: primaryData.holderNumber || '',
                entries: []
            });
            primary = doc.primaries[doc.primaries.length - 1];
        }

        // Support both single entry (object) and batch entries (array)
        const entriesArray = Array.isArray(data) ? data : [data];

        for (const item of entriesArray) {
            const entry = {
                heatNo: item.heatNo,
                cpc: item.cpc,
                FeSl: item.FeSl,
                feMn: item.feMn,
                sic: item.sic,
                pureMg: item.pureMg,
                cu: item.cu,
                feCr: item.feCr,
                actualTime: item.actualTime,
                tappingTime: item.tappingTime,
                tappingTemp: item.tappingTemp,
                metalKg: item.metalKg,
                disaLine: item.disaLine,
                indFur: item.indFur,
                bailNo: item.bailNo,
                tap: item.tap,
                kw: item.kw,
                remarks: item.remarks
            };
            primary.entries.push(entry);
        }

        await doc.save();

        res.status(200).json({
            success: true,
            data: doc,
            entryCount: primary.entries.length,
            addedCount: entriesArray.length,
            message: `${entriesArray.length} ${entriesArray.length === 1 ? 'entry' : 'entries'} saved successfully.`
        });
    } catch (error) {
        sendError(res, error);
    }
};

/** 3. LOCKING & PRIMARY UPDATES **/

exports.createOrUpdatePrimary = async (req, res) => {
    try {
        const { primaryData } = req.body;

        const doc = await getOrCreateDateDoc(primaryData.date);

        // Find or create primary
        let primary = findPrimary(doc, primaryData.shift || '', primaryData.holderNumber || '');

        if (!primary) {
            doc.primaries.push({
                shift: primaryData.shift || '',
                holderNumber: primaryData.holderNumber || '',
                entries: []
            });
            primary = doc.primaries[doc.primaries.length - 1];
        }

        await doc.save();

        res.status(200).json({
            success: true,
            data: {
                _id: primary._id,
                date: doc.date,
                shift: primary.shift,
                holderNumber: primary.holderNumber,
                entryCount: primary.entries.length
            }
        });
    } catch (error) {
        sendError(res, error);
    }
};