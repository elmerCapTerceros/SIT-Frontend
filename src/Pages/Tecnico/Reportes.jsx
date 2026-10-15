import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaClipboardList, FaInbox, FaRedo, FaRegCalendarAlt, FaSearch, FaSyncAlt, FaTimes } from 'react-icons/fa';
import { formatDateTime, formatId, getValue, humanize, normalize, toSearchText } from '../../utils/Solicitudesutils';
import './Reportes.css';

const API_URL = 'http://localhost:8080/api';

const Reportes = () => {
	const [reportes, setReportes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');

	const cargarReportes = useCallback(async (signal) => {
		const tecnicoId = localStorage.getItem('userId');
		const token = localStorage.getItem('token');
		if (!tecnicoId) throw new Error('No se encontró el ID del técnico en la sesión. Vuelve a iniciar sesión.');
		if (!token) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');

		const response = await fetch(`${API_URL}/reportes/mis-reportes`, {
			headers: { Authorization: `Bearer ${token}` },
			signal,
		});
		if (!response.ok) throw new Error(`No se pudieron cargar los reportes (HTTP ${response.status}).`);

		const data = await response.json();
		if (!Array.isArray(data)) throw new Error('La respuesta de reportes tiene un formato inesperado.');
		if (signal?.aborted) return;

		setReportes(data.filter((reporte) => String(reporte.tecnicoId) === String(tecnicoId)));
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

	const visibles = useMemo(() => {
		const text = toSearchText(query.trim());
		return reportes
			.filter((reporte) =>
				!text ||
				toSearchText([
					reporte.id,
					reporte.codigoSolicitud,
					reporte.tipoEquipo,
					reporte.diagnostico,
					reporte.trabajoRealizado,
					reporte.estadoFinal,
					reporte.observacion,
				].join(' ')).includes(text)
			)
			.sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
	}, [reportes, query]);

	return (
		<main className="at-page report-page">
			<header className="at-header">
				<span className="at-header-icon" aria-hidden="true"><FaClipboardList /></span>
				<div>
					<h1>Mis reportes</h1>
					<p>Consulta los reportes de atención que has realizado.</p>
				</div>
			</header>

			{error && (
				<div className="at-error" role="alert">
					<span>{error}</span>
					<button type="button" onClick={() => cargar()} disabled={loading}>
						<FaRedo aria-hidden="true" /> Reintentar
					</button>
				</div>
			)}

			<div className="at-toolbar">
				<div className="at-search">
					<FaSearch aria-hidden="true" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por solicitud, equipo, diagnóstico o estado"
						aria-label="Buscar en mis reportes"
					/>
					{query && (
						<button type="button" className="at-search-clear" onClick={() => setQuery('')} aria-label="Borrar búsqueda">
							<FaTimes aria-hidden="true" />
						</button>
					)}
				</div>
				<button
					type="button"
					className={`at-refresh${loading ? ' is-spinning' : ''}`}
					onClick={() => cargar()}
					disabled={loading}
					aria-label="Actualizar reportes"
				>
					<FaSyncAlt aria-hidden="true" /> <span>Actualizar</span>
				</button>
			</div>

			<p className="at-result-count" aria-live="polite">
				{!loading && !error && `Mostrando ${visibles.length} de ${reportes.length} reportes`}
			</p>

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
							<div>
								<span className="report-id">Reporte #{reporte.id}</span>
								<h2>Solicitud #{formatId(reporte.codigoSolicitud)}</h2>
							</div>
							<time className="report-date" dateTime={reporte.createdAt}>
								<FaRegCalendarAlt aria-hidden="true" /> {formatDateTime(reporte.createdAt)}
							</time>
						</header>

						<div className="report-row-meta">
							<span><strong>Equipo:</strong> {getValue(reporte.tipoEquipo)}</span>
							{reporte.asignacionTecnicoId !== undefined && (
								<span><strong>Asignación:</strong> #{reporte.asignacionTecnicoId}</span>
							)}
							<span className={`at-badge report-final-${normalize(reporte.estadoFinal)}`}>
								{humanize(reporte.estadoFinal)}
							</span>
						</div>

						<dl className="report-details">
							<div>
								<dt>Diagnóstico técnico</dt>
								<dd>{getValue(reporte.diagnostico)}</dd>
							</div>
							<div>
								<dt>Trabajo realizado / Solución</dt>
								<dd>{getValue(reporte.trabajoRealizado)}</dd>
							</div>
							<div>
								<dt>Observaciones</dt>
								<dd>{getValue(reporte.observacion)}</dd>
							</div>
						</dl>
					</article>
				))}
			</section>

			{!loading && !error && visibles.length === 0 && (
				<div className="at-empty">
					<FaInbox aria-hidden="true" />
					<strong>{query ? 'Ningún reporte coincide con la búsqueda' : 'Aún no has realizado reportes'}</strong>
					<span>
						{query
							? 'Prueba con otros términos.'
							: 'Cuando guardes un reporte de atención aparecerá aquí.'}
					</span>
				</div>
			)}
		</main>
	);
};

export default Reportes;
