import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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

const MenuIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="menu-icon"
  >
    {open ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    )}
  </svg>
);

const navLinksByRole = {
  FUNCIONARIO: [
    { label: 'Inicio', to: '/home' },
    { label: 'Nueva solicitud', to: '/nueva-solicitud' },
    { label: 'Mis solicitudes', to: '/mis-solicitudes' },
  ],
  TECNICO: [
    { label: 'Inicio', to: '/home' },
    { label: 'Solicitudes', to: '/mis-solicitudes' },
    { label: 'Reportes', to: '/reportes' },
  ],
  SUPERVISOR: [
    { label: 'Inicio', to: '/home' },
    { label: 'Solicitudes', to: '/mis-solicitudes' },
    { label: 'Técnicos', to: '/tecnicos' },
    { label: 'Avisos', to: '/avisos' },
    { label: 'Reportes', to: '/reportes' },
  ],
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);
  const userLogin = localStorage.getItem('userLogin') || 'Usuario';
  const nombre = localStorage.getItem('nombre') || '';
  const apellido = localStorage.getItem('apellido') || '';
  const nombreCompleto = `${nombre} ${apellido}`.trim() || userLogin;
  const rol = (localStorage.getItem('rol') || 'FUNCIONARIO').trim().toUpperCase();
  const navLinks = navLinksByRole[rol] || navLinksByRole.FUNCIONARIO;
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userLogin');
    localStorage.removeItem('nombre');
    localStorage.removeItem('apellido');
    localStorage.removeItem('rol');
    navigate('/login', { replace: true });
  };

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

      {/* Enlaces */}
      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {navLinks.map(({ label, to }) => (
          <NavLink key={to} to={to} className="nav-link" onClick={closeMenu}>{label}</NavLink>
        ))}
      </div>

      {/* Perfil de usuario*/}
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="user-avatar">
            <UserIcon />
          </div>
          <div className="user-info">
            <span className="user-name" title={nombreCompleto}>{nombreCompleto}</span>
            <span className="user-role">{rol}</span>
          </div>
        </div>

        <button className="logout-button" type="button" onClick={logout}>Salir</button>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen && <div className="navbar-overlay" onClick={closeMenu}></div>}
    </nav>
  );
};

export default Navbar;
