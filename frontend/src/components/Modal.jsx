const Modal = ({ open, title, children, className = "" }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className={`modal ${className}`.trim()} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
