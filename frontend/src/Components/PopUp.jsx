import React from 'react';
import '../styles/ComponentStyles/PopUp.css';

// Edit Card component for editing forms
export const EditCard = ({
  isOpen,
  onClose,
  departmentName,
  children,
  onSave,
  onCancel,
  saveText = 'Save',
  loading = false,
  error = ''
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && (onClose || onCancel)) {
      const closeHandler = onClose || onCancel;
      closeHandler();
    }
  };

  return (
    <div className="editcard-overlay" onClick={handleBackdropClick}>
      <div className="editcard-container" onClick={(e) => e.stopPropagation()}>
        <div className="editcard-header">
          <h2 className="editcard-title">
            Edit {departmentName} Test
          </h2>
        </div>

        <div className="editcard-body">
          {children}
        </div>

        <div className="editcard-footer">
          {error && (
            <span className="editcard-error">{error}</span>
          )}
          <button
            className="editcard-btn editcard-btn-save"
            onClick={onSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : saveText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCard;
