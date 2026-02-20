import React from 'react';

const Modal = ({ open, title, onClose, children, footer, className = "" }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className={`modal ${className}`.trim()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;