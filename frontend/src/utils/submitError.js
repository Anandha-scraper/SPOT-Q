// Builds the message shown in the inline banner beside Submit when a save fails.
//
// The backend reports schema keys ('quantityOfMoulds'); operators read form labels
// ('Qty. Of Moulds'). Every department page already declares a `fieldMapping` of
// label -> formData key, so we reverse it to translate.

export const FALLBACK_SUBMIT_ERROR =
    'Could not save this entry. Please check your entries and try again.';

// Matches the phrasing produced by backend/utils/mongooseError.js. Only messages in
// this family get relabelled — a message like 'A record for this date already
// exists.' is already user-facing and must pass through untouched.
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
