import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FaBarcode,
    FaBuilding,
    FaChartBar,
    FaCheckCircle,
    FaClipboardList,
    FaFilePdf,
    FaInbox,
    FaLaptop,
    FaRegCalendarAlt,
    FaSearch,
    FaSort,
    FaSortDown,
    FaSortUp,
    FaSyncAlt,
    FaTimes,
    FaTools,
    FaUser,
} from 'react-icons/fa';
import {
    formatDateTime,
    formatId,
    getValue,
    humanize,
    normalize,
    toSearchText,
} from '../../utils/Solicitudesutils';
import { generarReportePdf } from '../../utils/Reportetrabajopdf';
import './ReporteSupervisor.css';

const API_URL = 'http://localhost:8080/api';
const PAGE_SIZES = [8, 15, 25, 50];

const claseEstado = (estado) => {
    const estadoNormalizado = normalize(estado);
    if (estadoNormalizado === 'solucionado') return 'report-final-solucionado';
    if (estadoNormalizado === 'parcial') return 'report-final-parcial';
    if (
        estadoNormalizado === 'pendiente' ||
        estadoNormalizado === 'requiere-repuesto' ||
        estadoNormalizado === 'servicio-externo'
    ) {
        return 'report-final-pendiente';
    }
    return 'report-final-default';
};

const nombreEquipo = (reporte) =>
    reporte.tipoEquipo === 'OTRO'
        ? getValue(reporte.tipoEquipoOtro)
        : getValue(humanize(reporte.tipoEquipo));

const timestamp = (value) => Date.parse(value) || 0;

const SORT_VALUES = {
    id: (r) => Number(r.id) || 0,
    solicitud: (r) => String(r.codigoSolicitud ?? ''),
    equipo: (r) => nombreEquipo(r),
    unidad: (r) => String(r.unidad ?? ''),
    tecnico: (r) => String(r.tecnicoNombre ?? ''),
    estado: (r) => String(r.estadoFinal ?? ''),
    fecha: (r) => timestamp(r.fechaAtencion) || timestamp(r.createdAt),
};

const COLUMNAS = [
    { key: 'id', label: 'Reporte' },
    { key: 'solicitud', label: 'Solicitud' },
    { key: 'equipo', label: 'Equipo' },
    { key: 'unidad', label: 'Unidad' },
    { key: 'tecnico', label: 'Técnico' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
];

const paginasVisibles = (actual, total) => {
    const maximo = 5;
    let inicio = Math.max(1, actual - Math.floor(maximo / 2));
    const fin = Math.min(total, inicio + maximo - 1);
    inicio = Math.max(1, fin - maximo + 1);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
};

const Reportes = () => {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [errorPdf, setErrorPdf] = useState('');
    const [descargandoId, setDescargandoId] = useState(null);
    const [seleccionadoId, setSeleccionadoId] = useState(null);

    const [query, setQuery] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroEquipo, setFiltroEquipo] = useState('');
    const [filtroTecnico, setFiltroTecnico] = useState('');
    const [orden, setOrden] = useState({ key: 'fecha', dir: 'desc' });
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(PAGE_SIZES[0]);

    const closeButtonRef = useRef(null);
    const lastTriggerRef = useRef(null);

    const cargarReportes = useCallback(async (signal) => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
        }

        const response = await fetch(`${API_URL}/reportes`, {
            headers: { Authorization: `Bearer ${token}` },
            signal,
        });

        if (!response.ok) {
            throw new Error(`No se pudieron cargar los reportes (HTTP ${response.status}).`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('La respuesta de reportes tiene un formato inesperado.');
        }
        if (signal?.aborted) return;

        setReportes(data);
    }, []);

    const cargar = useCallback(async (signal) => {
        setLoading(true);
        setError('');

        try {
            await cargarReportes(signal);
        } catch (requestError) {
            if (signal?.aborted) return;
            setError(requestError.message || 'No se pudieron cargar los reportes de los técnicos.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [cargarReportes]);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => cargar(controller.signal), 0);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [cargar]);

    // Opciones de los filtros, calculadas con los datos reales.
    const opciones = useMemo(() => {
        const unicos = (valores) =>
            [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

        return {
            estados: unicos(reportes.map((r) => r.estadoFinal)),
            equipos: unicos(reportes.map((r) => nombreEquipo(r)).filter((n) => n !== getValue(''))),
            tecnicos: unicos(reportes.map((r) => r.tecnicoNombre)),
        };
    }, [reportes]);

    const filtrados = useMemo(() => {
        const text = toSearchText(query.trim());

        const lista = reportes.filter((reporte) => {
            if (filtroEstado && reporte.estadoFinal !== filtroEstado) return false;
            if (filtroEquipo && nombreEquipo(reporte) !== filtroEquipo) return false;
            if (filtroTecnico && reporte.tecnicoNombre !== filtroTecnico) return false;
            if (!text) return true;

            return toSearchText([
                reporte.id,
                reporte.codigoSolicitud,
                reporte.tipoEquipo,
                reporte.tipoEquipoOtro,
                reporte.unidad,
                reporte.solicitante,
                reporte.numeroInventario,
                reporte.problema,
                reporte.diagnostico,
                reporte.trabajoRealizado,
                reporte.estadoFinal,
                reporte.observacion,
                reporte.tecnicoNombre,
                reporte.funcionarioNombre,
                reporte.numeroFormulario,
            ].join(' ')).includes(text);
        });

        const valor = SORT_VALUES[orden.key];
        const factor = orden.dir === 'asc' ? 1 : -1;

        return [...lista].sort((a, b) => {
            const va = valor(a);
            const vb = valor(b);
            const cmp = typeof va === 'number' && typeof vb === 'number'
                ? va - vb
                : String(va).localeCompare(String(vb), 'es', { numeric: true });

            return cmp * factor || timestamp(b.createdAt) - timestamp(a.createdAt);
        });
    }, [reportes, query, filtroEstado, filtroEquipo, filtroTecnico, orden]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * porPagina;
    const visibles = filtrados.slice(inicio, inicio + porPagina);

    const hayFiltros = Boolean(query || filtroEstado || filtroEquipo || filtroTecnico);

    const limpiarFiltros = () => {
        setQuery('');
        setFiltroEstado('');
        setFiltroEquipo('');
        setFiltroTecnico('');
        setPagina(1);
    };

    const conReinicio = (setter) => (event) => {
        setter(event.target.value);
        setPagina(1);
    };

    const ordenarPor = (key) => {
        setOrden((actual) =>
            actual.key === key
                ? { key, dir: actual.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: key === 'fecha' || key === 'id' ? 'desc' : 'asc' }
        );
        setPagina(1);
    };

    const seleccionado = useMemo(
        () => reportes.find((reporte) => reporte.id === seleccionadoId) ?? null,
        [reportes, seleccionadoId]
    );

    const abrirDetalle = (reporte, event) => {
        lastTriggerRef.current = event.currentTarget;
        setSeleccionadoId(reporte.id);
    };

    const cerrarDetalle = useCallback(() => {
        setSeleccionadoId(null);
        lastTriggerRef.current?.focus?.();
    }, []);

    // Modal: Escape para cerrar, bloquear scroll del fondo y enfocar el botón cerrar.
    useEffect(() => {
        if (!seleccionado) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') cerrarDetalle();
        };
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [seleccionado, cerrarDetalle]);

    const descargarPdf = async (reporte) => {
        setErrorPdf('');
        setDescargandoId(reporte.id);

        try {
            await generarReportePdf({
                numeroFormulario: reporte.numeroFormulario ?? '',
                fecha: reporte.fechaAtencion ?? '',
                hora: reporte.horaAtencion?.slice(0, 5) ?? '',
                unidad: reporte.unidad ?? '',
                solicitante: reporte.solicitante ?? '',
                tipoEquipo: reporte.tipoEquipo ?? '',
                tipoEquipoOtro: reporte.tipoEquipoOtro ?? '',
                inventario: reporte.numeroInventario ?? '',
                problema: reporte.problema ?? '',
                diagnostico: reporte.diagnostico ?? '',
                trabajo: reporte.trabajoRealizado ?? '',
                estadoFinal: reporte.estadoFinal ?? '',
                observaciones: reporte.observacion ?? '',
                tecnicoNombre: reporte.tecnicoNombre ?? '',
                funcionarioNombre: reporte.funcionarioNombre ?? '',
            });
        } catch (pdfError) {
            console.error(pdfError);
            setErrorPdf(`No se pudo generar el PDF del reporte #${reporte.id}. Intenta de nuevo.`);
        } finally {
            setDescargandoId(null);
        }
    };

    const iconoOrden = (key) => {
        if (orden.key !== key) return <FaSort aria-hidden="true" />;
        return orden.dir === 'asc'
            ? <FaSortUp aria-hidden="true" className="is-active" />
            : <FaSortDown aria-hidden="true" className="is-active" />;
    };

    const textoVerificacion = (valor) => {
    if (valor === true) return 'Sí';
    if (valor === false) return 'No';
    return '-'; // null o undefined
    };


    const sinDatos = !loading && !error && filtrados.length === 0;

    return (
        <main className="at-page report-page">
            <header className="at-header report-main-header">
                <span className="at-header-icon" aria-hidden="true">
                    <FaChartBar />
                </span>
                <div className="report-header-copy">
                    <h1>Reportes de técnicos</h1>
                    <p>Consulta las atenciones registradas por los técnicos y descarga sus informes.</p>
                </div>
                <button
                    type="button"
                    className={`at-refresh report-header-refresh${loading ? ' is-spinning' : ''}`}
                    onClick={() => cargar()}
                    disabled={loading}
                >
                    <FaSyncAlt aria-hidden="true" />
                    <span>Actualizar</span>
                </button>
            </header>

            <section className="report-tools" aria-label="Buscar y filtrar reportes">
                <div className="at-toolbar report-toolbar">
                    <div className="at-search">
                        <FaSearch aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={conReinicio(setQuery)}
                            placeholder="Buscar por solicitud, inventario, solicitante..."
                            aria-label="Buscar en los reportes de técnicos"
                        />
                        {query && (
                            <button
                                type="button"
                                className="at-search-clear"
                                onClick={() => { setQuery(''); setPagina(1); }}
                                aria-label="Borrar búsqueda"
                            >
                                <FaTimes aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <label className="report-filter">
                        <span>Estado</span>
                        <select value={filtroEstado} onChange={conReinicio(setFiltroEstado)}>
                            <option value="">Todos</option>
                            {opciones.estados.map((estado) => (
                                <option key={estado} value={estado}>{humanize(estado)}</option>
                            ))}
                        </select>
                    </label>

                    <label className="report-filter">
                        <span>Equipo</span>
                        <select value={filtroEquipo} onChange={conReinicio(setFiltroEquipo)}>
                            <option value="">Todos</option>
                            {opciones.equipos.map((equipo) => (
                                <option key={equipo} value={equipo}>{equipo}</option>
                            ))}
                        </select>
                    </label>

                    <label className="report-filter">
                        <span>Técnico</span>
                        <select value={filtroTecnico} onChange={conReinicio(setFiltroTecnico)}>
                            <option value="">Todos</option>
                            {opciones.tecnicos.map((tecnico) => (
                                <option key={tecnico} value={tecnico}>{tecnico}</option>
                            ))}
                        </select>
                    </label>

                    {hayFiltros && (
                        <button type="button" className="report-clear-filters" onClick={limpiarFiltros}>
                            <FaTimes aria-hidden="true" /> Limpiar
                        </button>
                    )}
                </div>
            </section>

            {error && (
                <div className="at-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={() => cargar()}>
                        <FaSyncAlt aria-hidden="true" /> Reintentar
                    </button>
                </div>
            )}

            {errorPdf && (
                <div className="at-error report-pdf-error" role="alert">
                    <span>{errorPdf}</span>
                    <button type="button" onClick={() => setErrorPdf('')} aria-label="Cerrar mensaje">
                        <FaTimes aria-hidden="true" /> Cerrar
                    </button>
                </div>
            )}

            {!error && (
                <section className="report-table-card" aria-label="Reportes de atención de técnicos" aria-busy={loading}>
                    <div className="report-table-scroll">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    {COLUMNAS.map(({ key, label }) => (
                                        <th
                                            key={key}
                                            scope="col"
                                            aria-sort={
                                                orden.key === key
                                                    ? (orden.dir === 'asc' ? 'ascending' : 'descending')
                                                    : 'none'
                                            }
                                        >
                                            <button type="button" onClick={() => ordenarPor(key)}>
                                                {label}
                                                {iconoOrden(key)}
                                            </button>
                                        </th>
                                    ))}
                                    <th scope="col" className="report-col-action">
                                        <span className="report-sr-only">PDF</span>
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading && reportes.length === 0 && Array.from({ length: 5 }, (_, index) => (
                                    <tr className="report-table-loading" key={`skeleton-${index}`} aria-hidden="true">
                                        <td colSpan={COLUMNAS.length + 1}>
                                            <span className="at-skeleton at-skeleton-line" />
                                        </td>
                                    </tr>
                                ))}

                                {visibles.map((reporte) => (
                                    <tr
                                        key={reporte.id}
                                        className="report-table-row"
                                        tabIndex={0}
                                        onClick={(event) => abrirDetalle(reporte, event)}
                                        onKeyDown={(event) => {
                                            if (event.target !== event.currentTarget) return;
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                abrirDetalle(reporte, event);
                                            }
                                        }}
                                        aria-label={`Ver detalle del reporte ${reporte.id}`}
                                    >
                                        <td className="report-cell-id">#{reporte.id}</td>
                                        <td className="report-cell-code">{formatId(reporte.codigoSolicitud)}</td>
                                        <td>
                                            <span className="report-cell-equipment">
                                                <FaLaptop aria-hidden="true" />
                                                {nombreEquipo(reporte)}
                                            </span>
                                        </td>
                                        <td className="report-cell-muted">{getValue(reporte.unidad)}</td>
                                        <td className="report-cell-truncate" title={reporte.tecnicoNombre || undefined}>
                                            {getValue(reporte.tecnicoNombre)}
                                        </td>
                                        <td>
                                            <span className={`at-badge report-final-badge ${claseEstado(reporte.estadoFinal)}`}>
                                                <span className="report-status-dot" aria-hidden="true" />
                                                {getValue(humanize(reporte.estadoFinal))}
                                            </span>
                                        </td>
                                        <td className="report-cell-muted report-cell-date">
                                            {getValue(reporte.fechaAtencion)}
                                        </td>
                                        <td className="report-col-action">
                                            <button
                                                type="button"
                                                className="report-pdf-icon"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    descargarPdf(reporte);
                                                }}
                                                disabled={descargandoId !== null}
                                                title="Descargar PDF"
                                                aria-label={`Descargar PDF del reporte ${reporte.id}`}
                                            >
                                                <FaFilePdf aria-hidden="true" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {sinDatos && (
                        <div className="at-empty report-table-empty">
                            <FaInbox aria-hidden="true" />
                            <strong>{hayFiltros ? 'Ningún reporte coincide con los filtros' : 'Aún no hay reportes registrados'}</strong>
                            <span>
                                {hayFiltros
                                    ? 'Prueba con otro término o quita algún filtro.'
                                    : 'Cuando los técnicos guarden reportes de atención aparecerán aquí.'}
                            </span>
                            {hayFiltros && (
                                <button type="button" className="at-btn-outline" onClick={limpiarFiltros}>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && filtrados.length > 0 && (
                        <footer className="report-pagination">
                            <div className="report-pagination-info">
                                <p aria-live="polite">
                                    Mostrando <strong>{inicio + 1}–{inicio + visibles.length}</strong> de{' '}
                                    <strong>{filtrados.length}</strong> reportes
                                </p>
                                <label>
                                    <span>Por página</span>
                                    <select
                                        value={porPagina}
                                        onChange={(event) => {
                                            setPorPagina(Number(event.target.value));
                                            setPagina(1);
                                        }}
                                    >
                                        {PAGE_SIZES.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <nav className="report-pages" aria-label="Paginación">
                                <button
                                    type="button"
                                    onClick={() => setPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                >
                                    Anterior
                                </button>
                                {paginasVisibles(paginaActual, totalPaginas).map((numero) => (
                                    <button
                                        key={numero}
                                        type="button"
                                        className={numero === paginaActual ? 'is-current' : ''}
                                        onClick={() => setPagina(numero)}
                                        aria-current={numero === paginaActual ? 'page' : undefined}
                                    >
                                        {numero}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setPagina(paginaActual + 1)}
                                    disabled={paginaActual === totalPaginas}
                                >
                                    Siguiente
                                </button>
                            </nav>
                        </footer>
                    )}
                </section>
            )}

            {/* Detalle en modal */}
            {seleccionado && (
                <div
                    className="report-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) cerrarDetalle();
                    }}
                >
                    <div
                        className="report-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-modal-title"
                    >
                        <header className="report-modal-header">
                            <div className="report-heading-main">
                                <span className="report-id">REPORTE #{seleccionado.id}</span>
                                <h3 id="report-modal-title">
                                    Solicitud #{formatId(seleccionado.codigoSolicitud)}
                                </h3>
                                <p className="report-equipment">
                                    <FaLaptop aria-hidden="true" />
                                    <span>{nombreEquipo(seleccionado)}</span>
                                    {seleccionado.numeroInventario && (
                                        <span className="report-inventory">
                                            <FaBarcode aria-hidden="true" />
                                            {seleccionado.numeroInventario}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="report-row-actions">
                                <span className={`at-badge report-final-badge ${claseEstado(seleccionado.estadoFinal)}`}>
                                    <span className="report-status-dot" aria-hidden="true" />
                                    {getValue(humanize(seleccionado.estadoFinal))}
                                </span>
                                <button
                                    className="report-pdf-button"
                                    type="button"
                                    onClick={() => descargarPdf(seleccionado)}
                                    disabled={descargandoId !== null}
                                >
                                    <FaFilePdf aria-hidden="true" />
                                    {descargandoId === seleccionado.id ? 'Generando PDF...' : 'Descargar PDF'}
                                </button>
                                <button
                                    type="button"
                                    className="report-modal-close"
                                    onClick={cerrarDetalle}
                                    ref={closeButtonRef}
                                    aria-label="Cerrar detalle"
                                >
                                    <FaTimes aria-hidden="true" />
                                </button>
                            </div>
                        </header>

                        <div className="report-modal-body">
                            {errorPdf && (
                                <div className="at-error" role="alert">
                                    <span>{errorPdf}</span>
                                </div>
                            )}

                            <div className="report-row-meta">
                                <span className="report-meta-item">
                                    <FaRegCalendarAlt aria-hidden="true" />
                                    <strong>Atención:</strong> {getValue(seleccionado.fechaAtencion)}
                                </span>
                                <span className="report-meta-item">
                                    <FaRegCalendarAlt aria-hidden="true" />
                                    <strong>Hora:</strong> {getValue(seleccionado.horaAtencion?.slice(0, 5))}
                                </span>
                                {seleccionado.asignacionTecnicoId !== undefined && seleccionado.asignacionTecnicoId !== null && (
                                    <span className="report-meta-item">
                                        <strong>Asignación:</strong> #{seleccionado.asignacionTecnicoId}
                                    </span>
                                )}
                                <span className={`report-verify ${seleccionado.verificacion ? 'is-verified' : 'is-pending'}`}>
                                    <strong>Verificado por el Solicitante:</strong> {textoVerificacion(seleccionado.verificacion)}
                                </span>
                                <span className="report-meta-item report-saved-date">
                                    Guardado: {getValue(formatDateTime(seleccionado.createdAt))}
                                </span>
                            </div>

                            <dl className="report-details">
                                <div className="report-detail">
                                    <dt><FaBuilding aria-hidden="true" /> Unidad / Dirección</dt>
                                    <dd>{getValue(seleccionado.unidad)}</dd>
                                </div>
                                <div className="report-detail">
                                    <dt><FaUser aria-hidden="true" /> Solicitante</dt>
                                    <dd>{getValue(seleccionado.solicitante)}</dd>
                                </div>
                                <div className="report-detail">
                                    <dt><FaClipboardList aria-hidden="true" /> Formulario STI</dt>
                                    <dd>{getValue(seleccionado.numeroFormulario ? `STI-${seleccionado.numeroFormulario}` : '')}</dd>
                                </div>
                                <div className="report-detail">
                                    <dt><FaBarcode aria-hidden="true" /> N.º de inventario</dt>
                                    <dd>{getValue(seleccionado.numeroInventario)}</dd>
                                </div>

                                <div className="report-highlight report-problem">
                                    <dt><FaInbox aria-hidden="true" /> Problema reportado</dt>
                                    <dd>{getValue(seleccionado.problema)}</dd>
                                </div>
                                <div className="report-highlight report-diagnosis">
                                    <dt><FaSearch aria-hidden="true" /> Diagnóstico técnico</dt>
                                    <dd>{getValue(seleccionado.diagnostico)}</dd>
                                </div>
                                <div className="report-highlight report-solution">
                                    <dt><FaCheckCircle aria-hidden="true" /> Trabajo realizado / Solución</dt>
                                    <dd>{getValue(seleccionado.trabajoRealizado)}</dd>
                                </div>
                                <div className="report-highlight report-observations">
                                    <dt><FaTools aria-hidden="true" /> Observaciones</dt>
                                    <dd>{getValue(seleccionado.observacion)}</dd>
                                </div>
                            </dl>

                            <footer className="report-footer">
                                <div>
                                    <span className="report-footer-label">Técnico responsable</span>
                                    <strong>{getValue(seleccionado.tecnicoNombre)}</strong>
                                </div>
                                <div>
                                    <span className="report-footer-label">Funcionario solicitante</span>
                                    <strong>{getValue(seleccionado.funcionarioNombre)}</strong>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Reportes;