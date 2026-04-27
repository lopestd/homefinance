import React from 'react';

const Modal = ({
  open,
  title,
  onClose,
  children,
  footer,
  className = "",
  headerActions = null,
  footerClassName = ""
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className={`modal ${className}`.trim()}>
        <div className={`modal-header ${headerActions ? "modal-header--with-actions" : ""}`.trim()}>
          <h3>{title}</h3>
          {headerActions ? <div className="modal-header-actions">{headerActions}</div> : null}
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer ? <div className={`modal-footer ${footerClassName}`.trim()}>{footer}</div> : null}
      </div>
    </div>
  );
};

export default Modal;
