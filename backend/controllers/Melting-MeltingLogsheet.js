const MeltingLogsheet = require('../models/Melting-MeltingLogsheet');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    try {
        await ensureDateDocument(MeltingLogsheet, getCurrentDate());
    } catch (error) {
        console.error('Melting Logsheet Init Error:', error.message);
    }
};

/** 2. DATA RETRIEVAL **/

exports.getPrimaryByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const document = await MeltingLogsheet.findOne({ date: new Date(date) });
        
        if (!document) return res.status(200).json({ success: true, data: null });

        res.status(200).json({
            success: true,
            data: {
                _id: document._id,
                date: document.date,
                shift: document.shift,
                furnaceNo: document.furnaceNo,
                panel: document.panel,
                cumulativeLiquidMetal: document.cumulativeLiquidMetal,
                isLocked: document.isLocked
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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

        // Flatten nested data structure for frontend consumption
        const flattened = documents.map(doc => ({
            _id: doc._id,
            date: doc.date,
            shift: doc.shift,
            furnaceNo: doc.furnaceNo,
            panel: doc.panel,
            cumulativeLiquidMetal: doc.cumulativeLiquidMetal,
            finalKWHr: doc.finalkwhr,
            initialKWHr: doc.initialkwhr,
            totalUnits: doc.totoalunits,
            cumulativeUnits: doc.cumulativeunits,
            isLocked: doc.isLocked,
            // Table 1 - Charging Details
            heatNo: doc.heatno,
            grade: doc.grade,
            chargingTime: doc.chargingkgs?.time,
            ifBath: doc.chargingkgs?.ifbath,
            liquidMetalPressPour: doc.chargingkgs?.liquidmetal?.presspour,
            liquidMetalHolder: doc.chargingkgs?.liquidmetal?.holder,
            sgMsSteel: doc.chargingkgs?.sqmssteel,
            greyMsSteel: doc.chargingkgs?.greymssteel,
            returnsSg: doc.chargingkgs?.returnSg,
            gl: doc.chargingkgs?.gl,
            pigIron: doc.chargingkgs?.pigiron,
            borings: doc.chargingkgs?.borings,
            finalBath: doc.chargingkgs?.finalbath,
            // Table 2 - Additions
            charCoal: doc.charcoal,
            cpcFur: doc.cpc?.fur,
            cpcLc: doc.cpc?.lc,
            siliconCarbideFur: doc.siliconcarbide?.fur,
            ferrosiliconFur: doc.ferroSilicon?.fur,
            ferrosiliconLc: doc.ferroSilicon?.lc,
            ferroManganeseFur: doc.ferroManganese?.fur,
            ferroManganeseLc: doc.ferroManganese?.lc,
            cu: doc.cu,
            cr: doc.cr,
            pureMg: doc.pureMg,
            ironPyrite: doc.ironPyrite,
            // Table 3 - Timing Details
            labCoinTime: doc.labCoin?.time,
            labCoinTempC: doc.labCoin?.tempC,
            deslagingTimeFrom: doc.deslagingTime?.from,
            deslagingTimeTo: doc.deslagingTime?.to,
            metalReadyTime: doc.metalReadyTime,
            waitingForTappingFrom: doc.waitingForTapping?.from,
            waitingForTappingTo: doc.waitingForTapping?.to,
            reason: doc.reason,
            // Table 4 - Metal Tapping
            time: doc.metalTapping?.time,
            tempCSg: doc.metalTapping?.tempCSg,
            tempCGrey: doc.metalTapping?.tempCGrey,
            disaNo: doc.disaNo,
            item: doc.item,
            // Table 5 - Electrical Readings
            furnace1Kw: doc.electricalReadings?.furnace1?.kw,
            furnace1A: doc.electricalReadings?.furnace1?.a,
            furnace1V: doc.electricalReadings?.furnace1?.v,
            furnace2Kw: doc.electricalReadings?.furnace2?.kw,
            furnace2A: doc.electricalReadings?.furnace2?.a,
            furnace2V: doc.electricalReadings?.furnace2?.v,
            furnace3Kw: doc.electricalReadings?.furnace3?.kw,
            furnace3A: doc.electricalReadings?.furnace3?.a,
            furnace3V: doc.electricalReadings?.furnace3?.v,
            furnace4Hz: doc.electricalReadings?.furnace4?.hz,
            furnace4Gld: doc.electricalReadings?.furnace4?.gld,
            furnace4KwHr: doc.electricalReadings?.furnace4?.kwhr
        }));

        res.status(200).json({ success: true, data: flattened });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 3. THE "DYNAMIC" TABLE UPDATER **/

exports.createTableEntry = async (req, res) => {
    try {
        const { tableNum, primaryData, data } = req.body;
        if (!tableNum || !data || !primaryData?.date) {
            return res.status(400).json({ success: false, message: 'Table number, data, and date are required.' });
        }

        const document = await ensureDateDocument(MeltingLogsheet, primaryData.date);

        // Map Table Numbers to Model Schema Paths
        const updateMap = {
            1: { // Charging Details
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
                }
            },
            2: { // Additions
                charcoal: data.charCoal,
                cpc: { fur: data.cpcFur, lc: data.cpcLc },
                siliconcarbide: { fur: data.siliconCarbideFur },
                ferroSilicon: { fur: data.ferrosiliconFur, lc: data.ferrosiliconLc },
                ferroManganese: { fur: data.ferroManganeseFur, lc: data.ferroManganeseLc },
                cu: data.cu, cr: data.cr, pureMg: data.pureMg, ironPyrite: data.ironPyrite
            },
            3: { // Timing Details
                labCoin: { time: data.labCoinTime, tempC: data.labCoinTempC },
                deslagingTime: { from: data.deslagingTimeFrom, to: data.deslagingTimeTo },
                metalReadyTime: data.metalReadyTime,
                waitingForTapping: { from: data.waitingForTappingFrom, to: data.waitingForTappingTo },
                reason: data.reason
            },
            4: { // Metal Tapping
                metalTapping: { time: data.time, tempCSg: data.tempCSg, tempCGrey: data.tempCGrey },
                disaNo: data.disaNo,
                item: data.item
            },
            5: { // Electrical Readings
                electricalReadings: {
                    furnace1: { kw: data.furnace1Kw, a: data.furnace1A, v: data.furnace1V },
                    furnace2: { kw: data.furnace2Kw, a: data.furnace2A, v: data.furnace2V },
                    furnace3: { kw: data.furnace3Kw, a: data.furnace3A, v: data.furnace3V },
                    furnace4: { hz: data.furnace4Hz, gld: data.furnace4Gld, kwhr: data.furnace4KwHr }
                }
            }
        };

        const updateData = updateMap[tableNum];
        if (!updateData) return res.status(400).json({ success: false, message: 'Invalid Table Number' });

        // Deep merge the section into the document
        Object.assign(document, updateData);
        await document.save();

        res.status(200).json({ success: true, data: document, message: `Table ${tableNum} updated.` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. LOCKING & PRIMARY UPDATES **/

exports.createOrUpdatePrimary = async (req, res) => {
    try {
        const { primaryData, isLocked } = req.body;
        const document = await ensureDateDocument(MeltingLogsheet, primaryData.date);

        // Map primary fields (handling initial units and power metrics)
        document.shift = primaryData.shift || document.shift;
        document.furnaceNo = primaryData.furnaceNo || document.furnaceNo;
        document.initialkwhr = primaryData.initialKWHr || document.initialkwhr;
        document.finalkwhr = primaryData.finalKWHr || document.finalkwhr;
        document.isLocked = isLocked !== undefined ? isLocked : document.isLocked;

        await document.save();
        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 5. STANDARD CRUD **/

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const document = await MeltingLogsheet.findById(id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Map frontend field names to backend schema
        if (updateData.date) document.date = new Date(updateData.date);
        if (updateData.shift !== undefined) document.shift = updateData.shift;
        if (updateData.furnaceNo !== undefined) document.furnaceNo = updateData.furnaceNo;
        if (updateData.panel !== undefined) document.panel = updateData.panel;
        
        // Map numeric fields with correct backend names
        if (updateData.cumulativeLiquidMetal !== undefined) document.cumulativeLiquidMetal = updateData.cumulativeLiquidMetal;
        if (updateData.finalKWHr !== undefined) document.finalkwhr = updateData.finalKWHr;
        if (updateData.initialKWHr !== undefined) document.initialkwhr = updateData.initialKWHr;
        if (updateData.totalUnits !== undefined) document.totoalunits = updateData.totalUnits;
        if (updateData.cumulativeUnits !== undefined) document.cumulativeunits = updateData.cumulativeUnits;
        
        // Table 1 - Charging Details
        if (updateData.heatNo !== undefined) document.heatno = updateData.heatNo;
        if (updateData.grade !== undefined) document.grade = updateData.grade;
        
        if (!document.chargingkgs) document.chargingkgs = {};
        if (updateData.chargingTime !== undefined) document.chargingkgs.time = updateData.chargingTime;
        if (updateData.ifBath !== undefined) document.chargingkgs.ifbath = updateData.ifBath;
        
        if (!document.chargingkgs.liquidmetal) document.chargingkgs.liquidmetal = {};
        if (updateData.liquidMetalPressPour !== undefined) document.chargingkgs.liquidmetal.presspour = updateData.liquidMetalPressPour;
        if (updateData.liquidMetalHolder !== undefined) document.chargingkgs.liquidmetal.holder = updateData.liquidMetalHolder;
        
        if (updateData.sgMsSteel !== undefined) document.chargingkgs.sqmssteel = updateData.sgMsSteel;
        if (updateData.greyMsSteel !== undefined) document.chargingkgs.greymssteel = updateData.greyMsSteel;
        if (updateData.returnsSg !== undefined) document.chargingkgs.returnSg = updateData.returnsSg;
        if (updateData.gl !== undefined) document.chargingkgs.gl = updateData.gl;
        if (updateData.pigIron !== undefined) document.chargingkgs.pigiron = updateData.pigIron;
        if (updateData.borings !== undefined) document.chargingkgs.borings = updateData.borings;
        if (updateData.finalBath !== undefined) document.chargingkgs.finalbath = updateData.finalBath;
        
        // Table 2 - Additions
        if (updateData.charCoal !== undefined) document.charcoal = updateData.charCoal;
        
        if (!document.cpc) document.cpc = {};
        if (updateData.cpcFur !== undefined) document.cpc.fur = updateData.cpcFur;
        if (updateData.cpcLc !== undefined) document.cpc.lc = updateData.cpcLc;
        
        if (!document.siliconcarbide) document.siliconcarbide = {};
        if (updateData.siliconCarbideFur !== undefined) document.siliconcarbide.fur = updateData.siliconCarbideFur;
        
        if (!document.ferroSilicon) document.ferroSilicon = {};
        if (updateData.ferrosiliconFur !== undefined) document.ferroSilicon.fur = updateData.ferrosiliconFur;
        if (updateData.ferrosiliconLc !== undefined) document.ferroSilicon.lc = updateData.ferrosiliconLc;
        
        if (!document.ferroManganese) document.ferroManganese = {};
        if (updateData.ferroManganeseFur !== undefined) document.ferroManganese.fur = updateData.ferroManganeseFur;
        if (updateData.ferroManganeseLc !== undefined) document.ferroManganese.lc = updateData.ferroManganeseLc;
        
        if (updateData.cu !== undefined) document.cu = updateData.cu;
        if (updateData.cr !== undefined) document.cr = updateData.cr;
        if (updateData.pureMg !== undefined) document.pureMg = updateData.pureMg;
        if (updateData.ironPyrite !== undefined) document.ironPyrite = updateData.ironPyrite;
        
        // Table 3 - Timing Details
        if (!document.labCoin) document.labCoin = {};
        if (updateData.labCoinTime !== undefined) document.labCoin.time = updateData.labCoinTime;
        if (updateData.labCoinTempC !== undefined) document.labCoin.tempC = updateData.labCoinTempC;
        
        if (!document.deslagingTime) document.deslagingTime = {};
        if (updateData.deslagingTimeFrom !== undefined) document.deslagingTime.from = updateData.deslagingTimeFrom;
        if (updateData.deslagingTimeTo !== undefined) document.deslagingTime.to = updateData.deslagingTimeTo;
        
        if (updateData.metalReadyTime !== undefined) document.metalReadyTime = updateData.metalReadyTime;
        
        if (!document.waitingForTapping) document.waitingForTapping = {};
        if (updateData.waitingForTappingFrom !== undefined) document.waitingForTapping.from = updateData.waitingForTappingFrom;
        if (updateData.waitingForTappingTo !== undefined) document.waitingForTapping.to = updateData.waitingForTappingTo;
        
        if (updateData.reason !== undefined) document.reason = updateData.reason;
        
        // Table 4 - Metal Tapping
        if (!document.metalTapping) document.metalTapping = {};
        if (updateData.time !== undefined) document.metalTapping.time = updateData.time;
        if (updateData.tempCSg !== undefined) document.metalTapping.tempCSg = updateData.tempCSg;
        if (updateData.tempCGrey !== undefined) document.metalTapping.tempCGrey = updateData.tempCGrey;
        
        if (updateData.disaNo !== undefined) document.disaNo = updateData.disaNo;
        if (updateData.item !== undefined) document.item = updateData.item;
        
        // Table 5 - Electrical Readings
        if (!document.electricalReadings) document.electricalReadings = {};
        if (!document.electricalReadings.furnace1) document.electricalReadings.furnace1 = {};
        if (updateData.furnace1Kw !== undefined) document.electricalReadings.furnace1.kw = updateData.furnace1Kw;
        if (updateData.furnace1A !== undefined) document.electricalReadings.furnace1.a = updateData.furnace1A;
        if (updateData.furnace1V !== undefined) document.electricalReadings.furnace1.v = updateData.furnace1V;
        
        if (!document.electricalReadings.furnace2) document.electricalReadings.furnace2 = {};
        if (updateData.furnace2Kw !== undefined) document.electricalReadings.furnace2.kw = updateData.furnace2Kw;
        if (updateData.furnace2A !== undefined) document.electricalReadings.furnace2.a = updateData.furnace2A;
        if (updateData.furnace2V !== undefined) document.electricalReadings.furnace2.v = updateData.furnace2V;
        
        if (!document.electricalReadings.furnace3) document.electricalReadings.furnace3 = {};
        if (updateData.furnace3Kw !== undefined) document.electricalReadings.furnace3.kw = updateData.furnace3Kw;
        if (updateData.furnace3A !== undefined) document.electricalReadings.furnace3.a = updateData.furnace3A;
        if (updateData.furnace3V !== undefined) document.electricalReadings.furnace3.v = updateData.furnace3V;
        
        if (!document.electricalReadings.furnace4) document.electricalReadings.furnace4 = {};
        if (updateData.furnace4Hz !== undefined) document.electricalReadings.furnace4.hz = updateData.furnace4Hz;
        if (updateData.furnace4Gld !== undefined) document.electricalReadings.furnace4.gld = updateData.furnace4Gld;
        if (updateData.furnace4KwHr !== undefined) document.electricalReadings.furnace4.kwhr = updateData.furnace4KwHr;

        await document.save();
        res.status(200).json({ success: true, data: document, message: 'Entry updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        await MeltingLogsheet.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Logsheet removed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};