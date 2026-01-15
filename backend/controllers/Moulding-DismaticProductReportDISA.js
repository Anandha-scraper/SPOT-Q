const DISA = require('../models/Moulding-DismaticProductReportDISA');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    // Skip initialization - DISA documents require 'shift' field
    // Documents will be created via createDismaticReport when actual data is provided
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
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
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
                    delays: '', durationMinutes: 0, durationTime: '' 
                });
                document.delays.push(...delayEntries);
                break;

            case 'mouldHardness':
                const hardEntries = formatTable(document.mouldHardness, payload.mouldHardnessTable, { 
                    componentName: '', mpPP: 0, mpSP: 0, bsPP: 0, bsSP: 0, remarks: '' 
                });
                document.mouldHardness.push(...hardEntries);
                break;

            case 'patternTemp':
                const tempEntries = formatTable(document.patternTemperature, payload.patternTempTable, { 
                    item: '', pp: 0, sp: 0 
                });
                document.patternTemperature.push(...tempEntries);
                break;

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
        res.status(400).json({ success: false, message: error.message });
    }
};

/** 4. STANDARD CRUD **/

exports.updateDismaticReport = async (req, res) => {
    try {
        const report = await DISA.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteDismaticReport = async (req, res) => {
    try {
        await DISA.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};