const DMM = require('../models/Moulding-DmmSettingParameters');
const { sendError } = require('../utils/mongooseError');
const { ensureDateDocument, getCurrentDate } = require('../utils/dateUtils');

/** 1. SYSTEM INITIALIZATION **/

exports.initializeTodayEntry = async () => {
    // Skip initialization - DMM documents are created on-demand when data is provided
    return;
};

/** 2. DATA RETRIEVAL **/

exports.getDMMSettingsByDate = async (req, res) => {
    try {
        const { date, machine, shift } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date required.' });

        const document = await DMM.findOne({ date: new Date(date) });
        
        if (!document) {
            return res.status(200).json({ success: true, data: [] });
        }

        // If machine and shift are provided, filter for specific entry
        if (machine && shift) {
            const entry = document.entries.find(e => 
                e.machine === String(machine).trim() && e.shift === String(shift).trim()
            );
            return res.status(200).json({ 
                success: true, 
                data: entry ? [{ date: document.date, entries: [entry] }] : [] 
            });
        }

        // If only machine is provided, filter for that machine (all shifts)
        if (machine) {
            const machineEntries = document.entries.filter(e => e.machine === String(machine).trim());
            return res.status(200).json({ 
                success: true, 
                data: machineEntries.length > 0 ? [{ date: document.date, entries: machineEntries }] : [] 
            });
        }

        // Return all entries for the date
        res.status(200).json({ success: true, data: [document] });
    } catch (error) {
        sendError(res, error);
    }
};

/** 3. CORE LOGIC (Smart Sectional Update) **/

exports.createDMMSettings = async (req, res) => {
    try {
        const { date, machine, section, ...payload } = req.body;
        
        if (!date || !machine) {
            return res.status(400).json({ success: false, message: 'Date and Machine required.' });
        }

        // Find or create document for this date
        let document = await DMM.findOne({ date: new Date(date) });
        if (!document) {
            document = new DMM({ 
                date: new Date(date),
                entries: []
            });
        }

        // Sectional Logic
        if (section === 'operation') {
            // Update Operator/Checker Info for specific shift
            if (payload.shifts) {
                for (const [shiftKey, shiftData] of Object.entries(payload.shifts)) {
                    const shiftNumber = shiftKey.replace('shift', '');
                    
                    // Find or create entry for this machine+shift
                    let entry = document.entries.find(e => 
                        e.machine === String(machine).trim() && e.shift === shiftNumber
                    );
                    
                    if (!entry) {
                        entry = {
                            machine: String(machine).trim(),
                            shift: shiftNumber,
                            operatorName: shiftData.operatorName || '',
                            checkedBy: shiftData.checkedBy || '',
                            parameters: []
                        };
                        document.entries.push(entry);
                    } else {
                        // Update existing entry
                        if (shiftData.operatorName !== undefined) entry.operatorName = shiftData.operatorName;
                        if (shiftData.checkedBy !== undefined) entry.checkedBy = shiftData.checkedBy;
                    }
                }
            }
        } 
        else if (['shift1', 'shift2', 'shift3'].includes(section)) {
            // Add a new Parameter entry to the specific machine+shift
            const shiftNumber = section.replace('shift', '');
            const shiftData = payload.parameters?.[section];
            
            if (shiftData) {
                // Find or create entry for this machine+shift
                let entry = document.entries.find(e => 
                    e.machine === String(machine).trim() && e.shift === shiftNumber
                );
                
                if (!entry) {
                    entry = {
                        machine: String(machine).trim(),
                        shift: shiftNumber,
                        operatorName: '',
                        checkedBy: '',
                        parameters: []
                    };
                    document.entries.push(entry);
                }
                
                const nextSNo = (entry.parameters.length || 0) + 1;
                entry.parameters.push({ ...shiftData, sNo: nextSNo });
            }
        }

        await document.save();
        res.status(200).json({ success: true, data: document, message: `${section} recorded successfully.` });

    } catch (error) {
        sendError(res, error);
    }
};

/** 4. SEARCH & ANALYTICS **/

exports.getAllDMMSettings = async (req, res) => {
    try {
        // Fetch all DMM settings, sorted by date descending
        const results = await DMM.find({}).sort({ date: -1 });
        
        // Transform data to match frontend expectations
        // Flatten so each machine on each date becomes a separate record
        const transformedData = [];
        
        results.forEach(doc => {
            // Group parameters by machine
            const machineGroups = {};
            doc.entries.forEach(entry => {
                const machine = entry.machine;
                if (!machineGroups[machine]) {
                    machineGroups[machine] = {
                        machine: machine,
                        shifts: {},
                        parameters: {}
                    };
                }
                
                const shiftKey = `shift${entry.shift}`;
                machineGroups[machine].shifts[shiftKey] = {
                    operatorName: entry.operatorName || '',
                    checkedBy: entry.checkedBy || ''
                };
                machineGroups[machine].parameters[shiftKey] = entry.parameters || [];
            });
            
            // Create a separate record for each machine
            Object.keys(machineGroups).forEach(machine => {
                transformedData.push({
                    _id: doc._id,
                    date: doc.date,
                    machine: machine,
                    shifts: machineGroups[machine].shifts,
                    parameters: machineGroups[machine].parameters
                });
            });
        });
        
        res.status(200).json({ success: true, count: transformedData.length, data: transformedData });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getDMMSettingsByCustomer = async (req, res) => {
    try {
        const { customer } = req.query;
        // Search across all entries for a specific customer
        const results = await DMM.find({
            'entries.parameters.customer': customer
        }).sort({ date: -1 });

        res.status(200).json({ success: true, count: results.length, data: results });
    } catch (error) {
        sendError(res, error);
    }
};