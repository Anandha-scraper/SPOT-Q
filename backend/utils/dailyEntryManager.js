const cron = require('node-cron');

const initializeDailyEntry = (Model, modelName, schedule = '1 0 * * *') => {
    cron.schedule(schedule, async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const existingDoc = await Model.findOne({ date: today });
            
            if (!existingDoc) {
                await Model.create({ date: today, entries: [] });
                console.log(`Created empty ${modelName} document for ${today}`);
            } else {
                console.log(`ℹ ${modelName} document for ${today} already exists`);
            }
        } catch (error) {
            console.error(`Failed to create daily ${modelName} entry:`, error.message);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log(`${modelName} daily entry cron job initialized`);
};

const ensureTodayEntry = async (Model, modelName) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const existingDoc = await Model.findOne({ date: today });
        
        if (!existingDoc) {
            await Model.create({ date: today, entries: [] });
            console.log(`Created empty ${modelName} document for ${today}`);
        }
    } catch (error) {
        console.error(`Failed to initialize today's ${modelName} entry:`, error.message);
    }
};

module.exports = { initializeDailyEntry, ensureTodayEntry };
