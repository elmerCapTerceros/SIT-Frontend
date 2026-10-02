import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	FaBolt,
	FaCheckCircle,
	FaClipboardList,
	FaFlag,
	FaHourglassHalf,
	FaInbox,
	FaListUl,
	FaLock,
	FaRedo,
	FaRegCalendarAlt,
	FaRegCircle,
	FaRegClock,
	FaSearch,
	FaSyncAlt,
	FaTag,
	FaTimes,
	FaTools,
	FaUser,
	FaUserCheck,
} from 'react-icons/fa';
import { formatDate, formatId, getValue, humanize, normalize, statusClass, toSearchText } from '../../utils/Solicitudesutils';
import './AsignacionTecnico.css';

/* ==========================================================
   Configuración
   ========================================================== */

const API_URL = 'http://localhost:8080/api';
const CLOSED_STATES = ['resuelta', 'concluida', 'cerrada'];
const SKELETON_CARDS = 6;

const STATUS_ICONS = {
	pendiente: FaRegClock,
	nueva: FaBolt,
	asignada: FaUserCheck,
	'en-proceso': FaTools,
	resuelta: FaCheckCircle,
	cerrada: FaLock,
};

const PRIORITY_RANK = { alta: 0, media: 1, baja: 2 };

const isActive = (solicitud) => !CLOSED_STATES.includes(normalize(solicitud.estado));
const timeOf = (value) => new Date(value).getTime() || 0;
const priorityRank = (solicitud) => PRIORITY_RANK[normalize(solicitud.prioridad)] ?? 3;
const newestFirst = (a, b) => timeOf(b.createdAt) - timeOf(a.createdAt);

const VIEWS = [
	{ id: 'todas', label: 'Total asignadas', icon: FaListUl, test: () => true },
	{ id: 'activas', label: 'Activas', icon: FaHourglassHalf, test: isActive },
	{ id: 'finalizadas', label: 'Finalizadas', icon: FaCheckCircle, test: (s) => !isActive(s) },
];

const SORTS = [
	{ id: 'recientes', label: 'Más recientes', compare: newestFirst },
	{ id: 'antiguas', label: 'Más antiguas', compare: (a, b) => newestFirst(b, a) },
	{ id: 'prioridad', label: 'Mayor prioridad', compare: (a, b) => priorityRank(a) - priorityRank(b) || newestFirst(a, b) },
];

const getInitials = (name = '') =>
	name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || '?';

/* ==========================================================
   Datos
   ========================================================== */

const useSolicitudesAsignadas = () => {
	const [state, setState] = useState({ solicitudes: [], tecnicoNombre: '', loading: true, error: '' });
	const abortRef = useRef(null);

	const cargar = useCallback(async () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setState((prev) => ({ ...prev, loading: true, error: '' }));

		try {
			const tecnicoId = localStorage.getItem('userId');
			if (!tecnicoId) {
				throw new Error('El login no devolvió el ID del técnico. La respuesta de /auth/login debe incluir su ID.');
			}

			const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
			const response = await fetch(`${API_URL}/asignaciones/tecnico/${tecnicoId}/solicitudes`, {
				headers,
				signal: controller.signal,
			});
			if (!response.ok) throw new Error(`No se pudieron cargar las solicitudes (HTTP ${response.status}).`);

			const data = await response.json();
			const lista = Array.isArray(data) ? data : Array.isArray(data.solicitudes) ? data.solicitudes : [];

			if (controller.signal.aborted) return;
			setState({
				solicitudes: lista,
				tecnicoNombre: [localStorage.getItem('nombre'), localStorage.getItem('apellido')].filter(Boolean).join(' '),
				loading: false,
				error: '',
			});
		} catch (requestError) {
			if (controller.signal.aborted) return;
			setState((prev) => ({
				...prev,
				loading: false,
				error: requestError.message || 'No se pudieron cargar tus solicitudes.',
			}));
		}
	}, []);

	useEffect(() => {
		const timer = window.setTimeout(cargar, 0);
		return () => {
			window.clearTimeout(timer);
			abortRef.current?.abort();
		};
	}, [cargar]);

	return { ...state, cargar };
};

/* ==========================================================
   Componentes
   ========================================================== */

const SolicitudCard = ({ solicitud, index }) => {
	const prioridad = normalize(solicitud.prioridad) || 'sin-definir';
	const estado = statusClass(solicitud.estado);
	const StatusIcon = STATUS_ICONS[estado] ?? FaRegCircle;
	const done = !isActive(solicitud);

	return (
		<article className={`at-card at-card-${prioridad}${done ? ' is-done' : ''}`} style={{ '--i': Math.min(index, 8) }}>
			<div className="at-card-top">
				<span className="at-id">#{formatId(solicitud.codigo ?? solicitud.id)}</span>
				<span className="at-date">
					<FaRegCalendarAlt aria-hidden="true" /> {formatDate(solicitud.createdAt)}
				</span>
			</div>

			<h2 className="at-title">{getValue(solicitud.titulo)}</h2>

			<p className="at-category">
				<FaTag aria-hidden="true" /> {getValue(solicitud.categoria || solicitud.tipo)}
			</p>

			<div className="at-badges">
				<span className={`at-badge at-status-${estado}`}>
					<StatusIcon aria-hidden="true" /> {humanize(solicitud.estado)}
				</span>
				<span className={`at-badge at-priority-${prioridad}`}>
					<FaFlag aria-hidden="true" /> {humanize(solicitud.prioridad)}
				</span>
			</div>

			<footer className="at-requester">
				<span className="at-requester-avatar" aria-hidden="true">
					{solicitud.solicitanteNombre ? getInitials(solicitud.solicitanteNombre) : <FaUser />}
				</span>
				<span className="at-requester-text">
					<small>Solicitante</small>
					{getValue(solicitud.solicitanteNombre || solicitud.solicitanteId)}
				</span>
			</footer>
		</article>
	);
};

const SkeletonCard = () => (
	<div className="at-card at-card-skeleton" aria-hidden="true">
		<span className="at-skeleton at-skeleton-top" />
		<span className="at-skeleton at-skeleton-title" />
		<span className="at-skeleton at-skeleton-line" />
		<span className="at-skeleton at-skeleton-badges" />
		<span className="at-skeleton at-skeleton-footer" />
	</div>
);

/* ==========================================================
   Página
   ========================================================== */

const AsignacionTecnico = () => {
	const { solicitudes, tecnicoNombre, loading, error, cargar } = useSolicitudesAsignadas();
	const [query, setQuery] = useState('');
	const [view, setView] = useState('todas');
	const [sort, setSort] = useState('recientes');

	const hasData = solicitudes.length > 0;
	const firstLoad = loading && !hasData;
	const refreshing = loading && hasData;

	const counts = useMemo(
		() => Object.fromEntries(VIEWS.map(({ id, test }) => [id, solicitudes.filter(test).length])),
		[solicitudes]
	);

	const urgentes = useMemo(
		() => solicitudes.filter((s) => isActive(s) && normalize(s.prioridad) === 'alta').length,
		[solicitudes]
	);

	const visible = useMemo(() => {
		const text = toSearchText(query.trim());
		const test = VIEWS.find((v) => v.id === view).test;
		const compare = SORTS.find((s) => s.id === sort).compare;
		return solicitudes
			.filter(
				(s) =>
					test(s) &&
					(!text ||
						toSearchText(`${s.codigo ?? s.id} ${s.titulo} ${s.categoria} ${s.estado} ${s.prioridad}`).includes(text))
			)
			.sort(compare);
	}, [solicitudes, query, view, sort]);

	const hasFilters = Boolean(query.trim()) || view !== 'todas';
	const clearFilters = () => {
		setQuery('');
		setView('todas');
	};

	return (
		<main className="at-page">
			<header className="at-header">
				<span className="at-header-icon" aria-hidden="true">
					<FaClipboardList />
				</span>
				<div>
					<h1>Mis solicitudes asignadas</h1>
					<p>
						{tecnicoNombre
							? <>Solicitudes asignadas a <strong>{tecnicoNombre}</strong>.</>
							: 'Consulta el estado y avance de tus solicitudes asignadas.'}
					</p>
				</div>
			</header>

			{error && (
				<div className="at-error" role="alert">
					<span>{error}</span>
					<button type="button" onClick={cargar}>
						<FaRedo aria-hidden="true" /> Reintentar
					</button>
				</div>
			)}

			{!error && (
				<div className="at-views" role="group" aria-label="Filtrar solicitudes por estado">
					{VIEWS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							className={`at-view${view === id ? ' is-active' : ''}`}
							aria-pressed={view === id}
							onClick={() => setView(id)}
						>
							<span className="at-view-icon" aria-hidden="true">
								<Icon />
							</span>
							<span className="at-view-text">
								<strong>{firstLoad ? '–' : counts[id]}</strong>
								<span>{label}</span>
							</span>
							{id === 'activas' && urgentes > 0 && (
								<span className="at-view-alert" title="Solicitudes activas con prioridad alta">
									<FaFlag aria-hidden="true" /> {urgentes} alta{urgentes === 1 ? '' : 's'}
								</span>
							)}
						</button>
					))}
				</div>
			)}

			<div className="at-toolbar">
				<div className="at-search">
					<FaSearch aria-hidden="true" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por código, título, categoría o estado"
						aria-label="Buscar solicitud asignada"
					/>
					{query && (
						<button type="button" className="at-search-clear" onClick={() => setQuery('')} aria-label="Borrar búsqueda">
							<FaTimes aria-hidden="true" />
						</button>
					)}
				</div>

				<label className="at-sort">
					<span>Ordenar por</span>
					<select value={sort} onChange={(event) => setSort(event.target.value)}>
						{SORTS.map(({ id, label }) => (
							<option key={id} value={id}>{label}</option>
						))}
					</select>
				</label>

				<button
					type="button"
					className={`at-refresh${refreshing ? ' is-spinning' : ''}`}
					onClick={cargar}
					disabled={loading}
					aria-label="Actualizar solicitudes"
				>
					<FaSyncAlt aria-hidden="true" /> <span>Actualizar</span>
				</button>
			</div>

			<p className="at-result-count" aria-live="polite">
				{!loading && !error && `Mostrando ${visible.length} de ${solicitudes.length} solicitudes`}
			</p>

			<section className="at-grid" aria-label="Solicitudes asignadas" aria-busy={loading}>
				{firstLoad && Array.from({ length: SKELETON_CARDS }, (_, index) => <SkeletonCard key={`sk-${index}`} />)}
				{!firstLoad &&
					!error &&
					visible.map((solicitud, index) => (
						<SolicitudCard key={solicitud.id ?? solicitud.codigo} solicitud={solicitud} index={index} />
					))}
			</section>

			{!loading && !error && visible.length === 0 && (
				<div className="at-empty">
					<FaInbox aria-hidden="true" />
					<strong>{hasFilters ? 'Ninguna solicitud coincide con los filtros' : 'Aún no tienes solicitudes asignadas'}</strong>
					<span>
						{hasFilters
							? 'Prueba con otra búsqueda o muestra todas las solicitudes.'
							: 'Cuando te asignen una solicitud aparecerá aquí.'}
					</span>
					{hasFilters && (
						<button type="button" className="at-btn-outline" onClick={clearFilters}>
							Limpiar filtros
						</button>
					)}
				</div>
			)}
		</main>
	);
};

export default AsignacionTecnico;