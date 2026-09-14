import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:8080/api';

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

const CheckBadgeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="badge-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25 4.5-4.5m4.5 2.25a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="badge-icon">
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 1.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="badge-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 3v5.25c0 4.5-3.15 8.4-7.5 9.75-4.35-1.35-7.5-5.25-7.5-9.75V6L12 3z" />
  </svg>
);

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
      localStorage.setItem('userLogin', data.userLogin);
      localStorage.setItem('rol', data.rol || '');
      navigate('/home', { replace: true });
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
            <p className="side-subtitle">
              Plataforma centralizada de gestión de solicitudes y soporte técnico para
              funcionarios de la Gobernación.
            </p>

            <div className="side-badges">
              <div className="side-badge">
                <CheckBadgeIcon />
                Registro de incidencias
              </div>
              <div className="side-badge">
                <ClockIcon />
                Seguimiento en tiempo real
              </div>
              <div className="side-badge">
                <ShieldIcon />
                Acceso seguro institucional
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
