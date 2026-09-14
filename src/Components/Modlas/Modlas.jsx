import './Modlas.css';

const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="modal-success-icon">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
);

const Modlas = ({ open, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="success-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <SuccessIcon />
        <h2 id="success-modal-title">Solicitud realizada</h2>
        <p>Su solicitud fue registrada correctamente.</p>
        <button type="button" className="success-modal-button" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default Modlas;
