import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaClipboardList } from 'react-icons/fa';
import ConfirmarCambioEstado from '../../Components/Modlas/ConfirmarCambioEstado';
import { formatDate, formatId, getValue, humanize } from '../../utils/Solicitudesutils';
import './VerDetalleSolicitud.css';

const API_URL = 'http://localhost:8080/api';

const SIGUIENTE_ESTADO = {
	PENDIENTE: 'EN_PROCESO',
};

const OPCIONES_ESTADO = ['PENDIENTE', 'EN_PROCESO'];

const VerDetalleSolicitud = () => {
	const { state } = useLocation();
	const solicitudSeleccionada = state?.solicitud;
	const [solicitud, setSolicitud] = useState(null);
	const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
	const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const controller = new AbortController();

		const cargarDetalle = async () => {
			const tecnicoId = localStorage.getItem('userId');
			const token = localStorage.getItem('token');
			if (!tecnicoId) {
				setError('No se encontró el ID del técnico en la sesión. Vuelve a iniciar sesión.');
				setLoading(false);
				return;
			}
			if (!token) {
				setError('La sesión expiró. Vuelve a iniciar sesión.');
				setLoading(false);
				return;
			}
			if (!solicitudSeleccionada?.id) {
				setError('No se seleccionó una solicitud. Vuelve a Mis solicitudes asignadas y elige una.');
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(`${API_URL}/asignaciones/tecnico/${tecnicoId}/solicitudes`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error(`No se pudo cargar el detalle de la solicitud (HTTP ${response.status}).`);
				}

				const data = await response.json();
				if (!Array.isArray(data)) {
					throw new Error('La respuesta de solicitudes tiene un formato inesperado.');
				}
				if (controller.signal.aborted) return;

				const encontrada = data.find(
					(item) => String(item.id) === String(solicitudSeleccionada.id)
				);
				if (!encontrada) {
					throw new Error('La solicitud ya no está asignada a este técnico o no existe.');
				}
				setEstadoSeleccionado(encontrada.estado?.toUpperCase() ?? '');
				setSolicitud(encontrada);
			} catch (requestError) {
				if (!controller.signal.aborted) {
					setError(requestError.message || 'No se pudo cargar el detalle de la solicitud.');
				}
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		};

		cargarDetalle();
		return () => controller.abort();
	}, [solicitudSeleccionada]);

	const estadoActual = solicitud?.estado?.toUpperCase();
	const siguienteEstado = estadoActual ? SIGUIENTE_ESTADO[estadoActual] ?? null : null;
	const solicitudConcluida = estadoActual === 'CONCLUIDA';

	const confirmarCambioEstado = () => {
		if (!solicitud || !siguienteEstado || estadoSeleccionado !== siguienteEstado) return;
		setSolicitud((actual) => ({ ...actual, estado: siguienteEstado }));
		setEstadoSeleccionado(siguienteEstado);
		setConfirmacionAbierta(false);
	};

	return (
		<div className="at-page report-page">
			<header className="at-header">
				<span className="at-header-icon" aria-hidden="true"><FaClipboardList /></span>
				<div>
					<h1>Detalle de la solicitud</h1>
					<p>Información de la solicitud asignada al técnico.</p>
				</div>
			</header>

			{loading && <p role="status">Cargando detalle de la solicitud...</p>}

			{error && (
				<div className="detalle-error" role="alert">
					<p>{error}</p>
					<Link to="/asignacion-tecnico">Volver a Mis solicitudes asignadas</Link>
				</div>
			)}

			{!loading && !error && solicitud && (
				<section className="informacion-detalle" aria-label="Información de la solicitud">
					<div className="detalle-heading">
						<div>
							<p className="detalle-codigo">Solicitud #{formatId(solicitud.codigo ?? solicitud.id)}</p>
							<h2>{getValue(solicitud.titulo)}</h2>
						</div>
						<div className="detalle-heading-actions">
							<Link className="detalle-volver" to="/asignacion-tecnico">Volver a solicitudes</Link>
							<div className="estados-solicitud" role="radiogroup" aria-label="Estado de la solicitud">
								{OPCIONES_ESTADO.map((estado) => {
									const bloqueado = solicitudConcluida ||
										(estadoActual === 'EN_PROCESO' && estado === 'PENDIENTE') ||
										(estadoActual === estado);
									return (
										<label className="estado-opcion" key={estado}>
											<input
												type="radio"
												name="estado-solicitud"
												value={estado}
												checked={estadoSeleccionado === estado}
												disabled={bloqueado}
												onChange={() => setEstadoSeleccionado(estado)}
											/>
											<span>{humanize(estado)}</span>
										</label>
									);
								})}
								{siguienteEstado && (
									<button
										className="detalle-btn detalle-btn-primary"
										type="button"
										disabled={estadoSeleccionado !== siguienteEstado}
										onClick={() => setConfirmacionAbierta(true)}
									>
										Cambiar estado
									</button>
								)}
							</div>
							{solicitudConcluida && (
								<span className="estado-finalizado">Solicitud concluida</span>
							)}
						</div>
					</div>

					<dl className="detalle-lista">
						<div><dt>Estado</dt><dd>{humanize(solicitud.estado)}</dd></div>
						<div><dt>Prioridad</dt><dd>{humanize(solicitud.prioridad)}</dd></div>
						<div><dt>Categoría</dt><dd>{getValue(solicitud.categoria)}</dd></div>
						<div><dt>Área solicitante</dt><dd>{getValue(solicitud.area)}</dd></div>
						<div><dt>Solicitante</dt><dd>{getValue(solicitud.solicitanteNombre)}</dd></div>
						<div><dt>Fecha de creación</dt><dd>{formatDate(solicitud.createdAt)}</dd></div>
						<div className="detalle-descripcion"><dt>Descripción</dt><dd>{getValue(solicitud.descripcion)}</dd></div>
					</dl>

					<div className="detalle-acciones">
						<button className="detalle-btn detalle-btn-primary" type="button">Atender</button>
						<button className="detalle-btn detalle-btn-danger" type="button">Rechazar</button>
					</div>
				</section>
			)}

			<ConfirmarCambioEstado
				open={confirmacionAbierta}
				estado={siguienteEstado}
				loading={false}
				error=""
				onCancel={() => setConfirmacionAbierta(false)}
				onConfirm={confirmarCambioEstado}
			/>
		</div>
	);
};

export default VerDetalleSolicitud;
