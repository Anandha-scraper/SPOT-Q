const DISA = require('../models/Moulding-DismaticProductReportDISA');
const { sendError } = require('../utils/mongooseError');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    return;
};

/** 2. DATA RETRIEVAL **/

exports.getDismaticReportByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

        const report = await ensureDateDocument(DISA, date);
        res.status(200).json({ success: true, data: report ? [report] : [], count: report ? 1 : 0 });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getDismaticReportsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Range required.' });

        // Use standard UTC parsing
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        const reports = await DISA.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 });
        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (error) {
        sendError(res, error);
    }
};

/** 3. THE "SMART" SECTION UPDATER **/

exports.createDismaticReport = async (req, res) => {
    try {
        const { date, section, ...payload } = req.body;
        const document = await ensureDateDocument(DISA, date);

        // Helper to format table rows with Serial Numbers
        const formatTable = (existingArr, newTable, schemaMap) => {
            const startSNo = (existingArr || []).length;
            return (newTable || [])
                .filter(row => row && Object.values(row).some(v => v !== '')) // Only rows with data
                .map((row, idx) => {
                    let formatted = { sNo: startSNo + idx + 1 };
                    Object.keys(schemaMap).forEach(key => {
                        formatted[key] = row[key] || schemaMap[key];
                    });
                    return formatted;
                });
        };

        switch (section) {
            case 'basicInfo':
                document.shift = payload.shift || document.shift;
                document.incharge = payload.incharge || document.incharge;
                document.ppOperator = payload.ppOperator || document.ppOperator;
                if (payload.members) {
                    document.memberspresent = Array.isArray(payload.members) ? payload.members.join(', ') : payload.members;
                }
                break;

            case 'production':
                const prodEntries = formatTable(document.productionDetails, payload.productionTable, { 
                    counterNo: '', componentName: '', produced: 0, poured: 0, cycleTime: '', mouldsPerHour: 0, remarks: '' 
                });
                document.productionDetails.push(...prodEntries);
                break;

            case 'nextShiftPlan':
                const planEntries = formatTable(document.nextShiftPlan, payload.nextShiftPlanTable, { 
                    componentName: '', plannedMoulds: 0, remarks: '' 
                });
                document.nextShiftPlan.push(...planEntries);
                break;

            case 'delays':
                const delayEntries = formatTable(document.delays, payload.delaysTable, { 
                    delays: '', durationMinutes: [], fromTime: [], toTime: [] 
                });
                document.delays.push(...delayEntries);
                break;

            case 'mouldHardness':
                const hardEntries = formatTable(document.mouldHardness, payload.mouldHardnessTable, { 
                    componentName: '', mpPP: [], mpSP: [], bsPP: [], bsSP: [], remarks: '' 
                });
                document.mouldHardness.push(...hardEntries);
                break;

            case 'patternTemp':
                const tempEntries = formatTable(document.patternTemperature, payload.patternTempTable, { 
                    item: '', pp: 0, sp: 0 
                });
                document.patternTemperature.push(...tempEntries);
                break;

            case 'events':
            case 'eventSection':
                if (payload.significantEvent) document.significantEvent = payload.significantEvent;
                if (payload.maintenance) document.maintenance = payload.maintenance;
                if (payload.supervisorName) document.supervisorName = payload.supervisorName;
                break;
            
            case 'all':
                Object.assign(document, payload);
                break;
        }

        await document.save();
        res.status(200).json({ success: true, data: document, message: `${section} updated.` });

    } catch (error) {
        sendError(res, error);
    }
};

/** 4. PRIMARY DATA MANAGEMENT **/

// Get primary data by date and shift
exports.getPrimaryDataByDateShift = async (req, res) => {
    try {
        const { date, shift } = req.query;
        
        if (!date || !shift) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date and shift are required.' 
            });
        }

        // Parse date to ensure consistent format
        const queryDate = new Date(date);
        queryDate.setUTCHours(0, 0, 0, 0);

        // Find document by date and shift
        const document = await DISA.findOne({ 
            date: queryDate, 
            shift: shift 
        }).lean();

        if (!document) {
            return res.status(200).json({ 
                success: true, 
                data: null,
                message: 'No data found for this date and shift.' 
            });
        }

        // Return only primary data fields
        const primaryData = {
            date: document.date,
            shift: document.shift,
            incharge: document.incharge,
            ppOperator: document.ppOperator,
            memberspresent: document.memberspresent,
            productionCount: document.productionDetails ? document.productionDetails.length : 0,
            nextShiftPlanCount: document.nextShiftPlan ? document.nextShiftPlan.length : 0,
            delaysCount: document.delays ? document.delays.length : 0,
            mouldHardnessCount: document.mouldHardness ? document.mouldHardness.length : 0,
            patternTempCount: document.patternTemperature ? document.patternTemperature.length : 0,
            significantEvent: document.significantEvent,
            maintenance: document.maintenance,
            supervisorName: document.supervisorName
        };

        res.status(200).json({ 
            success: true, 
            data: primaryData 
        });

    } catch (error) {
        sendError(res, error);
    }
};

// Save or update primary data
exports.savePrimaryData = async (req, res) => {
    try {
        const { date, shift, incharge, ppOperator, members } = req.body;

        if (!date || !shift) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date and shift are required.' 
            });
        }

        // Parse date to ensure consistent format
        const docDate = new Date(date);
        docDate.setUTCHours(0, 0, 0, 0);

        // Prepare update data - only include fields that are provided
        const updateData = {
            date: docDate,
            shift: shift
        };

        // Only add fields if they are provided (not empty)
        if (incharge !== undefined && incharge !== null) {
            updateData.incharge = incharge.trim() || null;
        }
        if (ppOperator !== undefined && ppOperator !== null) {
            updateData.ppOperator = ppOperator.trim() || null;
        }
        if (members !== undefined && members !== null) {
            // Filter out empty strings from members array
            const filteredMembers = Array.isArray(members) 
                ? members.filter(m => m && m.trim() !== '') 
                : [];
            
            // Limit to maximum 4 members
            if (filteredMembers.length > 4) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Maximum 4 members allowed.' 
                });
            }
            
            updateData.memberspresent = filteredMembers.length > 0 ? filteredMembers : null;
        }

        // Use findOneAndUpdate with upsert to create or update
        const document = await DISA.findOneAndUpdate(
            { date: docDate, shift: shift },
            { $set: updateData },
            { 
                new: true, // Return updated document
                upsert: true, // Create if doesn't exist
                setDefaultsOnInsert: true // Set defaults when creating
            }
        );

        res.status(200).json({ 
            success: true, 
            data: {
                date: document.date,
                shift: document.shift,
                incharge: document.incharge,
                ppOperator: document.ppOperator,
                memberspresent: document.memberspresent
            },
            message: 'Primary data saved successfully.' 
        });

    } catch (error) {
        sendError(res, error);
    }
};