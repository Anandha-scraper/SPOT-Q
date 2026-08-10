// Bring the first failing field into view after a blocked submit. Focus alone is
// not enough on these long department forms — an invalid field above/below the
// fold gives no visible feedback, so scroll to it as well.

export const focusFirstError = (el) => {
  if (!el || typeof el.focus !== 'function') return;
  el.focus();
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

export default focusFirstError;
