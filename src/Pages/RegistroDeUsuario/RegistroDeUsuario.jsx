import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Components/Login/Login.css';
import '../../Components/Modlas/Modlas.css';
import Modlas from '../../Components/Modlas/Modlas';
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const uppercaseFields = ['nombre', 'apellido', 'cargo', 'area', 'ubicacionOficina'];

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = uppercaseFields.includes(name) ? value.toLocaleUpperCase('es-BO') : value;
    setForm((currentForm) => ({ ...currentForm, [name]: nextValue }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: '' }));
    setError('');
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = {
      nombre: 'Ingrese su nombre.',
      apellido: 'Ingrese su apellido.',
      password: 'Ingrese una contraseña.',
      confirmarPassword: 'Confirme su contraseña.',
      cargo: 'Ingrese su cargo.',
      telefono: 'Ingrese su teléfono.',
      area: 'Ingrese su área.',
      ubicacionOficina: 'Ingrese la ubicación de su oficina.',
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!form[field].trim()) errors[field] = message;
    });
    if (form.password && form.password.length !== 8) {
      errors.password = 'La contraseña debe tener exactamente 8 caracteres.';
    }
    if (form.confirmarPassword && form.password !== form.confirmarPassword) {
      errors.confirmarPassword = 'Las contraseñas no coinciden.';
    }
    if (form.telefono && !/^\d{8}$/.test(form.telefono)) {
      errors.telefono = 'El teléfono debe tener exactamente 8 dígitos.';
    }

    const maxLengthFields = {
      nombre: 'El nombre no puede superar los 20 caracteres.',
      apellido: 'El apellido no puede superar los 20 caracteres.',
      cargo: 'El cargo no puede superar los 20 caracteres.',
      area: 'El área no puede superar los 20 caracteres.',
      ubicacionOficina: 'La ubicación de oficina no puede superar los 20 caracteres.',
    };
    Object.entries(maxLengthFields).forEach(([field, message]) => {
      if (form[field].trim().length > 20) errors[field] = message;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      setError('Revise los campos marcados antes de continuar.');
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

      localStorage.setItem('nombre', data.nombre || form.nombre);
      localStorage.setItem('apellido', data.apellido || form.apellido);
      localStorage.removeItem('primerIngreso');
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (name) => ({
    'aria-invalid': Boolean(fieldErrors[name]),
    title: fieldErrors[name] || '',
    className: fieldErrors[name] ? 'input-invalid' : '',
  });

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

          <form className="registro-form" onSubmit={handleSubmit} noValidate>
            <div className="registro-grid">
              <div className="form-group">
                <label htmlFor="nombre">Nombre <span className="required-mark">*</span></label>
                <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} maxLength="100" {...inputProps('nombre')} />
                {fieldErrors.nombre && <span className="field-error">{fieldErrors.nombre}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="apellido">Apellido <span className="required-mark">*</span></label>
                <input id="apellido" name="apellido" type="text" value={form.apellido} onChange={handleChange} maxLength="100" {...inputProps('apellido')} />
                {fieldErrors.apellido && <span className="field-error">{fieldErrors.apellido}</span>}
              </div>
              <div className="form-group registro-full-width">
                <label htmlFor="userLogin">Usuario</label>
                <input id="userLogin" name="userLogin" type="text" value={userLogin} readOnly aria-readonly="true" />
              </div>
              <div className="form-group">
                <label htmlFor="password">Nueva contraseña <span className="required-mark">*</span></label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} minLength="8" maxLength="100" {...inputProps('password')} />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="confirmarPassword">Confirmar contraseña <span className="required-mark">*</span></label>
                <input id="confirmarPassword" name="confirmarPassword" type="password" value={form.confirmarPassword} onChange={handleChange} minLength="8" maxLength="100" {...inputProps('confirmarPassword')} />
                {fieldErrors.confirmarPassword && <span className="field-error">{fieldErrors.confirmarPassword}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="cargo">Cargo <span className="required-mark">*</span></label>
                <input id="cargo" name="cargo" type="text" value={form.cargo} onChange={handleChange} maxLength="20" {...inputProps('cargo')} />
                {fieldErrors.cargo && <span className="field-error">{fieldErrors.cargo}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono <span className="required-mark">*</span></label>
                <input id="telefono" name="telefono" type="tel" inputMode="numeric" value={form.telefono} onChange={handleChange} maxLength="8" {...inputProps('telefono')} />
                {fieldErrors.telefono && <span className="field-error">{fieldErrors.telefono}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="area">Área <span className="required-mark">*</span></label>
                <input id="area" name="area" type="text" value={form.area} onChange={handleChange} maxLength="40" {...inputProps('area')} />
                {fieldErrors.area && <span className="field-error">{fieldErrors.area}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="ubicacionOficina">Ubicación de su oficina <span className="required-mark">*</span></label>
                <input id="ubicacionOficina" name="ubicacionOficina" type="text" value={form.ubicacionOficina} onChange={handleChange} maxLength="40" {...inputProps('ubicacionOficina')} />
                {fieldErrors.ubicacionOficina && <span className="field-error">{fieldErrors.ubicacionOficina}</span>}
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
      <Modlas
        open={success}
        title="Registro completado"
        message="Sus datos fueron guardados correctamente. Ya puede ingresar al sistema."
        buttonLabel="Ir al inicio"
        onClose={() => navigate('/home', { replace: true })}
      />
    </div>
  );
};

export default RegistroDeUsuario;
