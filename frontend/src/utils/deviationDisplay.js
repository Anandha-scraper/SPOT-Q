// Shared "admin-only deviation flag" helper for report pages — see frontend.md for usage.
// Report pages hand-roll a `validationRanges`-by-label map plus a devClass/isFieldDeviant
// lookup; this extracts that pattern into one place instead of a copy per department.

import { useMemo } from 'react';
import { isDeviant } from './formValidation';

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
