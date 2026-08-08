// Reusable UI library: ToastProvider/useToast, AlertDialog, and ExcelDownloadDialog — see frontend.md for usage.

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import CustomDatePicker from "./CustomDatePicker";
import "../styles/ComponentStyles/alert.css";

// ─── Default Transition ───────────────────────────────────────────────────────
const TRANSITION = {
  type: "spring",
  bounce: 0.1,
  duration: 0.4,
};

// ─── useClickOutside (inlined) ────────────────────────────────────────────────
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ── TOAST SYSTEM ──

// ─── Toast Context ────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const TOAST_VARIANTS = {
  initial: { opacity: 0, y: 40, scale: 0.92 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

const TOAST_TRANSITION = { type: "spring", bounce: 0.3, duration: 0.5 };
const TOAST_DURATION = 4000; // every toast auto-dismisses after 4s, fixed

// ─── ToastProvider ────────────────────────────────────────────────────────────
// Wrap the app (or a subtree) to enable toasts; position/maxToasts control placement and visible count.
function ToastProvider({ children, position = "bottom-right", maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        return next.slice(-maxToasts); // keep only the last N toasts
      });

      setTimeout(() => removeToast(id), TOAST_DURATION);

      return id;
    },
    [maxToasts, removeToast],
  );

  // Convenience shortcuts — 'success' | 'error' | 'warning' | 'info'
  const toast = {};
  toast.success = (msg) => addToast(msg, "success");
  toast.error = (msg) => addToast(msg, "error");
  toast.warning = (msg) => addToast(msg, "warning");
  toast.info = (msg) => addToast(msg, "info");
  toast.dismiss = (id) => removeToast(id);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        onDismiss={removeToast}
      />
    </ToastContext.Provider>
  );
}

// ─── useToast ─────────────────────────────────────────────────────────────────
// toast.success/error/warning/info(msg) fire animated toasts; must be used inside <ToastProvider>.
function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ─── ToastContainer (internal renderer) ──────────────────────────────────────
function ToastContainer({ toasts, position, onDismiss }) {
  return (
    <MotionConfig transition={TOAST_TRANSITION}>
      <div
        className={`toast-container toast-container--${position}`}
        aria-live="polite"
        aria-label="Notifications"
      >
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
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export { ToastProvider, useToast };

// A controlled confirm/cancel dialog styled to the SPOT-Q light theme (no radix/shadcn in this repo).

const DIALOG_VARIANTS = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.15 } },
};

const OVERLAY_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "primary",
  loading = false,
  icon,
  closeOnConfirm = true,
}) {
  const cardRef = useRef(null);
  useClickOutside(cardRef, () => {
    if (!loading) onOpenChange?.(false);
  });

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onOpenChange?.(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onOpenChange]);

  const HeaderIcon =
    icon ??
    (variant === "danger" ? <AlertTriangle size={22} /> : <Info size={22} />);

  const handleConfirm = () => {
    onConfirm?.();
    if (closeOnConfirm) onOpenChange?.(false);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="alert-dialog-overlay"
          variants={OVERLAY_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={TRANSITION}
        >
          <motion.div
            ref={cardRef}
            className={`alert-dialog-card alert-dialog-card--${variant}`}
            role="alertdialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            variants={DIALOG_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TRANSITION}
          >
            <div className="alert-dialog-header">
              <span
                className={`alert-dialog-icon alert-dialog-icon--${variant}`}
              >
                {HeaderIcon}
              </span>
              <div className="alert-dialog-heading">
                {title && <h2 className="alert-dialog-title">{title}</h2>}
                {description && (
                  <p className="alert-dialog-description">{description}</p>
                )}
              </div>
            </div>

            {children && <div className="alert-dialog-body">{children}</div>}

            <div className="alert-dialog-footer">
              <button
                type="button"
                className="alert-dialog-btn alert-dialog-btn--cancel"
                onClick={() => onOpenChange?.(false)}
                disabled={loading}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`alert-dialog-btn alert-dialog-btn--${variant === "danger" ? "danger" : "confirm"}`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading && <Loader2 size={16} className="alert-dialog-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// A confirmation dialog for Excel downloads with an optional From/To range; a blank range falls back to the caller's default (see utils/exportToExcel.js#getExportRange).

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function ExcelDownloadDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultFrom = "",
  defaultTo = "",
  reportName,
  loading = false,
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  // Re-seed the range from the page's current filter each time the dialog opens.
  useEffect(() => {
    if (open) {
      setFrom(defaultFrom || "");
      setTo(defaultTo || "");
    }
  }, [open, defaultFrom, defaultTo]);

  const max = todayYMD();

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Download Excel"
      description={
        reportName
          ? `Choose a date range for "${reportName}".`
          : "Choose a date range for this export."
      }
      confirmLabel="Download"
      cancelLabel="Cancel"
      variant="primary"
      loading={loading}
      closeOnConfirm={false}
      icon={<FileSpreadsheet size={22} />}
      onConfirm={() => onConfirm?.({ from, to })}
    >
      <div className="excel-dialog-range">
        <div className="excel-dialog-field">
          <label>From Date</label>
          <CustomDatePicker
            value={from}
            max={max}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="excel-dialog-field">
          <label>To Date</label>
          <CustomDatePicker
            value={to}
            max={max}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>
      <p className="excel-dialog-hint">
        Leave blank to export the default range (1st of last month → today).
      </p>
    </AlertDialog>
  );
}

export { AlertDialog, ExcelDownloadDialog };
