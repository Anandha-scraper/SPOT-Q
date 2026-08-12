# Entry-form interaction & CSS reference

`frontend/src/pages/Melting/MeltingLogSheet.jsx` (+ `frontend/src/styles/PageStyles/Melting/MeltingLogSheet.css`) is the reference implementation for the **primary-combination lock pattern**: a form where nothing in the entry sections is editable until a "primary" combination of key fields is chosen and saved, and where re-choosing a different combination has to correctly re-lock and refetch. `Process.jsx` is still the reference for basic grid layout; this document is specifically about the lock/fetch/navigate mechanics layered on top of that.

Copy the *pattern*, not the file. Field names, table counts, and the exact combination-key fields (Date/Shift/Furnace/Panel here) are Melting-specific.

---

## 1. Progressive primary-combination enabling

Each combination field is disabled until the one before it is filled — a simple chained `disabled` prop, not a dedicated lock function:

```jsx
// MeltingLogSheet.jsx:1453 (Shift)
disabled={!primaryData.date || fetchingPrimary}

// :1478 (Furnace No.)
disabled={!primaryData.date || !primaryData.shift}

// :1506 (Panel)
disabled={!primaryData.date || !primaryData.shift || !primaryData.furnaceNo}
```

Once all four are filled, a `useEffect` (`:180-204`) fires automatically — no debounce, no explicit "check" button:

```js
useEffect(() => {
  if (primaryData.date && primaryData.shift && primaryData.furnaceNo && primaryData.panel) {
    fetchPrimaryData(primaryData.date, primaryData.shift, primaryData.furnaceNo, primaryData.panel);
    ...
  } else {
    // any key field still blank -> no primary, clear the 5 value fields
  }
}, [primaryData.date, primaryData.shift, primaryData.furnaceNo, primaryData.panel]);
```

`fetchPrimaryData` (`:797-922`) is a `GET` that either finds an existing combination (populates its value fields, computes per-field locks, sets `isPrimaryDataSaved(true)`) or doesn't (clears the value fields, `isPrimaryDataSaved(false)`). Either way it enforces a minimum ~1s spinner dwell so the "Fetching..." state doesn't flash.

**Save Primary button state machine** (`:1700-1735`), driven by `fetchingPrimary` / `showCombinationFound` / `showCombinationSaved`:

```
(fields incomplete) -> nothing rendered
all 4 filled -> "Fetching Primary..." (InlineLoader, primary variant)
  found       -> "Combination found" (success variant, fades after ~2.6s)
  not found   -> "Save Primary" button appears
                   click -> handlePrimarySubmit (:1186) -> "Saving..."
                            -> "Combination saved" (success variant, fades)
                            -> locked
```

Copy this shape for any new department: chain `disabled` on the previous field, auto-fetch on the last field filling in (not a manual "Check" button), and drive the button's own text through explicit fetch/found/saved states rather than a single boolean.

---

## 2. Per-input click-to-navigate — scoped to the field, not the whole page

There are two distinct layers here. Copy whichever matches what you're protecting.

**a) Field-level, via `onMouseDownCapture` on the field's own wrapping div** — used for the 5 primary value fields, which have their own prerequisite (all 4 combination fields must be filled):

```jsx
// :1518-1524 (cumulativeLiquidMetal's wrapper — same shape repeats for each value field)
<div
  className="melting-log-form-group"
  onMouseDownCapture={(e) => {
    if (!primaryData.date || !primaryData.shift || !primaryData.furnaceNo || !primaryData.panel) {
      handleValueFieldClick(e);
    }
  }}
  style={{ cursor: (...) ? 'pointer' : 'default' }}
>
```

`handleValueFieldClick` (`:1162-1170`) finds the first missing prerequisite, shakes/highlights it, and shows a message — scoped to *this* field's own div, so clicking a different, already-satisfied field never triggers it. This is the shape to copy when a field has its own specific prerequisite distinct from "has primary been saved."

**b) Whole-form fallback, via a `document`-level capture listener** — used to guard *every* Table 1-5 input before Primary is saved at all:

```js
// :570-611
const handleLockedTableClick = (e) => {
  if (isPrimaryDataSaved) return;
  const target = e.target;
  // walks up from target to find a .melting-log-form-group ancestor whose
  // contained input/select/textarea is `disabled`, then shows the warning
};
document.addEventListener('mousedown', handleLockedTableClick, true);
```

This one is deliberately whole-div scoped (catches clicks on labels/padding, not just the input) because its job is "is this whole section locked," a single global condition — not a per-field prerequisite. Use (a) when a field has its own distinct unlock condition; use (b) as the blanket "nothing here works yet" guard for an entire locked section.

---

## 3. Refetch-and-relock when the combination changes

`fetchPrimaryData` (`:797-922`) is called by the `useEffect` in §1 every time the 4 key fields resolve to a (possibly new) combination. What it does to the 5 value fields:

- **Found**: populates them from the server, builds a `locks` object per field (locked only if that field already has a real value), `isPrimaryFieldLocked(field)` then drives `readOnly`/cursor/opacity on that input.
- **Not found**: clears them, no locks, `isPrimaryDataSaved(false)`.

**This alone is not enough** — it only ever touched the 5 primary value fields, never Table 1-5. `handlePrimaryChange` (`:1087`) is what reacts to the user actually *changing* one of the 4 key fields, and it now handles both halves:

```js
// :1013 — extracted, shared reset (all *Valid states + resetTable1()..resetTable5())
const resetPrimaryAndTables = () => { ... };

// date branch (:1120ish) — always a full combination reset, cascades shift/furnace/panel to ''
if (field === 'date') {
  setPrimaryData({ date: value, shift: '', furnaceNo: '', panel: '', ...blank value fields });
  resetPrimaryAndTables();
  return;
}

// shift/furnaceNo/panel — only reset when actually CHANGING an already-picked
// value (not the first-time fill of the chain), since that means the user is
// now pointing at a different, unrelated combination
if (['shift', 'furnaceNo', 'panel'].includes(field) && primaryData[field] && primaryData[field] !== value) {
  resetPrimaryAndTables();
}
setPrimaryData(prev => ({ ...prev, [field]: value }));
```

**The rule to copy**: any field that's part of the combination key must, on *change* (not initial fill), clear every piece of draft state that was scoped to the old combination — not just the fields the fetch/save calls themselves touch. It's easy to wire the fetch-on-change effect and forget that unrelated draft state (extra tables, sub-forms, whatever a department bolts on) needs the same treatment.

**Confirmed a second time on `CupolaHolderLogSheet.jsx`.** Its `handlePrimaryChange` had the identical gap, slightly worse: even the `date` branch (which resets `isPrimaryDataSaved`/`heatNo`) never cleared `inputRows`, and the `shift`/`holderNumber` fallthrough did no reset at all. Fixed with the same shape — a `resetPrimaryAndRows()` helper (mirroring `resetPrimaryAndTables()`) called from the `date` branch and from a `primaryData[field] && primaryData[field] !== value` change-guard on `shift`/`holderNumber`. This is the pattern to actually expect on any page built this way, not a one-off Melting bug — audit every combination-key field's change handler for it, not just the one the original report happened to name.

---

## 4. Disabled-input CSS convention

There is **no blanket `.melting-log-form-group input:disabled` CSS rule** in `MeltingLogSheet.css` — deliberately. Every Table 1-5 field carries its own inline style conditioned on the exact same flag as its `disabled` prop:

```jsx
disabled={!isPrimaryDataSaved}
style={{
  pointerEvents: !isPrimaryDataSaved ? 'none' : 'auto',
  opacity: !isPrimaryDataSaved ? 0.6 : 1,
  backgroundColor: !isPrimaryDataSaved ? '#f1f5f9' : '#ffffff',
  cursor: !isPrimaryDataSaved ? 'not-allowed' : 'text'
}}
```

If this cursor/opacity pair and the `disabled` prop are ever driven by *different* conditions (e.g. `disabled={!isPrimaryDataSaved}` but the style checks something else, or a stale flag that isn't reset on a combination change — see §3), the field will render with the browser's native locked look regardless of what the inline style says, and looks "stuck" even after the actual gate should have lifted. Keep both driven by the exact same expression.

Reaching for a shared `:disabled` CSS class instead (as some other department pages do) is a legitimate alternative, but don't mix the two conventions within one page.

**`readOnly` fields need a manually-synced `tabIndex`, and `arrowNavigation.js` must respect it.** The 5 primary value fields (`cumulativeLiquidMetal`/`finalKWHr`/`initialKWHr`/`totalUnits`/`cumulativeUnits`) use `readOnly`, not `disabled` — `disabled` elements are skipped by both Tab and this app's custom arrow-key navigation automatically, but a `readOnly` element is neither (it just blocks typing), so it needs a manual `tabIndex={-1}` to opt out of the keyboard-navigable set, mirroring what `disabled` gives for free elsewhere. Two things have to line up for this to actually work:

1. `arrowNavigation.js`'s `isVisible()` has to check `tabIndex === -1` in addition to `el.disabled` — it didn't originally, so the `tabIndex={-1}` these fields already set was silently ignored by arrow-key navigation (though Tab still respected it), and a "locked" field remained arrow-reachable.
2. The `tabIndex` expression must cover **every** reason the field is `readOnly`, not just the headline one. These fields' `readOnly` is `!primaryData.date || !primaryData.shift || !primaryData.furnaceNo || !primaryData.panel || isPrimaryFieldLocked(field)` — a bug had `tabIndex` checking only the `isPrimaryFieldLocked(field)` half, so a field was arrow-reachable (though still un-typable) whenever the 4-key combination simply hadn't been chosen yet.

**The rule to copy**: wherever a field uses `readOnly` + manual `tabIndex` instead of `disabled`, the `tabIndex` expression must be the *exact same* boolean as the `readOnly` expression — not a subset of it — and that only actually excludes the field from arrow-navigation if `isVisible()` checks `tabIndex` at all (it now does, globally, so this is free for any other page that follows the same `readOnly`+`tabIndex={-1}` pattern).

**A wrapping div's `pointerEvents: 'none'` is not a substitute for a per-field `disabled` either — it's weaker than even the `readOnly` case above.** `CupolaHolderLogSheet.jsx`'s table-row inputs (`cpc`, `disaLine`, the `CustomTimeInput` cells, etc.) had *no* lock mechanism of their own — the whole "Locked - Save Primary Data First" table section was dimmed and made unclickable purely via a wrapper `style={{ opacity: isPrimaryDataSaved ? 1 : 0.6, pointerEvents: isPrimaryDataSaved ? 'auto' : 'none' }}`. `pointerEvents: 'none'` blocks *mouse* interaction on everything inside it, but does nothing to a field's `disabled`/`readOnly` DOM properties — so `arrowNavigation.js`'s `isVisible()` (which only excludes `el.disabled` and `tabIndex === -1`) saw every one of those fields as perfectly navigable, and keyboard-driven focus could not only arrow onto a "locked" field but type into it, bypassing the lock entirely. Fixed by adding `disabled={!isPrimaryDataSaved}` (the same boolean the wrapper's own style already uses) to every field inside the locked section — the wrapper's `pointerEvents`/`opacity` styling stays for the visual dimming, but the actual lock now lives on each field, where `disabled`/`readOnly`/`tabIndex` are the only three things this app's keyboard-navigation layer ever checks.

**The rule to copy**: a parent wrapper's `pointerEvents: 'none'`/`opacity` is presentation only. Before trusting it as a lock, check whether the fields inside also carry `disabled` (or `readOnly`+synced `tabIndex`, per above) — if the only thing keeping a section "locked" is a CSS property on an ancestor, keyboard navigation (and typing) will walk straight through it.

---

## 5. Dropdown keyboard convention (global, not page-specific) — Shift is load-bearing

`frontend/src/utils/arrowNavigation.js`'s `useArrowNavigation` hook is shared by every department page's grid wrapper. For `<select>` elements:

- **Plain ArrowUp / ArrowDown** — navigates to the spatially-nearest field above/below, exactly like every other input type. This is the important case: without it, arrowing through a mixed form gets "stuck" the moment focus lands on any dropdown, because the browser's native option-cycling would otherwise eat the keystroke instead of letting focus move on.
- **Shift+ArrowUp / Shift+ArrowDown** — cycles the select's own native option list.
- **ArrowLeft / ArrowRight** (with or without Shift) — always hop to the spatially-nearest neighboring field.

An earlier version of this hook had the priority backwards (plain arrows cycled the option, nothing was gated on Shift) — that was a misreading of the original ask ("shift plus arrow to change its option"), and produced exactly the "can't arrow past a dropdown" symptom described above. Implemented in `shouldNavigate(el, key, shiftKey)`:
```js
if (tag === 'SELECT') {
  if (key === 'ArrowUp' || key === 'ArrowDown') return !shiftKey;
  return true;
}
```
`handleArrowKeyDown` passes `e.shiftKey` through at the call site. Nothing to wire up per page — every `ShiftDropdown`/`FurnaceDropdown`/`PanelDropdown`/`SgFgDropdown`/`DisaDropdown`/etc. across the whole app gets this automatically as long as the page's grid wrapper uses `useArrowNavigation`'s `handleArrowKeyDown`, same as it already does for spatial navigation.

**A `<select>` with its own bespoke arrow handling must follow the same Shift gate, or it silently overrides this.** `CustomTimeInput`'s AM/PM segment (`Buttons.jsx`'s `handlePeriodKeyDown`, used by every `CustomTimeInput` instance app-wide) used to toggle AM/PM on any plain ArrowUp/Down and call `preventDefault()` unconditionally — which runs *before* the bubbled event ever reaches `handleArrowKeyDown` (whose very first check is `if (e.defaultPrevented) return;`), so the grid-level fix above never got a chance to fire for that field. Fixed the same way: only act when `e.shiftKey`; on a plain arrow, do nothing at all (no `preventDefault`) so the event bubbles up to the grid navigation. Since the period select only has two options, the browser's own Shift+Arrow cycling already toggles AM/PM correctly — no manual `handlePeriodChange` call is needed at all once the Shift gate is in place. **The rule to copy**: any per-field `onKeyDown` that intercepts ArrowUp/Down on a `<select>` must gate on `e.shiftKey` the same way, or it silently breaks navigation for that one field regardless of what `arrowNavigation.js` does globally.

---

## 6. Numeric input hardening

`frontend/src/utils/numericInput.js` — generic, not Melting-specific:

```js
export function blockNonNumericKeyDown(e, { allowDecimal = true, allowNegative = false } = {}) { ... }
export function sanitizeNumericPaste(e, { allowDecimal = true, allowNegative = false } = {}) { ... }
```

Wiring pattern (compose with whatever `onKeyDown` the field already has — don't replace it, since that's usually Enter-to-next-field navigation):

```jsx
<input
  type="number"
  onPaste={sanitizeNumericPaste}
  onKeyDown={(e) => { blockNonNumericKeyDown(e); handleTableEnterKey(e, nextRef); }}
  ...
/>
```

This blocks bad keystrokes/pastes at the character level, but is **not a substitute** for submit-time validation — always keep both. The submit-time re-check already existed here via `validateField` → `checkNumber` (`utils/formValidation.js`); the only gap was that the field-specific message it returns (`"IF Bath must be a valid number"`) was being discarded in favor of a generic one:

```js
// MeltingLogSheet.jsx:622-624, 712, 722
let firstErrorMessage = null;
...
if (!result.isValid) {
  hasErrors = true;
  if (!firstErrorField) {
    firstErrorField = fieldRefs[refKey];
    firstErrorMessage = result.message || null; // capture the specific one
  }
}
...
setValidationErrorMessage(firstErrorMessage || 'Fill required Fields in Correct format');
```

Keep the rest of the display pipeline as-is (`getValidationClass`/`getNumericValidationClass` for the red border, `InlineLoader variant="danger"` for the banner) — only the message content needed to become field-specific.

**Type/rule consistency check**: when a deviations file (`deviations/D<department>.js`) marks a field `type: 'Number'`, its JSX input must be `type="number"` — Melting had one drift (`IF Bath` was `type="text"` against a `Number` rule) that both bypassed the keystroke guard and rendered without a numeric keyboard on mobile. Worth a quick grep (`type="text"` vs. the field's rule type) when adopting this pattern on another page.

---

## 7. Ctrl/Cmd+S saves, instead of triggering the browser's page-save dialog

Two independent sites, same shape, wired separately because there's no single shared "the form" hook that spans both:

**Entry page** (`MeltingLogSheet.jsx`) — composed into the *existing* top-level `onKeyDown` (the same one that already carries `handleArrowKeyDown`, so there's one listener on the grid wrapper, not two):
```jsx
const handlePageKeyDown = (e) => {
  handleArrowKeyDown(e);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!submitDisabled) handleAllTablesSubmit();
  }
};
// ...
<div className="page-wrapper melting-page-wrapper" ref={gridRef} onKeyDown={handlePageKeyDown}>
```
`submitDisabled` is computed from the *exact same* expression the Submit button's own `disabled` prop uses (`loadingStates.table1..5 || !isPrimaryDataSaved`) — the shortcut must never be able to fire when the button itself couldn't.

**Report-page edit modal** (`Components/EditEntryModal.jsx` — shared by every department's report page, not Melting-specific) — same shape, composed into its existing `onKeyDown={handleArrowKeyDown}` on the `<form>`:
```jsx
onKeyDown={(e) => {
  handleArrowKeyDown(e);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (!saving) handleSubmit(e);
  }
}}
```
Because `EditEntryModal.jsx` is shared, this one change gives every department's edit-modal Save button the shortcut, not just Melting's — same "fix the shared file once" pattern as `arrowNavigation.js`/`numericInput.js`.

**The rule to copy**: always `e.preventDefault()` first (otherwise the browser's native Save-page dialog opens), and always guard the actual save call with the same disabled/loading condition the corresponding button already uses — never a bare "always allowed" call.

## 8. Info modal (`Components/Info.jsx`) — entry pages only, never report pages

Every department's *entry* page shows the `InfoIcon`/`InfoCard` validation-reference popup in its header (`Process.jsx`, `CupolaHolderLogSheet.jsx`, `Tensile.jsx`, `Impact.jsx`, etc. — confirmed via `grep -rl InfoIcon frontend/src/pages`); **no `*Report.jsx` page has it, anywhere in the app.** It's a clean, consistent split: the icon documents the rules for *entering* data, which is only relevant on the page where data is entered. `MeltingLogSheet.jsx` was the one entry page missing it — `CupolaHolderLogSheet.jsx` (Melting's own sibling module, near-identical header markup) is the exact template:

```jsx
import { InfoIcon, InfoCard, useInfoModal } from '../../Components/Info';
// ...
const { isOpen, openModal, closeModal } = useInfoModal();
// ...
<h2>
  <Save size={28} style={{ color: '#5B9AA9' }} />
  Melting Log Sheet - Entry Form
  <InfoIcon onClick={openModal} />
</h2>
// ... (right after the header block, not inside it)
<InfoCard
  isOpen={isOpen}
  onClose={closeModal}
  title="Melting Log Sheet - Validation Ranges"
  validationRanges={validationRanges}
/>
```
`validationRanges` is whatever the page already imports from its `deviations/D<department>.js` — no new data needed, `InfoCard` renders directly from the same array the submit-time validator and the numeric-guard wiring (§6) already use.

**The rule to copy**: add this to a department's entry page, never its report page — check `grep -rl InfoIcon frontend/src/pages` before assuming a page needs it; if every sibling entry page has it and one doesn't, that's the gap, not a deliberate omission.

---

## 9. Checklist for a new department page

1. Chain `disabled` across the combination-key fields in order; auto-fetch via a `useEffect` keyed on all of them once they're all filled — no manual "check" button, no debounce.
2. Drive the Save button's own label/text through explicit fetch → found/not-found → saving → saved states (§1), not a single spinner boolean.
3. For a field with its own distinct prerequisite, scope its click-guard to that field's own wrapper div (§2a). For "is the whole section locked," use one `document`-level capture listener (§2b) — don't build N per-field listeners for the same global condition.
4. Any field that's part of the combination key must clear **all** draft state scoped to the old combination on change, not just what the fetch/save calls themselves touch (§3) — audit this specifically if the page has extra sub-forms/tables beyond the primary value fields.
5. Keep each field's `disabled` prop and its cursor/opacity style driven by the *same* expression (§4). If a field uses `readOnly`+manual `tabIndex` instead, that `tabIndex` must mirror the *full* `readOnly` condition, not a subset of it (§4).
6. Nothing to do for dropdown arrow keys — it's already global via `useArrowNavigation`, Shift+↑/↓ cycles the option, plain ↑/↓ navigates (§5). If a field has its *own* `onKeyDown` intercepting arrows (like `CustomTimeInput`'s AM/PM segment), it must gate on `e.shiftKey` the same way or it silently overrides the global fix for that one field (§5).
7. Wire `blockNonNumericKeyDown`/`sanitizeNumericPaste` onto every field whose deviations rule is `type: 'Number'`/`'Integer'`, and double-check the input's `type` attribute actually matches that rule (§6). Surface the submit-time validator's specific message, not a generic fallback.
8. Compose Ctrl/Cmd+S into whatever `onKeyDown` the page's grid wrapper already has, guarded by the same condition the Save button's `disabled` prop uses (§7). The report-page edit modal already gets this for free via the shared `EditEntryModal.jsx`.
9. Add `InfoIcon`/`InfoCard` to the entry page's header if the department doesn't have it yet — never the report page (§8).
