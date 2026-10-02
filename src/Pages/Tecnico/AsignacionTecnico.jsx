
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaInbox, FaRedo, FaSearch } from 'react-icons/fa';
import { formatDate, formatId, getValue, humanize, normalize, statusClass, toSearchText } from '../../utils/Solicitudesutils';
import './AsignacionTecnico.css';

const API_URL = 'http://localhost:8080/api';

const AsignacionTecnico = () => {
	const [solicitudes, setSolicitudes] = useState([]);
	const [tecnicoNombre, setTecnicoNombre] = useState('');
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const cargar = useCallback(async () => {
		setLoading(true);
		setError('');
		const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

		try {
			const tecnicoId = localStorage.getItem('userId');
			if (!tecnicoId) throw new Error('El login no devolvió el ID del técnico. La respuesta de /auth/login debe incluir su ID.');

			const solicitudesResponse = await fetch(`${API_URL}/asignaciones/tecnico/${tecnicoId}/solicitudes`, { headers });
			if (!solicitudesResponse.ok) throw new Error(`No se pudieron cargar las solicitudes (HTTP ${solicitudesResponse.status}).`);

			const solicitudesData = await solicitudesResponse.json();
			const lista = Array.isArray(solicitudesData)
				? solicitudesData
				: Array.isArray(solicitudesData.solicitudes)
					? solicitudesData.solicitudes
					: [];

			setTecnicoNombre([localStorage.getItem('nombre'), localStorage.getItem('apellido')].filter(Boolean).join(' '));
			setSolicitudes(lista);
		} catch (requestError) {
			setError(requestError.message || 'No se pudieron cargar tus solicitudes.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		cargar();
	}, [cargar]);

	const filtered = useMemo(() => {
		const text = toSearchText(query.trim());
		if (!text) return solicitudes;
		return solicitudes.filter((solicitud) =>
			toSearchText(`${solicitud.codigo ?? solicitud.id} ${solicitud.titulo} ${solicitud.categoria} ${solicitud.estado} ${solicitud.prioridad}`).includes(text)
		);
	}, [solicitudes, query]);

	const activas = solicitudes.filter((solicitud) => !['resuelta', 'concluida', 'cerrada'].includes(normalize(solicitud.estado))).length;
	const resueltas = solicitudes.length - activas;

	return (
		<main className="info-tecnicos-page">
			<header className="it-page-header">
				<div>
					<h1>Mis solicitudes asignadas</h1>
					<p>{tecnicoNombre ? `Solicitudes asignadas a ${tecnicoNombre}.` : 'Consulta el estado y avance de tus solicitudes asignadas.'}</p>
				</div>
				<div className="it-search">
					<FaSearch aria-hidden="true" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar solicitud…"
						aria-label="Buscar solicitud asignada"
					/>
				</div>
			</header>

			{error && (
				<div className="it-error" role="alert">
					<span>{error}</span>
					<button type="button" onClick={cargar}><FaRedo aria-hidden="true" /> Reintentar</button>
				</div>
			)}

			{!loading && !error && (
				<section className="it-stats" aria-label="Resumen de solicitudes">
					<div><strong>{solicitudes.length}</strong><span>Total asignadas</span></div>
					<div><strong>{activas}</strong><span>Activas</span></div>
					<div><strong>{resueltas}</strong><span>Finalizadas</span></div>
				</section>
			)}

			<section className="it-grid" aria-label="Solicitudes asignadas" aria-busy={loading}>
				{loading && Array.from({ length: 3 }, (_, index) => (
					<div className="it-card it-card-skeleton" key={`skeleton-${index}`} aria-hidden="true">
						<span className="it-skeleton it-skeleton-name" />
						<span className="it-skeleton it-skeleton-role" />
						<span className="it-skeleton it-skeleton-actions" />
					</div>
				))}
				{!loading && filtered.map((solicitud) => (
					<article className="it-card at-request-card" key={solicitud.id ?? solicitud.codigo}>
						<div className="at-request-top">
							<span className="it-request-id">#{formatId(solicitud.codigo ?? solicitud.id)}</span>
							<span className="it-request-date">{formatDate(solicitud.createdAt)}</span>
						</div>
						<h2 className="it-card-name">{getValue(solicitud.titulo)}</h2>
						<p className="it-card-role">{getValue(solicitud.categoria || solicitud.tipo)}</p>
						<div className="it-request-badges">
							<span className={`it-badge it-status-${statusClass(solicitud.estado)}`}>{humanize(solicitud.estado)}</span>
							<span className={`it-badge it-priority-${normalize(solicitud.prioridad) || 'sin-definir'}`}>{humanize(solicitud.prioridad)}</span>
						</div>
						<p className="at-request-requester">Solicitante: {getValue(solicitud.solicitanteNombre || solicitud.solicitanteId)}</p>
					</article>
				))}
			</section>

			{!loading && !error && filtered.length === 0 && (
				<div className="it-empty it-empty-page">
					<FaInbox aria-hidden="true" />
					<strong>{query ? 'Ninguna solicitud coincide con tu búsqueda' : 'Aún no tienes solicitudes asignadas'}</strong>
				</div>
			)}
		</main>
	);
};

export default AsignacionTecnico;
