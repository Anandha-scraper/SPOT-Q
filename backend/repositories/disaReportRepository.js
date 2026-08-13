const { prisma } = require('../database/prisma');

function ensureReportRow(date, shift, createdBy) {
    return prisma.disaReport.upsert({
        where: { date_shift: { date, shift } },
        create: { date, shift, createdBy: createdBy ?? null },
        update: {},
    });
}

function findReportRow(date, shift) {
    return prisma.disaReport.findUnique({ where: { date_shift: { date, shift } } });
}

function findReportsForDate(date) {
    return prisma.disaReport.findMany({ where: { date }, orderBy: { createdAt: 'asc' } });
}

const FULL_INCLUDE = {
    members: { orderBy: { position: 'asc' } },
    production: { orderBy: { sNo: 'asc' } },
    nextShiftPlan: { orderBy: { sNo: 'asc' } },
    delays: { orderBy: { sNo: 'asc' }, include: { intervals: { orderBy: { position: 'asc' } } } },
    mouldHardness: { orderBy: { sNo: 'asc' }, include: { readings: { orderBy: [{ kind: 'asc' }, { position: 'asc' }] } } },
    patternTemp: { orderBy: { sNo: 'asc' } },
};

function findReportsInRange(from, to) {
    const dateWhere = {};
    if (from) dateWhere.gte = from;
    if (to) dateWhere.lte = to;

    return prisma.disaReport.findMany({
        where: Object.keys(dateWhere).length ? { date: dateWhere } : {},
        orderBy: [{ date: 'desc' }, { shift: 'asc' }],
        include: FULL_INCLUDE,
    });
}

function findReportWithEverything(id) {
    return prisma.disaReport.findUnique({ where: { id }, include: FULL_INCLUDE });
}

function findReportForAuth(id) {
    return prisma.disaReport.findUnique({ where: { id }, select: { id: true, createdBy: true, createdAt: true } });
}

function deleteReport(id) {
    // All 5 child tables + members cascade via onDelete: Cascade.
    return prisma.disaReport.delete({ where: { id } });
}

function updateReportFields(reportId, data) {
    return prisma.disaReport.update({ where: { id: reportId }, data });
}

async function replaceMembers(reportId, names) {
    await prisma.$transaction([
        prisma.disaReportMember.deleteMany({ where: { disaReportId: reportId } }),
        prisma.disaReportMember.createMany({
            data: names.map((name, position) => ({ disaReportId: reportId, position, name })),
        }),
    ]);
}

async function countSection(model, reportId) {
    return prisma[model].count({ where: { disaReportId: reportId } });
}

// Child models a report row can carry — a report merge/count needs all of them.
const CHILD_MODELS = [
    'disaProductionEntry',
    'disaNextShiftPlanEntry',
    'disaDelayEntry',
    'disaMouldHardnessEntry',
    'disaPatternTempEntry',
];

// Reports forked by the missing-shift write bug (see backend.md's 2026-08-10
// entry) — shift='' is not a real combination, only ever a phantom.
function findPhantomShiftReports() {
    return prisma.disaReport.findMany({ where: { shift: '' }, orderBy: { date: 'asc' } });
}

function findSiblingReports(date) {
    return prisma.disaReport.findMany({ where: { date, shift: { not: '' } }, orderBy: { shift: 'asc' } });
}

async function countReportChildren(reportId) {
    const counts = {};
    for (const model of CHILD_MODELS) {
        counts[model.replace('disa', '').replace('Entry', '')] = await countSection(model, reportId);
    }
    counts.members = await prisma.disaReportMember.count({ where: { disaReportId: reportId } });
    return counts;
}

// Re-points every child row from the phantom onto the real report, then drops
// the phantom's now-empty shell. Members are written only by savePrimary,
// which always carried a real shift, so anything on the phantom is a
// duplicate and goes with it rather than being re-pointed.
async function mergePhantomReport(phantomId, targetId) {
    return prisma.$transaction(async (tx) => {
        for (const model of CHILD_MODELS) {
            await tx[model].updateMany({ where: { disaReportId: phantomId }, data: { disaReportId: targetId } });
        }
        await tx.disaReportMember.deleteMany({ where: { disaReportId: phantomId } });
        await tx.disaReport.delete({ where: { id: phantomId } });
    });
}

function findMembers(reportId) {
    return prisma.disaReportMember.findMany({
        where: { disaReportId: reportId },
        orderBy: { position: 'asc' },
    });
}

function appendSimpleRows(model, reportId, rows, startSNo) {
    return prisma[model].createMany({
        data: rows.map((row, idx) => ({ disaReportId: reportId, sNo: startSNo + idx + 1, ...row })),
    });
}

async function appendDelayRows(reportId, rows, startSNo) {
    const creates = rows.map((row, idx) =>
        prisma.disaDelayEntry.create({
            data: {
                disaReportId: reportId,
                sNo: startSNo + idx + 1,
                delays: row.delays,
                createdBy: row.createdBy ?? null,
                intervals: { createMany: { data: row.intervals } },
            },
        }));
    return prisma.$transaction(creates);
}

async function appendMouldHardnessRows(reportId, rows, startSNo) {
    const creates = rows.map((row, idx) =>
        prisma.disaMouldHardnessEntry.create({
            data: {
                disaReportId: reportId,
                sNo: startSNo + idx + 1,
                componentName: row.componentName,
                remarks: row.remarks,
                createdBy: row.createdBy ?? null,
                readings: { createMany: { data: row.readings } },
            },
        }));
    return prisma.$transaction(creates);
}

// ── per-row edit (whole-report PUT, disaReportService.js#updateReportEntries) ─
// Delays/MouldHardness expose only their own scalar columns here — the
// parallel-array child rows (intervals/readings) have no generic multi-array
// edit UI on the frontend yet, so they stay create-only for this pass.

function updateProductionEntry(id, data) {
    return prisma.disaProductionEntry.update({ where: { id }, data });
}

function updateNextShiftPlanEntry(id, data) {
    return prisma.disaNextShiftPlanEntry.update({ where: { id }, data });
}

function updateDelayEntry(id, data) {
    return prisma.disaDelayEntry.update({ where: { id }, data });
}

function updateMouldHardnessEntry(id, data) {
    return prisma.disaMouldHardnessEntry.update({ where: { id }, data });
}

function updatePatternTempEntry(id, data) {
    return prisma.disaPatternTempEntry.update({ where: { id }, data });
}

module.exports = {
    ensureReportRow,
    findReportRow,
    findReportsForDate,
    findReportsInRange,
    findReportWithEverything,
    findReportForAuth,
    deleteReport,
    updateReportFields,
    replaceMembers,
    countSection,
    findMembers,
    findPhantomShiftReports,
    findSiblingReports,
    countReportChildren,
    mergePhantomReport,
    appendSimpleRows,
    appendDelayRows,
    appendMouldHardnessRows,
    updateProductionEntry,
    updateNextShiftPlanEntry,
    updateDelayEntry,
    updateMouldHardnessEntry,
    updatePatternTempEntry,
};
