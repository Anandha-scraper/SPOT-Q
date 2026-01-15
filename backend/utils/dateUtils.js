// backend/utils/dateUtils.js
const mongoose = require('mongoose');
const ensureDateDocument = async (Model, dateString) => {

    // 1. Convert YYYY-MM-DD to a clean UTC Date object (00:00:00)
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // 2. Find or Create the daily batch document
    let document = await Model.findOne({ date: dateObj });
    if (!document) {
        document = await Model.create({
            date: dateObj,
            entries: []
        });
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