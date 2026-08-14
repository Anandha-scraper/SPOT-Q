const { Prisma } = require('@prisma/client');
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
// Names copied from the generated migration SQL, not guessed from the model.
const INDEX_TO_FIELDS = {
    users_employeeId_key: ['employeeId'],
    melting_log_primaries_meltingLogId_shift_furnaceNo_panel_key: ['shift', 'furnaceNo', 'panel'],
    cupola_log_primaries_cupolaLogId_shift_holderNumber_key: ['shift', 'holderNumber'],
};
const targetFields = (target) => {
    if (Array.isArray(target)) return target;
    if (typeof target === 'string') return INDEX_TO_FIELDS[target] ?? [];
    return [];
};
const describePrismaError = (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002': {
                const fields = targetFields(error.meta?.target);
                return {
                    status: 409,
                    message: fields.length
                        ? `A record with this ${fields.join(', ')} already exists.`
                        : 'A record with these values already exists.',
                    fields,
                };
            }
            case 'P2025':
                return { status: 404, message: 'Record not found.', fields: [] };
            case 'P2003':
                return {
                    status: 409,
                    message: 'This record is still referenced by other data.',
                    fields: [error.meta?.field_name].filter(Boolean),
                };
            case 'P2000':
                return {
                    status: 400,
                    message: 'One of the values is too long.',
                    fields: [error.meta?.column_name].filter(Boolean),
                };
            default:
                return { status: 500, message: GENERIC_MESSAGE, fields: [] };
        }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return { status: 400, message: 'Invalid request.', fields: [] };
    }
    if (
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError
    ) {
        return {
            status: 503,
            message: 'Service temporarily unavailable. Please try again.',
            fields: [],
        };
    }

    return { status: 500, message: GENERIC_MESSAGE, fields: [] };
};

module.exports = { describePrismaError, GENERIC_MESSAGE };
