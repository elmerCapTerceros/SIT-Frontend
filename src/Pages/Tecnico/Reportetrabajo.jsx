import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClipboardCheck, FaFilePdf, FaUndo } from 'react-icons/fa';
import { ESTADOS_FINALES, TIPOS_EQUIPO, generarReportePdf } from '../../utils/Reportetrabajopdf';
import './Reportetrabajo.css';

const API_URL = 'http://localhost:8080/api';

// Escudos del encabezado del PDF (opcional). Importa tus imágenes y colócalas aquí:
//   import escudoBolivia from '../../assets/escudo-bolivia.png';
//   const LOGOS = { izquierda: escudoBolivia, centro: escudoGobernacion, derecha: logoCochabamba };
const LOGOS = { izquierda: null, centro: null, derecha: null };

// Claves de localStorage donde se busca el nombre del técnico. Ajústalas a tu login.
const CLAVES_NOMBRE_SESION = ['nombreCompleto', 'userName', 'nombre', 'userLogin'];
const SOLO_LETRAS_Y_ESPACIOS = /^[\p{L} ]*$/u;
const SOLO_DIGITOS = /^\d*$/;
const INVENTARIO_VALIDO = /^[\p{L}\p{N} /-]*$/u;
const CAMPOS_SOLO_LETRAS = new Set([
	'unidad',
	'solicitante',
	'tipoEquipoOtro',
	'tecnicoNombre',
	'funcionarioNombre',
]);

const pad = (n) => String(n).padStart(2, '0');
const aFechaISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const aHora = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const nombreTecnicoSesion = () => {
	for (const clave of CLAVES_NOMBRE_SESION) {
		const valor = localStorage.getItem(clave);
		if (valor) return valor;
	}
	return '';
};

const detectarTipoEquipo = (solicitud) => {
	const texto = `${solicitud.categoria ?? ''} ${solicitud.titulo ?? ''} ${solicitud.descripcion ?? ''}`.toLowerCase();
	if (/laptop|notebook|port[áa]til/.test(texto)) return 'LAPTOP';
	if (/impresora|printer|t[óo]ner/.test(texto)) return 'IMPRESORA';
	if (/\b(pc|cpu|computadora|computador|escritorio|monitor)\b/.test(texto)) return 'PC';
	return '';
};

// Todo lo que ya se sabe de la solicitud se carga aquí; el resto queda para el técnico.
const construirInicial = (solicitud) => {
	const ahora = new Date();
	return {
		numeroFormulario: String(solicitud.codigo ?? '').replace(/\D/g, ''),
		fecha: aFechaISO(ahora),
		hora: aHora(ahora),
		unidad: solicitud.area ?? '',
		solicitante: solicitud.solicitanteNombre ?? '',
		tipoEquipo: detectarTipoEquipo(solicitud),
		tipoEquipoOtro: '',
		inventario: solicitud.numeroInventario ?? solicitud.inventario ?? '',
		problema: [solicitud.titulo, solicitud.descripcion].filter(Boolean).join('\n'),
		diagnostico: '',
		trabajo: '',
		estadoFinal: '',
		observaciones: '',
		tecnicoNombre: nombreTecnicoSesion(),
		funcionarioNombre: solicitud.solicitanteNombre ?? '',
	};
};

const Cabecera = () => (
	<header className="at-header">
		<span className="at-header-icon" aria-hidden="true"><FaClipboardCheck /></span>
		<div>
			<h1>Reporte de trabajo</h1>
			<p>Formulario de atención y soporte técnico de la solicitud concluida.</p>
		</div>
	</header>
);

const Campo = ({ id, etiqueta, autocompletado, requerido, error, ancho, grupo, children }) => {
	const Etiqueta = grupo ? 'span' : 'label';
	return (
		<div className={`rt-campo${ancho ? ' rt-campo-ancho' : ''}${error ? ' tiene-error' : ''}${autocompletado ? ' es-auto' : ''}`}>
			<div className="rt-campo-cab">
				<Etiqueta id={grupo ? `${id}-etq` : undefined} htmlFor={grupo ? undefined : id}>
					{etiqueta}
					{requerido && <span className="rt-req" aria-hidden="true"> *</span>}
				</Etiqueta>
				{autocompletado && <span className="rt-origen">Autocompletado</span>}
			</div>
			{grupo ? (
				<div role="radiogroup" aria-labelledby={`${id}-etq`} className="rt-chips">{children}</div>
			) : (
				children
			)}
			{error && <p className="rt-error" role="alert">{error}</p>}
		</div>
	);
};

const Opciones = ({ nombre, opciones, valor, onChange }) =>
	opciones.map(([clave, texto]) => (
		<label key={clave} className={`rt-chip${valor === clave ? ' activo' : ''}`}>
			<input
				type="radio"
				name={nombre}
				value={clave}
				checked={valor === clave}
				onChange={() => onChange(clave)}
			/>
			<span>{texto}</span>
		</label>
	));

const ReporteTrabajo = () => {
	const { state } = useLocation();
	const navigate = useNavigate();
	const solicitud = state?.solicitud ?? null;
	const estadoSolicitud = solicitud?.estado?.toUpperCase();
	const clave = solicitud ? `reporteTrabajo:${solicitud.id}` : null;

	const inicial = useMemo(() => (solicitud ? construirInicial(solicitud) : null), [solicitud]);

	// El borrador se guarda en el navegador para no perder lo escrito si se recarga la página.
	const [datos, setDatos] = useState(() => {
		if (!inicial) return null;
		try {
			const guardado = localStorage.getItem(clave);
			if (guardado) return { ...inicial, ...JSON.parse(guardado) };
		} catch {
			/* se ignora un borrador dañado */
		}
		return inicial;
	});
	const [errores, setErrores] = useState({});
	const [generando, setGenerando] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [cargandoReporte, setCargandoReporte] = useState(true);
	const [reporteGuardado, setReporteGuardado] = useState(null);
	const [errorGuardado, setErrorGuardado] = useState('');
	const [errorPdf, setErrorPdf] = useState('');

	useEffect(() => {
		if (!clave || !datos || reporteGuardado) return;
		try {
			localStorage.setItem(clave, JSON.stringify(datos));
		} catch {
			/* sin espacio o almacenamiento bloqueado: no es crítico */
		}
	}, [clave, datos, reporteGuardado]);

	useEffect(() => {
		if (!solicitud?.id) {
			return undefined;
		}
		const controller = new AbortController();
		const cargarReporteGuardado = async () => {
			try {
				const token = localStorage.getItem('token');
				if (!token) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
				const response = await fetch(`${API_URL}/reportes/mis-reportes`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal,
				});
				if (!response.ok) throw new Error(`No se pudo comprobar si ya existe un reporte (HTTP ${response.status}).`);
				const reportes = await response.json();
				if (!Array.isArray(reportes)) throw new Error('La respuesta de reportes tiene un formato inesperado.');
				const guardado = reportes.find((reporte) => String(reporte.solicitudId) === String(solicitud.id));
				if (guardado && !controller.signal.aborted) {
					setReporteGuardado(guardado);
					setDatos({
						...construirInicial(solicitud),
						numeroFormulario: guardado.numeroFormulario ?? '',
						fecha: guardado.fechaAtencion ?? '',
						hora: guardado.horaAtencion?.slice(0, 5) ?? '',
						unidad: guardado.unidad ?? '',
						solicitante: guardado.solicitante ?? '',
						tipoEquipo: guardado.tipoEquipo ?? '',
						tipoEquipoOtro: guardado.tipoEquipoOtro ?? '',
						inventario: guardado.numeroInventario ?? '',
						problema: guardado.problema ?? '',
						diagnostico: guardado.diagnostico ?? '',
						trabajo: guardado.trabajoRealizado ?? '',
						estadoFinal: guardado.estadoFinal ?? '',
						observaciones: guardado.observacion ?? '',
						tecnicoNombre: guardado.tecnicoNombre ?? '',
						funcionarioNombre: guardado.funcionarioNombre ?? '',
					});
					localStorage.removeItem(clave);
				}
			} catch (requestError) {
				if (!controller.signal.aborted) {
					setErrorGuardado(requestError.message || 'No se pudo comprobar el reporte guardado.');
				}
			} finally {
				if (!controller.signal.aborted) setCargandoReporte(false);
			}
		};
		cargarReporteGuardado();
		return () => controller.abort();
	}, [solicitud, clave]);

	if (!solicitud) {
		return (
			<div className="at-page report-page">
				<Cabecera />
				<div className="rt-aviso rt-aviso-error" role="alert">
					<p>No se seleccionó ninguna solicitud. Abre el detalle de una solicitud concluida y entra desde ahí.</p>
					<Link to="/asignacion-tecnico">Volver a Mis solicitudes asignadas</Link>
				</div>
			</div>
		);
	}

	if (estadoSolicitud !== 'CONCLUIDA') {
		return (
			<div className="at-page report-page">
				<Cabecera />
				<div className="rt-aviso rt-aviso-error" role="alert">
					<p>El reporte de trabajo se llena cuando la solicitud está <strong>Concluida</strong>.</p>
					<Link to="/asignacion-tecnico">Volver a Mis solicitudes asignadas</Link>
				</div>
			</div>
		);
	}

	const cambiar = (campo) => (event) => {
		const valorOriginal = event.target.value;
		const valor = campo === 'numeroFormulario'
			? valorOriginal.replace(/\D/g, '')
			: campo === 'inventario'
				? valorOriginal.replace(/[^\p{L}\p{N} /-]/gu, '')
				: CAMPOS_SOLO_LETRAS.has(campo)
					? valorOriginal.replace(/[^\p{L} ]/gu, '')
					: valorOriginal;
		setDatos((actual) => ({ ...actual, [campo]: valor }));
		setErrores((actual) => ({ ...actual, [campo]: undefined }));
	};
	const elegir = (campo) => (valor) => {
		setDatos((actual) => ({ ...actual, [campo]: valor }));
		setErrores((actual) => ({ ...actual, [campo]: undefined }));
	};
	const auto = (campo) => Boolean(inicial[campo]);

	const validar = () => {
		const e = {};
		if (datos.numeroFormulario && !SOLO_DIGITOS.test(datos.numeroFormulario)) {
			e.numeroFormulario = 'El número de formulario solo puede contener dígitos.';
		}
		for (const campo of CAMPOS_SOLO_LETRAS) {
			if (datos[campo].trim() && !SOLO_LETRAS_Y_ESPACIOS.test(datos[campo].trim())) {
				e[campo] = 'Este campo solo puede contener letras y espacios.';
			}
		}
		if (datos.inventario.trim() && !INVENTARIO_VALIDO.test(datos.inventario.trim())) {
			e.inventario = 'Use solo letras, números, espacios, guion o barra.';
		}
		if (!datos.fecha) e.fecha = 'Indica la fecha de la atención.';
		if (!datos.hora) e.hora = 'Indica la hora de la atención.';
		if (!datos.tipoEquipo) e.tipoEquipo = 'Selecciona el tipo de equipo.';
		if (datos.tipoEquipo === 'OTRO' && !datos.tipoEquipoOtro.trim()) {
			e.tipoEquipoOtro = 'Escribe qué tipo de equipo es.';
		}
		if (!datos.diagnostico.trim()) e.diagnostico = 'Describe el diagnóstico.';
		if (!datos.trabajo.trim()) e.trabajo = 'Describe el trabajo realizado o la solución.';
		if (!datos.estadoFinal) e.estadoFinal = 'Selecciona el estado final.';
		if (!datos.tecnicoNombre.trim()) e.tecnicoNombre = 'Escribe el nombre del técnico responsable.';
		return e;
	};

	const guardarReporte = async (event) => {
		event.preventDefault();
		setErrorGuardado('');
		setErrorPdf('');
		const encontrados = validar();
		setErrores(encontrados);
		if (Object.keys(encontrados).length > 0) {
			requestAnimationFrame(() => {
				document.querySelector('.rt-campo.tiene-error input, .rt-campo.tiene-error textarea')?.focus();
			});
			return;
		}

		setGuardando(true);
		try {
			const token = localStorage.getItem('token');
			if (!token) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
			const response = await fetch(`${API_URL}/reportes`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					asignacionTecnicoId: solicitud.asignacionTecnicoId ?? null,
					solicitudId: solicitud.id,
					numeroFormulario: datos.numeroFormulario,
					fechaAtencion: datos.fecha || null,
					horaAtencion: datos.hora || null,
					unidad: datos.unidad,
					solicitante: datos.solicitante,
					numeroInventario: datos.inventario,
					tipoEquipo: datos.tipoEquipo,
					tipoEquipoOtro: datos.tipoEquipo === 'OTRO' ? datos.tipoEquipoOtro : '',
					problema: datos.problema,
					diagnostico: datos.diagnostico,
					trabajoRealizado: datos.trabajo,
					estadoFinal: datos.estadoFinal,
					observacion: datos.observaciones,
					tecnicoNombre: datos.tecnicoNombre,
					funcionarioNombre: datos.funcionarioNombre,
				}),
			});
			if (!response.ok) {
				const result = await response.json().catch(() => null);
				const detallesCampos = result?.fields
					? Object.entries(result.fields).map(([campo, mensaje]) => `${campo}: ${mensaje}`).join(' ')
					: '';
				throw new Error(
					[ result?.message, detallesCampos ].filter(Boolean).join(' ') ||
					`No se pudo guardar el reporte (HTTP ${response.status}).`
				);
			}
			const guardado = await response.json();
			setReporteGuardado(guardado);
			localStorage.removeItem(clave);
		} catch (requestError) {
			setErrorGuardado(requestError.message || 'No se pudo guardar el reporte.');
			setGuardando(false);
			return;
		}

		setGuardando(false);
		navigate('/Reportes');
	};

	const descargarPdf = async () => {
		setErrorPdf('');
		setGenerando(true);
		try {
			await generarReportePdf(datos, { logos: LOGOS });
		} catch (pdfError) {
			console.error(pdfError);
			setErrorPdf('No se pudo generar el PDF. Intenta de nuevo.');
		} finally {
			setGenerando(false);
		}
	};

	const restablecer = () => {
		if (!window.confirm('Se borrará lo que escribiste y se volverán a cargar los datos de la solicitud. ¿Continuar?')) return;
		setDatos(construirInicial(solicitud));
		setErrores({});
	};

	return (
		<div className="at-page report-page">
			<Cabecera />

			<form className="rt" onSubmit={guardarReporte} noValidate>
				<div className="rt-aviso" role="note">
					<p>
						<strong>Solicitud #{solicitud.codigo ?? solicitud.id}</strong>: los datos que ya tenemos
						vienen cargados y marcados como <span className="rt-origen">Autocompletado</span>. Puedes
						corregirlos. Completa lo que falta; los campos con * son obligatorios.
					</p>
				</div>

				{cargandoReporte && <p className="rt-aviso" role="status">Comprobando si ya existe un reporte guardado...</p>}
				{errorGuardado && <p className="rt-aviso rt-aviso-error" role="alert">{errorGuardado}</p>}
				{reporteGuardado && (
					<div className="rt-aviso rt-aviso-exito" role="status">
						<FaCheckCircle aria-hidden="true" />
						<span>Este reporte ya está guardado. Puedes consultar todos sus datos en Mis reportes y descargar el PDF nuevamente.</span>
						<Link to="/Reportes">Ver mis reportes</Link>
					</div>
				)}

				{/* ---------- 1. Datos de la atención ---------- */}
				<fieldset className="rt-seccion" disabled={cargandoReporte || Boolean(reporteGuardado)}>
					<legend>1. Datos de la atención</legend>
					<div className="rt-grid">
						<Campo id="rt-numero" etiqueta="N.º de formulario (STI-)" autocompletado={auto('numeroFormulario')} error={errores.numeroFormulario}>
							<input id="rt-numero" type="text" inputMode="numeric" value={datos.numeroFormulario} onChange={cambiar('numeroFormulario')} />
						</Campo>
						<Campo id="rt-fecha" etiqueta="Fecha" requerido autocompletado error={errores.fecha}>
							<input id="rt-fecha" type="date" value={datos.fecha} onChange={cambiar('fecha')} />
						</Campo>
						<Campo id="rt-hora" etiqueta="Hora" requerido autocompletado error={errores.hora}>
							<input id="rt-hora" type="time" value={datos.hora} onChange={cambiar('hora')} />
						</Campo>
						<Campo id="rt-unidad" etiqueta="Unidad / Dirección" autocompletado={auto('unidad')} error={errores.unidad}>
							<input id="rt-unidad" type="text" value={datos.unidad} onChange={cambiar('unidad')} />
						</Campo>
						<Campo id="rt-solicitante" etiqueta="Solicitante" autocompletado={auto('solicitante')} error={errores.solicitante}>
							<input id="rt-solicitante" type="text" value={datos.solicitante} onChange={cambiar('solicitante')} />
						</Campo>
						<Campo id="rt-inventario" etiqueta="N.º de inventario" autocompletado={auto('inventario')} error={errores.inventario}>
							<input id="rt-inventario" type="text" value={datos.inventario} onChange={cambiar('inventario')} placeholder="Ejemplo: GADC-10234" />
						</Campo>
						<Campo id="rt-tipo" etiqueta="Tipo de equipo" requerido grupo ancho autocompletado={auto('tipoEquipo')} error={errores.tipoEquipo}>
							<Opciones nombre="tipo-equipo" opciones={TIPOS_EQUIPO} valor={datos.tipoEquipo} onChange={elegir('tipoEquipo')} />
						</Campo>
						{datos.tipoEquipo === 'OTRO' && (
							<Campo id="rt-tipo-otro" etiqueta="¿Qué tipo de equipo es?" requerido ancho error={errores.tipoEquipoOtro}>
								<input id="rt-tipo-otro" type="text" value={datos.tipoEquipoOtro} onChange={cambiar('tipoEquipoOtro')} placeholder="Ejemplo: Proyector" />
							</Campo>
						)}
					</div>
				</fieldset>

				{/* ---------- 2. Trabajo técnico ---------- */}
				<fieldset className="rt-seccion" disabled={cargandoReporte || Boolean(reporteGuardado)}>
					<legend>2. Trabajo técnico</legend>
					<div className="rt-grid">
						<Campo id="rt-problema" etiqueta="Problema reportado" ancho autocompletado={auto('problema')}>
							<textarea id="rt-problema" rows={3} value={datos.problema} onChange={cambiar('problema')} />
						</Campo>
						<Campo id="rt-diagnostico" etiqueta="Diagnóstico" requerido ancho error={errores.diagnostico}>
							<textarea id="rt-diagnostico" rows={3} value={datos.diagnostico} onChange={cambiar('diagnostico')} placeholder="¿Cuál era la causa del problema?" />
						</Campo>
						<Campo id="rt-trabajo" etiqueta="Trabajo realizado / Solución" requerido ancho error={errores.trabajo}>
							<textarea id="rt-trabajo" rows={4} value={datos.trabajo} onChange={cambiar('trabajo')} placeholder="¿Qué hiciste para resolverlo?" />
						</Campo>
						<Campo id="rt-estado" etiqueta="Estado final" requerido grupo ancho error={errores.estadoFinal}>
							<Opciones nombre="estado-final" opciones={ESTADOS_FINALES} valor={datos.estadoFinal} onChange={elegir('estadoFinal')} />
						</Campo>
						<Campo id="rt-observaciones" etiqueta="Observaciones" ancho>
							<textarea id="rt-observaciones" rows={3} value={datos.observaciones} onChange={cambiar('observaciones')} />
						</Campo>
					</div>
				</fieldset>

				{/* ---------- 3. Responsables ---------- */}
				<fieldset className="rt-seccion" disabled={cargandoReporte || Boolean(reporteGuardado)}>
					<legend>3. Responsables</legend>
					<div className="rt-grid">
						<Campo id="rt-tecnico" etiqueta="Técnico responsable" requerido autocompletado={auto('tecnicoNombre')} error={errores.tecnicoNombre}>
							<input id="rt-tecnico" type="text" value={datos.tecnicoNombre} onChange={cambiar('tecnicoNombre')} />
						</Campo>
						<Campo id="rt-funcionario" etiqueta="Funcionario solicitante" autocompletado={auto('funcionarioNombre')} error={errores.funcionarioNombre}>
							<input id="rt-funcionario" type="text" value={datos.funcionarioNombre} onChange={cambiar('funcionarioNombre')} />
						</Campo>
					</div>
					<p className="rt-nota">Las firmas se hacen a mano: el PDF deja el espacio en blanco para firmar después de imprimir.</p>
				</fieldset>

				{errorPdf && <p className="rt-aviso rt-aviso-error" role="alert">{errorPdf}</p>}

				<div className="rt-barra">
					 {!reporteGuardado && (
        <button
            className="rt-btn rt-btn-neutro"
            type="button"
            onClick={restablecer}
            disabled={generando || guardando}
        >
            <FaUndo aria-hidden="true" /> Restablecer datos
        </button>
    )}

    {reporteGuardado ? (
        <button
            className="rt-btn rt-btn-primario"
            type="button"
            onClick={descargarPdf}
            disabled={generando || cargandoReporte}
        >
            <FaFilePdf aria-hidden="true" /> {generando ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
    ) : (
        <button
            className="rt-btn rt-btn-primario"
            type="submit"
            disabled={generando || guardando || cargandoReporte}
        >
            <FaCheckCircle aria-hidden="true" /> {guardando ? 'Guardando reporte...' : 'Guardar reporte'}
        </button>
    )}
					{/*<Link className="rt-volver" to="/asignacion-tecnico">Volver a mis solicitudes</Link>
					<Link className="rt-volver" to="/Reportes">Mis reportes</Link>*/}
				</div>
				<p className="rt-nota">
					Al guardar, el reporte queda asociado a la solicitud y estará disponible en Mis reportes.
					Desde allí podrás generar el PDF si lo necesitas.
				</p>
			</form>
		</div>
	);
};

export default ReporteTrabajo;
