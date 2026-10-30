export const TITULO_SOLO_LETRAS_Y_ESPACIOS = /^[\p{L} ]+$/u;

export const limpiarTituloSolicitud = (value) => value.replace(/[^\p{L} ]/gu, '');
