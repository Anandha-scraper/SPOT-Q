import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EditEntryModal from './EditEntryModal';
import { useToast } from './alert';
import { formatRemaining } from '../utils/formatDateTime';
import '../styles/ComponentStyles/EntryActions.css';

// Below this much time left, tick every second so the countdown reads accurately.
const FINE_TICK_THRESHOLD_MS = 2 * 60 * 1000;

// Edit (pencil): admins, or the creator within editWindowMs of createdAt (mirrors backend enforcement). Delete (trash): admins only. Neither renders otherwise.
const EntryActions = ({ entry, editConfig, onChanged }) => {
    const { isAdmin, user, editWindowMs } = useAuth();
    const { toast } = useToast();
    const [showEdit, setShowEdit] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    // Anchor rect of the pencil, captured on hover. The tooltip is portaled to
    // <body> because the report table clips it: `.reusable-table td` sets
    // `overflow: hidden` and the container `overflow-x: auto`, so an absolutely
    // positioned bubble inside the cell is never visible.
    const [tooltipAnchor, setTooltipAnchor] = useState(null);
    const pencilRef = useRef(null);

    const createdAtMs = entry?.createdAt ? new Date(entry.createdAt).getTime() : null;
    const isOwner =
        entry?.createdBy && user?.id && String(entry.createdBy) === String(user.id);

    // null for admins (no limit) and for rows the user doesn't own.
    const remainingMs =
        !isAdmin && isOwner && createdAtMs ? editWindowMs - (now - createdAtMs) : null;

    const isOwnerWithinWindow = remainingMs !== null && remainingMs > 0;
    const canEdit = isAdmin || isOwnerWithinWindow;
    const canDelete = isAdmin;

    // Re-render while the window is open so the countdown advances and the pencil
    // disappears the moment it lapses, without waiting for a page refresh. While
    // the tooltip is actually being hovered/focused, always tick every second so
    // the visible countdown moves in real time instead of jumping in 30s steps.
    const isHovering = tooltipAnchor !== null;
    const tickMs = remainingMs !== null && (remainingMs <= FINE_TICK_THRESHOLD_MS || isHovering) ? 1000 : 30000;
    useEffect(() => {
        if (!isOwnerWithinWindow) return undefined;
        const id = setInterval(() => setNow(Date.now()), tickMs);
        return () => clearInterval(id);
    }, [isOwnerWithinWindow, tickMs]);

    // Rows without a real backend _id (e.g. unsynced localStorage drafts) can't be edited/deleted.
    if ((!canEdit && !canDelete) || !entry?._id) return null;

    const editTooltip = isAdmin
        ? 'Admin — no time limit'
        : `Editable for ${formatRemaining(remainingMs)}`;

    const showTooltip = () => {
        const rect = pencilRef.current?.getBoundingClientRect();
        if (rect) setTooltipAnchor({ x: rect.left + rect.width / 2, y: rect.top });
    };
    const hideTooltip = () => setTooltipAnchor(null);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`${editConfig.endpoint}/${entry._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                toast.success(data.message || 'Entry deleted successfully.');
                setConfirmDelete(false);
                onChanged && onChanged();
            } else {
                toast.error(data.message || 'Failed to delete entry.');
            }
        } catch (err) {
            toast.error('Network error while deleting. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
            {canEdit && (
                <span
                    ref={pencilRef}
                    className="entry-action-tooltip-wrapper"
                    onMouseEnter={showTooltip}
                    onMouseLeave={hideTooltip}
                    onFocus={showTooltip}
                    onBlur={hideTooltip}
                >
                    <Pencil
                        size={18}
                        style={{ cursor: 'pointer', color: '#3498db' }}
                        onClick={() => setShowEdit(true)}
                        aria-label={`Edit entry — ${editTooltip}`}
                        tabIndex={0}
                    />
                    {tooltipAnchor && createPortal(
                        <span
                            className="entry-action-tooltip"
                            role="tooltip"
                            style={{ left: `${tooltipAnchor.x}px`, top: `${tooltipAnchor.y}px` }}
                        >
                            {editTooltip}
                        </span>,
                        document.body
                    )}
                </span>
            )}
            {canDelete && (
                <Trash2
                    size={18}
                    style={{ cursor: 'pointer', color: '#e74c3c' }}
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete entry"
                />
            )}

            {canEdit && (
                <EditEntryModal
                    open={showEdit}
                    config={editConfig}
                    entry={entry}
                    onClose={() => setShowEdit(false)}
                    onSaved={onChanged}
                />
            )}

            {canDelete && confirmDelete && (
                <div style={overlayStyle} onClick={() => !deleting && setConfirmDelete(false)}>
                    <div style={confirmBoxStyle} onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={36} style={{ color: '#e74c3c' }} />
                        <h3 style={{ margin: '0.75rem 0 0.25rem', color: '#25424c' }}>Delete this entry?</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                disabled={deleting}
                                style={cancelBtnStyle}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                style={deleteBtnStyle}
                            >
                                {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const overlayStyle = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '1rem'
};
const confirmBoxStyle = {
    backgroundColor: '#fff', borderRadius: '10px', padding: '1.75rem',
    width: 'min(360px, 92vw)', display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
};
const cancelBtnStyle = {
    padding: '0.55rem 1.1rem', borderRadius: '8px', border: '2px solid #cbd5e1',
    background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600
};
const deleteBtnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.55rem 1.2rem', borderRadius: '8px', border: 'none',
    background: '#e74c3c', color: '#fff', cursor: 'pointer', fontWeight: 600
};

export default EntryActions;
