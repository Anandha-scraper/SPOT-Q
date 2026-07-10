import React from 'react';

// Minimal inline status indicator.
// Replaces the InlineLoader previously exported from the (removed) Alert.jsx.
// Shows a short inline message tinted by `variant`. `size` tweaks the scale.
// Self-contained (inline styles only) so it has no external CSS/animation deps.
const VARIANT_COLORS = {
  primary: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  success: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  danger:  { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
};

const SIZE_STYLES = {
  small:  { fontSize: '0.75rem', padding: '4px 8px' },
  medium: { fontSize: '0.85rem', padding: '6px 10px' },
  large:  { fontSize: '0.95rem', padding: '8px 12px' },
};

export const InlineLoader = ({ message = 'Loading...', variant = 'primary', size = 'medium' }) => {
  const c = VARIANT_COLORS[variant] || VARIANT_COLORS.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.medium;
  return (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '6px',
        fontWeight: 500,
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        ...s,
      }}
    >
      {message}
    </span>
  );
};

export default InlineLoader;
