import { createElement, useMemo } from 'react';

// Every form declares validationRanges (rule objects) + fieldMapping (display field -> formData key(s)); see frontend.md for the full shape.
//
// Applicable `type` values for a validationRanges rule (frontend/src/deviations/D*.js):
//   'Number'              scalar, decimal allowed. min/max/exclusiveMin are QC spec hints
//                          (isDeviant-only, never block submit) — see checkNumber.
//   'Integer'              scalar, whole numbers only (no decimal point at the keystroke
//                          level either). Same min/max hint behavior as 'Number'.
//   'Text'                 scalar, free text. Optional `format` (a key into FORMATS below,
//                          e.g. 'dateCode') and/or `maxLength` are spec hints only — see
//                          isDeviant; validateScalar never rejects on either.
//   'Select'                scalar, must be one of `rule.allowedValues` (required for this type).
//   'Date'                  scalar, must parse via `new Date()`.
//   'Time'                  scalar, {hour, minute}-shaped. NOT validated here — falls through
//                          validateScalar's default (always valid) — pages using it validate
//                          bespoke and keep it out of fieldMapping (e.g. Process's Tapping Time).
//   'Number Range'          fieldMapping value is [minKey, maxKey]. Leaving Max blank is a
//   (or 'NumberRange')      valid single value; `requireMinForMax: true` rejects Max-without-Min;
//                          Min > Max is rejected, Min === Max is accepted. See validateRange.
//   'Dynamic Range Array'   QcProduction-only: fieldMapping value is a single key holding an
//   (or 'DynamicRangeArray')array of {min, max} rows (one Number Range check per row).
//   'Dynamic Array'         QcProduction-only: single key holding an array of {value} rows
//   (or 'DynamicArray')     (one Number check per row).
//   'NumberArray'           single key holding a flat array of values (e.g. Impact's Observed
//                          Value) — see validateScalar's dedicated NumberArray branch.
//   'Auto'                  never typed by the user (e.g. DcupolaHolder's Heat No) — no
//                          validation applies; omit from fieldMapping entirely.
//   anything else           falls through validateScalar's default case — always valid, same
//                          as 'Time'. Only use this deliberately, matching an existing case.
//
// Every type above except 'Time'/'Auto' is numeric-guard-eligible via buildNumericGuardMap
// below (keystroke/paste digit filtering) whenever it also has a fieldMapping entry.

export const FORMATS = {
  dateCode: {
    re: /^[0-9][A-Z][0-9]{2}$/,
    message: (label) => `${label} must be 1 digit, 1 letter, 2 digits (e.g., 6F25)`
  },
  itemSecond: {
    re: /^\d+(\.\d+)?\/\d+(\.\d+)?\/\d+(\.\d+)?$/,
    message: (label) => `${label} must be three numeric segments separated by / (e.g., 343/34/56)`
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

// Does this rule declare anything for a blank value to be measured against?
// Only fields with an actual spec are worth flagging when skipped — a field
// with no min/max/format/maxLength has nothing to have missed. Select fields
// are deliberately excluded: not choosing an optional dropdown option means
// "not applicable to this entry," not "skipped a measurement" — never flag it
// blank (an entered-but-invalid Select value is still caught below, unaffected).
const hasCheckableSpec = (rule, type) => {
  if (NUMERIC_TYPES.has(type) || type === 'NumberArray') {
    return typeof rule.min === 'number' || typeof rule.max === 'number';
  }
  if (type === 'Text') return Boolean(rule.format || rule.maxLength);
  return false;
};

// Informational-only counterpart to the range/pattern checks checkNumber/validateField
// stopped blocking on — used by report pages to flag (admin-only) a value that's
// outside its department's declared QC spec, without ever rejecting the value itself.
// '-' is this codebase's "not measured" sentinel for unfilled optional fields (see
// backend.md) and is treated the same as a true blank (null/undefined/'') below.
// A blank value on a field with a declared spec (min/max/format/maxLength/
// allowedValues) still counts as a deviation — skipping a measurement that has a
// target is itself worth flagging, not just an out-of-range entry. A blank value
// on a field with NO spec at all stays uninteresting (nothing to compare against).
export const isDeviant = (rule, value) => {
  const type = normalizeType(rule.type);
  const blank = isBlank(value) || value === '-';

  if (blank) return hasCheckableSpec(rule, type);

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
    // An array with no non-blank entries at all is itself blank — deviant only
    // when the rule has a spec, matching the scalar case above.
    const arr = Array.isArray(value) ? value.filter((v) => !isBlank(v)) : [value];
    if (arr.length === 0) return hasCheckableSpec(rule, type);
    return arr.some((v) => isDeviant({ ...rule, type: 'Number' }, v));
  }

  if (type === 'Text') {
    const text = String(value).trim();
    const format = rule.format && FORMATS[rule.format];
    if (format && !format.re.test(text)) return true;
    if (rule.maxLength && text.length > rule.maxLength) return true;
    return false;
  }

  if (type === 'Select') {
    if (Array.isArray(rule.allowedValues) && !rule.allowedValues.includes(String(value).trim())) return true;
    return false;
  }

  return false;
};

// Keystroke/paste guards for numeric fields, shared across department entry pages.
// Native `type="number"` still lets 'e', '+', extra '-'/'.' through in most browsers
// and does nothing at all for paste — these close both gaps at the character level,
// on top of (not instead of) the submit-time re-check via checkNumber() above.

const CONTROL_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'Home', 'End',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
]);

export function blockNonNumericKeyDown(e, { allowDecimal = true, allowNegative = false } = {}) {
  if (e.ctrlKey || e.metaKey) return; // copy/paste/select-all etc.
  if (CONTROL_KEYS.has(e.key)) return;
  if (/^[0-9]$/.test(e.key)) return;

  const value = e.currentTarget.value ?? '';
  if (allowDecimal && e.key === '.' && !value.includes('.')) return;
  if (allowNegative && e.key === '-' && e.currentTarget.selectionStart === 0 && !value.includes('-')) return;

  e.preventDefault();
}

export function sanitizeNumericPaste(e, { allowDecimal = true, allowNegative = false } = {}) {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  const pattern = allowNegative
    ? (allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/)
    : (allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/);

  if (!pattern.test(text)) e.preventDefault();
}

// Types whose keystroke-level input allows a decimal point; everything else in
// NUMERIC_TYPES is digits-only (currently just Integer).
const DECIMAL_TYPES = new Set(['Number', 'Number Range', 'Dynamic Range Array', 'Dynamic Array', 'NumberArray']);

// Master keystroke guard for a rule, driven entirely by rule.type. Spread the
// result onto a type="number" input's onKeyDown/onPaste.
export const numericFieldGuards = (rule) => {
  const allowDecimal = DECIMAL_TYPES.has(normalizeType(rule.type));
  return {
    onKeyDown: (e) => blockNonNumericKeyDown(e, { allowDecimal, allowNegative: false }),
    onPaste: (e) => sanitizeNumericPaste(e, { allowDecimal, allowNegative: false })
  };
};

// Same rule, for onChange-driven (type="text") numeric fields where a keystroke
// guard isn't the mechanism — e.g. QcProduction's dynamic-row inputs, or
// Process's PP Code/Treatment No (their leading-zero blur-pad needs type="text").
export const sanitizeNumericString = (value, { allowDecimal = true } = {}) => {
  let v = allowDecimal ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');
  if (allowDecimal) {
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
  }
  return v;
};

// NUMERIC_TYPES excludes 'NumberArray' (isDeviant treats it as its own branch,
// not a NUMERIC_TYPES member) — the guard map needs it included too, since an
// Observed-Value-style array field is exactly as numeric as a scalar Number field.
const NUMERIC_GUARD_TYPES = new Set([...NUMERIC_TYPES, 'NumberArray']);

// One field->guards map per department, built once from its own validationRanges
// + fieldMapping — a field's guard behavior is entirely determined by its
// declared type, never hand-picked per input.
export const buildNumericGuardMap = (validationRanges, fieldMapping) => {
  const map = {};
  validationRanges.forEach((rule) => {
    const type = normalizeType(rule.type);
    if (!NUMERIC_GUARD_TYPES.has(type)) return;
    const mapped = fieldMapping[rule.field];
    if (!mapped) return;
    const guards = numericFieldGuards(rule);
    (Array.isArray(mapped) ? mapped : [mapped]).forEach((key) => { map[key] = guards; });
  });
  return map;
};

// Shared "admin-only deviation flag" helper for report pages — see frontend.md for usage.
// Report pages hand-roll a `validationRanges`-by-label map plus a devClass/isFieldDeviant
// lookup; this extracts that pattern into one place instead of a copy per department.

// keyToRuleField: { reportColumnKey: 'Rule label used in validationRanges' }
// Returns a devClass(key, value) function that yields 'deviation-flag' (or undefined)
// for use as a className — apply it directly to a <td> (Table.css's td.deviation-flag
// tints the whole cell) or to a wrapping <span> (Table.css's .deviation-flag pill).
export function useDeviationClass(validationRanges, keyToRuleField, { isAdmin, showDeviations }) {
  const ruleByField = useMemo(() => {
    const map = {};
    validationRanges.forEach((r) => { map[r.field] = r; });
    return map;
  }, [validationRanges]);

  return (key, value) => {
    if (!showDeviations || !isAdmin) return undefined;
    const ruleFieldName = keyToRuleField[key];
    const rule = ruleFieldName && ruleByField[ruleFieldName];
    return rule && isDeviant(rule, value) ? 'deviation-flag' : undefined;
  };
}

// Reverses each form's label->key fieldMapping so backend schema-key errors can be shown as operator-facing labels.
export const FALLBACK_SUBMIT_ERROR =
    'Could not save this entry. Please check your entries and try again.';

// Matches backend/utils/fieldValidation.js's message family; anything else (e.g. 'A record for this date already exists.') is already user-facing and passes through untouched.
const INVALID_INPUT_PREFIX = 'Invalid input for:';

// fieldMapping values are either a formData key or a [minKey, maxKey] pair.
const reverseFieldMapping = (fieldMapping = {}) => {
    const reverse = {};
    Object.entries(fieldMapping).forEach(([label, key]) => {
        const keys = Array.isArray(key) ? key : [key];
        keys.forEach(k => {
            if (k && !(k in reverse)) reverse[k] = label;
        });
    });
    return reverse;
};

// Unknown keys fall back to the raw key rather than being dropped — better to show
// something the operator can search for than to silently lose a field.
export const toDisplayLabels = (fields, fieldMapping) => {
    const reverse = reverseFieldMapping(fieldMapping);
    return [...new Set(fields.map(f => reverse[f] || f))];
};

export const buildSubmitError = (data, fieldMapping) => {
    const message = data?.message;
    const fields = Array.isArray(data?.fields) ? data.fields : [];

    if (fields.length && typeof message === 'string' && message.startsWith(INVALID_INPUT_PREFIX)) {
        const labels = toDisplayLabels(fields, fieldMapping);
        const noun = labels.length === 1 ? 'this field' : 'these fields';
        return `${INVALID_INPUT_PREFIX} ${labels.join(', ')}. Please check ${noun} and try again.`;
    }

    return message || FALLBACK_SUBMIT_ERROR;
};
