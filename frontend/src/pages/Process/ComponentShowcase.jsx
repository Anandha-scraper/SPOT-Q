import { useState } from 'react';
import { X } from 'lucide-react';
import {
  useToast,
  AlertDialog,
  ExcelDownloadDialog,
} from '../../Components/alert';
import { InlineLoader } from '../../Components/InlineLoader';

// Below alert.css's alert-dialog-overlay/toast-container (both z-index: 9999) —
// every component this showcase opens (AlertDialog, ExcelDownloadDialog, toasts)
// portals to document.body, so the showcase itself must stay under them or it
// hides whatever it just opened.
const overlayStyle = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '1rem',
};
const cardStyle = {
  backgroundColor: '#fff', borderRadius: '12px', width: 'min(760px, 96vw)',
  maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
};
const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1.15rem 1.75rem', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0,
  backgroundColor: '#fff', zIndex: 1,
};
const sectionStyle = { padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0' };
const rowStyle = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' };
const btnStyle = {
  padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #cbd5e1',
  background: '#fff', color: '#25424c', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
};
const captionStyle = { margin: '0.6rem 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 };

const ComponentShowcase = ({ open, onClose }) => {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#25424c' }}>Component Showcase — alert.jsx & InlineLoader.jsx</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem' }}>Toast (useToast)</h4>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={() => toast.success('Entry saved successfully.')}>Success</button>
            <button style={btnStyle} onClick={() => toast.error('Failed to save data.')}>Error</button>
            <button style={btnStyle} onClick={() => toast.warning('Combination already exists.')}>Warning</button>
            <button style={btnStyle} onClick={() => toast.info('No changes to save.')}>Info</button>
          </div>
          <p style={captionStyle}>Non-blocking, auto-dismisses after 4s. Every entry form uses this for submit success/error (e.g. Process.jsx's handleSubmit).</p>
        </div>

        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem' }}>AlertDialog</h4>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={() => setConfirmOpen(true)}>Open confirm dialog</button>
            <button style={btnStyle} onClick={() => setDangerOpen(true)}>Open danger dialog</button>
          </div>
          <p style={captionStyle}>A blocking confirm/cancel modal. Use before an important or destructive action — e.g. the delete-entry confirmation in EntryActions.jsx.</p>
        </div>

        <div style={sectionStyle}>
          <h4 style={{ margin: '0 0 0.75rem' }}>ExcelDownloadDialog</h4>
          <div style={rowStyle}>
            <button style={btnStyle} onClick={() => setExcelOpen(true)}>Open Excel download dialog</button>
          </div>
          <p style={captionStyle}>Prompts for an optional From/To date range before an export. Used by every report page's "Download Excel" button.</p>
        </div>

        <div style={{ ...sectionStyle, borderBottom: 'none' }}>
          <h4 style={{ margin: '0 0 0.75rem' }}>InlineLoader</h4>
          <div style={{ ...rowStyle, gap: '0.5rem' }}>
            <InlineLoader message="Fetching Date, Disa" variant="primary" />
            <InlineLoader message="Combination Found" variant="success" />
            <InlineLoader message="Technical error. Please try again." variant="danger" />
          </div>
          <p style={captionStyle}>Compact inline status pill (three variants, three sizes). Used for the primary-lock status message (primaryLock.js's PRIMARY_STATUS) and submit-error banners on every entry form.</p>
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save changes?"
        description="This is the default 'primary' variant — used for a routine confirm/cancel choice."
        confirmLabel="Confirm"
        onConfirm={() => toast.success('Confirmed.')}
      />
      <AlertDialog
        open={dangerOpen}
        onOpenChange={setDangerOpen}
        title="Delete this entry?"
        description="This is the 'danger' variant — used before an irreversible action."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => toast.success('Deleted (demo only).')}
      />
      <ExcelDownloadDialog
        open={excelOpen}
        onOpenChange={setExcelOpen}
        reportName="Process Report (demo)"
        onConfirm={({ from, to }) => {
          setExcelOpen(false);
          toast.info(`Would export ${from || 'default'} → ${to || 'default'}`);
        }}
      />
    </div>
  );
};

export default ComponentShowcase;
