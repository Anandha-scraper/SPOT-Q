import React from 'react';
import '../styles/ComponentStyles/PopUp.css';

// Standard confirmation popup
const PopUp = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'danger',
  size = 'small'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className={'popup-container popup-' + size} onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 className="popup-title">{title}</h3>
        </div>

        <div className="popup-body">
          <p className="popup-message">{message}</p>
        </div>

        <div className="popup-footer">
          <button className="popup-btn popup-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className={'popup-btn popup-btn-confirm popup-btn-' + confirmStyle} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

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

// Confirmation Delete popup
export const ConfirmDelete = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record?',
  loading = false
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-container popup-small" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 className="popup-title">{title}</h3>
        </div>

        <div className="popup-body">
          <p className="popup-message">{message}</p>
        </div>

        <div className="popup-footer">
          <button
            className="popup-btn popup-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="popup-btn popup-btn-confirm popup-btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Save popup
export const ConfirmSave = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Save',
  message = 'Do you want to save these changes?',
  loading = false
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-container popup-small" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 className="popup-title">{title}</h3>
        </div>

        <div className="popup-body">
          <p className="popup-message">{message}</p>
        </div>

        <div className="popup-footer">
          <button
            className="popup-btn popup-btn-confirm popup-btn-success"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Success notification popup
export const SuccessPopup = ({
  isOpen,
  onClose,
  departmentName,
  message,
  autoClose = true,
  autoCloseDelay = 2000
}) => {
  if (!isOpen) return null;

  // Auto-close after delay using useEffect
  React.useEffect(() => {
    if (autoClose && isOpen && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const displayMessage = message || `${departmentName} Entry saved`;

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-container popup-small" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 className="popup-title">Data Saved</h3>
        </div>

        <div className="popup-body">
          <p className="popup-message saved-message">{displayMessage}</p>
        </div>
      </div>
    </div>
  );
};

// Edited notification popup
export const EditedPopup = ({
  isOpen,
  onClose,
  departmentName,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  if (!isOpen) return null;

  // Auto-close after delay using useEffect
  React.useEffect(() => {
    if (autoClose && isOpen && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleBackdropClick}>
      <div className="popup-container popup-small" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3 className="popup-title">Data Editing</h3>
        </div>

        <div className="popup-body">
          <p className="popup-message edited-message">
            <span className="edited-department-name">{departmentName}</span> Edited
          </p>
        </div>
      </div>
    </div>
  );
};

export default PopUp;
