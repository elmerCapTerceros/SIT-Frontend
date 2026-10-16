import './ConfirmarCambioEstado.css';
import { humanize } from '../../utils/Solicitudesutils';

const ConfirmarCambioEstado = ({ open, estado, loading, error, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div
      className="confirmar-estado-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <section
        className="confirmar-estado-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-estado-titulo"
        aria-describedby="confirmar-estado-mensaje"
      >
        <h2 id="confirmar-estado-titulo">¿Desea cambiar el estado?</h2>
        <p id="confirmar-estado-mensaje">
          La solicitud cambiará a <strong>{humanize(estado)}</strong>. Solo podrá continuar al siguiente estado.
        </p>
        {error && <p className="confirmar-estado-error" role="alert">{error}</p>}
        <div className="confirmar-estado-acciones">
          <button
            type="button"
            className="confirmar-estado-btn confirmar-estado-cancelar"
            onClick={onCancel}
            disabled={loading}
          >
            No
          </button>
          <button
            type="button"
            className="confirmar-estado-btn confirmar-estado-confirmar"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Sí, cambiar'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmarCambioEstado;
