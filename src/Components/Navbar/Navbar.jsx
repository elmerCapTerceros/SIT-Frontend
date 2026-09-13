import { Link } from 'react-router-dom';
import './Navbar.css';

const UserIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="w-5 h-5 text-white"
  >
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img 
          src="/Imagenes/LogoUGE.png" 
          alt="Logo UGE" 
          className="brand-logo"
        />
        
        <div className="brand-divider"></div>
        
        <div className="brand-text">
          <span>UNIDAD DE</span>
          <span>GOBIERNO</span>
          <span>ELECTRÓNICO</span>
        </div>
      </div>

      {/* SECCIÓN ENLACES */}
      <div className="navbar-links">
        <Link to="/" className="nav-link">Inicio</Link>
        <a href="/nuevaSolicitud" className="nav-link">Nueva Solicitud</a>
        <a href="#" className="nav-link">Ver solicitudes</a>
      </div>
      
      {/* SECCIÓN PERFIL */}
      <div className="navbar-user">
        <div className="user-avatar">
          <UserIcon />
        </div>
        <div className="user-info">
          <span className="user-name">Lic. Elena Rostova</span>
          <span className="user-role">FUNCIONARIO</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;