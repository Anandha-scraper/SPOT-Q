const mongoose = require('mongoose');
const User = require('../models/user');
const path = require('path');
// npm run create-admin
if (require.main === module) {
    const rootEnv = path.join(__dirname, '..', '..', '.env');
    const backendEnv = path.join(__dirname, '..', '.env');
    require('dotenv').config({ path: rootEnv });
    if (!process.env.MONGODB_URI) {
        require('dotenv').config({ path: backendEnv });
    }
}
async function createAdminUser(employeeId = 'ADMIN001', password = 'Admin@123', name = 'Administrator') {
    try {
        // Ensure MongoDB connection
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        const employeeIdUpper = employeeId.toUpperCase();
        // Check if user with this Employee ID exists
        let admin = await User.findOne({ employeeId: employeeIdUpper });

        if (admin) {
            // Update existing user to admin
            admin.password = password; // Will be hashed by pre-save hook
            admin.role = 'admin';
            admin.department = 'Admin';
            admin.name = name;
            admin.isActive = true;
            
            await admin.save();
            
            return {
                success: true,
                action: 'updated',
                user: admin.toJSON(),
                message: `Admin user with Employee ID "${employeeIdUpper}" has been updated.`
            };
        } else {
            // Create new admin user
            admin = new User({
                employeeId: employeeIdUpper,
                name: name,
                password: password, // Will be hashed by pre-save hook
                department: 'Admin',
                role: 'admin',
                isActive: true
            });

            await admin.save();
            
            return {
                success: true,
                action: 'created',
                user: admin.toJSON(),
                message: `Admin user with Employee ID "${employeeIdUpper}" has been created.`
            };
        }
    } catch (error) {
        throw {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Standalone script execution
 */
async function runAsScript() {
    try {
        // Get credentials from command line arguments or use defaults
        const employeeId = process.argv[2] || 'ADMIN001';
        const password = process.argv[3] || 'Admin@123';
        const name = process.argv[4] || 'Administrator';

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected\n');

        const result = await createAdminUser(employeeId, password, name);

        if (result.success) {
            console.log(`   Admin user ${result.action} successfully!`);
            console.log(`   Employee ID: ${result.user.employeeId}`);
            console.log(`   Name: ${result.user.name}`);
            console.log(`   Role: ${result.user.role}`);
            console.log(`   Department: ${result.user.department}`);
            console.log(`   Password: ${password} (hashed and stored)\n`);

            console.log('   Login Credentials:');
            console.log(`   Employee ID: ${employeeId.toUpperCase()}`);
            console.log(`   Password: ${password}\n`);
        }
    } catch (error) {
        console.error('Error:', error.error || error.message);
        if (error.code === 11000) {
            console.error('   Duplicate key error: Employee ID or email already exists.');
        }
        process.exit(1);
    } finally {
        // Close MongoDB connection if we opened it
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed.');
        }
        process.exit(0);
    }
}

// Export the function for use in other modules
module.exports = { createAdminUser };

// Run as standalone script if called directly
if (require.main === module) {
    runAsScript();
}

