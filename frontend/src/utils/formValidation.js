import { createElement } from 'react';

// Every form declares validationRanges (rule objects) + fieldMapping (display field -> formData key(s)); see frontend.md for the full shape.

const FORMATS = {
  dateCode: {
    re: /^[0-9][A-Z][0-9]{2}$/,
    message: (label) => `${label} must be 1 digit, 1 letter, 2 digits (e.g., 6F25)`
  }
};

// Browsers let e/+/--/multiple dots through a type="number" input and surface the result as empty — reject those explicitly.
const INVALID_NUMBER = /[eE+]|\..*\.|--|\+\+/;
const TRAILING_JUNK = /[eE.+-]$/;

const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

const hasBadInput = (el) => Boolean(el && el.validity && el.validity.badInput);

const invalid = (message, fields) => ({ isValid: false, isMissing: false, message, fields });
const missing = (message, fields) => ({ isValid: false, isMissing: true, message, fields });
const valid = () => ({ isValid: true, isMissing: false, message: '' });

const checkNumber = (rule, value, label) => {
  const s = String(value).trim();
  if (INVALID_NUMBER.test(s) || TRAILING_JUNK.test(s)) return invalid(`${label} must be a valid number`);

  const num = Number(s); // not parseFloat, so "12abc" is rejected rather than silently parsed to 12
  if (isNaN(num) || !isFinite(num)) return invalid(`${label} must be a valid number`);

  if (rule.min !== undefined && rule.exclusiveMin && num <= rule.min) {
    return invalid(`${label} must be greater than ${rule.min}`);
  }
  if (rule.min !== undefined && !rule.exclusiveMin && num < rule.min) {
    return invalid(`${label} must be at least ${rule.min}`);
  }
  if (rule.max !== undefined && num > rule.max) return invalid(`${label} must be no more than ${rule.max}`);
  if (rule.type === 'Integer' && !Number.isInteger(num)) return invalid(`${label} must be a whole number`);

  return valid();
};

// Leaving Max blank means "a single value" (not an error); requireMinForMax additionally rejects a Max typed without a Min.
const validateRange = (rule, [minKey, maxKey], formData, inputRefs) => {
  const label = rule.field;
  const minValue = formData[minKey];
  const maxValue = formData[maxKey];
  const hasMin = !isBlank(minValue);
  const hasMax = !isBlank(maxValue);

  if (hasBadInput(inputRefs?.current?.[minKey]) || hasBadInput(inputRefs?.current?.[maxKey])) {
    return invalid(`${label} must contain valid numbers`);
  }

  if (rule.required && (!hasMin || !hasMax)) return missing(`${label} is required`);
  if (!hasMin && !hasMax) return valid();

  if (!hasMin && hasMax) {
    if (rule.requireMinForMax) return invalid(`${label}: enter the minimum value`, [minKey]);
    return valid();
  }

  const minResult = checkNumber(rule, minValue, label);
  if (!minResult.isValid) return { ...minResult, fields: [minKey] };

  if (!hasMax) return valid();

  const maxResult = checkNumber(rule, maxValue, label);
  if (!maxResult.isValid) return { ...maxResult, fields: [maxKey] };

  if (parseFloat(minValue) >= parseFloat(maxValue)) {
    return invalid(`${label} minimum must be less than maximum`);
  }
  return valid();
};

export const validateField = (rule, mapped, formData, inputRefs) => {
  if (Array.isArray(mapped)) return validateRange(rule, mapped, formData, inputRefs);

  const label = rule.field;
  const value = formData[mapped];

  if (hasBadInput(inputRefs?.current?.[mapped])) {
    return invalid(`${label} must be a valid ${String(rule.type || '').toLowerCase()}`);
  }

  // NumberArray has its own emptiness semantics, checked before the generic blank/required handling below.
  if (rule.type === 'NumberArray') {
    const arr = Array.isArray(value) ? value.filter((v) => !isBlank(v)) : [];
    if (rule.required && arr.length === 0) return missing(`${label} must have at least one value`);
    for (const v of arr) {
      const result = checkNumber(rule, v, label);
      if (!result.isValid) return result;
    }
    return valid();
  }

  if (isBlank(value)) return rule.required ? missing(`${label} is required`) : valid();

  switch (rule.type) {
    case 'Number':
    case 'Integer': {
      const result = checkNumber(rule, value, label);
      if (!result.isValid) return result;
      break;
    }

    case 'Text': {
      const text = String(value).trim();
      const format = rule.format && FORMATS[rule.format];
      if (format && !format.re.test(text)) return invalid(format.message(label));
      if (rule.maxLength && text.length > rule.maxLength) {
        return invalid(`${label} must be no more than ${rule.maxLength} characters`);
      }
      break;
    }

    case 'Select':
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        return invalid(`${label} must be one of: ${rule.allowedValues.join(', ')}`);
      }
      break;

    case 'Date':
      if (isNaN(new Date(value).getTime())) return invalid(`${label} must be a valid date`);
      break;

    default:
      break;
  }

  return valid();
};

export const MESSAGE_REQUIRED = 'Fill required fields';
export const MESSAGE_FORMAT = 'Enter data in correct format';

// Surfaces exactly one message, required-wins; see frontend.md for the full rule.
export const runValidation = ({ validationRanges, fieldMapping, formData, inputRefs, skip = [] }) => {
  const fieldStates = {};
  let firstMissing = null;
  let firstInvalid = null;

  for (const rule of validationRanges) {
    if (skip.includes(rule.field)) continue;

    const mapped = fieldMapping[rule.field];
    if (!mapped) continue;

    const keys = Array.isArray(mapped) ? mapped : [mapped];
    const { isValid, isMissing, fields } = validateField(rule, mapped, formData, inputRefs);

    const badKeys = isValid ? [] : (fields || keys);
    for (const key of keys) fieldStates[key] = badKeys.includes(key) ? false : null;

    if (!isValid) {
      if (isMissing && !firstMissing) firstMissing = badKeys[0];
      if (!isMissing && !firstInvalid) firstInvalid = badKeys[0];
    }
  }

  if (firstMissing) {
    return { ok: false, message: MESSAGE_REQUIRED, firstErrorField: firstMissing, fieldStates };
  }
  if (firstInvalid) {
    return { ok: false, message: MESSAGE_FORMAT, firstErrorField: firstInvalid, fieldStates };
  }
  return { ok: true, message: '', firstErrorField: null, fieldStates };
};

export const getRequiredFields = (validationRanges, fieldMapping) => {
  const required = new Set();
  for (const rule of validationRanges) {
    if (!rule.required) continue;
    const mapped = fieldMapping[rule.field];
    if (!mapped) continue;
    for (const key of Array.isArray(mapped) ? mapped : [mapped]) required.add(key);
  }
  return required;
};

export const RequiredMark = () =>
  createElement('span', { 'aria-hidden': 'true', style: { color: '#ef4444', marginLeft: '0.15rem' } }, '*');
