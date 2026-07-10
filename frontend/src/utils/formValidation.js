import { createElement } from 'react';

// Shared submit-time validation for the department entry forms.
//
// Every form declares a `validationRanges` array of rule objects and a
// `fieldMapping` from the rule's display `field` to the formData key(s):
//
//   { field: 'Elongation', required: true, type: 'Number', min: 0, max: 100 }
//   { field: 'Count', required: true, type: 'NumberRange' }   // mapped to ['countMin','countMax']
//
// Supported `type`: Text, Number, Integer, Select, Date, NumberArray.
// A rule whose mapped value is a [minKey, maxKey] pair is treated as a range.
//
// Optional rule keys: min, max, exclusiveMin, maxLength, allowedValues, format.

// Named format checks, opted into per rule via `format: 'dateCode'`. This is
// deliberately not inferred from the field label: Tensile/Impact/MicroTensile
// enforce the pattern server-side, MicroStructure does not.
const FORMATS = {
  dateCode: {
    re: /^[0-9][A-Z][0-9]{2}$/,
    message: (label) => `${label} must be 1 digit, 1 letter, 2 digits (e.g., 6F25)`
  }
};

// Browsers let `e`, `+`, `--` and multiple dots through a type="number" input,
// and surface the result as an empty value. Reject those explicitly.
const INVALID_NUMBER = /[eE+]|\..*\.|--|\+\+/;
const TRAILING_JUNK = /[eE.+-]$/;

const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

const hasBadInput = (el) => Boolean(el && el.validity && el.validity.badInput);

// `fields` narrows a range failure to the offending box(es); when omitted, every
// key the rule governs is flagged.
const invalid = (message, fields) => ({ isValid: false, isMissing: false, message, fields });
const missing = (message, fields) => ({ isValid: false, isMissing: true, message, fields });
const valid = () => ({ isValid: true, isMissing: false, message: '' });

// Shared numeric checks for Number / Integer / the members of a range or array.
const checkNumber = (rule, value, label) => {
  const s = String(value).trim();
  if (INVALID_NUMBER.test(s) || TRAILING_JUNK.test(s)) return invalid(`${label} must be a valid number`);

  // Number() (not parseFloat) so partial-numeric junk like "12abc" is rejected
  // rather than silently parsed to 12 — the `type: 'Number'` rule is authoritative.
  const num = Number(s);
  if (isNaN(num) || !isFinite(num)) return invalid(`${label} must be a valid number`);

  // exclusiveMin: the value must be strictly greater than min (MicroTensile's
  // loads/strengths declare min: 0 but reject 0 itself).
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

// A [minKey, maxKey] pair. Leaving Max blank means "a single value", which is
// why an empty Max is not an error. `requireMinForMax` additionally rejects a
// Max typed without a Min (QC Production stores the lone value in the Min box).
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

/**
 * Validate one rule against the current form data.
 * `mapped` is either a formData key, or a [minKey, maxKey] pair for a range.
 * Returns { isValid, isMissing, message } — `isMissing` separates
 * "required but empty" from "present but malformed".
 */
export const validateField = (rule, mapped, formData, inputRefs) => {
  if (Array.isArray(mapped)) return validateRange(rule, mapped, formData, inputRefs);

  const label = rule.field;
  const value = formData[mapped];

  if (hasBadInput(inputRefs?.current?.[mapped])) {
    return invalid(`${label} must be a valid ${String(rule.type || '').toLowerCase()}`);
  }

  // NumberArray holds its own emptiness semantics, so check it before the
  // generic blank/required handling below.
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

/**
 * Validate a whole form in one pass.
 *
 * Surfaces exactly one message, required-wins: if any required field is empty
 * the message is MESSAGE_REQUIRED; otherwise, if any field (required or not)
 * is malformed, it is MESSAGE_FORMAT.
 *
 * `fieldStates` maps every mapped formData key that failed to `false` (and
 * every key that passed to `null`), ready to feed each form's per-field
 * validity setters. `skip` omits rules by their display `field` name — used
 * for the primary Date/DISA controls, which are validated by the lock flow.
 */
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

    // A range failure may name only the offending box; the sibling stays neutral.
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

/**
 * The mapped formData keys of every rule marked `required`, so labels can
 * render their asterisk from `validationRanges` instead of a hand-kept list.
 */
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

// Red asterisk for a required field's label. JSX-free so this module stays a
// plain .js util alongside arrowNavigation.js.
export const RequiredMark = () =>
  createElement('span', { 'aria-hidden': 'true', style: { color: '#ef4444', marginLeft: '0.15rem' } }, '*');
