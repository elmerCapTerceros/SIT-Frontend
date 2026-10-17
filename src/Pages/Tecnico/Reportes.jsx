import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FaChartBar,
	FaCheckCircle,
	FaFilePdf,
	FaInbox,
	FaRedo,
	FaRegCalendarAlt,
	FaSearch,
	FaSyncAlt,
	FaTimes,
	FaLaptop,
	FaClipboardList,
	FaTools,
	FaUser,
	FaBuilding,
	FaBarcode,
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
import './Reportes.css';

const API_URL = 'http://localhost:8080/api';

const Reportes = () => {
	const [reportes, setReportes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');
	const [errorPdf, setErrorPdf] = useState('');
	const [descargandoId, setDescargandoId] = useState(null);

	const cargarReportes = useCallback(async (signal) => {
		const token = localStorage.getItem('token');
		if (!token) {
			throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
		}

		const response = await fetch(`${API_URL}/reportes/mis-reportes`, {
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
			setError(requestError.message || 'No se pudieron cargar tus reportes.');
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

	const resumen = useMemo(() => {
		const solucionados = reportes.filter(
			(reporte) => normalize(reporte.estadoFinal) === 'solucionado'
		).length;

		return {
			total: reportes.length,
			solucionados,
			otros: reportes.length - solucionados,
		};
	}, [reportes]);

	const visibles = useMemo(() => {
		const text = toSearchText(query.trim());

		return reportes
			.filter((reporte) =>
				!text ||
				toSearchText([
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
				].join(' ')).includes(text)
			)
			.sort((a, b) =>
				(new Date(b.createdAt).getTime() || 0) -
				(new Date(a.createdAt).getTime() || 0)
			);
	}, [reportes, query]);

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

	return (
		<main className="at-page report-page">
			<header className="at-header report-main-header">
				<span className="at-header-icon" aria-hidden="true">
					<FaChartBar />
				</span>
				<div className="report-header-copy">
					<h1>Mis reportes</h1>
					<p>Consulta las atenciones técnicas realizadas y descarga sus informes.</p>
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

			{error && (
				<div className="at-error" role="alert">
					<span>{error}</span>
					<button type="button" onClick={() => cargar()} disabled={loading}>
						<FaRedo aria-hidden="true" /> Reintentar
					</button>
				</div>
			)}

			{!error && (
				<section className="report-summary" aria-label="Resumen de reportes">
					<article className="summary-card summary-total">
						<span className="summary-icon"><FaClipboardList aria-hidden="true" /></span>
						<div className="summary-content">
							<span>Total de reportes</span>
							<strong>{resumen.total}</strong>
							<small>Atenciones registradas</small>
						</div>
					</article>

					<article className="summary-card summary-done">
						<span className="summary-icon"><FaCheckCircle aria-hidden="true" /></span>
						<div className="summary-content">
							<span>Solucionados</span>
							<strong>{resumen.solucionados}</strong>
							<small>Con solución registrada</small>
						</div>
					</article>

					<article className="summary-card summary-pending">
						<span className="summary-icon"><FaTools aria-hidden="true" /></span>
						<div className="summary-content">
							<span>Otros estados</span>
							<strong>{resumen.otros}</strong>
							<small>Parciales u otros resultados</small>
						</div>
					</article>
				</section>
			)}

			<section className="report-tools" aria-label="Buscar reportes">
				<div className="report-tools-heading">
					<div>
						<h2>Historial de atenciones</h2>
						<p>Busca por solicitud, equipo, inventario, solicitante o diagnóstico.</p>
					</div>
				</div>

				<div className="at-toolbar">
					<div className="at-search">
						<FaSearch aria-hidden="true" />
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Ej. solicitud, inventario o diagnóstico..."
							aria-label="Buscar en mis reportes"
						/>
						{query && (
							<button
								type="button"
								className="at-search-clear"
								onClick={() => setQuery('')}
								aria-label="Borrar búsqueda"
							>
								<FaTimes aria-hidden="true" />
							</button>
						)}
					</div>
					<p className="at-result-count" aria-live="polite">
						{!loading && !error
							? `${visibles.length} de ${reportes.length} reportes`
							: loading ? 'Cargando reportes...' : ''}
					</p>
				</div>
			</section>

			{errorPdf && (
				<div className="at-error report-pdf-error" role="alert">
					<span>{errorPdf}</span>
					<button type="button" onClick={() => setErrorPdf('')} aria-label="Cerrar mensaje">
						<FaTimes aria-hidden="true" /> Cerrar
					</button>
				</div>
			)}

			<section className="report-list" aria-label="Mis reportes de atención" aria-busy={loading}>
				{loading && reportes.length === 0 && Array.from({ length: 3 }, (_, index) => (
					<div className="report-row report-row-loading" key={`skeleton-${index}`} aria-hidden="true">
						<span className="at-skeleton at-skeleton-top" />
						<span className="at-skeleton at-skeleton-title" />
						<span className="at-skeleton at-skeleton-line" />
					</div>
				))}

				{!error && visibles.map((reporte) => (
					<article className="report-row" key={reporte.id}>
						<header className="report-row-heading">
							<div className="report-heading-main">
								<span className="report-id">REPORTE #{reporte.id}</span>
								<h3>Solicitud #{formatId(reporte.codigoSolicitud)}</h3>
								<p className="report-equipment">
									<FaLaptop aria-hidden="true" />
									<span>{nombreEquipo(reporte)}</span>
									{reporte.numeroInventario && (
										<span className="report-inventory">
											<FaBarcode aria-hidden="true" />
											{reporte.numeroInventario}
										</span>
									)}
								</p>
							</div>

							<div className="report-row-actions">
								<span className={`at-badge report-final-badge ${claseEstado(reporte.estadoFinal)}`}>
									<span className="report-status-dot" aria-hidden="true" />
									{getValue(humanize(reporte.estadoFinal))}
								</span>
								<button
									className="report-pdf-button"
									type="button"
									onClick={() => descargarPdf(reporte)}
									disabled={descargandoId !== null}
								>
									<FaFilePdf aria-hidden="true" />
									{descargandoId === reporte.id ? 'Generando PDF...' : 'Descargar PDF'}
								</button>
							</div>
						</header>

						<div className="report-row-meta">
							<span className="report-meta-item">
								<FaRegCalendarAlt aria-hidden="true" />
								<strong>Atención:</strong> {getValue(reporte.fechaAtencion)}
							</span>
							<span className="report-meta-item">
								<FaRegCalendarAlt aria-hidden="true" />
								<strong>Hora:</strong> {getValue(reporte.horaAtencion?.slice(0, 5))}
							</span>
							{reporte.asignacionTecnicoId !== undefined && reporte.asignacionTecnicoId !== null && (
								<span className="report-meta-item">
									<strong>Asignación:</strong> #{reporte.asignacionTecnicoId}
								</span>
							)}
							<span className="report-meta-item report-saved-date">
								Guardado: {getValue(formatDateTime(reporte.createdAt))}
							</span>
						</div>

						<dl className="report-details">
							<div className="report-detail">
								<dt><FaBuilding aria-hidden="true" /> Unidad / Dirección</dt>
								<dd>{getValue(reporte.unidad)}</dd>
							</div>
							<div className="report-detail">
								<dt><FaUser aria-hidden="true" /> Solicitante</dt>
								<dd>{getValue(reporte.solicitante)}</dd>
							</div>
							<div className="report-detail">
								<dt><FaClipboardList aria-hidden="true" /> Formulario STI</dt>
								<dd>{getValue(reporte.numeroFormulario ? `STI-${reporte.numeroFormulario}` : '')}</dd>
							</div>
							<div className="report-detail">
								<dt><FaBarcode aria-hidden="true" /> N.º de inventario</dt>
								<dd>{getValue(reporte.numeroInventario)}</dd>
							</div>

							<div className="report-highlight report-problem">
								<dt><FaInbox aria-hidden="true" /> Problema reportado</dt>
								<dd>{getValue(reporte.problema)}</dd>
							</div>
							<div className="report-highlight report-diagnosis">
								<dt><FaSearch aria-hidden="true" /> Diagnóstico técnico</dt>
								<dd>{getValue(reporte.diagnostico)}</dd>
							</div>
							<div className="report-highlight report-solution">
								<dt><FaCheckCircle aria-hidden="true" /> Trabajo realizado / Solución</dt>
								<dd>{getValue(reporte.trabajoRealizado)}</dd>
							</div>
							<div className="report-highlight report-observations">
								<dt><FaTools aria-hidden="true" /> Observaciones</dt>
								<dd>{getValue(reporte.observacion)}</dd>
							</div>
						</dl>

						<footer className="report-footer">
							<div>
								<span className="report-footer-label">Técnico responsable</span>
								<strong>{getValue(reporte.tecnicoNombre)}</strong>
							</div>
							<div>
								<span className="report-footer-label">Funcionario solicitante</span>
								<strong>{getValue(reporte.funcionarioNombre)}</strong>
							</div>
						</footer>
					</article>
				))}
			</section>

			{!loading && !error && visibles.length === 0 && (
				<div className="at-empty">
					<FaInbox aria-hidden="true" />
					<strong>{query ? 'Ningún reporte coincide con la búsqueda' : 'Aún no has realizado reportes'}</strong>
					<span>
						{query
							? 'Prueba con el número de solicitud, inventario o algún otro término.'
							: 'Cuando guardes un reporte de atención aparecerá aquí.'}
					</span>
					{query && (
						<button type="button" className="at-btn-outline" onClick={() => setQuery('')}>
							Limpiar búsqueda
						</button>
					)}
				</div>
			)}
		</main>
	);
};

export default Reportes;
