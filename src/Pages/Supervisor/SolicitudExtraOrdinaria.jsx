import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SolicitudExtraOrdinaria.css";
import Modlas from "../../Components/Modlas/Modlas";
import {
  limpiarTituloSolicitud,
  TITULO_SOLO_LETRAS_Y_ESPACIOS,
} from "../../utils/validacionesSolicitud";

const API_URL = "http://localhost:8080/api";
const INITIAL_FORM = { titulo: "", tipoEquipo: "PC", descripcion: "", prioridad: "", tecnicoId: "" };

const SolicitudExtraOrdinaria = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);

  const [errores, setErrores] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cancelModalAbierto, setCancelModalAbierto] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tecnicos, setTecnicos] = useState([]);
  const esSupervisor = (localStorage.getItem("rol") || "").trim().toUpperCase() === "SUPERVISOR";

  useEffect(() => {
    if (!esSupervisor) return;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/usuarios/tecnicos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar la lista de técnicos.");
        return response.json();
      })
      .then((data) => setTecnicos(Array.isArray(data) ? data : []))
      .catch((error) => setErrorApi(error.message));
  }, [esSupervisor]);

  const TIPOS_EQUIPO = ["PC", "Laptop", "Impresora", "Otros"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "titulo"
      ? limpiarTituloSolicitud(value)
      : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrores((prev) => ({ ...prev, [name]: undefined }));
    setErrorApi("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = {};

    if (!form.titulo.trim()) {
      nuevosErrores.titulo = "El título de la solicitud es obligatorio.";
    } else if (!TITULO_SOLO_LETRAS_Y_ESPACIOS.test(form.titulo.trim())) {
      nuevosErrores.titulo = "El título solo puede contener letras y espacios.";
    } else if (form.titulo.trim().length < 5 || form.titulo.trim().length > 200) {
      nuevosErrores.titulo = "El título debe tener entre 5 y 200 caracteres.";
    }

    if (!form.tipoEquipo) {
      nuevosErrores.tipoEquipo = "Debe seleccionar un tipo de equipo.";
    }

    if (form.descripcion.trim().length > 500) {
      nuevosErrores.descripcion =
        "La descripción no puede superar los 500 caracteres.";
    }

    if (esSupervisor && !form.prioridad) nuevosErrores.prioridad = "Debe seleccionar una prioridad.";
    if (esSupervisor && !form.tecnicoId) nuevosErrores.tecnicoId = "Debe asignar un técnico.";

    setErrores(nuevosErrores);
    setErrorApi("");

    if (Object.keys(nuevosErrores).length === 0) {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorApi("Su sesión no está activa. Inicie sesión para enviar la solicitud.");
        return;
      }

      setEnviando(true);

      let solicitudRegistrada = false;
      try {
        const response = await fetch(`${API_URL}/solicitudes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titulo: form.titulo.trim(),
            tipo: form.tipoEquipo,
            descripcion: form.descripcion.trim(),
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "No se pudo registrar la solicitud.");
        }

        if (esSupervisor) {
          const solicitudCreada = await response.json();
          solicitudRegistrada = true;
          const asignacionResponse = await fetch(`${API_URL}/solicitudes/${solicitudCreada.id}/asignacion`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ prioridad: form.prioridad.toUpperCase(), tecnicoId: Number(form.tecnicoId) }),
          });
          if (!asignacionResponse.ok) {
            throw new Error("La solicitud se creó, pero no se pudo asignar. Puedes completar la asignación desde Solicitudes.");
          }
        }

        setForm(INITIAL_FORM);
        setErrores({});
        setModalAbierto(true);
      } catch (error) {
        if (solicitudRegistrada) setForm(INITIAL_FORM);
        setErrorApi(error.message || "Ocurrió un error al enviar la solicitud.");
      } finally {
        setEnviando(false);
      }
    }
  };

  const handleCancelar = () => {
    setCancelModalAbierto(true);
  };

  const confirmarCancelar = () => {
    setForm(INITIAL_FORM);
    setErrores({});
    setErrorApi("");
    setModalAbierto(false);
    setCancelModalAbierto(false);
    navigate('/home', { replace: true });
  };

  return (
    <div className="solicitud-container">
      <aside className="solicitud-left">
        <div className="logo-box">
         
        <img src="/Imagenes/Logo4.png" alt="Logo" className="logo-pic" />
          <div className="logo-divider" />
          <div className="logo-text">
            <span className="logo-title logo-title-dark">
              UNIDAD DE <br /> GOBIERNO
            </span>
            <span className="logo-title logo-title-cyan">ELECTRÓNICO</span>
          </div>
        </div>

        <div className="tiempos-card">
          <h3 className="tiempos-title">Tiempos estimados de respuesta</h3>
          <p className="tiempos-item">Prioridad Alta - 4 horas hábiles</p>
          <p className="tiempos-item">Prioridad Media - 24 horas hábiles</p>
          <p className="tiempos-item">Prioridad Baja - 48 horas hábiles</p>
        </div>
      </aside>

      <main className="solicitud-right">
        <section className="requests-header">
          <div>
            <p className="page-kicker">SOLICITUD EXTRAORDINARIA</p>
            <h1>Nueva Solicitud Extraordinaria</h1>
            <p>Registre una nueva solicitud de soporte técnico para su equipo o departamento.</p>
          </div>
        </section>

        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="titulo">
              Título de la solicitud <span className="required">*</span>
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              className={`form-input ${errores.titulo ? "input-error" : ""}`}
              placeholder="Ej. Error de conexión a la impresora de red"
              value={form.titulo}
              onChange={handleChange}
              pattern="[A-Za-zÀ-ÿ ]+"
              minLength={5}
              maxLength={200}
            />
            {errores.titulo ? (
              <span className="error-msg">{errores.titulo}</span>
            ) : (
              <span className="hint-msg">
                Use un título descriptivo y conciso
              </span>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="tipoEquipo">
              Tipo de equipo <span className="required">*</span>
            </label>
            <select
              id="tipoEquipo"
              name="tipoEquipo"
              className={`form-input ${errores.tipoEquipo ? "input-error" : ""}`}
              value={form.tipoEquipo}
              onChange={handleChange}
            >
              {TIPOS_EQUIPO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            {errores.tipoEquipo && (
              <span className="error-msg">{errores.tipoEquipo}</span>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="descripcion">
              Descripción detallada
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className={`form-input form-textarea ${errores.descripcion ? "input-error" : ""}`}
              placeholder="Ej. Al intentar enviar un documento a imprimir en la unidad del piso 3, el programa se congela y muestra un código de error 0x8821..."
              rows={4}
              maxLength={500}
              value={form.descripcion}
              onChange={handleChange}
            />
            {errores.descripcion ? (
              <span className="error-msg">{errores.descripcion}</span>
            ) : (
              <span className="hint-msg">
                Opcional. Máximo 500 caracteres.
              </span>
            )}
          </div>

          {esSupervisor && (
            <section className="supervisor-assignment" aria-labelledby="supervisor-assignment-title">
              <h2 id="supervisor-assignment-title">Asignación de supervisión</h2>
              <p>Asigna un técnico y define la prioridad al registrar esta solicitud.</p>
              <div className="form-field">
                <label className="form-label" htmlFor="prioridad">Prioridad <span className="required">*</span></label>
                <select id="prioridad" name="prioridad" className={`form-input ${errores.prioridad ? "input-error" : ""}`} value={form.prioridad} onChange={handleChange}>
                  <option value="">Seleccione prioridad</option>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </select>
                {errores.prioridad && <span className="error-msg">{errores.prioridad}</span>}
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="tecnicoId">Técnico asignado <span className="required">*</span></label>
                <select id="tecnicoId" name="tecnicoId" className={`form-input ${errores.tecnicoId ? "input-error" : ""}`} value={form.tecnicoId} onChange={handleChange}>
                  <option value="">Seleccione técnico</option>
                  {tecnicos.map((tecnico) => <option key={tecnico.id} value={tecnico.id}>{[tecnico.nombre, tecnico.apellido].filter(Boolean).join(" ")}</option>)}
                </select>
                {errores.tecnicoId && <span className="error-msg">{errores.tecnicoId}</span>}
                {tecnicos.length === 0 && <span className="hint-msg">No hay técnicos disponibles para asignar.</span>}
              </div>
            </section>
          )}

          {errorApi && <div className="error-msg api-error">{errorApi}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancelar}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </main>

      {cancelModalAbierto && (
        <div className="cancel-modal-backdrop" role="presentation" onMouseDown={() => setCancelModalAbierto(false)}>
          <div
            className="cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cancel-modal-icon" aria-hidden="true">!</div>
            <h2 id="cancel-modal-title">Cancelar solicitud</h2>
            <p>Si sales ahora, se perderán los datos ingresados y no se enviará ninguna solicitud.</p>
            <div className="cancel-modal-actions">
              <button type="button" className="btn btn-secondary-modal" onClick={() => setCancelModalAbierto(false)}>
                Seguir editando
              </button>
              <button type="button" className="btn btn-danger-modal" onClick={confirmarCancelar}>
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}

      <Modlas open={modalAbierto} onClose={() => navigate('/mis-solicitudes')} />
    </div>
  );
};

export default SolicitudExtraOrdinaria;
