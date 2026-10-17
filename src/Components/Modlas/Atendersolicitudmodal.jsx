import { useEffect } from 'react';
import './ModalesSolicitud.css';

const AtenderSolicitudModal = ({ open, loading = false, error = '', onCancel, onConfirm }) => {
	useEffect(() => {
		if (!open) return undefined;
		const alPresionar = (event) => {
			if (event.key === 'Escape' && !loading) onCancel();
		};
		window.addEventListener('keydown', alPresionar);
		return () => window.removeEventListener('keydown', alPresionar);
	}, [open, loading, onCancel]);

	if (!open) return null;

	return (
		<div className="msol-fondo" onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}>
			<div
				className="msol-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="atender-titulo"
				aria-describedby="atender-descripcion"
			>
				<h2 id="atender-titulo">¿Atender esta solicitud?</h2>
				<p id="atender-descripcion">
					La solicitud pasará de <strong>Pendiente</strong> a <strong>En proceso</strong> y
					quedará registrada como atendida por ti.
				</p>

				{error && <p className="msol-error" role="alert">{error}</p>}

				<div className="msol-botones">
					<button className="msol-btn msol-btn-neutro" type="button" onClick={onCancel} disabled={loading}>
						Cancelar
					</button>
					<button
						className="msol-btn msol-btn-primario"
						type="button"
						onClick={onConfirm}
						disabled={loading}
						autoFocus
					>
						{loading ? 'Atendiendo...' : 'Sí, atender'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AtenderSolicitudModal;