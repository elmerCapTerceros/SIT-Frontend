import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChartBar, FaSyncAlt } from 'react-icons/fa';
import { humanize } from '../../utils/Solicitudesutils';
import './DashboardSupervisor.css';

/* ───────────── Configuración ───────────── */

const API_URL = 'http://localhost:8080/api';

const COLORES = {
    exito: '#10b981',
    proceso: '#f59e0b',
    peligro: '#f43f5e',
    info: '#0ea5e9',
    indigo: '#6366f1',
    indigoClaro: '#c7d2fe',
    teal: '#14b8a6',
    neutro: '#cbd5e1',
};

const GRUPO_POR_ESTADO = {
    CONCLUIDA: 'resueltas',
    EN_PROCESO: 'enProceso',
    PENDIENTE: 'pendientes',
};

const COLOR_ESTADO_REPORTE = {
    SOLUCIONADO: COLORES.exito,
    PARCIAL: COLORES.info,
    REQUIERE_REPUESTO: COLORES.proceso,
    PENDIENTE: COLORES.peligro,
};

const COLOR_VERIFICACION = {
    Verificado: COLORES.indigo,
    'No verificado': COLORES.indigoClaro,
    'Sin respuesta': COLORES.neutro,
};

/* ───────────── Helpers ───────────── */

const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    return token;
};

const grupoEstado = (etiqueta) =>
    GRUPO_POR_ESTADO[String(etiqueta ?? '').toUpperCase()] ?? 'otros';

const sumar = (lista = []) => lista.reduce((acc, item) => acc + item.total, 0);

const pct = (valor, total) => (total > 0 ? Math.round((valor / total) * 100) : 0);

const totalDe = (lista = [], etiqueta) =>
    sumar(lista.filter((item) => item.etiqueta === etiqueta));

const aSegmentos = (lista = [], colores, formatear = (x) => x) =>
    lista.map((item) => ({
        nombre: formatear(item.etiqueta),
        total: item.total,
        color: colores[item.etiqueta] ?? COLORES.neutro,
    }));

/* ───────────── Componentes ───────────── */

const KpiCard = ({ titulo, valor, detalle, acento }) => (
    <article className="dash-card dash-kpi" style={{ '--acento': acento }}>
        <span className="dash-kpi-title">{titulo}</span>
        <strong className="dash-kpi-value">{valor}</strong>
        <span className="dash-kpi-detail">{detalle}</span>
    </article>
);

const BarList = ({ titulo, items = [], color, formatear = (x) => x }) => {
    const max = Math.max(...items.map((i) => i.total), 1);

    return (
        <section className="dash-card dash-chart" aria-label={titulo}>
            <h2>{titulo}</h2>
            {items.length === 0 ? (
                <p className="dash-empty">Sin datos</p>
            ) : (
                <ul className="dash-bars" tabIndex={0} aria-label={`Lista de ${titulo}`}>
                    {items.map((item) => (
                        <li key={item.etiqueta}>
                            <span className="dash-bar-label" title={formatear(item.etiqueta)}>
                                {formatear(item.etiqueta)}
                            </span>
                            <span className="dash-bar-track">
                                <span
                                    className="dash-bar-fill"
                                    style={{ width: `${(item.total / max) * 100}%`, background: color }}
                                />
                            </span>
                            <strong className="dash-bar-value">{item.total}</strong>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

const Donut = ({ titulo, segmentos, centroValor, centroTexto }) => {
    const suma = sumar(segmentos);
    let acumulado = 0;

    const partes = segmentos.map((s) => {
        const inicio = acumulado;
        acumulado += suma > 0 ? (s.total / suma) * 100 : 0;
        return `${s.color} ${inicio}% ${acumulado}%`;
    });
    const fondo = suma > 0 ? `conic-gradient(${partes.join(', ')})` : '#e5e7eb';

    return (
        <section className="dash-card dash-chart" aria-label={titulo}>
            <h2>{titulo}</h2>
            <div className="dash-donut-wrap">
                <div
                    className="dash-donut"
                    style={{ background: fondo }}
                    role="img"
                    aria-label={`${centroValor}% ${centroTexto}`}
                >
                    <div className="dash-donut-center">
                        <strong>{centroValor}%</strong>
                        <span>{centroTexto}</span>
                    </div>
                </div>
                <ul className="dash-legend">
                    {segmentos.map((s) => (
                        <li key={s.nombre}>
                            <span className="dash-dot" style={{ background: s.color }} />
                            {s.nombre}: {pct(s.total, suma)}%
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

/* ───────────── Página ───────────── */

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async (signal) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/dashboard`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                signal,
            });
            if (!response.ok) {
                throw new Error(`No se pudo cargar el dashboard (HTTP ${response.status}).`);
            }
            const json = await response.json();
            if (signal?.aborted) return;
            setData(json);
        } catch (requestError) {
            if (signal?.aborted) return;
            setError(requestError.message || 'No se pudo cargar el dashboard.');
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

    /* Solicitudes por estado */
    const resumen = useMemo(() => {
        const acc = { resueltas: 0, enProceso: 0, pendientes: 0, otros: 0 };
        (data?.solicitudesPorEstado ?? []).forEach((e) => {
            acc[grupoEstado(e.etiqueta)] += e.total;
        });
        return { ...acc, total: acc.resueltas + acc.enProceso + acc.pendientes + acc.otros };
    }, [data]);

    const segmentosSolicitudes = [
        { nombre: 'Resueltas', total: resumen.resueltas, color: COLORES.exito },
        { nombre: 'En proceso', total: resumen.enProceso, color: COLORES.proceso },
        { nombre: 'Pendientes', total: resumen.pendientes, color: COLORES.peligro },
    ];

    /* Reportes por estado final */
    const segmentosReportes = useMemo(
        () => aSegmentos(data?.reportesPorEstadoFinal, COLOR_ESTADO_REPORTE, humanize),
        [data]
    );
    const totalReportes = sumar(segmentosReportes);
    const reportesSolucionados = totalDe(data?.reportesPorEstadoFinal, 'SOLUCIONADO');

    /* Verificación de usuarios */
    const segmentosVerificacion = useMemo(
        () => aSegmentos(data?.verificacionUsuarios, COLOR_VERIFICACION),
        [data]
    );
    const totalVerificacion = sumar(segmentosVerificacion);
    const verificados = totalDe(data?.verificacionUsuarios, 'Verificado');

    return (
        <main className="at-page dash-page">
            <header className="at-header">
                <span className="at-header-icon" aria-hidden="true">
                    <FaChartBar />
                </span>
                <div>
                    <h1>Dashboard</h1>
                    <p>Consulta y revisa las estadísticas de los trabajos técnicos realizados.</p>
                </div>
                <button
                    type="button"
                    className={`at-refresh${loading ? ' is-spinning' : ''}`}
                    onClick={() => cargar()}
                    disabled={loading}
                >
                    <FaSyncAlt aria-hidden="true" />
                    <span>Actualizar</span>
                </button>
            </header>

            {error && (
                <div className="at-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={() => cargar()}>
                        <FaSyncAlt aria-hidden="true" /> Reintentar
                    </button>
                </div>
            )}

            {!error && (
                <div className="dash-layout" aria-busy={loading}>
                    <div className="dash-kpis">
                        <KpiCard
                            titulo="Total solicitudes"
                            valor={resumen.total}
                            detalle="Registradas"
                            acento={COLORES.info}
                        />
                        <KpiCard
                            titulo="Resueltas"
                            valor={resumen.resueltas}
                            detalle={`${pct(resumen.resueltas, resumen.total)}% de resolución`}
                            acento={COLORES.exito}
                        />
                        <KpiCard
                            titulo="En proceso"
                            valor={resumen.enProceso}
                            detalle="Atención activa actual"
                            acento={COLORES.proceso}
                        />
                        <KpiCard
                            titulo="Pendientes"
                            valor={resumen.pendientes}
                            detalle="Por asignar/atender"
                            acento={COLORES.peligro}
                        />
                    </div>

                    <div className="dash-charts">
                        <BarList
                            titulo="Trabajos realizados por técnico"
                            items={data?.trabajosPorTecnico}
                            color={COLORES.info}
                            formatear={humanize}
                        />
                        <Donut
                            titulo="Distribución de solicitudes"
                            segmentos={segmentosSolicitudes}
                            centroValor={pct(resumen.resueltas, resumen.total)}
                            centroTexto="Resueltas"
                        />
                        <BarList
                            titulo="Categorías más atendidas"
                            items={data?.solicitudesPorCategoria}
                            color={COLORES.teal}
                            formatear={humanize}
                        />
                        <Donut
                            titulo="Estados finales de reportes"
                            segmentos={segmentosReportes}
                            centroValor={pct(reportesSolucionados, totalReportes)}
                            centroTexto="Solucionados"
                        />
                        <BarList
                            titulo="Solicitudes por área"
                            items={data?.solicitudesPorArea}
                            color={COLORES.indigo}
                            formatear={humanize}
                        />
                        <Donut
                            titulo="Verificación de usuarios"
                            segmentos={segmentosVerificacion}
                            centroValor={pct(verificados, totalVerificacion)}
                            centroTexto="Verificados"
                        />
                    </div>
                </div>
            )}
        </main>
    );
};

export default Dashboard;