import { useCallback, useEffect, useState } from 'react';
import { FaBullhorn, FaEdit, FaInbox, FaSyncAlt, FaTimes, FaTrash } from 'react-icons/fa';
import { formatDateTime, getValue } from '../../utils/Solicitudesutils';
import './AvisoSupervisor.css';

const API_URL = 'http://localhost:8080/api';
const DESTINATARIOS = ['TECNICO', 'FUNCIONARIO', 'AMBOS'];
const FORM_INICIAL = { mensaje: '', destinatario: 'TECNICO' };

const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    return token;
};

const claseDestinatario = (destinatario) =>
    `aviso-dest-${String(destinatario ?? '').toLowerCase()}`;

const Avisos = () => {
    const [avisos, setAvisos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cambiandoId, setCambiandoId] = useState(null);
    const [eliminandoId, setEliminandoId] = useState(null);

    const [form, setForm] = useState(FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [avisoEditando, setAvisoEditando] = useState(null);
    const [formEdicion, setFormEdicion] = useState(FORM_INICIAL);
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);
    const [errorModal, setErrorModal] = useState('');
    const [avisoEliminando, setAvisoEliminando] = useState(null);
    const [errorForm, setErrorForm] = useState('');
    const [exito, setExito] = useState('');

    const cargar = useCallback(async (signal) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/avisos/todos`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal,
            });

            if (!response.ok) {
                throw new Error(`No se pudieron cargar los avisos (HTTP ${response.status}).`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('La respuesta de avisos tiene un formato inesperado.');
            }
            if (signal?.aborted) return;

            setAvisos(data);
        } catch (requestError) {
            if (signal?.aborted) return;
            setError(requestError.message || 'No se pudieron cargar los avisos.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => cargar(controller.signal), 0);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [cargar]);

    const cambiarEstado = async (aviso) => {
        setError('');
        setCambiandoId(aviso.id);

        try {
            const response = await fetch(
                `${API_URL}/avisos/${aviso.id}/estado?activo=${!aviso.activo}`,
                { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (!response.ok) {
                throw new Error(`No se pudo cambiar el estado del aviso (HTTP ${response.status}).`);
            }

            setAvisos((actuales) =>
                actuales.map((a) => (a.id === aviso.id ? { ...a, activo: !a.activo } : a))
            );
        } catch (requestError) {
            setError(requestError.message || 'No se pudo cambiar el estado del aviso.');
        } finally {
            setCambiandoId(null);
        }
    };

    const eliminarAviso = async (aviso) => {
        setAvisoEliminando(aviso);
        setErrorModal('');
    };

    const confirmarEliminacion = async () => {
        if (!avisoEliminando) return;
        setError('');
        setEliminandoId(avisoEliminando.id);

        try {
            const response = await fetch(`${API_URL}/avisos/${avisoEliminando.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (!response.ok) {
                throw new Error(`No se pudo eliminar el aviso (HTTP ${response.status}).`);
            }

            setAvisos((actuales) => actuales.filter((actual) => actual.id !== avisoEliminando.id));
            setAvisoEliminando(null);
        } catch (requestError) {
            setErrorModal(requestError.message || 'No se pudo eliminar el aviso.');
        } finally {
            setEliminandoId(null);
        }
    };

    const actualizarCampo = (campo) => (event) => {
        setForm((actual) => ({ ...actual, [campo]: event.target.value }));
        setErrorForm('');
        setExito('');
    };

    const editarAviso = (aviso) => {
        setAvisoEditando(aviso);
        setFormEdicion({ mensaje: aviso.mensaje || '', destinatario: aviso.destinatario || 'TECNICO' });
        setErrorModal('');
    };

    const actualizarCampoEdicion = (campo) => (event) => {
        setFormEdicion((actual) => ({ ...actual, [campo]: event.target.value }));
        setErrorModal('');
    };

    const actualizarAviso = async (event) => {
        event.preventDefault();
        const mensaje = formEdicion.mensaje.trim();
        if (!mensaje || !avisoEditando) {
            setErrorModal('El mensaje es obligatorio.');
            return;
        }

        const idSupervisor = Number(localStorage.getItem('idSupervisor') || localStorage.getItem('userId'));
        if (!Number.isInteger(idSupervisor) || idSupervisor <= 0) {
            setErrorModal('No se encontró el ID del supervisor. Cierra sesión e inicia sesión nuevamente.');
            return;
        }

        setGuardandoEdicion(true);
        try {
            const response = await fetch(`${API_URL}/avisos/${avisoEditando.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ idSupervisor, mensaje, destinatario: formEdicion.destinatario }),
            });
            if (!response.ok) throw new Error(`No se pudo actualizar el aviso (HTTP ${response.status}).`);

            const actualizado = await response.json();
            setAvisos((actuales) => actuales.map((aviso) => (aviso.id === actualizado.id ? actualizado : aviso)));
            setAvisoEditando(null);
            setErrorModal('');
            setExito('Aviso actualizado correctamente.');
        } catch (requestError) {
            setErrorModal(requestError.message || 'No se pudo actualizar el aviso.');
        } finally {
            setGuardandoEdicion(false);
        }
    };

    const limpiarFormulario = () => {
        setForm(FORM_INICIAL);
        setErrorForm('');
        setExito('');
    };

    const guardar = async (event) => {
        event.preventDefault();
        setErrorForm('');
        setExito('');

        const mensaje = form.mensaje.trim();
        if (!mensaje) {
            setErrorForm('El mensaje es obligatorio.');
            return;
        }

        const idSupervisor = Number(
            localStorage.getItem('idSupervisor') || localStorage.getItem('userId')
        );
        if (!Number.isInteger(idSupervisor) || idSupervisor <= 0) {
            setErrorForm('No se encontró el ID del supervisor. Cierra sesión e inicia sesión nuevamente.');
            return;
        }

        setGuardando(true);

        try {
            const response = await fetch(`${API_URL}/avisos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ idSupervisor, mensaje, destinatario: form.destinatario }),
            });

            if (!response.ok) {
                throw new Error(`No se pudo guardar el aviso (HTTP ${response.status}).`);
            }

            const guardado = await response.json();
            setAvisos((actuales) => [guardado, ...actuales]);
            setForm(FORM_INICIAL);
            setExito('Aviso creado correctamente.');
        } catch (requestError) {
            setErrorForm(requestError.message || 'No se pudo guardar el aviso.');
        } finally {
            setGuardando(false);
        }
    };

    const sinDatos = !loading && !error && avisos.length === 0;

    return (
        <main className="at-page aviso-page">
            <header className="at-header">
                <span className="at-header-icon" aria-hidden="true">
                    <FaBullhorn />
                </span>
                <div>
                    <h1>Avisos</h1>
                    <p>Publica avisos para técnicos y funcionarios y controla cuáles están activos.</p>
                </div>
            </header>

            {error && (
                <div className="at-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={() => cargar()}>
                        <FaSyncAlt aria-hidden="true" /> Reintentar
                    </button>
                </div>
            )}

            <div className="aviso-layout">
                <section className="aviso-card" aria-label="Avisos recientes" aria-busy={loading}>
                    <h2>Avisos recientes</h2>

                    <div className="aviso-table-scroll">
                        <table className="aviso-table">
                            <thead>
                                <tr>
                                    <th scope="col">Fecha</th>
                                    <th scope="col">Aviso</th>
                                    <th scope="col">Destinatarios</th>
                                    <th scope="col">Activo</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && avisos.length === 0 && Array.from({ length: 4 }, (_, i) => (
                                    <tr key={`skeleton-${i}`} aria-hidden="true">
                                        <td colSpan={5}>
                                            <span className="at-skeleton at-skeleton-line" />
                                        </td>
                                    </tr>
                                ))}

                                {avisos.map((aviso) => (
                                    <tr key={aviso.id} className={aviso.activo ? '' : 'is-inactive'}>
                                        <td className="aviso-cell-date">
                                            {getValue(formatDateTime(aviso.createdAt))}
                                        </td>
                                        <td>{getValue(aviso.mensaje)}</td>
                                        <td>
                                            <span className={`at-badge aviso-badge ${claseDestinatario(aviso.destinatario)}`}>
                                                {getValue(aviso.destinatario)}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={aviso.activo}
                                                aria-label={`${aviso.activo ? 'Desactivar' : 'Activar'} aviso ${aviso.id}`}
                                                className={`aviso-switch ${aviso.activo ? 'is-on' : 'is-off'}`}
                                                onClick={() => cambiarEstado(aviso)}
                                                disabled={cambiandoId === aviso.id || eliminandoId === aviso.id}
                                            />
                                        </td>
                                        <td className="aviso-actions-cell">
                                            <button
                                                type="button"
                                                className="aviso-edit"
                                                aria-label={`Editar aviso ${aviso.id}`}
                                                title="Editar aviso"
                                                onClick={() => editarAviso(aviso)}
                                                disabled={eliminandoId === aviso.id || cambiandoId === aviso.id || guardando}
                                            >
                                                <FaEdit aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                className="aviso-delete"
                                                aria-label={`Eliminar aviso ${aviso.id}`}
                                                title="Eliminar aviso"
                                                onClick={() => eliminarAviso(aviso)}
                                                disabled={eliminandoId === aviso.id || cambiandoId === aviso.id || guardando}
                                            >
                                                <FaTrash aria-hidden="true" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {sinDatos && (
                        <div className="at-empty">
                            <FaInbox aria-hidden="true" />
                            <strong>Aún no hay avisos</strong>
                            <span>Crea el primero con el formulario.</span>
                        </div>
                    )}
                </section>

                <form className="aviso-card aviso-form" onSubmit={guardar} noValidate>
                    <h2>Crear aviso <span className="aviso-required" aria-hidden="true">*</span></h2>

                    <label className="aviso-field" htmlFor="aviso-mensaje">
                        <span>Mensaje <span className="aviso-required" aria-hidden="true">*</span></span>
                        <textarea
                            id="aviso-mensaje"
                            rows={6}
                            value={form.mensaje}
                            onChange={actualizarCampo('mensaje')}
                            aria-invalid={Boolean(errorForm)}
                            required
                        />
                    </label>

                    <fieldset className="aviso-field">
                        <legend>
                            Destinatario <span className="aviso-required" aria-hidden="true">*</span>
                        </legend>
                        {DESTINATARIOS.map((destinatario) => (
                            <label key={destinatario} className="aviso-radio">
                                <input
                                    type="radio"
                                    name="destinatario"
                                    value={destinatario}
                                    checked={form.destinatario === destinatario}
                                    onChange={actualizarCampo('destinatario')}
                                />
                                {destinatario}
                            </label>
                        ))}
                    </fieldset>

                    {errorForm && (
                        <div className="at-error" role="alert">
                            <span>{errorForm}</span>
                            <button type="button" onClick={() => setErrorForm('')} aria-label="Cerrar mensaje">
                                <FaTimes aria-hidden="true" />
                            </button>
                        </div>
                    )}
                    {exito && <p className="aviso-success" role="status">{exito}</p>}

                    <div className="aviso-actions">
                        <button
                            type="button"
                            className="at-btn-outline"
                            onClick={limpiarFormulario}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="aviso-submit" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar aviso'}
                        </button>
                    </div>
                </form>
            </div>

            {avisoEliminando && (
                <div
                    className="aviso-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => event.target === event.currentTarget && !eliminandoId && setAvisoEliminando(null)}
                >
                    <section className="aviso-modal" role="alertdialog" aria-modal="true" aria-labelledby="eliminar-aviso-titulo">
                        <div className="aviso-modal-icon aviso-modal-icon-danger"><FaTrash aria-hidden="true" /></div>
                        <h2 id="eliminar-aviso-titulo">¿Eliminar aviso?</h2>
                        <p>Esta acción eliminará el aviso seleccionado y no se podrá deshacer.</p>
                        {errorModal && <p className="aviso-modal-error" role="alert">{errorModal}</p>}
                        <div className="aviso-modal-actions">
                            <button type="button" className="aviso-modal-btn aviso-modal-cancel" onClick={() => setAvisoEliminando(null)} disabled={Boolean(eliminandoId)}>
                                Cancelar
                            </button>
                            <button type="button" className="aviso-modal-btn aviso-modal-danger" onClick={confirmarEliminacion} disabled={Boolean(eliminandoId)}>
                                {eliminandoId ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {avisoEditando && (
                <div
                    className="aviso-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => event.target === event.currentTarget && !guardandoEdicion && setAvisoEditando(null)}
                >
                    <form className="aviso-modal aviso-edit-modal" onSubmit={actualizarAviso} noValidate>
                        <button type="button" className="aviso-modal-close" aria-label="Cerrar edición" onClick={() => setAvisoEditando(null)} disabled={guardandoEdicion}>
                            <FaTimes aria-hidden="true" />
                        </button>
                        <div className="aviso-modal-icon aviso-modal-icon-edit"><FaEdit aria-hidden="true" /></div>
                        <h2 id="editar-aviso-titulo">Editar aviso</h2>
                        <p>Actualiza el mensaje y el público que recibirá este aviso.</p>

                        <label className="aviso-modal-field" htmlFor="editar-aviso-mensaje">Mensaje
                            <textarea id="editar-aviso-mensaje" value={formEdicion.mensaje} onChange={actualizarCampoEdicion('mensaje')} rows={5} disabled={guardandoEdicion} autoFocus />
                        </label>
                        <fieldset className="aviso-modal-field">
                            <legend>Destinatario</legend>
                            {DESTINATARIOS.map((destinatario) => (
                                <label key={destinatario} className="aviso-radio">
                                    <input type="radio" name="editar-destinatario" value={destinatario} checked={formEdicion.destinatario === destinatario} onChange={actualizarCampoEdicion('destinatario')} disabled={guardandoEdicion} />
                                    {destinatario}
                                </label>
                            ))}
                        </fieldset>
                        {errorModal && <p className="aviso-modal-error" role="alert">{errorModal}</p>}
                        <div className="aviso-modal-actions">
                            <button type="button" className="aviso-modal-btn aviso-modal-cancel" onClick={() => setAvisoEditando(null)} disabled={guardandoEdicion}>Cancelar</button>
                            <button type="submit" className="aviso-modal-btn aviso-modal-primary" disabled={guardandoEdicion}>
                                {guardandoEdicion ? 'Actualizando...' : 'Actualizar aviso'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
};

export default Avisos;
