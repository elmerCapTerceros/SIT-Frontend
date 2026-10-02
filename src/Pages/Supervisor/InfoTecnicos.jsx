import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
	FaCheck,
	FaClipboardList,
	FaEnvelope,
	FaIdBadge,
	FaInbox,
	FaPhone,
	FaRedo,
	FaRegCopy,
	FaSearch,
	FaTimes,
	FaUsers,
} from 'react-icons/fa';
import { formatDate, formatId, getValue, humanize, normalize, statusClass, toSearchText } from '../../utils/Solicitudesutils';
import './InfoTecnicos.css';

const API_URL = 'http://localhost:8080/api';
const TECNICOS_ENDPOINT = '/usuarios/tecnicos'; // Backend: endpoint para obtener técnicos.
const SOLICITUDES_ENDPOINT = '/solicitudes/SolicitudesTecnicas';

const CLOSED_STATES = ['resuelta', 'concluida', 'cerrada'];
const SKELETON_CARDS = 6;
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

const LOAD_CAPACITY = 6;
const LOAD_LEVELS = [
	{ max: 0, key: 'libre', label: 'Sin carga activa' },
	{ max: 3, key: 'normal', label: 'Carga moderada' },
	{ max: Infinity, key: 'alta', label: 'Carga alta' },
];

const FILTERS = [
	{ id: 'todos', label: 'Todos', test: () => true },
	{ id: 'activos', label: 'Con carga activa', test: (t) => t.activas > 0 },
	{ id: 'libres', label: 'Sin carga', test: (t) => t.activas === 0 },
];

const byName = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
const SORTS = [
	{ id: 'nombre', label: 'Nombre (A-Z)', compare: byName },
	{ id: 'mayor', label: 'Mayor carga', compare: (a, b) => b.activas - a.activas || byName(a, b) },
	{ id: 'menor', label: 'Menor carga', compare: (a, b) => a.activas - b.activas || byName(a, b) },
];

const REQUEST_FILTERS = [
	{ id: 'todas', label: 'Todas' },
	{ id: 'activas', label: 'Activas' },
	{ id: 'finalizadas', label: 'Finalizadas' },
];

const PANEL_TABS = [
	{ id: 'info', label: 'Información' },
	{ id: 'solicitudes', label: 'Solicitudes' },
];

const isActive = (solicitud) => !CLOSED_STATES.includes(normalize(solicitud.estado));

const getLoadLevel = (activas) => LOAD_LEVELS.find((level) => activas <= level.max);

const getInitials = (name = '') =>
	name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || '?';

const getHue = (seed = '') => {
	let hash = 0;
	for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 360;
	return 185 + (hash % 60);
};

const mapTecnico = (t) => ({
	id: String(t.id),
	nombre: t.nombre || t.name || `Técnico ${t.id}`,
	especialidad: t.especialidad || t.area || t.cargo || '',
	correo: t.correo || t.email || '',
	telefono: t.telefono || t.celular || '',
});

const timeOf = (value) => new Date(value).getTime() || 0;

const useTecnicosData = () => {
	const [state, setState] = useState({ tecnicos: [], solicitudes: [], loading: true, error: '' });
	const abortRef = useRef(null);

	const cargar = useCallback(async () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setState((prev) => ({ ...prev, loading: true, error: '' }));

		const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
		const fetchList = async (path) => {
			const response = await fetch(`${API_URL}${path}`, { headers, signal: controller.signal });
			if (!response.ok) throw new Error('request failed');
			const data = await response.json();
			return Array.isArray(data) ? data : [];
		};

		const [tecResult, solResult] = await Promise.allSettled([
			fetchList(TECNICOS_ENDPOINT),
			fetchList(SOLICITUDES_ENDPOINT),
		]);

		if (controller.signal.aborted) return;

		const solicitudes = solResult.status === 'fulfilled' ? solResult.value : [];
		let tecnicos = tecResult.status === 'fulfilled' ? tecResult.value.map(mapTecnico) : [];

		if (tecnicos.length === 0) {
			const map = new Map();
			solicitudes.forEach((s) => {
				if (s.tecnicoId && !map.has(String(s.tecnicoId))) {
					map.set(String(s.tecnicoId), mapTecnico({ id: s.tecnicoId, nombre: s.tecnicoNombre }));
				}
			});
			tecnicos = [...map.values()];
		}

		const failed = tecnicos.length === 0 && tecResult.status === 'rejected';
		setState({
			tecnicos,
			solicitudes,
			loading: false,
			error: failed ? 'No se pudo cargar la lista de técnicos. Revisa tu conexión e inténtalo de nuevo.' : '',
		});
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

const useDialog = (dialogRef, onClose) => {
	useEffect(() => {
		const previous = document.activeElement;
		const { overflow } = document.body.style;
		document.body.style.overflow = 'hidden';
		dialogRef.current?.focus();
		return () => {
			document.body.style.overflow = overflow;
			previous?.focus?.();
		};
	}, [dialogRef]);

	return (event) => {
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
		const active = document.activeElement;

		if (event.shiftKey && (active === first || active === dialogRef.current)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	};
};

const Avatar = ({ tecnico, size = 'md' }) => (
	<span className={`it-avatar it-avatar-${size}`} style={{ '--hue': getHue(tecnico.id) }} aria-hidden="true">
		{getInitials(tecnico.nombre)}
	</span>
);

const LoadBadge = ({ activas }) => {
	const level = getLoadLevel(activas);
	return (
		<span className={`it-load it-load-${level.key}`}>
			<span className="it-load-dot" aria-hidden="true" />
			{level.label}
		</span>
	);
};

const LoadMeter = ({ activas, finalizadas }) => {
	const level = getLoadLevel(activas);
	const pct = Math.min(activas / LOAD_CAPACITY, 1) * 100;
	return (
		<div className="it-workload">
			<div className="it-meter" role="img" aria-label={`${activas} solicitudes activas`}>
				<span className={`it-meter-fill is-${level.key}`} style={{ '--w': `${pct}%` }} />
			</div>
			<p>
				<strong>{activas}</strong> {activas === 1 ? 'activa' : 'activas'}
				<span aria-hidden="true"> · </span>
				<span>{finalizadas} {finalizadas === 1 ? 'finalizada' : 'finalizadas'}</span>
			</p>
		</div>
	);
};

const CopyButton = ({ value, label }) => {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return undefined;
		const timer = window.setTimeout(() => setCopied(false), 1600);
		return () => window.clearTimeout(timer);
	}, [copied]);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
		} catch {
		}
	};

	return (
		<button
			type="button"
			className={`it-copy${copied ? ' is-copied' : ''}`}
			onClick={copy}
			aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
			title={copied ? 'Copiado' : `Copiar ${label}`}
		>
			{copied ? <FaCheck aria-hidden="true" /> : <FaRegCopy aria-hidden="true" />}
		</button>
	);
};

const ContactRow = ({ label, value, href, icon: Icon }) => (
	<div className="it-detail-row">
		<dt>{label}</dt>
		<dd>
			{value ? (
				<>
					<a href={href}>
						<Icon aria-hidden="true" /> {value}
					</a>
					<CopyButton value={value} label={label.toLowerCase()} />
				</>
			) : (
				<span className="it-muted">No registrado</span>
			)}
		</dd>
	</div>
);

const Chip = ({ active, count, children, ...props }) => (
	<button type="button" className={`it-chip${active ? ' is-active' : ''}`} aria-pressed={active} {...props}>
		{children}
		{count !== undefined && <span className="it-chip-count">{count}</span>}
	</button>
);

const TecnicoPanel = ({ tecnico, initialTab, onClose }) => {
	const uid = useId();
	const dialogRef = useRef(null);
	const [tab, setTab] = useState(initialTab);
	const [statusFilter, setStatusFilter] = useState('todas');
	const handleKeyDown = useDialog(dialogRef, onClose);

	const sorted = useMemo(
		() => [...tecnico.solicitudes].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt)),
		[tecnico.solicitudes]
	);

	const shown = useMemo(
		() => (statusFilter === 'todas' ? sorted : sorted.filter((s) => (statusFilter === 'activas') === isActive(s))),
		[sorted, statusFilter]
	);

	const requestCounts = { todas: tecnico.total, activas: tecnico.activas, finalizadas: tecnico.finalizadas };

	const handleTabKeys = (event) => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const next = tab === 'info' ? 'solicitudes' : 'info';
		setTab(next);
		document.getElementById(`${uid}-tab-${next}`)?.focus();
	};

	return createPortal(
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
				aria-labelledby={`${uid}-title`}
				tabIndex={-1}
				onKeyDown={handleKeyDown}
			>
				<header className="it-dialog-header">
					<Avatar tecnico={tecnico} size="lg" />
					<div className="it-dialog-heading">
						<h2 id={`${uid}-title`}>{tecnico.nombre}</h2>
						<p>{tecnico.especialidad || 'Sin especialidad registrada'}</p>
						<LoadBadge activas={tecnico.activas} />
					</div>
					<button type="button" className="it-close" onClick={onClose} aria-label="Cerrar panel">
						<FaTimes aria-hidden="true" />
					</button>
				</header>

				<div className="it-tabs" role="tablist" aria-label="Detalle del técnico" onKeyDown={handleTabKeys}>
					{PANEL_TABS.map(({ id, label }) => (
						<button
							key={id}
							type="button"
							role="tab"
							id={`${uid}-tab-${id}`}
							aria-selected={tab === id}
							aria-controls={`${uid}-panel-${id}`}
							tabIndex={tab === id ? 0 : -1}
							className={tab === id ? 'is-active' : ''}
							onClick={() => setTab(id)}
						>
							{label}
							{id === 'solicitudes' && <span className="it-tab-count">{tecnico.total}</span>}
						</button>
					))}
				</div>

				<div className="it-dialog-body">
					{tab === 'info' && (
						<div id={`${uid}-panel-info`} role="tabpanel" aria-labelledby={`${uid}-tab-info`}>
							<div className="it-stats">
								<div>
									<strong>{tecnico.activas}</strong>
									<span>Activas</span>
								</div>
								<div>
									<strong>{tecnico.finalizadas}</strong>
									<span>Finalizadas</span>
								</div>
								<div>
									<strong>{tecnico.total}</strong>
									<span>Total</span>
								</div>
							</div>

							<dl className="it-details">
								<div className="it-detail-row">
									<dt>Especialidad</dt>
									<dd>{getValue(tecnico.especialidad)}</dd>
								</div>
								<ContactRow label="Correo" value={tecnico.correo} href={`mailto:${tecnico.correo}`} icon={FaEnvelope} />
								<ContactRow label="Teléfono" value={tecnico.telefono} href={`tel:${tecnico.telefono}`} icon={FaPhone} />
								<div className="it-detail-row">
									<dt>ID de técnico</dt>
									<dd className="it-mono">{tecnico.id}</dd>
								</div>
							</dl>
						</div>
					)}

					{tab === 'solicitudes' && (
						<div id={`${uid}-panel-solicitudes`} role="tabpanel" aria-labelledby={`${uid}-tab-solicitudes`}>
							{tecnico.total > 0 && (
								<div className="it-chips it-chips-compact" role="group" aria-label="Filtrar solicitudes por estado">
									{REQUEST_FILTERS.map(({ id, label }) => (
										<Chip key={id} active={statusFilter === id} count={requestCounts[id]} onClick={() => setStatusFilter(id)}>
											{label}
										</Chip>
									))}
								</div>
							)}

							{shown.length === 0 ? (
								<div className="it-empty">
									<FaInbox aria-hidden="true" />
									<strong>{tecnico.total === 0 ? 'Sin solicitudes asignadas' : 'No hay solicitudes en este estado'}</strong>
									<span>
										{tecnico.total === 0
											? 'Cuando se le asigne una solicitud aparecerá aquí.'
											: 'Prueba con otro filtro para ver el resto.'}
									</span>
								</div>
							) : (
								<ul className="it-request-list">
									{shown.map((s, i) => (
										<li key={s.id} className="it-request" style={{ '--i': Math.min(i, 10) }}>
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
		</div>,
		document.body
	);
};

const TecnicoCard = ({ tecnico, index, onOpen }) => {
	const level = getLoadLevel(tecnico.activas);
	return (
		<article className={`it-card it-card-${level.key}`} style={{ '--i': Math.min(index, 8) }}>
			<div className="it-card-head">
				<span className="it-avatar-wrap">
					<Avatar tecnico={tecnico} />
					<span className={`it-avatar-dot it-dot-${level.key}`} aria-hidden="true" />
				</span>
				<div className="it-card-id">
					<h2 className="it-card-name">{tecnico.nombre}</h2>
					<p className="it-card-role">{tecnico.especialidad || 'Sin especialidad registrada'}</p>
				</div>
			</div>

			<LoadBadge activas={tecnico.activas} />
			<LoadMeter activas={tecnico.activas} finalizadas={tecnico.finalizadas} />

			<div className="it-card-actions">
				<button type="button" className="it-btn it-btn-primary" onClick={() => onOpen(tecnico.id, 'info')}>
					<FaIdBadge aria-hidden="true" /> Ver información
				</button>
				<button type="button" className="it-btn it-btn-outline" onClick={() => onOpen(tecnico.id, 'solicitudes')}>
					<FaClipboardList aria-hidden="true" /> Ver solicitudes
					<span className="it-btn-count" aria-label={`${tecnico.total} solicitudes`}>{tecnico.total}</span>
				</button>
			</div>
		</article>
	);
};

const SkeletonCard = () => (
	<div className="it-card it-card-skeleton" aria-hidden="true">
		<div className="it-card-head">
			<span className="it-skeleton it-skeleton-avatar" />
			<div className="it-card-id">
				<span className="it-skeleton it-skeleton-name" />
				<span className="it-skeleton it-skeleton-role" />
			</div>
		</div>
		<span className="it-skeleton it-skeleton-meter" />
		<span className="it-skeleton it-skeleton-actions" />
	</div>
);

const InfoTecnicos = () => {
	const { tecnicos, solicitudes, loading, error, cargar } = useTecnicosData();
	const [query, setQuery] = useState('');
	const [filter, setFilter] = useState('todos');
	const [sort, setSort] = useState('nombre');
	const [panel, setPanel] = useState(null);

	const enriched = useMemo(() => {
		const byTecnico = new Map();
		solicitudes.forEach((s) => {
			if (!s.tecnicoId) return;
			const key = String(s.tecnicoId);
			if (!byTecnico.has(key)) byTecnico.set(key, []);
			byTecnico.get(key).push(s);
		});

		return tecnicos.map((t) => {
			const items = byTecnico.get(t.id) ?? [];
			const activas = items.filter(isActive).length;
			return { ...t, solicitudes: items, activas, finalizadas: items.length - activas, total: items.length };
		});
	}, [tecnicos, solicitudes]);

	const filterCounts = useMemo(
		() => Object.fromEntries(FILTERS.map(({ id, test }) => [id, enriched.filter(test).length])),
		[enriched]
	);

	const visible = useMemo(() => {
		const text = toSearchText(query.trim());
		const test = FILTERS.find((f) => f.id === filter).test;
		const compare = SORTS.find((s) => s.id === sort).compare;
		return enriched
			.filter((t) => test(t) && (!text || toSearchText(`${t.nombre} ${t.especialidad}`).includes(text)))
			.sort(compare);
	}, [enriched, query, filter, sort]);

	const selected = panel ? enriched.find((t) => t.id === panel.id) : null;
	const hasFilters = Boolean(query.trim()) || filter !== 'todos';
	const clearFilters = () => {
		setQuery('');
		setFilter('todos');
	};

	return (
		<main className="info-tecnicos-page">
			<header className="it-page-header">
				<span className="it-page-icon" aria-hidden="true">
					<FaUsers />
				</span>
				<div>
					<h1>Equipo de soporte técnico</h1>
					<p>Revisa la disponibilidad de cada técnico y las solicitudes que tiene asignadas.</p>
				</div>
			</header>

			<div className="it-toolbar">
				<div className="it-search">
					<FaSearch aria-hidden="true" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por nombre o especialidad"
						aria-label="Buscar técnico"
					/>
					{query && (
						<button type="button" className="it-search-clear" onClick={() => setQuery('')} aria-label="Borrar búsqueda">
							<FaTimes aria-hidden="true" />
						</button>
					)}
				</div>

				<div className="it-chips" role="group" aria-label="Filtrar técnicos por carga">
					{FILTERS.map(({ id, label }) => (
						<Chip key={id} active={filter === id} count={loading ? undefined : filterCounts[id]} onClick={() => setFilter(id)}>
							{label}
						</Chip>
					))}
				</div>

				<label className="it-sort">
					<span>Ordenar por</span>
					<select value={sort} onChange={(event) => setSort(event.target.value)}>
						{SORTS.map(({ id, label }) => (
							<option key={id} value={id}>{label}</option>
						))}
					</select>
				</label>
			</div>

			{error && (
				<div className="it-error" role="alert">
					<span>{error}</span>
					<button type="button" onClick={cargar}>
						<FaRedo aria-hidden="true" /> Reintentar
					</button>
				</div>
			)}

			<p className="it-result-count" aria-live="polite">
				{!loading && !error && `Mostrando ${visible.length} de ${enriched.length} técnicos`}
			</p>

			<section className="it-grid" aria-label="Lista de técnicos" aria-busy={loading}>
				{loading && Array.from({ length: SKELETON_CARDS }, (_, index) => <SkeletonCard key={`sk-${index}`} />)}

				{!loading &&
					visible.map((tecnico, index) => (
						<TecnicoCard
							key={tecnico.id}
							tecnico={tecnico}
							index={index}
							onOpen={(id, tab) => setPanel({ id, tab })}
						/>
					))}
			</section>

			{!loading && !error && visible.length === 0 && (
				<div className="it-empty it-empty-page">
					<FaInbox aria-hidden="true" />
					<strong>{hasFilters ? 'Ningún técnico coincide con los filtros' : 'Aún no hay técnicos registrados'}</strong>
					{hasFilters && (
						<button type="button" className="it-btn it-btn-outline" onClick={clearFilters}>
							Limpiar filtros
						</button>
					)}
				</div>
			)}

			{selected && <TecnicoPanel key={selected.id} tecnico={selected} initialTab={panel.tab} onClose={() => setPanel(null)} />}
		</main>
	);
};

export default InfoTecnicos;