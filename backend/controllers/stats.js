// Per-day entry statistics for the profile "Activity" charts.
//
// - getEntryStats: per-user, per-day counts across the logged-in user's
//   department collection(s) for a given month.
// - getAdminEntryStats: cross-department, per-day counts (all authors) for the
//   admin "Department Entry Trends" chart.
//
// No model stores year/month; each has a root `date` field (a Date on most
// models, but a 'YYYY-MM-DD' String on Process and MicroStructure). Records are
// grouped into a calendar day by that root `date`.

const MeltingLogsheet = require('../models/Melting-MeltingLogsheet');
const CupolaHolderLog = require('../models/Melting-CupolaHolderLog');
const DmmSettingParameters = require('../models/Moulding-DmmSettingParameters');
const Process = require('../models/Process');
const Tensile = require('../models/Tensile');
const Impact = require('../models/Impact');
const MicroTensile = require('../models/MicroTensile');
const MicroStructure = require('../models/MicroStructure');
const QcProduction = require('../models/QcProduction');

// Which model(s) power each department's personal chart, their document shape,
// and whether entries can be filtered to a single author (createdBy present).
// Sand Lab is table-based and intentionally absent (handled as `null`).
const DEPT_SOURCES = {
    'Melting': [
        { model: MeltingLogsheet, shape: 'deepNested', filterUser: true },
        { model: CupolaHolderLog, shape: 'deepNested', filterUser: false },
    ],
    'Moulding': [
        // DMM only — the DISA report is table-based and excluded.
        { model: DmmSettingParameters, shape: 'nested', filterUser: false },
    ],
    'Process': [{ model: Process, shape: 'nested', filterUser: true }],
    'Tensile': [{ model: Tensile, shape: 'nested', filterUser: true }],
    'Impact': [{ model: Impact, shape: 'nested', filterUser: false }],
    'Micro Tensile': [{ model: MicroTensile, shape: 'nested', filterUser: true }],
    'Micro Structure': [{ model: MicroStructure, shape: 'nested', filterUser: true }],
    'QC - production': [{ model: QcProduction, shape: 'flat', filterUser: true }],
};

// Labelled sources for the admin chart. Labels MUST match ADMIN_DEPARTMENTS in
// frontend/src/Components/UserProfile.jsx exactly (middle-dot + casing) so the
// frontend can line each dataset up with its legend/colour.
const ADMIN_SOURCES = [
    { label: 'Melting · Log Sheet', model: MeltingLogsheet, shape: 'deepNested' },
    { label: 'Melting · Cupola Holder', model: CupolaHolderLog, shape: 'deepNested' },
    { label: 'Moulding · DMM', model: DmmSettingParameters, shape: 'nested' },
    { label: 'Process', model: Process, shape: 'nested' },
    { label: 'Tensile', model: Tensile, shape: 'nested' },
    { label: 'Impact', model: Impact, shape: 'nested' },
    { label: 'Micro Tensile', model: MicroTensile, shape: 'nested' },
    { label: 'Micro Structure', model: MicroStructure, shape: 'nested' },
    { label: 'QC - Production', model: QcProduction, shape: 'flat' },
];

// Resolve year/month (1-based) + daysInMonth from the request query, defaulting
// to the current calendar month.
const resolvePeriod = (req) => {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    return { year, month, daysInMonth };
};

// Build a type-aware `date` range filter for the given month. Date-typed fields
// get a Date range; String-typed fields ('YYYY-MM-DD') get a lexical range,
// which sorts correctly for ISO dates.
const buildDateFilter = (model, year, month) => {
    const isString = model.schema.path('date') &&
        model.schema.path('date').instance === 'String';
    if (isString) {
        const mm = String(month).padStart(2, '0');
        const start = `${year}-${mm}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        return { date: { $gte: start, $lt: end } };
    }
    return { date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } };
};

// Day-of-month (1-31) for a record's root `date`. Strings are 'YYYY-MM-DD'
// (slice the day directly); Dates use UTC to avoid timezone drift.
const dayOfMonth = (dateVal) => {
    if (typeof dateVal === 'string') return parseInt(dateVal.slice(8, 10), 10);
    const d = new Date(dateVal);
    return d.getUTCDate();
};

// Tally one source's month docs into `countByDay`. When `userId` is provided,
// only entries authored by that user are counted (sources without a createdBy
// field pass userId = null to count all entries).
const tallySource = async (source, year, month, userId, countByDay) => {
    const docs = await source.model.find(buildDateFilter(source.model, year, month));

    docs.forEach((doc) => {
        if (!doc.date) return;
        const day = dayOfMonth(doc.date);
        if (!day) return;

        const matches = (createdBy) =>
            !userId || String(createdBy) === String(userId);

        if (source.shape === 'flat') {
            if (matches(doc.createdBy)) countByDay[day] = (countByDay[day] || 0) + 1;
        } else if (source.shape === 'nested') {
            (doc.entries || []).forEach((entry) => {
                if (matches(entry.createdBy)) countByDay[day] = (countByDay[day] || 0) + 1;
            });
        } else if (source.shape === 'deepNested') {
            (doc.primaries || []).forEach((primary) => {
                (primary.entries || []).forEach((entry) => {
                    if (matches(entry.createdBy)) countByDay[day] = (countByDay[day] || 0) + 1;
                });
            });
        }
    });
};

// Convert a day->count map into the { day, count } series for every day of the
// month (zero-filled for days with no entries).
const toCountsArray = (countByDay, daysInMonth) =>
    Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        count: countByDay[i + 1] || 0,
    }));

// Per-user, per-day entry counts for the current user's department.
exports.getEntryStats = async (req, res) => {
    try {
        const { year, month, daysInMonth } = resolvePeriod(req);
        const department = req.user.department;

        // Sand Lab is table-based — the frontend renders a placeholder instead
        // of a chart, so there is nothing to aggregate.
        if (department === 'Sand Lab') {
            return res.status(200).json({ success: true, data: null });
        }

        const sources = DEPT_SOURCES[department] || [];
        const countByDay = {};
        for (const source of sources) {
            const userId = source.filterUser ? req.user._id : null;
            await tallySource(source, year, month, userId, countByDay);
        }

        res.status(200).json({
            success: true,
            data: { year, month, daysInMonth, counts: toCountsArray(countByDay, daysInMonth) },
        });
    } catch (error) {
        console.error('Entry Stats Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch entry statistics' });
    }
};

// Admin-only: per-day entry counts across every graphable department/form
// (all authors — no per-user filter).
exports.getAdminEntryStats = async (req, res) => {
    try {
        const { year, month, daysInMonth } = resolvePeriod(req);

        const departments = [];
        for (const source of ADMIN_SOURCES) {
            const countByDay = {};
            await tallySource(source, year, month, null, countByDay);
            departments.push({
                label: source.label,
                counts: toCountsArray(countByDay, daysInMonth),
            });
        }

        res.status(200).json({
            success: true,
            data: { year, month, daysInMonth, departments },
        });
    } catch (error) {
        console.error('Admin Entry Stats Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch entry statistics' });
    }
};
