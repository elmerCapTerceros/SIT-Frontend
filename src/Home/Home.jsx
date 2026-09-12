import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        
        {/* COLUMNA IZQUIERDA: TEXTO Y BOTONES */}
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
              ULTIMAS NOTICIAS
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
  );
};

export default Home;