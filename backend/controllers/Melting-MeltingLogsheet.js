const MeltingLogsheet = require('../models/Melting-MeltingLogsheet');
const { sendError } = require('../utils/mongooseError');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

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
    let doc = await MeltingLogsheet.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
    if (!doc) {
        doc = new MeltingLogsheet({ date: startOfDay, primaries: [] });
        await doc.save();
    }
    return doc;
};

/** Helper: find primary in document **/
const findPrimary = (doc, shift, furnaceNo, panel) => {
    return doc.primaries.find(p => p.shift === shift && p.furnaceNo === furnaceNo && p.panel === panel);
};

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    try {
        const today = getCurrentDate();
        const dateStr = today.toISOString().split('T')[0];
        await getOrCreateDateDoc(dateStr);
    } catch (error) {
        console.error('Melting Logsheet Init Error:', error.message);
    }
};

/** 2. DATA RETRIEVAL **/

exports.getPrimaryByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const { shift, furnaceNo, panel } = req.query;
        
        const startOfDay = toStartOfDay(date);
        const endOfDay = toEndOfDay(date);
        
        const doc = await MeltingLogsheet.findOne({ date: { $gte: startOfDay, $lte: endOfDay } });
        
        if (!doc) return res.status(200).json({ success: true, data: null });

        // Find matching primary
        const primary = findPrimary(doc, shift, furnaceNo, panel);
        
        if (!primary) return res.status(200).json({ success: true, data: null });

        res.status(200).json({
            success: true,
            data: {
                _id: primary._id,
                date: doc.date,
                shift: primary.shift,
                furnaceNo: primary.furnaceNo,
                panel: primary.panel,
                cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
                finalKWHr: primary.finalkwhr,
                initialKWHr: primary.initialkwhr,
                totalUnits: primary.totoalunits,
                cumulativeUnits: primary.cumulativeunits,
                isLocked: primary.isLocked,
                entryCount: primary.entries.length
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

        const documents = await MeltingLogsheet.find({
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
                    // Primary with no entries - still show it
                    flattened.push({
                        _id: primary._id,
                        date: doc.date,
                        shift: primary.shift,
                        furnaceNo: primary.furnaceNo,
                        panel: primary.panel,
                        cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
                        finalKWHr: primary.finalkwhr,
                        initialKWHr: primary.initialkwhr,
                        totalUnits: primary.totoalunits,
                        cumulativeUnits: primary.cumulativeunits,
                        isLocked: primary.isLocked,
                        entryCount: 0
                    });
                } else {
                    for (const entry of primary.entries) {
                        flattened.push({
                            _id: entry._id,
                            primaryId: primary._id,
                            date: doc.date,
                            shift: primary.shift,
                            furnaceNo: primary.furnaceNo,
                            panel: primary.panel,
                            cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
                            finalKWHr: primary.finalkwhr,
                            initialKWHr: primary.initialkwhr,
                            totalUnits: primary.totoalunits,
                            cumulativeUnits: primary.cumulativeunits,
                            isLocked: primary.isLocked,
                            entryCount: primary.entries.length,
                            // Table 1
                            heatNo: entry.heatno,
                            grade: entry.grade,
                            chargingTime: entry.chargingkgs?.time,
                            ifBath: entry.chargingkgs?.ifbath,
                            liquidMetalPressPour: entry.chargingkgs?.liquidmetal?.presspour,
                            liquidMetalHolder: entry.chargingkgs?.liquidmetal?.holder,
                            sgMsSteel: entry.chargingkgs?.sqmssteel,
                            greyMsSteel: entry.chargingkgs?.greymssteel,
                            returnsSg: entry.chargingkgs?.returnSg,
                            pigIron: entry.chargingkgs?.pigiron,
                            borings: entry.chargingkgs?.borings,
                            finalBath: entry.chargingkgs?.finalbath,
                            // Table 2
                            charCoal: entry.charcoal,
                            cpcFur: entry.cpc?.fur,
                            cpcLc: entry.cpc?.lc,
                            siliconCarbideFur: entry.siliconcarbide?.fur,
                            ferrosiliconFur: entry.ferroSilicon?.fur,
                            ferrosiliconLc: entry.ferroSilicon?.lc,
                            ferroManganeseFur: entry.ferroManganese?.fur,
                            ferroManganeseLc: entry.ferroManganese?.lc,
                            cu: entry.cu,
                            cr: entry.cr,
                            pureMg: entry.pureMg,
                            ironPyrite: entry.ironPyrite,
                            // Table 3
                            labCoinTime: entry.labCoin?.time,
                            labCoinTempC: entry.labCoin?.tempC,
                            deslagingTimeFrom: entry.deslagingTime?.from,
                            deslagingTimeTo: entry.deslagingTime?.to,
                            metalReadyTime: entry.metalReadyTime,
                            waitingForTappingFrom: entry.waitingForTapping?.from,
                            waitingForTappingTo: entry.waitingForTapping?.to,
                            reason: entry.reason,
                            // Table 4
                            time: entry.metalTapping?.time,
                            tempCSg: entry.metalTapping?.tempCSg,
                            directFurnace: entry.directFurnace,
                            holderToFurnace: entry.holderToFurnace,
                            furnaceToHolder: entry.furnaceToHolder,
                            disaNo: entry.disaNo,
                            item: entry.item,
                            // Table 5
                            furnace1Kw: entry.electricalReadings?.furnace1?.kw,
                            furnace1A: entry.electricalReadings?.furnace1?.a,
                            furnace1V: entry.electricalReadings?.furnace1?.v,
                            furnace4Hz: entry.electricalReadings?.furnace4?.hz,
                            furnace4Gld: entry.electricalReadings?.furnace4?.gld,
                            furnace4KwHr: entry.electricalReadings?.furnace4?.kwhr,
                            // Edit/delete gating (mirrors Process)
                            createdAt: entry.createdAt,
                            createdBy: entry.createdBy
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: flattened });
    } catch (error) {
        sendError(res, error);
    }
};

/** 3. THE "DYNAMIC" TABLE UPDATER - pushes a new entry into the array **/

exports.createTableEntry = async (req, res) => {
    try {
        const { primaryData, data } = req.body;
        if (!data || !primaryData?.date) {
            return res.status(400).json({ success: false, message: 'Data and date are required.' });
        }

        const doc = await getOrCreateDateDoc(primaryData.date);
        
        // Find or create primary
        let primary = findPrimary(doc, primaryData.shift || '', primaryData.furnaceNo || '', primaryData.panel || '');
        if (!primary) {
            doc.primaries.push({
                shift: primaryData.shift || '',
                furnaceNo: primaryData.furnaceNo || '',
                panel: primaryData.panel || '',
                entries: []
            });
            primary = doc.primaries[doc.primaries.length - 1];
        }

        // Build the entry from all 5 tables combined
        const entry = {
            heatno: data.heatNo,
            grade: data.grade,
            chargingkgs: {
                time: data.chargingTime,
                ifbath: data.ifBath,
                liquidmetal: { presspour: data.liquidMetalPressPour, holder: data.liquidMetalHolder },
                sqmssteel: data.sgMsSteel,
                greymssteel: data.greyMsSteel,
                returnSg: data.returnsSg,
                pigiron: data.pigIron,
                borings: data.borings,
                finalbath: data.finalBath
            },
            charcoal: data.charCoal,
            cpc: { fur: data.cpcFur, lc: data.cpcLc },
            siliconcarbide: { fur: data.siliconCarbideFur },
            ferroSilicon: { fur: data.ferrosiliconFur, lc: data.ferrosiliconLc },
            ferroManganese: { fur: data.ferroManganeseFur, lc: data.ferroManganeseLc },
            cu: data.cu,
            cr: data.cr,
            pureMg: data.pureMg,
            ironPyrite: data.ironPyrite,
            labCoin: { time: data.labCoinTime, tempC: data.labCoinTempC },
            deslagingTime: { from: data.deslagingTimeFrom, to: data.deslagingTimeTo },
            metalReadyTime: data.metalReadyTime,
            waitingForTapping: { from: data.waitingForTappingFrom, to: data.waitingForTappingTo },
            reason: data.reason,
            metalTapping: { time: data.time, tempCSg: data.tempCSg },
            directFurnace: data.directFurnace,
            holderToFurnace: data.holderToFurnace,
            furnaceToHolder: data.furnaceToHolder,
            disaNo: data.disaNo,
            item: data.item,
            electricalReadings: {
                furnace1: { kw: data.furnace1Kw, a: data.furnace1A, v: data.furnace1V },
                furnace2: { kw: data.furnace2Kw, a: data.furnace2A, v: data.furnace2V },
                furnace3: { kw: data.furnace3Kw, a: data.furnace3A, v: data.furnace3V },
                furnace4: { hz: data.furnace4Hz, gld: data.furnace4Gld, kwhr: data.furnace4KwHr }
            },
            createdBy: req.user?._id
        };

        primary.entries.push(entry);
        await doc.save();

        res.status(200).json({ 
            success: true, 
            data: doc, 
            entryCount: primary.entries.length,
            message: 'Entry saved successfully.'
        });
    } catch (error) {
        sendError(res, error);
    }
};

/** 3b. PER-ENTRY EDIT / DELETE (report row actions) **/

// Maps the flat field names used by the report/edit-modal to the nested paths
// in the entry sub-document. Only these fields are editable.
const FLAT_TO_PATH = {
    heatNo: 'heatno',
    grade: 'grade',
    chargingTime: 'chargingkgs.time',
    ifBath: 'chargingkgs.ifbath',
    liquidMetalPressPour: 'chargingkgs.liquidmetal.presspour',
    liquidMetalHolder: 'chargingkgs.liquidmetal.holder',
    sgMsSteel: 'chargingkgs.sqmssteel',
    greyMsSteel: 'chargingkgs.greymssteel',
    returnsSg: 'chargingkgs.returnSg',
    pigIron: 'chargingkgs.pigiron',
    borings: 'chargingkgs.borings',
    finalBath: 'chargingkgs.finalbath',
    charCoal: 'charcoal',
    cpcFur: 'cpc.fur',
    cpcLc: 'cpc.lc',
    siliconCarbideFur: 'siliconcarbide.fur',
    ferrosiliconFur: 'ferroSilicon.fur',
    ferrosiliconLc: 'ferroSilicon.lc',
    ferroManganeseFur: 'ferroManganese.fur',
    ferroManganeseLc: 'ferroManganese.lc',
    cu: 'cu',
    cr: 'cr',
    pureMg: 'pureMg',
    ironPyrite: 'ironPyrite',
    labCoinTime: 'labCoin.time',
    labCoinTempC: 'labCoin.tempC',
    deslagingTimeFrom: 'deslagingTime.from',
    deslagingTimeTo: 'deslagingTime.to',
    metalReadyTime: 'metalReadyTime',
    waitingForTappingFrom: 'waitingForTapping.from',
    waitingForTappingTo: 'waitingForTapping.to',
    reason: 'reason',
    time: 'metalTapping.time',
    tempCSg: 'metalTapping.tempCSg',
    directFurnace: 'directFurnace',
    holderToFurnace: 'holderToFurnace',
    furnaceToHolder: 'furnaceToHolder',
    disaNo: 'disaNo',
    item: 'item',
    furnace1Kw: 'electricalReadings.furnace1.kw',
    furnace1A: 'electricalReadings.furnace1.a',
    furnace1V: 'electricalReadings.furnace1.v',
    furnace4Hz: 'electricalReadings.furnace4.hz',
    furnace4Gld: 'electricalReadings.furnace4.gld',
    furnace4KwHr: 'electricalReadings.furnace4.kwhr'
};

// req.targetDoc / req.targetEntry are resolved & authorized by editWindow middleware.
exports.updateEntry = async (req, res) => {
    try {
        const entry = req.targetEntry;
        Object.keys(req.body).forEach(flatKey => {
            const path = FLAT_TO_PATH[flatKey];
            if (path) entry.set(path, req.body[flatKey]);
        });
        await req.targetDoc.save();
        res.status(200).json({ success: true, message: 'Melting entry updated successfully.' });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        req.targetEntry.deleteOne();
        await req.targetDoc.save();
        res.status(200).json({ success: true, message: 'Melting entry deleted successfully.' });
    } catch (error) {
        sendError(res, error);
    }
};

/** 4. LOCKING & PRIMARY UPDATES **/

exports.createOrUpdatePrimary = async (req, res) => {
    try {
        const { primaryData, isLocked } = req.body;
        
        const doc = await getOrCreateDateDoc(primaryData.date);
        
        // Find or create primary
        let primary = findPrimary(doc, primaryData.shift || '', primaryData.furnaceNo || '', primaryData.panel || '');
        
        if (!primary) {
            doc.primaries.push({
                shift: primaryData.shift || '',
                furnaceNo: primaryData.furnaceNo || '',
                panel: primaryData.panel || '',
                entries: []
            });
            primary = doc.primaries[doc.primaries.length - 1];
        }

        // Update value fields
        primary.cumulativeLiquidMetal = primaryData.cumulativeLiquidMetal !== undefined ? primaryData.cumulativeLiquidMetal : primary.cumulativeLiquidMetal;
        primary.initialkwhr = primaryData.initialKWHr || primary.initialkwhr;
        primary.finalkwhr = primaryData.finalKWHr || primary.finalkwhr;
        primary.totoalunits = primaryData.totalUnits !== undefined ? primaryData.totalUnits : primary.totoalunits;
        primary.cumulativeunits = primaryData.cumulativeUnits !== undefined ? primaryData.cumulativeUnits : primary.cumulativeunits;
        primary.isLocked = isLocked !== undefined ? isLocked : primary.isLocked;

        await doc.save();
        
        res.status(200).json({ 
            success: true, 
            data: {
                _id: primary._id,
                date: doc.date,
                shift: primary.shift,
                furnaceNo: primary.furnaceNo,
                panel: primary.panel,
                cumulativeLiquidMetal: primary.cumulativeLiquidMetal,
                finalKWHr: primary.finalkwhr,
                initialKWHr: primary.initialkwhr,
                totalUnits: primary.totoalunits,
                cumulativeUnits: primary.cumulativeunits,
                isLocked: primary.isLocked,
                entryCount: primary.entries.length
            }
        });
    } catch (error) {
        sendError(res, error);
    }
};