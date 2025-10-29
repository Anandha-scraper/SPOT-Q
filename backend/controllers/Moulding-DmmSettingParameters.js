const DmmSettingParameters = require('../models/Moulding-DmmSettingParameters');

// Create new DMM Setting Parameters record
const createDMMSettings = async (req, res) => {
    try {
        const newSettings = new DmmSettingParameters(req.body);
        const savedSettings = await newSettings.save();
        res.status(201).json({
            success: true,
            data: savedSettings,
            message: 'DMM Settings created successfully.'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get all DMM Setting Parameters records
const getAllDMMSettings = async (req, res) => {
    try {
        const settings = await DmmSettingParameters.find().sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get DMM Setting Parameters by ID
const getDMMSettingsById = async (req, res) => {
    try {
        const settings = await DmmSettingParameters.findById(req.params.id);
        if (!settings) {
            return res.status(404).json({ 
                success: false,
                message: 'Settings not found' 
            });
        }
        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get DMM Settings by Date Range
const getDMMSettingsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const settings = await DmmSettingParameters.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get DMM Settings by Machine
const getDMMSettingsByMachine = async (req, res) => {
    try {
        const { machine, date } = req.query;
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const settings = await DmmSettingParameters.find({
            machine: machine,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get DMM Settings by Shift
const getDMMSettingsByShift = async (req, res) => {
    try {
        const { shift, date } = req.query;
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const settings = await DmmSettingParameters.find({
            'parameters.shift': shift,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get Parameters by Customer
const getDMMSettingsByCustomer = async (req, res) => {
    try {
        const { customer } = req.query;
        const settings = await DmmSettingParameters.find({
            'parameters.customer': customer
        }).sort({ date: -1 });
        res.status(200).json({
            success: true,
            count: settings.length,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Update DMM Setting Parameters
const updateDMMSettings = async (req, res) => {
    try {
        const updatedSettings = await DmmSettingParameters.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedSettings) {
            return res.status(404).json({ 
                success: false,
                message: 'Settings not found' 
            });
        }
        res.status(200).json({
            success: true,
            data: updatedSettings,
            message: 'DMM Settings updated successfully.'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Delete DMM Setting Parameters
const deleteDMMSettings = async (req, res) => {
    try {
        const settings = await DmmSettingParameters.findByIdAndDelete(req.params.id);
        if (!settings) {
            return res.status(404).json({ 
                success: false,
                message: 'Settings not found' 
            });
        }
        res.status(200).json({ 
            success: true,
            message: 'Settings deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    createDMMSettings,
    getAllDMMSettings,
    getDMMSettingsById,
    getDMMSettingsByDateRange,
    getDMMSettingsByMachine,
    getDMMSettingsByShift,
    getDMMSettingsByCustomer,
    updateDMMSettings,
    deleteDMMSettings
};
