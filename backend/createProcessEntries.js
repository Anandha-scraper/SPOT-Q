require('dotenv').config();
const mongoose = require('mongoose');
const Process = require('./models/Process');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Delete all existing process records
    await Process.deleteMany({});
    console.log('Deleted all process records');
    
    // Create entries from Dec 26, 2025 to Jan 19, 2026
    const startDate = new Date('2025-12-26');
    const endDate = new Date('2026-01-19');
    const entries = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      entries.push({
        date: new Date(d),
        disa: 'DISA I',
        partName: '',
        datecode: '',
        heatcode: '',
        quantityOfMoulds: 0
      });
    }
    
    await Process.insertMany(entries);
    console.log(`Created ${entries.length} empty entries from Dec 26, 2025 to Jan 19, 2026`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
