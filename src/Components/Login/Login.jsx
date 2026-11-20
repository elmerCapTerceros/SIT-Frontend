import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../utils/api';
import './Login.css';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="input-icon">
    <circle cx="12" cy="8" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="input-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3" />
    <rect x="4.5" y="10.5" width="15" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="eye-icon">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    )}
  </svg>
);

const institutionalLinks = [
  {
    number: '01',
    label: 'Portal oficial de la Gobernación',
    url: 'https://gobernaciondecochabamba.bo/',
  },
  {
    number: '02',
    label: 'Gobernación en Gob.bo',
    url: 'https://www.gob.bo/entidades/gobierno-autonomo-departamental-de-cochabamba',
  },
  {
    number: '03',
    label: 'Organigrama institucional',
    url: 'https://gobernaciondecochabamba.bo/storage/uploads/170657095665b834ccdf986.pdf',
  },
  {
    number: '04',
    label: 'SICOES',
    url: 'https://www.sicoes.gob.bo/',
  },
  {
    number: '05',
    label: 'Contraloría',
    url: 'https://www.contraloria.gob.bo/',
  },
  {
    number: '06',
    label: 'SEDES Cochabamba',
    url: 'https://www.sedescochabamba.gob.bo/',
  },
  {
    number: '07',
    label: 'Dirección Departamental de Educación',
    url: 'https://www.ddecochabamba.gob.bo/',
  },
  {
    number: '08',
    label: 'Portal de trámites del Estado',
    url: 'https://www.gob.bo/',
  },
];

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLogin: form.usuario.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Usuario o contraseña incorrectos.');
      }

      localStorage.setItem('token', data.token);
      const usuario = data.usuario ?? data.user ?? {};
      const userId = data.tecnicoId ?? data.userId ?? data.usuarioId ?? data.id ??
        usuario.tecnicoId ?? usuario.userId ?? usuario.usuarioId ?? usuario.id;
      const supervisorId = data.idSupervisor ?? data.supervisorId ??
        usuario.idSupervisor ?? usuario.supervisorId;
      if (userId !== null && userId !== undefined) {
        localStorage.setItem('userId', String(userId));
      } else {
        localStorage.removeItem('userId');
      }
      if (supervisorId !== null && supervisorId !== undefined) {
        localStorage.setItem('idSupervisor', String(supervisorId));
      } else if ((data.rol || '').trim().toUpperCase() === 'SUPERVISOR' &&
        userId !== null && userId !== undefined) {
        localStorage.setItem('idSupervisor', String(userId));
      } else {
        localStorage.removeItem('idSupervisor');
      }
      localStorage.setItem('userLogin', data.userLogin);
      localStorage.setItem('rol', data.rol || '');
      localStorage.setItem('nombre', data.nombre || '');
      localStorage.setItem('apellido', data.apellido || '');
      localStorage.setItem('primerIngreso', String(Boolean(data.primerIngreso)));
      navigate(data.primerIngreso ? '/registro-usuario' : '/home', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* PANEL IZQUIERDO */}
      <div className="login-side">
        <div className="side-decor-circle circle-top"></div>
        <div className="side-decor-circle circle-bottom"></div>

        <div className="side-content">
          <div className="side-top">
            <div className="side-brand">
              <img
                src="/Imagenes/logoCochabamab.png"
                alt="Logo Gobernación de Cochabamba"
                className="side-logo"
              />
              
            </div>

            <div className="side-divider"></div>

            <div className="side-pill">
              <span className="side-pill-dot"></span>
              UGE · SOPORTE TÉCNICO
            </div>
          </div>

          <div className="side-middle">
            <h1 className="side-title">Sistema de Solicitudes TI</h1>

            <div className="side-shortcuts" aria-label="Accesos rápidos institucionales">
              <p className="side-shortcuts-title">Accesos rápidos</p>
              <div className="side-shortcuts-grid">
                {institutionalLinks.map((link) => (
                  <a
                    key={link.number}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="side-shortcut"
                  >
                    <span className="side-shortcut-number">{link.number}</span>
                    <span className="side-shortcut-label">{link.label}</span>
                    <span className="side-shortcut-action">Abrir</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="login-main">
        <div className="login-card">
          <div className="card-header">
            <img
              src="/Imagenes/LogoBlanco.png"
              alt="Logo UGE"
              className="card-logo"
            />
          </div>

          <h2 className="card-title">Bienvenido</h2>
          <p className="card-subtitle">Inicie sesión con sus credenciales institucionales</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="usuario">Usuario</label>
              <div className="input-wrapper">
                <UserIcon />
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  maxLength={16}
                  placeholder="Usuario"
                  value={form.usuario}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="password">Contraseña</label>
                <a href="#" className="forgot-link">¿Olvidó su contraseña?</a>
              </div>
              <div className="input-wrapper">
                <LockIcon />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  maxLength={30}
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            {error && <p className="login-error" role="alert">{error}</p>}
          </form>
        </div>

        <div className="login-footer">
          <p>© 2025 Gobernación de Cochabamba</p>
          <p>Sistema de Solicitudes TI · Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
