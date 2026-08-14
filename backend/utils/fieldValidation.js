const { AppError } = require('./AppError');
const INVALID = Symbol('invalid');
const isMissing = (value) =>
    value === undefined || value === null || String(value).trim() === '';

const isNotRecorded = (value) => isMissing(value) || String(value).trim() === '-';

const toNullableNumber = (value) => {
    if (isNotRecorded(value)) return null;
    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : INVALID;
};

const toNullableInt = (value) => {
    const parsed = toNullableNumber(value);
    return typeof parsed === 'number' ? Math.trunc(parsed) : parsed;
};

const toRawString = (value) => (value === null || value === undefined ? '' : String(value));

const toTrimmedString = (value) => toRawString(value).trim();

const collectMissing = (data, requiredFields) =>
    requiredFields.filter((field) => isMissing(data[field]));

const failsPattern = (value, pattern) =>
    !isNotRecorded(value) && !pattern.test(String(value).trim());

const buildColumns = (body, { trimmed = [], raw = [], numbers = [], integers = [], patterns = {} }) => {
    const data = {};
    const invalid = [];
    const source = body ?? {};

    const assign = (fields, convert) => {
        for (const field of fields) {
            if (!Object.prototype.hasOwnProperty.call(source, field)) continue;
            const value = convert(source[field]);
            if (value === INVALID) invalid.push(field);
            else data[field] = value;
        }
    };

    assign(trimmed, toTrimmedString);
    assign(raw, toRawString);
    assign(numbers, toNullableNumber);
    assign(integers, toNullableInt);

    for (const [field, pattern] of Object.entries(patterns)) {
        if (failsPattern(data[field], pattern)) invalid.push(field);
    }

    return { data, invalid };
};

const invalidInput = (fields) =>
    new AppError(
        400,
        `Invalid input for: ${[...new Set(fields)].join(', ')}. Please check these fields and try again.`,
        { fields: [...new Set(fields)] }
    );

const requireDateAndDisa = (date, disa) => {
    if (isMissing(date) || isMissing(disa)) {
        throw new AppError(400, 'Date and DISA are required.');
    }
};

const requireEditableFields = (data) => {
    if (!Object.keys(data).length) {
        throw new AppError(400, 'No editable fields were provided.');
    }
};

module.exports = { INVALID, isMissing, isNotRecorded, toNullableNumber, toNullableInt, toRawString, toTrimmedString, collectMissing, failsPattern, buildColumns, invalidInput, requireDateAndDisa, requireEditableFields,};
