import { useCallback, useEffect, useState } from 'react';
import './MisSolicitudes.css';

const API_URL = 'http://localhost:8080/api';

const MisSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificandoId, setVerificandoId] = useState(null);

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/solicitudes/misSolicitudes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('No se pudieron cargar sus solicitudes.');
      setSolicitudes(await response.json());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarSolicitud = async (solicitud) => {
    setVerificandoId(solicitud.id);
    setError('');
    try {
      const response = await fetch(`${API_URL}/solicitudes/${solicitud.id}/verificar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo confirmar la solicitud.');
      }
      setSolicitudes((actuales) =>
        actuales.map((actual) => (actual.id === solicitud.id ? { ...actual, ...data } : actual)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setVerificandoId(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(cargarSolicitudes, 0);
    return () => window.clearTimeout(timer);
  }, [cargarSolicitudes]);

  return (
    <main className="requests-page">
      <section className="requests-header">
        <div>
          <p className="page-kicker">SEGUIMIENTO</p>
          <h1>Mis solicitudes</h1>
          <p>Revise el estado de los requerimientos que registró.</p>
        </div>
        
      </section>

      {error && <div className="requests-error">{error}</div>}
      {loading ? <p className="requests-loading">Cargando solicitudes…</p> : (
        <section className="requests-list" aria-live="polite">
          {solicitudes.length === 0 ? (
            <div className="empty-state">
              <h2>Aún no tiene solicitudes</h2>
              <p>Cuando registre una, podrá consultar su seguimiento aquí.</p>
            </div>
          ) : solicitudes.map((solicitud) => (
            <article className="request-item" key={solicitud.codigo}>
              <div>
                <p className="request-id">{solicitud.codigo}</p>
                <h2>{solicitud.titulo}</h2>
                <p>{solicitud.tipo || solicitud.categoria} · {new Date(solicitud.createdAt).toLocaleDateString('es-BO')}</p>
              </div>
              <div className="request-actions">
                <span className={`status status-${solicitud.estado?.toLowerCase()}`}>{solicitud.estado}</span>
                {solicitud.verificadoPorUsuario ? (
                  <span className="verification-status">Solicitud verificada</span>
                ) : solicitud.estado?.toUpperCase() === 'CONCLUIDA' && (
                  <button
                    className="verify-action"
                    type="button"
                    onClick={() => verificarSolicitud(solicitud)}
                    disabled={verificandoId === solicitud.id}
                  >
                    {verificandoId === solicitud.id ? 'Confirmando…' : 'Confirmar recepción'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default MisSolicitudes;
