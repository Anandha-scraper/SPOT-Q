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

exports.deleteEntry = async (req, res) => {
    try {
        await MeltingLogsheet.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Logsheet removed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};