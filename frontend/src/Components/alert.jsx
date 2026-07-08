/**
 * ============================================================
 *  alert.jsx  —  Reusable UI Component Library
 * ============================================================
 *
 *  This file exports the following reusable components / hooks.
 *  Import only what you need:
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  MORPHING POPOVER                                       │
 *  │  A spring-animated popover with shared layout motion.   │
 *  │                                                         │
 *  │  Components:                                            │
 *  │    • MorphingPopover        — root wrapper              │
 *  │    • MorphingPopoverTrigger — button that opens it      │
 *  │    • MorphingPopoverContent — animated panel            │
 *  │                                                         │
 *  │  Usage:                                                 │
 *  │    import {                                             │
 *  │      MorphingPopover,                                   │
 *  │      MorphingPopoverTrigger,                            │
 *  │      MorphingPopoverContent,                            │
 *  │    } from '../Components/alert';                        │
 *  │                                                         │
 *  │    <MorphingPopover>                                    │
 *  │      <MorphingPopoverTrigger>Open</MorphingPopoverTrigger>│
 *  │      <MorphingPopoverContent>                           │
 *  │        <p>Content here</p>                              │
 *  │      </MorphingPopoverContent>                          │
 *  │    </MorphingPopover>                                   │
 *  │                                                         │
 *  │  Props (MorphingPopover):                               │
 *  │    transition?  — motion/react Transition object        │
 *  │    defaultOpen? — boolean (uncontrolled default)        │
 *  │    open?        — boolean (controlled)                  │
 *  │    onOpenChange?— (open: boolean) => void               │
 *  │    variants?    — motion/react Variants object          │
 *  │    className?   — extra CSS classes                     │
 *  │                                                         │
 *  │  Props (MorphingPopoverTrigger):                        │
 *  │    asChild? — render child as the motion element        │
 *  │                                                         │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  TOAST SYSTEM                                           │
 *  │  Animated, accessible toast notifications.              │
 *  │                                                         │
 *  │  Exports:                                               │
 *  │    • ToastProvider — wraps app/subtree                  │
 *  │    • useToast      — hook to fire toasts                │
 *  │                                                         │
 *  │  Usage:                                                 │
 *  │    // 1. Wrap your app once (e.g. App.jsx / main.jsx):  │
 *  │    import { ToastProvider } from '../Components/alert'; │
 *  │    <ToastProvider position="bottom-right">              │
 *  │      <App />                                            │
 *  │    </ToastProvider>                                     │
 *  │                                                         │
 *  │    // 2. Fire toasts from any child component:          │
 *  │    import { useToast } from '../Components/alert';      │
 *  │    const { toast } = useToast();                        │
 *  │                                                         │
 *  │    toast.success('Saved!')          // green            │
 *  │    toast.error('Failed!')           // red              │
 *  │    toast.warning('Check input!')    // amber             │
 *  │    toast.info('FYI...')             // blue              │
 *  │    const id = toast.success('Saved!');                  │
 *  │    toast.dismiss(id)                                    │
 *  │                                                         │
 *  │  All toasts auto-dismiss after 4s (fixed).               │
 *  │                                                         │
 *  │  Props (ToastProvider):                                 │
 *  │    position?  — 'top-right' | 'top-left' | 'top-center'│
 *  │                 'bottom-right' (default) | 'bottom-left'│
 *  │                 'bottom-center'                         │
 *  │    maxToasts? — max visible at once (default: 5)        │
 *  └─────────────────────────────────────────────────────────┘
 */


import {
  useState,
  useId,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  isValidElement,
} from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
} from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import '../styles/ComponentStyles/alert.css';

// ─── Default Transition ───────────────────────────────────────────────────────
const TRANSITION = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.4,
};

// ─── Context ──────────────────────────────────────────────────────────────────
const MorphingPopoverContext = createContext(null);

// ─── useClickOutside (inlined) ────────────────────────────────────────────────
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// ─── Popover Logic Hook ───────────────────────────────────────────────────────
function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = () => {
    if (controlledOpen === undefined) setUncontrolledOpen(true);
    onOpenChange?.(true);
  };

  const close = () => {
    if (controlledOpen === undefined) setUncontrolledOpen(false);
    onOpenChange?.(false);
  };

  return { isOpen, open, close, uniqueId };
}

// ─── MorphingPopover ──────────────────────────────────────────────────────────
/**
 * @param {{
 *   children: React.ReactNode,
 *   transition?: object,
 *   defaultOpen?: boolean,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   variants?: object,
 *   className?: string,
 * } & React.ComponentProps<'div'>} props
 */
function MorphingPopover({
  children,
  transition = TRANSITION,
  defaultOpen,
  open,
  onOpenChange,
  variants,
  className = '',
  ...props
}) {
  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <MotionConfig transition={transition}>
        <div
          className={`morphing-popover-root ${className}`}
          key={popoverLogic.uniqueId}
          {...props}
        >
          {children}
        </div>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  );
}

// ─── MorphingPopoverTrigger ───────────────────────────────────────────────────
/**
 * @param {{
 *   children: React.ReactNode,
 *   className?: string,
 *   asChild?: boolean,
 * } & React.ComponentProps<typeof motion.button>} props
 */
function MorphingPopoverTrigger({
  children,
  className = '',
  asChild = false,
  ...props
}) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error('MorphingPopoverTrigger must be used within MorphingPopover');
  }

  if (asChild && isValidElement(children)) {
    const MotionComponent = motion.create(children.type);
    const childProps = children.props;

    return (
      <MotionComponent
        {...childProps}
        onClick={context.open}
        layoutId={`popover-trigger-${context.uniqueId}`}
        className={childProps.className}
        key={context.uniqueId}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}
      />
    );
  }

  return (
    <motion.div
      key={context.uniqueId}
      layoutId={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}
    >
      <motion.button
        {...props}
        layoutId={`popover-label-${context.uniqueId}`}
        key={context.uniqueId}
        className={`morphing-popover-trigger-btn ${className}`}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}

// ─── MorphingPopoverContent ───────────────────────────────────────────────────
/**
 * @param {{
 *   children: React.ReactNode,
 *   className?: string,
 * } & React.ComponentProps<typeof motion.div>} props
 */
function MorphingPopoverContent({ children, className = '', ...props }) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error('MorphingPopoverContent must be used within MorphingPopover');
  }

  const ref = useRef(null);
  useClickOutside(ref, context.close);

  useEffect(() => {
    if (!context.isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') context.close();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context.isOpen, context.close]);

  return (
    <AnimatePresence>
      {context.isOpen && (
        <motion.div
          {...props}
          ref={ref}
          layoutId={`popover-trigger-${context.uniqueId}`}
          key={context.uniqueId}
          id={`popover-content-${context.uniqueId}`}
          role="dialog"
          aria-modal="true"
          className={`morphing-popover-content ${className}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={context.variants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };

// ════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ════════════════════════════════════════════════════════════════════════════

// ─── Toast Context ────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const TOAST_VARIANTS = {
  initial:  { opacity: 0, y: 40, scale: 0.92 },
  animate:  { opacity: 1, y: 0,  scale: 1    },
  exit:     { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const TOAST_TRANSITION = { type: 'spring', bounce: 0.3, duration: 0.5 };
const TOAST_DURATION = 4000; // every toast auto-dismisses after 4s, fixed

// ─── ToastProvider ────────────────────────────────────────────────────────────
/**
 * Wrap your app (or a subtree) with <ToastProvider> to enable toasts.
 * @param {{ children: React.ReactNode, position?: 'top-right'|'top-left'|'bottom-right'|'bottom-left'|'top-center'|'bottom-center', maxToasts?: number }} props
 */
function ToastProvider({ children, position = 'bottom-right', maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.slice(-maxToasts); // keep only the last N toasts
    });

    setTimeout(() => removeToast(id), TOAST_DURATION);

    return id;
  }, [maxToasts, removeToast]);

  // Convenience shortcuts — 'success' | 'error' | 'warning' | 'info'
  const toast = {};
  toast.success = (msg) => addToast(msg, 'success');
  toast.error   = (msg) => addToast(msg, 'error');
  toast.warning = (msg) => addToast(msg, 'warning');
  toast.info    = (msg) => addToast(msg, 'info');
  toast.dismiss = (id)  => removeToast(id);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} position={position} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── useToast ─────────────────────────────────────────────────────────────────
/**
 * Returns `{ toast }` where toast.success(msg) / toast.error(msg) /
 * toast.warning(msg) / toast.info(msg) trigger animated toasts.
 *
 * Must be used inside <ToastProvider>.
 */
function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── ToastContainer (internal renderer) ──────────────────────────────────────
function ToastContainer({ toasts, position, onDismiss }) {
  return (
    <MotionConfig transition={TOAST_TRANSITION}>
      <div className={`toast-container toast-container--${position}`} aria-live="polite" aria-label="Notifications">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

// ─── ToastItem (single notification) ─────────────────────────────────────────
function ToastItem({ toast: t, onDismiss }) {
  const Icon = TOAST_ICONS[t.type];
  return (
    <motion.div
      layout
      className={`toast-item toast-item--${t.type}`}
      variants={TOAST_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      role="alert"
      aria-live="assertive"
    >
      <span className="toast-icon">
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <span className="toast-message">{t.message}</span>
      <button
        className="toast-close"
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={2.25} />
      </button>
    </motion.div>
  );
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

export { ToastProvider, useToast };
