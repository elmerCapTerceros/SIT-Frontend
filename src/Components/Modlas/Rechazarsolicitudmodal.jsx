import { useEffect, useState } from 'react';
import './ModalesSolicitud.css';

const MIN_CARACTERES = 10;
const MAX_CARACTERES = 500;

const RechazarSolicitudModal = ({ open, loading = false, error = '', onCancel, onConfirm }) => {
	const [motivo, setMotivo] = useState('');
	const [intentoEnvio, setIntentoEnvio] = useState(false);

	// Cada vez que se abre, el formulario empieza limpio.
	useEffect(() => {
		if (open) {
			setMotivo('');
			setIntentoEnvio(false);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return undefined;
		const alPresionar = (event) => {
			if (event.key === 'Escape' && !loading) onCancel();
		};
		window.addEventListener('keydown', alPresionar);
		return () => window.removeEventListener('keydown', alPresionar);
	}, [open, loading, onCancel]);

	if (!open) return null;

	const motivoLimpio = motivo.trim();
	const motivoInvalido = motivoLimpio.length < MIN_CARACTERES;
	const mostrarErrorMotivo = intentoEnvio && motivoInvalido;

	const enviar = (event) => {
		event.preventDefault();
		setIntentoEnvio(true);
		if (motivoInvalido || loading) return;
		onConfirm(motivoLimpio);
	};

	return (
		<div className="msol-fondo" onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}>
			<form
				className="msol-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="rechazar-titulo"
				aria-describedby="rechazar-descripcion"
				onSubmit={enviar}
				noValidate
			>
				<h2 id="rechazar-titulo">Rechazar solicitud</h2>
				<p id="rechazar-descripcion">
					El funcionario verá este motivo. Explica con claridad por qué no se puede atender.
				</p>

				<label className="msol-campo" htmlFor="motivo-rechazo">
					Motivo del rechazo
					<textarea
						id="motivo-rechazo"
						value={motivo}
						onChange={(e) => setMotivo(e.target.value)}
						maxLength={MAX_CARACTERES}
						rows={5}
						placeholder="Ejemplo: El equipo no pertenece al inventario de la Gobernación."
						aria-invalid={mostrarErrorMotivo}
						aria-describedby="motivo-ayuda"
						disabled={loading}
						autoFocus
					/>
				</label>
				<div className="msol-campo-pie" id="motivo-ayuda">
					<span className={mostrarErrorMotivo ? 'msol-texto-error' : ''}>
						{mostrarErrorMotivo
							? `Escribe al menos ${MIN_CARACTERES} caracteres.`
							: `Mínimo ${MIN_CARACTERES} caracteres.`}
					</span>
					<span>{motivo.length}/{MAX_CARACTERES}</span>
				</div>

				{error && <p className="msol-error" role="alert">{error}</p>}

				<div className="msol-botones">
					<button className="msol-btn msol-btn-neutro" type="button" onClick={onCancel} disabled={loading}>
						Cancelar
					</button>
					<button className="msol-btn msol-btn-peligro" type="submit" disabled={loading}>
						{loading ? 'Rechazando...' : 'Rechazar solicitud'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default RechazarSolicitudModal;