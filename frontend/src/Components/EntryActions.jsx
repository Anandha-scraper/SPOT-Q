import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from './Alert';
import EditEntryModal from './EditEntryModal';

// Per-row edit/delete actions for report pages.
//
// Visibility rule (mirrors backend enforcement):
//   - EDIT (pencil): admins, OR the non-admin creator of the entry while still
//     within the EDIT_TIME window (editWindowMs) measured from createdAt.
//   - DELETE (trash): admins ONLY.
// When neither icon applies, nothing is rendered.
//
// Props:
//   entry      - the row object (must include _id, createdBy, createdAt)
//   editConfig - one of the configs from utils/editFieldConfigs.js
//   onChanged  - callback to refetch the report after a successful edit/delete
const EntryActions = ({ entry, editConfig, onChanged }) => {
    const { isAdmin, user, editWindowMs } = useAuth();
    const [showEdit, setShowEdit] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isOwnerWithinWindow =
        entry?.createdBy && user?.id &&
        String(entry.createdBy) === String(user.id) &&
        entry?.createdAt &&
        (Date.now() - new Date(entry.createdAt).getTime() <= editWindowMs);

    const canEdit = isAdmin || isOwnerWithinWindow;
    const canDelete = isAdmin;
    // Rows without a real backend _id (e.g. unsynced localStorage drafts) can't be edited/deleted.
    if ((!canEdit && !canDelete) || !entry?._id) return null;

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
                <Pencil
                    size={18}
                    style={{ cursor: 'pointer', color: '#3498db' }}
                    onClick={() => setShowEdit(true)}
                    aria-label="Edit entry"
                />
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
