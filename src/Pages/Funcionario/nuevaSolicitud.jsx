import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NuevaSolicitud.css";
import Modlas from "../../Components/Modlas/Modlas";

const API_URL = "http://localhost:8080/api";

const NuevaSolicitud = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: "",
    tipoEquipo: "PC",
    descripcion: "",
  });

  const [errores, setErrores] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const [enviando, setEnviando] = useState(false);

  const TIPOS_EQUIPO = ["PC", "Laptop", "Impresora", "Otros"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: undefined }));
    setErrorApi("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevosErrores = {};

    if (!form.titulo.trim()) {
      nuevosErrores.titulo = "El título de la solicitud es obligatorio.";
    } else if (form.titulo.trim().length < 5) {
      nuevosErrores.titulo = "El título debe tener al menos 5 caracteres.";
    }

    if (!form.tipoEquipo) {
      nuevosErrores.tipoEquipo = "Debe seleccionar un tipo de equipo.";
    }

    if (!form.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria.";
    } else if (form.descripcion.trim().length < 10) {
      nuevosErrores.descripcion =
        "La descripción debe tener al menos 10 caracteres.";
    }

    setErrores(nuevosErrores);
    setErrorApi("");

    if (Object.keys(nuevosErrores).length === 0) {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorApi("Su sesión no está activa. Inicie sesión para enviar la solicitud.");
        return;
      }

      setEnviando(true);

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

        setForm({ titulo: "", tipoEquipo: "PC", descripcion: "" });
        setErrores({});
        setModalAbierto(true);
      } catch (error) {
        setErrorApi(error.message || "Ocurrió un error al enviar la solicitud.");
      } finally {
        setEnviando(false);
      }
    }
  };

  const handleCancelar = () => {
    setForm({ titulo: "", tipoEquipo: "PC", descripcion: "" });
    setErrores({});
    setErrorApi("");
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
            <p className="page-kicker">SOLICITUD</p>
            <h1>Nueva Solicitud Técnica</h1>
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
              value={form.descripcion}
              onChange={handleChange}
            />
            {errores.descripcion ? (
              <span className="error-msg">{errores.descripcion}</span>
            ) : (
              <span className="hint-msg">
                Describa los síntomas y pasos para replicar el problema
              </span>
            )}
          </div>

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

      <Modlas open={modalAbierto} onClose={() => navigate('/mis-solicitudes')} />
    </div>
  );
};

export default NuevaSolicitud;
