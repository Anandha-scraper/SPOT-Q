// backend/utils/dateUtils.js
const mongoose = require('mongoose');
const ensureDateDocument = async (Model, dateString, extraQuery = {}, extraFields = {}) => {
    // 1. Convert YYYY-MM-DD to a clean UTC Date object (00:00:00)
    const [year, month, day] = dateString.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // 2. Find document using date range to handle any timezone variations
    let document = await Model.findOne({
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        ...extraQuery
    });

    // 3. If not found, create with exact start of day
    if (!document) {
        try {
            document = await Model.create({
                date: startOfDay,
                entries: [],
                ...extraFields
            });
        } catch (error) {
            // Handle race condition - if another request created it simultaneously
            if (error.code === 11000) { // Duplicate key error
                document = await Model.findOne({
                    date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    },
                    ...extraQuery
                });
            } else {
                throw error;
            }
        }
    }
    return document;
};

// UI LOGIC: Returns YYYY-MM-DD based on local server time
const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

module.exports = {
    ensureDateDocument,
    getCurrentDate,
    formatDate
};