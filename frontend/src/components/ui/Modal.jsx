import React from "react";

export default function Modal({ isOpen, onClose, title, children, footer, isSubmitting }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button 
                        className="nut-dong-modal" 
                        type="button" 
                        onClick={onClose} 
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
