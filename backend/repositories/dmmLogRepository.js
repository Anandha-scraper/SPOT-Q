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

function upsertMachineShift(dmmLogId, machine, shift, data) {
    return prisma.dmmMachineShift.upsert({
        where: { dmmLogId_machine_shift: { dmmLogId, machine, shift } },
        create: { dmmLogId, machine, shift, ...data },
        update: data,
    });
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
    countParameters,
    createParameterEntry,
    findMachineShiftsForLog,
    findAllMachineShifts,
};
