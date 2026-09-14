import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MisSolicitudes.css';

const API_URL = 'http://localhost:8080/api';

const MisSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <button className="primary-action" type="button" onClick={() => navigate('/nueva-solicitud')}>Nueva solicitud</button>
      </section>

      {error && <div className="requests-error">{error}</div>}
      {loading ? <p className="requests-loading">Cargando solicitudes…</p> : (
        <section className="requests-list" aria-live="polite">
          {solicitudes.length === 0 ? (
            <div className="empty-state">
              <h2>Aún no tiene solicitudes</h2>
              <p>Cuando registre una, podrá consultar su seguimiento aquí.</p>
              <button className="secondary-action" type="button" onClick={() => navigate('/nueva-solicitud')}>Registrar solicitud</button>
            </div>
          ) : solicitudes.map((solicitud) => (
            <article className="request-item" key={solicitud.id}>
              <div>
                <p className="request-id">SOLICITUD #{solicitud.id}</p>
                <h2>{solicitud.titulo}</h2>
                <p>{solicitud.tipo || solicitud.categoria} · {new Date(solicitud.createdAt).toLocaleDateString('es-BO')}</p>
              </div>
              <span className={`status status-${solicitud.estado?.toLowerCase()}`}>{solicitud.estado}</span>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default MisSolicitudes;
