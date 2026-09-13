import { useState } from "react";
import "./NuevaSolicitud.css";

const NuevaSolicitud = () => {
  const [form, setForm] = useState({
    titulo: "",
    tipoEquipo: "PC",
    descripcion: "",
  });

  const [errores, setErrores] = useState({});
  const [enviada, setEnviada] = useState(false);

  const TIPOS_EQUIPO = ["PC", "Laptop", "Impresora", "Otros"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: undefined }));
    setEnviada(false);
  };

  const handleSubmit = (e) => {
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

    if (form.descripcion.trim()) {
      if (form.descripcion.trim().length < 10) {
        nuevosErrores.descripcion =
          "La descripción debe tener al menos 10 caracteres.";
      }
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length === 0) {
      setForm({ titulo: "", tipoEquipo: "PC", descripcion: "" });
      setEnviada(true);
    }
  };

  const handleCancelar = () => {
    setForm({ titulo: "", tipoEquipo: "PC", descripcion: "" });
    setErrores({});
    setEnviada(false);
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
        <h1 className="form-heading">Nueva Solicitud Técnica</h1>
        <p className="form-subheading">
          Registre una nueva solicitud de soporte técnico para su equipo o
          departamento.
        </p>

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

          {enviada && (
            <div className="success-msg">
              Su solicitud fue enviada correctamente.
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancelar}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-submit">
              Enviar Solicitud
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NuevaSolicitud;