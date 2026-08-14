const statsRepository = require('../repositories/statsRepository');

// Labels here are matched literally by UserProfile.jsx's ADMIN_DEPARTMENTS — keep them identical.
const ADMIN_SOURCES = [
    { label: 'Melting · Log Sheet', count: (prefix) => statsRepository.countMeltingLogEntries(prefix) },
    { label: 'Melting · Cupola Holder', count: (prefix) => statsRepository.countCupolaLogEntries(prefix) },
    { label: 'Moulding · DMM', count: (prefix) => statsRepository.countDmmParameterEntries(prefix) },
    { label: 'Process', count: (prefix) => statsRepository.countProcessEntries(prefix) },
    { label: 'Tensile', count: (prefix) => statsRepository.countTensileEntries(prefix) },
    { label: 'Impact', count: (prefix) => statsRepository.countImpactEntries(prefix) },
    { label: 'Micro Tensile', count: (prefix) => statsRepository.countMicroTensileEntries(prefix) },
    { label: 'Micro Structure', count: (prefix) => statsRepository.countMicroStructureEntries(prefix) },
    { label: 'QC - Production', count: (prefix) => statsRepository.countQcProductionEntries(prefix) },
];

// Personal ("Entries This Month") source per req.user.department. Melting only counts the
// Log Sheet sub-module — Cupola entries have no createdBy (see statsRepository), so
// there's no "mine" to filter to. Sand Lab has no source at all: its tables are a generic
// path/value store with no "one entry" concept, and the frontend renders a placeholder
// for that department without ever reading this value. Moulding isn't listed here at
// all — see getPersonalStats below, which special-cases it into a two-line (Disamatic +
// DMM), per-shift-broken-down `series` instead of this map's flat `counts`.
const PERSONAL_SOURCES = {
    Process: (prefix, userId) => statsRepository.countProcessEntries(prefix, userId),
    Tensile: (prefix, userId) => statsRepository.countTensileEntries(prefix, userId),
    Impact: (prefix, userId) => statsRepository.countImpactEntries(prefix, userId),
    'Micro Tensile': (prefix, userId) => statsRepository.countMicroTensileEntries(prefix, userId),
    'Micro Structure': (prefix, userId) => statsRepository.countMicroStructureEntries(prefix, userId),
    'QC - production': (prefix, userId) => statsRepository.countQcProductionEntries(prefix, userId),
    Melting: (prefix, userId) => statsRepository.countMeltingLogEntries(prefix, userId),
};

function currentWindow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based, matches UserProfile.jsx's MONTH_NAMES[month - 1]
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return { year, month, daysInMonth, monthPrefix };
}

async function getPersonalStats(user) {
    const { year, month, daysInMonth, monthPrefix } = currentWindow();

    // Moulding gets a two-line (Disamatic + DMM) chart, each broken down by shift, instead
    // of every other department's single flat `counts` — see UserProfile.jsx's mouldingChart.
    if (user.department === 'Moulding') {
        const [disamatic, dmm] = await Promise.all([
            statsRepository.countDisaEntriesByShift(monthPrefix),
            statsRepository.countDmmParameterEntriesByShift(monthPrefix),
        ]);
        return {
            year, month, daysInMonth, counts: [],
            series: [
                { label: 'Disamatic', counts: disamatic },
                { label: 'DMM', counts: dmm },
            ],
        };
    }

    const source = PERSONAL_SOURCES[user.department];
    const counts = source ? await source(monthPrefix, user.id) : [];
    return { year, month, daysInMonth, counts };
}

async function getAdminStats() {
    const { year, month, daysInMonth, monthPrefix } = currentWindow();
    const departments = await Promise.all(
        ADMIN_SOURCES.map(async ({ label, count }) => ({ label, counts: await count(monthPrefix) }))
    );
    return { year, month, daysInMonth, departments };
}

module.exports = { getPersonalStats, getAdminStats };
