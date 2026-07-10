const mongoose = require('mongoose');
const LoginActivity = require('../models/LoginActivity');
const User = require('../models/user');
async function keepLastNLoginActivities(keepCount = 5) {
    try {
        // Get all unique userIds
        const userIds = await LoginActivity.distinct('userId');
        if (userIds.length === 0) {
            return { deletedCount: 0 };
        }
        let totalDeleted = 0;
        // Process each user
        for (const userId of userIds) {
            // Get all login activities for this user, sorted by loginAt descending
            const activities = await LoginActivity.find({ userId })
                .sort({ loginAt: -1 })
                .select('_id loginAt');
            // If user has more than keepCount activities, delete the excess
            if (activities.length > keepCount) {
                const activitiesToKeep = activities.slice(0, keepCount);
                const idsToKeep = activitiesToKeep.map(a => a._id);
                // Delete all activities for this user except the ones to keep
                const result = await LoginActivity.deleteMany({
                    userId: userId,
                    _id: { $nin: idsToKeep }
                });
                totalDeleted += result.deletedCount;
            }
        }
        return { deletedCount: totalDeleted };
    } catch (error) {
        console.error('[Cleanup] Error keeping last N login activities:', error);
        throw error;
    }
}

/**
 * Keep only the last N login activities for a specific user
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} keepCount
 * @returns {Promise<{deletedCount: number}>}
 */
async function keepLastNLoginActivitiesForUser(userId, keepCount = 5) {
    try {
        if (!userId) {
            return { deletedCount: 0 };
        }

        const activities = await LoginActivity.find({ userId })
            .sort({ loginAt: -1 })
            .select('_id');

        if (activities.length <= keepCount) {
            return { deletedCount: 0 };
        }

        const idsToKeep = activities.slice(0, keepCount).map(a => a._id);
        const result = await LoginActivity.deleteMany({
            userId: userId,
            _id: { $nin: idsToKeep }
        });

        return { deletedCount: result.deletedCount };
    } catch (error) {
        console.error('[Cleanup] Error keeping last N login activities for user:', error);
        throw error;
    }
}
async function deleteOrphanedLoginActivities() {
    try {
        // Get all distinct userIds from LoginActivity
        const loginActivityUserIds = await LoginActivity.distinct('userId');
        
        if (loginActivityUserIds.length === 0) {
            return { deletedCount: 0 };
        }

        // Get all existing user IDs
        const existingUserIds = await User.distinct('_id');
        
        // Convert to strings for comparison
        const existingUserIdStrings = existingUserIds.map(id => id.toString());
        
        // Find userIds in LoginActivity that don't exist in User collection
        const orphanedUserIds = loginActivityUserIds.filter(
            userId => !existingUserIdStrings.includes(userId.toString())
        );

        if (orphanedUserIds.length === 0) {
            return { deletedCount: 0 };
        }

        // Delete orphaned login activities
        const result = await LoginActivity.deleteMany({
            userId: { $in: orphanedUserIds }
        });

        return { deletedCount: result.deletedCount };
    } catch (error) {
        console.error('[Cleanup] Error deleting orphaned login activities:', error);
        throw error;
    }
}
async function cleanupLoginActivity(keepCount = 5) {
    try {
        // Keep only last N records per user
        const excessResult = await keepLastNLoginActivities(keepCount);
        
        // Delete orphaned records
        const orphanedResult = await deleteOrphanedLoginActivities();
        
        const totalDeleted = excessResult.deletedCount + orphanedResult.deletedCount;
        
        return {
            excess: excessResult.deletedCount,
            orphaned: orphanedResult.deletedCount,
            total: totalDeleted
        };
    } catch (error) {
        console.error('[Cleanup] Cleanup process failed:', error);
        throw error;
    }
}

// If run directly (not imported as module)
if (require.main === module) {
    // Connect to MongoDB
    require('dotenv').config();

    if (!process.env.MONGODB_URI) {
        console.error('[Cleanup] MONGODB_URI is not defined in .env — cannot run cleanup.');
        process.exit(1);
    }

    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async () => {
        console.log('[Cleanup] Database connected');
        
        // Run cleanup (keep last 5 login activities per user)
        await cleanupLoginActivity(5);
        
        // Close connection
        await mongoose.connection.close();
        console.log('[Cleanup] Database connection closed');
        process.exit(0);
    })
    .catch(error => {
        console.error('[Cleanup] Database connection error:', error);
        process.exit(1);
    });
}

module.exports = {
    cleanupLoginActivity,
    keepLastNLoginActivities,
    keepLastNLoginActivitiesForUser,
    deleteOrphanedLoginActivities
};
