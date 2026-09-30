import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	FaCheck,
	FaChevronLeft,
	FaChevronRight,
	FaClock,
	FaInbox,
	FaPlus,
	FaRedo,
	FaSearch,
	FaSort,
	FaSortDown,
	FaSortUp,
	FaSpinner,
	FaTimes,
} from 'react-icons/fa';
import SolicitudModal from '../../Components/Modlas/Solicitudmodal';
import {
	formatDate,
	formatId,
	getValue,
	humanize,
	normalize,
	statusClass,
	toSearchText,
} from '../../utils/Solicitudesutils';
import './SolicitudesRecividas.css';

const API_URL = 'http://localhost:8080/api';
const PAGE_SIZE_OPTIONS = [8, 15, 25];
const SKELETON_ROWS = 6;
const TECNICOS_ENDPOINT = '/usuarios/tecnicos'; // ajusta a tu backend
const CLOSED_STATES = ['resuelta', 'concluida', 'cerrada'];

/* ---------- Helpers ---------- */

const PRIORITY_RANK = { alta: 3, media: 2, baja: 1, 'sin-definir': 0 };

/* Columnas de la tabla: `sortValue` define cómo se ordena cada una */
const COLUMNS = [
	{ key: 'id', label: 'ID', className: 'col-id', sortValue: (s) => Number(s.id) || toSearchText(s.id) },
	{ key: 'titulo', label: 'Título', className: 'col-title', sortValue: (s) => toSearchText(s.titulo) },
	{ key: 'categoria', label: 'Categoría', className: 'col-category', sortValue: (s) => toSearchText(s.categoria) },
	{ key: 'area', label: 'Área', className: 'col-area', sortValue: (s) => toSearchText(s.area) },
	{ key: 'prioridad', label: 'Prioridad', className: 'col-priority', sortValue: (s) => PRIORITY_RANK[normalize(s.prioridad)] ?? -1 },
	{ key: 'estado', label: 'Estado', className: 'col-status', sortValue: (s) => toSearchText(s.estado) },
	{ key: 'solicitante', label: 'Solicitante', className: 'col-requester', sortValue: (s) => toSearchText(s.solicitanteNombre || s.solicitanteId) },
	{ key: 'asignado', label: 'Asignado a', className: 'col-assignee', sortValue: (s) => toSearchText(s.tecnicoNombre || s.tecnicoId) },
	{ key: 'fecha', label: 'Fecha', className: 'col-date', sortValue: (s) => new Date(s.createdAt).getTime() || 0 },
];

/* Opciones únicas para un filtro, tomadas de los datos reales */
const optionsFor = (list, field, labelFn = (value) => value) => {
	const map = new Map();
	list.forEach((item) => {
		const value = item[field];
		if (value) map.set(normalize(value), labelFn(value));
	});
	return [...map].sort((a, b) => a[1].localeCompare(b[1], 'es'));
};

/* Números de página con puntos suspensivos: 1 … 4 5 6 … 12 */
const buildPages = (current, total) => {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages = new Set([1, total, current - 1, current, current + 1]);
	const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
	const result = [];
	sorted.forEach((page, index) => {
		if (index > 0 && page - sorted[index - 1] > 1) result.push(`gap-${page}`);
		result.push(page);
	});
	return result;
};

const INITIAL_FILTERS = { search: '', estado: '', categoria: '', prioridad: '' };

/* ---------- Componente ---------- */

const SolicitudesRecibidas = () => {
	const navigate = useNavigate();
	const [solicitudes, setSolicitudes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [filters, setFilters] = useState(INITIAL_FILTERS);
	const [sort, setSort] = useState({ key: 'fecha', direction: 'desc' });
	const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
	const [currentPage, setCurrentPage] = useState(1);
	const [selected, setSelected] = useState(null);
	const [tecnicosApi, setTecnicosApi] = useState([]);
	const [toast, setToast] = useState('');

	const authHeaders = useCallback(
		() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
		[]
	);

	const cargarSolicitudes = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const response = await fetch(`${API_URL}/solicitudes/SolicitudesTecnicas`, {
				headers: authHeaders(),
			});
			if (!response.ok) throw new Error('No se pudieron cargar las solicitudes.');
			const data = await response.json();
			setSolicitudes(Array.isArray(data) ? data : []);
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, [authHeaders]);

	useEffect(() => {
		const timer = window.setTimeout(cargarSolicitudes, 0);
		return () => window.clearTimeout(timer);
	}, [cargarSolicitudes]);

	/* Lista de técnicos (si el endpoint falla, se usan los que ya aparecen en las solicitudes) */
	useEffect(() => {
		let cancelled = false;
		fetch(`${API_URL}${TECNICOS_ENDPOINT}`, { headers: authHeaders() })
			.then((response) => (response.ok ? response.json() : []))
			.then((data) => {
				if (!cancelled && Array.isArray(data)) setTecnicosApi(data);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [authHeaders]);

	/* El aviso de éxito desaparece solo */
	useEffect(() => {
		if (!toast) return undefined;
		const timer = window.setTimeout(() => setToast(''), 3500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	/* Filtros */
	const updateFilter = (key, value) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
		setCurrentPage(1);
	};

	const toggleStatusFilter = (value) => {
		setFilters((prev) => ({ ...prev, estado: prev.estado === value ? '' : value }));
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setFilters(INITIAL_FILTERS);
		setCurrentPage(1);
	};

	const hasActiveFilters = Object.values(filters).some(Boolean);

	const estadoOptions = useMemo(() => optionsFor(solicitudes, 'estado', humanize), [solicitudes]);
	const categoriaOptions = useMemo(() => optionsFor(solicitudes, 'categoria'), [solicitudes]);
	const prioridadOptions = useMemo(() => optionsFor(solicitudes, 'prioridad', humanize), [solicitudes]);

	/* Orden */
	const handleSort = (key) => {
		setSort((prev) =>
			prev.key === key
				? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
				: { key, direction: 'asc' }
		);
		setCurrentPage(1);
	};

	const processed = useMemo(() => {
		const query = toSearchText(filters.search.trim());
		const filtered = solicitudes.filter((s) => {
			if (filters.estado && normalize(s.estado) !== filters.estado) return false;
			if (filters.categoria && normalize(s.categoria) !== filters.categoria) return false;
			if (filters.prioridad && normalize(s.prioridad) !== filters.prioridad) return false;
			if (!query) return true;
			const haystack = toSearchText(
				[
					formatId(s.id),
					s.titulo,
					s.categoria,
					s.subcategoria,
					s.solicitanteNombre || s.solicitanteId,
					s.tecnicoNombre || s.tecnicoId,
				].join(' ')
			);
			return haystack.includes(query);
		});

		const column = COLUMNS.find((c) => c.key === sort.key);
		if (!column) return filtered;
		const factor = sort.direction === 'asc' ? 1 : -1;
		return [...filtered].sort((a, b) => {
			const va = column.sortValue(a);
			const vb = column.sortValue(b);
			if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
			return String(va).localeCompare(String(vb), 'es', { numeric: true }) * factor;
		});
	}, [solicitudes, filters, sort]);

	/* Paginación */
	const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const visibleSolicitudes = useMemo(() => {
		const start = (safePage - 1) * pageSize;
		return processed.slice(start, start + pageSize);
	}, [processed, safePage, pageSize]);

	const rangeStart = processed.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const rangeEnd = rangeStart === 0 ? 0 : rangeStart + visibleSolicitudes.length - 1;

	/* Resumen */
	const countByStatus = (status) => solicitudes.filter((s) => normalize(s.estado) === status).length;
	const resueltasHoy = solicitudes.filter((s) => {
		if (!['resuelta', 'concluida'].includes(normalize(s.estado)) || !s.updatedAt) return false;
		return new Date(s.updatedAt).toDateString() === new Date().toDateString();
	}).length;

	const summaryCards = [
		{ label: 'Nuevas', value: countByStatus('nueva'), color: 'new', icon: FaPlus, filter: 'nueva' },
		{ label: 'En proceso', value: countByStatus('en-proceso'), color: 'process', icon: FaSpinner, filter: 'en-proceso' },
		{ label: 'Pendientes', value: countByStatus('pendiente'), color: 'pending', icon: FaClock, filter: 'pendiente' },
		{ label: 'Resueltas hoy', value: resueltasHoy, color: 'resolved', icon: FaCheck },
	];

	/* Datos para el modal de asignación */
	const tecnicos = useMemo(() => {
		const base = new Map();
		tecnicosApi.forEach((t) => {
			const nombre = [t.nombre || t.name, t.apellido].filter(Boolean).join(' ');
			base.set(String(t.id), { id: String(t.id), nombre: nombre || `Técnico ${t.id}` });
		});
		solicitudes.forEach((s) => {
			if (s.tecnicoId && !base.has(String(s.tecnicoId))) {
				base.set(String(s.tecnicoId), {
					id: String(s.tecnicoId),
					nombre: s.tecnicoNombre || String(s.tecnicoId),
				});
			}
		});
		return [...base.values()]
			.map((t) => ({
				...t,
				activas: solicitudes.filter(
					(s) => String(s.tecnicoId) === t.id && !CLOSED_STATES.includes(normalize(s.estado))
				).length,
			}))
			.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
	}, [tecnicosApi, solicitudes]);

	/* Modal */
	const openRequest = (solicitud) => setSelected(solicitud);

	const guardarAsignacion = async ({ payload, local }) => {
		const response = await fetch(`${API_URL}/solicitudes/${selected.id}/asignacion`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', ...authHeaders() },
			body: JSON.stringify(payload),
		});
		if (!response.ok) throw new Error('No se pudieron guardar los cambios. Intenta de nuevo.');
		const savedId = selected.id;
		const updated = await response.json();
		setSolicitudes((prev) =>
			prev.map((s) => (s.id === savedId ? { ...s, ...updated, ...local, estado: updated.estado || s.estado } : s))
		);
		setSelected(null);
		setToast(`Solicitud ${formatId(savedId)} actualizada`);
	};

	const renderSortIcon = (key) => {
		if (sort.key !== key) return <FaSort className="sort-icon" aria-hidden="true" />;
		return sort.direction === 'asc' ? (
			<FaSortUp className="sort-icon active" aria-hidden="true" />
		) : (
			<FaSortDown className="sort-icon active" aria-hidden="true" />
		);
	};

	const ariaSort = (key) =>
		sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

	const isEmpty = !loading && !error && visibleSolicitudes.length === 0;

	return (
		<main className="received-requests-page">
			{/* Resumen */}
			<section className="requests-summary" aria-label="Resumen de solicitudes">
				{summaryCards.map((card) => {
					const Icon = card.icon;
					const content = (
						<>
							<span className="summary-label">{card.label}</span>
							<div className="summary-value-row">
								<strong>{loading ? '–' : card.value}</strong>
								<span className={`summary-dot summary-dot-${card.color}`} aria-hidden="true">
									<Icon />
								</span>
							</div>
						</>
					);

					return card.filter ? (
						<button
							type="button"
							key={card.label}
							className={`summary-card summary-card-action ${filters.estado === card.filter ? 'is-selected' : ''}`}
							aria-pressed={filters.estado === card.filter}
							onClick={() => toggleStatusFilter(card.filter)}
							title={`Filtrar por ${card.label.toLowerCase()}`}
						>
							{content}
						</button>
					) : (
						<article className="summary-card" key={card.label}>
							{content}
						</article>
					);
				})}
			</section>

			{/* Filtros */}
			<section className="requests-filters" aria-label="Filtros de solicitudes">
				<div className="search-field">
					<FaSearch aria-hidden="true" />
					<input
						type="search"
						value={filters.search}
						onChange={(event) => updateFilter('search', event.target.value)}
						placeholder="Buscar por título, ID, solicitante…"
						aria-label="Buscar solicitudes"
					/>
				</div>

				<div className="filter-fields">
					<label>
						<span>Estado</span>
						<select value={filters.estado} onChange={(e) => updateFilter('estado', e.target.value)}>
							<option value="">Todos</option>
							{estadoOptions.map(([value, label]) => (
								<option key={value} value={value}>{label}</option>
							))}
						</select>
					</label>
					<label>
						<span>Categoría</span>
						<select value={filters.categoria} onChange={(e) => updateFilter('categoria', e.target.value)}>
							<option value="">Todas</option>
							{categoriaOptions.map(([value, label]) => (
								<option key={value} value={value}>{label}</option>
							))}
						</select>
					</label>
					<label>
						<span>Prioridad</span>
						<select value={filters.prioridad} onChange={(e) => updateFilter('prioridad', e.target.value)}>
							<option value="">Todas</option>
							{prioridadOptions.map(([value, label]) => (
								<option key={value} value={value}>{label}</option>
							))}
						</select>
					</label>
					{hasActiveFilters && (
						<button type="button" className="clear-filters-button" onClick={clearFilters}>
							<FaTimes aria-hidden="true" /> Limpiar
						</button>
					)}
				</div>

				<button className="new-request-button" type="button" onClick={() => navigate('/nueva-solicitud')}>
					<FaPlus aria-hidden="true" /> Nueva solicitud
				</button>
			</section>

			{/* Tabla */}
			<section className="requests-table-container">
				{error && (
					<div className="requests-error" role="alert">
						<span>{error}</span>
						<button type="button" onClick={cargarSolicitudes}>
							<FaRedo aria-hidden="true" /> Reintentar
						</button>
					</div>
				)}

				<div className="requests-table-scroll">
					<table className="requests-table" aria-busy={loading}>
						<thead>
							<tr>
								{COLUMNS.map((column) => (
									<th
										key={column.key}
										className={column.className}
										scope="col"
										aria-sort={ariaSort(column.key)}
									>
										<button type="button" className="sort-button" onClick={() => handleSort(column.key)}>
											{column.label}
											{renderSortIcon(column.key)}
										</button>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{loading &&
								Array.from({ length: SKELETON_ROWS }, (_, index) => (
									<tr className="skeleton-row" key={`skeleton-${index}`} aria-hidden="true">
										<td colSpan={COLUMNS.length}>
											<span className="skeleton-bar" />
										</td>
									</tr>
								))}

							{isEmpty && (
								<tr className="empty-row">
									<td colSpan={COLUMNS.length}>
										<div className="empty-table-state">
											<FaInbox aria-hidden="true" />
											<strong>
												{hasActiveFilters ? 'Ninguna solicitud coincide con los filtros' : 'Aún no hay solicitudes'}
											</strong>
											{hasActiveFilters ? (
												<button type="button" onClick={clearFilters}>Limpiar filtros</button>
											) : (
												<button type="button" onClick={() => navigate('/nueva-solicitud')}>Crear solicitud</button>
											)}
										</div>
									</td>
								</tr>
							)}

							{!loading &&
								visibleSolicitudes.map((solicitud) => {
									const asignado =
										solicitud.tecnicoNombre ||
										tecnicos.find((tecnico) => tecnico.id === String(solicitud.tecnicoId))?.nombre ||
										solicitud.tecnicoId;
									return (
										<tr
											key={solicitud.id}
											className="request-row"
											tabIndex={0}
											aria-haspopup="dialog"
											onClick={() => openRequest(solicitud)}
											onKeyDown={(event) => {
												if (event.key === 'Enter') openRequest(solicitud);
											}}
										>
											<td className="col-id" data-label="ID" title={formatId(solicitud.id)}>
												<span className="request-id">{formatId(solicitud.id)}</span>
											</td>
											<td className="col-title request-title-cell" data-label="Título" title={solicitud.titulo}>
												{getValue(solicitud.titulo)}
											</td>
											<td className="col-category" data-label="Categoría">{getValue(solicitud.categoria)}</td>
											<td className="col-area cell-muted" data-label="Área">
												{getValue(solicitud.area)}
											</td>
											<td className="col-priority" data-label="Prioridad">
												<span className={`request-badge priority-${normalize(solicitud.prioridad)}`}>
													{humanize(solicitud.prioridad)}
												</span>
											</td>
											<td className="col-status" data-label="Estado">
												<span className={`request-badge status-${statusClass(solicitud.estado)}`}>
													{humanize(solicitud.estado)}
												</span>
											</td>
											<td className="col-requester" data-label="Solicitante">
												{getValue(solicitud.solicitanteNombre || solicitud.solicitanteId)}
											</td>
											<td className={`col-assignee ${asignado ? '' : 'cell-muted'}`} data-label="Asignado a">
												{asignado || 'Sin asignar'}
											</td>
											<td className="col-date cell-muted" data-label="Fecha">{formatDate(solicitud.createdAt)}</td>
										</tr>
									);
								})}
						</tbody>
					</table>
				</div>

				{/* Paginación */}
				<footer className="requests-pagination">
					<div className="pagination-info">
						<span aria-live="polite">
							Mostrando <strong>{rangeStart}–{rangeEnd}</strong> de <strong>{processed.length}</strong> solicitudes
							{hasActiveFilters && ` (${solicitudes.length} en total)`}
						</span>
						<label className="page-size">
							<span>Por página</span>
							<select
								value={pageSize}
								onChange={(event) => {
									setPageSize(Number(event.target.value));
									setCurrentPage(1);
								}}
							>
								{PAGE_SIZE_OPTIONS.map((size) => (
									<option key={size} value={size}>{size}</option>
								))}
							</select>
						</label>
					</div>

					{processed.length > 0 && (
						<nav aria-label="Paginación de solicitudes">
							<button
								type="button"
								className="page-step"
								disabled={safePage === 1}
								onClick={() => setCurrentPage(safePage - 1)}
							>
								<FaChevronLeft aria-hidden="true" /> <span>Anterior</span>
							</button>
							{buildPages(safePage, totalPages).map((page) =>
								typeof page === 'string' ? (
									<span className="page-gap" key={page} aria-hidden="true">…</span>
								) : (
									<button
										className={page === safePage ? 'active' : ''}
										key={page}
										type="button"
										aria-current={page === safePage ? 'page' : undefined}
										onClick={() => setCurrentPage(page)}
									>
										{page}
									</button>
								)
							)}
							<button
								type="button"
								className="page-step"
								disabled={safePage === totalPages}
								onClick={() => setCurrentPage(safePage + 1)}
							>
								<span>Siguiente</span> <FaChevronRight aria-hidden="true" />
							</button>
						</nav>
					)}
				</footer>
			</section>

			{selected && (
				<SolicitudModal
					key={selected.id}
					solicitud={selected}
					tecnicos={tecnicos}
					onClose={() => setSelected(null)}
					onSave={guardarAsignacion}
				/>
			)}

			{toast && (
				<div className="requests-toast" role="status">
					<FaCheck aria-hidden="true" />
					<span>{toast}</span>
				</div>
			)}
		</main>
	);
};

export default SolicitudesRecibidas;