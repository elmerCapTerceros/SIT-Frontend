
import { FaEnvelope, FaFileAlt, FaLink, FaMapMarkerAlt, FaPhone, FaPlay } from 'react-icons/fa';
import './Home.css';

const Home = () => {
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
              <button className="btn btn-primary">
                NUEVA SOLICITUD
              </button>

              <button className="btn btn-secondary">
                ÚLTIMAS NOTICIAS
              </button>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <img
              src="/Imagenes/homeImg.png"
              alt="Atención al ciudadano - Asistencia Técnica"
              className="hero-image"
            />
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
                href="/documentos/normativas.pdf"
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
                href="/documentos/contactos.pdf"
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

            <a href="#" className="channel-link">
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

