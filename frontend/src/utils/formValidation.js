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

export const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

const hasBadInput = (el) => Boolean(el && el.validity && el.validity.badInput);

// Departments spell the same concept two ways ('NumberRange' in DmicroStructure,
// 'Number Range' everywhere else). Normalise once so neither spelling silently
// falls through to the no-op default branch.
const normalizeType = (type) => {
  const t = String(type || '').trim();
  if (t === 'NumberRange') return 'Number Range';
  if (t === 'DynamicRangeArray') return 'Dynamic Range Array';
  if (t === 'DynamicArray') return 'Dynamic Array';
  return t;
};

// Only these treat a two-key mapping as [min, max]. Any other multi-key mapping
// (e.g. Dmelting's ['chargingTimeHour','chargingTimeMinute']) is a set of parts
// that must each be validated on their own — never compared against each other.
const RANGE_TYPES = new Set(['Number Range', 'Dynamic Range Array']);

// Types whose values are numeric for spec-range (isDeviant) purposes.
const NUMERIC_TYPES = new Set(['Number', 'Integer', 'Number Range', 'Dynamic Range Array', 'Dynamic Array']);

const invalid = (message, fields) => ({ isValid: false, isMissing: false, message, fields });
const missing = (message, fields) => ({ isValid: false, isMissing: true, message, fields });
const valid = () => ({ isValid: true, isMissing: false, message: '' });

// min/max/exclusiveMin are QC target ranges, not hard input limits — the real
// measured value must be accepted even outside spec, so only type-shape is
// enforced here. See isDeviant() for the informational (admin-only) range check.
export const checkNumber = (rule, value, label) => {
  const s = String(value).trim();
  if (INVALID_NUMBER.test(s) || TRAILING_JUNK.test(s)) return invalid(`${label} must be a valid number`);

  const num = Number(s); // not parseFloat, so "12abc" is rejected rather than silently parsed to 12
  if (isNaN(num) || !isFinite(num)) return invalid(`${label} must be a valid number`);

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

  // Equal is a legal single-point range; only an inverted pair is rejected.
  if (parseFloat(minValue) > parseFloat(maxValue)) {
    return invalid(`${label} minimum cannot be greater than maximum`, [minKey, maxKey]);
  }
  return valid();
};

const validateScalar = (rule, value, el) => {
  const label = rule.field;
  const type = normalizeType(rule.type);

  if (hasBadInput(el)) {
    return invalid(`${label} must be a valid ${type.toLowerCase()}`);
  }

  // NumberArray has its own emptiness semantics, checked before the generic blank/required handling below.
  if (type === 'NumberArray') {
    const arr = Array.isArray(value) ? value.filter((v) => !isBlank(v)) : [];
    if (rule.required && arr.length === 0) return missing(`${label} must have at least one value`);
    for (const v of arr) {
      const result = checkNumber(rule, v, label);
      if (!result.isValid) return result;
    }
    return valid();
  }

  if (isBlank(value)) return rule.required ? missing(`${label} is required`) : valid();

  switch (type) {
    case 'Number':
    case 'Integer': {
      const result = checkNumber(rule, value, label);
      if (!result.isValid) return result;
      break;
    }

    case 'Text':
      // format/maxLength are QC spec hints, not hard limits — any string is
      // accepted; see isDeviant() for the informational (admin-only) check.
      break;

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

// A multi-key mapping that is not a range: every part is validated independently
// against the rule's own type, and `required` means every part must be filled.
const validateParts = (rule, keys, formData, inputRefs) => {
  for (const key of keys) {
    const result = validateScalar(rule, formData[key], inputRefs?.current?.[key]);
    if (!result.isValid) return { ...result, fields: [key] };
  }
  return valid();
};

export const validateField = (rule, mapped, formData, inputRefs) => {
  if (Array.isArray(mapped)) {
    return RANGE_TYPES.has(normalizeType(rule.type))
      ? validateRange(rule, mapped, formData, inputRefs)
      : validateParts(rule, mapped, formData, inputRefs);
  }
  return validateScalar(rule, formData[mapped], inputRefs?.current?.[mapped]);
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

// Informational-only counterpart to the range/pattern checks checkNumber/validateField
// stopped blocking on — used by report pages to flag (admin-only) a value that's
// outside its department's declared QC spec, without ever rejecting the value itself.
// Blank values are never "deviant" — nothing entered is a missing-data concern, not a spec one.
export const isDeviant = (rule, value) => {
  if (isBlank(value)) return false;

  const type = normalizeType(rule.type);

  // Range/array types are spec-checked one value at a time — report pages pass a
  // single cell's value, so a min/max pair is two independent calls.
  if (NUMERIC_TYPES.has(type)) {
    const num = Number(String(value).trim());
    if (isNaN(num) || !isFinite(num)) return true; // wrong-type data is itself a deviation
    // A numeric min/max on a range rule bounds each end of the range, so only
    // compare when the bound is itself numeric ('60min'-style strings are ignored).
    if (typeof rule.min === 'number') {
      if (rule.exclusiveMin ? num <= rule.min : num < rule.min) return true;
    }
    if (typeof rule.max === 'number' && num > rule.max) return true;
    return false;
  }

  if (type === 'NumberArray') {
    // Report pages flag one cell at a time, so a bare value is checked as a
    // single-element array rather than being silently treated as "not deviant".
    const arr = Array.isArray(value) ? value.filter((v) => !isBlank(v)) : [value];
    return arr.some((v) => isDeviant({ ...rule, type: 'Number' }, v));
  }

  if (type === 'Text') {
    const text = String(value).trim();
    const format = rule.format && FORMATS[rule.format];
    if (format && !format.re.test(text)) return true;
    if (rule.maxLength && text.length > rule.maxLength) return true;
    return false;
  }

  return false;
};
