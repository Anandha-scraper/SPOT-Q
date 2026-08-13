const { prisma } = require('../database/prisma');

function ensureDateRow(date) {
    return prisma.dmmLog.upsert({
        where: { date },
        create: { date },
        update: {},
    });
}

function findDateRow(date) {
    return prisma.dmmLog.findUnique({ where: { date } });
}

function findMachineShift(dmmLogId, machine, shift) {
    return prisma.dmmMachineShift.findUnique({
        where: { dmmLogId_machine_shift: { dmmLogId, machine, shift } },
        include: { parameters: { orderBy: { sNo: 'asc' } } },
    });
}

function upsertMachineShift(dmmLogId, machine, shift, data, userId) {
    return prisma.dmmMachineShift.upsert({
        where: { dmmLogId_machine_shift: { dmmLogId, machine, shift } },
        create: { dmmLogId, machine, shift, ...data, createdBy: userId ?? null, createdAt: new Date() },
        update: data,
    });
}

function findMachineShiftForAuth(id) {
    return prisma.dmmMachineShift.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateMachineShift(id, data) {
    return prisma.dmmMachineShift.update({ where: { id }, data });
}

async function ensureMachineShiftId(dmmLogId, machine, shift) {
    const row = await prisma.dmmMachineShift.upsert({
        where: { dmmLogId_machine_shift: { dmmLogId, machine, shift } },
        create: { dmmLogId, machine, shift },
        update: {},
        select: { id: true },
    });
    return row.id;
}

function countParameters(machineShiftId) {
    return prisma.dmmParameterEntry.count({ where: { machineShiftId } });
}

function createParameterEntry(machineShiftId, data) {
    return prisma.dmmParameterEntry.create({ data: { ...data, machineShiftId } });
}

function findEntryAuthInfo(id) {
    return prisma.dmmParameterEntry.findUnique({
        where: { id },
        select: { id: true, createdBy: true, createdAt: true },
    });
}

function updateEntry(id, data) {
    return prisma.dmmParameterEntry.update({ where: { id }, data });
}

// Mirrors meltingLogRepository#deleteEntry: a machine-shift left with no
// parameter rows and no operator details is deleted with its last child.
async function deleteEntry(id) {
    const entry = await prisma.dmmParameterEntry.findUnique({
        where: { id },
        select: { machineShiftId: true },
    });
    if (!entry) return null;

    return prisma.$transaction(async (tx) => {
        const deleted = await tx.dmmParameterEntry.delete({ where: { id } });

        const remaining = await tx.dmmParameterEntry.count({
            where: { machineShiftId: entry.machineShiftId },
        });
        if (remaining === 0) {
            const shift = await tx.dmmMachineShift.findUnique({
                where: { id: entry.machineShiftId },
                select: { operatorName: true, checkedBy: true },
            });
            if (shift && !shift.operatorName && !shift.checkedBy) {
                await tx.dmmMachineShift.delete({ where: { id: entry.machineShiftId } });
            }
        }

        return deleted;
    });
}

function findMachineShiftsForLog(dmmLogId) {
    return prisma.dmmMachineShift.findMany({
        where: { dmmLogId },
        include: { parameters: { orderBy: { sNo: 'asc' } } },
    });
}

function findAllMachineShifts() {
    return prisma.dmmMachineShift.findMany({
        include: {
            dmmLog: { select: { date: true } },
            parameters: { orderBy: { sNo: 'asc' } },
        },
        orderBy: [{ dmmLog: { date: 'desc' } }],
    });
}

module.exports = {
    ensureDateRow,
    findDateRow,
    findMachineShift,
    upsertMachineShift,
    ensureMachineShiftId,
    findMachineShiftForAuth,
    updateMachineShift,
    countParameters,
    createParameterEntry,
    findEntryAuthInfo,
    updateEntry,
    deleteEntry,
    findMachineShiftsForLog,
    findAllMachineShifts,
};
