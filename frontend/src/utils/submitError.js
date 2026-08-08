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
