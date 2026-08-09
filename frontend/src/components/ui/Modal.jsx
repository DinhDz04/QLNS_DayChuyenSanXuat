import React from "react";

export default function Modal({ isOpen, onClose, title, children, footer, isSubmitting, maxWidth, maxHeight }) {
    if (!isOpen) return null;

    // Chỉ ghi đè kích thước khi nơi gọi truyền maxWidth cụ thể,
    // các modal không truyền prop này vẫn giữ nguyên kích thước mặc định theo CSS cũ.
    const contentStyle = maxWidth
        ? { maxWidth, width: "94vw", maxHeight: maxHeight || "90vh" }
        : undefined;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={contentStyle}>
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
                <div className="modal-body" style={maxWidth ? { maxHeight: `calc(${maxHeight || "90vh"} - 110px)`, overflowY: "auto" } : undefined}>
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