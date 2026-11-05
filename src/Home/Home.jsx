
import { useEffect, useState } from 'react';
import { FaBell, FaEnvelope, FaFileAlt, FaLink, FaMapMarkerAlt, FaPhone, FaPlay, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const API_URL = 'http://localhost:8080/api';

const AvisosDestacados = () => {
  const [avisos, setAvisos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const rol = (localStorage.getItem('rol') || '').trim().toUpperCase();

  useEffect(() => {
    if (!['TECNICO', 'FUNCIONARIO'].includes(rol)) return undefined;

    const controller = new AbortController();
    const cargarAvisos = async () => {
      try {
        const response = await fetch(`${API_URL}/avisos`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = await response.json();
        const avisosActivos = Array.isArray(data) ? data.filter((aviso) => aviso.activo) : [];
        if (!controller.signal.aborted) {
          setAvisos(avisosActivos);
          setModalAbierto(avisosActivos.length > 0);
        }
      } catch {
        // El inicio continúa funcionando aunque el servicio de avisos no responda.
      }
    };

    cargarAvisos();
    return () => controller.abort();
  }, [rol]);

  if (!['TECNICO', 'FUNCIONARIO'].includes(rol) || avisos.length === 0) {
    return <img src="/Imagenes/homeImg.png" alt="Atención al ciudadano - Asistencia Técnica" className="hero-image" />;
  }

  const avisoPrincipal = avisos[0];

  return (
    <>
      {modalAbierto && (
        <div className="aviso-home-modal" role="dialog" aria-modal="true" aria-labelledby="aviso-home-title">
          <div className="aviso-home-modal-card">
            <button type="button" className="aviso-home-close" aria-label="Cerrar aviso" onClick={() => setModalAbierto(false)}>
              <FaTimes aria-hidden="true" />
            </button>
            <div className="aviso-home-logos" aria-hidden="true">
              <img src="/Imagenes/LogoUGE.png" alt="" />
              <span />
              <img src="/Imagenes/logoCochabamab.png" alt="" />
            </div>
            <span className="aviso-home-kicker"><FaBell aria-hidden="true" /> Aviso importante</span>
            <h2 id="aviso-home-title">{avisoPrincipal.mensaje}</h2>
            {avisos.length > 1 && <p className="aviso-home-more">Tienes {avisos.length} avisos activos disponibles en tu inicio.</p>}
          </div>
        </div>
      )}

      <div className="aviso-home-board" aria-label="Avisos activos">
        <div className="aviso-home-board-heading">
          <span className="aviso-home-board-icon"><FaBell aria-hidden="true" /></span>
          <div>
            <span className="aviso-home-kicker">Avisos activos</span>
            <strong>Información importante</strong>
          </div>
        </div>
        <div className="aviso-home-list">
          {avisos.map((aviso) => (
            <article className="aviso-home-item" key={aviso.id}>
              <span className="aviso-home-item-dot" aria-hidden="true" />
              <div>
                <p>{aviso.mensaje}</p>
                {aviso.createdAt && <small>{new Date(aviso.createdAt).toLocaleDateString('es-BO')}</small>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <section className="hero-section">
        <div className="hero-container">

          <div className="hero-content">
            <p className="hero-subtitle">
              GOBIERNO AUTÓNOMO DEPARTAMENTAL DE COCHABAMBA
            </p>

            <h1 className="hero-title">
              SOLICITA<br />
              ASISTENCIA<br />
              <span className="text-highlight">TÉCNICA DE</span><br />
              <span className="text-highlight">FORMA FÁCIL</span>
            </h1>

            <div className="hero-buttons">
              <button className="btn btn-primary" type="button" onClick={() => navigate('/nueva-solicitud')}>
                NUEVA SOLICITUD
              </button>

              <button className="btn btn-secondary" type="button" onClick={() => navigate('/not-found')}>
                ÚLTIMAS NOTICIAS
              </button>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <AvisosDestacados />
          </div>

        </div>
      </section>

      {/* ACCESOS IMPORTANTES */}
      <section className="important-section">
        <div className="important-container">

          {/* NORMATIVAS */}
          <div className="info-card">
            <div className="card-icon">
              <FaFileAlt aria-hidden="true" />
            </div>

            <div className="card-content">
              <h2>Normativas</h2>
              <p>
                Consulta las normativas y documentos oficiales
                relacionados con la asistencia técnica.
              </p>

              <a
                href="https://gobernaciondecochabamba.bo/web/gaceta/5"
                target="_blank"
                rel="noopener noreferrer"
                className="card-button"
              >
                VER NORMATIVAS
              </a>
            </div>
          </div>

          {/* INFORMACIÓN DE CONTACTO */}
          <div className="info-card contact-card">

            <div className="card-icon">
              <FaPhone aria-hidden="true" />
            </div>

            <div className="card-content">
              <h2>Información de Contacto</h2>
              <p>
                Encuentra nuestros datos de contacto y canales
                oficiales de comunicación.
              </p>

              <a
                href="/Documentos/1728268694.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="card-button"
              >
                VER INFORMACIÓN
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* CANALES DE COMUNICACIÓN */}
      <section className="channels-section">
        <div className="channels-container">

          <div className="channels-title">
            <span></span>
            <h2>Canales de Comunicación</h2>
            <span></span>
          </div>

          <div className="channels-links">

            <a
              href="https://gobernaciondecochabamba.bo/web/gobernaciontv"
              target="_blank"
              rel="noopener noreferrer"
              className="channel-link"
            >
              <div className="channel-icon">
                <FaPlay aria-hidden="true" />
              </div>

              <div>
                <strong>Gobernación TV</strong>
                <p>Canal oficial de comunicación</p>
              </div>
            </a>

            <a href="https://gobernaciondecochabamba.bo" target="_blank" rel="noopener noreferrer" className="channel-link">
              <div className="channel-icon">
                <FaLink aria-hidden="true" />
              </div>

              <div>
                <strong>Otros enlaces</strong>
                <p>Accede a otros sitios oficiales</p>
              </div>
            </a>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-content">

          <img
            src="https://gobernaciondecochabamba.bo/assets/img/logo3.png"
            alt="Gobierno Autónomo Departamental de Cochabamba"
            className="footer-logo"
          />

          <p>
            © 2026, Gobierno Autónomo Departamental de Cochabamba
          </p>

          <div className="footer-contact">
            <p><FaMapMarkerAlt aria-hidden="true" /> Av. Aroma N° O-327 - Plaza San Sebastián</p>
            <p><FaPhone aria-hidden="true" /> 591 4 4500530</p>
            <p><FaEnvelope aria-hidden="true" /> gobernaciondecochabamba@gobernaciondecochabamba.bo</p>
          </div>

        </div>
      </footer>
    </>
  );
};

export default Home;

