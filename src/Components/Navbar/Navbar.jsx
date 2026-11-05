import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaBell, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const API_URL = 'http://localhost:8080/api';
const DISMISSED_NOTIFICATIONS_KEY = 'dismissedNotifications';

const getNotificationKey = (notification) =>
  notification.notificationType === 'new-request'
    ? `new-request-${notification.id}`
    : `assignment-${notification.asignacionTecnicoId ?? notification.codigo ?? notification.id}`;

const getSolicitudLabel = (notification) => notification.codigo ?? notification.id;
const normalizeEstado = (estado) => String(estado ?? '').trim().toLowerCase();
const getDismissedKey = (tecnicoId) => `${DISMISSED_NOTIFICATIONS_KEY}_${tecnicoId}`;
const readDismissed = (tecnicoId) => {
  try {
    const value = JSON.parse(localStorage.getItem(getDismissedKey(tecnicoId)) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

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
    { label: 'Solicitudes asignadas', to: '/asignacion-tecnico' },
    { label: 'Mis reportes', to: '/Reportes' },
  ],
  SUPERVISOR: [
    { label: 'Inicio', to: '/home' },
    { label: 'Solicitudes', to: '/solicitudes-tecnico' },
    { label: 'Técnicos', to: '/tecnicos' },
    { label: 'Avisos', to: '/AvisoSupervisor' },
    { label: 'Reportes', to: '/ReportesSupervisor' },
    { label: 'Mis solicitudes', to: '/mis-solicitudes' },
    { label: 'Dashboard', to: '/DashboardSupervisor' },
  ],
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);
  const userLogin = localStorage.getItem('userLogin') || 'Usuario';
  const nombre = localStorage.getItem('nombre') || '';
  const apellido = localStorage.getItem('apellido') || '';
  const nombreCompleto = `${nombre} ${apellido}`.trim() || userLogin;
  const rol = (localStorage.getItem('rol') || 'FUNCIONARIO').trim().toUpperCase();
  const navLinks = navLinksByRole[rol] || navLinksByRole.FUNCIONARIO;

  useEffect(() => {
    if (!['TECNICO', 'SUPERVISOR'].includes(rol) || !localStorage.getItem('userId')) return undefined;

    let cancelled = false;
    const cargarNotificaciones = async () => {
      try {
        const endpoint = rol === 'TECNICO'
          ? `/asignaciones/tecnico/${localStorage.getItem('userId')}/solicitudes`
          : '/solicitudes/SolicitudesTecnicas';
        const response = await fetch(
          `${API_URL}${endpoint}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (!response.ok) return;

        const solicitudes = await response.json();
        const tecnicoId = localStorage.getItem('userId');
        const dismissed = readDismissed(tecnicoId);
        const pendientes = (Array.isArray(solicitudes) ? solicitudes : [])
          .filter((solicitud) => ['nueva', 'pendiente'].includes(normalizeEstado(solicitud.estado)))
          .filter((solicitud) => rol === 'TECNICO' || !solicitud.tecnicoId)
          .map((solicitud) => ({
            ...solicitud,
            notificationType: rol === 'SUPERVISOR' ? 'new-request' : 'assignment',
          }))
          .filter((solicitud) => !dismissed.includes(getNotificationKey(solicitud)))
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

        if (!cancelled) setNotifications(pendientes);
      } catch {
        // La campanita no debe interrumpir la navegación si el backend no está disponible.
      }
    };

    cargarNotificaciones();
    const intervalId = window.setInterval(cargarNotificaciones, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [rol]);

  const cerrarNotificacion = (solicitud) => {
    const key = getNotificationKey(solicitud);
    const tecnicoId = localStorage.getItem('userId');
    const dismissed = readDismissed(tecnicoId);
    if (!dismissed.includes(key)) {
      localStorage.setItem(getDismissedKey(tecnicoId), JSON.stringify([...dismissed, key]));
    }
    setNotifications((current) => current.filter((item) => getNotificationKey(item) !== key));
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
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
        <button
          className="mobile-logout-button"
          type="button"
          onClick={logout}
        >
          Cerrar sesión
        </button>
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

        {['TECNICO', 'SUPERVISOR'].includes(rol) && (
          <div className="notification-area">
            <button
              className={`notification-button${notifications.length ? ' has-notifications' : ''}`}
              type="button"
              aria-label={`Notificaciones${notifications.length ? `: ${notifications.length} pendientes` : ''}`}
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <FaBell aria-hidden="true" />
              {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
            </button>

            {notificationsOpen && (
              <div className="notification-panel" role="region" aria-label="Notificaciones de solicitudes">
                <div className="notification-panel-header">
                  <strong>Notificaciones</strong>
                  <span>{notifications.length}</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="notification-empty">No tienes notificaciones nuevas.</p>
                ) : (
                  notifications.map((solicitud) => (
                    <div className="notification-item" key={getNotificationKey(solicitud)}>
                      <button
                        type="button"
                        className="notification-message"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(
                            solicitud.notificationType === 'new-request'
                              ? '/solicitudes-tecnico'
                              : '/detalleSolicitud',
                            { state: { solicitud } }
                          );
                        }}
                      >
                        <FaBell aria-hidden="true" />
                        <span>
                          {solicitud.notificationType === 'new-request'
                            ? <>Tienes una nueva solicitud <strong>#{getSolicitudLabel(solicitud)}</strong> pendiente de asignar</>
                            : <>Tienes la solicitud <strong>#{getSolicitudLabel(solicitud)}</strong> asignada</>}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="notification-close"
                        aria-label={`Cerrar notificación de la solicitud ${getSolicitudLabel(solicitud)}`}
                        onClick={() => cerrarNotificacion(solicitud)}
                      >
                        <FaTimes aria-hidden="true" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
