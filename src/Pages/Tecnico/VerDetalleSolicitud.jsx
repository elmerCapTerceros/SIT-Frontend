import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
	FaClipboardList,
	FaUserTie,
	FaTools,
	FaCheck,
	FaTimes,
	FaExclamationCircle,
	FaFilePdf,
	FaArrowLeft,
} from 'react-icons/fa';
import ConfirmarCambioEstado from '../../Components/Modlas/ConfirmarCambioEstado';
import AtenderSolicitudModal from '../../Components/Modlas/Atendersolicitudmodal';
import RechazarSolicitudModal from '../../Components/Modlas/Rechazarsolicitudmodal';
import { formatDate, formatId, getValue, humanize } from '../../utils/Solicitudesutils';
import './VerDetalleSolicitud.css';

const API_URL = 'http://localhost:8080/api';

// Flujo normal de una solicitud. RECHAZADA es una salida aparte (solo desde PENDIENTE).
const FLUJO = ['PENDIENTE', 'EN_PROCESO', 'CONCLUIDA'];

// Estados a los que se puede pasar desde cada estado.
const TRANSICIONES = {
	PENDIENTE: ['EN_PROCESO'],
	EN_PROCESO: ['CONCLUIDA'],
};

// Endpoint que ejecuta cada cambio de estado.
const ACCION_POR_ESTADO = {
	EN_PROCESO: 'atender',
	CONCLUIDA: 'concluir',
};

const MENSAJE_AYUDA = {
	PENDIENTE: 'Nadie ha trabajado en esta solicitud todavía. Puedes atenderla o rechazarla indicando el motivo.',
	EN_PROCESO: 'Ya estás atendiendo esta solicitud. Cuando termines el trabajo, cámbiala a Concluida y llena el reporte de trabajo.',
	CONCLUIDA: 'Esta solicitud ya fue concluida. Si aún no lo hiciste, llena el reporte de trabajo y descárgalo en PDF.',
	RECHAZADA: 'Esta solicitud fue rechazada. No se pueden hacer más cambios.',
};

const SIN_REGISTRO = 'No registrado';

const Dato = ({ etiqueta, children, ancho }) => (
	<div className={ancho ? 'vd-dato vd-dato-ancho' : 'vd-dato'}>
		<dt>{etiqueta}</dt>
		<dd>{children}</dd>
	</div>
);

const VerDetalleSolicitud = () => {
	const { state } = useLocation();
	const navigate = useNavigate();
	const solicitudSeleccionada = state?.solicitud;
	const solicitudId = solicitudSeleccionada?.id;

	const [solicitud, setSolicitud] = useState(null);
	const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
	const [modalAbierto, setModalAbierto] = useState(null); // 'atender' | 'rechazar' | 'estado' | null
	const [enviando, setEnviando] = useState(false);
	const [errorAccion, setErrorAccion] = useState('');
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
			if (!solicitudId) {
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

				const encontrada = data.find((item) => String(item.id) === String(solicitudId));
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
	}, [solicitudId]);

	const estadoActual = solicitud?.estado?.toUpperCase() ?? '';
	const estadosPermitidos = TRANSICIONES[estadoActual] ?? [];
	const esPendiente = estadoActual === 'PENDIENTE';
	const estaRechazada = estadoActual === 'RECHAZADA';
	const sinAcciones = estadosPermitidos.length === 0;
	const cambioSeleccionado =
		estadosPermitidos.includes(estadoSeleccionado) ? estadoSeleccionado : null;

	const cerrarModal = () => {
		if (enviando) return;
		setModalAbierto(null);
		setErrorAccion('');
		setEstadoSeleccionado(estadoActual);
	};

	const abrirModal = (nombre) => {
		setErrorAccion('');
		setModalAbierto(nombre);
	};

	// Llama al backend y actualiza la pantalla con la solicitud devuelta.
	const ejecutarAccion = async (accion, body) => {
		setEnviando(true);
		setErrorAccion('');
		try {
			const token = localStorage.getItem('token');
			const response = await fetch(`${API_URL}/solicitudes/${solicitud.id}/${accion}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: body ? JSON.stringify(body) : undefined,
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(
					data?.message || `No se pudo completar la acción (HTTP ${response.status}).`
				);
			}
			const actualizada = await response.json();
			const completa = { ...solicitud, ...actualizada };
			setSolicitud(completa);
			setEstadoSeleccionado(actualizada.estado?.toUpperCase() ?? '');
			setModalAbierto(null);
			// Al concluir, el técnico debe llenar el reporte de trabajo.
			if (accion === 'concluir') {
				navigate('/reporte-trabajo', { state: { solicitud: completa } });
			}
		} catch (requestError) {
			setErrorAccion(requestError.message || 'No se pudo completar la acción.');
		} finally {
			setEnviando(false);
		}
	};

	const confirmarAtender = () => ejecutarAccion('atender');
	const confirmarRechazo = (motivo) => ejecutarAccion('rechazar', { motivo });
	const confirmarCambioEstado = () => {
		if (!cambioSeleccionado) return;
		ejecutarAccion(ACCION_POR_ESTADO[cambioSeleccionado]);
	};

	const indiceActual = FLUJO.indexOf(estadoActual);

	return (
		<div className="at-page report-page">
			<Link className="vd-volver" to="/asignacion-tecnico">
						<FaArrowLeft aria-hidden="true" /> Volver a solicitudes
			</Link>
			<header className="at-header vd-header">
				<span className="at-header-icon" aria-hidden="true"><FaClipboardList /></span>
				<div>
					<h1>Detalle de la solicitud</h1>
					<p>Revisa los datos del funcionario y de la solicitud, y decide cómo continuar.</p>
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
				<div className="vd">
					{/* ---------- Encabezado de la solicitud ---------- */}
					<section className="vd-resumen" aria-label="Resumen de la solicitud">
						<div className="vd-resumen-texto">
							<p className="vd-codigo">Solicitud #{formatId(solicitud.codigo ?? solicitud.id)}</p>
							<h2>{getValue(solicitud.titulo)}</h2>
						</div>
						<div className="vd-resumen-lado">
							<span className={`vd-badge vd-estado-${estadoActual.toLowerCase()}`}>
								{humanize(estadoActual)}
							</span>
						</div>
					</section>

					{/* ---------- Progreso ---------- */}
					{!estaRechazada ? (
						<ol className="vd-progreso" aria-label="Progreso de la solicitud">
							{FLUJO.map((estado, indice) => {
								const clase =
									indice < indiceActual ? 'hecho' : indice === indiceActual ? 'actual' : 'pendiente';
								return (
									<li
										key={estado}
										className={`vd-paso vd-paso-${clase}`}
										aria-current={clase === 'actual' ? 'step' : undefined}
									>
										<span className="vd-paso-marca" aria-hidden="true">
											{clase === 'hecho' ? <FaCheck /> : indice + 1}
										</span>
										<span>{humanize(estado)}</span>
									</li>
								);
							})}
						</ol>
					) : (
						<div className="vd-rechazo" role="status">
							<FaExclamationCircle aria-hidden="true" />
							<div>
								<strong>Solicitud rechazada</strong>
								<p>{getValue(solicitud.motivoRechazo)}</p>
							</div>
						</div>
					)}

					{/* ---------- Datos: funcionario y solicitud técnica ---------- */}
					<div className="vd-columnas">
						<section className="vd-tarjeta vd-funcionario" aria-labelledby="vd-titulo-funcionario">
							<header>
								<span className="vd-tarjeta-icono" aria-hidden="true"><FaUserTie /></span>
								<div>
									<h3 id="vd-titulo-funcionario">Datos del funcionario</h3>
									<p>Quién hizo la solicitud y dónde encontrarlo.</p>
								</div>
							</header>
							<dl>
								<Dato etiqueta="Nombre">{getValue(solicitud.solicitanteNombre)}</Dato>
								<Dato etiqueta="Cargo">{solicitud.solicitanteCargo || SIN_REGISTRO}</Dato>
								<Dato etiqueta="Área o unidad">{getValue(solicitud.area)}</Dato>
								<Dato etiqueta="Ubicación de la oficina">{getValue(solicitud.ubicacion)}</Dato>
								<Dato etiqueta="Teléfono o interno">{solicitud.solicitanteTelefono || SIN_REGISTRO}</Dato>
							</dl>
						</section>

						<section className="vd-tarjeta vd-tecnica" aria-labelledby="vd-titulo-tecnica">
							<header>
								<span className="vd-tarjeta-icono" aria-hidden="true"><FaTools /></span>
								<div>
									<h3 id="vd-titulo-tecnica">Solicitud técnica</h3>
									<p>Qué se pide y con qué urgencia.</p>
								</div>
							</header>
							<dl>
								<Dato etiqueta="Categoría">{getValue(solicitud.categoria)}</Dato>
								<Dato etiqueta="Prioridad">
									<span className={`vd-prioridad vd-prioridad-${(solicitud.prioridad ?? '').toLowerCase()}`}>
										{humanize(solicitud.prioridad)}
									</span>
								</Dato>
								<Dato etiqueta="Fecha de creación">{formatDate(solicitud.createdAt)}</Dato>
								<Dato etiqueta="Descripción del problema" ancho>
									<p className="vd-descripcion">{getValue(solicitud.descripcion)}</p>
								</Dato>
							</dl>
						</section>
					</div>

					{/* ---------- Acciones ---------- */}
					<section className="vd-acciones" aria-labelledby="vd-titulo-acciones">
						<h3 id="vd-titulo-acciones">¿Qué quieres hacer con esta solicitud?</h3>
						<p className="vd-ayuda">{MENSAJE_AYUDA[estadoActual]}</p>

						{esPendiente && (
							<div className="vd-botones">
								<button
									className="vd-btn vd-btn-primario"
									type="button"
									onClick={() => abrirModal('atender')}
								>
									<FaCheck aria-hidden="true" /> Atender solicitud
								</button>
								<button
									className="vd-btn vd-btn-peligro"
									type="button"
									onClick={() => abrirModal('rechazar')}
								>
									<FaTimes aria-hidden="true" /> Rechazar solicitud
								</button>
							</div>
						)}

						{estadoActual === 'CONCLUIDA' && (
							<div className="vd-botones">
								<Link
									className="vd-btn vd-btn-primario"
									to="/reporte-trabajo"
									state={{ solicitud }}
								>
									<FaFilePdf aria-hidden="true" /> Llenar reporte de trabajo
								</Link>
							</div>
						)}

						{!sinAcciones && (
							<fieldset className="vd-estados">
								<legend>Cambiar estado manualmente</legend>
								<div className="vd-estados-opciones" role="radiogroup">
									{FLUJO.map((estado) => {
										const esActual = estado === estadoActual;
										const disponible = estadosPermitidos.includes(estado);
										return (
											<label
												key={estado}
												className={`vd-estado-opcion${esActual ? ' es-actual' : ''}${!disponible && !esActual ? ' no-disponible' : ''}`}
											>
												<input
													type="radio"
													name="estado-solicitud"
													value={estado}
													checked={estadoSeleccionado === estado}
													disabled={!disponible && !esActual}
													onChange={() => setEstadoSeleccionado(estado)}
												/>
												<span>
													{humanize(estado)}
													{esActual && <small>Estado actual</small>}
												</span>
											</label>
										);
									})}
								</div>
								<button
									className="vd-btn vd-btn-secundario"
									type="button"
									disabled={!cambioSeleccionado}
									onClick={() => abrirModal('estado')}
								>
									Cambiar estado
								</button>
							</fieldset>
						)}
					</section>
				</div>
			)}

			<AtenderSolicitudModal
				open={modalAbierto === 'atender'}
				loading={enviando}
				error={errorAccion}
				onCancel={cerrarModal}
				onConfirm={confirmarAtender}
			/>

			<RechazarSolicitudModal
				open={modalAbierto === 'rechazar'}
				loading={enviando}
				error={errorAccion}
				onCancel={cerrarModal}
				onConfirm={confirmarRechazo}
			/>

			<ConfirmarCambioEstado
				open={modalAbierto === 'estado'}
				estado={cambioSeleccionado}
				loading={enviando}
				error={errorAccion}
				onCancel={cerrarModal}
				onConfirm={confirmarCambioEstado}
			/>
		</div>
	);
};

export default VerDetalleSolicitud;