import Modal from "./Modal";
import { IconDanger, IconInfo, IconSuccess, IconWarning } from "./Icons";

const getVariantIcon = (variant) => {
  if (variant === "success") return <IconSuccess />;
  if (variant === "warning") return <IconWarning />;
  if (variant === "danger") return <IconDanger />;
  return <IconInfo />;
};

const AlertDialog = ({
  open,
  title = "Atenção",
  message,
  variant = "info",
  onClose,
  primaryLabel = "OK"
}) => (
  <Modal open={open} title={title} className={`modal--${variant} modal--compact`}>
    <div className={`modal-alert modal-alert--${variant}`}>
      <div className="modal-alert__icon">{getVariantIcon(variant)}</div>
      <p className="modal-alert__message">{message}</p>
    </div>
    <div className="modal-actions">
      <button type="button" className="primary" onClick={onClose}>{primaryLabel}</button>
    </div>
  </Modal>
);

const ConfirmDialog = ({
  open,
  title = "Confirmação",
  message,
  variant = "danger",
  onClose,
  onConfirm,
  primaryLabel = "Excluir",
  secondaryLabel = "Cancelar"
}) => (
  <Modal open={open} title={title} className={`modal--${variant} modal--compact`}>
    <div className={`modal-alert modal-alert--${variant}`}>
      <div className="modal-alert__icon">{getVariantIcon(variant)}</div>
      <p className="modal-alert__message">{message}</p>
    </div>
    <div className="modal-actions">
      <button type="button" className="ghost" onClick={onClose}>{secondaryLabel}</button>
      <button type="button" className="danger" onClick={onConfirm}>{primaryLabel}</button>
    </div>
  </Modal>
);

export { AlertDialog, ConfirmDialog };
