const { prisma } = require('../database/prisma');

function ensureReportRow(date, shift) {
    return prisma.disaReport.upsert({
        where: { date_shift: { date, shift } },
        create: { date, shift },
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
                readings: { createMany: { data: row.readings } },
            },
        }));
    return prisma.$transaction(creates);
}

module.exports = {
    ensureReportRow,
    findReportRow,
    findReportsForDate,
    findReportsInRange,
    updateReportFields,
    replaceMembers,
    countSection,
    findMembers,
    appendSimpleRows,
    appendDelayRows,
    appendMouldHardnessRows,
};
