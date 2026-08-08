import React, { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import "../styles/ComponentStyles/Info.css";

// validationRanges item shape and rendering rules are documented in frontend.md's Info.jsx entry.
export const InfoIcon = ({ onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`info-icon-button ${className}`}
    title="View validation ranges"
  >
    <Info size={18} />
  </button>
);

export const InfoCard = ({ isOpen, onClose, title, validationRanges = [] }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay">
      <div className="info-modal-card" ref={modalRef}>
        <div className="info-modal-header">
          <div className="info-modal-title">
            <Info size={20} />
            <h3>{title || "Validation Ranges"}</h3>
          </div>
        </div>

        <div className="info-modal-body">
          {validationRanges.length === 0 ? (
            <div className="info-no-data">
              <p>No validation ranges configured for this form.</p>
            </div>
          ) : (
            <div className="info-validation-list">
              {validationRanges.map((item, index) => (
                <div key={index} className="info-validation-item">
                  <div className="info-field-name">
                    <span className="info-field-label">{item.field}</span>
                    {item.required && (
                      <span className="info-required-asterisk">*</span>
                    )}
                  </div>

                  <div className="info-validation-details">
                    {item.type && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Type:</span>
                        <span className="info-detail-value">{item.type}</span>
                      </div>
                    )}

                    {item.unit && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Unit:</span>
                        <span className="info-detail-value">{item.unit}</span>
                      </div>
                    )}

                    {item.min !== undefined && item.max !== undefined && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Range:</span>
                        <span className="info-detail-value">
                          {item.min} - {item.max}
                        </span>
                      </div>
                    )}

                    {item.min !== undefined && item.max === undefined && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Min:</span>
                        <span className="info-detail-value">{item.min}</span>
                      </div>
                    )}

                    {item.max !== undefined && item.min === undefined && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Max:</span>
                        <span className="info-detail-value">{item.max}</span>
                      </div>
                    )}

                    {item.minLength !== undefined && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Min Length:</span>
                        <span className="info-detail-value">
                          {item.minLength}
                        </span>
                      </div>
                    )}

                    {item.maxLength !== undefined && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Max Length:</span>
                        <span className="info-detail-value">
                          {item.maxLength}
                        </span>
                      </div>
                    )}

                    {item.pattern && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Pattern:</span>
                        <span className="info-detail-value">
                          {item.pattern}
                        </span>
                      </div>
                    )}

                    {item.allowedValues && item.allowedValues.length > 0 && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">
                          Allowed Values:
                        </span>
                        <span className="info-detail-value">
                          {item.allowedValues.join(", ")}
                        </span>
                      </div>
                    )}

                    {item.description && (
                      <div className="info-detail-row">
                        <span className="info-detail-label">Note:</span>
                        <span className="info-detail-value">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="info-modal-close-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const useInfoModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

export default InfoCard;
