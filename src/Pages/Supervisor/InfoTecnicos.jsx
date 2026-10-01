import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaEnvelope, FaInbox, FaPhone, FaRedo, FaSearch, FaTimes } from 'react-icons/fa';
import { formatDate, formatId, getValue, humanize, normalize, statusClass, toSearchText } from '../../utils/Solicitudesutils';
import './InfoTecnicos.css';

const API_URL = 'http://localhost:8080/api';
const TECNICOS_ENDPOINT = '/usuarios/tecnicos'; // ajustarrr
const SOLICITUDES_ENDPOINT = '/solicitudes/SolicitudesTecnicas';
const CLOSED_STATES = ['resuelta', 'concluida', 'cerrada'];
const SKELETON_CARDS = 6;
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';


const getInitials = (name = '') =>
	name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || '?';


const mapTecnico = (t) => ({
	id: String(t.id),
	nombre: t.nombre || t.name || `Técnico ${t.id}`,
	especialidad: t.especialidad || t.area || t.cargo || '',
	correo: t.correo || t.email || '',
	telefono: t.telefono || t.celular || '',
});


const TecnicoPanel = ({ tecnico, solicitudes, initialTab, onClose }) => {
	const dialogRef = useRef(null);
	const [tab, setTab] = useState(initialTab);

	const activas = solicitudes.filter((s) => !CLOSED_STATES.includes(normalize(s.estado))).length;
	const resueltas = solicitudes.length - activas;

	const sorted = useMemo(
		() => [...solicitudes].sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)),
		[solicitudes]
	);

	useEffect(() => {
		const previous = document.activeElement;
		const { overflow } = document.body.style;
		document.body.style.overflow = 'hidden';
		dialogRef.current?.focus();
		return () => {
			document.body.style.overflow = overflow;
			previous?.focus?.();
		};
	}, []);

	const handleKeyDown = (event) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onClose();
			return;
		}
		if (event.key !== 'Tab' || !dialogRef.current) return;
		const focusables = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	const handleTabKeys = (event) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		setTab((current) => (current === 'info' ? 'solicitudes' : 'info'));
	};

	return (
		<div
			className="it-overlay"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<div
				ref={dialogRef}
				className="it-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="it-dialog-title"
				tabIndex={-1}
				onKeyDown={handleKeyDown}
			>
				<header className="it-dialog-header">
					<span className="it-avatar" aria-hidden="true">{getInitials(tecnico.nombre)}</span>
					<div className="it-dialog-heading">
						<h2 id="it-dialog-title">{tecnico.nombre}</h2>
						{tecnico.especialidad && <p>{tecnico.especialidad}</p>}
					</div>
					<button type="button" className="it-close" onClick={onClose} aria-label="Cerrar">
						<FaTimes aria-hidden="true" />
					</button>
				</header>

				<div className="it-tabs" role="tablist" aria-label="Detalle del técnico" onKeyDown={handleTabKeys}>
					<button
						type="button"
						role="tab"
						id="it-tab-info"
						aria-selected={tab === 'info'}
						aria-controls="it-panel-info"
						tabIndex={tab === 'info' ? 0 : -1}
						className={tab === 'info' ? 'is-active' : ''}
						onClick={() => setTab('info')}
					>
						Información
					</button>
					<button
						type="button"
						role="tab"
						id="it-tab-solicitudes"
						aria-selected={tab === 'solicitudes'}
						aria-controls="it-panel-solicitudes"
						tabIndex={tab === 'solicitudes' ? 0 : -1}
						className={tab === 'solicitudes' ? 'is-active' : ''}
						onClick={() => setTab('solicitudes')}
					>
						Solicitudes
						<span className="it-tab-count">{solicitudes.length}</span>
					</button>
				</div>

				<div className="it-dialog-body">
					{tab === 'info' && (
						<div id="it-panel-info" role="tabpanel" aria-labelledby="it-tab-info">
							<div className="it-stats">
								<div>
									<strong>{activas}</strong>
									<span>Activas</span>
								</div>
								<div>
									<strong>{resueltas}</strong>
									<span>Finalizadas</span>
								</div>
								<div>
									<strong>{solicitudes.length}</strong>
									<span>Total</span>
								</div>
							</div>

							<dl className="it-details">
								<div>
									<dt>Especialidad</dt>
									<dd>{getValue(tecnico.especialidad)}</dd>
								</div>
								<div>
									<dt>Correo</dt>
									<dd>
										{tecnico.correo ? (
											<a href={`mailto:${tecnico.correo}`}>
												<FaEnvelope aria-hidden="true" /> {tecnico.correo}
											</a>
										) : (
											'-'
										)}
									</dd>
								</div>
								<div>
									<dt>Teléfono</dt>
									<dd>
										{tecnico.telefono ? (
											<a href={`tel:${tecnico.telefono}`}>
												<FaPhone aria-hidden="true" /> {tecnico.telefono}
											</a>
										) : (
											'-'
										)}
									</dd>
								</div>
								<div>
									<dt>ID de técnico</dt>
									<dd className="it-mono">{tecnico.id}</dd>
								</div>
							</dl>
						</div>
					)}

					{tab === 'solicitudes' && (
						<div id="it-panel-solicitudes" role="tabpanel" aria-labelledby="it-tab-solicitudes">
							{sorted.length === 0 ? (
								<div className="it-empty">
									<FaInbox aria-hidden="true" />
									<strong>Sin solicitudes asignadas</strong>
									<span>Cuando se le asigne una solicitud aparecerá aquí.</span>
								</div>
							) : (
								<ul className="it-request-list">
									{sorted.map((s) => (
										<li key={s.id} className="it-request">
											<div className="it-request-top">
												<span className="it-request-id">#{formatId(s.id)}</span>
												<span className="it-request-date">{formatDate(s.createdAt)}</span>
											</div>
											<p className="it-request-title">{getValue(s.titulo)}</p>
											<div className="it-request-badges">
												<span className={`it-badge it-status-${statusClass(s.estado)}`}>{humanize(s.estado)}</span>
												<span className={`it-badge it-priority-${normalize(s.prioridad)}`}>{humanize(s.prioridad)}</span>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

/* ---------- Página ---------- */

const InfoTecnicos = () => {
	const [tecnicos, setTecnicos] = useState([]);
	const [solicitudes, setSolicitudes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');
	const [panel, setPanel] = useState(null); // { tecnico, tab }

	const cargar = useCallback(async () => {
		setLoading(true);
		setError('');
		const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

		const fetchList = async (path) => {
			const response = await fetch(`${API_URL}${path}`, { headers });
			if (!response.ok) throw new Error('request failed');
			const data = await response.json();
			return Array.isArray(data) ? data : [];
		};

		const [tecResult, solResult] = await Promise.allSettled([
			fetchList(TECNICOS_ENDPOINT),
			fetchList(SOLICITUDES_ENDPOINT),
		]);

		const sols = solResult.status === 'fulfilled' ? solResult.value : [];
		let list = tecResult.status === 'fulfilled' ? tecResult.value.map(mapTecnico) : [];

		/* Si no hay lista de técnicos, se arma con los que ya aparecen en las solicitudes */
		if (list.length === 0) {
			const map = new Map();
			sols.forEach((s) => {
				if (s.tecnicoId && !map.has(String(s.tecnicoId))) {
					map.set(String(s.tecnicoId), mapTecnico({ id: s.tecnicoId, nombre: s.tecnicoNombre }));
				}
			});
			list = [...map.values()];
		}

		if (list.length === 0 && tecResult.status === 'rejected') {
			setError('No se pudo cargar la lista de técnicos.');
		}

		setTecnicos(list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
		setSolicitudes(sols);
		setLoading(false);
	}, []);

	useEffect(() => {
		const timer = window.setTimeout(cargar, 0);
		return () => window.clearTimeout(timer);
	}, [cargar]);

	const solicitudesPorTecnico = useMemo(() => {
		const map = {};
		solicitudes.forEach((s) => {
			if (!s.tecnicoId) return;
			const key = String(s.tecnicoId);
			if (!map[key]) map[key] = [];
			map[key].push(s);
		});
		return map;
	}, [solicitudes]);

	const filtered = useMemo(() => {
		const text = toSearchText(query.trim());
		if (!text) return tecnicos;
		return tecnicos.filter((t) => toSearchText(`${t.nombre} ${t.especialidad}`).includes(text));
	}, [tecnicos, query]);

	const open = (tecnico, tab) => setPanel({ tecnico, tab });

	return (
		<main className="info-tecnicos-page">
			<header className="it-page-header">
				<div>
					<h1>Técnicos de la unidad de soporte</h1>
					<p>Consulta los técnicos disponibles y revisa su información y las solicitudes que tienen asignadas.</p>
				</div>

				<div className="it-search">
					<FaSearch aria-hidden="true" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por nombre o especialidad…"
						aria-label="Buscar técnico"
					/>
				</div>
			</header>

			{error && (
				<div className="it-error" role="alert">
					<span>{error}</span>
					<button type="button" onClick={cargar}>
						<FaRedo aria-hidden="true" /> Reintentar
					</button>
				</div>
			)}

			<section className="it-grid" aria-label="Lista de técnicos" aria-busy={loading}>
				{loading &&
					Array.from({ length: SKELETON_CARDS }, (_, index) => (
						<div className="it-card it-card-skeleton" key={`sk-${index}`} aria-hidden="true">
							<span className="it-skeleton it-skeleton-name" />
							<span className="it-skeleton it-skeleton-role" />
							<span className="it-skeleton it-skeleton-actions" />
						</div>
					))}

				{!loading &&
					filtered.map((tecnico) => {
						const count = (solicitudesPorTecnico[tecnico.id] || []).length;
						return (
							<article className="it-card" key={tecnico.id}>
								<h2 className="it-card-name">{tecnico.nombre}</h2>
								<p className="it-card-role">{tecnico.especialidad || 'Sin especialidad registrada'}</p>
								<div className="it-card-actions">
									<button type="button" className="it-btn it-btn-primary" onClick={() => open(tecnico, 'info')}>
										Ver información
									</button>
									<button type="button" className="it-btn it-btn-outline" onClick={() => open(tecnico, 'solicitudes')}>
										Ver solicitudes
										<span className="it-btn-count" aria-label={`${count} solicitudes`}>{count}</span>
									</button>
								</div>
							</article>
						);
					})}
			</section>

			{!loading && !error && filtered.length === 0 && (
				<div className="it-empty it-empty-page">
					<FaInbox aria-hidden="true" />
					<strong>{query ? 'Ningún técnico coincide con tu búsqueda' : 'Aún no hay técnicos registrados'}</strong>
					{query && (
						<button type="button" className="it-btn it-btn-outline" onClick={() => setQuery('')}>
							Limpiar búsqueda
						</button>
					)}
				</div>
			)}

			{panel && (
				<TecnicoPanel
					key={panel.tecnico.id}
					tecnico={panel.tecnico}
					solicitudes={solicitudesPorTecnico[panel.tecnico.id] || []}
					initialTab={panel.tab}
					onClose={() => setPanel(null)}
				/>
			)}
		</main>
	);
};

export default InfoTecnicos;