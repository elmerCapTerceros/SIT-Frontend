import { useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaCopy, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { formatDate, formatId, getValue, humanize, normalize, statusClass, toSearchText } from '../../utils/Solicitudesutils';
import './Solicitudmodal.css';

const PRIORIDADES = [
	{ key: 'alta', label: 'Alta' },
	{ key: 'media', label: 'Media' },
	{ key: 'baja', label: 'Baja' },
];

const getInitials = (name = '') =>
	name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || '?';

const FOCUSABLE = 'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SolicitudModal = ({ solicitud, tecnicos, onClose, onSave }) => {
	const dialogRef = useRef(null);
	const fullId = formatId(solicitud.id);

	const initialForm = useMemo(() => {
		const prioridad = normalize(solicitud.prioridad);
		return {
			prioridad: PRIORIDADES.some((p) => p.key === prioridad) ? prioridad : '',
			tecnicoId: solicitud.tecnicoId ? String(solicitud.tecnicoId) : '',
		};
	}, [solicitud]);

	const [form, setForm] = useState(initialForm);
	const [techQuery, setTechQuery] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [copied, setCopied] = useState(false);
	const [confirmDiscard, setConfirmDiscard] = useState(false);
	const dirty = Object.keys(initialForm).some((key) => form[key] !== initialForm[key]);

	const filteredTecnicos = useMemo(() => {
		const query = toSearchText(techQuery.trim());
		return query ? tecnicos.filter((t) => toSearchText(t.nombre).includes(query)) : tecnicos;
	}, [tecnicos, techQuery]);

	/* Cierre: si hay cambios sin guardar, se pide confirmación dentro del propio modal */
	const requestClose = () => {
		if (saving) return;
		if (dirty) setConfirmDiscard(true);
		else onClose();
	};

	/* Foco, bloqueo de scroll y restauración del foco al cerrar */
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
			requestClose();
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

	const update = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setConfirmDiscard(false);
		setError('');
	};

	const copyId = async () => {
		try {
			await navigator.clipboard.writeText(fullId);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			/* Si el navegador bloquea el portapapeles, el ID sigue visible y seleccionable */
		}
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!dirty || saving || !form.prioridad || !form.tecnicoId) return;
		const tecnico = tecnicos.find((t) => t.id === form.tecnicoId);
		setSaving(true);
		setError('');
		try {
			await onSave({
				payload: {
					prioridad: form.prioridad.toUpperCase(),
					tecnicoId: Number(form.tecnicoId),
				},
				local: {
					prioridad: PRIORIDADES.find((p) => p.key === form.prioridad)?.label || solicitud.prioridad,
					tecnicoId: Number(form.tecnicoId),
					tecnicoNombre: tecnico?.nombre || null,
				},
			});
		} catch (saveError) {
			setError(saveError.message || 'No se pudo guardar. Intenta de nuevo.');
			setSaving(false);
		}
	};

	return (
		<div
			className="sm-overlay"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) requestClose();
			}}
		>
			<form
				ref={dialogRef}
				className="sm-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="sm-title"
				tabIndex={-1}
				onKeyDown={handleKeyDown}
				onSubmit={handleSubmit}
			>
				{/* Cabecera */}
				<header className="sm-header">
					<div className="sm-header-main">
						<div className="sm-id-row">
							<span className="sm-id-label">ID</span>
							<code className="sm-id" title={fullId}>{fullId}</code>
							<button type="button" className="sm-copy" onClick={copyId} aria-label="Copiar ID">
								{copied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />}
								<span>{copied ? 'Copiado' : 'Copiar'}</span>
							</button>
						</div>
						<h2 id="sm-title">{getValue(solicitud.titulo)}</h2>
					</div>
					<button type="button" className="sm-close" onClick={requestClose} aria-label="Cerrar">
						<FaTimes aria-hidden="true" />
					</button>
				</header>

				{/* Cuerpo */}
				<div className="sm-body">
					<dl className="sm-meta">
						<div>
							<dt>Estado</dt>
							<dd>
								<span className={`request-badge status-${statusClass(solicitud.estado)}`}>
									{humanize(solicitud.estado)}
								</span>
							</dd>
						</div>
						<div>
							<dt>Solicitante</dt>
							<dd>{getValue(solicitud.solicitanteNombre || solicitud.solicitanteId)}</dd>
						</div>
						<div>
							<dt>Fecha</dt>
							<dd>{formatDate(solicitud.createdAt)}</dd>
						</div>
					</dl>

					{solicitud.descripcion && <p className="sm-description">{solicitud.descripcion}</p>}

					{/* Prioridad */}
					<section className="sm-section" aria-labelledby="sm-prioridad">
						<h3 id="sm-prioridad">Prioridad</h3>
						<div className="sm-priority" role="radiogroup" aria-labelledby="sm-prioridad">
							{PRIORIDADES.map((prioridad) => {
								const selected = form.prioridad === prioridad.key;
								return (
									<button
										key={prioridad.key}
										type="button"
										role="radio"
										aria-checked={selected}
										className={`sm-priority-option priority-option-${prioridad.key} ${selected ? 'is-selected' : ''}`}
										onClick={() => update('prioridad', prioridad.key)}
									>
										<span className="sm-priority-dot" aria-hidden="true" />
										{prioridad.label}
									</button>
								);
							})}
						</div>
						{!form.prioridad && <p className="sm-hint">Esta solicitud aún no tiene prioridad definida.</p>}
					</section>

					{/* Técnico */}
					<section className="sm-section" aria-labelledby="sm-tecnico">
						<h3 id="sm-tecnico">Asignar técnico</h3>

						{tecnicos.length > 6 && (
							<div className="sm-search">
								<FaSearch aria-hidden="true" />
								<input
									type="search"
									value={techQuery}
									onChange={(e) => setTechQuery(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') e.preventDefault();
									}}
									placeholder="Buscar técnico…"
									aria-label="Buscar técnico"
								/>
							</div>
						)}

						<div className="sm-tech-list" role="radiogroup" aria-labelledby="sm-tecnico">
							{filteredTecnicos.map((tecnico) => {
								const selected = form.tecnicoId === tecnico.id;
								return (
									<button
										key={tecnico.id}
										type="button"
										role="radio"
										aria-checked={selected}
										className={`sm-tech ${selected ? 'is-selected' : ''}`}
										onClick={() => update('tecnicoId', tecnico.id)}
									>
										<span className="sm-avatar" aria-hidden="true">{getInitials(tecnico.nombre)}</span>
										<span className="sm-tech-info">
											<strong>{tecnico.nombre}</strong>
											<small>
												{tecnico.activas === 0
													? 'Sin solicitudes activas'
													: `${tecnico.activas} ${tecnico.activas === 1 ? 'solicitud activa' : 'solicitudes activas'}`}
											</small>
										</span>
										<span className="sm-tech-check" aria-hidden="true"><FaCheck /></span>
									</button>
								);
							})}

							{filteredTecnicos.length === 0 && tecnicos.length > 0 && (
								<p className="sm-hint sm-tech-empty">Ningún técnico coincide con “{techQuery}”.</p>
							)}
							{tecnicos.length === 0 && (
								<p className="sm-hint sm-tech-empty">No hay técnicos disponibles para asignar.</p>
							)}
						</div>
					</section>
				</div>

				{/* Pie */}
				<footer className="sm-footer">
					{error && <p className="sm-error" role="alert">{error}</p>}

					{confirmDiscard ? (
						<div className="sm-discard" role="alert">
							<span>Tienes cambios sin guardar.</span>
							<div className="sm-actions">
								<button type="button" className="sm-btn sm-btn-ghost" onClick={() => setConfirmDiscard(false)}>
									Seguir editando
								</button>
								<button type="button" className="sm-btn sm-btn-danger" onClick={onClose}>
									Descartar
								</button>
							</div>
						</div>
					) : (
						<div className="sm-actions">
							<button type="button" className="sm-btn sm-btn-ghost" onClick={requestClose} disabled={saving}>
								Cancelar
							</button>
							<button type="submit" className="sm-btn sm-btn-primary" disabled={!dirty || saving || !form.prioridad || !form.tecnicoId}>
								{saving ? (
									<>
										<FaSpinner className="sm-spin" aria-hidden="true" /> Guardando…
									</>
								) : (
									'Guardar cambios'
								)}
							</button>
						</div>
					)}
				</footer>
			</form>
		</div>
	);
};

export default SolicitudModal;