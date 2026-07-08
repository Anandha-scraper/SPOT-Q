import { useState } from 'react';
import { motion } from 'motion/react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
  ToastProvider,
  useToast,
} from './alert';
import { InlineLoader } from './InlineLoader';
import '../styles/ComponentStyles/Sakthi.css';

// Sakthi Auto mark — same path data as /public/images/Logo.svg (viewBox 0 0 98 147)
const LOGO_PATH =
  'M18.1429 6C27.2467 13.2547 33.5505 16.0469 22.7113 44.5C15.2114 79 22.6686 84.5721 40.2113 78.5C47.5955 67.2555 47.7992 57.9945 36.2113 32.5L49.2113 0L61.7113 32.5C53.0536 55.5485 50.1338 67.2224 59.7113 78.5C76.0068 82.313 81.7121 79.2239 72.7113 44.5C64.9542 18.5655 69.307 13.2373 79.2113 6C72.7113 21 80.7113 31 90.2113 44.5C109.211 78 86.2113 96 59.7113 96V146.5H40.2113V96C2.21136 99 -9.7886 68 8.21136 44.5C26.2113 21 21.9549 23.8217 18.1429 6Z';

/**
 * Sakthi — draws the Sakthi Auto logo mark as a looping loader:
 * a soft glow pulse behind an animated stroke outline, with the fill
 * fading in once the outline finishes drawing. Fully transparent
 * background — drop it into any page as a loading indicator.
 */
export function Sakthi({ size = 160, color = '#FF9100', className = '' }) {
  const width = (98 / 147) * size;
  const glowBlur = Math.max(8, size * 0.08);

  return (
    <motion.svg
      width={width}
      height={size}
      viewBox="0 0 98 147"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="hidden"
      animate="visible"
      role="status"
      aria-label="Loading"
    >
      {/* glow pulse */}
      <motion.path
        d={LOGO_PATH}
        fill={color}
        style={{ filter: `blur(${glowBlur}px)`, transformOrigin: '49px 73px' }}
        variants={{
          hidden: { opacity: 0.15, scale: 0.9 },
          visible: { opacity: [0.15, 0.55, 0.15], scale: [0.9, 1.05, 0.9] },
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* drawing outline */}
      <motion.path
        d={LOGO_PATH}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: [0, 1, 1], opacity: [0, 1, 1] },
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.7, 1] }}
      />

      {/* fill fade-in/out, synced with the outline finishing */}
      <motion.path
        d={LOGO_PATH}
        fill={color}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: [0, 0, 0.9, 0.9, 0] },
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.55, 0.8, 0.95, 1] }}
      />
    </motion.svg>
  );
}

export default Sakthi;

// ════════════════════════════════════════════════════════════════════════════
// TEMP — SakthiPreview (component preview panel)
// Purpose : Preview alert.jsx (MorphingPopover + Toast), InlineLoader.jsx & the Sakthi loader above.
// Remove  : Delete this export + its usage in ProcessControl once done.
// ════════════════════════════════════════════════════════════════════════════

const INLINE_VARIANTS = ['primary', 'success', 'danger'];
const INLINE_SIZES = ['small', 'medium', 'large'];

// Inner panel — lives inside its own ToastProvider
function SakthiPreviewInner({ show, onClose }) {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLoaderFullscreen, setShowLoaderFullscreen] = useState(false);

  if (!show) return null;

  return (
    <div
      className="sakthi-preview-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`sakthi-preview-panel ${isFullscreen ? 'sakthi-preview-panel--fullscreen' : ''}`}>
        {/* Header */}
        <div className="sakthi-preview-header">
          <div>
            <h3 className="sakthi-preview-title">
              🧪 Component Preview <span className="sakthi-preview-subtitle-badge">(TEMP — remove when done)</span>
            </h3>
            <p className="sakthi-preview-subtitle">
              Click outside or × to close. Covers <code>alert.jsx</code>, <code>InlineLoader.jsx</code> &amp; the <code>Sakthi</code> loader.
            </p>
          </div>
          <div className="sakthi-preview-header-actions">
            <button
              onClick={() => setIsFullscreen(f => !f)}
              className="sakthi-preview-icon-btn"
              aria-label={isFullscreen ? 'Exit full page preview' : 'Full page preview'}
              title={isFullscreen ? 'Exit full page preview' : 'Full page preview'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="sakthi-preview-icon-btn sakthi-preview-close-btn"
              aria-label="Close preview"
            >✕</button>
          </div>
        </div>

        <hr className="sakthi-preview-hr" />

        {/* ── Section 1: Toast notifications ── */}
        <section>
          <h4 className="sakthi-preview-section-title">
            Toast Notifications <code className="sakthi-preview-code-pill">useToast</code>
          </h4>
          <div className="sakthi-preview-btn-row">
            <button className="sakthi-preview-btn" style={{ background: '#15803d' }} onClick={() => toast.success('Entry saved successfully!')}>Success</button>
            <button className="sakthi-preview-btn" style={{ background: '#b91c1c' }} onClick={() => toast.error('Something went wrong. Please retry.')}>Error</button>
            <button className="sakthi-preview-btn" style={{ background: '#b45309' }} onClick={() => toast.warning('Check your input before submitting.')}>Warning</button>
            <button className="sakthi-preview-btn" style={{ background: '#1d4ed8' }} onClick={() => toast.info('FYI — new updates are available.')}>Info</button>
          </div>
        </section>

        <hr className="sakthi-preview-hr" />

        {/* ── Section 2: MorphingPopover ── */}
        <section>
          <h4 className="sakthi-preview-section-title">
            Morphing Popover <code className="sakthi-preview-code-pill">MorphingPopover</code>
          </h4>
          <div className="sakthi-preview-popover-row">
            {/* Popover with form content */}
            <MorphingPopover>
              <MorphingPopoverTrigger>Form Popover</MorphingPopoverTrigger>
              <MorphingPopoverContent>
                <div className="sakthi-preview-popover-form">
                  <strong>Quick Action</strong>
                  <input
                    placeholder="Type something…"
                    className="sakthi-preview-input"
                  />
                  <button className="sakthi-preview-btn" style={{ background: '#15803d' }} onClick={() => toast.success('Action confirmed!')}>Confirm</button>
                </div>
              </MorphingPopoverContent>
            </MorphingPopover>
          </div>
        </section>

        <hr className="sakthi-preview-hr" />

        {/* ── Section 3: InlineLoader ── */}
        <section>
          <h4 className="sakthi-preview-section-title">
            InlineLoader <code className="sakthi-preview-code-pill">InlineLoader</code>
          </h4>

          {INLINE_VARIANTS.map(variant => (
            <div key={variant} className="sakthi-preview-variant-block">
              <div className="sakthi-preview-variant-label">variant="{variant}"</div>
              <div className="sakthi-preview-inline-row">
                {INLINE_SIZES.map(size => (
                  <InlineLoader
                    key={size}
                    message={`${variant} / ${size}`}
                    variant={variant}
                    size={size}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Current live usage simulation */}
          <div className="sakthi-preview-live-usage">
            <div className="sakthi-preview-variant-label">Live usage (as seen in submit row)</div>
            <div className="sakthi-preview-inline-row">
              <InlineLoader message="Checking combination…" variant="primary" size="medium" />
              <InlineLoader message="Validation failed: Date required" variant="danger" size="medium" />
              <InlineLoader message="Entry saved successfully" variant="success" size="medium" />
            </div>
          </div>
        </section>

        <hr className="sakthi-preview-hr" />

        {/* ── Section 4: Sakthi loader ── */}
        <section>
          <h4 className="sakthi-preview-section-title">
            Sakthi Loader <code className="sakthi-preview-code-pill">Sakthi</code>
          </h4>
          <div className="sakthi-preview-loader-strip">
            <Sakthi size={96} />
            <Sakthi size={144} />
            <Sakthi size={192} />
          </div>
          <button
            className="sakthi-preview-btn"
            style={{ background: '#0f172a', marginTop: '0.75rem' }}
            onClick={() => setShowLoaderFullscreen(true)}
          >
            Preview Full Screen
          </button>
        </section>
      </div>

      {showLoaderFullscreen && (
        <div className="sakthi-loader-fullscreen-backdrop">
          <button
            onClick={() => setShowLoaderFullscreen(false)}
            className="sakthi-preview-icon-btn sakthi-loader-fullscreen-close"
            aria-label="Close full screen loader preview"
          >
            <X size={22} />
          </button>
          <Sakthi size={320} />
        </div>
      )}
    </div>
  );
}

// Outer wrapper — provides its own toast context so useToast never throws
export function SakthiPreview({ show, onClose }) {
  return (
    <ToastProvider position="bottom-right">
      <SakthiPreviewInner show={show} onClose={onClose} />
    </ToastProvider>
  );
}
