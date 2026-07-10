import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

// Read/write helpers for dotted field names like 'item.it1'.
const getByPath = (obj, path) =>
    path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

const setByPath = (obj, path, value) => {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
        cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    return obj;
};

// Generic, config-driven edit modal. Submits a PUT to `${config.endpoint}/${entry._id}`.
// Only fields listed in config.fields are sent; the backend leaves the rest untouched.
const EditEntryModal = ({ open, config, entry, onClose, onSaved }) => {
    const [form, setForm] = useState({});
    const [initialForm, setInitialForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && entry && config) {
            const initial = {};
            config.fields.forEach(f => {
                const val = getByPath(entry, f.name);
                initial[f.name] = val === undefined || val === null ? '' : val;
            });
            setForm(initial);
            setInitialForm(initial);
        }
    }, [open, entry, config]);

    if (!open || !config || !entry) return null;

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Only send fields the user actually changed (smaller payload, fewer writes).
        const changed = config.fields.filter(
            f => String(form[f.name] ?? '') !== String(initialForm[f.name] ?? '')
        );

        if (changed.length === 0) {
            alert('No changes to save.');
            onClose && onClose();
            return;
        }

        // For nested fields (e.g. 'item.it1'), include sibling sub-fields so the
        // whole nested object is sent intact — otherwise .set() would drop siblings.
        const namesToSend = new Set();
        changed.forEach(f => {
            namesToSend.add(f.name);
            if (f.name.includes('.')) {
                const root = f.name.split('.')[0] + '.';
                config.fields.forEach(cf => { if (cf.name.startsWith(root)) namesToSend.add(cf.name); });
            }
        });
        const fieldsToSend = config.fields.filter(f => namesToSend.has(f.name));

        setSaving(true);
        try {
            // Build payload, expanding dotted names into nested objects.
            const payload = {};
            fieldsToSend.forEach(f => {
                let value = form[f.name];
                if (f.type === 'number') {
                    value = value === '' ? '' : Number(value);
                }
                setByPath(payload, f.name, value);
            });

            const response = await fetch(`${config.endpoint}/${entry._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));

            if (response.ok && data.success) {
                alert(data.message || 'Entry updated successfully.');
                onSaved && onSaved();
                onClose && onClose();
            } else {
                alert(data.message || 'Failed to update entry.');
            }
        } catch (err) {
            alert('Network error while updating. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={headerStyle}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#25424c' }}>{config.title}</h3>
                    <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={gridStyle}>
                        {config.fields.map(f => (
                            <div key={f.name} style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={labelStyle}>{f.label}</label>
                                {f.type === 'select' ? (
                                    <select
                                        value={form[f.name] ?? ''}
                                        onChange={e => handleChange(f.name, e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="">-- Select --</option>
                                        {(f.options || []).map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : f.type === 'textarea' ? (
                                    <textarea
                                        value={form[f.name] ?? ''}
                                        onChange={e => handleChange(f.name, e.target.value)}
                                        rows={2}
                                        style={{ ...inputStyle, height: 'auto', minHeight: '64px', resize: 'vertical' }}
                                    />
                                ) : (
                                    <input
                                        type={f.type === 'number' ? 'number' : 'text'}
                                        step={f.step || 'any'}
                                        value={form[f.name] ?? ''}
                                        onChange={e => handleChange(f.name, e.target.value)}
                                        style={inputStyle}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" style={saveBtnStyle} disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
};
const modalStyle = {
    backgroundColor: '#fff', borderRadius: '12px', width: 'min(960px, 95vw)',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
};
const headerStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.15rem 1.75rem', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0,
    backgroundColor: '#fff', zIndex: 1
};
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' };
const gridStyle = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: '1.1rem 1.25rem', padding: '1.5rem 1.75rem'
};
const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' };
const inputStyle = {
    border: '2px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 0.8rem',
    fontSize: '0.85rem', lineHeight: 1.4, height: '40px', width: '100%', boxSizing: 'border-box'
};
const footerStyle = {
    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
    padding: '1.15rem 1.75rem', borderTop: '1px solid #e2e8f0', position: 'sticky', bottom: 0, backgroundColor: '#fff'
};
const cancelBtnStyle = {
    padding: '0.55rem 1.1rem', borderRadius: '8px', border: '2px solid #cbd5e1',
    background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600
};
const saveBtnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.55rem 1.2rem', borderRadius: '8px', border: 'none',
    background: '#5B9AA9', color: '#fff', cursor: 'pointer', fontWeight: 600
};

export default EditEntryModal;
