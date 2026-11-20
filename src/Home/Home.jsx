import { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaBell,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileAlt,
  FaLink,
  FaMapMarkerAlt,
  FaPhone,
  FaPlay,
  FaPlus,
  FaTimes,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const API_URL = 'http://localhost:8080/api';
const ROLES_CON_AVISOS = ['TECNICO', 'FUNCIONARIO'];
const AVISO_VISTO_KEY = 'avisoHomeVisto';

const yaVioElAviso = () => {
  try {
    return sessionStorage.getItem(AVISO_VISTO_KEY) === '1';
  } catch {
    return false;
  }
};

const marcarAvisoVisto = () => {
  try {
    sessionStorage.setItem(AVISO_VISTO_KEY, '1');
  } catch {
    // Si el navegador bloquea el almacenamiento, el aviso simplemente puede repetirse.
  }
};

const AvisosDestacados = () => {
  const [avisos, setAvisos] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const rol = (localStorage.getItem('rol') || '').trim().toUpperCase();

  useEffect(() => {
    if (!ROLES_CON_AVISOS.includes(rol)) return undefined;

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
          // El modal aparece una sola vez por sesión; el tablero queda siempre visible.
          setModalAbierto(avisosActivos.length > 0 && !yaVioElAviso());
        }
      } catch {
        // El inicio continúa funcionando aunque el servicio de avisos no responda.
      }
    };

    cargarAvisos();
    return () => controller.abort();
  }, [rol]);

  const cerrarModal = () => {
    marcarAvisoVisto();
    setModalAbierto(false);
  };

  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!modalAbierto) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') cerrarModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalAbierto]);

  if (!ROLES_CON_AVISOS.includes(rol) || avisos.length === 0) {
    return (
      <img
        src="/Imagenes/homeImg.png"
        alt="Atención al ciudadano - Asistencia Técnica"
        className="hero-image"
      />
    );
  }

  const avisoPrincipal = avisos[0];

  return (
    <>
      {modalAbierto && (
        <div
          className="aviso-home-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aviso-home-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) cerrarModal();
          }}
        >
          <div className="aviso-home-modal-card">
            <button type="button" className="aviso-home-close" aria-label="Cerrar aviso" onClick={cerrarModal} autoFocus>
              <FaTimes aria-hidden="true" />
            </button>
            <div className="aviso-home-logos" aria-hidden="true">
              <img src="/Imagenes/LogoUGE.png" alt="" />
              <span />
              <img src="/Imagenes/logoCochabamab.png" alt="" />
            </div>
            <span className="aviso-home-kicker"><FaBell aria-hidden="true" /> Aviso importante</span>
            <h2 id="aviso-home-title">{avisoPrincipal.mensaje}</h2>
            {avisos.length > 1 && (
              <p className="aviso-home-more">Tienes {avisos.length} avisos activos disponibles en tu inicio.</p>
            )}
            <button type="button" className="btn-secondary aviso-home-ok" onClick={cerrarModal}>
              Entendido
            </button>
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
    <div className="home-page">
      {/* HERO: una sola acción principal */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-container">
          <div className="hero-content">
            <p className="hero-subtitle">Gobierno Autónomo Departamental de Cochabamba</p>

            <h1 className="hero-title" id="hero-title">
              ¿Necesitas<br />
              <span className="text-highlight">asistencia técnica?</span>
            </h1>

            <p className="hero-lead">
              Describe tu problema y envíalo al equipo técnico desde aquí.
            </p>

            <button className="btn-solicitud" type="button" onClick={() => navigate('/nueva-solicitud')}>
              <span className="btn-solicitud-icon"><FaPlus aria-hidden="true" /></span>
              <span className="btn-solicitud-copy">
                <strong>Crear nueva solicitud</strong>
                <small>Reporta tu incidencia</small>
              </span>
              <FaArrowRight className="btn-solicitud-arrow" aria-hidden="true" />
            </button>
          </div>

          <div className="hero-image-wrapper">
            <AvisosDestacados />
          </div>
        </div>
      </section>

      {/* ACCESOS IMPORTANTES */}
      <section className="important-section" aria-label="Accesos importantes">
        <div className="important-container">
          <div className="info-card">
            <div className="card-icon">
              <FaFileAlt aria-hidden="true" />
            </div>
            <div className="card-content">
              <h2>Normativas</h2>
              <p>Consulta las normativas y documentos oficiales relacionados con la asistencia técnica.</p>
              <a
                href="https://gobernaciondecochabamba.bo/web/gaceta/5"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Ver normativas
                <FaExternalLinkAlt aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">
              <FaPhone aria-hidden="true" />
            </div>
            <div className="card-content">
              <h2>Información de contacto</h2>
              <p>Encuentra nuestros datos de contacto y canales oficiales de comunicación.</p>
              <a
                href="/Documentos/1728268694.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Ver información
                <FaExternalLinkAlt aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CANALES DE COMUNICACIÓN */}
      <section className="channels-section" aria-labelledby="channels-heading">
        <div className="channels-container">
          <div className="channels-title">
            <span aria-hidden="true"></span>
            <h2 id="channels-heading">Canales de comunicación</h2>
            <span aria-hidden="true"></span>
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
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>

            <a
              href="https://gobernaciondecochabamba.bo"
              target="_blank"
              rel="noopener noreferrer"
              className="channel-link"
            >
              <div className="channel-icon">
                <FaLink aria-hidden="true" />
              </div>
              <div>
                <strong>Otros enlaces</strong>
                <p>Accede a otros sitios oficiales</p>
              </div>
              <span className="sr-only">(se abre en una pestaña nueva)</span>
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

          <p>© 2026, Gobierno Autónomo Departamental de Cochabamba</p>

          <div className="footer-contact">
            <p><FaMapMarkerAlt aria-hidden="true" /> Av. Aroma N° O-327 - Plaza San Sebastián</p>
            <p><FaPhone aria-hidden="true" /> 591 4 4500530</p>
            <p><FaEnvelope aria-hidden="true" /> gobernaciondecochabamba@gobernaciondecochabamba.bo</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;