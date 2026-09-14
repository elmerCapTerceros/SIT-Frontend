import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Components/Login/Login.css';
import './RegistroDeUsuario.css';

const API_URL = 'http://localhost:8080/api';

const RegistroDeUsuario = () => {
  const navigate = useNavigate();
  const userLogin = localStorage.getItem('userLogin') || '';
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    password: '',
    confirmarPassword: '',
    cargo: '',
    telefono: '',
    area: '',
    ubicacionOficina: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((currentForm) => ({ ...currentForm, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/usuarios/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          password: form.password,
          cargo: form.cargo.trim(),
          telefono: form.telefono.trim(),
          area: form.area.trim(),
          ubicacionOficina: form.ubicacionOficina.trim(),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo guardar el registro.');
      }

      localStorage.removeItem('primerIngreso');
      navigate('/home', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page registro-page">
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
            <h1 className="side-title">Complete su perfil institucional</h1>
            <p className="side-subtitle">
              Estos datos permitirán identificar sus solicitudes y dirigirlas al área correspondiente.
            </p>
            <div className="side-badges">
              <div className="side-badge">Acceso personalizado</div>
              <div className="side-badge">Información protegida</div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-main registro-main">
        <div className="login-card registro-card">
          <div className="card-header">
            <img src="/Imagenes/LogoBlanco.png" alt="Logo UGE" className="card-logo" />
          </div>
          <h2 className="card-title">Registro de usuario</h2>
          <p className="card-subtitle">Complete sus datos para ingresar al sistema</p>

          <form className="registro-form" onSubmit={handleSubmit}>
            <div className="registro-grid">
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} required maxLength="100" />
              </div>
              <div className="form-group">
                <label htmlFor="apellido">Apellido</label>
                <input id="apellido" name="apellido" type="text" value={form.apellido} onChange={handleChange} required maxLength="100" />
              </div>
              <div className="form-group registro-full-width">
                <label htmlFor="userLogin">Usuario</label>
                <input id="userLogin" name="userLogin" type="text" value={userLogin} readOnly aria-readonly="true" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Nueva contraseña</label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength="8" maxLength="100" />
              </div>
              <div className="form-group">
                <label htmlFor="confirmarPassword">Confirmar contraseña</label>
                <input id="confirmarPassword" name="confirmarPassword" type="password" value={form.confirmarPassword} onChange={handleChange} required minLength="8" maxLength="100" />
              </div>
              <div className="form-group">
                <label htmlFor="cargo">Cargo</label>
                <input id="cargo" name="cargo" type="text" value={form.cargo} onChange={handleChange} required maxLength="20" />
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input id="telefono" name="telefono" type="tel" inputMode="numeric" pattern="[0-9]{7,8}" value={form.telefono} onChange={handleChange} required maxLength="8" />
              </div>
              <div className="form-group">
                <label htmlFor="area">Área</label>
                <input id="area" name="area" type="text" value={form.area} onChange={handleChange} required maxLength="40" />
              </div>
              <div className="form-group">
                <label htmlFor="ubicacionOficina">Ubicación de su oficina</label>
                <input id="ubicacionOficina" name="ubicacionOficina" type="text" value={form.ubicacionOficina} onChange={handleChange} required maxLength="40" />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar registro'}
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

export default RegistroDeUsuario;
