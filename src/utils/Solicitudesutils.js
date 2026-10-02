/* Helpers compartidos entre la tabla y el modal de solicitudes */

export const getValue = (value) => value || '-';

export const normalize = (value) =>
	value?.toString().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-') || '';

export const statusClass = (value) => (normalize(value) === 'concluida' ? 'resuelta' : normalize(value));

export const humanize = (value) => {
	if (!value) return '-';
	const text = value.toString().replaceAll('_', ' ').toLowerCase();
	return text.charAt(0).toUpperCase() + text.slice(1);
};

/* Devuelve el ID completo: numérico -> SOL-0047, cualquier otro formato (UUID, código) -> tal cual */
export const formatId = (id) => {
	if (id === null || id === undefined || id === '') return '-';
	const text = String(id);
	return /^\d+$/.test(text) ? `SOL-${text.padStart(4, '0')}` : text;
};

export const formatDate = (value) => {
	if (!value) return '-';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-BO');
};

export const formatDateTime = (value) => {
	if (!value) return '-';
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? '-'
		: date.toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
};

export const toSearchText = (value) =>
	(value ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();