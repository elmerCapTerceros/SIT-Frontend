import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaClock, FaEllipsisV, FaPlus, FaSpinner } from 'react-icons/fa';
import './SolicitudesRecividas.css';

const PAGE_SIZE = 8;
const API_URL = 'http://localhost:8080/api';

const getValue = (value) => value || '-';

const normalize = (value) => value?.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-') || '';

const statusClass = (value) => (normalize(value) === 'concluida' ? 'resuelta' : normalize(value));

const SolicitudesRecibidas = () => {
	const navigate = useNavigate();
	const [solicitudes, setSolicitudes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	const cargarSolicitudes = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const response = await fetch(`${API_URL}/solicitudes/SolicitudesTecnicas`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
			});
			if (!response.ok) throw new Error('No se pudieron cargar las solicitudes.');
			setSolicitudes(await response.json());
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const timer = window.setTimeout(cargarSolicitudes, 0);
		return () => window.clearTimeout(timer);
	}, [cargarSolicitudes]);

	const totalPages = Math.ceil(solicitudes.length / PAGE_SIZE);
	const visibleSolicitudes = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return solicitudes.slice(start, start + PAGE_SIZE);
	}, [currentPage, solicitudes]);

	const nuevas = solicitudes.filter((solicitud) => normalize(solicitud.estado) === 'nueva').length;
	const enProceso = solicitudes.filter((solicitud) => normalize(solicitud.estado) === 'en-proceso').length;
	const pendientes = solicitudes.filter((solicitud) => normalize(solicitud.estado) === 'pendiente').length;
	const resueltasHoy = solicitudes.filter((solicitud) => {
		if (!['resuelta', 'concluida'].includes(normalize(solicitud.estado)) || !solicitud.updatedAt) return false;
		return new Date(solicitud.updatedAt).toDateString() === new Date().toDateString();
	}).length;

	const summaryCards = [
		{ label: 'Nuevas', value: nuevas, color: 'new', icon: FaPlus },
		{ label: 'En Proceso', value: enProceso, color: 'process', icon: FaSpinner },
		{ label: 'Pendientes', value: pendientes, color: 'pending', icon: FaClock },
		{ label: 'Resueltas hoy', value: resueltasHoy, color: 'resolved', icon: FaCheck },
	];

	const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

	return (
		<main className="received-requests-page">
			<section className="requests-summary" aria-label="Resumen de solicitudes">
				{summaryCards.map((card) => (
					<article className="summary-card" key={card.label}>
						<span className="summary-label">{card.label}</span>
						<div className="summary-value-row">
							<strong>{card.value}</strong>
							<span className={`summary-dot summary-dot-${card.color}`} aria-hidden="true">
								<card.icon />
							</span>
						</div>
					</article>
				))}
			</section>

			<section className="requests-filters" aria-label="Filtros de solicitudes">
				<div className="filter-fields">
					<label>
						Estado
						<select defaultValue="" aria-label="Filtrar por estado">
							<option value="">Estado</option>
						</select>
					</label>
					<label>
						Categoría
						<select defaultValue="" aria-label="Filtrar por categoría">
							<option value="">Categoría</option>
						</select>
					</label>
					<label>
						Prioridad
						<select defaultValue="" aria-label="Filtrar por prioridad">
							<option value="">Prioridad</option>
						</select>
					</label>
				</div>
				<button className="new-request-button" type="button" onClick={() => navigate('/nueva-solicitud')}>
					<FaPlus aria-hidden="true" /> Nueva Solicitud
				</button>
			</section>

			<section className="requests-table-container">
				{error && <p className="requests-error">{error}</p>}
				{loading && <p className="requests-loading">Cargando solicitudes...</p>}
				<div className="requests-table-scroll">
					<table className="requests-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Título</th>
								<th>Categoría</th>
								<th>Subcategoría</th>
								<th>Prioridad</th>
								<th>Estado</th>
								<th>Solicitante</th>
								<th>Asignado a</th>
								<th>Fecha</th>
								<th>Acción</th>
							</tr>
						</thead>
						<tbody>
							{!loading && visibleSolicitudes.length === 0 ? (
								<tr>
									<td className="empty-table-state" colSpan="10">No hay solicitudes para mostrar</td>
								</tr>
							) : visibleSolicitudes.map((solicitud) => (
								<tr key={solicitud.id}>
									<td>{getValue(solicitud.id)}</td>
									<td className="request-title-cell">{getValue(solicitud.titulo)}</td>
									<td>{getValue(solicitud.categoria)}</td>
									<td>{getValue(solicitud.subcategoria)}</td>
									<td>
										<span className={`request-badge priority-${normalize(solicitud.prioridad)}`}>
											{getValue(solicitud.prioridad)}
										</span>
									</td>
									<td>
										<span className={`request-badge status-${statusClass(solicitud.estado)}`}>
											{getValue(solicitud.estado)}
										</span>
									</td>
									<td>{getValue(solicitud.solicitanteNombre || solicitud.solicitanteId)}</td>
									<td>{getValue(solicitud.tecnicoNombre || solicitud.tecnicoId)}</td>
									<td>{solicitud.createdAt ? new Date(solicitud.createdAt).toLocaleDateString('es-BO') : '-'}</td>
									<td>
										<button className="request-action-button" type="button" aria-label={`Acciones para solicitud ${solicitud.id}`}>
											<FaEllipsisV aria-hidden="true" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<footer className="requests-pagination">
					<span>
						Mostrando {visibleSolicitudes.length} de {solicitudes.length} solicitudes
					</span>
					{totalPages > 0 && (
						<nav aria-label="Paginación de solicitudes">
							<button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>
								Anterior
							</button>
							{pageNumbers.map((page) => (
								<button
									className={page === currentPage ? 'active' : ''}
									key={page}
									type="button"
									onClick={() => setCurrentPage(page)}
								>
									{page}
								</button>
							))}
							<button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>
								Siguiente
							</button>
						</nav>
					)}
				</footer>
			</section>
		</main>
	);
};

export default SolicitudesRecibidas;
